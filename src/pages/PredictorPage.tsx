import { useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { DataService } from "@/lib/predictor/DataService";
import { PredictionSkeleton } from "@/components/skeleton/PredictionSkeleton";
import { Tag } from "@/components/ui/Tag";
import { useSavePrediction } from "@/features/history/usePredictionHistory";
import { predict } from "@/features/predictor/engine/predictor";
import type { FormEntry, MatchPrediction } from "@/features/predictor/engine/predictor";
import toast from "react-hot-toast";
import { PLAN_LIMITS } from "@/utils/constants";

function ProbBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span className="font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="w-full bg-white/[0.06] rounded-full h-2.5 overflow-hidden">
        <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

function FormBuilder({ label, form, setForm }: { label: string; form: FormEntry[]; setForm: (f: FormEntry[]) => void }) {
  const addEntry = (result: "W" | "D" | "L") => {
    if (form.length >= 5) return;
    const goals = result === "W" ? 2 : result === "D" ? 1 : 0;
    const conceded = result === "W" ? 0 : result === "D" ? 1 : 2;
    setForm([...form, { result, goals, conceded }]);
  };
  const removeEntry = (i: number) => setForm(form.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 uppercase tracking-widest">{label}</p>
      <div className="flex gap-2 flex-wrap">
        {["W", "D", "L"].map((r) => (
          <button
            key={r}
            onClick={() => addEntry(r as "W" | "D" | "L")}
            disabled={form.length >= 5}
            className={`px-3 py-1.5 rounded text-xs font-bold transition ${
              r === "W" ? "bg-green-600 hover:bg-green-500 text-white" : r === "D" ? "bg-yellow-600 hover:bg-yellow-500 text-white" : "bg-red-600 hover:bg-red-500 text-white"
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            +{r}
          </button>
        ))}
        {form.length > 0 && <button onClick={() => setForm([])} className="px-3 py-1.5 rounded text-xs text-gray-400 border border-gray-600 hover:bg-gray-700">Clear</button>}
      </div>
      <div className="flex flex-wrap gap-2">
        {form.map((f, i) => (
          <div key={i} className={`flex items-center gap-1 rounded px-2 py-1 text-xs border ${
            f.result === "W" ? "border-green-600/50 bg-green-900/20" : f.result === "D" ? "border-yellow-600/50 bg-yellow-900/20" : "border-red-600/50 bg-red-900/20"
          }`}>
            <span className={`font-bold ${f.result === "W" ? "text-green-400" : f.result === "D" ? "text-yellow-400" : "text-red-400"}`}>{f.result}</span>
            <span className="text-white">{f.goals}-{f.conceded}</span>
            <button onClick={() => removeEntry(i)} className="text-gray-500 hover:text-red-400 ml-1">×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CircularProgress({ value, label, color }: { value: number; label: string; color: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" transform="rotate(-90 44 44)" style={{ transition: "stroke-dasharray 0.8s ease" }} />
        <text x="44" y="49" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{value}%</text>
      </svg>
      <span className="text-[11px] text-gray-400 text-center leading-tight">{label}</span>
    </div>
  );
}

export default function PredictorPage() {
  const { user, predictor, updatePredictor } = useAppStore();
  const [activeTab, setActiveTab] = useState<"tips" | "signals" | "stats">("tips");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchPrediction | null>(null);

  const { mutate: savePrediction, isPending: isSaving } = useSavePrediction();

  const leagues = useMemo(() => DataService.getLeagues(), []);
  const leagueTeams = useMemo(() => DataService.getTeams(predictor.selectedLeague), [predictor.selectedLeague]);
  const homeTeam = useMemo(() => leagueTeams.find(t => t.id === predictor.homeTeamId) ?? leagueTeams[0], [leagueTeams, predictor.homeTeamId]);
  const awayTeam = useMemo(() => leagueTeams.find(t => t.id === predictor.awayTeamId) ?? leagueTeams[1], [leagueTeams, predictor.awayTeamId]);

  const limit = PLAN_LIMITS[user?.plan ?? "free"] ?? 5;
  const used = user?.predictionsUsed ?? 0;
  const canPredict = used < limit;

  const handlePredict = () => {
    if (predictor.homeTeamId === predictor.awayTeamId) return;
    setLoading(true);
    setTimeout(() => {
      const pred = predict(homeTeam, awayTeam, predictor.homeForm, predictor.awayForm, predictor.matchdayPos, predictor.oddsHome ? parseFloat(predictor.oddsHome) : undefined, predictor.oddsX ? parseFloat(predictor.oddsX) : undefined, predictor.oddsAway ? parseFloat(predictor.oddsAway) : undefined);
      setResult(pred);
      setLoading(false);
    }, 800);
  };

  const handleSave = () => {
    if (!result) return;
    savePrediction({
      homeTeam: homeTeam.name,
      awayTeam: awayTeam.name,
      league: predictor.selectedLeague,
      result,
      matchdayPosition: predictor.matchdayPos,
      notes: null,
    }, {
      onSuccess: () => toast.success("Prediction saved!"),
      onError: () => toast.error("Failed to save"),
    });
  };

  const confidenceColor = (c: number) => c >= 75 ? "#22c55e" : c >= 60 ? "#eab308" : "#ef4444";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-white">Match Predictor</h1>
        <span className="text-xs text-gray-400">{used} / {limit} predictions used</span>
      </div>

      {!canPredict && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-sm text-yellow-300">
          ⚠️ You've used all your predictions. <a href="/pricing" className="underline text-green-400">Upgrade to Pro</a> for more.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Setup Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-green-400">Live Session Sync</h2>
              <p className="text-[10px] text-gray-500">Last updated: {new Date().toLocaleTimeString()}</p>
            </div>
            <button onClick={() => window.location.reload()} className="p-2 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition">
              🔄 Refresh
            </button>
          </div>

          <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-4 space-y-3">
             <h2 className="text-sm font-bold text-green-400 uppercase tracking-widest">🚀 Upcoming Matches</h2>
             <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                {DataService.getLiveMatches().map((m: any, i: number) => (
                  <button key={i} onClick={() => {
                      const [h, a] = m.teams.split('-').map((s: string) => s.trim());
                      const hTeam = leagueTeams.find(t => t.shortName === h || t.id === h);
                      const aTeam = leagueTeams.find(t => t.shortName === a || t.id === a);
                      if (hTeam && aTeam) {
                        updatePredictor({ homeTeamId: hTeam.id, awayTeamId: aTeam.id, oddsHome: m.odds.home, oddsX: m.odds.draw, oddsAway: m.odds.away });
                      }
                  }} className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl p-3 flex justify-between items-center transition group">
                    <div className="text-left">
                      <p className="text-xs font-bold text-white group-hover:text-green-400 transition">{m.teams}</p>
                      <p className="text-[10px] text-gray-500">Odds: {m.odds.home} | {m.odds.draw} | {m.odds.away}</p>
                    </div>
                    <span className="text-xs text-green-500 font-bold opacity-0 group-hover:opacity-100 transition">PREDICT →</span>
                  </button>
                ))}
                {DataService.getLiveMatches().length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-4 italic">No live matches synced. Run 'node scripts/fetch_live_odds.js' to sync.</p>
                )}
             </div>
          </div>
<div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-4 space-y-3">
             <h2 className="text-sm font-bold text-green-400 uppercase tracking-widest">🏟️ Select League</h2>
<div className="grid grid-cols-3 gap-2">
               {leagues.map(l => (
                 <button key={l.id} onClick={() => { 
                    const teams = DataService.getTeams(l.id);
                    updatePredictor({ selectedLeague: l.id, homeTeamId: teams[0].id, awayTeamId: teams[1].id }); 
                    setResult(null); 
                  }}
                   className={`py-2 px-2 rounded-lg text-xs font-bold transition ${predictor.selectedLeague === l.id ? "bg-green-600 text-white shadow-lg shadow-green-500/20" : "bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] border border-white/[0.06]"}`}>
                   {l.name}
                 </button>
               ))}
            </div>
          </div>

<div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-4 space-y-4">
             <h2 className="text-sm font-bold text-green-400 uppercase tracking-widest">🆚 Match Setup</h2>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 uppercase tracking-wider">🏠 Home Team</label>
<select value={predictor.homeTeamId} onChange={e => { updatePredictor({ homeTeamId: e.target.value }); setResult(null); }}
                 className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/50 [&>option]:bg-[#1a1a24] [&>option]:text-white">
                 {leagueTeams.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.name} ({t.shortName})</option>)}
              </select>
            </div>
            <button onClick={() => { updatePredictor({ homeTeamId: predictor.awayTeamId, awayTeamId: predictor.homeTeamId }); setResult(null); }}
              className="w-full bg-white/[0.04] hover:bg-white/[0.06] rounded-lg text-gray-400 text-xs transition">⇅ Swap Teams</button>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 uppercase tracking-wider">✈️ Away Team</label>
<select value={predictor.awayTeamId} onChange={e => { updatePredictor({ awayTeamId: e.target.value }); setResult(null); }}
                 className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/50 [&>option]:bg-[#1a1a24] [&>option]:text-white">
                 {leagueTeams.filter(t => t.id !== predictor.homeTeamId).map(t => <option key={t.id} value={t.id}>{t.emoji} {t.name} ({t.shortName})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 uppercase tracking-wider">📍 Match Position: <span className="text-white font-bold">{predictor.matchdayPos}</span></label>
              <input type="range" min={1} max={10} value={predictor.matchdayPos} onChange={e => updatePredictor({ matchdayPos: parseInt(e.target.value) })} className="w-full accent-green-500" />
            </div>
          </div>

<div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-4 space-y-3">
             <h2 className="text-sm font-bold text-green-400 uppercase tracking-widest">💰 Odds (optional)</h2>
            <div className="grid grid-cols-3 gap-2">
              {[{ label: "Home (1)", key: "oddsHome" }, { label: "Draw (X)", key: "oddsX" }, { label: "Away (2)", key: "oddsAway" }].map(o => (
                <div key={o.key} className="space-y-1">
                  <label className="text-[10px] text-gray-400">{o.label}</label>
                  <input type="number" step="0.01" min="1" placeholder="e.g. 1.85" value={predictor[o.key as keyof typeof predictor] as string}
                    onChange={e => updatePredictor({ [o.key]: e.target.value })} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-green-500/50" />
                </div>
              ))}
            </div>
          </div>

<div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-4 space-y-4">
             <h2 className="text-sm font-bold text-green-400 uppercase tracking-widest">📋 Recent Form</h2>
            <FormBuilder label={homeTeam.name} form={predictor.homeForm} setForm={f => updatePredictor({ homeForm: f })} />
            <div className="border-t border-white/[0.06] pt-3">
              <FormBuilder label={awayTeam.name} form={predictor.awayForm} setForm={f => updatePredictor({ awayForm: f })} />
            </div>
          </div>

          <button onClick={handlePredict} disabled={loading || predictor.homeTeamId === predictor.awayTeamId || !canPredict}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-extrabold text-lg tracking-wide transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-green-900/40">
            {loading ? "⏳ Analyzing..." : "🔮 PREDICT MATCH"}
          </button>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3 space-y-4">
{!result && !loading && (
             <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-4 min-h-[400px] relative overflow-hidden">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-green-500/5 blur-[80px] pointer-events-none" />
               <div className="text-6xl relative z-10">🔮</div>
               <h3 className="text-xl font-bold text-white relative z-10">Ready to Analyse</h3>
               <p className="text-gray-500 text-sm max-w-xs relative z-10">Select teams, enter form data and odds, then hit Predict Match.</p>
             </div>
           )}

          {loading && <PredictionSkeleton />}

          {result && !loading && (
            <div className="space-y-4">
              {/* Match Header */}
              <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-2xl">{homeTeam.emoji}</div>
                      <div className="text-sm font-bold mt-1">{homeTeam.shortName}</div>
                    </div>
                    <div className="text-center px-4">
                      <div className="text-xl font-extrabold text-green-400">{result.predictedScore}</div>
                      <div className="text-[10px] text-gray-500">PREDICTED</div>
                      <div className="text-[10px] text-gray-400">xG {result.expectedGoals}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl">{awayTeam.emoji}</div>
                      <div className="text-sm font-bold mt-1">{awayTeam.shortName}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Tag text={`${result.valueRating} VALUE`} variant={result.valueRating === "HIGH" ? "SAFE" : result.valueRating === "MEDIUM" ? "VALUE" : "RISKY"} />
                    <Tag text={`${result.riskLevel} RISK`} variant={result.riskLevel === "LOW" ? "SAFE" : result.riskLevel === "MEDIUM" ? "VALUE" : "RISKY"} />
                    {result.activatorAlert && <Tag text="⚡ ACTIVATOR" variant="VALUE" />}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Confidence</span>
                    <span className="font-bold" style={{ color: confidenceColor(result.confidence) }}>{result.confidence}%</span>
                  </div>
                  <div className="w-full bg-white/[0.06] rounded-full h-3 overflow-hidden">
                    <div className="h-3 rounded-full transition-all duration-1000" style={{ width: `${result.confidence}%`, background: `linear-gradient(90deg, ${confidenceColor(result.confidence)}, #86efac)` }} />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button onClick={handleSave} disabled={isSaving || !result} className={`px-4 py-2 rounded-lg text-xs font-bold text-white ${isSaving ? "opacity-50" : "bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08]"}`}>
                      {isSaving ? "💾 Saving..." : "💾 Save"}
                    </button>
                  </div>
                  {result.recommendedStake && (
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-gray-500 uppercase">Suggested Stake</span>
                      <span className="text-sm font-black text-green-400">{result.recommendedStake}% of Bankroll</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Probability Circles */}
              <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Probabilities</h3>
                <div className="flex justify-around flex-wrap gap-4">
                  <CircularProgress value={result.homeWinProb} label={`${homeTeam.shortName} Win`} color="#22c55e" />
                  <CircularProgress value={result.drawProb} label="Draw" color="#eab308" />
                  <CircularProgress value={result.awayWinProb} label={`${awayTeam.shortName} Win`} color="#ef4444" />
                </div>
              </div>

              {/* Goal Markets */}
              <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Goals Market</h3>
                <ProbBar label="Over 1.5 Goals" value={result.over15Prob} color="#22c55e" />
                <ProbBar label="Over 2.5 Goals" value={result.over25Prob} color="#3b82f6" />
                <ProbBar label="Over 3.5 Goals" value={result.over35Prob} color="#a855f7" />
                <ProbBar label="BTTS" value={result.bttsProb} color="#f97316" />
              </div>

              {/* Tabs */}
              <div className="bg-[#111118] border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="flex border-b border-white/[0.06]">
                  {(["tips", "signals", "stats"] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition ${activeTab === tab ? "bg-white/[0.04] text-green-400 border-b-2 border-green-500" : "text-gray-500 hover:text-gray-300"}`}>
                      {tab === "tips" ? "🎯 Bet Tips" : tab === "signals" ? "📡 Signals" : "📊 Stats"}
                    </button>
                  ))}
                </div>
                <div className="p-4">
                  {activeTab === "tips" && (
                    <div className="space-y-3">
{result.tips.map((tip, i) => (
                         <div key={i} className={`rounded-xl p-4 border ${tip.tag === "SAFE" ? "bg-green-500/5 border-green-500/20" : tip.tag === "VALUE" ? "bg-yellow-500/5 border-yellow-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase">{tip.market}</p>
                              <p className="font-bold text-white text-sm">{tip.pick}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-extrabold" style={{ color: confidenceColor(tip.confidence) }}>{tip.confidence}%</span>
                              <Tag text={tip.tag} variant={tip.tag} />
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">{tip.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeTab === "signals" && (
                    <div className="space-y-2">
{result.signals.map((s, i) => (
                         <div key={i} className="bg-white/[0.03] rounded-lg px-4 py-3 text-xs text-gray-300 border border-white/[0.06]">{s}</div>
                       ))}
                       <div className="mt-3 bg-green-500/5 border border-green-500/20 rounded-lg px-4 py-3 text-xs text-green-400/80">
                        <strong>Algo Note:</strong> VFL uses pseudo-RNG constrained by team Strength Values. Significant deviations from ARpt create statistical pressure for regression.
                      </div>
                    </div>
                  )}
                  {activeTab === "stats" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Home SV", value: homeTeam.strengthValue, color: "#22c55e" },
                          { label: "Away SV", value: awayTeam.strengthValue, color: "#ef4444" },
                          { label: "Home GP", value: homeTeam.goalPower, color: "#3b82f6" },
                          { label: "Away GP", value: awayTeam.goalPower, color: "#f97316" },
                          { label: "Home Def", value: homeTeam.defensePower, color: "#22c55e" },
                          { label: "Away Def", value: awayTeam.defensePower, color: "#ef4444" },
                        ].map(stat => (
                          <div key={stat.label} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-400">{stat.label}</span>
                              <span className="font-bold" style={{ color: stat.color }}>{stat.value}</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full" style={{ width: `${stat.value}%`, background: stat.color }} />
                            </div>
                          </div>
                        ))}
                      </div>
{result.formAnalysis && (
                         <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                          <p className="text-[10px] text-gray-500 uppercase mb-1">Form Summary</p>
                          <p className="text-xs text-gray-300">{result.formAnalysis}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}