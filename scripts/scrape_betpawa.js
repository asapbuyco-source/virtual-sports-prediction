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
                // Use exact IDs and placeholders discovered
                await page.waitForSelector('#phoneNumber', { timeout: 10000 });
                await page.type('#phoneNumber', PHONE);
                await page.type('input[placeholder="XXXX"]', PASSWORD);
                
                // Find the login submit button by its text content
                const submitButtons = await page.$$('button');
                let submitClicked = false;
                for (const btn of submitButtons) {
                    const text = await page.evaluate(el => el.textContent, btn);
                    if (text && text.trim().toUpperCase() === 'LOG IN') {
                        await btn.click();
                        submitClicked = true;
                        break;
                    }
                }
                
                if (submitClicked) {
                    console.log('Login submitted. Waiting for navigation...');
                    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => console.log('Navigation took too long, continuing...'));
                }
            } catch (e) {
                console.log('Login form interaction failed.');
                await takeScreenshot('login_fail');
            }
        } else {
            console.log('Login button not found. Already logged in?');
        }

        const latestSeason = 137873;
        const seasonsToScrape = 5; 
        const allResults = [];

        for (let s = 0; s < seasonsToScrape; s++) {
            const seasonId = latestSeason - s;
            console.log(`\n--- Scraping Season #${seasonId} ---`);

            for (const [leagueName, leagueId] of Object.entries(LEAGUES)) {
                console.log(`Scraping ${leagueName} (ID: ${leagueId})...`);

                for (let matchday = 1; matchday <= 38; matchday++) {
                    const url = `https://www.betpawa.cm/virtual-sports/matchday/${seasonId}?matchday=${matchday}&leagueId=${leagueId}`;
                    await page.goto(url, { waitUntil: 'networkidle2' });

                    // Wait for results to load - use the new verified selector
                    await page.waitForSelector('div[class*="SeasonResults_matchRow"]', { timeout: 10000 }).catch(() => null);
                    
                    // Small delay to ensure dynamic content is fully rendered
                    await new Promise(r => setTimeout(r, 1000));

                    const matches = await page.evaluate(() => {
                        const rows = Array.from(document.querySelectorAll('div[class*="VirtualLeagueList_matchesContainer"]'));
                        // If that doesn't work, try finding by the team spans directly
                        const teamSpans = Array.from(document.querySelectorAll('span[class*="VirtualLeagueList_titleMatch"]'));
                        return teamSpans.map(span => {
                            const row = span.closest('div'); 
                            const teams = span.textContent || '';
                            const score = row?.querySelector('span[class*="VirtualLeagueList_score"]')?.textContent || '';
                            // Half-time is often part of the score span or separate
                            return { teams, score };
                        });
                    });

                    console.log(`Found ${matches.length} matches for ${leagueName} Matchday ${matchday}`);
                    if (matches.length === 0) {
                        const content = await page.evaluate(() => document.body.innerText.substring(0, 500));
                        console.log(`Page content snippet: ${content.replace(/\n/g, ' ')}`);
                        await takeScreenshot(`fail_${leagueName}_md${matchday}`);
                    }

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
