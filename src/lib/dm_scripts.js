const SITE_URL = (import.meta.env && import.meta.env.VITE_SITE_URL) || (typeof process !== 'undefined' && process.env ? process.env.VITE_SITE_URL : undefined) || 'https://marketvibe1.com';

export const dmScripts = {
    // 1. High Intent (Direct questions or "stuck" signals)
    high_intent: [
        (name, niche) => `yo ${name}, saw your post about the ${niche} grind. i actually just finished a deep dive into that niche and found a few low-competition keywords you could probably dominate. i put the full data here if you want it: ${SITE_URL}`,
        (name, niche) => `hey ${name}, i was just looking at ${niche} trends earlier. i mapped out the main customer segments for a similar project last week. you can grab that roadmap here if it helps save you some time: ${SITE_URL}`,
        (name, niche) => `hi ${name}, saw you're navigating the ${niche} market. building in public is the way to go tbh. i have some data on how your competitors are pricing their stuff—might give you an edge. ${SITE_URL}/newsroom`,
        (name, niche) => `stumbled onto your ${niche} project. genuinely solid idea. i pulled a revenue forecast for that exact model that might be useful for your next launch. check it: ${SITE_URL}`
    ],

    // 2. High Ticket (Hiring, Budget, Scaling)
    high_ticket: [
        (name, niche) => `hey ${name}, saw you're scaling in the ${niche} space. that's a high-leverage move. we actually have a pre-vetted founder kit that automates most of the early marketing heavy lifting. demo is here if you're curious: ${SITE_URL}`,
        (name, niche) => `yo ${name}, noticed you're investing in ${niche} right now. solid market choice tbh. i built an autonomous research engine that pulls live signals for that niche—could save you a ton of manual research. ${SITE_URL}/newsroom`,
        (name, niche) => `hi ${name}, if you're hiring for ${niche}, you're definitely moving fast. i have a data pack on current market demand/gaps in that space. might help you point your team in the right direction: ${SITE_URL}`
    ],

    // 3. Curiosity/Soft (General interest posts)
    curiosity: [
        (name, niche) => `hey, was just reading about ${niche} and remembered i built a tiny tool that estimates the TAM in like 30 seconds. might be useful for your deck: ${SITE_URL}/tools/market-size`,
        (name, niche) => `if you're exploring ${niche}, you should see the trend alerts we just got. the market is shifting towards micro-solutions. verification data is here: ${SITE_URL}/newsroom`,
        (name, niche) => `yo, saw you're interested in ${niche}. i'm tracking a few developers building similar stuff. i have a list of what's working/failing in that space if you want to see the report: ${SITE_URL}`
    ]
};

export const selectScript = (lead) => {
    const text = (lead.post_content || '').toLowerCase();
    const name = lead.username || 'there';
    const niche = lead.niche || 'this niche';

    // Anti-Spam Variation: 30% chance to NOT include a link and just ask a question (HITL/Conversation)
    const isLinkless = Math.random() < 0.3;

    let template;
    if (text.match(/budget|hiring|invest|price|cost/)) {
        template = dmScripts.high_ticket[Math.floor(Math.random() * dmScripts.high_ticket.length)];
    } else if ((lead.interest_score || 0) >= 8) {
        template = dmScripts.high_intent[Math.floor(Math.random() * dmScripts.high_intent.length)];
    } else {
        template = dmScripts.curiosity[Math.floor(Math.random() * dmScripts.curiosity.length)];
    }

    let script = template(name, niche);

    if (isLinkless) {
        // Strip the link and add a question to build rapport
        script = script.split('http')[0].trim();
        const questions = [
            " do you want me to send over the link?",
            " lmk if you want to see the data.",
            " i can drop the link here if it would help as well.",
            " would that be useful for what you're building?"
        ];
        script += questions[Math.floor(Math.random() * questions.length)];
    }

    return script;
};
