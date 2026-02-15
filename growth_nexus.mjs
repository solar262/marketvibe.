/**
 * 🔗 MarketVibe Growth Nexus
 * The master orchestrator that runs all autonomous growth cycles.
 */

import { MarketVibeSentinel } from './outreach_agent.mjs';
import { MarketVibeNurturer } from './nurture_worker.mjs';

async function runMasterCycle() {
    const timestamp = new Date().toLocaleString();
    console.log(`\n--- 🚀 GLOBAL GROWTH CYCLE STARTED: ${timestamp} ---`);

    try {
        // 1. Discovery Phase (Reddit)
        const sentinel = new MarketVibeSentinel();
        await sentinel.runCycle();

        console.log("\n--- ⏳ PHASING: SWITCHING TO NURTURE ---");

        // 2. Nurturing Phase (Email)
        const nurturer = new MarketVibeNurturer();
        await nurturer.runCycle();

    } catch (err) {
        console.error("\n❌ GLOBAL CYCLE FAILED:", err.message);
    }

    console.log(`\n--- 🏁 GLOBAL GROWTH CYCLE COMPLETE: ${new Date().toLocaleString()} ---`);
}

// Export for scheduler
export { runMasterCycle };

// Run immediately if called directly
const isDirectRun = import.meta.url.includes(process.argv[1].replace(/\\/g, '/')) ||
    import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());

if (isDirectRun) {
    runMasterCycle();
}
