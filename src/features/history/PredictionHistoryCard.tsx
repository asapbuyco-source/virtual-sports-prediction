import { format } from "date-fns";
import type { SavedPrediction } from "../history/usePredictionHistory";
import { Tag } from "@/components/ui/Tag";

export function PredictionHistoryCard({ pred }: { pred: SavedPrediction }) {
  const confidenceColor = (c: number) =>
    c >= 75 ? "#22c55e" : c >= 60 ? "#eab308" : "#ef4444";

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">{pred.homeTeam}</span>
          <span className="text-gray-500 text-xs">vs</span>
          <span className="text-sm font-bold text-white">{pred.awayTeam}</span>
        </div>
        <span className="text-xs text-gray-500">{format(new Date(pred.savedAt), "MMM d, yyyy")}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs bg-gray-800 px-2 py-1 rounded">{pred.league}</span>
        <span className="text-xs text-gray-500">Matchday {pred.matchdayPosition}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">
          {pred.result.predictedScore}
        </span>
        <div className="flex items-center gap-2">
          <span
            className="text-lg font-extrabold"
            style={{ color: confidenceColor(pred.result.confidence) }}
          >
            {pred.result.confidence}%
          </span>
          <Tag
            text={pred.result.valueRating}
            variant={pred.result.valueRating === "HIGH" ? "SAFE" : pred.result.valueRating === "MEDIUM" ? "VALUE" : "RISKY"}
          />
        </div>
      </div>
    </div>
  );
}