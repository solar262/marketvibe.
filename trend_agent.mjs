import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { generateValidationReport } from './src/lib/generator.js';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

export async function runTrendAudit() {
    console.log("📰 Starting Trend-Jacking Audit...");

    // 1. Fetch leads from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentLeads, error } = await supabase
        .from('growth_leads')
        .select('niche, created_at, interest_score')
        .gte('created_at', sevenDaysAgo.toISOString());

    if (error) {
        console.error("❌ Error fetching recent leads:", error);
        return;
    }

    if (!recentLeads || recentLeads.length === 0) {
        console.log("✅ No recent lead data found for trend analysis.");
        return;
    }

    // 2. Aggregate Niche Momentum
    const nicheStats = {};
    recentLeads.forEach(lead => {
        if (!nicheStats[lead.niche]) {
            nicheStats[lead.niche] = { count: 0, highIntent: 0, lastDetected: lead.created_at };
        }
        nicheStats[lead.niche].count++;
        if (lead.interest_score >= 8) nicheStats[lead.niche].highIntent++;
        if (new Date(lead.created_at) > new Date(nicheStats[lead.niche].lastDetected)) {
            nicheStats[lead.niche].lastDetected = lead.created_at;
        }
    });

    // 3. Score and Identify Breakouts
    for (const [niche, stats] of Object.entries(nicheStats)) {
        // Momentum Score = (Count * 10) + (HighIntent * 20)
        const momentumScore = (stats.count * 10) + (stats.highIntent * 20);

        if (momentumScore >= 50) { // Threshold for "Trending"
            console.log(`🔥 Breakout Detected: ${niche} (Score: ${momentumScore})`);

            // 4. Generate AI Trend Summary
            const report = generateValidationReport({ name: niche, niche: niche });
            const summary = `Rising interest detected in the ${niche} space. We've seen ${stats.count} high-intent signals this week. Competition is currently ${report.competitorIntelligence?.[0]?.weakness || 'fragmented'}.`;

            // 5. Upsert to trending_niches
            await supabase.from('trending_niches').upsert({
                niche: niche,
                growth_score: Math.min(momentumScore, 100),
                lead_count: stats.count,
                last_detected_at: stats.lastDetected,
                is_breakout: momentumScore >= 80,
                summary: summary,
                execution_plan: report // Store the full blueprint for "First-to-Market" access
            }, { onConflict: 'niche' });
        }
    }

    console.log("🏁 Trend-Jacking Audit Complete.");
}

// Auto-run if executed directly
const isDirectRun = import.meta.url.includes(process.argv[1]?.replace(/\\/g, '/')) ||
    import.meta.url.endsWith(process.argv[1]?.split(/[\\/]/).pop());

if (isDirectRun) {
    runTrendAudit();
}
