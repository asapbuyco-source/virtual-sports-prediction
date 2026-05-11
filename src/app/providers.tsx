import { useAuthListener } from "@/features/auth/useAuth";
import { AppRouter } from "./router";
import { Toaster } from "react-hot-toast";

export function AppProviders() {
  useAuthListener();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Toaster position="top-right" />
      <AppRouter />
    </div>
  );
}

export default function App() {
  return <AppProviders />;
}