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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-lg w-full space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Upgrade Plan</h2>
          <button onClick={() => setPaymentModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {Object.values(PLANS).filter(p => p.id !== "free").map(plan => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`p-4 rounded-xl border ${selectedPlan === plan.id ? "border-green-500 bg-green-900/20" : "border-gray-700 bg-gray-800"}`}
            >
              <p className="font-bold text-white">{plan.name}</p>
              <p className="text-2xl font-extrabold text-green-400">{plan.price.toLocaleString()} XAF</p>
              <p className="text-xs text-gray-400">{plan.predictionsPerMonth === Infinity ? "Unlimited" : plan.predictionsPerMonth + "/mo"}</p>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-xs text-gray-400">MTN/Orange Money Number (+237)</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="6XX XXX XXX"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-green-500"
          />
          {phone && !handlePhoneValidation(phone) && (
            <p className="text-xs text-red-400">Enter a valid Cameroonian number (6XX XXX XXX)</p>
          )}
        </div>

        <button
          onClick={handlePayment}
          disabled={!selectedPlan || !phone || loading || !handlePhoneValidation(phone)}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold disabled:opacity-40"
        >
          {loading ? "Processing..." : "Pay with Mobile Money"}
        </button>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <span>🔒</span>
          <span>Secured by Fapshi</span>
        </div>
      </div>
    </div>
  );
}