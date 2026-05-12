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

  const stats = [
    { label: "Predictions", value: used, icon: "🎯", accent: "from-green-500 to-emerald-500" },
    { label: "Plan", value: user.plan?.toUpperCase() ?? "FREE", icon: "💎", accent: "from-blue-500 to-cyan-500" },
    { label: "Leagues", value: "6", icon: "🌍", accent: "from-purple-500 to-pink-500" },
    { label: "Value Bets", value: valueBets, icon: "💰", accent: "from-amber-500 to-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Welcome back, {user.displayName?.split(" ")[0] ?? "Bettor"}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{user.email}</p>
        </div>
        <div className="text-right px-4 py-2 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <p className="text-2xl font-black text-green-400">{remaining}</p>
          <p className="text-[10px] text-gray-500 font-medium">predictions left</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((m, i) => (
          <div key={i} className="bg-[#111118] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.1] transition-all duration-300">
            <p className="text-[11px] text-gray-500 font-medium mb-2">{m.label}</p>
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${m.accent} flex items-center justify-center text-sm opacity-90`}>{m.icon}</div>
              <span className="text-xl font-black text-white">{m.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600/10 via-emerald-600/5 to-[#111118] border border-green-500/10 p-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <h3 className="text-lg font-bold text-white mb-1">Ready to analyze?</h3>
          <p className="text-gray-500 text-sm mb-4">Run a new prediction with the statistical engine</p>
          <Link
            to="/predictor"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-green-900/30 transition-all duration-300"
          >
            🔮 Start New Prediction
          </Link>
        </div>
      </div>

      <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Recent Predictions</h2>
          <Link to="/history" className="text-xs text-green-400 hover:text-green-300 font-medium transition-colors">View All →</Link>
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
          <div className="text-center py-10">
            <p className="text-gray-600 text-sm">No predictions yet</p>
            <Link to="/predictor" className="text-green-400 text-sm font-medium hover:text-green-300 mt-1 inline-block">Make your first prediction →</Link>
          </div>
        )}
      </div>
    </div>
  );
}