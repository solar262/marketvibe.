import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const resend = new Resend(process.env.VITE_RESEND_API_KEY);

const DRIP_SEQUENCE = [
    {
        step: 1,
        delayHours: 2,
        subject: "Did you see your MarketVibe Revenue Forecast? 📈",
        template: (name) => `Hey founder! I noticed you generated a validation report for ${name}. 
        
Your idea has serious potential, but I saw you haven't unlocked your 30-day execution blueprint yet.

The blueprint includes:
- Exact marketing channels to use
- Pricing strategy for maximum profit
- Step-by-step launch roadmap

Don't leave your success to chance. Unlock it here: https://www.marketvibe1.com`
    },
    {
        step: 2,
        delayHours: 24,
        subject: "The #1 reason solo founders fail (and how to avoid it) 🛡️",
        template: (name) => `Lack of execution. That's it.

You have the ${name} idea. You have the revenue forecast. Now you just need the map.

We've helped 100+ founders skip the guesswork. Grab your blueprint before the lifetime deal expires!

https://www.marketvibe1.com`
    },
    {
        step: 3,
        delayHours: 48,
        subject: "Last chance: Your validation report expires in 24 hours ⏰",
        template: (name) => `Quick heads-up — the free validation report you generated for ${name} will expire from our servers in 24 hours.

After that, you'd need to regenerate it (and the lifetime deal pricing might not be available).

Here's what founders who upgraded are saying:
- "I launched 3 weeks faster because of the execution blueprint" — Sarah K.
- "The competitor analysis alone saved me from building the wrong thing" — Mike R.

Lock in the $49 lifetime deal before it's gone:
https://www.marketvibe1.com

— The MarketVibe Team

P.S. This is genuinely the lowest price we'll ever offer. After this batch, it goes to $99/mo.`
    }
];

class MarketVibeNurturer {
    async runCycle() {
        console.log("💌 Nurture Cycle Started...");

        // 1. Fetch leads that need nurturing
        const { data: leads, error } = await supabase
            .from('leads')
            .select('*')
            .eq('paid', false)
            .lt('last_nurture_step', DRIP_SEQUENCE.length);

        if (error) {
            console.error("❌ Error fetching leads:", error);
            return;
        }

        console.log(`🎯 Found ${leads.length} leads to evaluate.`);

        for (const lead of leads) {
            const nextStep = DRIP_SEQUENCE.find(s => s.step === (lead.last_nurture_step + 1));
            if (!nextStep) continue;

            const lastContact = new Date(lead.last_nurtured_at || lead.created_at);
            const hoursSinceLastContact = (new Date() - lastContact) / (1000 * 60 * 60);

            if (hoursSinceLastContact >= nextStep.delayHours) {
                await this.sendNurtureEmail(lead, nextStep);
                // Respect Resend rate limits (free tier: 2 requests/sec) - using 2.5s for extreme safety
                await new Promise(resolve => setTimeout(resolve, 2500));
            }
        }

        console.log("🏁 Nurture Cycle Complete.");
    }

    async sendNurtureEmail(lead, stepInfo, retryCount = 0) {
        console.log(`📧 Sending Drip #${stepInfo.step} to ${lead.email}...`);

        try {
            const { data, error } = await resend.emails.send({
                from: 'founder@marketvibe1.com',
                to: lead.email,
                subject: stepInfo.subject,
                text: stepInfo.template(lead.project_name || 'your project'),
            });

            // Robust check for rate limiting (429) across different SDK error formats
            const isRateLimit = error && (
                error.statusCode === 429 ||
                error.status === 429 ||
                error.name === 'rate_limit_exceeded' ||
                (typeof error === 'string' && error.includes('429'))
            );

            if (isRateLimit && retryCount < 5) {
                const backoff = Math.pow(2, retryCount) * 5000; // Exponential backoff starting at 5s
                console.log(`⚠️ Resend Rate Limited. Backing off ${backoff / 1000}s... (Attempt ${retryCount + 1}/5)`);
                await new Promise(resolve => setTimeout(resolve, backoff));
                return this.sendNurtureEmail(lead, stepInfo, retryCount + 1);
            }

            if (error) {
                console.error(`❌ Failed to send email to ${lead.email}:`, error);
                return;
            }

            // Update database
            await supabase
                .from('leads')
                .update({
                    last_nurture_step: stepInfo.step,
                    last_nurtured_at: new Date().toISOString()
                })
                .eq('id', lead.id);

            console.log(`✅ Nurtured ${lead.email}`);
        } catch (err) {
            // SDK might throw on 429 instead of returning it in the error object
            const isRateLimitErr = err.message?.includes('429') || err.name === 'rate_limit_exceeded' || err.statusCode === 429;

            if (isRateLimitErr && retryCount < 5) {
                const backoff = Math.pow(2, retryCount) * 5000;
                console.log(`🔥 Rate Limit Exception. Backing off ${backoff / 1000}s... (Attempt ${retryCount + 1}/5)`);
                await new Promise(resolve => setTimeout(resolve, backoff));
                return this.sendNurtureEmail(lead, stepInfo, retryCount + 1);
            }

            console.error(`🔥 Unexpected error sending to ${lead.email}:`, err.message || err);
        }
    }
}

export { MarketVibeNurturer };

// Only run immediately if executed directly
const isDirectRun = import.meta.url.includes(process.argv[1].replace(/\\/g, '/')) ||
    import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());

if (isDirectRun) {
    console.log("🚀 Running Nurturer directly...");
    const nurturer = new MarketVibeNurturer();
    nurturer.runCycle();
}
