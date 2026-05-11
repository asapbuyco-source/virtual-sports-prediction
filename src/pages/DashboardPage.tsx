import { Link } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { PLAN_LIMITS } from "@/utils/constants";
import { DashboardSkeleton } from "@/components/skeleton/DashboardSkeleton";
import { PredictionHistoryCard } from "@/features/history/PredictionHistoryCard";
import { usePredictionHistory } from "@/features/history/usePredictionHistory";

export default function DashboardPage() {
  const { user } = useAppStore();
  const { data: predictions, isLoading } = usePredictionHistory();

  if (!user) return null;

  const limit = PLAN_LIMITS[user.plan ?? "free"] ?? 5;
  const used = user.predictionsUsed ?? 0;
  const remaining = limit - used;
  const valueBets = predictions?.filter(p => p.result.valueRating === "HIGH").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Welcome back, {user.displayName?.split(" ")[0] ?? "Bettor"}</h1>
          <p className="text-gray-400 text-sm">{user.email}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-green-400">{remaining}</p>
          <p className="text-xs text-gray-500">predictions left</p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Predictions", value: user.predictionsUsed, icon: "🎯" },
          { label: "Plan", value: user.plan?.toUpperCase() ?? "FREE", icon: "💎" },
          { label: "Leagues", value: "6", icon: "🌍" },
          { label: "Value Bets", value: valueBets, icon: "💰" },
        ].map((m, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <p className="text-xs text-gray-400 mb-1">{m.label}</p>
            <div className="flex items-center gap-2">
              <span className="text-xl">{m.icon}</span>
              <span className="text-xl font-extrabold text-white">{m.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick action */}
      <div className="bg-gradient-to-r from-green-900/30 to-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
        <h3 className="text-lg font-bold text-white mb-2">Ready to analyze?</h3>
        <p className="text-gray-400 text-sm mb-4">Run a new prediction with the AI engine</p>
        <Link
          to="/predictor"
          className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold"
        >
          🔮 Start New Prediction
        </Link>
      </div>

      {/* Recent predictions */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Recent Predictions</h2>
          <Link to="/history" className="text-xs text-green-400 hover:underline">View All →</Link>
        </div>
        {isLoading ? (
          <DashboardSkeleton />
        ) : predictions && predictions.length > 0 ? (
          <div className="space-y-3">
            {predictions.slice(0, 5).map((p) => (
              <PredictionHistoryCard key={p.id} pred={p} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-6">No predictions yet. Start analyzing!</p>
        )}
      </div>
    </div>
  );
}