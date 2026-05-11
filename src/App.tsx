import { useState, useMemo } from "react";
import { ALL_LEAGUES, EPL_TEAMS } from "./data/teamsData";
import type { Team } from "./data/teamsData";
import { predict } from "./engine/predictor";
import type { FormEntry, MatchPrediction } from "./engine/predictor";

// ─── Helper components ─────────────────────────────────────

function ProbBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span className="font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-2.5 rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}

function Tag({ text, variant }: { text: string; variant: "SAFE" | "VALUE" | "RISKY" | "INFO" }) {
  const styles = {
    SAFE: "bg-green-600/20 text-green-400 border-green-600/40",
    VALUE: "bg-yellow-600/20 text-yellow-400 border-yellow-600/40",
    RISKY: "bg-red-600/20 text-red-400 border-red-600/40",
    INFO: "bg-blue-600/20 text-blue-400 border-blue-600/40",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${styles[variant]}`}>
      {text}
    </span>
  );
}

function FormBuilder({
  label,
  form,
  setForm,
}: {
  label: string;
  form: FormEntry[];
  setForm: (f: FormEntry[]) => void;
}) {
  const addEntry = (result: "W" | "D" | "L") => {
    if (form.length >= 5) return;
    const goals = result === "W" ? 2 : result === "D" ? 1 : 0;
    const conceded = result === "W" ? 0 : result === "D" ? 1 : 2;
    setForm([...form, { result, goals, conceded }]);
  };
  const removeEntry = (i: number) => setForm(form.filter((_, idx) => idx !== i));
  const updateGoals = (i: number, field: "goals" | "conceded", v: number) => {
    const updated = [...form];
    updated[i] = { ...updated[i], [field]: v };
    setForm(updated);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 uppercase tracking-widest">{label} — Last 5 Results</p>
      <div className="flex gap-2 flex-wrap">
        {["W", "D", "L"].map((r) => (
          <button
            key={r}
            onClick={() => addEntry(r as "W" | "D" | "L")}
            disabled={form.length >= 5}
            className={`px-3 py-1.5 rounded text-xs font-bold transition ${
              r === "W"
                ? "bg-green-600 hover:bg-green-500 text-white"
                : r === "D"
                ? "bg-yellow-600 hover:bg-yellow-500 text-white"
                : "bg-red-600 hover:bg-red-500 text-white"
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            +{r}
          </button>
        ))}
        {form.length > 0 && (
          <button
            onClick={() => setForm([])}
            className="px-3 py-1.5 rounded text-xs text-gray-400 border border-gray-600 hover:bg-gray-700"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {form.map((f, i) => (
          <div
            key={i}
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs border ${
              f.result === "W"
                ? "border-green-600/50 bg-green-900/20"
                : f.result === "D"
                ? "border-yellow-600/50 bg-yellow-900/20"
                : "border-red-600/50 bg-red-900/20"
            }`}
          >
            <span className={`font-bold ${f.result === "W" ? "text-green-400" : f.result === "D" ? "text-yellow-400" : "text-red-400"}`}>
              {f.result}
            </span>
            <input
              type="number"
              min={0}
              max={9}
              value={f.goals}
              onChange={(e) => updateGoals(i, "goals", parseInt(e.target.value) || 0)}
              className="w-6 bg-transparent text-white text-center border-b border-gray-600 outline-none"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              min={0}
              max={9}
              value={f.conceded}
              onChange={(e) => updateGoals(i, "conceded", parseInt(e.target.value) || 0)}
              className="w-6 bg-transparent text-white text-center border-b border-gray-600 outline-none"
            />
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
        <circle cx="44" cy="44" r={r} fill="none" stroke="#374151" strokeWidth="6" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        <text x="44" y="49" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
          {value}%
        </text>
      </svg>
      <span className="text-[11px] text-gray-400 text-center leading-tight">{label}</span>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────

export default function App() {
  const [selectedLeague, setSelectedLeague] = useState("EPL");
  const [homeTeamId, setHomeTeamId] = useState("MNC");
  const [awayTeamId, setAwayTeamId] = useState("EVE");
  const [homeForm, setHomeForm] = useState<FormEntry[]>([]);
  const [awayForm, setAwayForm] = useState<FormEntry[]>([]);
  const [matchdayPos, setMatchdayPos] = useState(1);
  const [oddsHome, setOddsHome] = useState("");
  const [oddsX, setOddsX] = useState("");
  const [oddsAway, setOddsAway] = useState("");
  const [result, setResult] = useState<MatchPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"tips" | "signals" | "stats">("tips");

  const leagueTeams = useMemo(
    () => ALL_LEAGUES.find((l) => l.id === selectedLeague)?.teams ?? EPL_TEAMS,
    [selectedLeague]
  );

  const homeTeam = useMemo(
    () => leagueTeams.find((t) => t.id === homeTeamId) ?? leagueTeams[0],
    [leagueTeams, homeTeamId]
  );
  const awayTeam = useMemo(
    () => leagueTeams.find((t) => t.id === awayTeamId) ?? leagueTeams[1],
    [leagueTeams, awayTeamId]
  );

  const handlePredict = () => {
    if (homeTeamId === awayTeamId) return;
    setLoading(true);
    setTimeout(() => {
      const pred = predict(
        homeTeam,
        awayTeam,
        homeForm,
        awayForm,
        matchdayPos,
        oddsHome ? parseFloat(oddsHome) : undefined,
        oddsX ? parseFloat(oddsX) : undefined,
        oddsAway ? parseFloat(oddsAway) : undefined
      );
      setResult(pred);
      setLoading(false);
    }, 800);
  };

  const confidenceColor = (c: number) =>
    c >= 75 ? "#22c55e" : c >= 60 ? "#eab308" : "#ef4444";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ── Header ── */}
      <header className="bg-gradient-to-r from-gray-900 via-green-950 to-gray-900 border-b border-green-900/40 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-xl">⚽</div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-white">
                VFL AI Predictor
              </h1>
              <p className="text-[11px] text-green-400 font-medium tracking-widest uppercase">
                Virtual Football League · Deep Analysis Engine
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Algorithm Engine Active
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* ── Disclaimer ── */}
        <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-xl px-4 py-3 text-xs text-yellow-300 flex gap-2">
          <span className="text-lg">⚠️</span>
          <div>
            <strong>Educational Tool Only.</strong> VFL outcomes are driven by certified RNG algorithms. No tool can guarantee wins. This predictor applies statistical modelling, strength-value analysis, and probability theory to identify smart betting patterns. Always gamble responsibly. Never bet more than you can afford to lose.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── LEFT: Setup Panel ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* League Select */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-bold text-green-400 uppercase tracking-widest">🏟️ Select League</h2>
              <div className="grid grid-cols-3 gap-2">
                {ALL_LEAGUES.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      setSelectedLeague(l.id);
                      const t = l.teams;
                      setHomeTeamId(t[0].id);
                      setAwayTeamId(t[1].id);
                      setResult(null);
                    }}
                    className={`py-2 px-2 rounded-lg text-xs font-bold transition ${
                      selectedLeague === l.id
                        ? "bg-green-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Team Selection */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-4">
              <h2 className="text-sm font-bold text-green-400 uppercase tracking-widest">🆚 Match Setup</h2>

              {/* Home */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 uppercase tracking-wider">🏠 Home Team</label>
                <select
                  value={homeTeamId}
                  onChange={(e) => { setHomeTeamId(e.target.value); setResult(null); }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-500"
                >
                  {leagueTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.emoji} {t.name} ({t.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Swap button */}
              <button
                onClick={() => { setHomeTeamId(awayTeamId); setAwayTeamId(homeTeamId); setResult(null); }}
                className="w-full py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 text-xs transition flex items-center justify-center gap-2"
              >
                ⇅ Swap Teams
              </button>

              {/* Away */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 uppercase tracking-wider">✈️ Away Team</label>
                <select
                  value={awayTeamId}
                  onChange={(e) => { setAwayTeamId(e.target.value); setResult(null); }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-500"
                >
                  {leagueTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.emoji} {t.name} ({t.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Matchday position */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 uppercase tracking-wider">
                  🗓️ Matchday Position: <span className="text-white font-bold">{matchdayPos}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={matchdayPos}
                  onChange={(e) => setMatchdayPos(parseInt(e.target.value))}
                  className="w-full accent-green-500"
                />
                <p className="text-[10px] text-gray-500">Position 2,3,5,6 are statistically productive matchday slots</p>
              </div>
            </div>

            {/* Bookmaker Odds */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-bold text-green-400 uppercase tracking-widest">💰 Bookmaker Odds (optional)</h2>
              <p className="text-[11px] text-gray-500">Enter the live odds to detect VALUE bets where the bookmaker is underpricing an outcome</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400">Home (1)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="e.g. 1.85"
                    value={oddsHome}
                    onChange={(e) => setOddsHome(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400">Draw (X)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="e.g. 3.40"
                    value={oddsX}
                    onChange={(e) => setOddsX(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400">Away (2)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="e.g. 4.50"
                    value={oddsAway}
                    onChange={(e) => setOddsAway(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Form Builder */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-4">
              <h2 className="text-sm font-bold text-green-400 uppercase tracking-widest">📋 Recent Form</h2>
              <p className="text-[11px] text-gray-500">Enter last results to enable RNG regression-to-mean analysis</p>
              <FormBuilder label={homeTeam.name} form={homeForm} setForm={setHomeForm} />
              <div className="border-t border-gray-800 pt-3">
                <FormBuilder label={awayTeam.name} form={awayForm} setForm={setAwayForm} />
              </div>
            </div>

            {/* Predict Button */}
            <button
              onClick={handlePredict}
              disabled={loading || homeTeamId === awayTeamId}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-extrabold text-lg tracking-wide transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-green-900/40"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Analysing...
                </span>
              ) : (
                "🔮 PREDICT MATCH"
              )}
            </button>
          </div>

          {/* ── RIGHT: Results Panel ── */}
          <div className="lg:col-span-3 space-y-4">
            {!result && !loading && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-4 min-h-[400px]">
                <div className="text-6xl">🔮</div>
                <h3 className="text-xl font-bold text-white">Ready to Analyse</h3>
                <p className="text-gray-500 text-sm max-w-xs">
                  Select your teams, enter form data and odds, then hit <strong>Predict Match</strong> to get a deep statistical breakdown.
                </p>
                <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-2">
                  {[
                    "✅ RNG Algorithm Modelling",
                    "✅ Strength Value Engine",
                    "✅ Form Regression Analysis",
                    "✅ H2H Indicator System",
                    "✅ xG Expected Goals",
                    "✅ Value Bet Detection",
                  ].map((f) => (
                    <div key={f} className="bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300">{f}</div>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="w-16 h-16 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
                <p className="text-green-400 font-semibold">Running deep analysis...</p>
                <p className="text-gray-500 text-xs">Applying RNG models, SV comparison & H2H indicators</p>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-4">
                {/* Match Header */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-2xl">{homeTeam.emoji}</div>
                        <div className="text-sm font-bold mt-1">{homeTeam.shortName}</div>
                        <div className="text-[10px] text-gray-500 capitalize">{homeTeam.category}</div>
                      </div>
                      <div className="text-center px-4">
                        <div className="text-xl font-extrabold text-green-400">{result.predictedScore}</div>
                        <div className="text-[10px] text-gray-500 mt-1">PREDICTED</div>
                        <div className="text-[10px] text-gray-400">xG {result.expectedGoals}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl">{awayTeam.emoji}</div>
                        <div className="text-sm font-bold mt-1">{awayTeam.shortName}</div>
                        <div className="text-[10px] text-gray-500 capitalize">{awayTeam.category}</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 items-end">
                      <div className="flex gap-2">
                        <Tag text={`${result.valueRating} VALUE`} variant={result.valueRating === "HIGH" ? "SAFE" : result.valueRating === "MEDIUM" ? "VALUE" : "RISKY"} />
                        <Tag text={`${result.riskLevel} RISK`} variant={result.riskLevel === "LOW" ? "SAFE" : result.riskLevel === "MEDIUM" ? "VALUE" : "RISKY"} />
                      </div>
                      {result.activatorAlert && (
                        <Tag text="⚡ ACTIVATOR MATCH" variant="VALUE" />
                      )}
                    </div>
                  </div>

                  {/* Confidence meter */}
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Overall Model Confidence</span>
                      <span className="font-bold" style={{ color: confidenceColor(result.confidence) }}>
                        {result.confidence}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 rounded-full transition-all duration-1000"
                        style={{
                          width: `${result.confidence}%`,
                          background: `linear-gradient(90deg, ${confidenceColor(result.confidence)}, #86efac)`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Probability Circles */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Match Result Probabilities</h3>
                  <div className="flex justify-around flex-wrap gap-4">
                    <CircularProgress value={result.homeWinProb} label={`${homeTeam.shortName} Win`} color="#22c55e" />
                    <CircularProgress value={result.drawProb} label="Draw" color="#eab308" />
                    <CircularProgress value={result.awayWinProb} label={`${awayTeam.shortName} Win`} color="#ef4444" />
                  </div>
                </div>

                {/* Goal Markets */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Goals Market Probabilities</h3>
                  <ProbBar label="Over 1.5 Goals" value={result.over15Prob} color="#22c55e" />
                  <ProbBar label="Over 2.5 Goals" value={result.over25Prob} color="#3b82f6" />
                  <ProbBar label="Over 3.5 Goals" value={result.over35Prob} color="#a855f7" />
                  <ProbBar label="Both Teams To Score (BTTS)" value={result.bttsProb} color="#f97316" />
                </div>

                {/* Tabs */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="flex border-b border-gray-800">
                    {(["tips", "signals", "stats"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition ${
                          activeTab === tab
                            ? "bg-gray-800 text-green-400 border-b-2 border-green-500"
                            : "text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        {tab === "tips" ? "🎯 Bet Tips" : tab === "signals" ? "📡 Signals" : "📊 Stats"}
                      </button>
                    ))}
                  </div>

                  <div className="p-4">
                    {/* Tips */}
                    {activeTab === "tips" && (
                      <div className="space-y-3">
                        {result.tips.map((tip, i) => (
                          <div
                            key={i}
                            className={`rounded-xl p-4 border space-y-2 ${
                              tip.tag === "SAFE"
                                ? "bg-green-900/15 border-green-700/30"
                                : tip.tag === "VALUE"
                                ? "bg-yellow-900/15 border-yellow-700/30"
                                : "bg-red-900/15 border-red-700/30"
                            }`}
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest">{tip.market}</p>
                                <p className="font-bold text-white text-sm mt-0.5">{tip.pick}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <p className="text-[10px] text-gray-500">Confidence</p>
                                  <p
                                    className="text-lg font-extrabold"
                                    style={{ color: confidenceColor(tip.confidence) }}
                                  >
                                    {tip.confidence}%
                                  </p>
                                </div>
                                <Tag text={tip.tag} variant={tip.tag} />
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed">{tip.reasoning}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Signals */}
                    {activeTab === "signals" && (
                      <div className="space-y-2">
                        {result.signals.length === 0 && (
                          <p className="text-gray-500 text-sm text-center py-6">No special signals detected. Enter form data for deeper analysis.</p>
                        )}
                        {result.signals.map((s, i) => (
                          <div key={i} className="bg-gray-800/60 rounded-lg px-4 py-3 text-xs text-gray-300 leading-relaxed border border-gray-700/40">
                            {s}
                          </div>
                        ))}
                        <div className="mt-3 bg-blue-900/20 border border-blue-700/30 rounded-lg px-4 py-3 text-xs text-blue-300">
                          <strong>Algorithm Note:</strong> VFL uses pseudo-RNG constrained by team Strength Values (SV) and Allocated Result Percentages (ARpt). Significant deviations from ARpt create statistical pressure for the algorithm to regress towards expected distributions.
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    {activeTab === "stats" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: "Home SV", value: homeTeam.strengthValue, max: 100, color: "#22c55e" },
                            { label: "Away SV", value: awayTeam.strengthValue, max: 100, color: "#ef4444" },
                            { label: "Home Goal Power", value: homeTeam.goalPower, max: 100, color: "#3b82f6" },
                            { label: "Away Goal Power", value: awayTeam.goalPower, max: 100, color: "#f97316" },
                            { label: "Home Defence", value: homeTeam.defensePower, max: 100, color: "#22c55e" },
                            { label: "Away Defence", value: awayTeam.defensePower, max: 100, color: "#ef4444" },
                            { label: "Home Win Rate", value: Math.round(homeTeam.winRate * 100), max: 100, color: "#22c55e" },
                            { label: "Away Win Rate", value: Math.round(awayTeam.winRate * 100), max: 100, color: "#ef4444" },
                          ].map((stat) => (
                            <div key={stat.label} className="bg-gray-800 rounded-lg p-3 space-y-1.5">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-400">{stat.label}</span>
                                <span className="font-bold" style={{ color: stat.color }}>{stat.value}</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-1.5">
                                <div
                                  className="h-1.5 rounded-full"
                                  style={{ width: `${(stat.value / stat.max) * 100}%`, background: stat.color }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        {result.formAnalysis && (
                          <div className="bg-gray-800 rounded-lg p-3">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Form Summary</p>
                            <p className="text-xs text-gray-300">{result.formAnalysis}</p>
                          </div>
                        )}

                        {/* Category info */}
                        <div className="bg-gray-800/60 rounded-lg p-3 space-y-2">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Team Category Analysis</p>
                          {[homeTeam, awayTeam].map((t: Team) => (
                            <div key={t.id} className="flex gap-2 items-center text-xs">
                              <span>{t.emoji}</span>
                              <span className="text-white font-medium">{t.name}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                t.category === "strong" ? "bg-green-600/20 text-green-400" :
                                t.category === "balance" ? "bg-yellow-600/20 text-yellow-400" :
                                "bg-red-600/20 text-red-400"
                              }`}>{t.category.toUpperCase()}</span>
                              {t.isGoalActivator && <span className="text-yellow-400 text-[10px]">⚡ ACTIVATOR</span>}
                              <span className="text-gray-500 ml-auto">ARpt: {Math.round(t.winRate*100)}W / {Math.round(t.drawRate*100)}D / {Math.round(t.lossRate*100)}L</span>
                            </div>
                          ))}
                          <p className="text-[10px] text-gray-600 leading-relaxed mt-1">
                            Strong teams carry 60% win weight · Balance teams 30% · Weak teams 10% (VFL Algorithm basis)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Info Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
          {[
            {
              icon: "🧠",
              title: "RNG Regression Model",
              desc: "VFL uses Pseudo-RNG constrained by team Strength Values. When a team deviates far from its Allocated Result Percentage, the algorithm statistically corrects — our engine detects these windows.",
            },
            {
              icon: "⚡",
              title: "League Activator System",
              desc: "Every VFL league has 1–2 'Goal Activator' teams hardcoded to produce high-scoring matches. These teams elevate Over 2.5, Over 3.5, and BTTS markets significantly beyond normal probability.",
            },
            {
              icon: "💰",
              title: "Value Bet Detection",
              desc: "By reverse-engineering the bookmaker's implied probability from their odds and comparing to our model probability, we identify markets where the bookmaker systematically underprices outcomes.",
            },
          ].map((card) => (
            <div key={card.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-2">
              <div className="text-2xl">{card.icon}</div>
              <h3 className="text-sm font-bold text-white">{card.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-[10px] text-gray-700 pb-4">
          VFL AI Predictor · For educational & research purposes only · Gambling involves risk · Bet responsibly
        </p>
      </main>
    </div>
  );
}
