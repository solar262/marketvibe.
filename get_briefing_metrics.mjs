import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkMetrics() {
    const { count: total } = await supabase.from('growth_leads').select('*', { count: 'exact', head: true });
    const { count: contacted } = await supabase.from('growth_leads').select('*', { count: 'exact', head: true }).eq('status', 'contacted');
    const { count: pending } = await supabase.from('growth_leads').select('*', { count: 'exact', head: true }).eq('status', 'pending');

    console.log(`TOTAL_LEADS:${total}`);
    console.log(`CONTACTED_LEADS:${contacted}`);
    console.log(`PENDING_LEADS:${pending}`);
}

checkMetrics();
