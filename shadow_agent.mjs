import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { generateValidationReport } from './src/lib/generator.js';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

export class MarketVibeShadowAgent {
    constructor() {
        this.valueOpeners = [
            "I've been looking at some market data recently and...",
            "Just saw some interesting numbers in this niche...",
            "Having tracked similar niches for a while, the biggest roadblock is usually...",
            "Market sentiment in this space is actually shifting towards..."
        ];
    }

    async runCycle() {
        console.log("🕵️‍♂️ Shadow Reputation Cycle Started...");

        // 1. Fetch leads that are 'pending' and high-interest
        const { data: leads, error } = await supabase
            .from('growth_leads')
            .select('*')
            .eq('status', 'pending')
            .gte('interest_score', 7)
            .limit(5);

        if (error) {
            console.error("❌ Error fetching leads:", error);
            return;
        }

        if (!leads || leads.length === 0) {
            console.log("✅ No new high-interest discovery leads found for shadow-posting.");
            return;
        }

        for (const lead of leads) {
            try {
                // 2. Generate a "Shadow Reply" (Value-First, No Link)
                const report = lead.teaser_report || generateValidationReport({
                    name: lead.niche,
                    description: lead.post_content,
                    niche: lead.niche
                });

                const shadowReply = this.generateShadowReply(lead, report);

                // 3. Update status to 'shadow_pending' to signify it's ready for repo-building
                const { error: updateError } = await supabase
                    .from('growth_leads')
                    .update({
                        draft_reply: shadowReply, // Overwrite with value-first version
                        status: 'shadow_pending'
                    })
                    .eq('id', lead.id);

                if (updateError) throw updateError;
                console.log(`✅ Shadow Reply generated for @${lead.username} in /r/${lead.platform}`);

            } catch (err) {
                console.error(`❌ Error processing shadow lead ${lead.id}:`, err.message);
            }
        }

        console.log("🏁 Shadow Reputation Cycle Complete.");
    }

    generateShadowReply(lead, report) {
        const opener = this.valueOpeners[Math.floor(Math.random() * this.valueOpeners.length)];
        const nicheData = report.revenueForecast?.estimatedAnnualRevenue || "significant";

        return `
${opener} 

Honestly, the ${lead.niche} space is tricky right now. Based on some internal market data I was looking at (I use a tool called MarketVibe for this), the annual market potential here is roughly $${nicheData}. 

The real opportunity isn't just "building the app," but solving for ${report.targetAudience?.painPoints?.[0] || 'customer friction'}. Most people fail because they don't see that ${report.competitorIntelligence?.[0]?.name || 'existing players'} are vulnerable in their ${report.competitorIntelligence?.[0]?.weakness || 'complexity'}.

If I were starting this, I'd focus purely on Week 1 visibility. No links here to avoid the spam filter, but hopefully those data points help you refine the angle!
        `.trim();
    }
}

// Auto-run if executed directly
const isDirectRun = import.meta.url.includes(process.argv[1]?.replace(/\\/g, '/')) ||
    import.meta.url.endsWith(process.argv[1]?.split(/[\\/]/).pop());

if (isDirectRun) {
    const agent = new MarketVibeShadowAgent();
    agent.runCycle();
}
