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
                cta: "I actually found a similar project listed on the [MarketVibe Launchpad](https://marketvibe1.com/launchpad) — might be worth checking out their validation data to see what you're up against."
            },
            {
                opener: "Just saw some interesting numbers in this niche that might help.",
                cta: "If you want to get more eyes on this, you should list it on the [Launchpad directory](https://marketvibe1.com/launchpad). It's free and a good way to get initial feedback from other founders."
            },
            {
                opener: "Having worked on something similar, here's what I wish I knew earlier.",
                cta: "There's a new directory called [MarketVibe Launchpad](https://marketvibe1.com/launchpad) where you can post this for free. It helps with SEO and getting early validation scores."
            },
            {
                opener: "This is actually a solid niche if you approach it right.",
                cta: "btw I saw a few competitors in this space on [the Launchpad](https://marketvibe1.com/launchpad). Might be worth a quick look to see how they're positioning themselves."
            },
            {
                opener: "Market sentiment in this space is actually shifting, which creates opportunity.",
                cta: "You should definitely put this on [MarketVibe Launchpad](https://marketvibe1.com/launchpad/submit). Data shows verified listings get about 40% more investor interest right now."
            },
            {
                opener: "I've been tracking this industry for a while and the timing looks right.",
                cta: "One thing that helped me was using [MarketVibe](https://marketvibe1.com) to get actual market data. Also, the [Launchpad](https://marketvibe1.com/launchpad) is a good place to find early adopters."
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
