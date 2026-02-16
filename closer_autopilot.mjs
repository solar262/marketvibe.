/**
 * 🤖 MarketVibe Closer (Autopilot)
 * This script identifies high-intent leads and moves them to the 'contacted' status.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function runCloserCycle() {
    console.log("🚀 The Closer: Starting Autopilot engagement cycle...");

    try {
        // 1. Fetch high-intent pending leads
        const { data: leads, error: fetchError } = await supabase
            .from('growth_leads')
            .select('id, username, platform, interest_score')
            .eq('status', 'pending')
            .gte('interest_score', 8);

        if (fetchError) throw fetchError;

        if (!leads || leads.length === 0) {
            console.log("✅ No high-intent pending leads found. Autopilot standing by.");
            return;
        }

        console.log(`🎯 Identified ${leads.length} high-intent leads for immediate engagement.`);

        // 2. Batch update to 'contacted'
        const leadIds = leads.map(l => l.id);
        const { error: updateError } = await supabase
            .from('growth_leads')
            .update({ status: 'contacted' })
            .in('id', leadIds);

        if (updateError) throw updateError;

        leads.forEach(lead => {
            console.log(`✅ [AUTOPILOT] Engaged with @${lead.username} on ${lead.platform} (Score: ${lead.interest_score})`);
        });

        console.log(`\n🏁 The Closer: Successfully processed ${leads.length} leads.`);

    } catch (err) {
        console.error("❌ The Closer Error:", err.message);
    }
}

runCloserCycle().then(() => {
    process.exit(0);
}).catch(err => {
    console.error("CRITICAL CLOSER ERROR:", err);
    process.exit(1);
});
