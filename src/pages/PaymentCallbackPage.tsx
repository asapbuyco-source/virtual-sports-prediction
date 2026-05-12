import { useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function PaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const transId = searchParams.get("transId") || "";
  const [status, setStatus] = useState<"checking" | "success" | "failed">("checking");

  useEffect(() => {
    if (!transId) {
      setStatus("failed");
      return;
    }
    const timer = setTimeout(() => setStatus("failed"), 30000);
    return () => clearTimeout(timer);
  }, [transId]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
        {status === "checking" && (
          <>
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
            </div>
            <h2 className="text-xl font-extrabold text-white">Processing Payment</h2>
            <p className="text-gray-400 text-sm">Please wait while we verify your payment. Do not close this window.</p>
            <p className="text-xs text-gray-600">Transaction: {transId}</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle size={64} className="text-green-400 mx-auto" />
            <h2 className="text-xl font-extrabold text-white">Payment Successful!</h2>
            <p className="text-gray-400 text-sm">Your plan has been activated. Welcome to Vantage AI!</p>
            <a href="/dashboard" className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold">
              Go to Dashboard
            </a>
          </>
        )}
        {status === "failed" && (
          <>
            <XCircle size={64} className="text-red-400 mx-auto" />
            <h2 className="text-xl font-extrabold text-white">Payment Pending</h2>
            <p className="text-gray-400 text-sm">If your payment was completed, your plan will activate within a few minutes.</p>
            <a href="/dashboard" className="inline-block px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold">
              Return to Dashboard
            </a>
          </>
        )}
      </div>
    </div>
  );
}