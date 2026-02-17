import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function getMetrics() {
    console.log('--- 📊 MARKETVIBE METRICS REPORT ---');

    try {
        // 1. Total Website Hits
        const { data: traffic, error: trafficError } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'website_hits')
            .single();

        if (trafficError) console.error('Traffic Error:', trafficError.message);
        else console.log(`\n🌍 Website Visitors: ${traffic?.value || 0}`);

        // 2. Total Leads Count
        const { count: totalLeads, error: countError } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true });

        if (countError) console.error('Count Error:', countError.message);
        else console.log(`👥 Total Leads Generated: ${totalLeads || 0}`);

        // 3. Leads by Status (Breakdown)
        const { data: statusData, error: statusError } = await supabase
            .from('leads')
            .select('status');

        if (statusError) console.error('Status Error:', statusError.message);
        else {
            const breakdown = statusData.reduce((acc, curr) => {
                acc[curr.status || 'unknown'] = (acc[curr.status || 'unknown'] || 0) + 1;
                return acc;
            }, {});

            console.log('\n📉 Funnel Breakdown:');
            Object.entries(breakdown).forEach(([status, count]) => {
                let emoji = '⚪';
                if (status.includes('paid')) emoji = '💰';
                if (status.includes('tool')) emoji = '🧲';
                if (status === 'completed_validation') emoji = '✅';
                console.log(`${emoji} ${status}: ${count}`);
            });
        }

        // 4. Recent Activity
        const { data: recent, error: recentError } = await supabase
            .from('leads')
            .select('email, status, created_at, project_name')
            .order('created_at', { ascending: false })
            .limit(5);

        if (recentError) console.error('Recent Error:', recentError.message);
        else {
            console.log('\n⏱️ Recent Activity (Last 5):');
            recent.forEach(lead => {
                console.log(`- ${lead.email} [${lead.status}] (${lead.project_name || 'General'}) - ${new Date(lead.created_at).toLocaleTimeString()}`);
            });
        }

    } catch (err) {
        console.error('Unexpected Error:', err);
    }
    console.log('\n-----------------------------------');
}

getMetrics();
