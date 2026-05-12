import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config({ path: '.env.local' });

const PHONE = process.env.BETPAWA_PHONE;
const PASSWORD = process.env.BETPAWA_PASSWORD;
const BASE_URL = 'https://www.betpawa.cm/virtual-sports?virtualTab=results';

const LEAGUES = {
    'English League': 7794,
    'Spanish League': 7795,
    'Italian League': 7796,
    'German League': 9184,
    'French League': 9183,
    'Dutch League': 13774,
    'Portuguese League': 13773
};

async function scrape() {
    const browser = await puppeteer.launch({
        headless: "new",
        defaultViewport: { width: 1280, height: 800 }
    });
    const page = await browser.newPage();

    async function takeScreenshot(name) {
        await page.screenshot({ path: `data/error_${name}.png` });
        console.log(`Screenshot saved: data/error_${name}.png`);
    }

    try {
        console.log('Navigating to BetPawa...');
        await page.goto('https://www.betpawa.cm', { waitUntil: 'networkidle2' });

        // Handle Login
        console.log('Checking login status...');
        
        // Try to find any button or link that says "LOGIN"
        const elements = await page.$$('button, a');
        let loginButton = null;
        for (const el of elements) {
            const text = await page.evaluate(el => el.textContent, el);
            if (text && text.trim().toUpperCase() === 'LOGIN') {
                loginButton = el;
                break;
            }
        }

        if (loginButton) {
            console.log('Login button found. Clicking...');
            await loginButton.click();
            
            console.log('Waiting for login form...');
            try {
                await page.waitForSelector('input[type="tel"]', { timeout: 10000 });
                await page.type('input[type="tel"]', PHONE);
                await page.type('input[type="password"]', PASSWORD);
                
                // Find the login submit button inside the modal/form
                const submitButtons = await page.$$('button');
                for (const btn of submitButtons) {
                    const text = await page.evaluate(el => el.textContent, btn);
                    if (text && text.trim().toUpperCase() === 'LOGIN') {
                        await btn.click();
                        break;
                    }
                }
                console.log('Login submitted. Waiting for navigation...');
                await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => console.log('Navigation took too long, continuing...'));
            } catch (e) {
                console.log('Login form not found or timed out.');
                await takeScreenshot('login_fail');
            }
        } else {
            console.log('Login button not found. Already logged in?');
            await takeScreenshot('no_login_button');
        }

        const latestSeason = 137873;
        const seasonsToScrape = 1; 
        const allResults = [];

        for (let s = 0; s < seasonsToScrape; s++) {
            const seasonId = latestSeason - s;
            console.log(`\n--- Scraping Season #${seasonId} ---`);

            for (const [leagueName, leagueId] of Object.entries(LEAGUES)) {
                console.log(`Scraping ${leagueName} (ID: ${leagueId})...`);

                for (let matchday = 1; matchday <= 1; matchday++) {
                    const url = `https://www.betpawa.cm/virtual-sports/matchday/${seasonId}?matchday=${matchday}&leagueId=${leagueId}`;
                    await page.goto(url, { waitUntil: 'networkidle2' });

                    // Wait for results to load
                    await page.waitForSelector('div.jsx-3604018260', { timeout: 5000 }).catch(() => null);

                    const matches = await page.evaluate(() => {
                        const matchRows = Array.from(document.querySelectorAll('div.jsx-3604018260'));
                        return matchRows.map(row => {
                            const teams = row.querySelector('span.jsx-3604018260')?.textContent || '';
                            const score = row.querySelector('span.jsx-2104192667')?.textContent || ''; // Score selector might need tweak
                            return { teams, score };
                        });
                    });

                    if (matches.length > 0) {
                        allResults.push({
                            seasonId,
                            leagueName,
                            matchday,
                            matches
                        });
                        process.stdout.write('.');
                    } else {
                        // If no matches found, maybe the season/matchday doesn't exist
                        break; 
                    }
                }
                console.log(` Done.`);
            }
        }

        const dataPath = path.join(process.cwd(), 'data', 'betpawa_history.json');
        await fs.writeFile(dataPath, JSON.stringify(allResults, null, 2));
        console.log(`\nSuccessfully scraped ${allResults.length} matchdays.`);
        console.log(`Data saved to ${dataPath}`);

    } catch (error) {
        console.error('Scraping failed:', error);
    } finally {
        await browser.close();
    }
}

scrape();
