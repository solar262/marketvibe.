
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function exportAbandoned() {
    console.log("🔍 Scanning for lost revenue opportunities...");

    const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .not('results', 'is', null) // Must have completed validation
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching leads:", error);
        return;
    }

    // Filter mainly for unpaid (status != 'paid' and paid != true)
    const abandoned = leads.filter(l => l.status !== 'paid' && !l.paid);

    console.log(`✅ Found ${abandoned.length} abandoned checkouts out of ${leads.length} total validations.`);

    if (abandoned.length === 0) {
        console.log("No abandoned carts found! (Or everyone paid, which is great)");
        return;
    }

    const headers = ['Email', 'Project Name', 'Niche', 'Date', 'Revenue Potential'];
    const rows = abandoned.map(l => [
        l.email,
        l.project_name || 'Untitled',
        l.results?.niche || 'Unknown',
        new Date(l.created_at).toLocaleDateString(),
        l.results?.revenueForecast?.estimatedAnnualRevenue ? `$${l.results.revenueForecast.estimatedAnnualRevenue}` : '-'
    ]);

    // Generate CSV Content
    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.map(c => `"${c}"`).join(','))
    ].join('\n');

    // Save to file
    const filename = `abandoned_checkouts_${Date.now()}.csv`;
    fs.writeFileSync(filename, csvContent);

    console.log(`\n📄 Exported to ${filename}`);
    console.log("\n--- COPY PASTE FOR EMAIL ---");
    rows.slice(0, 10).forEach(r => console.log(`${r[0]} (Project: ${r[1]})`));
    if (rows.length > 10) console.log(`... and ${rows.length - 10} more.`);
}

exportAbandoned();
