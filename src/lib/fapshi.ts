import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

export interface FapshiInitPayload {
  amount: number;
  phone?: string;
  redirectUrl: string;
  userId: string;
  externalId: string;
  message: string;
  email?: string;
}

export interface PaymentInitResult {
  transId: string;
  link: string;
}

export async function initiateFapshiPayment(payload: FapshiInitPayload): Promise<PaymentInitResult> {
  const result = await httpsCallable<{ planId: string; phone: string }, PaymentInitResult>(
    functions,
    "initiatePayment"
  )({ planId: payload.externalId.split(":")[1] || "", phone: payload.phone || "" });
  return result.data;
}