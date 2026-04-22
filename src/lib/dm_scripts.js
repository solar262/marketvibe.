const SITE_URL = (import.meta.env && import.meta.env.VITE_SITE_URL) || (typeof process !== 'undefined' && process.env ? process.env.VITE_SITE_URL : undefined) || 'https://marketvibe1.com';

const GROQ_API_KEY = (typeof process !== 'undefined' && process.env ? process.env.GROQ_API_KEY : undefined);
const XAI_API_KEY = (typeof process !== 'undefined' && process.env ? process.env.XAI_API_KEY : undefined);
const USE_SUPERGROK = (typeof process !== 'undefined' && process.env ? process.env.USE_SUPERGROK_BROWSER : undefined) === 'true';

import { generateGrokResponse as generateBrowserResponse } from './browser_ai.js';

export const dmScripts = {
// ...
// ... lines 5-15 ...
// ...
};

async function generateGroqResponse(lead) {
    const isNode = typeof window === 'undefined';
    
    const userPrompt = `Prospect Name: ${lead.username || 'there'}
Prospect Niche/Interest: ${lead.niche || 'startups'}
Prospect Post Content: "${lead.post_content || ''}"

Write a short, casual 2-sentence comment reply to organically recommend a solution. Keep it lowercase.`;

    if (isNode && USE_SUPERGROK) {
        console.log(`🤖 [MV-AI] Channeling SuperGrok (Browser)...`);
        const result = await generateBrowserResponse(userPrompt);
        if (result) return result;
        console.warn(`⚠️ [MV-AI] Browser generation failed, falling back to API.`);
    }

    const apiKey = XAI_API_KEY || GROQ_API_KEY;
    if (!apiKey) return null;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 150
            })
        });

        if (!response.ok) {
            console.error('AI API Error:', response.statusText);
            return null;
        }

        const data = await response.json();
        let reply = data.choices[0].message.content.trim();
        // Remove quotes if the LLM added them
        reply = reply.replace(/^["']|["']$/g, '');
        return reply;
    } catch (e) {
        console.error('AI generation failed:', e.message);
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
