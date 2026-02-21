
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { selectScript } from './src/lib/dm_scripts.js';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function processLeads(leads) {
    if (!leads || leads.length === 0) {
        console.log("✅ No new high-ticket leads found strictly matching criteria.");
        return;
    }

    console.log(`🎯 Locked onto ${leads.length} high-value targets.`);

    for (const lead of leads) {
        const dmContent = selectScript(lead);

        console.log(`\n---------------------------------`);
        console.log(`👤 Target: @${lead.username} (${lead.platform})`);
        console.log(`💰 Signal: High Ticket (Score: ${lead.interest_score})`);
        console.log(`📝 Generated DM: "${dmContent}"`);

        // Simulate sending
        console.log(`🚀 Dispatching DM... [SIMULATION MODE]`);

        // Update status for live leads
        if (!lead.id.startsWith('demo')) {
            const { error: updateError } = await supabase
                .from('growth_leads')
                .update({
                    status: 'contacted',
                    draft_reply: dmContent
                })
                .eq('id', lead.id);

            if (updateError) console.error(`❌ Failed to update status for ${lead.username}`);
            else console.log(`✅ Status updated to 'contacted' in DB.`);
        } else {
            console.log(`✨ [Demo Mode] Processed successfully.`);
        }
    }
}

async function runCloserCurrent() {
    console.log("🤖 TheCloser 2.0: Scanning for High-Ticket Targets...");

    try {
        const { data: highValueLeads, error } = await supabase
            .from('growth_leads')
            .select('*')
            .gte('interest_score', 8)
            .eq('status', 'pending')
            .limit(5);

        if (error) throw error;
        await processLeads(highValueLeads);
    } catch (err) {
        console.warn("⚠️ Supabase Connection Error: Switching to High-Ticket Demo Mode.");
        const mockLeads = [{
            id: 'demo-1',
            username: 'saas_founder_alpha',
            platform: 'reddit',
            interest_score: 9,
            niche: 'AI Lead Generation',
            post_content: 'How do I scale my B2B outreach without getting banned? Budget is $2k/mo.'
        }];
        await processLeads(mockLeads);
    }
}

runCloserCurrent();
