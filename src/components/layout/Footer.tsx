import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 py-8 mt-8">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-lg">⚽</div>
            <div>
              <p className="text-sm font-bold text-white">VFL AI Predictor</p>
              <p className="text-[10px] text-gray-500">Built in Cameroon 🇨🇲</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-4 text-xs text-gray-400">
            <Link to="/" className="hover:text-white">Home</Link>
            <Link to="/predictor" className="hover:text-white">Predictor</Link>
            <Link to="/pricing" className="hover:text-white">Pricing</Link>
            <Link to="/history" className="hover:text-white">History</Link>
          </nav>
        </div>
        <div className="flex flex-wrap gap-4 text-[10px] text-gray-600 justify-center">
          <span>Privacy Policy</span>
          <span>·</span>
          <span>Terms of Service</span>
          <span>·</span>
          <span>Responsible Gambling</span>
        </div>
        <p className="text-center text-[10px] text-gray-700">
          For educational & research purposes only. Gambling involves risk.
        </p>
      </div>
    </footer>
  );
}