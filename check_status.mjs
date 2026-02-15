import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkStatus() {
    console.log('--- 🤖 AUTONOMOUS STATUS REPORT ---');

    // 1. Check Sentinel Discoveries
    const { data: leads, error: leadError } = await supabase
        .from('growth_leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (leadError) console.error('Error fetching leads:', leadError);
    else {
        console.log(`\n🔎 LATEST SENTINEL DISCOVERIES (${leads.length}):`);
        leads.forEach(l => {
            console.log(`- [${new Date(l.created_at).toLocaleString()}] Found ${l.username} on ${l.platform} (Niche: ${l.niche})`);
        });
    }

    // 2. Check Nurturer Activity
    const { data: nurtured, error: nurtureError } = await supabase
        .from('leads')
        .select('email, last_nurture_step, last_nurtured_at')
        .not('last_nurtured_at', 'is', null)
        .order('last_nurtured_at', { ascending: false })
        .limit(5);

    if (nurtureError) console.error('Error fetching nurtured leads:', nurtureError);
    else {
        console.log(`\n📧 LATEST NURTURER (EMAIL) ACTIONS (${nurtured.length}):`);
        nurtured.forEach(n => {
            console.log(`- [${new Date(n.last_nurtured_at).toLocaleString()}] Sent Drip #${n.last_nurture_step} to ${n.email}`);
        });
    }

    console.log('\n-----------------------------------');
}

checkStatus();
