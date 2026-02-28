
import { postRedditReply } from './src/lib/reddit.js';
import puppeteer from 'puppeteer-core';
import dotenv from 'dotenv';
dotenv.config();

const EDGE_DEBUG_PORT = process.env.EDGE_DEBUG_PORT || 9222;

async function runDiag() {
    console.log("🔍 Reddit Herald Diagnostic started...");

    // 1. Check if Edge is accessible
    try {
        console.log(`🔗 Attempting to connect to Edge on port ${EDGE_DEBUG_PORT}...`);
        const resp = await fetch(`http://127.0.0.1:${EDGE_DEBUG_PORT}/json/version`);
        const data = await resp.json();
        console.log("✅ Edge Debuggera detected:", data.Browser);

        const browser = await puppeteer.connect({
            browserWSEndpoint: data.webSocketDebuggerUrl,
            defaultViewport: null
        });

        console.log("✅ Connected to browser session.");

        const page = await browser.newPage();
        console.log("🌐 Checking Reddit session at old.reddit.com/api/me.json...");
        await page.goto('https://old.reddit.com/api/me.json', { waitUntil: 'domcontentloaded' });

        const meText = await page.evaluate(() => document.body.innerText);
        console.log("📝 Session Response:", meText.substring(0, 100) + "...");

        try {
            const me = JSON.parse(meText);
            if (me?.data?.name) {
                console.log(`🎉 LOGGED IN AS: u/${me.data.name}`);
            } else {
                console.warn("⚠️ NOT LOGGED IN. Please log into Reddit in the Edge browser.");
            }
        } catch (e) {
            console.error("❌ Failed to parse Reddit session JSON. You might be seeing a login page or CAPTCHA.");
        }

        await page.close();
        browser.disconnect();

    } catch (err) {
        console.error("❌ FAILED TO CONNECT TO EDGE:", err.message);
        console.log("\n💡 Potential Fixes:");
        console.log(`1. Ensure Microsoft Edge is running.`);
        console.log(`2. Ensure it's launched with --remote-debugging-port=${EDGE_DEBUG_PORT}`);
        console.log(`3. Check if any other process is using port ${EDGE_DEBUG_PORT}`);
    }
}

runDiag();
