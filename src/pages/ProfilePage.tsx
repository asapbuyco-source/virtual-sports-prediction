import { useAppStore } from "@/store/useAppStore";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { PLAN_LIMITS } from "@/utils/constants";

export default function ProfilePage() {
  const { user, setUser } = useAppStore();

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const limit = PLAN_LIMITS[user?.plan ?? "free"] ?? 5;
  const used = user?.predictionsUsed ?? 0;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-extrabold text-white">Profile</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center text-2xl font-bold text-white">
            {user?.displayName?.[0] ?? user?.email?.[0] ?? "U"}
          </div>
          <div>
            <p className="text-lg font-bold text-white">{user?.displayName ?? "User"}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Subscription</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-extrabold text-white capitalize">{user?.plan ?? "free"} Plan</p>
              <p className="text-xs text-gray-500">
                {used} / {limit === 999999 ? "∞" : limit} predictions used this month
              </p>
            </div>
            {user?.plan !== "elite" && (
              <a href="/pricing" className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-bold">
                Upgrade
              </a>
            )}
          </div>
          {limit !== 999999 && (
            <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-green-600 to-emerald-500"
                style={{ width: `${Math.min((used / limit) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold border border-gray-700"
      >
        Sign Out
      </button>
    </div>
  );
}