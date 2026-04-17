/**
 * 🤖 MarketVibe Facebook Library (Isolated Remote Debugging)
 * Connects to an isolated Edge instance for FB group discovery.
 */

import puppeteer from 'puppeteer-core';
import dotenv from 'dotenv';
dotenv.config();

const FB_DEBUG_PORT = process.env.FB_DEBUG_PORT || 9228;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const humanDelay = (min = 2000, max = 5000) => sleep(min + Math.random() * (max - min));

async function connectToEdge() {
    try {
        const resp = await fetch(`http://127.0.0.1:${FB_DEBUG_PORT}/json/version`);
        const data = await resp.json();
        if (!data.webSocketDebuggerUrl) return null;

        const browser = await puppeteer.connect({
            browserWSEndpoint: data.webSocketDebuggerUrl,
            defaultViewport: null,
            protocolTimeout: 0
        });
        console.log('Connected to Facebook-Isolated Edge');
        return browser;
    } catch (e) {
        console.error('Cannot connect to FB Edge on port ' + FB_DEBUG_PORT);
        return null;
    }
}

/**
 * Discover leads from Facebook Groups
 * (Login session must be active in the isolated profile)
 */
export const discoverFacebookLeads = async (keyword) => {
    let browser = null;
    let page = null;
    const leads = [];

    try {
        browser = await connectToEdge();
        if (!browser) return [];

        page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

        // Search URL for FB Posts
        const searchUrl = `https://www.facebook.com/search/posts/?q=${encodeURIComponent(keyword)}&filters=eyJycF9hdXRob3I6MCI6IntcIm5hbWVcIjpclmF1dGhvclwiLFwiYXJnc1wiOlwiaXNfbXlfZnJpZW5kc1wifSIsInJwX2NyZWF0aW9uX3RpbWU6MCI6IntcIm5hbWVcIjpclmNyZWF0aW9uX3RpbWVcIixclmFyZ3NcIjpclntcXFwic3RhcnRfXFwiOlwiiX0iLCJycF9wb3N0X2xvY2F0aW9uOjAiOiJ7XCJuYW1lXCI6XCJwb3N0X2xvY2F0aW9uXCIsXCJhcmdzXCI6XCJwdWJsaWNcIn0ifQ%3D%3D`;

        console.log(`🔍 FB Searching: "${keyword}"`);
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await humanDelay(5000, 8000);

        // Scroll to trigger lazy loading
        await page.evaluate(async () => {
            window.scrollBy(0, 1000);
            await new Promise(r => setTimeout(r, 2000));
            window.scrollBy(0, 1000);
        });

        const rawResults = await page.evaluate(() => {
            const items = [];
            // Target the main post container in the new FB UI
            const posts = document.querySelectorAll('div[role="feed"] > div, div[role="main"] div[data-testid="post_message"]');

            posts.forEach(post => {
                const text = post.innerText || post.textContent;
                // FB IDs are buried in links
                const link = post.querySelector('a[href*="/posts/"], a[href*="/permalink/"], a[href*="/groups/"]');
                const author = post.querySelector('h2 strong, h3 strong')?.innerText || "FB User";

                if (text && text.length > 50 && link) {
                    items.push({
                        text,
                        author,
                        url: link.href,
                        id: link.href.split('/').filter(Boolean).pop()
                    });
                }
            });
            return items;
        });

        await page.close();
        browser.disconnect();

        return rawResults.map(r => ({
            platform: 'facebook',
            platform_id: `fb_${r.id}`,
            username: r.author,
            post_content: r.text,
            niche: keyword // Simplified niche detection for FB
        }));

    } catch (err) {
        console.error('FB Discovery Error:', err.message);
        if (page) await page.close().catch(() => { });
        if (browser) browser.disconnect();
        return [];
    }
};
