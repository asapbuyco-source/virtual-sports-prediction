import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-center px-4">
      <div className="space-y-4">
        <div className="text-8xl">404</div>
        <h1 className="text-2xl font-extrabold text-white">Page Not Found</h1>
        <p className="text-gray-400">The page you're looking for doesn't exist.</p>
        <Link to="/" className="inline-block px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold">
          Go Home
        </Link>
      </div>
    </div>
  );
}