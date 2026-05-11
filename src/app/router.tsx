import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { lazy, Suspense } from "react";
import { PageSkeleton } from "@/components/skeleton/PageSkeleton";
import { AuthLayout } from "@/app/AuthLayout";

const LandingPage = lazy(() => import("@/pages/LandingPage"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const PredictorPage = lazy(() => import("@/pages/PredictorPage"));
const PricingPage = lazy(() => import("@/pages/PricingPage"));
const HistoryPage = lazy(() => import("@/pages/HistoryPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/auth", element: <AuthPage /> },
  { path: "/pricing", element: <PricingPage /> },
  {
    element: <AuthLayout />,
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/predictor", element: <PredictorPage /> },
      { path: "/history", element: <HistoryPage /> },
      { path: "/profile", element: <ProfilePage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);

export function AppRouter() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}