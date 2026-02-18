/**
 * ⏰ MarketVibe Autonomous Scheduler
 * This script runs the Growth Nexus every 4 hours.
 */

import cron from 'node-cron';
import { runMasterCycle } from './growth_nexus.mjs';

console.log("-----------------------------------------");
console.log("🤖 MarketVibe Autonomous Scheduler Active");
console.log("-----------------------------------------");
console.log("📅 Schedule: Every 4 hours");
console.log("🚀 Initial trigger starting now...");

// 1. Run immediately on startup
runMasterCycle();

// 2. Schedule perpetual cycle
// Pattern: 0 */4 * * * -> Every 4 hours at minute 0
cron.schedule('0 */4 * * *', async () => {
    try {
        console.log("⏰ Cron Trigger: Starting Master Cycle...");
        await runMasterCycle();
    } catch (error) {
        console.error("❌ Scheduler Error (Cycle Skipped):", error.message);
    }
});

console.log("\n✅ Scheduler is monitoring the clock. Growth never stops.");
