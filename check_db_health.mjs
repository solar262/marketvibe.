
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkHealth() {
    const { count: leadsCount } = await supabase.from('leads').select('*', { count: 'exact', head: true });
    const { count: growthCount } = await supabase.from('growth_leads').select('*', { count: 'exact', head: true });
    const { data: hits } = await supabase.from('app_settings').select('value').eq('key', 'website_hits').single();

    console.log(`--- DB HEALTH CHECK ---`);
    console.log(`Leads: ${leadsCount}`);
    console.log(`Growth Leads: ${growthCount}`);
    console.log(`Website Hits: ${hits?.value || 0}`);
}

checkHealth();
