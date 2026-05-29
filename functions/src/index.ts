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

  const transValid = await verifyFapshiTransaction(transId);
  if (!transValid.valid || transValid.status !== "SUCCESSFUL") {
    console.error("Fapshi webhook: invalid transId or status", transId, transValid.status);
    res.status(401).send("invalid_transaction");
    return;
  }

  const db = admin.firestore();
  const userSnap = await db.doc(`users/${uid}`).get();
  if (!userSnap.exists) {
    console.error("Fapshi webhook: user not found", uid);
    res.status(404).send("user_not_found");
    return;
  }

  const userData = userSnap.data();
  if (userData?.plan === planId) {
    res.status(200).send("ok");
    return;
  }

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

  res.status(200).send("ok");
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