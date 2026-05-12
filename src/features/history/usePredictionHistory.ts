import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, addDoc, query, orderBy, getDocs } from "firebase/firestore";
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
      return snap.docs.map(d => ({ id: d.id, ...d.data() })) as SavedPrediction[];
    },
    enabled: !!user,
  });
}

export function useSavePrediction() {
  const queryClient = useQueryClient();
  const { user } = useAppStore();

  return useMutation({
    mutationFn: async (data: SavedPredictionInput) => {
      if (!user) throw new Error("Not authenticated");
      const ref = await addDoc(collection(db, "users", user.uid, "predictions"), {
        ...data,
        savedAt: new Date(),
      });
      return ref.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predictions", user?.uid] });
    },
  });
}