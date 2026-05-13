import fs from 'fs/promises';

async function processStats() {
    const dataPath = 'data/betpawa_history.json';
    const outputPath = 'data/team_stats.json';

    try {
        const rawData = await fs.readFile(dataPath, 'utf8');
        const history = JSON.parse(rawData);

        const stats = {}; // { leagueName: { teamName: { goalsScored, goalsConceded, matchesPlayed, elo } } }
        const leagueAverages = {}; // { leagueName: { avgGoals } }

        // Initial Elo Rating
        const INITIAL_ELO = 1500;
        const K_FACTOR = 32;

        history.forEach(day => {
            const league = day.leagueName;
            if (!stats[league]) stats[league] = {};
            if (!leagueAverages[league]) leagueAverages[league] = { totalGoals: 0, totalMatches: 0 };

            day.matches.forEach(match => {
                const [homeTeam, awayTeam] = match.teams.split('-').map(t => t.trim());
                const scores = match.score.split('-').map(s => parseInt(s.trim()));
                
                if (isNaN(scores[0]) || isNaN(scores[1])) return;
                const [homeScore, awayScore] = scores;

                // Initialize teams if not exists
                [homeTeam, awayTeam].forEach(team => {
                    if (!stats[league][team]) {
                        stats[league][team] = {
                            goalsScored: 0,
                            goalsConceded: 0,
                            matchesPlayed: 0,
                            wins: 0,
                            draws: 0,
                            losses: 0,
                            elo: INITIAL_ELO
                        };
                    }
                });

                // Update basic stats
                stats[league][homeTeam].goalsScored += homeScore;
                stats[league][homeTeam].goalsConceded += awayScore;
                stats[league][homeTeam].matchesPlayed += 1;

                stats[league][awayTeam].goalsScored += awayScore;
                stats[league][awayTeam].goalsConceded += homeScore;
                stats[league][awayTeam].matchesPlayed += 1;

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

                leagueAverages[league].totalGoals += (homeScore + awayScore);
                leagueAverages[league].totalMatches += 1;

                // Update Elo
                const expectedHome = 1 / (1 + Math.pow(10, (stats[league][awayTeam].elo - stats[league][homeTeam].elo) / 400));
                const expectedAway = 1 - expectedHome;

                let actualHome = 0.5;
                if (homeScore > awayScore) actualHome = 1;
                else if (homeScore < awayScore) actualHome = 0;

                stats[league][homeTeam].elo += K_FACTOR * (actualHome - expectedHome);
                stats[league][awayTeam].elo += K_FACTOR * ((1 - actualHome) - expectedAway);
            });
        });

        // Calculate final averages
        const result = {
            leagues: {},
            lastUpdated: new Date().toISOString()
        };

        for (const league in stats) {
            result.leagues[league] = {
                avgGoals: leagueAverages[league].totalGoals / leagueAverages[league].totalMatches,
                teams: stats[league]
            };
        }

        await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
        console.log(`Successfully processed stats for ${Object.keys(result.leagues).length} leagues.`);
        console.log(`Data saved to ${outputPath}`);

    } catch (error) {
        console.error('Processing failed:', error);
    }
}

processStats();
