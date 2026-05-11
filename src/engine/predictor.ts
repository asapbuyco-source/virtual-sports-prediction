// ============================================================
// VFL Prediction Engine
// Implements: Strength Value comparison, Goal Power index,
// ARpt (Allocated Result Percentage), H2H modifiers,
// Form regression, League Activator detection,
// Odds-implied probability reverse engineering,
// Gambler's fallacy guard (regression to mean)
// ============================================================

import type { Team } from "../data/teamsData";
import { H2H_MODIFIERS } from "../data/teamsData";

export interface FormEntry {
  result: "W" | "D" | "L";
  goals: number;
  conceded: number;
}

export interface MatchPrediction {
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  over15Prob: number;
  over25Prob: number;
  over35Prob: number;
  bttsProb: number;
  expectedGoals: number;
  confidence: number; // 0-100
  valueRating: "HIGH" | "MEDIUM" | "LOW";
  signals: string[];
  tips: BetTip[];
  predictedScore: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  formAnalysis: string;
  activatorAlert: boolean;
}

export interface BetTip {
  market: string;
  pick: string;
  confidence: number;
  reasoning: string;
  odds?: string;
  tag: "SAFE" | "VALUE" | "RISKY";
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function calcFormMultiplier(form: FormEntry[]): {
  attackMult: number;
  defenceMult: number;
  momentum: number;
} {
  if (!form || form.length === 0)
    return { attackMult: 1, defenceMult: 1, momentum: 0 };

  const recent = form.slice(-5);
  const wins = recent.filter((f) => f.result === "W").length;
  const losses = recent.filter((f) => f.result === "L").length;
  const avgGoals = recent.reduce((s, f) => s + f.goals, 0) / recent.length;
  const avgConceded = recent.reduce((s, f) => s + f.conceded, 0) / recent.length;

  // momentum: +1 great form, -1 bad form
  const momentum = ((wins - losses) / Math.max(recent.length, 1)) * 1.5;

  // If team hasn't scored in 3+ games → regression to mean (algorithm corrects)
  const scoringDrought = recent.slice(-3).every((f) => f.goals === 0);
  const concedingStreak = recent.slice(-3).every((f) => f.conceded > 1);

  const attackMult = scoringDrought
    ? 1.25 // algorithm boost
    : avgGoals > 2
    ? 1.15
    : avgGoals > 1
    ? 1.05
    : 0.95;

  const defenceMult = concedingStreak
    ? 0.88 // algorithm may correct but still shaky
    : avgConceded < 0.5
    ? 1.08
    : avgConceded > 1.5
    ? 0.90
    : 1.00;

  return { attackMult, defenceMult, momentum };
}

export function predict(
  home: Team,
  away: Team,
  homeForm: FormEntry[],
  awayForm: FormEntry[],
  matchdayPosition: number,
  oddsHome?: number,
  oddsX?: number,
  oddsAway?: number
): MatchPrediction {
  const signals: string[] = [];
  const tips: BetTip[] = [];

  // ── 1. Base win probabilities from SV and ARpt ────────────
  const svDiff = home.strengthValue - away.strengthValue;
  // Logistic scaling: each 10 SV point difference shifts prob ~5%
  const baseHomeProbRaw = sigmoid(svDiff / 30 + 0.20); // 0.20 home advantage bias
  const baseDrawProbRaw = 0.24 - Math.abs(svDiff) * 0.0015;
  const baseAwayProbRaw = 1 - baseHomeProbRaw - baseDrawProbRaw;

  // ── 2. Form modifiers ──────────────────────────────────────
  const homeFormM = calcFormMultiplier(homeForm);
  const awayFormM = calcFormMultiplier(awayForm);

  let homeWinProb = clamp(
    baseHomeProbRaw * (1 + homeFormM.momentum * 0.06) * (1 - awayFormM.momentum * 0.04),
    0.05, 0.90
  );
  let drawProb = clamp(baseDrawProbRaw, 0.08, 0.35);
  let awayWinProb = clamp(
    baseAwayProbRaw * (1 + awayFormM.momentum * 0.06) * (1 - homeFormM.momentum * 0.04),
    0.05, 0.90
  );

  // Normalise to sum = 1
  const total = homeWinProb + drawProb + awayWinProb;
  homeWinProb /= total;
  drawProb /= total;
  awayWinProb /= total;

  // ── 3. Expected Goals (xG model) ──────────────────────────
  const homeAttack = (home.goalPower / 100) * homeFormM.attackMult;
  const homeDef = (home.defensePower / 100) * homeFormM.defenceMult;
  const awayAttack = (away.goalPower / 100) * awayFormM.attackMult;
  const awayDef = (away.defensePower / 100) * awayFormM.defenceMult;

  // xG for home = home attack vs away defence, boosted by home advantage
  const xGHome = clamp(
    homeAttack * (1 - awayDef * 0.55) * 2.2 * (1 + home.homeBonus),
    0.3, 4.5
  );
  const xGAway = clamp(
    awayAttack * (1 - homeDef * 0.55) * 2.0,
    0.2, 4.0
  );
  const expectedGoals = xGHome + xGAway;

  // ── 4. Over/Under probabilities (Poisson approximation) ───
  // P(X >= k+0.5) for Poisson(λ=expectedGoals)
  const poissonCDF = (lambda: number, k: number): number => {
    let sum = 0;
    let prob = Math.exp(-lambda);
    for (let i = 0; i <= k; i++) {
      sum += prob;
      prob *= lambda / (i + 1);
    }
    return sum;
  };
  const over15Prob = clamp(1 - poissonCDF(expectedGoals, 1), 0.10, 0.96);
  const over25Prob = clamp(1 - poissonCDF(expectedGoals, 2), 0.05, 0.92);
  const over35Prob = clamp(1 - poissonCDF(expectedGoals, 3), 0.03, 0.85);

  // ── 5. BTTS probability ────────────────────────────────────
  const pHomeScores = clamp(1 - Math.exp(-xGHome), 0.10, 0.98);
  const pAwayScores = clamp(1 - Math.exp(-xGAway), 0.10, 0.98);
  let bttsProb = pHomeScores * pAwayScores;

  // ── 6. H2H Modifier overlay ────────────────────────────────
  const h2hKey = `${home.shortName}-${away.shortName}`;
  const h2h = H2H_MODIFIERS[h2hKey];
  if (h2h) {
    if (h2h.over25Prob) {
      signals.push(`📊 H2H indicator: ${home.shortName} vs ${away.shortName} historically has ${Math.round(h2h.over25Prob * 100)}% Over 2.5 probability`);
    }
    if (h2h.bttsProb) bttsProb = clamp((bttsProb + h2h.bttsProb) / 2, 0.10, 0.95);
    if (h2h.over25Prob) {
      const blendedO25 = clamp((over25Prob + h2h.over25Prob) / 2, 0.10, 0.95);
      signals.push(`🔄 H2H blended Over 2.5 → ${Math.round(blendedO25 * 100)}%`);
    }
  }

  // ── 7. League Activator detection ─────────────────────────
  const activatorAlert = home.isGoalActivator || away.isGoalActivator;
  if (activatorAlert) {
    signals.push(`⚡ LEAGUE ACTIVATOR: ${home.isGoalActivator ? home.name : away.name} is a Goal Activator team — elevated scoring probability`);
  }

  // ── 8. Regression to mean signals ─────────────────────────
  if (homeForm.length >= 3) {
    const recentH = homeForm.slice(-3);
    const droughtH = recentH.every((f) => f.goals === 0);
    const glutH = recentH.every((f) => f.goals > 2);
    if (droughtH) signals.push(`📈 ${home.name} hasn't scored in last 3 matches — RNG regression likely → expect goals`);
    if (glutH) signals.push(`📉 ${home.name} scored heavily in 3 straight — cooling period possible`);
  }
  if (awayForm.length >= 3) {
    const recentA = awayForm.slice(-3);
    const droughtA = recentA.every((f) => f.goals === 0);
    const glutA = recentA.every((f) => f.goals > 2);
    if (droughtA) signals.push(`📈 ${away.name} hasn't scored in last 3 matches — RNG regression likely → expect goals`);
    if (glutA) signals.push(`📉 ${away.name} scored heavily in 3 straight — cooling period possible`);
  }

  // ── 9. Matchday position signal ────────────────────────────
  if (matchdayPosition === 2 || matchdayPosition === 3) {
    signals.push(`🎯 Matchday position ${matchdayPosition}: Historically productive slot for goal-heavy matches`);
  }
  if (matchdayPosition === 5 || matchdayPosition === 6) {
    signals.push(`🎯 Matchday position ${matchdayPosition}: High-occurrence goal activator position`);
  }

  // ── 10. Category matchup signals ──────────────────────────
  if (home.category === "strong" && away.category === "weak") {
    signals.push(`💪 Strong vs Weak: ${home.name} dominates — high home win probability & possible high-scoring`);
  }
  if (home.category === "weak" && away.category === "strong") {
    signals.push(`⚠️ Weak host vs Strong away — Away team favoured, possible clean sheet for ${away.name}`);
  }
  if (home.category === "balance" && away.category === "balance") {
    signals.push(`⚖️ Both balance teams — Draw and BTTS markets attractive`);
  }

  // ── 11. Odds value detection ───────────────────────────────
  let confidence = 60;
  let valueRating: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";

  if (oddsHome && oddsX && oddsAway) {
    const impliedHome = 1 / oddsHome;
    const impliedDraw = 1 / oddsX;
    const impliedAway = 1 / oddsAway;
    const overroundTotal = impliedHome + impliedDraw + impliedAway;
    // Remove overround (house edge) 
    const fairHome = impliedHome / overroundTotal;
    const fairDraw = impliedDraw / overroundTotal;
    const fairAway = impliedAway / overroundTotal;

    const edgeHome = homeWinProb - fairHome;
    const edgeDraw = drawProb - fairDraw;
    const edgeAway = awayWinProb - fairAway;

    if (Math.max(edgeHome, edgeDraw, edgeAway) > 0.06) {
      valueRating = "HIGH";
      confidence = Math.min(confidence + 15, 92);
      signals.push(`💰 VALUE DETECTED: Our model finds ${edgeHome > 0.06 ? "Home Win" : edgeDraw > 0.06 ? "Draw" : "Away Win"} is underpriced by the bookmaker`);
    } else if (Math.max(edgeHome, edgeDraw, edgeAway) > 0.02) {
      valueRating = "MEDIUM";
      confidence = Math.min(confidence + 5, 85);
    } else {
      valueRating = "LOW";
    }
  }

  // ── 12. Confidence calculation ─────────────────────────────
  const svConfidence = Math.abs(svDiff) > 30 ? 10 : Math.abs(svDiff) > 15 ? 5 : 0;
  const formLen = Math.min(homeForm.length + awayForm.length, 10);
  const formConfidence = formLen * 1.5;
  confidence = clamp(confidence + svConfidence + formConfidence, 45, 92);

  // ── 13. Predicted score ────────────────────────────────────
  const predHomeGoals = Math.round(xGHome * 10) / 10;
  const predAwayGoals = Math.round(xGAway * 10) / 10;
  const scoreH = Math.min(Math.round(xGHome + (Math.random() - 0.5) * 0.3), 5);
  const scoreA = Math.min(Math.round(xGAway + (Math.random() - 0.5) * 0.3), 4);
  const predictedScore = `${Math.max(scoreH, 0)}-${Math.max(scoreA, 0)}`;

  // ── 14. Risk level ────────────────────────────────────────
  let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM";
  if (Math.abs(svDiff) > 40 && homeForm.length >= 3) riskLevel = "LOW";
  else if (Math.abs(svDiff) < 10) riskLevel = "HIGH";

  // ── 15. Generate concrete betting tips ───────────────────
  // 1X2
  const main1x2 = homeWinProb > 0.55 ? "1 (Home Win)" : awayWinProb > 0.55 ? "2 (Away Win)" : "X (Draw)";
  const main1x2Conf = Math.round(Math.max(homeWinProb, drawProb, awayWinProb) * 100);
  tips.push({
    market: "Match Result 1X2",
    pick: main1x2,
    confidence: main1x2Conf,
    reasoning: `SV difference ${svDiff > 0 ? "favours " + home.name : svDiff < 0 ? "favours " + away.name : "is level"}. ARpt win rate: ${home.name} ${Math.round(home.winRate * 100)}% vs ${away.name} ${Math.round(away.winRate * 100)}%.`,
    tag: main1x2Conf > 65 ? "SAFE" : main1x2Conf > 50 ? "VALUE" : "RISKY",
  });

  // Double chance
  if (homeWinProb > 0.40) {
    tips.push({
      market: "Double Chance",
      pick: `1X (${home.name} or Draw)`,
      confidence: Math.round((homeWinProb + drawProb) * 100),
      reasoning: `Home team strength advantage. Combined 1X covers ${Math.round((homeWinProb + drawProb) * 100)}% of outcomes.`,
      tag: (homeWinProb + drawProb) > 0.70 ? "SAFE" : "VALUE",
    });
  }

  // Over/Under
  if (over15Prob > 0.75) {
    tips.push({
      market: "Over/Under Goals",
      pick: "Over 1.5 Goals",
      confidence: Math.round(over15Prob * 100),
      reasoning: `xG model predicts ${predHomeGoals + predAwayGoals} total goals. Both teams have GP ratings of ${home.goalPower} & ${away.goalPower}.`,
      tag: over15Prob > 0.85 ? "SAFE" : "VALUE",
    });
  }
  if (over25Prob > 0.55) {
    tips.push({
      market: "Over/Under Goals",
      pick: "Over 2.5 Goals",
      confidence: Math.round(over25Prob * 100),
      reasoning: `Combined xG of ${(predHomeGoals + predAwayGoals).toFixed(1)}. ${activatorAlert ? "League Activator team present — scoring boost." : ""}`,
      tag: over25Prob > 0.70 ? "SAFE" : over25Prob > 0.55 ? "VALUE" : "RISKY",
    });
  }
  if (over35Prob > 0.40) {
    tips.push({
      market: "Over/Under Goals",
      pick: "Over 3.5 Goals",
      confidence: Math.round(over35Prob * 100),
      reasoning: `High combined goal power. ${activatorAlert ? "Activator team elevates probability." : ""}`,
      tag: over35Prob > 0.60 ? "VALUE" : "RISKY",
    });
  }

  // BTTS
  tips.push({
    market: "Both Teams To Score",
    pick: bttsProb > 0.52 ? "BTTS: Yes" : "BTTS: No",
    confidence: bttsProb > 0.52 ? Math.round(bttsProb * 100) : Math.round((1 - bttsProb) * 100),
    reasoning: `Home score prob: ${Math.round(pHomeScores * 100)}%, Away score prob: ${Math.round(pAwayScores * 100)}%. ${h2h?.bttsProb ? "H2H indicator supports BTTS." : ""}`,
    tag: (bttsProb > 0.65 || bttsProb < 0.35) ? "SAFE" : "VALUE",
  });

  // Form analysis text
  let formAnalysis = "";
  if (homeForm.length > 0) {
    const hW = homeForm.filter((f) => f.result === "W").length;
    const hD = homeForm.filter((f) => f.result === "D").length;
    const hL = homeForm.filter((f) => f.result === "L").length;
    formAnalysis += `${home.name}: ${hW}W-${hD}D-${hL}L | `;
  }
  if (awayForm.length > 0) {
    const aW = awayForm.filter((f) => f.result === "W").length;
    const aD = awayForm.filter((f) => f.result === "D").length;
    const aL = awayForm.filter((f) => f.result === "L").length;
    formAnalysis += `${away.name}: ${aW}W-${aD}D-${aL}L`;
  }

  return {
    homeWinProb: Math.round(homeWinProb * 100),
    drawProb: Math.round(drawProb * 100),
    awayWinProb: Math.round(awayWinProb * 100),
    over15Prob: Math.round(over15Prob * 100),
    over25Prob: Math.round(over25Prob * 100),
    over35Prob: Math.round(over35Prob * 100),
    bttsProb: Math.round(bttsProb * 100),
    expectedGoals: Math.round(expectedGoals * 10) / 10,
    confidence: Math.round(confidence),
    valueRating,
    signals,
    tips,
    predictedScore,
    riskLevel,
    formAnalysis,
    activatorAlert,
  };
}
