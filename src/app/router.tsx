import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { lazy, Suspense } from "react";
import { PageSkeleton } from "@/components/skeleton/PageSkeleton";
import { AuthLayout } from "@/app/AuthLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const LandingPage = lazy(() => import("@/pages/LandingPage"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const PredictorPage = lazy(() => import("@/pages/PredictorPage"));
const PricingPage = lazy(() => import("@/pages/PricingPage"));
const HistoryPage = lazy(() => import("@/pages/HistoryPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const PaymentCallbackPage = lazy(() => import("@/pages/PaymentCallbackPage"));
const SubscriptionPage = lazy(() => import("@/pages/SubscriptionPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/auth", element: <AuthPage /> },
  { path: "/pricing", element: <PricingPage /> },
  { path: "/payment-callback", element: <PaymentCallbackPage /> },
  { path: "/terms", element: <TermsPage /> },
  { path: "/privacy", element: <PrivacyPage /> },
  {
    element: <AuthLayout />,
    children: [
      { path: "/dashboard", element: <ErrorBoundary><DashboardPage /></ErrorBoundary> },
      { path: "/predictor", element: <ErrorBoundary><PredictorPage /></ErrorBoundary> },
      { path: "/history", element: <ErrorBoundary><HistoryPage /></ErrorBoundary> },
      { path: "/profile", element: <ProfilePage /> },
      { path: "/subscription", element: <ErrorBoundary><SubscriptionPage /></ErrorBoundary> },
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