import { Link, useLocation } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";
import { X, LogOut, Zap } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { PLAN_LIMITS } from "@/utils/constants";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: "📊" },
  { path: "/predictor", label: "Predictor", icon: "🔮" },
  { path: "/history", label: "History", icon: "📜" },
  { path: "/subscription", label: "Subscription", icon: "💎" },
  { path: "/pricing", label: "Pricing", icon: "💰" },
  { path: "/profile", label: "Profile", icon: "👤" },
];

export function Sidebar() {
  const { user, sidebarOpen, setSidebarOpen } = useAppStore();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
  };

  const limit = PLAN_LIMITS[user?.plan ?? "free"] ?? 5;
  const used = user?.predictionsUsed ?? 0;
  const percent = Math.min((used / limit) * 100, 100);

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        "fixed left-0 top-0 h-full w-[260px] bg-surface-4 border-r border-white/[0.06] z-50 transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:z-auto flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <Link to="/" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-xs font-black text-white">
                VA
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">Vantage AI</p>
                <p className="text-[10px] text-green-400/70 font-medium tracking-[0.15em] uppercase">Analysis Engine</p>
              </div>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white p-2 -mr-1">
              <X size={20} />
            </button>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-green-500/20">
              {user?.displayName?.[0] ?? user?.email?.[0] ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.displayName ?? "User"}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {user?.plan === "free" && (
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-400">Predictions</span>
              <span className="text-gray-300 font-medium">{used} / {limit}</span>
            </div>
            <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-700"
                style={{ width: `${percent}%` }}
              />
            </div>
            <Link to="/pricing" onClick={() => setSidebarOpen(false)} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-green-400 hover:text-green-300 transition-colors">
              <Zap size={14} />
              Upgrade for more
            </Link>
          </div>
        )}

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                location.pathname === item.path
                  ? "bg-green-500/10 text-green-400 shadow-sm shadow-green-500/5"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <span className="text-sm">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/[0.06]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 w-full transition-all duration-200"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}