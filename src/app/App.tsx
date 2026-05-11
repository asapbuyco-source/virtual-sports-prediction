import { useAuthListener } from "@/features/auth/useAuth";
import { AppRouter } from "./router";
import { Toaster } from "react-hot-toast";

export function AppProviders() {
  useAuthListener();

  return (
    <>
      <Toaster position="top-right" />
      <AppRouter />
    </>
  );
}

export default function App() {
  return (
    <AppProviders />
  );
}