import { logEvent } from "firebase/analytics";
import { analytics } from "./firebase";

export const track = {
  predictionRun: (league: string, homeTeam: string, awayTeam: string) =>
    logEvent(analytics, "prediction_run", { league, homeTeam, awayTeam }),

  predictionSaved: (confidence: number) =>
    logEvent(analytics, "prediction_saved", { confidence }),

  paymentInitiated: (plan: string, amount: number) =>
    logEvent(analytics, "payment_initiated", { plan, amount }),

  paymentCompleted: (plan: string) =>
    logEvent(analytics, "payment_completed", { plan }),

  signUp: (method: "email" | "google" | "phone") =>
    logEvent(analytics, "sign_up", { method }),

  planUpgradePromptShown: (trigger: string) =>
    logEvent(analytics, "upgrade_prompt_shown", { trigger }),
};