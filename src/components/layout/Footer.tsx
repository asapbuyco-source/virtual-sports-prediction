import { Link } from "react-router-dom";
import { useTranslation } from "@/lib/i18n/I18nContext";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-surface-4 border-t border-white/[0.06] py-10 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-xs font-black text-white">VA</div>
            <div>
              <p className="text-sm font-bold text-white">Vantage AI</p>
              <p className="text-xs text-gray-500 font-medium">betpawa Official Partner</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-5 text-xs text-gray-400">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/predictor" className="hover:text-white transition-colors">{t.nav.predictor}</Link>
            <Link to="/pricing" className="hover:text-white transition-colors">{t.nav.pricing}</Link>
            <Link to="/history" className="hover:text-white transition-colors">{t.nav.history}</Link>
          </nav>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span>Privacy Policy</span>
          <span>·</span>
          <span>Terms of Service</span>
          <span>·</span>
          <span>Responsible Gambling</span>
        </div>
        <p className="text-xs text-gray-600 text-center">
          Virtual football outcomes are computer-generated. Past prediction accuracy does not guarantee future results. Never bet more than you can afford to lose.
        </p>
      </div>
    </footer>
  );
}