import { clamp, normalise, xGToScore, sigmoid } from "./utils";
import { calcFormMultiplier } from "./formAnalysis";
import { poissonCDF } from "./poisson";
import { analyseOdds } from "./oddsParser";
import type { Team } from "@/data/teamsData";
import { H2H_MODIFIERS } from "@/data/teamsData";

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
  confidence: number;
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

function deriveConfidence(
  svDiff: number,
  formCoverage: number,
  oddsProvided: boolean,
  activatorPresent: boolean
): number {
  let base = 50;
  base += Math.min(Math.abs(svDiff) / 3, 20);
  base += formCoverage * 2;
  if (oddsProvided) base += 8;
  if (activatorPresent) base += 4;
  return Math.round(clamp(base, 42, 91));
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

  const svDiff = home.strengthValue - away.strengthValue;
  const baseHomeProbRaw = sigmoid(svDiff / 30 + 0.20);
  const baseDrawProbRaw = 0.24 - Math.abs(svDiff) * 0.0015;
  const baseAwayProbRaw = 1 - baseHomeProbRaw - baseDrawProbRaw;

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

  const total = homeWinProb + drawProb + awayWinProb;
  homeWinProb /= total;
  drawProb /= total;
  awayWinProb /= total;

  const homeAttack = (home.goalPower / 100) * homeFormM.attackMult;
  const homeDef = (home.defensePower / 100) * homeFormM.defenceMult;
  const awayAttack = (away.goalPower / 100) * awayFormM.attackMult;
  const awayDef = (away.defensePower / 100) * awayFormM.defenceMult;

  const xGHome = clamp(
    homeAttack * (1 - awayDef * 0.55) * 2.2 * (1 + home.homeBonus),
    0.3, 4.5
  );
  const xGAway = clamp(
    awayAttack * (1 - homeDef * 0.55) * 2.0,
    0.2, 4.0
  );
  const expectedGoals = xGHome + xGAway;

  const over15Prob = clamp(1 - poissonCDF(expectedGoals, 1), 0.10, 0.96);
  const over25Prob = clamp(1 - poissonCDF(expectedGoals, 2), 0.05, 0.92);
  const over35Prob = clamp(1 - poissonCDF(expectedGoals, 3), 0.03, 0.85);

  const pHomeScores = clamp(1 - Math.exp(-xGHome), 0.10, 0.98);
  const pAwayScores = clamp(1 - Math.exp(-xGAway), 0.10, 0.98);
  let bttsProb = pHomeScores * pAwayScores;

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

  const activatorAlert = home.isGoalActivator || away.isGoalActivator;
  if (activatorAlert) {
    signals.push(`⚡ LEAGUE ACTIVATOR: ${home.isGoalActivator ? home.name : away.name} is a Goal Activator team — elevated scoring probability`);
  }

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

  if (matchdayPosition === 2 || matchdayPosition === 3) {
    signals.push(`🎯 Matchday position ${matchdayPosition}: Historically productive slot for goal-heavy matches`);
  }
  if (matchdayPosition === 5 || matchdayPosition === 6) {
    signals.push(`🎯 Matchday position ${matchdayPosition}: High-occurrence goal activator position`);
  }

  if (home.category === "strong" && away.category === "weak") {
    signals.push(`💪 Strong vs Weak: ${home.name} dominates — high home win probability & possible high-scoring`);
  }
  if (home.category === "weak" && away.category === "strong") {
    signals.push(`⚠️ Weak host vs Strong away — Away team favoured, possible clean sheet for ${away.name}`);
  }
  if (home.category === "balance" && away.category === "balance") {
    signals.push(`⚖️ Both balance teams — Draw and BTTS markets attractive`);
  }

  let valueRating: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
  const oddsProvided = !!(oddsHome && oddsX && oddsAway);

  if (oddsHome && oddsX && oddsAway) {
    const oddsAnalysis = analyseOdds(
      { home: homeWinProb, draw: drawProb, away: awayWinProb },
      { home: oddsHome, draw: oddsX, away: oddsAway }
    );

    if (oddsAnalysis.maxEdge > 0.06) {
      valueRating = "HIGH";
      signals.push(`💰 VALUE DETECTED: Our model finds ${oddsAnalysis.bestValueMarket} is underpriced by the bookmaker`);
    } else if (oddsAnalysis.maxEdge > 0.02) {
      valueRating = "MEDIUM";
    } else {
      valueRating = "LOW";
    }
  }

  const formLen = Math.min(homeForm.length + awayForm.length, 10);
  const confidence = deriveConfidence(svDiff, formLen, oddsProvided, activatorAlert);

  const scoreH = xGToScore(xGHome);
  const scoreA = xGToScore(xGAway);
  const predictedScore = `${Math.max(scoreH, 0)}-${Math.max(scoreA, 0)}`;

  let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM";
  if (Math.abs(svDiff) > 40 && homeForm.length >= 3) riskLevel = "LOW";
  else if (Math.abs(svDiff) < 10) riskLevel = "HIGH";

  const main1x2 = homeWinProb > 0.55 ? "1 (Home Win)" : awayWinProb > 0.55 ? "2 (Away Win)" : "X (Draw)";
  const main1x2Conf = Math.round(Math.max(homeWinProb, drawProb, awayWinProb) * 100);
  tips.push({
    market: "Match Result 1X2",
    pick: main1x2,
    confidence: main1x2Conf,
    reasoning: `SV difference ${svDiff > 0 ? "favours " + home.name : svDiff < 0 ? "favours " + away.name : "is level"}. ARpt win rate: ${home.name} ${Math.round(home.winRate * 100)}% vs ${away.name} ${Math.round(away.winRate * 100)}%.`,
    tag: main1x2Conf > 65 ? "SAFE" : main1x2Conf > 50 ? "VALUE" : "RISKY",
  });

  if (homeWinProb > 0.40) {
    tips.push({
      market: "Double Chance",
      pick: `1X (${home.name} or Draw)`,
      confidence: Math.round((homeWinProb + drawProb) * 100),
      reasoning: `Home team strength advantage. Combined 1X covers ${Math.round((homeWinProb + drawProb) * 100)}% of outcomes.`,
      tag: (homeWinProb + drawProb) > 0.70 ? "SAFE" : "VALUE",
    });
  }

  const predHomeGoals = Math.round(xGHome * 10) / 10;
  const predAwayGoals = Math.round(xGAway * 10) / 10;

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

  tips.push({
    market: "Both Teams To Score",
    pick: bttsProb > 0.52 ? "BTTS: Yes" : "BTTS: No",
    confidence: bttsProb > 0.52 ? Math.round(bttsProb * 100) : Math.round((1 - bttsProb) * 100),
    reasoning: `Home score prob: ${Math.round(pHomeScores * 100)}%, Away score prob: ${Math.round(pAwayScores * 100)}%. ${h2h?.bttsProb ? "H2H indicator supports BTTS." : ""}`,
    tag: (bttsProb > 0.65 || bttsProb < 0.35) ? "SAFE" : "VALUE",
  });

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

  const [h, d, a] = normalise(homeWinProb * 100, drawProb * 100, awayWinProb * 100);

  return {
    homeWinProb: h,
    drawProb: d,
    awayWinProb: a,
    over15Prob: Math.round(over15Prob * 100),
    over25Prob: Math.round(over25Prob * 100),
    over35Prob: Math.round(over35Prob * 100),
    bttsProb: Math.round(bttsProb * 100),
    expectedGoals: Math.round(expectedGoals * 10) / 10,
    confidence,
    valueRating,
    signals,
    tips,
    predictedScore,
    riskLevel,
    formAnalysis,
    activatorAlert,
  };
}