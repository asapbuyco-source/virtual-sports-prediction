import { useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAppStore } from "@/store/useAppStore";
import toast from "react-hot-toast";

export default function PaymentCallbackPage() {
  const { user, setUser } = useAppStore();
  const [searchParams] = useSearchParams();
  const transId = searchParams.get("transId") || "";
  const [status, setStatus] = useState<"checking" | "success" | "failed">("checking");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!user || !transId) {
      if (!transId) setStatus("failed");
      return;
    }

    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      const data = snap.data();
      if (data?.plan && data.plan !== "free") {
        setStatus("success");
        setUser({ ...user, plan: data.plan, predictionsLimit: data.predictionsLimit, predictionsUsed: data.predictionsUsed });
        toast.success(`Plan activated: ${data.plan.toUpperCase()}!`);
      }
    }, (err) => {
      console.error("Firestore listener error:", err);
    });

    const timeout = setTimeout(() => setStatus("failed"), 120000);
    return () => { unsub(); clearTimeout(timeout); };
  }, [user, transId, setUser]);

  const handleManualCheck = () => {
    if (!user) return;
    setChecking(true);
    const checkUser = async () => {
      try {
        const { getDoc } = await import("firebase/firestore");
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.data();
        if (data?.plan && data.plan !== "free") {
          setStatus("success");
          setUser({ ...user, plan: data.plan, predictionsLimit: data.predictionsLimit, predictionsUsed: data.predictionsUsed });
          toast.success(`Plan activated: ${data.plan.toUpperCase()}!`);
        } else {
          toast.error("Payment not yet confirmed. Please wait a few minutes.");
        }
      } catch {
        toast.error("Failed to check payment status.");
      } finally {
        setChecking(false);
      }
    };
    checkUser();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-8 max-w-md w-full text-center space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-green-500/5 blur-[60px] pointer-events-none" />
        {status === "checking" && (
          <>
            <div className="flex justify-center relative z-10">
              <div className="w-16 h-16 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
            </div>
            <div className="relative z-10">
              <h2 className="text-xl font-extrabold text-white">Processing Payment</h2>
              <p className="text-gray-400 text-sm mt-2">Please wait while we verify your payment. Do not close this window.</p>
              <p className="text-xs text-gray-600 mt-3 font-mono">Transaction: {transId}</p>
            </div>
          </>
        )}
        {status === "success" && (
          <>
            <div className="relative z-10">
              <CheckCircle size={64} className="text-green-400 mx-auto animate-pulse-glow" />
            </div>
            <div className="relative z-10 space-y-3">
              <h2 className="text-xl font-extrabold text-white">Payment Successful!</h2>
              <p className="text-gray-400 text-sm">Your plan has been activated. Welcome to Vantage AI!</p>
              <a href="/dashboard" className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold mt-4 shadow-lg shadow-green-900/30 transition">
                Go to Dashboard
              </a>
            </div>
          </>
        )}
        {status === "failed" && (
          <>
            <div className="relative z-10">
              <XCircle size={64} className="text-red-400 mx-auto" />
            </div>
            <div className="relative z-10 space-y-3">
              <h2 className="text-xl font-extrabold text-white">Payment Pending</h2>
              <p className="text-gray-400 text-sm">If your payment was completed, your plan will activate within a few minutes. If it hasn't, please try again or contact support.</p>
              <div className="flex gap-3 justify-center mt-4">
                <a href="/dashboard" className="px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white text-sm font-bold transition">
                  Return to Dashboard
                </a>
                <a href="/pricing" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white text-sm font-bold shadow-lg shadow-green-900/30 transition">
                  Try Again
                </a>
              </div>
              <button
                onClick={handleManualCheck}
                disabled={checking}
                className="mt-3 px-5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-gray-400 hover:text-white text-xs font-bold transition flex items-center gap-2 mx-auto"
              >
                <RefreshCw size={14} className={checking ? "animate-spin" : ""} />
                {checking ? "Checking..." : "Check payment status"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}