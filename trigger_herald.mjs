
/**
 * 🚀 MarketVibe Herald Manual Trigger
 * Use this to force a live engagement cycle immediately.
 * Clears the 'contacted' lead queue through reddit posts.
 */

import { runHeraldCycle } from './herald_worker.mjs';
import dotenv from 'dotenv';
dotenv.config();

console.log("-----------------------------------------");
console.log("🚀 MarketVibe Herald: Manual Trigger Mode");
console.log("-----------------------------------------");
console.log("📡 Scanning for pending live posts...");

runHeraldCycle()
    .then(() => {
        console.log("\n✅ Manual cycle execution complete.");
        process.exit(0);
    })
    .catch(err => {
        console.error("\n❌ Manual trigger failed:", err.message);
        process.exit(1);
    });
