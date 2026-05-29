import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MatchPrediction } from "@/features/predictor/engine/predictor";

interface User {
  uid: string;
  email: string;
  displayName: string;
  plan: "free" | "daily" | "weekly" | "monthly" | "elite";
  predictionsUsed: number;
  predictionsLimit: number;
}

interface PredictorState {
  selectedLeague: string;
  homeTeamId: string;
  awayTeamId: string;
  homeForm: { result: "W" | "D" | "L"; goals: number; conceded: number }[];
  awayForm: { result: "W" | "D" | "L"; goals: number; conceded: number }[];
  matchdayPos: number;
  oddsHome: string;
  oddsX: string;
  oddsAway: string;
  lastResult: MatchPrediction | null;
}

interface AppStore {
  user: User | null;
  authLoading: boolean;
  setUser: (u: User | null) => void;
  setLoading: (v: boolean) => void;

  predictor: PredictorState;
  updatePredictor: (patch: Partial<PredictorState>) => void;
  resetPredictor: () => void;

  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  paymentModalOpen: boolean;
  setPaymentModalOpen: (v: boolean) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      user: null,
      authLoading: true,
      setUser: (user) => set({ user }),
      setLoading: (authLoading) => set({ authLoading }),

      predictor: {
        selectedLeague: "English League",
        homeTeamId: "MNC",
        awayTeamId: "LIV",
        homeForm: [],
        awayForm: [],
        matchdayPos: 1,
        oddsHome: "",
        oddsX: "",
        oddsAway: "",
        lastResult: null,
      },
      updatePredictor: (patch) =>
        set((s) => ({ predictor: { ...s.predictor, ...patch } })),
      resetPredictor: () =>
        set((s) => ({
          predictor: {
            ...s.predictor,
            homeForm: [],
            awayForm: [],
            lastResult: null,
            oddsHome: "",
            oddsX: "",
            oddsAway: "",
          },
        })),

      sidebarOpen: false,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      paymentModalOpen: false,
      setPaymentModalOpen: (paymentModalOpen) => set({ paymentModalOpen }),
    }),
    {
      name: "vantage-ai-store",
      partialize: (s) => ({ predictor: s.predictor }),
    }
  )
);