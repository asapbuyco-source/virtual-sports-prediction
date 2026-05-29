import fs from 'fs/promises';

async function processStats() {
    const dataPath = 'data/betpawa_history.json';
    const outputPath = 'data/team_stats.json';

    try {
        const rawData = await fs.readFile(dataPath, 'utf8');
        const history = JSON.parse(rawData);

        const stats = {};
        const leagueAverages = {};
        const headToHead = {};
        const teamStreaks = {};

        const INITIAL_ELO = 1500;
        const K_FACTOR = 32;

        const normalizeTeam = (team) => team.trim();

        history.forEach((day, dayIndex) => {
            const league = day.leagueName;
            if (!stats[league]) stats[league] = {};
            if (!leagueAverages[league]) leagueAverages[league] = { totalGoals: 0, totalMatches: 0 };

            day.matches.forEach(match => {
                const [homeTeam, awayTeam] = match.teams.split('-').map(normalizeTeam);
                const scores = match.score.split('-').map(s => parseInt(s.trim()));

                if (isNaN(scores[0]) || isNaN(scores[1])) return;
                const [homeScore, awayScore] = scores;

                [homeTeam, awayTeam].forEach(team => {
                    if (!stats[league][team]) {
                        stats[league][team] = {
                            goalsScored: 0,
                            goalsConceded: 0,
                            matchesPlayed: 0,
                            wins: 0,
                            draws: 0,
                            losses: 0,
                            elo: INITIAL_ELO,
                            homeGoalsScored: 0,
                            homeGoalsConceded: 0,
                            homeMatchesPlayed: 0,
                            awayGoalsScored: 0,
                            awayGoalsConceded: 0,
                            awayMatchesPlayed: 0,
                            over25Matches: 0,
                            under25Matches: 0,
                            bttsYes: 0,
                            bttsNo: 0,
                            cleanSheets: 0,
                            failedToScore: 0,
                            recentForm: [],
                            h2hRecord: {},
                            last5HomeWins: 0,
                            last5HomeDraws: 0,
                            last5HomeLosses: 0,
                            last5AwayWins: 0,
                            last5AwayDraws: 0,
                            last5AwayLosses: 0,
                        };
                    }
                    if (!stats[league][team].h2h) {
                        stats[league][team].h2h = {};
                    }
                });

                stats[league][homeTeam].goalsScored += homeScore;
                stats[league][homeTeam].goalsConceded += awayScore;
                stats[league][homeTeam].matchesPlayed += 1;
                stats[league][homeTeam].homeGoalsScored += homeScore;
                stats[league][homeTeam].homeGoalsConceded += awayScore;
                stats[league][homeTeam].homeMatchesPlayed += 1;

                stats[league][awayTeam].goalsScored += awayScore;
                stats[league][awayTeam].goalsConceded += homeScore;
                stats[league][awayTeam].matchesPlayed += 1;
                stats[league][awayTeam].awayGoalsScored += awayScore;
                stats[league][awayTeam].awayGoalsConceded += homeScore;
                stats[league][awayTeam].awayMatchesPlayed += 1;

                if (homeScore > awayScore) {
                    stats[league][homeTeam].wins++;
                    stats[league][awayTeam].losses++;
                } else if (homeScore === awayScore) {
                    stats[league][homeTeam].draws++;
                    stats[league][awayTeam].draws++;
                } else {
                    stats[league][homeTeam].losses++;
                    stats[league][awayTeam].wins++;
                }

                if (homeScore + awayScore > 2.5) {
                    stats[league][homeTeam].over25Matches++;
                    stats[league][awayTeam].over25Matches++;
                } else {
                    stats[league][homeTeam].under25Matches++;
                    stats[league][awayTeam].under25Matches++;
                }

                if (homeScore > 0 && awayScore > 0) {
                    stats[league][homeTeam].bttsYes++;
                    stats[league][awayTeam].bttsYes++;
                } else {
                    stats[league][homeTeam].bttsNo++;
                    stats[league][awayTeam].bttsNo++;
                }

                if (awayScore === 0) stats[league][homeTeam].cleanSheets++;
                if (homeScore === 0) stats[league][awayTeam].cleanSheets++;
                if (homeScore === 0) stats[league][awayTeam].failedToScore++;
                if (awayScore === 0) stats[league][homeTeam].failedToScore++;

                const homeFormResult = homeScore > awayScore ? 'W' : homeScore < awayScore ? 'L' : 'D';
                const awayFormResult = awayScore > homeScore ? 'W' : awayScore < homeScore ? 'L' : 'D';

                stats[league][homeTeam].recentForm.unshift(homeFormResult);
                stats[league][awayTeam].recentForm.unshift(awayFormResult);

                if (stats[league][homeTeam].recentForm.length > 10) stats[league][homeTeam].recentForm.pop();
                if (stats[league][awayTeam].recentForm.length > 10) stats[league][awayTeam].recentForm.pop();

                const h2hKey = [homeTeam, awayTeam].sort().join(' vs ');
                if (!headToHead[h2hKey]) {
                    headToHead[h2hKey] = { homeWins: 0, awayWins: 0, draws: 0, over25: 0, under25: 0, bttsYes: 0, totalMatches: 0, goals: [] };
                }
                headToHead[h2hKey].totalMatches++;
                if (homeScore > awayScore) headToHead[h2hKey].homeWins++;
                else if (homeScore === awayScore) headToHead[h2hKey].draws++;
                else headToHead[h2hKey].awayWins++;
                if (homeScore + awayScore > 2.5) headToHead[h2hKey].over25++;
                else headToHead[h2hKey].under25++;
                if (homeScore > 0 && awayScore > 0) headToHead[h2hKey].bttsYes++;
                headToHead[h2hKey].goals.push(homeScore + awayScore);

                leagueAverages[league].totalGoals += (homeScore + awayScore);
                leagueAverages[league].totalMatches += 1;

                const expectedHome = 1 / (1 + Math.pow(10, (stats[league][awayTeam].elo - stats[league][homeTeam].elo) / 400));
                const expectedAway = 1 - expectedHome;

                let actualHome = 0.5;
                if (homeScore > awayScore) actualHome = 1;
                else if (homeScore < awayScore) actualHome = 0;

                stats[league][homeTeam].elo += K_FACTOR * (actualHome - expectedHome);
                stats[league][awayTeam].elo += K_FACTOR * ((1 - actualHome) - expectedAway);
            });
        });

        const result = {
            leagues: {},
            headToHead,
            lastUpdated: new Date().toISOString(),
            totalMatchdays: history.length
        };

        for (const league in stats) {
            const leagueStats = stats[league];
            for (const team in leagueStats) {
                const t = leagueStats[team];

                const calcWinRate = (wins, total) => total > 0 ? wins / total : 0.5;
                const recentWins = t.recentForm.filter(f => f === 'W').length;
                const recentLosses = t.recentForm.filter(f => f === 'L').length;
                const recentDraws = t.recentForm.filter(f => f === 'D').length;

                leagueStats[team] = {
                    goalsScored: t.goalsScored,
                    goalsConceded: t.goalsConceded,
                    matchesPlayed: t.matchesPlayed,
                    wins: t.wins,
                    draws: t.draws,
                    losses: t.losses,
                    elo: t.elo,
                    avgGoalsScored: t.matchesPlayed > 0 ? t.goalsScored / t.matchesPlayed : 0,
                    avgGoalsConceded: t.matchesPlayed > 0 ? t.goalsConceded / t.matchesPlayed : 0,
                    over25Rate: t.matchesPlayed > 0 ? t.over25Matches / t.matchesPlayed : 0.5,
                    bttsRate: t.matchesPlayed > 0 ? t.bttsYes / t.matchesPlayed : 0.5,
                    cleanSheetRate: t.matchesPlayed > 0 ? t.cleanSheets / t.matchesPlayed : 0,
                    failedToScoreRate: t.matchesPlayed > 0 ? t.failedToScore / t.matchesPlayed : 0,
                    recentForm: t.recentForm.slice(0, 5),
                    recentWins,
                    recentLosses,
                    recentDraws,
                    currentStreak: recentWins >= 3 ? 'WINNING' : recentLosses >= 3 ? 'LOSING' : 'NEUTRAL',
                    homeStats: {
                        avgGoalsScored: t.homeMatchesPlayed > 0 ? t.homeGoalsScored / t.homeMatchesPlayed : 0,
                        avgGoalsConceded: t.homeMatchesPlayed > 0 ? t.homeGoalsConceded / t.homeMatchesPlayed : 0,
                        winRate: calcWinRate(t.wins, t.matchesPlayed * 0.6),
                        over25Rate: t.homeMatchesPlayed > 0 ? (t.over25Matches * 0.55) / t.homeMatchesPlayed : 0.5,
                    },
                    awayStats: {
                        avgGoalsScored: t.awayMatchesPlayed > 0 ? t.awayGoalsScored / t.awayMatchesPlayed : 0,
                        avgGoalsConceded: t.awayMatchesPlayed > 0 ? t.awayGoalsConceded / t.awayMatchesPlayed : 0,
                        winRate: calcWinRate(t.losses, t.matchesPlayed * 0.4),
                        over25Rate: t.awayMatchesPlayed > 0 ? (t.over25Matches * 0.45) / t.awayMatchesPlayed : 0.5,
                    },
                    avgFirstHalfGoals: t.matchesPlayed > 0 ? (t.goalsScored * 0.45) / t.matchesPlayed : 0,
                    scoringFrequency: t.matchesPlayed > 0 ? t.bttsYes / t.matchesPlayed : 0.5,
                };
            }

            result.leagues[league] = {
                avgGoals: leagueAverages[league].totalGoals / leagueAverages[league].totalMatches,
                teams: leagueStats
            };
        }

        await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
        console.log(`Successfully processed stats for ${Object.keys(result.leagues).length} leagues`);
        console.log(`Total matchdays: ${result.totalMatchdays}`);
        console.log(`Head-to-head records: ${Object.keys(headToHead).length}`);
        console.log(`Data saved to ${outputPath}`);

    } catch (error) {
        console.error('Processing failed:', error);
    }
}

processStats();
