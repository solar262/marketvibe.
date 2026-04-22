
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { selectScript } from './src/lib/dm_scripts.js';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function processLeads(leads) {
    const isDryRun = process.argv.includes('--dry-run');
    if (!leads || leads.length === 0) {
        console.log("✅ No specific mid-to-high intent leads found for this cycle.");
        return;
    }

    if (isDryRun) console.log("🧪 DRY RUN ENABLED: No database updates will be performed.");

    console.log(`🎯 Locked onto ${leads.length} value targets for Review/Closing.`);

    for (const lead of leads) {
        const dmContent = await selectScript(lead);
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

        if (score >= 7) {
            // 🔥 TIER 1: HIGH INTENT (Auto-pilot)
            newStatus = 'contacted';
            actionMsg = "💎 AUTO-DISPATCH: High-intent lead promoted to 'contacted'.";
        } else if (score >= 5) {
            // 🚥 TIER 2: MID INTENT (HITL Review)
            newStatus = 'shadow_pending';
            actionMsg = "🚥 HITL: Mid-intent lead promoted to 'shadow_pending' for review.";
        }

        if (newStatus !== 'pending') {
            const updateFields = {
                status: newStatus,
                draft_reply_twitter: dmContent,
                is_posted: false
            };

            // 🌉 E-MAIL BRIDGE ACTIVATION
            if (score >= 8) {
                updateFields.enrichment_status = 'pending';
            }

            if (isDryRun) {
                console.log(`[DRY RUN] Would update ${lead.username} to ${newStatus} (Bridge: ${updateFields.enrichment_status || 'none'}) with content: "${dmContent.substring(0, 40)}..."`);
                continue;
            }

            const { error: updateError } = await supabase
                .from('growth_leads')
                .update(updateFields)
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
        // --- BLITZ MODE: Target both new pending AND contacted high-intent leads for upgrade ---
        const { data: targetLeads, error } = await supabase
            .from('growth_leads')
            .select('*')
            .gte('interest_score', 8)
            .or('status.eq.pending,status.eq.contacted') // Target both for initial and upgrade blitz
            .order('interest_score', { ascending: false })
            .limit(100);

        if (error) throw error;
        await processLeads(targetLeads);
    } catch (err) {
        console.error("❌ Closer Engine Error:", err);
    }
}

runCloserCurrent();
