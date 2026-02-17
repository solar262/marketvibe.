
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { selectScript } from './src/lib/dm_scripts.js';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function runCloserCurrent() {
    console.log("🤖 TheCloser 2.0: Scanning for High-Ticket Targets...");

    // 1. Find Qualified Leads (Score >= 8) who haven't been contacted
    const { data: highValueLeads, error } = await supabase
        .from('growth_leads')
        .select('*')
        .gte('interest_score', 8)
        .eq('status', 'pending')
        .limit(5);

    if (error) {
        console.error("Error fetching leads:", error);
        return;
    }

    if (highValueLeads.length === 0) {
        console.log("✅ No new high-ticket leads found strictly matching criteria.");
        return;
    }

    console.log(`🎯 Locked onto ${highValueLeads.length} high-value targets.`);

    // 2. Draft & Queue DMs
    for (const lead of highValueLeads) {
        const dmContent = selectScript(lead);

        console.log(`\n---------------------------------`);
        console.log(`👤 Target: @${lead.username} (${lead.platform})`);
        console.log(`💰 Signal: High Ticket (Score: ${lead.interest_score})`);
        console.log(`📝 Generated DM: "${dmContent}"`);

        // Simulate sending
        console.log(`🚀 Dispatching DM... [SIMULATION MODE]`);

        // Update status to avoid re-sending
        const { error: updateError } = await supabase
            .from('growth_leads')
            .update({
                status: 'contacted',
                draft_reply: dmContent // Save the specific script used
            })
            .eq('id', lead.id);

        if (updateError) console.error(`❌ Failed to update status for ${lead.username}`);
        else console.log(`✅ Status updated to 'contacted'.`);
    }
}

runCloserCurrent();
