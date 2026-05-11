export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    currency: "XAF",
    predictionsPerMonth: 5,
    features: [
      "5 predictions per month",
      "3 leagues (EPL, La Liga, Serie A)",
      "Basic tips (1X2, Over/Under)",
      "No history saved",
    ],
    highlight: false,
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 2500,
    currency: "XAF",
    predictionsPerMonth: 50,
    features: [
      "50 predictions per month",
      "All 6 leagues",
      "Full tips + value bet detection",
      "Prediction history (30 days)",
      "BTTS & scoreline predictions",
      "Form builder enabled",
    ],
    highlight: true,
  },
  elite: {
    id: "elite",
    name: "Elite",
    price: 6000,
    currency: "XAF",
    predictionsPerMonth: Infinity,
    features: [
      "Unlimited predictions",
      "All leagues + custom teams",
      "Full history forever",
      "Priority AI signals",
      "Export to PDF",
      "Early access features",
    ],
    highlight: false,
  },
};

export const PLAN_DURATIONS: Record<string, number> = {
  pro: 30,
  elite: 30,
};

export const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  pro: 50,
  elite: 999999,
};

export const APP_NAME = "Vantage AI";
export const APP_TAGLINE = "BetPawa Official Virtual Sports AI";