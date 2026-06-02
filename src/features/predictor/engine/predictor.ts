import { DataService } from "@/lib/predictor/DataService";
import type { Team } from "@/data/teamsData";

export interface FormEntry {
  result: "W" | "D" | "L";
  goals: number;
  conceded: number;
}

export interface BetTip {
  market: string;
  pick: string;
  confidence: number;
  reasoning: string;
  odds?: string;
  tag: "SAFE" | "VALUE" | "RISKY";
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
  recommendedStake?: number; // New field for bankroll management
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
  const engine = DataService.getEngine();
  const rawResult = engine.predictMatch(
    home.league,
    home.id,
    away.id,
    homeForm,
    awayForm,
    matchdayPosition,
    oddsHome,
    oddsX,
    oddsAway
  );

  if (!rawResult) {
      // Fallback if engine fails
      return {
          homeWinProb: 33, drawProb: 34, awayWinProb: 33,
          over15Prob: 50, over25Prob: 40, over35Prob: 20, bttsProb: 50,
          expectedGoals: 2.5, confidence: 50, valueRating: "LOW",
          signals: ["Engine failed to load team data"],
          tips: [], predictedScore: "1-1", riskLevel: "HIGH",
          formAnalysis: "", activatorAlert: false
      };
  }

  const signals: string[] = [];
  const tips: BetTip[] = [];

  // Add Signals based on stats
  if (home.isGoalActivator) signals.push(`⚡ ${home.name} is a high-scoring 'Activator' team.`);
  if (rawResult.over25Prob > 0.65) signals.push(`🎯 Statistical pressure for Over 2.5 Goals detected.`);
  if (rawResult.confidence > 80) signals.push(`🔥 HIGH CONFIDENCE: Model shows strong historical convergence for this matchup.`);

  // Generate Tips
  const mainPick = rawResult.homeWinProb > rawResult.awayWinProb && rawResult.homeWinProb > rawResult.drawProb 
      ? `1 (${home.name})` 
      : rawResult.awayWinProb > rawResult.homeWinProb 
          ? `2 (${away.name})` 
          : "X (Draw)";

  tips.push({
      market: "Match Result 1X2",
      pick: mainPick,
      confidence: Math.round(Math.max(rawResult.homeWinProb, rawResult.awayWinProb, rawResult.drawProb) * 100),
      reasoning: "Based on historical ELO ratings and scoring averages from 6,000+ matches.",
      tag: rawResult.confidence > 70 ? "SAFE" : "VALUE"
  });

  if (rawResult.over25Prob > 0.55) {
      tips.push({
          market: "Over/Under",
          pick: "Over 2.5 Goals",
          confidence: Math.round(rawResult.over25Prob * 100),
          reasoning: "Both teams show high scoring/conceding ratios in this league setup.",
          tag: rawResult.over25Prob > 0.7 ? "SAFE" : "VALUE"
      });
  }

  // Form Analysis string
  let formAnalysis = "";
  if (homeForm.length > 0) formAnalysis += `${home.shortName} Form: ${homeForm.map(f => f.result).join('')} | `;
  if (awayForm.length > 0) formAnalysis += `${away.shortName} Form: ${awayForm.map(f => f.result).join('')}`;

  return {
    homeWinProb: Math.round(rawResult.homeWinProb * 100),
    drawProb: Math.round(rawResult.drawProb * 100),
    awayWinProb: Math.round(rawResult.awayWinProb * 100),
    over15Prob: Math.round((rawResult.over25Prob + 0.15) * 100), // Estimation
    over25Prob: Math.round(rawResult.over25Prob * 100),
    over35Prob: Math.round((rawResult.over25Prob - 0.2) * 100), // Estimation
    bttsProb: Math.round(rawResult.bttsProb * 100),
    expectedGoals: rawResult.predictedScore.home + rawResult.predictedScore.away,
    confidence: Math.min(rawResult.confidence, 75), // Capped at 75% for display
    valueRating: rawResult.confidence > 75 ? "HIGH" : "MEDIUM",
    signals,
    tips,
    predictedScore: `${rawResult.predictedScore.home}-${rawResult.predictedScore.away}`,
    riskLevel: rawResult.confidence > 70 ? "LOW" : rawResult.confidence > 50 ? "MEDIUM" : "HIGH",
    formAnalysis,
    activatorAlert: home.isGoalActivator || away.isGoalActivator,
    recommendedStake: rawResult.recommendedStake
  };
}