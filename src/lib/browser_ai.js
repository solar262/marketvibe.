import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

// Try to load env if available (for Node workers)
let env = {};
try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [k, v] = line.split('=');
            if (k && v) env[k.trim()] = v.trim();
        });
    }
} catch (e) {}

const EDGE_PORT = env.EDGE_DEBUG_PORT || 9222;

export async function generateGrokResponse(prompt) {
    let browser;
    try {
        console.log(`🚀 [MV-AI] Connecting to Edge on port ${EDGE_PORT}...`);
        
        // Connect to existing Edge instance
        browser = await puppeteer.connect({
            browserURL: `http://localhost:${EDGE_PORT}`,
            defaultViewport: null
        });

        const pages = await browser.pages();
        const page = pages[0] || await browser.newPage();
        
        console.log("🌐 Navigating to Grok...");
        await page.goto('https://x.com/i/grok', { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Wait for input box
        const inputSelector = '[data-testid="grok-input"], [data-testid="tweetTextarea_0"], textarea[placeholder*="Grok"]';
        await page.waitForSelector(inputSelector, { timeout: 15000 });
        
        console.log("✍️ Typing prompt...");
        await page.type(inputSelector, prompt);
        await page.keyboard.press('Enter');

        // Wait for response text to appear and stabilize
        console.log("⌛ Waiting for response...");
        await new Promise(r => setTimeout(r, 4000));
        
        const responseSelector = '[data-testid="chat-message"]';
        let lastText = "";
        let stableCount = 0;
        
        for (let i = 0; i < 20; i++) {
            const currentText = await page.evaluate((sel) => {
                const msgs = document.querySelectorAll(sel);
                return msgs.length > 0 ? msgs[msgs.length - 1].innerText : "";
            }, responseSelector);
            
            if (currentText && currentText === lastText && currentText.length > 5) {
                stableCount++;
                if (stableCount >= 2) break;
            } else {
                stableCount = 0;
            }
            lastText = currentText;
            await new Promise(r => setTimeout(r, 1000));
        }

        console.log("✅ Response captured!");
        return lastText.trim().replace(/^"|"$/g, '');

    } catch (err) {
        console.error("❌ [MV-AI] Grok Bridge Failure:", err.message);
        // Fallback to static template or empty string
        return null;
    } finally {
        if (browser) browser.disconnect();
    }
}
