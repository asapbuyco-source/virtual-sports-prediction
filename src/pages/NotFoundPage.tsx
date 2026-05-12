import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-center px-4">
      <div className="space-y-5">
        <div className="text-8xl font-black text-gradient">404</div>
        <h1 className="text-2xl font-black text-white">Page Not Found</h1>
        <p className="text-gray-500 max-w-sm mx-auto">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold shadow-lg shadow-green-900/30 transition-all duration-300">
          ← Go Home
        </Link>
      </div>
    </div>
  );
}