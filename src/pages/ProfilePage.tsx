import { useAppStore } from "@/store/useAppStore";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { PLAN_LIMITS, APP_NAME } from "@/utils/constants";

export default function ProfilePage() {
  const { user, setUser } = useAppStore();

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const limit = PLAN_LIMITS[user?.plan ?? "free"] ?? 5;
  const used = user?.predictionsUsed ?? 0;
  const percent = Math.min((used / limit) * 100, 100);

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-black text-white">Profile</h1>

      <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-green-500/20">
            {user?.displayName?.[0] ?? user?.email?.[0] ?? "U"}
          </div>
          <div>
            <p className="text-lg font-bold text-white">{user?.displayName ?? "User"}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xl font-black text-white capitalize">{user?.plan ?? "free"} Plan</p>
                {user?.plan !== "free" && (
                  <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-[10px] font-bold text-green-400 border border-green-500/20">ACTIVE</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {used} / {limit === 999999 ? "∞" : limit} predictions used this month
              </p>
            </div>
            {user?.plan !== "elite" && (
              <a href="/pricing" className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white text-sm font-bold shadow-lg shadow-green-900/20 transition-all duration-300">
                Upgrade
              </a>
            )}
          </div>
          {limit !== 999999 && (
            <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-700"
                style={{ width: `${percent}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">About</h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          {APP_NAME} provides statistical analysis tools for BetPawa Virtual Football League.
          Virtual football outcomes are computer-generated. Past prediction accuracy does not guarantee future results.
          Responsible gambling: never bet more than you can afford to lose.
        </p>
      </div>

      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-gray-400 font-bold transition-all duration-300"
      >
        Sign Out
      </button>
    </div>
  );
}