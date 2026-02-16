/**
 * 🔗 MarketVibe Growth Nexus
 * The master orchestrator that runs all autonomous growth cycles.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { MarketVibeSentinel } from './outreach_agent.mjs';
import { MarketVibeNurturer } from './nurture_worker.mjs';
import { runHeraldCycle } from './herald_worker.mjs';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

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

        console.log("\n--- 🧹 PHASING: CLOSER SWEEP ---");

        // 3. Autopilot Sweep (The Closer)
        const { data: sweepLeads } = await supabase
            .from('growth_leads')
            .select('id')
            .eq('status', 'pending')
            .gte('interest_score', 6);

        if (sweepLeads && sweepLeads.length > 0) {
            const sweepIds = sweepLeads.map(l => l.id);
            await supabase.from('growth_leads').update({ status: 'contacted' }).in('id', sweepIds);
            console.log(`✅ Swept ${sweepLeads.length} high-intent leads to 'contacted'.`);
        }

        console.log("\n--- 📣 PHASING: HERALD BOT (LIVE POSTS) ---");

        // 4. Live Engagement Phase (Herald)
        await runHeraldCycle();

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
    runMasterCycle().then(() => {
        process.exit(0);
    }).catch(err => {
        console.error("CRITICAL NEXUS ERROR:", err);
        process.exit(1);
    });
}
