import { Link, useLocation } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";
import { Menu, X } from "lucide-react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: "📊" },
  { path: "/predictor", label: "Predictor", icon: "🔮" },
  { path: "/history", label: "History", icon: "📜" },
  { path: "/pricing", label: "Pricing", icon: "💰" },
  { path: "/profile", label: "Profile", icon: "👤" },
];

export function Navbar() {
  const { user, sidebarOpen, setSidebarOpen } = useAppStore();
  const location = useLocation();

  return (
    <header className="bg-gradient-to-r from-gray-900 via-green-950 to-gray-900 border-b border-green-900/40 px-4 py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-sm font-bold text-white">AI</div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-white">Vantage AI</h1>
              <p className="text-[11px] text-green-400 font-medium tracking-widest uppercase">
                BetPawa Virtual · Analysis Engine
              </p>
            </div>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-bold transition",
                location.pathname === item.path
                  ? "bg-green-600/20 text-green-400"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
            >
              <span className="mr-1">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user && (
            <span className="text-xs text-gray-400 hidden sm:block">
              {user.email}
            </span>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Algorithm Active
          </div>
        </div>
      </div>
    </header>
  );
}