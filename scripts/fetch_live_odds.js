import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function fetchLiveSession() {
    console.log('--- Syncing Live Session Data ---');
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        await page.goto('https://www.betpawa.cm/virtual', { waitUntil: 'networkidle2' });
        
        // 1. Fetch History (Last 5 matches)
        console.log('Fetching recent results...');
        // Click Results/History tab if needed
        const historyData = await page.evaluate(() => {
            // This is a placeholder for the actual DOM selection on the history tab
            // Based on our previous scraping, we know how to find the scores
            const rows = document.querySelectorAll('.v-history-row'); // Update with actual selector
            return Array.from(rows).slice(0, 50).map(row => ({
                teams: row.querySelector('.teams')?.textContent.trim(),
                score: row.querySelector('.score')?.textContent.trim()
            }));
        });

        // 2. Fetch Upcoming Matches & Odds
        console.log('Fetching upcoming matches...');
        await page.waitForSelector('.v-match-row', { timeout: 10000 });

        const upcomingData = await page.evaluate(() => {
            const rows = document.querySelectorAll('.v-match-row');
            return Array.from(rows).map(row => {
                const teams = row.querySelector('.v-team-names')?.textContent.trim();
                const odds = Array.from(row.querySelectorAll('.v-odd-button')).map(b => b.textContent.trim());
                return {
                    teams,
                    odds: { home: odds[0], draw: odds[1], away: odds[2] }
                };
            });
        });

        const syncData = {
            lastUpdated: new Date().toISOString(),
            recentHistory: historyData,
            upcoming: upcomingData
        };

        await fs.writeFile('data/live_sync.json', JSON.stringify(syncData, null, 2));
        console.log(`Sync Complete: Found ${upcomingData.length} upcoming matches.`);

    } catch (error) {
        console.error('Sync failed:', error);
    } finally {
        await browser.close();
    }
}

fetchLiveSession();
