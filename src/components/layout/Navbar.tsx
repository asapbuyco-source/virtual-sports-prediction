import { Link, useLocation } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { useTranslation } from "@/lib/i18n/I18nContext";
import { cn } from "@/utils/cn";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const { user, sidebarOpen, setSidebarOpen } = useAppStore();
  const location = useLocation();
  const { t, language, setLanguage } = useTranslation();

  const navItems = [
    { path: "/dashboard", label: t.nav.dashboard, icon: "📊" },
    { path: "/predictor", label: t.nav.predictor, icon: "🔮" },
    { path: "/history", label: t.nav.history, icon: "📜" },
    { path: "/pricing", label: t.nav.pricing, icon: "💎" },
    { path: "/profile", label: t.nav.profile, icon: "👤" },
  ];

  return (
    <header className="glass border-b border-white/[0.06] px-4 py-3 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-gray-400 hover:text-white p-1">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-green-500/20 group-hover:shadow-green-500/40 transition-shadow duration-300">
              VA
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white leading-none">Vantage AI</h1>
              <p className="text-[9px] text-green-400/80 font-semibold tracking-[0.2em] uppercase leading-none mt-0.5">
                BetPawa Virtual
              </p>
            </div>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
                location.pathname === item.path
                  ? "bg-green-500/10 text-green-400 shadow-sm shadow-green-500/10"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLanguage(language === "en" ? "fr" : "en")}
            className="px-2 py-1 rounded text-xs font-bold bg-white/5 border border-white/10 hover:bg-white/10 transition"
          >
            {language === "en" ? "FR" : "EN"}
          </button>
          {user && (
            <span className="text-[11px] text-gray-500 hidden sm:block font-medium">
              {user.email}
            </span>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-semibold text-green-400">LIVE</span>
          </div>
        </div>
      </div>
    </header>
  );
}