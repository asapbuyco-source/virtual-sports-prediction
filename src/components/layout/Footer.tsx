import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-[#0c0c14] border-t border-white/[0.06] py-10 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-[9px] font-black text-white">VA</div>
            <div>
              <p className="text-sm font-bold text-white">Vantage AI</p>
              <p className="text-[10px] text-gray-600 font-medium">betpawa Official Partner</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-5 text-xs text-gray-500">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/predictor" className="hover:text-white transition-colors">Predictor</Link>
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link to="/history" className="hover:text-white transition-colors">History</Link>
          </nav>
        </div>
        <div className="flex flex-wrap gap-3 text-[10px] text-gray-700">
          <span>Privacy Policy</span>
          <span>·</span>
          <span>Terms of Service</span>
          <span>·</span>
          <span>Responsible Gambling</span>
        </div>
        <p className="text-[10px] text-gray-800 text-center">
          Virtual football outcomes are computer-generated. Past prediction accuracy does not guarantee future results. Never bet more than you can afford to lose.
        </p>
      </div>
    </footer>
  );
}