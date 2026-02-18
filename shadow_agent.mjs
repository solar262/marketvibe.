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
        this.replyTemplates = [
            {
                opener: "I've been researching this space recently and found some interesting data.",
                cta: "I actually ran a full validation report for a similar niche using [MarketVibe](https://marketvibe1.com) — it breaks down the TAM, competitor weaknesses, and revenue potential. Might be worth checking out since it's free."
            },
            {
                opener: "Just saw some interesting numbers in this niche that might help.",
                cta: "If you want to dig deeper, I used a free tool called [MarketVibe](https://marketvibe1.com) to map out the competitive landscape. It gave me data I couldn't find anywhere else."
            },
            {
                opener: "Having worked on something similar, here's what I wish I knew earlier.",
                cta: "There's a free validation tool at [marketvibe1.com](https://marketvibe1.com) that does competitive analysis automatically — saved me weeks of manual research when I was starting out."
            },
            {
                opener: "This is actually a solid niche if you approach it right.",
                cta: "btw I validated a similar idea using [MarketVibe](https://marketvibe1.com) — it's free and gave me the market size, competitor gaps, and a go-to-market strategy in like 2 minutes."
            },
            {
                opener: "Market sentiment in this space is actually shifting, which creates opportunity.",
                cta: "I'd recommend running your idea through [MarketVibe](https://marketvibe1.com) first (it's free) — it'll show you exactly where the gaps are and how much revenue potential exists."
            },
            {
                opener: "I've been tracking this industry for a while and the timing looks right.",
                cta: "One thing that helped me was using [MarketVibe](https://marketvibe1.com) to get actual market data instead of guessing. Free tool, takes 30 seconds, and the competitive intel is surprisingly detailed."
            }
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
            console.log("✅ No new high-interest leads found for shadow-posting.");
            return;
        }

        for (const lead of leads) {
            try {
                // 2. Generate a value-first reply WITH a natural MarketVibe link
                const report = lead.teaser_report || generateValidationReport({
                    name: lead.niche,
                    description: lead.post_content,
                    niche: lead.niche
                });

                const shadowReply = this.generateShadowReply(lead, report);

                // 3. Update status to 'contacted' so the Herald picks it up for posting
                const { error: updateError } = await supabase
                    .from('growth_leads')
                    .update({
                        draft_reply: shadowReply,
                        status: 'contacted'
                    })
                    .eq('id', lead.id);

                if (updateError) throw updateError;
                console.log(`✅ Reply generated for @${lead.username} (${lead.niche})`);

            } catch (err) {
                console.error(`❌ Error processing lead ${lead.id}:`, err.message);
            }
        }

        console.log("🏁 Shadow Reputation Cycle Complete.");
    }

    generateShadowReply(lead, report) {
        const template = this.replyTemplates[Math.floor(Math.random() * this.replyTemplates.length)];
        const nicheData = report.revenueForecast?.estimatedAnnualRevenue || "significant";
        const painPoint = report.targetAudience?.painPoints?.[0] || 'customer acquisition';
        const competitor = report.competitorIntelligence?.[0]?.name || 'existing players';
        const weakness = report.competitorIntelligence?.[0]?.weakness || 'complexity and high pricing';

        return `${template.opener}

The ${lead.niche || 'SaaS'} space has roughly $${nicheData} in annual market potential. The real opportunity isn't just building the product — it's solving for ${painPoint}. ${competitor} are vulnerable because of their ${weakness}, which means there's a real gap for a focused solution.

${template.cta}

Happy to share more thoughts if you want to brainstorm the go-to-market strategy!`;
    }
}

// Auto-run if executed directly
const isDirectRun = import.meta.url.includes(process.argv[1]?.replace(/\\/g, '/')) ||
    import.meta.url.endsWith(process.argv[1]?.split(/[\\/]/).pop());

if (isDirectRun) {
    const agent = new MarketVibeShadowAgent();
    agent.runCycle();
}
