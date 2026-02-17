const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://marketvibe1.com';

export const dmScripts = {
    // 1. High Intent (They asked for help/validation)
    high_intent: [
        (name, niche) => `Hey ${name}, saw you're building in ${niche}. I just ran a market analysis on that space and found some interesting keyword gaps. I put the data here if you want to see it: ${SITE_URL}`,
        (name, niche) => `Saw your post about ${niche}. I built a free tool that maps out the customer segments for that exact market. You can grab the report here: ${SITE_URL}`,
        (name, niche) => `Hey ${name}, are you still working on the ${niche} idea? I have some data on the competitor pricing in that space. Check it out: ${SITE_URL}/newsroom`
    ],

    // 2. Budget/Hiring (They have money)
    high_ticket: [
        (name, niche) => `Hi ${name}, noticed you're looking to hire/invest in ${niche}. We have a pre-vetted roadmap and asset kit for that specific market. It's all here: ${SITE_URL}`,
        (name, niche) => `Saw you're scaling your ${niche} project. MarketVibe has a "Founder Kit" that automates the early marketing execution. You can try the demo here: ${SITE_URL}`
    ],

    // 3. General/Curiosity (Low friction)
    curiosity: [
        (name, niche) => `Hey, saw you asking about ${niche}. I built a free calculator that estimates the TAM for that market. Give it a try: ${SITE_URL}/tools/market-size`,
        (name, niche) => `If you're exploring ${niche}, you should check out the trend data we just pulled. It's heating up. Live verification here: ${SITE_URL}/newsroom`
    ]
};

export const selectScript = (lead) => {
    const text = (lead.post_content || '').toLowerCase();

    // Priority 1: Money Talks
    if (text.match(/budget|hiring|invest|price|cost/)) {
        const templates = dmScripts.high_ticket;
        return templates[Math.floor(Math.random() * templates.length)](lead.username, lead.niche);
    }

    // Priority 2: High Interest
    if ((lead.interest_score || 0) >= 7) {
        const templates = dmScripts.high_intent;
        return templates[Math.floor(Math.random() * templates.length)](lead.username, lead.niche);
    }

    // Default: Soft Sell
    const templates = dmScripts.curiosity;
    return templates[Math.floor(Math.random() * templates.length)](lead.username, lead.niche);
};
