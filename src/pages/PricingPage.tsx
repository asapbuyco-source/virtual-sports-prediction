import { useNavigate } from "react-router-dom";
import { PLANS } from "@/utils/constants";
import { useAppStore } from "@/store/useAppStore";
import { PaymentModal } from "@/features/payment/PaymentModal";

export default function PricingPage() {
  const { user, setPaymentModalOpen } = useAppStore();
  const navigate = useNavigate();

  const handlePlanClick = (planId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (planId === "free") {
      navigate("/predictor");
    } else {
      setPaymentModalOpen(true);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <p className="text-green-400 text-xs font-bold tracking-[0.2em] uppercase mb-2">Pricing</p>
        <h1 className="text-3xl font-black text-white mb-2">Choose Your Edge</h1>
        <p className="text-gray-500">Pay in XAF via Mobile Money — MTN & Orange</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {Object.values(PLANS).map((plan) => (
          <div
            key={plan.id}
            className={`rounded-2xl p-6 border relative transition-all duration-300 hover:scale-[1.02] ${
              plan.highlight
                ? "border-green-500/40 bg-gradient-to-b from-green-500/[0.07] to-[#111118] glow-sm"
                : "border-white/[0.06] bg-[#111118]"
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-green-600 to-emerald-500 rounded-full text-xs font-bold text-white shadow-lg shadow-green-500/30">
                Most Popular
              </div>
            )}
            <div className="text-center mb-5">
              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              <div className="mt-3">
                <span className="text-3xl font-black text-gradient">{plan.price.toLocaleString()}</span>
                <span className="text-gray-500 text-sm ml-1">XAF</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {plan.id === "free" ? "5 predictions/month" : plan.id === "pro" ? "50 predictions/month" : "Unlimited"}
              </p>
            </div>

            <ul className="space-y-2.5 mb-6">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePlanClick(plan.id)}
              className={`w-full py-3 rounded-xl font-bold transition-all duration-300 ${
                plan.id === "free"
                  ? "bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white"
                  : "bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white shadow-lg shadow-green-900/20"
              }`}
            >
              {plan.id === "free" ? "Get Started" : "Upgrade"}
            </button>
          </div>
        ))}
      </div>

      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
          <span>🔒 256-bit encrypted</span>
          <span>·</span>
          <span>Instant activation</span>
          <span>·</span>
          <span>7-day refund</span>
        </div>
        <p className="text-xs text-gray-700">Payments processed by Fapshi · MTN & Orange Money accepted</p>
      </div>

      <PaymentModal />
    </div>
  );
}