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
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
        />
        <select
          value={leagueFilter}
          onChange={e => setLeagueFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
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
        <p className="text-gray-500 text-sm text-center py-10">No predictions found.</p>
      )}
    </div>
  );
}