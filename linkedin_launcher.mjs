import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

// ── CONFIG ──────────────────────────────────────────────────────────────────
const CONFIG = {
    edgeDebugPort: process.env.EDGE_DEBUG_PORT || 9222,
    postText: `Founders love building. We hate validating.

We spend months on MVP development, design, and code... only to realize the market wasn't there.

I built MarketVibe to solve this for myself.

It’s an AI-powered validation engine that gives you a full market report in 60 seconds.

Enter your idea, and get:
📊 Detailed TAM/SAM/SOM Revenue Forecasts
🕵️ Competitor Analysis (who is already doing it)
⏱️ Market Timing Score
🚀 A 30-Day Execution Plan to get your first customers

We also just launched "Investor Access" — a private deal flow feed for angels looking for pre-validated startups.

If you're building something new, try running it through MarketVibe first. It might save you 6 months of work.

Link in comments 👇

#startups #AI #SaaS #founders #marketresearch #entrepreneurship`,

    // Using the Open Graph preview image as it's usually high quality
    imagePath: path.resolve('./public/og-preview.png'),
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
    console.log('🚀 Launching LinkedIn Post Draft...');

    try {
        // Connect to Edge
        const resp = await fetch(`http://127.0.0.1:${CONFIG.edgeDebugPort}/json/version`);
        const data = await resp.json();
        if (!data.webSocketDebuggerUrl) throw new Error('No debugger URL');

        const browser = await puppeteer.connect({
            browserWSEndpoint: data.webSocketDebuggerUrl,
            defaultViewport: null,
        });

        console.log('✅ Connected to Edge');

        // Open LinkedIn
        const page = await browser.newPage();
        await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded' });
        await sleep(5000);

        // Check if logged in
        if (page.url().includes('login') || page.url().includes('signup')) {
            console.log('⚠️ Please log in to LinkedIn in this window first!');
            return;
        }

        console.log('📝 Opening post modal...');

        // Click "Start a post"
        // Try multiple selectors just in case
        const startPostSelectors = [
            'button.share-box-feed-entry__trigger',
            'button[aria-label="Start a post"]',
            '.share-box-feed-entry__trigger'
        ];

        let modalOpened = false;
        for (const sel of startPostSelectors) {
            try {
                await page.waitForSelector(sel, { timeout: 2000 });
                await page.click(sel);
                modalOpened = true;
                break;
            } catch (e) { }
        }

        if (!modalOpened) {
            console.log('❌ Could not find "Start a post" button. Please click it manually.');
            // Fallback: just wait for user to open it
            await sleep(5000);
        } else {
            await sleep(3000);
        }

        console.log('✍️ Typing post content...');

        // Type the text
        // Focus the editor
        // The editor is usually a div with role="textbox"
        const editorSelector = 'div.ql-editor, div[role="textbox"]';
        try {
            await page.waitForSelector(editorSelector, { timeout: 5000 });
            await page.click(editorSelector);
            await sleep(1000);
            await page.keyboard.type(CONFIG.postText, { delay: 10 });
        } catch (e) {
            console.log('⚠️ Could not auto-type text. It has been copied to your clipboard (simulated).');
            console.log('Please paste manually.');
        }

        console.log('🖼️ Attempting to attach image...');

        try {
            // 1. Find and click the "Media" / "Image" button to trigger file input
            // Selectors for the "Add media" button in the share box
            const mediaBtnSelectors = [
                'button[aria-label="Add media"]',
                'button[aria-label="Add a photo"]',
                '.share-promoted-detour-button',
                'button.share-actions__primary-action'
            ];

            let mediaBtn = null;
            for (const sel of mediaBtnSelectors) {
                try {
                    mediaBtn = await page.$(sel);
                    if (mediaBtn) break;
                } catch { }
            }

            if (mediaBtn) {
                await mediaBtn.click();
                await sleep(1000); // Wait for file dialog logic (puppeteer handles it via input)
            }

            // 2. Upload file to the input[type="file"]
            // LinkedIn usually adds the input to the DOM
            const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 3000 });
            if (fileInput) {
                await fileInput.uploadFile(CONFIG.imagePath);
                console.log('✅ Image attached!');
            } else {
                console.log('⚠️ Could not find file input. Please add image manually.');
            }
        } catch (e) {
            console.log('⚠️ Image upload skipped. Please add it manually.');
        }

        console.log('\n✅ Draft complete! Please review and click "Post" manually.');
        console.log('👉 Don\'t forget to add the link in the First Comment!');

    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

main();
