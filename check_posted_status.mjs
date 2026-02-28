import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkPosted() {
    console.log("--- ✅ VERIFYING RECENT POSTS ---\n");
    const { data, error } = await supabase
        .from('growth_leads')
        .select('username, platform, is_posted, posted_at, draft_reply')
        .eq('is_posted', true)
        .order('posted_at', { ascending: false });

    if (error) {
        console.error("❌ Error:", error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log("📭 No verified posts found.");
        return;
    }

    data.forEach(l => {
        console.log(`✅ POSTED TO: @${l.username} (${l.platform.toUpperCase()})`);
        console.log(`   Time: ${new Date(l.posted_at).toLocaleString()}`);
        console.log(`   Content: "${l.draft_reply.substring(0, 100)}..."\n`);
    });
}

checkPosted();
