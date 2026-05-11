import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAppStore } from "@/store/useAppStore";
import { PLAN_LIMITS } from "@/utils/constants";

export function usePlanStatus() {
  const { user } = useAppStore();

  return useQuery({
    queryKey: ["planStatus", user?.uid],
    queryFn: async () => {
      if (!user) return null;
      const snap = await getDoc(doc(db, "users", user.uid));
      return snap.data();
    },
    enabled: !!user,
    staleTime: 60000,
  });
}

export function canUsePrediction(user: any): boolean {
  if (!user) return false;
  const limit = PLAN_LIMITS[user.plan ?? "free"] ?? 5;
  return (user.predictionsUsed ?? 0) < limit;
}