import mlModel from '../../../data/ml_models/simplified_model.json';

/**
 * Poisson Distribution Formula
 * P(x; μ) = (e^-μ * μ^x) / x!
 */
function poisson(actual: number, average: number): number {
    let factorial = 1;
    for (let i = 1; i <= actual; i++) factorial *= i;
    return Math.exp(-average) * Math.pow(average, actual) / factorial;
}

export interface TeamStats {
    goalsScored: number;
    goalsConceded: number;
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    elo: number;
}

export interface PredictionResult {
    homeWinProb: number;
    drawProb: number;
    awayWinProb: number;
    over25Prob: number;
    under25Prob: number;
    bttsProb: number;
    confidence: number;
    recommendedStake: number;
    predictedScore: { home: number; away: number };
    momentumNote?: string;
    mlConfidence?: number;
}

interface HeadToHeadData {
    homeWins: number;
    awayWins: number;
    draws: number;
    over25: number;
    under25: number;
    bttsYes: number;
    totalMatches: number;
    goals: number[];
}

interface TeamStatsData {
    avg_goals_scored: number;
    avg_goals_conceded: number;
    win_rate: number;
    over25_rate: number;
    btts_rate: number;
    clean_sheet_rate: number;
    recent_form: string[];
    streak: number;
}

interface MLModel {
    version: string;
    trained_at: string;
    training_data: {
        total_matchdays: number;
        total_matches: number;
        total_teams: number;
    };
    base_rates: {
        home_win: number;
        draw: number;
    };
    weights: {
        elo_diff: number;
        goal_diff: number;
        form_diff: number;
        over25_diff: number;
        btts_diff: number;
    };
    market: {
        over25_accuracy: number;
        btts_accuracy: number;
        over25_threshold: number;
        btts_threshold: number;
    };
    elo_ratings: Record<string, number>;
    team_stats: Record<string, TeamStatsData>;
    league_stats: Record<string, number>;
}

const ml = mlModel as MLModel;

export class PredictorEngine {
    private stats: any;
    private liveData: any = null;
    private headToHead: Record<string, HeadToHeadData> = {};

    constructor(statsData: any, liveData?: any) {
        this.stats = statsData;
        this.liveData = liveData;
        this.headToHead = statsData.headToHead || {};
    }

    private getMLPrediction(homeTeam: string, awayTeam: string, homeStats: any, awayStats: any, leagueAvg: number): { homeWin: number; over25: number; btts: number; confidence: number } {
        const homeELO = ml.elo_ratings[homeTeam] || 1500;
        const awayELO = ml.elo_ratings[awayTeam] || 1500;
        
        const homeMLStats = ml.team_stats[homeTeam] || {
            avg_goals_scored: 1.2,
            avg_goals_conceded: 1.3,
            win_rate: 0.33,
            over25_rate: 0.5,
            btts_rate: 0.5,
            clean_sheet_rate: 0.3,
            recent_form: [],
            streak: 0
        };
        
        const awayMLStats = ml.team_stats[awayTeam] || {
            avg_goals_scored: 1.2,
            avg_goals_conceded: 1.3,
            win_rate: 0.33,
            over25_rate: 0.5,
            btts_rate: 0.5,
            clean_sheet_rate: 0.3,
            recent_form: [],
            streak: 0
        };

        const eloDiff = homeELO - awayELO;
        const goalDiff = homeMLStats.avg_goals_scored - awayMLStats.avg_goals_scored;
        
        const homeForm = homeMLStats.recent_form || [];
        const awayForm = awayMLStats.recent_form || [];
        const homeFormScore = homeForm.filter((f: string) => f === 'W').length - homeForm.filter((f: string) => f === 'L').length;
        const awayFormScore = awayForm.filter((f: string) => f === 'W').length - awayForm.filter((f: string) => f === 'L').length;
        const formDiff = homeFormScore - awayFormScore;

        const over25Diff = homeMLStats.over25_rate - awayMLStats.over25_rate;
        const bttsDiff = homeMLStats.btts_rate - awayMLStats.btts_rate;

        const { weights } = ml;
        const rawScore = (
            weights.elo_diff * (eloDiff / 100) +
            weights.goal_diff * goalDiff +
            weights.form_diff * formDiff +
            weights.over25_diff * over25Diff +
            weights.btts_diff * bttsDiff
        );

        const sigmoid = (x: number) => 1 / (1 + Math.exp(-Math.max(-10, Math.min(10, x))));

        const homeWinProb = Math.max(0.25, Math.min(0.65, sigmoid(rawScore) * 0.4 + ml.base_rates.home_win * 0.6));
        const awayWinProb = Math.max(0.2, Math.min(0.55, (1 - homeWinProb) * 0.7));
        const drawProb = Math.max(0.15, Math.min(0.35, 1 - homeWinProb - awayWinProb));

        const leagueOver25Rate = ml.market.over25_accuracy;
        const leagueBTTSRate = ml.market.btts_accuracy;
        
        const combinedOver25 = (homeMLStats.over25_rate + awayMLStats.over25_rate) / 2;
        const combinedBtts = (homeMLStats.btts_rate + awayMLStats.btts_rate) / 2;
        
        const over25Prob = Math.max(0.35, Math.min(0.75, combinedOver25 * 0.6 + leagueOver25Rate * 0.4));
        const bttsProb = Math.max(0.35, Math.min(0.75, combinedBtts * 0.6 + leagueBTTSRate * 0.4));

        const confidence = Math.round(55 + Math.abs(rawScore) * 8);

        return {
            homeWin: homeWinProb,
            over25: over25Prob,
            btts: bttsProb,
            confidence: Math.min(88, Math.max(50, confidence))
        };
    }

    public predictMatch(leagueName: string, homeTeam: string, awayTeam: string): PredictionResult | null {
        const league = this.stats.leagues[leagueName];
        if (!league) return null;

        const home = league.teams[homeTeam];
        const away = league.teams[awayTeam];
        if (!home || !away) return null;

        const leagueAvg = league.avgGoals / 2;

        const h2hKey = [homeTeam, awayTeam].sort().join(' vs ');
        const h2h = this.headToHead[h2hKey];

        let homeMomentum = 1.0;
        let awayMomentum = 1.0;
        let momentumNote = "";

        if (this.liveData?.recentHistory) {
            const hForm = this.calculateRecentForm(homeTeam);
            const aForm = this.calculateRecentForm(awayTeam);
            
            if (hForm > 1.2) {
                homeMomentum = 1.12;
                momentumNote = `${homeTeam} is on a hot streak in this session. `;
            } else if (hForm < 0.8) {
                homeMomentum = 0.88;
                momentumNote = `${homeTeam} is struggling recently. `;
            }

            if (aForm > 1.2) awayMomentum = 1.12;
            else if (aForm < 0.8) awayMomentum = 0.88;
        }

        if (home.currentStreak === 'WINNING') {
            homeMomentum *= 1.06;
            momentumNote += `${homeTeam} has a winning streak. `;
        } else if (home.currentStreak === 'LOSING') {
            homeMomentum *= 0.94;
            momentumNote += `${homeTeam} is on a losing streak. `;
        }

        if (away.currentStreak === 'WINNING') {
            awayMomentum *= 1.06;
            momentumNote += `${awayTeam} has a winning streak. `;
        } else if (away.currentStreak === 'LOSING') {
            awayMomentum *= 0.94;
            momentumNote += `${awayTeam} is on a losing streak. `;
        }

        const homeAttack = ((home.avgGoalsScored || home.goalsScored / home.matchesPlayed) / leagueAvg) * homeMomentum;
        const homeDefense = ((home.avgGoalsConceded || home.goalsConceded / home.matchesPlayed) / leagueAvg) / homeMomentum;
        const awayAttack = ((away.avgGoalsScored || away.goalsScored / away.matchesPlayed) / leagueAvg) * awayMomentum;
        const awayDefense = ((away.avgGoalsConceded || away.goalsConceded / away.matchesPlayed) / leagueAvg) / awayMomentum;

        const homeExp = homeAttack * awayDefense * leagueAvg;
        const awayExp = awayAttack * homeDefense * leagueAvg;

        let homeWinProb = 0;
        let drawProb = 0;
        let awayWinProb = 0;
        let over25Prob = 0;
        let bttsProb = 0;

        for (let h = 0; h <= 5; h++) {
            for (let a = 0; a <= 5; a++) {
                const prob = poisson(h, homeExp) * poisson(a, awayExp);

                if (h > a) homeWinProb += prob;
                else if (h === a) drawProb += prob;
                else awayWinProb += prob;

                if (h + a > 2.5) over25Prob += prob;
                if (h > 0 && a > 0) bttsProb += prob;
            }
        }

        const mlPrediction = this.getMLPrediction(homeTeam, awayTeam, home, away, leagueAvg);

        if (h2h && h2h.totalMatches >= 3) {
            const h2hHomeWinRate = h2h.homeWins / h2h.totalMatches;
            const h2hOver25Rate = h2h.over25 / h2h.totalMatches;
            const h2hBttsRate = h2h.bttsYes / h2h.totalMatches;

            const h2hWeight = Math.min(0.25, h2h.totalMatches / 40);
            homeWinProb = homeWinProb * (1 - h2hWeight) + h2hHomeWinRate * h2hWeight;
            awayWinProb = awayWinProb * (1 - h2hWeight) + (h2h.awayWins / h2h.totalMatches) * h2hWeight;
            over25Prob = over25Prob * (1 - h2hWeight) + h2hOver25Rate * h2hWeight;
            bttsProb = bttsProb * (1 - h2hWeight) + h2hBttsRate * h2hWeight;

            momentumNote += `${h2h.totalMatches} previous meetings analyzed. `;
        }

        homeWinProb = homeWinProb * 0.6 + mlPrediction.homeWin * 0.4;
        awayWinProb = awayWinProb * 0.6 + (1 - mlPrediction.homeWin - ml.base_rates.draw) * 0.4;
        drawProb = drawProb * 0.6 + ml.base_rates.draw * 0.4;
        over25Prob = over25Prob * 0.5 + mlPrediction.over25 * 0.5;
        bttsProb = bttsProb * 0.5 + mlPrediction.btts * 0.5;

        if (home.homeStats) {
            const homeOver25Adjustment = (home.homeStats.over25Rate - 0.5) * 0.08;
            const homeBttsAdjustment = (home.bttsRate - 0.5) * 0.08;
            over25Prob = Math.min(0.92, Math.max(0.08, over25Prob + homeOver25Adjustment));
            bttsProb = Math.min(0.92, Math.max(0.08, bttsProb + homeBttsAdjustment));
        }

        const eloDiff = home.elo - away.elo;
        const eloImpact = eloDiff / 1000;
        homeWinProb = Math.min(0.92, Math.max(0.08, homeWinProb + (eloImpact * 0.06)));
        awayWinProb = Math.min(0.92, Math.max(0.08, awayWinProb - (eloImpact * 0.06)));

        const total = homeWinProb + drawProb + awayWinProb;
        homeWinProb /= total;
        drawProb /= total;
        awayWinProb /= total;

        const sorted = [homeWinProb, drawProb, awayWinProb].sort((a, b) => b - a);
        const separation = sorted[0] - sorted[1];
        const over25Signal = Math.abs(over25Prob - 0.5);
        const bttsSignal = Math.abs(bttsProb - 0.5);
        const rawConf = 50 + (separation * 100) + (over25Signal * 15) + (bttsSignal * 8) + (mlPrediction.confidence - 55) * 0.5;
        const confidence = Math.round(Math.min(90, Math.max(42, rawConf)));

        let recommendedStake = 0;
        if (confidence > 75) recommendedStake = 5;
        else if (confidence > 65) recommendedStake = 3;
        else if (confidence > 55) recommendedStake = 1;

        momentumNote += `ML Model Confidence: ${mlPrediction.confidence}%`;

        return {
            homeWinProb,
            drawProb,
            awayWinProb,
            over25Prob,
            under25Prob: 1 - over25Prob,
            bttsProb,
            confidence,
            recommendedStake,
            predictedScore: {
                home: Math.round(homeExp),
                away: Math.round(awayExp)
            },
            momentumNote,
            mlConfidence: mlPrediction.confidence
        };
    }

    private calculateRecentForm(teamName: string): number {
        if (!this.liveData?.recentHistory) return 1.0;
        
        let points = 0;
        let count = 0;
        this.liveData.recentHistory.forEach((m: any) => {
            if (m.teams.includes(teamName)) {
                count++;
                const [h, a] = m.score.split('-').map((s: string) => parseInt(s.trim()));
                const isHome = m.teams.split('-')[0].trim() === teamName;
                if ((isHome && h > a) || (!isHome && a > h)) points += 3;
                else if (h === a) points += 1;
            }
        });

        if (count === 0) return 1.0;
        return (points / count) / 1.5;
    }
}
