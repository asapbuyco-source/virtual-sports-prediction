import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const PHONE = process.env.BETPAWA_PHONE;
const PASSWORD = process.env.BETPAWA_PASSWORD;

const LEAGUES = {
    'English League': 7794,
    'Spanish League': 7795,
    'Italian League': 7796,
    'German League': 9184,
    'French League': 9183,
    'Dutch League': 13774,
    'Portuguese League': 13773
};

const DATA_PATH = path.join(process.cwd(), 'data', 'betpawa_history.json');
const MAX_RETRIES = 3;

async function scrape() {
    const browser = await puppeteer.launch({
        headless: "new",
        defaultViewport: { width: 1280, height: 800 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);

    // Load existing data so we can resume where we left off
    let allResults = [];
    if (existsSync(DATA_PATH)) {
        try {
            const existing = readFileSync(DATA_PATH, 'utf8');
            allResults = JSON.parse(existing);
            console.log(`Loaded ${allResults.length} existing matchday records.`);
        } catch (e) {
            console.log('Could not parse existing data, starting fresh.');
        }
    }

    // Build a set of already-scraped keys for fast lookup
    const scrapedKeys = new Set(
        allResults.map(r => `${r.seasonId}_${r.leagueName}_${r.matchday}`)
    );

    async function doLogin() {
        console.log('  → Navigating to homepage for login...');
        await page.goto('https://www.betpawa.cm', { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(r => setTimeout(r, 3000));

        const isLoggedOut = await page.evaluate(() => {
            return !!Array.from(document.querySelectorAll('button, a'))
                .find(el => el.textContent?.trim().toUpperCase() === 'LOGIN');
        });

        if (!isLoggedOut) {
            console.log('  → Already logged in.');
            return true;
        }

        console.log('  → Clicking LOGIN button...');
        const clicked = await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button, a'))
                .find(el => el.textContent?.trim().toUpperCase() === 'LOGIN');
            if (btn) { btn.click(); return true; }
            return false;
        });

        if (!clicked) {
            console.log('  → Could not find LOGIN button!');
            return false;
        }

        await new Promise(r => setTimeout(r, 3000));

        try {
            await page.waitForSelector('#phoneNumber', { timeout: 10000 });
            
            // Screenshot before entering credentials
            await page.screenshot({ path: 'data/debug_before_login.png' });
            
            // Clear and type phone number using keyboard approach
            await page.focus('#phoneNumber');
            await new Promise(r => setTimeout(r, 300));
            // Select all text and delete it
            await page.keyboard.down('Control');
            await page.keyboard.press('KeyA');
            await page.keyboard.up('Control');
            await new Promise(r => setTimeout(r, 200));
            await page.keyboard.press('Backspace');
            await new Promise(r => setTimeout(r, 300));
            // Type phone number character by character
            for (const char of PHONE) {
                await page.keyboard.type(char, { delay: 80 });
            }
            
            await new Promise(r => setTimeout(r, 500));
            
            // Click and type PIN
            const pinInput = await page.$('input[placeholder="XXXX"]');
            if (pinInput) {
                await pinInput.focus();
                await new Promise(r => setTimeout(r, 300));
                for (const char of PASSWORD) {
                    await page.keyboard.type(char, { delay: 100 });
                }
            }

            await new Promise(r => setTimeout(r, 1000));
            
            // Screenshot after entering credentials (to debug)
            await page.screenshot({ path: 'data/debug_after_credentials.png' });
            
            // Press Enter to try submitting
            await page.keyboard.press('Enter');
            
            // Wait to see if navigation starts or if we still need to click the button
            await new Promise(r => setTimeout(r, 1000));
            
            // Try native Puppeteer click on the button
            const loginBtns = await page.$$('button');
            for (const btn of loginBtns) {
                const text = await page.evaluate(el => el.textContent, btn);
                if (text && text.trim().toUpperCase() === 'LOG IN') {
                    await btn.click();
                    break;
                }
            }

            console.log('  → Login submitted, waiting...');
            // Wait for navigation or dom changes
            await Promise.race([
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
                new Promise(r => setTimeout(r, 15000))
            ]).catch(() => null);
            
            await new Promise(r => setTimeout(r, 3000));
            
            // Verify login succeeded
            const stillLoggedOut = await page.evaluate(() => {
                return !!Array.from(document.querySelectorAll('button, a'))
                    .find(el => el.textContent?.trim().toUpperCase() === 'LOGIN');
            });
            
            if (stillLoggedOut) {
                console.log('  → Login may have failed (LOGIN button still visible).');
                return false;
            }
            console.log('  → Login successful!');
            return true;
        } catch (e) {
            console.log('  → Login form interaction failed:', e.message);
            return false;
        }

        return false;
    }

    async function ensureLoggedIn() {
        // Check current page for login state
        const isLoggedOut = await page.evaluate(() => {
            const text = document.body.innerText || '';
            return text.includes('Not logged in') || 
                   !!Array.from(document.querySelectorAll('button, a'))
                       .find(el => el.textContent?.trim().toUpperCase() === 'LOGIN');
        }).catch(() => true);

        if (isLoggedOut) {
            console.log('  → Session expired. Re-logging in...');
            return await doLogin();
        }
        return true;
    }

    async function scrapeMatchday(seasonId, leagueName, leagueId, matchday) {
        const url = `https://www.betpawa.cm/virtual-sports/matchday/${seasonId}?matchday=${matchday}&leagueId=${leagueId}`;
        
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
                await new Promise(r => setTimeout(r, 2000));

                // Check if we got logged out during navigation
                const loggedOut = await page.evaluate(() => {
                    return document.body.innerText.includes('Not logged in');
                });

                if (loggedOut) {
                    console.log(`    Logged out on attempt ${attempt}. Re-authenticating...`);
                    await doLogin();
                    continue; // Retry this matchday
                }

                const matches = await page.evaluate(() => {
                    const results = [];
                    const fullText = document.body.innerText;
                    
                    // Flexible regex for team abbreviations and scores
                    const globalRegex = /([A-Z0-9]{2,4}\s*-\s*[A-Z0-9]{2,4})\s*(\(\d+\s*-\s*\d+\))?\s*(\d+\s*-\s*\d+)/g;
                    
                    let m;
                    while ((m = globalRegex.exec(fullText)) !== null) {
                        results.push({
                            teams: m[1].trim(),
                            halfTime: m[2] ? m[2].replace(/[()]/g, '').trim() : '',
                            score: m[3].trim()
                        });
                    }
                    
                    return results;
                });

                if (matches.length > 0) {
                    return matches;
                }

                // No matches found - might be a loading issue
                if (attempt < MAX_RETRIES) {
                    console.log(`    No matches found (attempt ${attempt}/${MAX_RETRIES}), retrying...`);
                    await new Promise(r => setTimeout(r, 3000));
                }
            } catch (e) {
                if (attempt < MAX_RETRIES) {
                    console.log(`    Error on attempt ${attempt}: ${e.message}. Retrying...`);
                    await new Promise(r => setTimeout(r, 3000));
                }
            }
        }

        return []; // All retries exhausted
    }

    async function saveData() {
        await fs.writeFile(DATA_PATH, JSON.stringify(allResults, null, 2));
    }

    try {
        console.log('=== BetPawa Virtual Sports Scraper ===');
        console.log(`Target: 5 seasons × 7 leagues × 38 matchdays = 1,330 matchdays`);
        console.log(`Already scraped: ${allResults.length} matchdays\n`);

        // Initial login
        await doLogin();

        const latestSeason = 137873;
        const seasonsToScrape = 5;
        let newMatchdays = 0;
        let failedMatchdays = 0;

        for (let s = 0; s < seasonsToScrape; s++) {
            const seasonId = latestSeason - s;
            console.log(`\n=== Season #${seasonId} (${s + 1}/${seasonsToScrape}) ===`);

            for (const [leagueName, leagueId] of Object.entries(LEAGUES)) {
                console.log(`\n  ${leagueName} (ID: ${leagueId})`);
                
                let consecutiveFails = 0;

                for (let matchday = 1; matchday <= 38; matchday++) {
                    // Skip if already scraped
                    const key = `${seasonId}_${leagueName}_${matchday}`;
                    if (scrapedKeys.has(key)) {
                        process.stdout.write('·'); // Already have this data
                        continue;
                    }

                    // Re-check login every 10 matchdays
                    if (matchday % 10 === 1) {
                        await ensureLoggedIn();
                    }

                    const matches = await scrapeMatchday(seasonId, leagueName, leagueId, matchday);

                    if (matches.length > 0) {
                        allResults.push({ seasonId, leagueName, matchday, matches });
                        scrapedKeys.add(key);
                        await saveData();
                        process.stdout.write('✓');
                        newMatchdays++;
                        consecutiveFails = 0;
                    } else {
                        process.stdout.write('✗');
                        failedMatchdays++;
                        consecutiveFails++;
                        
                        // If 5 in a row fail, this season/league combo probably doesn't exist
                        if (consecutiveFails >= 5) {
                            console.log(`\n    Stopping ${leagueName} Season ${seasonId} after ${consecutiveFails} consecutive failures.`);
                            break;
                        }
                    }
                }
                console.log(`  → Done (${newMatchdays} new, ${failedMatchdays} failed so far)`);
            }
        }

        console.log(`\n\n=== SCRAPING COMPLETE ===`);
        console.log(`Total matchdays in dataset: ${allResults.length}`);
        console.log(`New matchdays this run: ${newMatchdays}`);
        console.log(`Failed matchdays: ${failedMatchdays}`);
        console.log(`Total matches: ${allResults.reduce((sum, md) => sum + md.matches.length, 0)}`);

    } catch (error) {
        console.error('\nScraping failed:', error);
        console.log('Data saved up to this point. Run again to resume.');
    } finally {
        await browser.close();
    }
}

scrape();
