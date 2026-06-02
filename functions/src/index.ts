import functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import * as crypto from "crypto";

admin.initializeApp();

const PLAN_DURATIONS: Record<string, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  elite: 30,
};

const PLAN_PRICES: Record<string, number> = {
  daily: 350,
  weekly: 1500,
  monthly: 3000,
  elite: 6000,
};

const PLAN_LIMITS: Record<string, number> = {
  daily: 10,
  weekly: 30,
  monthly: 100,
  elite: 999999,
};

const getFapshiConfig = () => {
  const cfg = functions.config();
  return {
    apiKey: cfg.fapshi?.api_key || process.env.FAPSHI_API_KEY || "",
    baseUrl: cfg.fapshi?.base_url || process.env.FAPSHI_BASE_URL || "https://api.fapshi.com",
    webhookSecret: cfg.fapshi?.webhook_secret || process.env.FAPSHI_WEBHOOK_SECRET || "",
  };
};

const getAppConfig = () => {
  const cfg = functions.config();
  return {
    url: cfg.app?.url || process.env.APP_URL || "https://vflpredictor.cm",
  };
};

interface RetryQueueEntry {
  uid: string;
  planId: string;
  transId: string;
  externalId: string;
  amount: number;
  attempts: number;
  createdAt: admin.firestore.Timestamp;
  lastAttemptAt: admin.firestore.Timestamp;
  status: "pending" | "completed" | "failed";
}

async function verifyFapshiTransaction(transId: string): Promise<{ valid: boolean; status: string; amount: number }> {
  try {
    const cfg = getFapshiConfig();
    const response = await axios.get(`${cfg.baseUrl}/payment-status/${transId}`, {
      headers: { apiuser: cfg.apiKey },
    });
    return {
      valid: true,
      status: response.data?.status || "UNKNOWN",
      amount: response.data?.amount || 0,
    };
  } catch {
    return { valid: false, status: "UNKNOWN", amount: 0 };
  }
}

function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  if (!secret) {
    console.error("FAPSHI_WEBHOOK_SECRET not configured — rejecting all webhooks");
    return false;
  }
  try {
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature || "", "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

async function activateSubscription(
  uid: string,
  planId: string,
  transId: string,
  amount: number
): Promise<void> {
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + (PLAN_DURATIONS[planId] ?? 30));

  await db.runTransaction(async (tx) => {
    const subRef = db.doc(`subscriptions/${uid}`);
    const subSnap = await tx.get(subRef);

    if (subSnap.exists && subSnap.data()?.fapshiTransactionId === transId) {
      console.log(`Duplicate webhook ignored`);
      return;
    }

    tx.set(subRef, {
      plan: planId,
      status: "active",
      fapshiTransactionId: transId,
      startDate: now,
      endDate: admin.firestore.Timestamp.fromDate(endDate),
      amountPaid: amount,
      currency: "XAF",
    });

    tx.update(db.doc(`users/${uid}`), {
      plan: planId,
      predictionsLimit: PLAN_LIMITS[planId] ?? PLAN_LIMITS.monthly,
      predictionsUsed: 0,
    });
  });

  console.log(`Activated ${planId} for user [uid]`);
}

async function queueForRetry(entry: Omit<RetryQueueEntry, "attempts" | "createdAt" | "lastAttemptAt" | "status">): Promise<void> {
  const db = admin.firestore();
  await db.collection("payments/retryQueue/entries").add({
    ...entry,
    attempts: 0,
    createdAt: admin.firestore.Timestamp.now(),
    lastAttemptAt: admin.firestore.Timestamp.now(),
    status: "pending",
  });
  console.warn(`Queued failed payment for retry`);
}

export const initiatePayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { planId, phone } = data as { planId: string; phone?: string };
  const uid = context.auth.uid;

  if (!planId || !["daily", "weekly", "monthly", "elite"].includes(planId)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid plan ID");
  }

  if (phone && !/^\d{8,9}$/.test(phone)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid phone number format");
  }

  const price = PLAN_PRICES[planId];
  const externalId = `${uid}:${planId}:${Date.now()}`;
  const cfg = getFapshiConfig();
  const appCfg = getAppConfig();

  try {
    const response = await axios.post(
      `${cfg.baseUrl}/initiate-pay`,
      {
        amount: price,
        phone: phone || undefined,
        redirectUrl: `${appCfg.url}/payment-callback?transId=${externalId}`,
        userId: uid,
        externalId,
        message: `Vantage AI ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
      },
      {
        headers: {
          apiuser: cfg.apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      transId: response.data.transId,
      link: response.data.link,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Fapshi payment initiation failed:", msg);
    throw new functions.https.HttpsError("internal", "Payment initiation failed");
  }
});

export const onPredictionCreated = functions.firestore
  .document("users/{uid}/predictions/{predId}")
  .onCreate(async (snap, context) => {
    const { uid } = context.params;
    const db = admin.firestore();
    const userRef = db.doc(`users/${uid}`);

    await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) return;

      const userData = userSnap.data();
      const used = userData?.predictionsUsed || 0;
      const limit = userData?.predictionsLimit || 5;

      if (used >= limit) {
        tx.delete(snap.ref);
        console.log(`Prediction deleted: limit exceeded (${used}/${limit})`);
        return;
      }

      tx.update(userRef, {
        predictionsUsed: admin.firestore.FieldValue.increment(1),
      });
      console.log(`Incremented predictions: ${used + 1}/${limit}`);
    });
  });

export const fapshiWebhook = functions.https.onRequest(async (req, res) => {
  const signature = req.headers["x-fapshi-signature"] as string;
  const rawBody = (req as any).rawBody as string | undefined;
  const bodyString = rawBody || JSON.stringify(req.body);
  const { status, amount, externalId } = req.body;
  const cfg = getFapshiConfig();

  if (!verifyWebhookSignature(bodyString, signature, cfg.webhookSecret)) {
    console.error("Fapshi webhook: HMAC signature mismatch");
    res.status(401).send("unauthorized");
    return;
  }

  if (status !== "SUCCESSFUL") {
    res.status(200).send("ignored");
    return;
  }

  const parts = externalId.split(":");
  if (parts.length < 2) {
    console.error("Fapshi webhook: malformed externalId");
    res.status(400).send("bad_request");
    return;
  }

  const [uid, planId] = parts;

  const expectedPrice = PLAN_PRICES[planId];
  if (expectedPrice && amount < expectedPrice) {
    console.error("Fapshi webhook: amount mismatch");
    res.status(400).send("amount_mismatch");
    return;
  }

  try {
    const transValid = await verifyFapshiTransaction(req.body.transId as string);
    if (!transValid.valid || transValid.status !== "SUCCESSFUL") {
      console.error("Fapshi webhook: invalid transId or status");
      await queueForRetry({ uid, planId, transId: req.body.transId as string, externalId, amount });
      res.status(202).send("queued_for_retry");
      return;
    }

    await activateSubscription(uid, planId, req.body.transId as string, amount);
    res.status(200).send("ok");
  } catch (err) {
    console.error("Fapshi webhook: activation failed");
    await queueForRetry({ uid, planId, transId: req.body.transId as string, externalId, amount });
    res.status(202).send("queued_for_retry");
  }
});

export const retryFailedPayments = functions.pubsub
  .schedule("every 30 minutes")
  .timeZone("Africa/Douala")
  .onRun(async () => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const stale = await db
      .collection("payments/retryQueue/entries")
      .where("status", "==", "pending")
      .where("lastAttemptAt", "<", admin.firestore.Timestamp.fromDate(thirtyMinutesAgo))
      .limit(20)
      .get();

    if (stale.empty) {
      console.log("No pending payment retries");
      return;
    }

    const batch = db.batch();
    for (const docSnap of stale.docs) {
      const entry = docSnap.data() as RetryQueueEntry;

      if (entry.attempts >= 5) {
        batch.update(docSnap.ref, { status: "failed" });
        console.warn(`Dropping retry after 5 attempts`);
        continue;
      }

      try {
        const transValid = await verifyFapshiTransaction(entry.transId);
        if (transValid.valid && transValid.status === "SUCCESSFUL") {
          await activateSubscription(entry.uid, entry.planId, entry.transId, entry.amount);
          batch.update(docSnap.ref, { status: "completed" });
          console.log(`Retry succeeded`);
        } else {
          batch.update(docSnap.ref, {
            attempts: admin.firestore.FieldValue.increment(1),
            lastAttemptAt: now,
          });
        }
      } catch {
        batch.update(docSnap.ref, {
          attempts: admin.firestore.FieldValue.increment(1),
          lastAttemptAt: now,
        });
      }
    }

    await batch.commit();
    console.log(`Processed ${stale.size} retry queue entries`);
  });

export const checkExpiredSubscriptions = functions.pubsub
  .schedule("every 60 minutes")
  .timeZone("Africa/Douala")
  .onRun(async () => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    const expired = await db
      .collection("subscriptions")
      .where("status", "==", "active")
      .where("endDate", "<", now)
      .get();

    if (expired.empty) {
      console.log("No expired subscriptions");
      return;
    }

    const batch = db.batch();
    for (const docSnap of expired.docs) {
      const uid = docSnap.id;
      batch.update(docSnap.ref, { status: "expired" });
      batch.update(db.doc(`users/${uid}`), {
        plan: "free",
        predictionsLimit: 5,
      });
    }

    await batch.commit();
    console.log(`Downgraded ${expired.size} expired subscriptions`);
  });

export const resetWeeklyPredictions = functions.pubsub
  .schedule("0 0 * * 0")
  .timeZone("Africa/Douala")
  .onRun(async () => {
    const db = admin.firestore();
    const snap = await db
      .collection("users")
      .where("plan", "==", "weekly")
      .get();

    if (snap.empty) {
      console.log("No weekly plan users to reset");
      return;
    }

    const batch = db.batch();
    snap.docs.forEach((d) => batch.update(d.ref, { predictionsUsed: 0 }));
    await batch.commit();
    console.log(`Reset weekly predictions for ${snap.size} users`);
  });

export const resetMonthlyPredictions = functions.pubsub
  .schedule("0 0 1 * *")
  .timeZone("Africa/Douala")
  .onRun(async () => {
    const db = admin.firestore();
    const snap = await db
      .collection("users")
      .where("plan", "in", ["monthly", "elite", "free"])
      .get();

    const batch = db.batch();
    snap.docs.forEach((d) => batch.update(d.ref, { predictionsUsed: 0 }));
    await batch.commit();
    console.log(`Reset monthly predictions for ${snap.size} users`);
  });

export const resetDailyPredictions = functions.pubsub
  .schedule("0 0 * * *")
  .timeZone("Africa/Douala")
  .onRun(async () => {
    const db = admin.firestore();
    const snap = await db
      .collection("users")
      .where("plan", "==", "daily")
      .get();

    if (snap.empty) {
      console.log("No daily plan users to reset");
      return;
    }

    const batch = db.batch();
    snap.docs.forEach((d) => batch.update(d.ref, { predictionsUsed: 0 }));
    await batch.commit();
    console.log(`Reset daily predictions for ${snap.size} users`);
  });

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const db = admin.firestore();
  await db.doc(`users/${user.uid}`).set({
    email: user.email || "",
    displayName: user.displayName || "User",
    photoURL: user.photoURL || null,
    plan: "free",
    predictionsUsed: 0,
    predictionsLimit: 5,
    createdAt: admin.firestore.Timestamp.now(),
    lastActiveAt: admin.firestore.Timestamp.now(),
  });
});

export const logAppError = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be authenticated");
  }
  const { message, stack, errorId, component } = data as { message: string; stack?: string; errorId?: string; component?: string };

  if (!message || typeof message !== "string" || message.length > 2000) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid error message");
  }

  const db = admin.firestore();
  await db.collection("errors").add({
    message: message.substring(0, 2000),
    stack: stack?.substring(0, 5000),
    errorId: errorId || null,
    component: component || null,
    uid: context.auth.uid,
    timestamp: admin.firestore.Timestamp.now(),
    userAgent: context.rawRequest.headers["user-agent"],
  });
  return { logged: true };
});