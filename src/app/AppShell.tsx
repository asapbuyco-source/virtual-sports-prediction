import { useAppStore } from "@/store/useAppStore";
import { AppRouter } from "./router";
import { Toaster } from "react-hot-toast";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
      <div className="text-4xl mb-4 font-bold text-green-400">AI</div>
      <div className="w-12 h-12 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
      <p className="text-gray-400 text-sm mt-4">Loading Vantage AI...</p>
    </div>
  );
}

export default function AppShell() {
  const { authLoading } = useAppStore();

  if (!authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <Toaster position="top-right" />
        <AppRouter />
      </div>
    );
  }

  return <LoadingScreen />;
}