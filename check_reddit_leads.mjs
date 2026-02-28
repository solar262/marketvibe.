
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkLeads() {
    console.log("📊 Checking growth_leads table status...");

    // 1. Check columns
    try {
        const { data: columns, error: colError } = await supabase.rpc('get_column_names', { table_name: 'growth_leads' });
        if (colError) {
            console.log("⚠️ Could not fetch columns via RPC. Trying a direct select limit 1.");
            const { data: test, error: testErr } = await supabase.from('growth_leads').select('*').limit(1);
            if (test && test.length > 0) {
                console.log("✅ Columns found in first row:", Object.keys(test[0]));
            } else {
                console.warn("⚠️ No leads found to check keys.");
            }
        } else {
            console.log("✅ Columns in growth_leads:", columns);
        }
    } catch (e) {
        console.error("❌ Schema check failed:", e.message);
    }

    // 2. Count leads
    try {
        const { count: contactedCount, error: countError } = await supabase
            .from('growth_leads')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'contacted');

        console.log(`📈 Total Contacted Leads: ${contactedCount}`);

        const { count: pendingPostCount } = await supabase
            .from('growth_leads')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'contacted')
            .eq('is_posted', false);

        console.log(`⏳ Leads waiting for Herald (is_posted=false): ${pendingPostCount}`);

        const { data: sampleLeads } = await supabase
            .from('growth_leads')
            .select('*')
            .eq('status', 'contacted')
            .eq('is_posted', false)
            .limit(3);

        if (sampleLeads && sampleLeads.length > 0) {
            console.log("📝 Sample leads waiting to be posted:");
            sampleLeads.forEach(l => console.log(`- [${l.platform}] ${l.username} (ID: ${l.id})`));
        }

    } catch (err) {
        console.error("❌ Lead check failed:", err.message);
    }
}

checkLeads();
