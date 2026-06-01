import { z } from "zod";
import { PLAN_LIMITS } from "@/utils/constants";

const schema = z.object({
  plan: z.enum(["free", "daily", "weekly", "monthly", "elite"]),
  status: z.enum(["active", "cancelled", "expired", "pending"]).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

type Subscription = z.infer<typeof schema>;

export function SubscriptionCard({
  subscription,
  currentPlanLimit,
  currentPlanUsed,
}: {
  subscription: Subscription | null;
  currentPlanLimit: number;
  currentPlanUsed: number;
}) {
  const isActive = subscription?.status === "active";
  const remaining = Math.max(0, currentPlanLimit - currentPlanUsed);
  const percent = Math.min((currentPlanUsed / currentPlanLimit) * 100, 100);

  const planLabels: Record<string, string> = {
    free: "Free Plan",
    daily: "Daily Plan",
    weekly: "Weekly Plan",
    monthly: "Monthly Plan",
    elite: "Elite Plan",
  };

  const statusColors: Record<string, string> = {
    active: "text-green-400",
    cancelled: "text-red-400",
    expired: "text-gray-400",
    pending: "text-yellow-400",
  };

  return (
    <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
          Subscription
        </h3>
        {subscription && isActive && (
          <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-[10px] font-bold text-green-400 border border-green-500/20">
            ACTIVE
          </span>
        )}
      </div>

      {subscription ? (
        <>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20 flex items-center justify-center">
              <span className="text-green-400 text-sm">💎</span>
            </div>
            <div>
              <p className="font-bold text-white text-sm">
                {planLabels[subscription.plan]}
              </p>
              <p className={`text-xs ${subscription.status ? statusColors[subscription.status] : "text-gray-500"}`}>
                {subscription.status
                  ? subscription.status.charAt(0).toUpperCase() +
                    subscription.status.slice(1)
                  : "Unknown"}
              </p>
            </div>
          </div>

          {isActive && subscription.endDate && (
            <p className="text-xs text-gray-500">
              Renews{" "}
              {new Date(subscription.endDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm mb-3">
            No active subscription
          </p>
          <a
            href="/pricing"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-500 rounded-xl text-sm font-bold text-white shadow-lg shadow-green-900/20 transition-all hover:from-green-500 hover:to-emerald-400"
          >
            Upgrade Plan
          </a>
        </div>
      )}

      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-gray-400">Predictions used</span>
          <span className="text-gray-300 font-medium">
            {currentPlanUsed} /{" "}
            {currentPlanLimit === 999999 ? "∞" : currentPlanLimit}
          </span>
        </div>
        <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-700 ${
              percent > 90
                ? "bg-red-500"
                : percent > 70
                ? "bg-yellow-500"
                : "bg-gradient-to-r from-green-500 to-emerald-400"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-1">{remaining} remaining</p>
      </div>
    </div>
  );
}

export default SubscriptionCard;