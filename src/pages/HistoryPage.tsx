import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { HistorySkeleton } from "@/components/skeleton/HistorySkeleton";
import { PredictionHistoryCard } from "@/features/history/PredictionHistoryCard";
import { usePredictionHistory } from "@/features/history/usePredictionHistory";

export default function HistoryPage() {
const { user } = useAppStore();
  const { data: predictions, isLoading } = usePredictionHistory();
  const [search, setSearch] = useState("");
  const [leagueFilter, setLeagueFilter] = useState("all");

  const filtered = (predictions ?? []).filter(p => {
    const matchSearch = p.homeTeam.toLowerCase().includes(search.toLowerCase()) || p.awayTeam.toLowerCase().includes(search.toLowerCase());
    const matchLeague = leagueFilter === "all" || p.league === leagueFilter;
    return matchSearch && matchLeague;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-white">Prediction History</h1>
        <span className="text-xs text-gray-400">
          {user?.plan === "elite" ? "Full history" : user?.plan === "pro" ? "30 days" : "5 recent"}
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search teams..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
        />
        <select
          value={leagueFilter}
          onChange={e => setLeagueFilter(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
        >
          <option value="all">All Leagues</option>
          <option value="EPL">EPL</option>
          <option value="LaLiga">La Liga</option>
          <option value="SerieA">Serie A</option>
          <option value="Bundesliga">Bundesliga</option>
          <option value="Ligue1">Ligue 1</option>
          <option value="Eredivisie">Eredivisie</option>
        </select>
      </div>

      {isLoading ? (
        <HistorySkeleton />
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(p => (
            <PredictionHistoryCard key={p.id} pred={p} />
          ))}
        </div>
      ) : (
        <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-3">
          <div className="text-4xl">📋</div>
          <p className="text-gray-400 text-sm">No predictions found.</p>
        </div>
      )}
    </div>
  );
}