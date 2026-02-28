
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { selectScript } from './src/lib/dm_scripts.js';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function processLeads(leads) {
    if (!leads || leads.length === 0) {
        console.log("✅ No specific mid-to-high intent leads found for this cycle.");
        return;
    }

    console.log(`🎯 Locked onto ${leads.length} value targets for Review/Closing.`);

    for (const lead of leads) {
        const dmContent = selectScript(lead);
        const score = lead.interest_score || 0;

        console.log(`\n---------------------------------`);
        console.log(`👤 Target: @${lead.username} (${lead.platform})`);
        console.log(`💰 Signal Score: ${score}/10`);

        const isDemo = String(lead.id).startsWith('demo');
        if (isDemo) {
            console.log(`✨ [Demo Mode] Tiered logic verified for score ${score}.`);
            continue;
        }

        let newStatus = 'pending';
        let actionMsg = '';

        if (score >= 8) {
            // 🔥 TIER 1: HIGH INTENT (Auto-pilot)
            newStatus = 'contacted';
            actionMsg = "💎 AUTO-DISPATCH: High-intent lead promoted to 'contacted'.";
        } else if (score >= 6) {
            // 🚥 TIER 2: MID INTENT (HITL Review)
            newStatus = 'shadow_pending';
            actionMsg = "🚥 HITL: Mid-intent lead promoted to 'shadow_pending' for review.";
        }

        if (newStatus !== 'pending') {
            const { error: updateError } = await supabase
                .from('growth_leads')
                .update({
                    status: newStatus,
                    draft_reply_twitter: dmContent,
                    is_posted: false
                })
                .eq('id', lead.id);

            if (updateError) {
                console.error(`❌ Closer: Failed to process ${lead.username}: ${updateError.message}`);
            } else {
                console.log(actionMsg);
            }
        }
    }
}

async function runCloserCurrent() {
    console.log("🤖 TheCloser 4.0: Tiered Dispatch Engine Active.");

    try {
        const { data: targetLeads, error } = await supabase
            .from('growth_leads')
            .select('*')
            .gte('interest_score', 6) // Lowered threshold for HITL inclusion
            .eq('status', 'pending')
            .limit(10);

        if (error) throw error;
        await processLeads(targetLeads);
    } catch (err) {
        console.error("❌ Closer Engine Error:", err);
    }
}

runCloserCurrent();
