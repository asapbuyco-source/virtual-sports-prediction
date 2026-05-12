import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { PLANS } from "@/utils/constants";
import toast from "react-hot-toast";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export function PaymentModal() {
  const { paymentModalOpen, setPaymentModalOpen, user } = useAppStore();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!selectedPlan || !phone || !user) return;
    setLoading(true);

    try {
      const initiatePayment = httpsCallable<{ planId: string; phone: string }, { transId: string; link: string }>(
        functions,
        "initiatePayment"
      );

      const result = await initiatePayment({ planId: selectedPlan, phone });

      if (result.data.link) {
        window.open(result.data.link, "_blank");
      }

      toast.success("Payment request sent! Complete on your phone.");
      setLoading(false);
    } catch (err) {
      toast.error("Payment initiation failed.");
      setLoading(false);
    }
  };

  const handlePhoneValidation = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    return cleaned.match(/^(237)?6[5-9]\d{7}$/);
  };

  if (!paymentModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#111118] border border-white/[0.08] rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl shadow-black/50">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Upgrade Plan</h2>
          <button onClick={() => setPaymentModalOpen(false)} className="text-gray-500 hover:text-white transition-colors p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {Object.values(PLANS).filter(p => p.id !== "free").map(plan => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                selectedPlan === plan.id
                  ? "border-green-500/40 bg-green-500/10"
                  : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
              }`}
            >
              <p className="font-bold text-white text-sm">{plan.name}</p>
              <p className="text-xl font-black text-gradient mt-1">{plan.price.toLocaleString()} <span className="text-xs text-gray-500 font-normal">XAF</span></p>
              <p className="text-[11px] text-gray-500 mt-0.5">{plan.predictionsPerMonth === Infinity ? "Unlimited" : plan.predictionsPerMonth + "/mo"}</p>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">MTN / Orange Money Number</label>
          <div className="flex gap-2">
            <span className="flex items-center px-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-gray-400">+237</span>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="6XX XXX XXX"
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500/50 transition-colors"
            />
          </div>
          {phone && !handlePhoneValidation(phone) && (
            <p className="text-[11px] text-red-400">Enter a valid Cameroonian number</p>
          )}
        </div>

        <button
          onClick={handlePayment}
          disabled={!selectedPlan || !phone || loading || !handlePhoneValidation(phone)}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold shadow-lg shadow-green-900/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
        >
          {loading ? "Processing..." : "Pay with Mobile Money"}
        </button>

        <div className="flex items-center justify-center gap-2 text-[11px] text-gray-600">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          Secured by Fapshi · 256-bit encrypted
        </div>
      </div>
    </div>
  );
}