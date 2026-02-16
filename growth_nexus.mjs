/**
 * 🔗 MarketVibe Growth Nexus
 * The master orchestrator that runs all autonomous growth cycles.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { MarketVibeSentinel } from './outreach_agent.mjs';
import { MarketVibeNurturer } from './nurture_worker.mjs';
import { runHeraldCycle } from './herald_worker.mjs';
import { generateAuthorityPosts } from './generate_authority_posts.mjs';
import { MarketVibeShadowAgent } from './shadow_agent.mjs';
import { runTrendAudit } from './trend_agent.mjs';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function runMasterCycle() {
    const timestamp = new Date().toLocaleString();
    console.log(`\n--- 🚀 GLOBAL GROWTH CYCLE STARTED: ${timestamp} ---`);

    try {
        // 1. Discovery Phase (Reddit/X)
        console.log("\n--- 🛰️ PHASE 1: DISCOVERY ---");
        const sentinel = new MarketVibeSentinel();
        await sentinel.runCycle();

        // 2. Trend-Jacking Phase (Breakout Detection)
        console.log("\n--- 📰 PHASE 2: TREND-JACKING ---");
        await runTrendAudit();

        // 3. Shadow Reputation Phase (Brand Trust)
        console.log("\n--- 🕵️‍♂️ PHASE 3: SHADOW REPUTATION ---");
        const shadowAgent = new MarketVibeShadowAgent();
        await shadowAgent.runCycle();

        // 4. Authority Phase (Programmatic Content)
        console.log("\n--- ✍️ PHASE 4: AUTHORITY CONTENT ---");
        await generateAuthorityPosts();

        // 5. Nurturing Phase (Email Engagement)
        console.log("\n--- 📧 PHASE 5: NURTURE ---");
        const nurturer = new MarketVibeNurturer();
        await nurturer.runCycle();

        // 6. Autopilot Sweep (The Closer)
        console.log("\n--- 🧹 PHASE 6: CLOSER SWEEP ---");
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

        // 7. Live Engagement Phase (Herald Bot)
        console.log("\n--- 📣 PHASE 7: HERALD BOT (LIVE ENGAGEMENT) ---");
        await runHeraldCycle();

    } catch (err) {
        console.error("\n❌ GLOBAL CYCLE FAILED:", err.message);
    }

    console.log(`\n--- 🏁 GLOBAL GROWTH CYCLE COMPLETE: ${new Date().toLocaleString()} ---`);
}

// Export for scheduler
export { runMasterCycle };

// Run immediately if called directly
const isDirectRun = import.meta.url.includes(process.argv[1]?.replace(/\\/g, '/')) ||
    import.meta.url.endsWith(process.argv[1]?.split(/[\\/]/).pop());

if (isDirectRun) {
    runMasterCycle().then(() => {
        process.exit(0);
    }).catch(err => {
        console.error("CRITICAL NEXUS ERROR:", err);
        process.exit(1);
    });
}
