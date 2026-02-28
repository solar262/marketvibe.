import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function listLeads() {
    console.log("--- 📡 FETCHING LATEST GROWTH LEADS ---\n");
    const { data, error } = await supabase
        .from('growth_leads')
        .select('username, platform, interest_score, score_reason, niche')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error("❌ Database Error:", error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log("📭 No leads found yet. The Sentinel is still hunting.");
        return;
    }

    data.forEach((l, i) => {
        const badge = l.interest_score >= 8 ? "🔥" : (l.interest_score >= 5 ? "✅" : "⚠️");
        console.log(`${i + 1}. ${badge} @${l.username} (${l.platform.toUpperCase()})`);
        console.log(`   Score: ${l.interest_score}/10 | Niche: ${l.niche}`);
        console.log(`   Reason: ${l.score_reason}\n`);
    });
}

listLeads();
