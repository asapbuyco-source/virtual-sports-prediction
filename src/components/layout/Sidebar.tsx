import { Link, useLocation } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/utils/cn";
import { X, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { PLAN_LIMITS } from "@/utils/constants";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: "📊" },
  { path: "/predictor", label: "Predictor", icon: "🔮" },
  { path: "/history", label: "History", icon: "📜" },
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
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-50 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-sm font-bold text-white">
              {user?.displayName?.[0] ?? user?.email?.[0] ?? "U"}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{user?.displayName ?? "User"}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.plan ?? "free"} plan</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400">
            <X size={18} />
          </button>
        </div>

        {user?.plan === "free" && (
          <div className="p-4 border-b border-gray-800">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Predictions</span>
              <span>{used} / {limit}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-green-600 to-emerald-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition",
                location.pathname === item.path
                  ? "bg-green-600/20 text-green-400"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-gray-400 hover:text-white hover:bg-gray-800 w-full"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}