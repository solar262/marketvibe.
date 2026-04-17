/**
 * ⏰ MarketVibe Autonomous Scheduler
 * This script runs the Growth Nexus every 4 hours.
 */

import cron from 'node-cron';
import dotenv from 'dotenv';
import { runMasterCycle } from './growth_nexus.mjs';

dotenv.config({ path: new URL('./.env', import.meta.url) });

async function checkEdgeHealth() {
    const port = process.env.EDGE_DEBUG_PORT || 9222;
    try {
        const resp = await fetch(`http://127.0.0.1:${port}/json/version`);
        if (resp.ok) {
            console.log(`🏥 Health Check: Edge browser is ACTIVE on port ${port}.`);
            return true;
        }
    } catch (e) {
        console.warn(`🚨 Health Check FAILED: Edge browser NOT found on port ${port}.`);
        console.warn(`💡 Please ensure Edge is running with: --remote-debugging-port=${port}`);
        return false;
    }
}

console.log("-----------------------------------------");
console.log("🤖 MarketVibe Autonomous Scheduler Active");
console.log("-----------------------------------------");
console.log("📅 Schedule: Every 4 hours");

async function startScheduler() {
    console.log("🚀 Initial trigger starting now...");

    // Check health before first run
    await checkEdgeHealth();
    await runMasterCycle();

    cron.schedule('0 */4 * * *', async () => {
        console.log(`\n⏰ Scheduled trigger: ${new Date().toLocaleString()}`);
        const isHealthy = await checkEdgeHealth();
        if (isHealthy) {
            await runMasterCycle();
        } else {
            console.log("🛑 Skipping cycle due to browser connection issues.");
        }
    });

    console.log("\n✅ Scheduler is monitoring the clock. Growth never stops.");
}

startScheduler();
