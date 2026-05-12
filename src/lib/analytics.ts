import { logEvent } from "firebase/analytics";
import { analytics } from "./firebase";

export const track = {
  predictionRun: (league: string, homeTeam: string, awayTeam: string) => {
    if (!analytics) return;
    logEvent(analytics, "prediction_run", { league, homeTeam, awayTeam });
  },

  predictionSaved: (confidence: number) => {
    if (!analytics) return;
    logEvent(analytics, "prediction_saved", { confidence });
  },

  paymentInitiated: (plan: string, amount: number) => {
    if (!analytics) return;
    logEvent(analytics, "payment_initiated", { plan, amount });
  },

  paymentCompleted: (plan: string) => {
    if (!analytics) return;
    logEvent(analytics, "payment_completed", { plan });
  },

  signUp: (method: "email" | "google" | "phone") => {
    if (!analytics) return;
    logEvent(analytics, "sign_up", { method });
  },

  planUpgradePromptShown: (trigger: string) => {
    if (!analytics) return;
    logEvent(analytics, "upgrade_prompt_shown", { trigger });
  },
};