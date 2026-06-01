import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as axios from "axios";
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

const FAPSHI_API_KEY = functions.config().fapshi?.api_key || process.env.FAPSHI_API_KEY || "";
const FAPSHI_BASE_URL = functions.config().fapshi?.base_url || process.env.FAPSHI_BASE_URL || "https://api.fapshi.com";
const FAPSHI_WEBHOOK_SECRET = functions.config().fapshi?.webhook_secret || process.env.FAPSHI_WEBHOOK_SECRET || "";
const APP_URL = functions.config().app?.url || process.env.APP_URL || "https://vflpredictor.cm";

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
    const response = await axios.default.get(`${FAPSHI_BASE_URL}/payment-status/${transId}`, {
      headers: { apiuser: FAPSHI_API_KEY },
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

  await Promise.all([
    db.doc(`subscriptions/${uid}`).set({
      plan: planId,
      status: "active",
      fapshiTransactionId: transId,
      startDate: now,
      endDate: admin.firestore.Timestamp.fromDate(endDate),
      amountPaid: amount,
      currency: "XAF",
    }),
    db.doc(`users/${uid}`).update({
      plan: planId,
      predictionsLimit: PLAN_LIMITS[planId] ?? PLAN_LIMITS.monthly,
      predictionsUsed: 0,
    }),
  ]);

  console.log(`Activated ${planId} for user ${uid}`);
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
  console.warn(`Queued failed payment for retry: ${entry.transId}`);
}

export const initiatePayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { planId, phone } = data;
  const uid = context.auth.uid;

  if (!planId || !["daily", "weekly", "monthly", "elite"].includes(planId)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid plan ID");
  }

  const price = PLAN_PRICES[planId];
  const externalId = `${uid}:${planId}:${Date.now()}`;

  try {
    const response = await axios.default.post(
      `${FAPSHI_BASE_URL}/initiate-pay`,
      {
        amount: price,
        phone: phone || undefined,
        redirectUrl: `${APP_URL}/payment-callback?transId=${externalId}`,
        userId: uid,
        externalId,
        message: `Vantage AI ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
      },
      {
        headers: {
          apiuser: FAPSHI_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      transId: response.data.transId,
      link: response.data.link,
    };
  } catch (error: any) {
    console.error("Fapshi payment initiation failed:", error.message);
    throw new functions.https.HttpsError("internal", "Payment initiation failed");
  }
});

export const onPredictionCreated = functions.firestore
  .document("users/{uid}/predictions/{predId}")
  .onCreate(async (snap, context) => {
    const { uid } = context.params;
    const db = admin.firestore();

    const userRef = db.doc(`users/${uid}`);
    const userSnap = await userRef.get();

    if (!userSnap.exists) return;

    const userData = userSnap.data();
    const used = userData?.predictionsUsed || 0;
    const limit = userData?.predictionsLimit || 5;

    if (used >= limit) {
      await snap.ref.delete();
      console.log(`Prediction deleted for user ${uid}: limit exceeded (${used}/${limit})`);
      return;
    }

    await userRef.update({
      predictionsUsed: admin.firestore.FieldValue.increment(1),
    });
    console.log(`Incremented predictions for user ${uid}: ${used + 1}/${limit}`);
  });

export const fapshiWebhook = functions.https.onRequest(async (req, res) => {
  const signature = req.headers["x-fapshi-signature"] as string;
  const rawBody = JSON.stringify(req.body);
  const { transId, status, amount, externalId } = req.body;

  if (!verifyWebhookSignature(rawBody, signature, FAPSHI_WEBHOOK_SECRET)) {
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
    console.error("Fapshi webhook: malformed externalId", externalId);
    res.status(400).send("bad_request");
    return;
  }

  const [uid, planId] = parts;

  const expectedPrice = PLAN_PRICES[planId];
  if (expectedPrice && amount < expectedPrice) {
    console.error("Fapshi webhook: amount mismatch", amount, "expected", expectedPrice);
    res.status(400).send("amount_mismatch");
    return;
  }

  try {
    const transValid = await verifyFapshiTransaction(transId);
    if (!transValid.valid || transValid.status !== "SUCCESSFUL") {
      console.error("Fapshi webhook: invalid transId or status", transId, transValid.status);
      await queueForRetry({ uid, planId, transId, externalId, amount });
      res.status(202).send("queued_for_retry");
      return;
    }

    await activateSubscription(uid, planId, transId, amount);
    res.status(200).send("ok");
  } catch (err) {
    console.error("Fapshi webhook: activation failed", err);
    await queueForRetry({ uid, planId, transId, externalId, amount });
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
        console.warn(`Dropping retry for ${entry.transId} after 5 attempts`);
        continue;
      }

      try {
        const transValid = await verifyFapshiTransaction(entry.transId);
        if (transValid.valid && transValid.status === "SUCCESSFUL") {
          await activateSubscription(entry.uid, entry.planId, entry.transId, entry.amount);
          batch.update(docSnap.ref, { status: "completed" });
          console.log(`Retry succeeded for ${entry.transId}`);
        } else {
          batch.update(docSnap.ref, {
            attempts: admin.firestore.FieldValue.increment(1),
            lastAttemptAt: now,
            status: "pending",
          });
        }
      } catch (err) {
        console.error(`Retry attempt failed for ${entry.transId}:`, err);
        batch.update(docSnap.ref, {
          attempts: admin.firestore.FieldValue.increment(1),
          lastAttemptAt: now,
        });
      }
    }

    await batch.commit();
    console.log(`Processed ${stale.size} retry queue entries`);
  });

export const resetMonthlyPredictions = functions.pubsub
  .schedule("0 0 1 * *")
  .timeZone("Africa/Douala")
  .onRun(async () => {
    const db = admin.firestore();
    const snap = await db.collection("users").get();
    const batch = db.batch();
    snap.docs.forEach((d) => batch.update(d.ref, { predictionsUsed: 0 }));
    await batch.commit();
    console.log(`Reset predictions for ${snap.size} users`);
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
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
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
  const { message, stack, errorId, component } = data;
  const db = admin.firestore();
  await db.collection("errors").add({
    message,
    stack,
    errorId,
    component,
    uid: context.auth.uid,
    timestamp: admin.firestore.Timestamp.now(),
    userAgent: context.rawRequest.headers["user-agent"],
  });
  return { logged: true };
});