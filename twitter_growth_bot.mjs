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
    followsPerRun: 4,        // SAFE: keep low to avoid X lockouts
    repliesPerRun: 2,        // ENABLED: limited for safety
    minDelay: 8000,          // slower = safer
    maxDelay: 18000,

    searchTerms: [
        'building a micro saas',
        'just launched my saas',
        'building in public saas',
        'indie hacker saas validation',
        'first customer micro saas',
    ],

    replyTemplates: [
        `Love this! If you're navigating the Micro-SaaS market, validation is key. Pulled some signals on similar niches at marketvibe1.com 🚀`,
        `This is exactly why validating early saves months. If you're ready to SCALE this and get customers autonomously, check out our new studio: outreach-dashboard-1.onrender.com`,
        `Great stuff. Market validation is the hardest part, but closing leads is the goal. We just launched an autonomous outreach engine at outreach-dashboard-1.onrender.com if you want to skip the grind.`,
        `🌶️ Most cold DMs suck. If you're getting ignored, try running your pitch through our free AI Roaster: outreach-dashboard-1.onrender.com/roaster`
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

const edgeDebugPort = process.env.EDGE_DEBUG_PORT || 9222;

// ── CONNECT TO EDGE ──────────────────────────────────────────────────────────
async function connectToEdge() {
    try {
        const resp = await fetch(`http://127.0.0.1:${edgeDebugPort}/json/version`);
        const data = await resp.json();
        if (!data.webSocketDebuggerUrl) throw new Error('No debugger URL');
        const browser = await puppeteer.connect({
            browserWSEndpoint: data.webSocketDebuggerUrl,
            defaultViewport: null,
            protocolTimeout: 0
        });
        log('✅ Connected to Edge browser');
        return browser;
    } catch (e) {
        log(`❌ Cannot connect to Edge on port ${edgeDebugPort}.`);
        log('   Make sure Edge is running with: --remote-debugging-port=9222');
        log('   (Same setup as the Reddit bot)');
        return null; // Return null instead of exiting
    }
}

// ── REPLY TO LATEST TWEET ────────────────────────────────────────────────────
async function replyToLatestTweet(page, text) {
    try {
        log('👀 Looking for latest tweet to reply to...');

        // Wait for tweets to load on the profile
        await page.waitForSelector('[data-testid="tweet"]', { timeout: 15000 }).catch(() => null);

        // Find the first reply button (which is usually on the latest tweet)
        const replyClicked = await page.evaluate(() => {
            const replyBtns = Array.from(document.querySelectorAll('[data-testid="reply"]'));
            if (replyBtns.length > 0) {
                // Click the first one
                replyBtns[0].click();
                return true;
            }
            return false;
        });

        if (!replyClicked) {
            log('⚠️ No tweet found to reply to.');
            return false;
        }

        // Wait for the modal composer to pop up
        log('⌨️ Waiting for reply modal...');
        const textBoxSelector = '[data-testid="tweetTextarea_0"]';
        await page.waitForSelector(textBoxSelector, { timeout: 10000 });

        log('📝 Typing reply...');
        await page.click(textBoxSelector);
        await sleep(500);
        // Use execCommand so React doesn't double-fire on each keypress
        await page.evaluate((t) => {
            document.execCommand('insertText', false, t);
        }, text);
        await sleep(1000);

        log('🔘 Clicking reply button...');
        const tweetBtnSelector = '[data-testid="tweetButton"]';
        await page.click(tweetBtnSelector);

        log('⏳ Waiting for confirmation...');
        await sleep(4000); // Wait for send
        return true;
    } catch (err) {
        log(`❌ Reply failed: ${err.message}`);
        return false;
    }
}

// ── REPLY TO SPECIFIC TWEET ID ──────────────────────────────────────────────
export async function replyToTweetById(tweetId, text) {
    let browser = null;
    try {
        browser = await connectToEdge();
        if (!browser) return false;
        const page = await browser.newPage();

        log(`🐦 Opening Tweet ${tweetId} to reply...`);
        await page.goto(`https://x.com/any/status/${tweetId}`, { waitUntil: 'domcontentloaded' });
        await sleep(6000);

        // Check for login
        if (page.url().includes('login')) {
            log('❌ Not logged in to Twitter/X in Edge.');
            await page.close();
            return false;
        }

        // Click reply button first to open composer
        const replyClicked = await page.evaluate(() => {
            const btn = document.querySelector('[data-testid="reply"]');
            if (btn) { btn.click(); return true; }
            return false;
        });

        if (!replyClicked) {
            log('⚠️ Reply button not found (Post may be deleted or locked)');
            await page.close();
            return false;
        }

        await sleep(2000);

        log('⌨️ Waiting for text area...');
        const textBoxSelector = '[data-testid="tweetTextarea_0"]';
        await page.waitForSelector(textBoxSelector, { timeout: 10000 });

        log('📝 Typing reply...');
        await page.click(textBoxSelector);
        await sleep(500);
        await page.evaluate((t) => {
            document.execCommand('insertText', false, t);
        }, text);
        await sleep(2000);

        log('🔘 Clicking reply button...');
        const tweetBtnSelector = '[data-testid="tweetButton"]';
        await page.click(tweetBtnSelector);

        log('⏳ Waiting for confirmation...');
        await sleep(6000);

        log(`✅ Replied to Tweet ${tweetId}`);
        await page.close();
        browser.disconnect();
        return true;

    } catch (err) {
        log(`❌ Direct reply failed: ${err.message}`);
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
    const INTERVAL_HOURS = 12;  // 12h gap — much safer than 6h
    log(`📅 Scheduled mode — running every ${INTERVAL_HOURS} hours`);
    while (true) {
        await runTwitterGrowthBot();
        log(`⏳ Next run in ${INTERVAL_HOURS} hours...`);
        await sleep(INTERVAL_HOURS * 60 * 60 * 1000);
    }
}

// ── ENTRY ────────────────────────────────────────────────────────────────────
const isMain = process.argv[1] && (
    import.meta.url.includes(process.argv[1].replace(/\\/g, '/')) ||
    import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop())
);

if (isMain) {
    const args = process.argv.slice(2);
    if (args.includes('--scheduled')) {
        runScheduled();
    } else {
        runTwitterGrowthBot();
    }
}
