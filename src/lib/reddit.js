/**
 * 🤖 MarketVibe Reddit Herald (Browser Profile Mode)
 * Uses the user's existing browser session — no login needed.
 * 
 * Launches a headless browser using the user's Chrome/Edge profile,
 * which already has Reddit cookies from their normal browsing.
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const humanDelay = (min = 1000, max = 3000) => sleep(min + Math.random() * (max - min));

/**
 * Find the user's browser executable
 */
function findBrowserPath() {
    const paths = [
        // Edge (most likely on Windows)
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        // Chrome
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        `${process.env.LOCALAPPDATA || ''}\\Google\\Chrome\\Application\\chrome.exe`,
    ];

    for (const p of paths) {
        if (fs.existsSync(p)) return p;
    }
    return null;
}

/**
 * Get the user data directory for Edge/Chrome
 */
function getUserDataDir() {
    const localApp = process.env.LOCALAPPDATA || `C:\\Users\\${process.env.USERNAME}\\AppData\\Local`;
    const edgePath = path.join(localApp, 'Microsoft', 'Edge', 'User Data');
    const chromePath = path.join(localApp, 'Google', 'Chrome', 'User Data');

    if (fs.existsSync(edgePath)) return { dir: edgePath, name: 'Edge' };
    if (fs.existsSync(chromePath)) return { dir: chromePath, name: 'Chrome' };
    return null;
}

/**
 * Launch browser with user's existing profile (already logged into Reddit)
 */
async function launchWithProfile() {
    const browserPath = findBrowserPath();
    const userData = getUserDataDir();

    if (!browserPath) {
        console.error('❌ Could not find Chrome or Edge. Install one to use auto-posting.');
        return null;
    }

    if (!userData) {
        console.error('❌ Could not find browser user data directory.');
        return null;
    }

    console.log(`🌐 Using ${userData.name} from: ${userData.dir}`);

    try {
        const browser = await puppeteer.launch({
            executablePath: browserPath,
            headless: true,
            userDataDir: userData.dir,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--profile-directory=Default'
            ]
        });

        return browser;
    } catch (err) {
        // If profile is locked (browser already open), use a copy approach
        if (err.message.includes('already running') || err.message.includes('lock')) {
            console.log('⚠️ Browser profile is locked (browser is open). Using cookie export approach...');
            return null;
        }
        throw err;
    }
}

/**
 * Fallback: Launch with chromium and manually extracted cookies
 */
async function launchWithChromium() {
    try {
        const chromium = await import('chromium');
        const browser = await puppeteer.launch({
            executablePath: chromium.default.path,
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        return browser;
    } catch (e) {
        console.error('❌ Could not launch chromium either:', e.message);
        return null;
    }
}

/**
 * Post a reply to a Reddit thread
 */
export const postRedditReply = async (postId, content) => {
    let browser = null;

    try {
        // Try to use the user's existing browser profile
        browser = await launchWithProfile();

        if (!browser) {
            // Fallback: try chromium with saved cookies
            console.log('📦 Falling back to standalone Chromium...');
            browser = await launchWithChromium();
        }

        if (!browser) {
            return { success: false, error: 'MISSING_API_KEYS' };
        }

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

        // Verify we're logged in by checking Reddit API
        console.log('🔍 Herald: Checking Reddit session...');
        await page.goto('https://old.reddit.com/api/me.json', {
            waitUntil: 'domcontentloaded',
            timeout: 15000
        });

        const meText = await page.evaluate(() => document.body.innerText);
        let loggedIn = false;
        let username = 'unknown';

        try {
            const me = JSON.parse(meText);
            if (me?.data?.name) {
                loggedIn = true;
                username = me.data.name;
                console.log(`✅ Logged in as u/${username}`);
            }
        } catch { }

        if (!loggedIn) {
            console.error('❌ Not logged into Reddit. Close your browser briefly so we can use your profile.');
            console.error('   Or manually add REDDIT_SESSION_COOKIE to .env');
            await browser.close();
            return { success: false, error: 'MISSING_API_KEYS' };
        }

        // Humanistic pause
        const delay = 3000 + Math.random() * 5000;
        console.log(`⏳ Herald: Waiting ${(delay / 1000).toFixed(1)}s before posting...`);
        await sleep(delay);

        // Navigate to thread
        console.log(`📡 Herald: Opening thread t3_${postId}...`);
        await page.goto(`https://old.reddit.com/comments/${postId}`, {
            waitUntil: 'domcontentloaded',
            timeout: 15000
        });
        await humanDelay(2000, 4000);

        // Type comment
        const hasCommentBox = await page.evaluate(() => {
            const ta = document.querySelector('.usertext-edit textarea, textarea[name="text"]');
            return !!ta;
        });

        if (!hasCommentBox) {
            console.error('❌ No comment box. Thread may be locked/archived.');
            await browser.close();
            return { success: false, error: 'NO_COMMENT_BOX' };
        }

        await page.evaluate((text) => {
            const ta = document.querySelector('.usertext-edit textarea, textarea[name="text"]');
            ta.focus();
            ta.value = text;
            ta.dispatchEvent(new Event('input', { bubbles: true }));
        }, content);
        await humanDelay(1000, 2000);

        // Submit
        const submitted = await page.evaluate(() => {
            const btn = document.querySelector('.usertext-buttons button[type="submit"], button.save');
            if (btn) { btn.click(); return true; }
            return false;
        });

        if (!submitted) {
            console.error('❌ Could not find submit button');
            await browser.close();
            return { success: false, error: 'NO_SUBMIT_BUTTON' };
        }

        await humanDelay(3000, 5000);

        // Check for rate limit errors
        const errors = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.error, .status-msg'))
                .map(e => e.innerText).filter(Boolean);
        });

        if (errors.some(e => e.toLowerCase().includes('too fast') || e.toLowerCase().includes('wait'))) {
            console.warn(`⏱️ Rate limited: ${errors.join('; ')}`);
            await browser.close();
            return { success: false, error: 'RATE_LIMITED', waitMinutes: 10 };
        }

        console.log(`✅ Herald: Reply posted to t3_${postId}!`);
        await browser.close();
        return { success: true };

    } catch (err) {
        console.error('❌ Herald Error:', err.message);
        if (browser) await browser.close().catch(() => { });
        return { success: false, error: err.message };
    }
};
