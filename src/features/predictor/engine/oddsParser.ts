export interface OddsAnalysis {
  edgeHome: number;
  edgeDraw: number;
  edgeAway: number;
  maxEdge: number;
  bestValueMarket: "home" | "draw" | "away" | null;
  overroundPct: number;
}

export function analyseOdds(
  modelProbs: { home: number; draw: number; away: number },
  odds: { home: number; draw: number; away: number }
): OddsAnalysis {
  const implied = {
    home: 1 / odds.home,
    draw: 1 / odds.draw,
    away: 1 / odds.away,
  };
  const overround = implied.home + implied.draw + implied.away;
  const fair = {
    home: implied.home / overround,
    draw: implied.draw / overround,
    away: implied.away / overround,
  };
  const edges = {
    home: modelProbs.home - fair.home,
    draw: modelProbs.draw - fair.draw,
    away: modelProbs.away - fair.away,
  };
  const maxEdge = Math.max(edges.home, edges.draw, edges.away);
  return {
    edgeHome: edges.home,
    edgeDraw: edges.draw,
    edgeAway: edges.away,
    maxEdge,
    bestValueMarket: maxEdge > 0.04
      ? edges.home === maxEdge ? "home"
      : edges.draw === maxEdge ? "draw" : "away"
      : null,
    overroundPct: Math.round((overround - 1) * 100),
  };
}