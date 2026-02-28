import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function getStats() {
    const { count: growthLeads } = await supabase.from('growth_leads').select('*', { count: 'exact', head: true });
    const { count: salesLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true });
    const { count: hubListings } = await supabase.from('launchpad_listings').select('*', { count: 'exact', head: true });

    console.log("--- 📊 SYSTEM TELEMETRY ---");
    console.log("---------------------------");
    console.log(`📡 Growth Leads Scoped: ${growthLeads}`);
    console.log(`💎 Validated Sales Leads: ${salesLeads}`);
    console.log(`🚀 Launchpad Listings: ${hubListings}`);
    console.log("---------------------------");
}

getStats();
