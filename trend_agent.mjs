
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Export for the Nexus
export async function runTrendAudit() {
    console.log("📰 Newsroom Agent: Scanning Global Trends...");

    // 1. Fetch all leads
    const { data: leads, error } = await supabase
        .from('growth_leads')
        .select('niche, created_at, interest_score, post_content')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching leads:", error);
        return;
    }

    console.log(`🔍 Analyzing ${leads.length} data points...`);

    // 2. Aggregate by Niche
    const nicheStats = {};
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    leads.forEach(lead => {
        // Normalize niche (remove emojis, lowercase, trim)
        let rawNiche = lead.niche || 'General';
        const cleanNiche = rawNiche.replace(/[\u{1F600}-\u{1F6FF}]/gu, '').trim();
        const key = cleanNiche.toLowerCase(); // grouping key

        if (!nicheStats[key]) {
            nicheStats[key] = {
                name: cleanNiche, // Display name (first encounter)
                count: 0,
                velocity: 0, // Leads in last 7 days
                scoreSum: 0,
                examples: []
            };
        }

        nicheStats[key].count++;
        nicheStats[key].scoreSum += (lead.interest_score || 5);

        if (new Date(lead.created_at) > oneWeekAgo) {
            nicheStats[key].velocity++;
        }

        if (nicheStats[key].examples.length < 3) {
            nicheStats[key].examples.push(lead.post_content.substring(0, 100) + '...');
        }
    });

    // 3. Score & Sort Trends
    const trends = Object.values(nicheStats).map(stat => ({
        niche: stat.name,
        volume: stat.count,
        velocity: stat.velocity, // 7-day volume
        avgInterest: (stat.scoreSum / stat.count).toFixed(1),
        heatScore: (stat.velocity * 2) + stat.count + (stat.scoreSum / stat.count) // Weighted formula
    }));

    // Sort by Heat Score
    trends.sort((a, b) => b.heatScore - a.heatScore);

    const topTrends = trends.slice(0, 10);

    console.log("\n📈 TOP 5 BREAKOUT NICHES:");
    topTrends.slice(0, 5).forEach((t, i) => {
        console.log(`${i + 1}. ${t.niche} (Heat: ${t.heatScore.toFixed(0)}) - ${t.velocity} new this week`);
    });

    // 4. Save to Cache for UI
    const outputPath = path.join(process.cwd(), 'src', 'lib', 'trends_cache.json');
    fs.writeFileSync(outputPath, JSON.stringify(topTrends, null, 2));
    console.log(`\n✅ Trends cached to ${outputPath}`);
}

// Run immediately if called directly
const isDirectRun = process.argv[1] && (
    import.meta.url.includes(process.argv[1].replace(/\\/g, '/')) ||
    import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop())
);

if (isDirectRun) {
    runTrendAudit().then(() => {
        process.exit(0);
    }).catch(err => {
        console.error("TREND AGENT ERROR:", err);
        process.exit(1);
    });
}
