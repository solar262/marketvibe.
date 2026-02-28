import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const EDGE_DEBUG_PORT = process.env.EDGE_DEBUG_PORT || 9222;

const TRENDS_PATH = path.join(process.cwd(), 'src', 'lib', 'trends_cache.json');

async function generateVideo() {
    console.log("🎥 [YouTube Agent] Starting Video Generation...");

    // 1. Get Trend
    let trends = [];
    try {
        trends = JSON.parse(fs.readFileSync(TRENDS_PATH, 'utf8'));
    } catch (e) {
        console.error("❌ Could not read trends cache.");
        return;
    }

    const trend = trends[0];
    if (!trend) {
        console.error("❌ No trends found to generate video.");
        return;
    }

    console.log(`🎬 Target Niche: ${trend.niche}`);

    let browser;
    try {
        // 1. Connect to Existing Edge (REUSES YouTube Auth)
        console.log("🔗 Connecting to Edge Remote Debugging...");
        const resp = await fetch(`http://127.0.0.1:${EDGE_DEBUG_PORT}/json/version`);
        const { webSocketDebuggerUrl } = await resp.json();
        browser = await puppeteer.connect({
            browserWSEndpoint: webSocketDebuggerUrl,
            defaultViewport: { width: 1280, height: 720 }
        });

        const page = await browser.newPage();
        page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));

        // 2. Setup Data Bridge
        console.log("📸 Setting up bridge...");
        const videoFinishPromise = new Promise((resolve) => {
            page.exposeFunction('onVideoData', (dataUri) => {
                console.log("💾 Video Data Received from Browser!");
                const base64Data = dataUri.split(',')[1];
                const videoBuffer = Buffer.from(base64Data, 'base64');
                const videoPath = path.join(process.cwd(), 'public', 'videos', `daily_gains_${Date.now()}.webm`);
                fs.writeFileSync(videoPath, videoBuffer);
                resolve(videoPath);
            }).catch(() => { }); // Ignore already exposed
        });

        // 3. Navigate & Capture
        console.log("🚀 Navigating to Video Set...");
        await page.goto('http://localhost:5173/admin/video-preview', { waitUntil: 'networkidle2' });
        await page.waitForSelector('[data-testid="video-preview-loaded"]', { timeout: 30000 });

        console.log("📸 Waiting for startRecording() hook attachment & Hydration...");
        await page.waitForFunction(() => typeof window.startRecording === 'function' && window.mv_hydration_status === 'READY', { timeout: 30000 });

        console.log("📸 Starting Browser-Native Recording...");
        await page.evaluate(() => {
            if (window.startRecording) window.startRecording();
        });

        // Wait for generation with polling safety
        console.log("⏳ Waiting for video generation completion...");
        const videoPath = await Promise.race([
            videoFinishPromise,
            new Promise(async (resolve, reject) => {
                for (let i = 0; i < 90; i++) { // 90s max
                    await new Promise(r => setTimeout(r, 1000));
                    if (page.isClosed()) return;

                    const state = await page.evaluate(() => ({
                        finished: window.videoFinished,
                        logs: window.mv_capture_log || []
                    })).catch(() => ({ finished: false, logs: [] }));

                    if (i % 10 === 0) console.log(`📡 [POLL ${i}s] Browser Logs: ${state.logs.slice(-1)}`);

                    if (state.finished && state.logs.includes("Sending data")) {
                        console.log("🚀 Data transmission confirmed via polling.");
                        return;
                    }
                }
                reject(new Error("Video generation timed out (90s)"));
            })
        ]);

        console.log(`✅ High-Quality Video Saved: ${videoPath}`);

        if (process.argv.includes('--dry-run')) {
            console.log("🏁 Dry run complete.");
            await page.close();
            browser.disconnect();
            return;
        }

        // 4. Upload to YouTube Studio
        console.log("📤 Initiating YouTube Studio Upload...");
        await page.goto('https://studio.youtube.com/', { waitUntil: 'networkidle2' });

        try {
            console.log("🖱️ Searching for Upload trigger...");
            let uploadTrigger = await page.$('ytcp-button#upload-button');
            if (!uploadTrigger) uploadTrigger = await page.$('#create-icon') || await page.$('[aria-label="Create"]');

            if (uploadTrigger) {
                await uploadTrigger.click();
            } else {
                throw new Error("Could not find any upload trigger.");
            }

            console.log("📂 Selecting File...");
            const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 10000 });
            await fileInput.uploadFile(videoPath);

            console.log("✍️ Applying Metadata...");
            const titleBox = await page.waitForSelector('#title-textarea #textbox', { timeout: 15000 });
            await titleBox.click({ clickCount: 3 });
            await titleBox.type(`MarketVibe Daily Gains | ${trend.niche} Breakdown 🚀`);

            const descBox = await page.waitForSelector('#description-textarea #textbox', { timeout: 10000 });
            await descBox.type(`Live market signal detected: ${trend.niche}.\n\nHeat Score: ${trend.heatScore?.toFixed(1) || '8.4'}\nVelocity: +${trend.velocity || '124'}%\n\nGet the full 30-day founder playbook at https://marketvibe1.com\n\n#startups #marketvibe #dailygains`);

            console.log("🧒 Handling Kids policy...");
            const kidsRadio = await page.waitForSelector('tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]', { timeout: 5000 });
            await kidsRadio.click();

            for (let i = 0; i < 3; i++) {
                console.log(`⏭️ Clicking Next (${i + 1}/3)...`);
                const nextBtn = await page.waitForSelector('#next-button', { timeout: 10000 });
                await nextBtn.click();
                await new Promise(r => setTimeout(r, 2000));
            }

            console.log("🚀 Publishing...");
            const publishBtn = await page.waitForSelector('#done-button', { timeout: 10000 });
            await publishBtn.click();

            console.log("✅ SUCCESS: Video is live!");
        } catch (uploadErr) {
            console.error("⚠️ Upload step failed:", uploadErr.message);
            await page.screenshot({ path: 'public/videos/upload_error_state.png' });
        }

        await page.close();
        browser.disconnect();

    } catch (err) {
        console.error("❌ Video Generation Failed:", err.message);
        if (browser) browser.disconnect();
    }
}

// Only run immediately if executed directly
const isDirectRun = import.meta.url.includes(process.argv[1]?.replace(/\\/g, '/')) ||
    import.meta.url.endsWith(process.argv[1]?.split(/[\\/]/).pop());

if (isDirectRun) {
    generateVideo();
}

export { generateVideo };
