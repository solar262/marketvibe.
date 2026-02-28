import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const resend = new Resend(process.env.VITE_RESEND_API_KEY);

const SITE_URL = process.env.VITE_SITE_URL || 'https://www.marketvibe1.com';

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

Don't leave your success to chance. Unlock it here: ${SITE_URL}`
    },
    {
        step: 2,
        delayHours: 24,
        subject: "The #1 reason solo founders fail (and how to avoid it) 🛡️",
        template: (name) => `Lack of execution. That's it.

You have the ${name} idea. You have the revenue forecast. Now you just need the map.

We've helped 100+ founders skip the guesswork. Grab your blueprint before the lifetime deal expires!

${SITE_URL}`
    }
];

const DATA_PACK_DRIP = [
    {
        step: 1,
        delayHours: 1,
        subject: "Your [NICHE] Data Pack is inside! 🎁",
        template: (niche) => `Hi there!
        
Thanks for requesting the ${niche} Data Pack. As promised, I've attached the core market signals we've identified for this niche.

Beyond the raw data, the real "unfair advantage" is having an execution playbook. 

I've generated a full 30-day roadmap specifically for the ${niche} space here:
${SITE_URL}/blog/${niche.toLowerCase().replace(/[^a-z0-9]/g, '-')}

Go get 'em!
— MarketVibe Team`
    },
    {
        step: 2,
        delayHours: 24,
        subject: "Found a new signal for [NICHE] 📡",
        template: (niche) => `Quick update on ${niche}!

Our discovery engine just flagged 3 new high-intent discussions in this niche. It's moving faster than we expected.

If you're serious about capturing this market, you should check the latest revenue forecasts.

Unlock the full report here: ${SITE_URL}`
    }
];

class MarketVibeNurturer {
    async runCycle() {
        console.log("💌 Nurture Cycle Started...");

        // 1. WARM NURTURE (Email)
        await this.runEmailNurture();

        // 2. COLD NURTURE (Social Nudge)
        await this.runSocialNurture();

        console.log("🏁 Nurture Cycle Complete.");
    }

    async runEmailNurture() {
        console.log("📨 Evaluating Email Leads...");
        const { data: leads, error } = await supabase
            .from('leads')
            .select('*')
            .eq('paid', false);

        if (error) {
            console.error("❌ Error fetching email leads:", error);
            return;
        }

        for (const lead of leads) {
            const isDataPack = lead.source === 'popup';
            const sequence = isDataPack ? DATA_PACK_DRIP : DRIP_SEQUENCE;

            if (lead.last_nurture_step >= sequence.length) continue;

            const nextStep = sequence.find(s => s.step === (lead.last_nurture_step + 1));
            if (!nextStep) continue;

            const lastContact = new Date(lead.last_nurtured_at || lead.created_at);
            const hoursSinceLastContact = (new Date() - lastContact) / (1000 * 60 * 60);

            if (hoursSinceLastContact >= nextStep.delayHours) {
                const niche = lead.results?.niche || 'your chosen niche';
                const subject = nextStep.subject.replace('[NICHE]', niche);
                const body = nextStep.template(niche || lead.project_name);

                await this.sendNurtureEmail(lead, nextStep.step, subject, body);
                await new Promise(resolve => setTimeout(resolve, 2500));
            }
        }
    }

    async runSocialNurture() {
        console.log("📡 Evaluating Cold Social Leads for Nudges...");
        // Look for leads that were contacted but not yet closed/qualified
        // and have been sitting for 48+ hours
        const { data: leads, error } = await supabase
            .from('growth_leads')
            .select('*')
            .eq('status', 'contacted')
            .eq('is_posted', true);

        if (error) {
            console.error("❌ Error fetching social leads:", error);
            return;
        }

        for (const lead of leads) {
            const lastContact = new Date(lead.created_at);
            const hoursSinceLastContact = (new Date() - lastContact) / (1000 * 60 * 60);

            if (hoursSinceLastContact >= 48) {
                console.log(`🤖 Generating Social Nudge for @${lead.username} on ${lead.platform}...`);

                const nudge = `Hey @${lead.username}, just checking in—was that ${lead.niche} data I shared helpful? No pressure at all, just wanted to make sure it reached you!`;

                // Update the draft reply to the nudge so the Herald can pick it up
                // We mark it as 'pending_nudge' so it stands out in the dashboard
                await supabase
                    .from('growth_leads')
                    .update({
                        draft_reply: nudge,
                        draft_reply_twitter: nudge,
                        status: 'pending_nudge',
                        is_posted: false // Reset so Herald tries again
                    })
                    .eq('id', lead.id);

                console.log(`✅ Nudge queued for ${lead.username}`);
            }
        }
    }

    async sendNurtureEmail(lead, step, subject, body, retryCount = 0) {
        console.log(`📧 Sending Drip #${step} to ${lead.email}...`);

        try {
            const { data, error } = await resend.emails.send({
                from: 'founder@marketvibe1.com',
                to: lead.email,
                subject: subject,
                text: body,
            });

            if (error && retryCount < 5) {
                console.log(`⚠️ Email error, retrying...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
                return this.sendNurtureEmail(lead, step, subject, body, retryCount + 1);
            }

            if (error) return;

            await supabase
                .from('leads')
                .update({
                    last_nurture_step: step,
                    last_nurtured_at: new Date().toISOString()
                })
                .eq('id', lead.id);

            console.log(`✅ Nurtured ${lead.email}`);
        } catch (err) {
            console.error(`🔥 Unexpected error sending to ${lead.email}:`, err.message || err);
        }
    }
}

export { MarketVibeNurturer };

// Only run immediately if executed directly
const isDirectRun = process.argv[1] && (
    import.meta.url.includes(process.argv[1].replace(/\\/g, '/')) ||
    import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop())
);

if (isDirectRun) {
    console.log("🚀 Running Nurturer directly...");
    const nurturer = new MarketVibeNurturer();
    nurturer.runCycle();
}
