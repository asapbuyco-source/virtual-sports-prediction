import { Link } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { PLAN_LIMITS, PLANS } from "@/utils/constants";
import { useSubscription } from "@/features/history/usePredictionHistory";
import { SubscriptionCard } from "@/features/subscription/SubscriptionCard";

export default function SubscriptionPage() {
  const { user } = useAppStore();
  const { data: subscription, isLoading } = useSubscription();

  if (!user) return null;

  const limit = PLAN_LIMITS[user.plan ?? "free"] ?? 5;
  const used = user.predictionsUsed ?? 0;
  const percent = Math.min((used / limit) * 100, 100);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Subscription</h1>
        <Link
          to="/pricing"
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white text-sm font-bold shadow-lg shadow-green-900/20 transition-all hover:from-green-500 hover:to-emerald-400"
        >
          Upgrade Plan
        </Link>
      </div>

      <div className="grid gap-4">
        <SubscriptionCard
          subscription={
            subscription
              ? {
                  plan: subscription.plan as any,
                  status: subscription.status as any,
                  startDate: subscription.startDate ?? undefined,
                  endDate: subscription.endDate ?? undefined,
                }
              : null
          }
          currentPlanLimit={limit}
          currentPlanUsed={used}
        />
      </div>

      {user.plan !== "elite" && (
        <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
            Available Upgrades
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {Object.values(PLANS)
              .filter((p) => p.id !== "free" && p.id !== user.plan)
              .slice(0, 2)
              .map((plan) => (
                <Link
                  key={plan.id}
                  to="/pricing"
                  className="bg-[#0d0d14] border border-white/[0.06] rounded-xl p-4 hover:border-green-500/30 transition-all group"
                >
                  <p className="font-bold text-white text-sm">{plan.name}</p>
                  <p className="text-xl font-black text-green-400 mt-1">
                    {plan.price.toLocaleString()}{" "}
                    <span className="text-xs text-gray-500 font-normal">XAF</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {plan.id === "daily" && `${plan.predictionsPerMonth}/day`}
                    {plan.id === "weekly" && `${plan.predictionsPerMonth}/week`}
                    {plan.id === "monthly" && `${plan.predictionsPerMonth}/month`}
                    {plan.id === "elite" && "Unlimited"}
                  </p>
                </Link>
              ))}
          </div>
        </div>
      )}

      <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
          Plan Features
        </h3>
        {(PLANS[user.plan ?? "free"]?.features ?? []).map((feature, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span className="text-xs text-gray-400">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}