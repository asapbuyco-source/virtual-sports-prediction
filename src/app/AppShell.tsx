import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useAuthListener } from "@/features/auth/useAuth";
import { AppRouter } from "./router";
import { Toaster } from "react-hot-toast";

function LoadingScreen({ slowMessage }: { slowMessage: boolean }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/5 rounded-full blur-[100px]" />
      <div className="relative">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-sm font-black text-white mb-6 mx-auto shadow-lg shadow-green-500/30">VA</div>
        <div className="w-10 h-10 rounded-full border-[3px] border-green-500/30 border-t-green-400 animate-spin mx-auto" />
        <p className="text-gray-500 text-sm mt-6 text-center">Loading Vantage AI...</p>
        {slowMessage && (
          <p className="text-yellow-500/80 text-xs mt-3 text-center max-w-[200px] mx-auto">
            Connection is slow. Retrying...
          </p>
        )}
      </div>
    </div>
  );
}

export default function AppShell() {
  useAuthListener();
  const { authLoading } = useAppStore();
  const [slowMessage, setSlowMessage] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSlowMessage(true), 3000);
    return () => clearTimeout(t);
  }, []);

  if (!authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <Toaster position="top-right" toastOptions={{ style: { background: '#18181f', color: '#fff', border: '1px solid rgba(255,255,255,0.06)' } }} />
        <AppRouter />
      </div>
    );
  }

  return <LoadingScreen slowMessage={slowMessage} />;
}