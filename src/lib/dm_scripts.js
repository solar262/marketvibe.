const SITE_URL = (import.meta.env && import.meta.env.VITE_SITE_URL) || (typeof process !== 'undefined' && process.env ? process.env.VITE_SITE_URL : undefined) || 'https://marketvibe1.com';

const GROQ_API_KEY = (typeof process !== 'undefined' && process.env ? process.env.GROQ_API_KEY : undefined);

export const dmScripts = {
    // Fallback static scripts
    high_intent: [
        (name, niche) => `yo ${name}, saw your post about the ${niche} grind. if you're struggling with response rates, i actually built a free AI roaster that critiques your pitches. might help: ${SITE_URL}/roaster`,
        (name, niche) => `stumbled onto your ${niche} project. genuinely solid idea. if you want a brutal AI reality check on your outreach message, try this free pitch roaster: ${SITE_URL}/roaster`
    ],
    curiosity: [
        (name, niche) => `hey, was just reading about ${niche} and remembered i built a tiny tool that estimates the TAM in like 30 seconds. might be useful for your deck: ${SITE_URL}/tools/market-size`,
    ]
};

async function generateGroqResponse(lead) {
    if (!GROQ_API_KEY) return null;

    const systemPrompt = `You are a casual, helpful startup founder surfing Reddit. You are replying to a post by a prospect to organically recommend your tool, MarketVibe. 
Rules:
1. Be extremely casual. Use lowercase mostly, like a text message. NO hashtags. Don't be robotic.
2. Directly reference specific details from their post to prove you actually read it (e.g. if they mention 'Wordpress' or 'late fees', talk about that).
3. Seamlessly hook your tool: MarketVibe (${SITE_URL}), which is an autonomous AI agent for finding B2B leads and growth. 
4. If they seem to need pitch help, hook MarketVibe's Pitch Roaster (${SITE_URL}/roaster).
5. Keep it to 2-3 short sentences. Be authentic. Do not sound like a marketer.`;

    const userPrompt = `Prospect Name: ${lead.username || 'there'}
Prospect Niche/Interest: ${lead.niche || 'startups'}
Prospect Post Content: "${lead.post_content || ''}"

Write the short, casual comment reply. Just the reply, nothing else.`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 150
            })
        });

        if (!response.ok) {
            console.error('Groq API Error:', response.statusText);
            return null;
        }

        const data = await response.json();
        let reply = data.choices[0].message.content.trim();
        // Remove quotes if the LLM added them
        reply = reply.replace(/^["']|["']$/g, '');
        return reply;
    } catch (e) {
        console.error('Groq generation failed:', e.message);
        return null;
    }
}

export const selectScript = async (lead) => {
    console.log(`🧠 AI Content Engine: Analyzing post from ${lead.username || 'prospect'}...`);
    
    // Attempt Groq dynamic generation first
    const aiResponse = await generateGroqResponse(lead);
    
    if (aiResponse) {
        console.log(`✨ AI Generated Contextual Reply: "${aiResponse.substring(0, 50)}..."`);
        return aiResponse;
    }

    console.log(`⚠️ AI generation skipped/failed. Falling back to static templates.`);
    const text = (lead.post_content || '').toLowerCase();
    const name = lead.username || 'there';
    const niche = lead.niche || 'this niche';

    // Anti-Spam Variation: 30% chance to NOT include a link
    const isLinkless = Math.random() < 0.3;

    let template;
    if ((lead.interest_score || 0) >= 8) {
        template = dmScripts.high_intent[Math.floor(Math.random() * dmScripts.high_intent.length)];
    } else {
        template = dmScripts.curiosity[Math.floor(Math.random() * dmScripts.curiosity.length)];
    }

    let script = template(name, niche);

    if (isLinkless) {
        script = script.split('http')[0].trim();
        const questions = [
            " do you want me to send over the link?",
            " lmk if you want to see the tool.",
            " i can drop the link here if it would help."
        ];
        script += questions[Math.floor(Math.random() * questions.length)];
    }

    return script;
};
