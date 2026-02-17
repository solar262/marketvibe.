import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function getRecentLeads() {
    console.log('--- 🤖 RECENT OUTREACH ACTIVITY ---');

    const { data: leads, error } = await supabase
        .from('growth_leads')
        .select('username, platform, niche, status, interest_score, post_content')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error.message);
    } else {
        leads.forEach(l => {
            console.log(`\n🎯 [${l.platform.toUpperCase()}] @${l.username} (Score: ${l.interest_score})`);
            console.log(`   Niche: ${l.niche}`);
            console.log(`   Status: ${l.status}`);
            console.log(`   Context: ${l.post_content.substring(0, 100).replace(/\n/g, ' ')}...`);
        });
    }
}

getRecentLeads();
