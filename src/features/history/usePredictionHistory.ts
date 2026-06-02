import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  doc as firestoreDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAppStore } from "@/store/useAppStore";
import type { MatchPrediction } from "@/features/predictor/engine/predictor";

export interface SavedPrediction {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  result: MatchPrediction;
  savedAt: Date;
  matchdayPosition: number;
  notes: string | null;
}

export interface SavedPredictionInput {
  homeTeam: string;
  awayTeam: string;
  league: string;
  result: MatchPrediction;
  matchdayPosition: number;
  notes: string | null;
}

export function usePredictionHistory() {
  const { user } = useAppStore();

  return useQuery({
    queryKey: ["predictions", user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, "users", user.uid, "predictions"),
        orderBy("savedAt", "desc")
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          savedAt: data.savedAt?.toDate?.() ?? new Date(data.savedAt ?? Date.now()),
        } as SavedPrediction;
      });
    },
    enabled: !!user,
    staleTime: 30000,
  });
}

export function useSavePrediction() {
  const queryClient = useQueryClient();
  const { user, setUser } = useAppStore();

  return useMutation({
    mutationFn: async (data: SavedPredictionInput) => {
      if (!user) throw new Error("Not authenticated");
      const ref = await addDoc(collection(db, "users", user.uid, "predictions"), {
        ...data,
        savedAt: serverTimestamp(),
      });
      return ref.id;
    },
    onSuccess: async (_data, _vars, _ctx) => {
      queryClient.invalidateQueries({ queryKey: ["predictions", user?.uid] });
      if (user) {
        setUser({
          ...user,
          predictionsUsed: (user.predictionsUsed ?? 0) + 1,
        });
      }
    },
    onError: (error: Error) => {
      if (
        error.message.includes("permission") ||
        error.message.includes("denied") ||
        error.message.includes("NOT_FOUND") ||
        error.message.includes("limit")
      ) {
        throw new Error(
          "Prediction limit reached. Upgrade your plan for more predictions."
        );
      }
      throw error;
    },
  });
}

export function useSubscription() {
  const { user } = useAppStore();

  return useQuery({
    queryKey: ["subscription", user?.uid],
    queryFn: async () => {
      if (!user) return null;
      const snap = await getDoc(firestoreDoc(db, "subscriptions", user.uid));
      if (!snap.exists()) return null;
      const data = snap.data();
      return {
        ...data,
        startDate: data.startDate?.toDate?.() ?? null,
        endDate: data.endDate?.toDate?.() ?? null,
      };
    },
    enabled: !!user && user.plan !== "free",
    staleTime: 60000,
  });
}