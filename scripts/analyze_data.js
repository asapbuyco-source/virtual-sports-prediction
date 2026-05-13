import fs from 'fs/promises';
import path from 'path';

async function analyzeData() {
    const dataPath = 'data/betpawa_history.json';
    try {
        const rawData = await fs.readFile(dataPath, 'utf8');
        const history = JSON.parse(rawData);

        let totalMatches = 0;
        let homeWins = 0;
        let draws = 0;
        let awayWins = 0;
        let over25 = 0;
        let btts = 0;
        let missingScores = 0;

        history.forEach(day => {
            day.matches.forEach(match => {
                totalMatches++;
                const scores = match.score.split('-').map(s => parseInt(s.trim()));
                
                if (isNaN(scores[0]) || isNaN(scores[1])) {
                    missingScores++;
                    return;
                }

                const [home, away] = scores;
                if (home > away) homeWins++;
                else if (home === away) draws++;
                else awayWins++;

                if (home + away > 2.5) over25++;
                if (home > 0 && away > 0) btts++;
            });
        });

        console.log(`--- Data Analysis ---`);
        console.log(`Total Matchdays: ${history.length}`);
        console.log(`Total Matches: ${totalMatches}`);
        console.log(`Missing Scores: ${missingScores}`);
        console.log(`---------------------`);
        console.log(`Home Wins: ${homeWins} (${((homeWins/totalMatches)*100).toFixed(1)}%)`);
        console.log(`Draws: ${draws} (${((draws/totalMatches)*100).toFixed(1)}%)`);
        console.log(`Away Wins: ${awayWins} (${((awayWins/totalMatches)*100).toFixed(1)}%)`);
        console.log(`Over 2.5: ${over25} (${((over25/totalMatches)*100).toFixed(1)}%)`);
        console.log(`BTTS: ${btts} (${((btts/totalMatches)*100).toFixed(1)}%)`);

    } catch (error) {
        console.error('Analysis failed:', error);
    }
}

analyzeData();
