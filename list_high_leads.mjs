import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function listHighLeads() {
    console.log("--- 🔥 FETCHING TOP HIGH-INTENT LEADS ---\n");
    const { data, error } = await supabase
        .from('growth_leads')
        .select('username, platform, interest_score, draft_reply, niche')
        .gte('interest_score', 8)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("❌ Database Error:", error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log("📭 No high-intent leads found yet (Score >= 8).");
        return;
    }

    data.forEach((l, i) => {
        console.log(`${i + 1}. @${l.username} (${l.platform.toUpperCase()}) | Score: ${l.interest_score}/10`);
        console.log(`   Niche: ${l.niche}`);
        console.log(`   Draft: "${l.draft_reply}"\n`);
    });
}

listHighLeads();
