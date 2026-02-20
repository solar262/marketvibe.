/**
 * MarketVibe Twitter Growth Bot
 * ─────────────────────────────
 * Connects to your running Edge browser (same as Reddit bot),
 * finds angel investors & VCs on Twitter/X, follows them,
 * and optionally replies to their latest tweet.
 *
 * Prerequisites:
 *  1. Edge must be running with: --remote-debugging-port=9222
 *  2. You must be logged in to x.com in Edge
 *
 * Run once:      node twitter_growth_bot.mjs
 * Run scheduled: node twitter_growth_bot.mjs --scheduled
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';

// ── CONFIG ──────────────────────────────────────────────────────────────────
const CONFIG = {
    followsPerRun: 10,       // profiles to follow per run
    repliesPerRun: 2,        // tweets to reply to per run (keep low)
    minDelay: 3000,
    maxDelay: 7000,

    searchTerms: [
        'angel investor deal flow',
        'micro VC startup investing',
        'angel investor SaaS',
        'early stage investor startup',
        'pre-seed investor founder',
    ],

    replyTemplates: [
        `Interesting take on deal flow. We built a private feed of 500+ validated startups for angels — full market data included. marketvibe1.com/investors`,
        `This is exactly why we built MarketVibe Investor Access — validated deal flow with revenue forecasts before public launch. marketvibe1.com/investors`,
        `Great point. For angels looking for early validated deals — we just launched a private feed at marketvibe1.com/investors 🚀`,
    ],

    logFile: './public/twitter_bot_log.json',
    edgeDebugPort: process.env.EDGE_DEBUG_PORT || 9222,
};

// ── HELPERS ──────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const randomDelay = () => sleep(CONFIG.minDelay + Math.random() * (CONFIG.maxDelay - CONFIG.minDelay));
const getRandomReply = () => CONFIG.replyTemplates[Math.floor(Math.random() * CONFIG.replyTemplates.length)];

function log(message, data = {}) {
    const entry = { time: new Date().toISOString(), message, ...data };
    console.log(`[TwitterBot] ${message}`, Object.keys(data).length ? data : '');
    try {
        const existing = fs.existsSync(CONFIG.logFile)
            ? JSON.parse(fs.readFileSync(CONFIG.logFile, 'utf8'))
            : [];
        existing.push(entry);
        fs.writeFileSync(CONFIG.logFile, JSON.stringify(existing.slice(-200), null, 2));
    } catch { }
}

// ── CONNECT TO EDGE ──────────────────────────────────────────────────────────
async function connectToEdge() {
    try {
        const resp = await fetch(`http://127.0.0.1:${CONFIG.edgeDebugPort}/json/version`);
        const data = await resp.json();
        if (!data.webSocketDebuggerUrl) throw new Error('No debugger URL');
        const browser = await puppeteer.connect({
            browserWSEndpoint: data.webSocketDebuggerUrl,
            defaultViewport: null,
        });
        log('✅ Connected to Edge browser');
        return browser;
    } catch (e) {
        log(`❌ Cannot connect to Edge on port ${CONFIG.edgeDebugPort}.`);
        log('   Make sure Edge is running with: --remote-debugging-port=9222');
        log('   (Same setup as the Reddit bot)');
        return null; // Return null instead of exiting
    }
}

// ── REPLY TO LATEST TWEET ────────────────────────────────────────────────────
// ── SEND NEW TWEET ──────────────────────────────────────────────────────────
export async function sendTweet(text) {
    let browser = null;
    try {
        browser = await connectToEdge();
        if (!browser) return false;
        const page = await browser.newPage();

        await page.goto('https://x.com/compose/tweet', { waitUntil: 'domcontentloaded' });
        await sleep(4000);

        // Check for login
        if (page.url().includes('login')) {
            console.error('❌ Not logged in to Twitter/X in Edge.');
            await page.close();
            return false;
        }

        // Wait for composer
        const textBoxSelector = '[data-testid="tweetTextarea_0"]';
        await page.waitForSelector(textBoxSelector, { timeout: 10000 });

        // Type text
        await page.click(textBoxSelector);
        await page.keyboard.type(text, { delay: 30 });
        await sleep(2000);

        // Click Tweet
        const tweetBtnSelector = '[data-testid="tweetButton"]';
        await page.click(tweetBtnSelector);
        await sleep(5000); // Wait for send

        log(`✅ Tweet sent: "${text}"`);
        await page.close();
        browser.disconnect();
        return true;

    } catch (err) {
        log(`❌ Tweet failed: ${err.message}`);
        if (browser) browser.disconnect();
        return false;
    }
}

// ── MAIN BOT ─────────────────────────────────────────────────────────────────
async function runTwitterGrowthBot() {
    log('🚀 Twitter Growth Bot starting...');

    const browser = await connectToEdge();
    if (!browser) return;
    const page = await browser.newPage();
    page.setDefaultTimeout(60000); // Increased timeout to 60s

    try {
        // Check logged in to Twitter
        // Use domcontentloaded which is faster/safer than networkidle2 for Twitter/X
        await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded' });
        await sleep(5000); // Give it a bit more time to settle

        const currentUrl = page.url();
        if (currentUrl.includes('/login') || currentUrl.includes('/i/flow')) {
            log('⚠️  Not logged in to Twitter in Edge. Please log in to x.com in your Edge browser first.');
            await page.close();
            return;
        }
        log('✅ Logged in to Twitter/X');

        let totalFollowed = 0;
        let totalReplied = 0;

        // ── Search and follow investors ──────────────────────────────────
        for (const searchTerm of CONFIG.searchTerms) {
            if (totalFollowed >= CONFIG.followsPerRun) break;

            log(`🔍 Searching: "${searchTerm}"`);

            const searchUrl = `https://x.com/search?q=${encodeURIComponent(searchTerm)}&f=user`;
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
            await sleep(5000);

            // Extract profile URLs from search results
            const profileLinks = await page.evaluate(() => {
                const seen = new Set();
                const links = [];
                document.querySelectorAll('a[href]').forEach(a => {
                    const href = a.href;
                    const parts = href.replace('https://x.com/', '').split('/');
                    if (
                        href.includes('x.com/') &&
                        parts.length === 1 &&
                        parts[0].length > 1 &&
                        !['home', 'explore', 'notifications', 'messages', 'search', 'settings', 'i'].includes(parts[0]) &&
                        !seen.has(href)
                    ) {
                        seen.add(href);
                        links.push(href);
                    }
                });
                return links.slice(0, 8);
            });

            log(`Found ${profileLinks.length} profiles`);

            for (const profileUrl of profileLinks) {
                if (totalFollowed >= CONFIG.followsPerRun) break;

                try {
                    log(`Visiting: ${profileUrl}`);
                    await page.goto(profileUrl, { waitUntil: 'domcontentloaded' });
                    await sleep(4000);

                    // Find follow button (not unfollow/following)
                    const followed = await page.evaluate(() => {
                        const buttons = Array.from(document.querySelectorAll('[data-testid]'));
                        const followBtn = buttons.find(b => {
                            const testId = b.getAttribute('data-testid') || '';
                            const text = b.innerText?.toLowerCase() || '';
                            return testId.includes('follow') &&
                                !testId.includes('unfollow') &&
                                text === 'follow';
                        });
                        if (followBtn) {
                            followBtn.click();
                            return true;
                        }
                        return false;
                    });

                    if (followed) {
                        totalFollowed++;
                        log(`✅ Followed (${totalFollowed}/${CONFIG.followsPerRun})`, { url: profileUrl });
                        await randomDelay();

                        // Optionally reply to their latest tweet
                        if (totalReplied < CONFIG.repliesPerRun && Math.random() > 0.65) {
                            const replied = await replyToLatestTweet(page, getRandomReply());
                            if (replied) {
                                totalReplied++;
                                log(`💬 Replied (${totalReplied}/${CONFIG.repliesPerRun})`);
                            }
                        }
                    } else {
                        log(`Already following or no button found`, { url: profileUrl });
                    }

                    await randomDelay();
                } catch (err) {
                    log(`Error on profile: ${err.message}`, { url: profileUrl });
                }
            }
        }

        log(`\n✅ Run complete! Followed: ${totalFollowed} | Replied: ${totalReplied}`);

    } catch (err) {
        log(`❌ Fatal error: ${err.message}`);
    } finally {
        await page.close();
    }
}

// ── SCHEDULER ────────────────────────────────────────────────────────────────
async function runScheduled() {
    const INTERVAL_HOURS = 6;
    log(`📅 Scheduled mode — running every ${INTERVAL_HOURS} hours`);
    while (true) {
        await runTwitterGrowthBot();
        log(`⏳ Next run in ${INTERVAL_HOURS} hours...`);
        await sleep(INTERVAL_HOURS * 60 * 60 * 1000);
    }
}

// ── ENTRY ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.includes('--scheduled')) {
    runScheduled();
} else {
    runTwitterGrowthBot();
}
