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
}

export class PredictorEngine {
    private stats: any;
    private liveData: any = null;

    constructor(statsData: any, liveData?: any) {
        this.stats = statsData;
        this.liveData = liveData;
    }

    public predictMatch(leagueName: string, homeTeam: string, awayTeam: string): PredictionResult | null {
        const league = this.stats.leagues[leagueName];
        if (!league) return null;

        const home = league.teams[homeTeam];
        const away = league.teams[awayTeam];
        if (!home || !away) return null;

        const leagueAvg = league.avgGoals / 2; 

        // 1. Calculate Session Momentum (Last 5 matches from live sync)
        let homeMomentum = 1.0;
        let awayMomentum = 1.0;
        let momentumNote = "";

        if (this.liveData?.recentHistory) {
            const hForm = this.calculateRecentForm(homeTeam);
            const aForm = this.calculateRecentForm(awayTeam);
            
            if (hForm > 1.2) {
                homeMomentum = 1.15; // On fire
                momentumNote = `${homeTeam} is on a hot streak in this session. `;
            } else if (hForm < 0.8) {
                homeMomentum = 0.85; // Slumping
                momentumNote = `${homeTeam} is struggling recently. `;
            }

            if (aForm > 1.2) awayMomentum = 1.15;
            else if (aForm < 0.8) awayMomentum = 0.85;
        }

        // 2. Calculate Attack and Defense Strengths (Adjusted by Momentum)
        const homeAttack = ((home.goalsScored / home.matchesPlayed) / leagueAvg) * homeMomentum;
        const homeDefense = ((home.goalsConceded / home.matchesPlayed) / leagueAvg) / homeMomentum;
        const awayAttack = ((away.goalsScored / away.matchesPlayed) / leagueAvg) * awayMomentum;
        const awayDefense = ((away.goalsConceded / away.matchesPlayed) / leagueAvg) / awayMomentum;

        // 2. Calculate Expected Goals (μ)
        // Home μ = Home Attack * Away Defense * League Avg
        // Away μ = Away Attack * Home Defense * League Avg
        const homeExp = homeAttack * awayDefense * leagueAvg;
        const awayExp = awayAttack * homeDefense * leagueAvg;

        // 3. Probability Matrix (0-5 goals for each)
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

        // 4. Elo Adjustment (Bias towards higher rated team)
        const eloDiff = home.elo - away.elo;
        const eloImpact = eloDiff / 1000; // Small adjustment based on rating gap
        homeWinProb = Math.min(0.99, Math.max(0.01, homeWinProb + (eloImpact * 0.1)));
        awayWinProb = Math.min(0.99, Math.max(0.01, awayWinProb - (eloImpact * 0.1)));

        // 5. Calculate Confidence & Stake
        // Confidence is based on how strongly the model favors the most likely outcome
        const maxProb = Math.max(homeWinProb, drawProb, awayWinProb, over25Prob, 1 - over25Prob);
        const confidence = Math.round(maxProb * 100);

        // Stake suggestion (Conservative for High Win Rate)
        // We use a modified Kelly Criterion or flat stake based on confidence
        let recommendedStake = 0;
        if (confidence > 75) recommendedStake = 5; // 5% of bankroll
        else if (confidence > 65) recommendedStake = 3; // 3%
        else if (confidence > 55) recommendedStake = 1; // 1%

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
            momentumNote
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
        return (points / count) / 1.5; // Normalized around 1.5 pts per game
    }
}
