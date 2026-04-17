/**
 * 🤖 MarketVibe Reddit Herald (Edge Remote Debugging)
 * Connects to the user's running Edge browser and posts replies.
 * 
 * Setup: Create an Edge shortcut with --remote-debugging-port=9222 flag.
 * Then the bot connects to your running browser and posts autonomously.
 */

import puppeteer from 'puppeteer-core';
import dotenv from 'dotenv';
dotenv.config();

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const humanDelay = (min = 1000, max = 3000) => sleep(min + Math.random() * (max - min));

const EDGE_DEBUG_PORT = process.env.EDGE_DEBUG_PORT || 9222;

/**
 * Connect to existing Edge browser via remote debugging
 */
async function connectToEdge() {
    try {
        const resp = await fetch(`http://127.0.0.1:${EDGE_DEBUG_PORT}/json/version`);
        const data = await resp.json();

        if (!data.webSocketDebuggerUrl) {
            console.error('No debugger URL found');
            return null;
        }

        const browser = await puppeteer.connect({
            browserWSEndpoint: data.webSocketDebuggerUrl,
            defaultViewport: null,
            protocolTimeout: 0
        });

        console.log('Connected to Edge browser');
        return browser;
    } catch (e) {
        console.error('Cannot connect to Edge. Make sure Edge is running with --remote-debugging-port=' + EDGE_DEBUG_PORT);
        console.error('Add this flag to your Edge shortcut target.');
        return null;
    }
}

/**
 * Post a reply to a Reddit thread using the connected Edge browser
 */
export const postRedditReply = async (postId, content) => {
    let browser = null;
    let page = null;
    let username = null;

    try {
        browser = await connectToEdge();

        if (!browser) {
            return { success: false, error: 'MISSING_API_KEYS' };
        }

        // Open a new tab (don't interfere with existing tabs)
        page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

        // Check login status
        console.log('Checking Reddit session...');
        try {
            await page.goto('https://old.reddit.com/', { waitUntil: 'domcontentloaded', timeout: 15000 });

            // Bypass cookie wall if present
            await page.evaluate(() => {
                const btn = document.querySelector('button.continue') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('CONTINUE'));
                if (btn) btn.click();
            }).catch(() => { });

            await sleep(2000);

            const loggedIn = await page.evaluate(() => {
                const userLink = document.querySelector('.user a');
                return userLink ? userLink.innerText.trim() : null;
            });

            if (loggedIn && !loggedIn.toLowerCase().includes('log in')) {
                username = loggedIn;
                console.log('Logged in as u/' + username);
            } else {
                // Secondary check via API
                const resp = await page.goto('https://old.reddit.com/api/me.json', { timeout: 10000 });
                const meText = await page.evaluate(() => document.body.innerText);
                const me = JSON.parse(meText);
                if (me?.data?.name) {
                    username = me.data.name;
                    console.log('Logged in as u/' + username + ' (via API)');
                }
            }
        } catch (e) {
            console.warn('Reddit session check failed:', e.message);
        }

        if (!username || username.toLowerCase().includes('log in')) {
            console.log('🔄 Session missing or expired. Attempting automated login...');
            const loginSuccess = await performRedditLogin(page);
            if (loginSuccess) {
                // Verify again on old.reddit.com
                await page.goto('https://old.reddit.com/', { waitUntil: 'domcontentloaded', timeout: 15000 });
                const verif = await page.evaluate(() => {
                    const userLink = document.querySelector('.user a');
                    return userLink ? userLink.innerText.trim() : null;
                });
                if (verif && !verif.toLowerCase().includes('log in')) {
                    username = verif;
                    console.log('✅ Automated login verified: u/' + username);
                }
            }
        }

        if (!username || username.toLowerCase().includes('log in')) {
            console.error('Not logged into Reddit in Edge.');
            // Capture screenshot for debugging if possible
            await page.screenshot({ path: 'reddit_login_error.png' }).catch(() => { });
            await page.close();
            browser.disconnect();
            return { success: false, error: 'MISSING_API_KEYS' };
        }

        // Humanistic pause
        const delay = 3000 + Math.random() * 5000;
        console.log('Waiting ' + (delay / 1000).toFixed(1) + 's before posting...');
        await sleep(delay);

        // Navigate to thread
        console.log('Opening thread t3_' + postId + '...');
        await page.goto('https://old.reddit.com/comments/' + postId, {
            waitUntil: 'domcontentloaded',
            timeout: 15000
        });

        // 🛡️ ANTI-BOT: Human-like scrolling behavior
        console.log('Simulating reading... (scrolling)');
        await page.evaluate(async () => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, Math.random() * 500);
            await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
            window.scrollBy(0, Math.random() * 500);
        });

        await humanDelay(2000, 5000);

        const hasCommentBox = await page.evaluate(() => { return !!document.querySelector('.usertext-edit textarea, textarea[name="text"]'); });
        if (!hasCommentBox) {
            console.error('No comment box found. Thread may be locked or deleted.');
            await page.close();
            browser.disconnect();
            return { success: false, error: 'THREAD_LOCKED' };
        }

        // 🛡️ ANTI-BOT: Type with human-like speed
        console.log('Typing response...');
        await page.type('.usertext-edit textarea, textarea[name="text"]', content, { delay: 50 + Math.random() * 100 });

        await humanDelay(1500, 3000);

        // Submit
        const submitted = await page.evaluate(() => {
            const btn = document.querySelector('.usertext-buttons button[type="submit"], button.save');
            if (btn) { btn.click(); return true; }
            return false;
        });

        if (!submitted) {
            console.error('Could not find submit button');
            await page.close();
            browser.disconnect();
            return { success: false, error: 'NO_SUBMIT_BUTTON' };
        }

        await humanDelay(3000, 5000);

        // Aggressively handle "are you sure? yes / no" confirmation prompt if it appears
        const clickedYes = await page.evaluate(() => {
            let found = false;
            // Scan literally every A, BUTTON, or element with class .yes
            const elements = document.querySelectorAll('a, button, .yes');
            for (const el of elements) {
                if (el.innerText && el.innerText.trim().toLowerCase() === 'yes') {
                    el.click();
                    found = true;
                }
            }
            return found;
        });

        if (clickedYes) {
            console.log('🔥 Found and clicked a hidden "Yes" confirmation. Waiting for processing...');
            await new Promise(r => setTimeout(r, 3000));
        } else {
            // Backup wait just in case
            await new Promise(r => setTimeout(r, 1000));
        }

        // Check for rate limit errors or submission failures
        const errors = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.error, .status-msg, .error-msg'))
                .map(e => e.innerText).filter(Boolean);
        });

        if (errors.some(e => e.toLowerCase().includes('too fast') || e.toLowerCase().includes('wait'))) {
            console.warn('Rate limited: ' + errors.join('; '));
            await page.close();
            browser.disconnect();
            return { success: false, error: 'RATE_LIMITED', waitMinutes: 10 };
        }

        if (errors.length > 0) {
            console.warn('Reddit reported errors: ' + errors.join('; '));
            await page.close();
            browser.disconnect();
            return { success: false, error: 'REDDIT_ERROR', details: errors.join('; ') };
        }

        console.log('Reply posted to t3_' + postId + '!');
        await page.close();
        browser.disconnect();
        return { success: true };

    } catch (err) {
        console.error('Herald Error:', err.message);
        if (page) await page.close().catch(() => { });
        if (browser) browser.disconnect();

        // Distinguish timeouts vs connection errors
        const errorCode = err.message.includes('timeout') ? 'TIMEOUT' : 'BROWSER_ERROR';
        return { success: false, error: errorCode, details: err.message };
    }
};
/**
 * Perform automated login to Reddit
 */
async function performRedditLogin(page) {
    const user = process.env.REDDIT_USERNAME;
    const pass = process.env.REDDIT_PASSWORD;

    if (!user || !pass) {
        console.warn('⚠️ REDDIT_USERNAME or REDDIT_PASSWORD missing from .env');
        return false;
    }

    try {
        console.log('🔑 Navigating to Reddit login...');
        await page.goto('https://old.reddit.com/login', { waitUntil: 'networkidle2', timeout: 30000 });

        console.log('⌨️ Entering credentials...');
        await page.type('#user_login', user, { delay: 100 });
        await page.type('#passwd_login', pass, { delay: 100 });

        await sleep(1000);

        console.log('🔘 Submitting...');
        await page.click('#login-form button[type="submit"]');

        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => { });

        return true;
    } catch (err) {
        console.error('❌ Reddit Login Failed:', err.message);
        return false;
    }
}
