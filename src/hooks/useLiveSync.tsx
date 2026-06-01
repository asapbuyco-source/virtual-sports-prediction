import { useEffect, useRef, useCallback, useState } from "react";
import { RefreshCw } from "lucide-react";

interface LiveMatch {
  teams: string;
  odds: { home: string; draw: string; away: string };
}

interface UseLiveSyncOptions {
  intervalMs?: number;
  enabled?: boolean;
  onUpdate?: (matches: LiveMatch[]) => void;
  onError?: (error: Error) => void;
}

export function useLiveSync({
  intervalMs = 60000,
  enabled = true,
  onUpdate,
  onError,
}: UseLiveSyncOptions = {}) {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchMatches = useCallback(async () => {
    if (!enabled || syncing) return;
    setSyncing(true);
    try {
      const response = await fetch("/data/live_sync.json");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!mountedRef.current) return;
      const upcoming = data?.upcoming ?? [];
      setMatches(upcoming);
      setLastUpdated(new Date());
      onUpdate?.(upcoming);
    } catch (err) {
      if (!mountedRef.current) return;
      onError?.(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (mountedRef.current) setSyncing(false);
    }
  }, [enabled, syncing, onUpdate, onError]);

  useEffect(() => {
    mountedRef.current = true;
    fetchMatches();
    if (enabled) {
      intervalRef.current = setInterval(fetchMatches, intervalMs);
    }
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, intervalMs, fetchMatches]);

  return { matches, lastUpdated, syncing, refresh: fetchMatches };
}

interface LiveSyncBannerProps {
  className?: string;
}

export function LiveSyncBanner({ className = "" }: LiveSyncBannerProps) {
  const { lastUpdated, syncing, refresh } = useLiveSync({ intervalMs: 60000 });

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-2">
        <RefreshCw
          size={12}
          className={`text-green-400 ${syncing ? "animate-spin" : ""}`}
        />
        <span className="text-xs text-gray-400">
          Last updated:{" "}
          {lastUpdated
            ? lastUpdated.toLocaleTimeString()
            : "Never"}
        </span>
      </div>
      <button
        onClick={refresh}
        disabled={syncing}
        className="text-xs text-green-400 hover:text-green-300 font-semibold disabled:opacity-50 transition-colors"
        aria-label="Refresh live matches"
      >
        Refresh
      </button>
    </div>
  );
}