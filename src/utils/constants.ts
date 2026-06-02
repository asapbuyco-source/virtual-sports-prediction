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
  daily: {
    id: "daily",
    name: "Daily",
    price: 350,
    currency: "XAF",
    predictionsPerMonth: 10,
    duration: 1,
    features: [
      "10 predictions per day",
      "All 6 leagues",
      "Full tips + value bet detection",
      "BTTS & scoreline predictions",
      "Same day history",
    ],
    highlight: false,
  },
  weekly: {
    id: "weekly",
    name: "Weekly",
    price: 1500,
    currency: "XAF",
    predictionsPerMonth: 30,
    duration: 7,
    features: [
      "30 predictions per week",
      "All 6 leagues",
      "Full tips + value bet detection",
      "BTTS & scoreline predictions",
      "7-day prediction history",
      "Form builder enabled",
    ],
    highlight: false,
  },
  monthly: {
    id: "monthly",
    name: "Monthly",
    price: 3000,
    currency: "XAF",
    predictionsPerMonth: 100,
    duration: 30,
    features: [
      "100 predictions per month",
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
  daily: 1,
  weekly: 7,
  monthly: 30,
  elite: 30,
};

export const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  daily: 10,
  weekly: 30,
  monthly: 100,
  elite: 999999,
};

export const APP_NAME = "Vantage AI";
export const APP_TAGLINE = "AI-Powered Virtual Sports Predictions";