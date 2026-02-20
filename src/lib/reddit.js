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
            defaultViewport: null
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
        await page.goto('https://old.reddit.com/api/me.json', {
            waitUntil: 'domcontentloaded',
            timeout: 15000
        });

        const meText = await page.evaluate(() => document.body.innerText);
        let username = null;

        try {
            const me = JSON.parse(meText);
            if (me?.data?.name) {
                username = me.data.name;
                console.log('Logged in as u/' + username);
            }
        } catch { }

        if (!username) {
            console.error('Not logged into Reddit in Edge.');
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

        // Type comment
        const hasCommentBox = await page.evaluate(() => {
            const ta = document.querySelector('.usertext-edit textarea, textarea[name="text"]');
            return !!ta;
        });

        if (!hasCommentBox) {
            console.error('No comment box found. Thread may be locked.');
            await page.close();
            browser.disconnect();
            return { success: false, error: 'NO_COMMENT_BOX' };
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

        // Check for rate limit errors
        const errors = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.error, .status-msg'))
                .map(e => e.innerText).filter(Boolean);
        });

        if (errors.some(e => e.toLowerCase().includes('too fast') || e.toLowerCase().includes('wait'))) {
            console.warn('Rate limited: ' + errors.join('; '));
            await page.close();
            browser.disconnect();
            return { success: false, error: 'RATE_LIMITED', waitMinutes: 10 };
        }

        console.log('Reply posted to t3_' + postId + '!');
        await page.close();
        browser.disconnect();
        return { success: true };

    } catch (err) {
        console.error('Herald Error:', err.message);
        if (page) await page.close().catch(() => { });
        if (browser) browser.disconnect();
        return { success: false, error: err.message };
    }
};
