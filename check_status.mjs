
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function report() {
    try {
        const { count: total, error: e1 } = await supabase.from('growth_leads').select('*', { count: 'exact', head: true });
        if (e1) console.error('Error total:', e1);

        const { count: contacted, error: e2 } = await supabase.from('growth_leads').select('*', { count: 'exact', head: true }).eq('status', 'contacted');
        if (e2) console.error('Error contacted:', e2);

        const { count: qualified, error: e3 } = await supabase.from('growth_leads').select('*', { count: 'exact', head: true }).eq('status', 'qualified');
        if (e3) console.error('Error qualified:', e3);

        const { data: recent, error: e4 } = await supabase.from('growth_leads').select('username, platform, status, created_at').order('created_at', { ascending: false }).limit(5);
        if (e4) console.error('Error recent:', e4);

        const { data: launchpad, error: e5 } = await supabase.from('launchpad_listings').select('name, tier, status, created_at').order('created_at', { ascending: false }).limit(5);
        if (e5) console.error('Error launchpad:', e5);

        console.log('\n--- PIPELINE STATUS ---');
        console.log(`Total Leads Found: ${total || 0}`);
        console.log(`Qualified Leads:   ${qualified || 0}`);
        console.log(`Contacted Leads:   ${contacted || 0}`);

        console.log('\n--- RECENT LEADS ---');
        if (recent && recent.length > 0) {
            recent.forEach(l => console.log(`- [${l.platform}] ${l.username} (${l.status})`));
        } else {
            console.log('No recent leads found.');
        }

        console.log('\n--- LAUNCHPAD SUBMISSIONS ---');
        if (launchpad && launchpad.length > 0) {
            launchpad.forEach(l => console.log(`- ${l.name} (${l.tier}) - ${l.status}`));
        } else {
            console.log('No launchpad submissions yet.');
        }

    } catch (err) {
        console.error('Report failed:', err);
    }
}

report();
