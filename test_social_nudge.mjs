import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function runTest() {
    console.log("🧪 Starting Nudge Test...");

    // 1. Pick a lead that was contacted a long time ago
    const { data: leads } = await supabase
        .from('growth_leads')
        .select('*')
        .eq('status', 'contacted')
        .eq('is_posted', true)
        .limit(1);

    if (!leads || leads.length === 0) {
        console.log("❌ No suitable leads found for test.");
        return;
    }

    const lead = leads[0];
    console.log(`🎯 Testing nudge on: @${lead.username} (${lead.platform})`);

    // 2. Force the nudge logic
    const nudge = `Hey @${lead.username}, just checking in—was that ${lead.niche} data I shared helpful? No pressure at all, just wanted to make sure it reached you!`;

    console.log(`📝 Nudge Text: "${nudge}"`);

    const { error } = await supabase
        .from('growth_leads')
        .update({
            draft_reply: nudge,
            draft_reply_twitter: nudge,
            status: 'contacted', // Keep as contacted so Herald picks it up
            is_posted: false,    // Reset to false so Herald thinks it needs posting
            score_reason: 'Nudge Cycle Active ⏱️'
        })
        .eq('id', lead.id);

    if (error) {
        console.error("❌ DB Update Error:", error);
    } else {
        console.log("✅ Lead updated. It is now in 'Contacted' queue with 'is_posted: false'.");
        console.log("🚀 The Herald will pick this up in its next cycle.");
        console.log("🔗 View it here: http://localhost:5173/admin/leads (Search for status: contacted)");
    }
}

runTest();
