import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function runSocialAutopilot() {
    console.log("🐦 Starting Social Autopilot...");

    // 1. Find un-posted "Unicorn" leads (>$1M Revenue)
    const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .not('results', 'is', null) // Must have validation results
        .eq('social_posted', false)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("❌ Error fetching leads:", error);
        return;
    }

    if (!leads || leads.length === 0) {
        console.log("✅ No new viral candidates found.");
        return;
    }

    // 2. Process Candidates
    for (const lead of leads) {
        try {
            const results = lead.results;
            const revenue = parseInt(results.revenueForecast?.estimatedAnnualRevenue?.replace(/,/g, '') || "0");
            const niche = results.niche || "Startup";

            // Only tweet if revenue > $100k (Lower threshold for MVP)
            if (revenue > 100000) {
                const tweet = generateViralTweet(niche, revenue, results.overallScore);

                console.log(`\n📢 [DRAFT TWEET] for ${niche}:`);
                console.log(tweet);
                console.log("-----------------------------------");

                // 3. Mark as posted (Simulated)
                // In a real app, we'd use the Twitter API here.
                const { error: updateError } = await supabase
                    .from('leads')
                    .update({ social_posted: true })
                    .eq('id', lead.id);

                if (updateError) console.error("Error updating status:", updateError);
            }
        } catch (err) {
            console.error("Error processing lead:", err);
        }
    }
}

function generateViralTweet(niche, revenue, score) {
    const revenueStr = (revenue / 1000000).toFixed(1) + "M";
    const templates = [
        `Just found a $${revenueStr}/year opportunity in the ${niche} space. 🚀\n\nBuying intent is huge right now. Full breakdown: marketvibe1.com/hub #SaaS #StartupIdeas`,
        `Someone needs to build this ${niche} tool ASAP. 🛠️\n\nData shows potential for $${revenueStr} ARR in year 2.\n\nValidate your own idea here: marketvibe1.com`,
        `Market Signal Detected: ${niche} is trending. 📈\n\nValidation Score: ${score}/10\nRevenue Potential: $${revenueStr}\n\nDon't sleep on this. #BuildInPublic`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
}

runSocialAutopilot();
