
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function inspectQueue() {
    console.log("🔍 Inspecting Herald queue (Reddit)...");

    const { data: leads, error } = await supabase
        .from('growth_leads')
        .select('*')
        .eq('status', 'contacted')
        .eq('is_posted', false)
        .eq('platform', 'reddit')
        .order('created_at', { ascending: true })
        .limit(10);

    if (error) {
        console.error("❌ Error fetching queue:", error.message);
        return;
    }

    if (!leads || leads.length === 0) {
        console.log("✅ No pending Reddit posts.");
        return;
    }

    leads.forEach((l, i) => {
        console.log(`${i + 1}. [${l.username}] ID: ${l.platform_id} - Draft: ${l.draft_reply.substring(0, 50)}...`);
    });
}

inspectQueue();
