
// dotenv removed to prevent browser crash
const XAI_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_XAI_API_KEY) || process.env.XAI_API_KEY;
const GROQ_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GROQ_API_KEY) || process.env.GROQ_API_KEY;
const XAI_BASE_URL = 'https://api.x.ai/v1';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

/**
 * 🧠 Intelligence Hub (Pivoted for "Zero-Fund" Operations)
 * Dynamically switches between Grok (Paid), Groq (Free Tier), and Browser Bridge (SuperGrok).
 */
export const grok = {
    async chat(messages, model = 'grok-4.20-reasoning') {
        // 1. Try xAI (Paid API)
        if (XAI_API_KEY) {
            try {
                const response = await fetch(`${XAI_BASE_URL}/chat/completions`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${XAI_API_KEY}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model, messages, temperature: 0.7 })
                });
                if (response.ok) {
                    const data = await response.json();
                    return data.choices[0].message.content;
                }
                console.warn("⚠️ xAI API Credit exhausted. Switching to Free Tier...");
            } catch (err) {}
        }

        // 2. Try Groq (Llama 3 70B - Free Tier Fallback)
        if (GROQ_API_KEY) {
            try {
                const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        model: 'llama-3.3-70b-versatile', 
                        messages, 
                        temperature: 0.7, 
                        max_tokens: 4096 
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    return data.choices[0].message.content;
                }
                const errJson = await response.json().catch(() => ({}));
                console.warn("⚠️ Groq API Error:", response.status, errJson);
            } catch (err) {
                console.error("❌ Groq Fetch Error:", err.message);
            }
        }

        // 3. Try Browser Bridge (SuperGrok - Ultimate Free Native Fallback)
        // Only works in Node.js context (Outreach Agent / Backend)
        if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development' && typeof window === 'undefined') {
            try {
                // Use a dynamic import that Vite will ignore or handle properly
                const agentPath = '../../agents/browser_ai.js';
                const { generateGrokResponse } = await import(/* @vite-ignore */ agentPath);
                const lastMsg = messages[messages.length - 1].content;
                return await generateGrokResponse(lastMsg);
            } catch (err) {
                console.error("Browser Bridge failed:", err.message);
            }
        }

        return null;
    },

    /**
     * 🔎 Analyze a Business Idea
     * Replaces the mock generator logic with deep-dive Grok research.
     */
    async analyzeIdea(projectData) {
        const { name, description, audience, niche } = projectData;
        
        const prompt = `
            You are a senior Venture Capitalist and Market Research Expert. 
            Analyze the following business idea and provide a detailed, REALISTIC report in JSON format.
            
            Idea Name: ${name}
            Description: ${description}
            Target Audience: ${audience}
            Niche: ${niche}
            
            Return ONLY a JSON object with this exact structure:
            {
                "landingPage": {
                    "headline": "A punchy, high-converting headline",
                    "subheadline": "A value-proposition focused subheadline",
                    "features": [{"title": "Benefit-driven feature", "detail": "Detailed explanation"}]
                },
                "revenueForecast": {
                    "totalAddressableMarket": "Realistic number with explanation",
                    "estimatedAnnualRevenue": "Estimated revenue based on realistic capture rate",
                    "pricingStrategy": "Proposed revenue model",
                    "pricingTiers": [{"name": "Starter", "price": "$49", "features": ["Feature 1"]}]
                },
                "executionPlan": [{"week": "Week 1", "tasks": [{"day": "Day 1", "task": "Specific action item"}]}],
                "competitorIntelligence": [{"name": "Real Competitor Name", "gap": "Why they aren't solving the problem well"}],
                "riskAssessment": ["List of real risks and how to avoid them"],
                "viralHook": "A specific idea for a viral TikTok/X post to launch this",
                "founderAssets": {
                    "outreachEmail": {"subject": "...", "body": "..."},
                    "socialTemplate": {"reddit": "...", "twitter": "..."}
                },
                "expertAdCopy": {
                    "facebook": {"headline": "...", "body": "...", "cta": "..."},
                    "google": {"headline": "...", "description": "..."}
                },
                "targetAudience": {
                    "primarySegment": "...",
                    "painPoints": ["...", "...", "..."],
                    "valueProp": "..."
                }
            }
        `;

        const result = await this.chat([
            { role: 'system', content: 'You are a high-fidelity business intelligence agent. Output only valid JSON.' },
            { role: 'user', content: prompt }
        ]);

        if (!result) return null;

        try {
            // Clean the output in case Grok wraps it in markdown
            const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJson);
        } catch (e) {
            console.error("❌ Grok JSON Parse Error:", e);
            return null;
        }
    },
    
    /**
     * 🛡️ Smart Contract Security Scan
     * Analyzes contract code for real vulnerabilities.
     */
    async scanSecurity(content) {
        const prompt = `
            Perform a rigorous security audit on this Smart Contract code or address.
            If only an address is provided, analyze it based on common patterns for that protocol type if known, otherwise focus on general EVM security.
            If code is provided, perform deep bytecode/logic analysis.
            
            Target Content: ${content}
            
            Return ONLY a JSON object with this structure:
            {
                "score": 0-100 (where 100 is perfectly secure),
                "metrics": {
                    "gasComplexity": "Low/Medium/High",
                    "centralization": "Low/Medium/High",
                    "logicQuality": "Optimal/Sub-optimal"
                },
                "vulnerabilities": [
                    {
                        "title": "Vulnerability Name",
                        "severity": "high/medium/low",
                        "desc": "Technical description",
                        "impact": "What happens if exploited",
                        "fix": "How to resolve it",
                        "code": "Snippet of problematic code or example exploit"
                    }
                ]
            }
        `;

        const result = await this.chat([
            { role: 'system', content: 'You are a senior Web3 Security Auditor. Output only valid JSON.' },
            { role: 'user', content: prompt }
        ]);

        if (!result) return null;

        try {
            const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJson);
        } catch (e) {
            console.error("❌ Grok Security Parse Error:", e);
            return null;
        }
    },

    /**
     * 🎯 Score a Lead
     * Analyzes a post to determine if the user is a high-intent target.
     */
    async scoreLead(postContent) {
        const prompt = `
            Analyze this social media post to determine if the author is a high-intent business lead for a "Venture Intelligence" or "Market Validation" tool.
            
            Post: "${postContent}"
            
            Scoring Criteria:
            - Intent to build/validate/scale (0-10)
            - Current pain level (0-10)
            - Likelihood of paying for a solution (0-10)
            
            Return ONLY a JSON object:
            {
                "score": 0-10 (overall priority),
                "reason": "One sentence explanation of the score",
                "painPoints": ["Point 1", "Point 2"]
            }
        `;

        const result = await this.chat([
            { role: 'system', content: 'You are an Elite Sales Lead Qualifier. Output only valid JSON.' },
            { role: 'user', content: prompt }
        ]);

        if (!result) return { score: 5, reason: "Defaulting due to timeout", painPoints: [] };

        try {
            const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJson);
        } catch (e) {
            return { score: 5, reason: "Parse error", painPoints: [] };
        }
    },

    /**
     * ✍️ Generate Personalized Outreach
     * Writes a value-first, non-spammy reply.
     */
    async generateOutreach(lead, report) {
        const prompt = `
            Write a personalized, value-first response to this user on ${lead.platform}.
            Goal: Be helpful and offer a specific insight from the "Venture Intelligence Report" below. 
            Do NOT sound like a bot. Do NOT use generic sales talk.
            
            User Post: "${lead.post_content}"
            Intelligence Report (summarized): ${JSON.stringify(report.landingPage.headline)}
            
            Return ONLY a JSON object:
            {
                "reply": "The actual message text",
                "strategy": "Why this approach was taken"
            }
        `;

        const result = await this.chat([
            { role: 'system', content: 'You are a high-level Business Consultant. You provide value first. Output only valid JSON.' },
            { role: 'user', content: prompt }
        ]);

        if (!result) return { reply: "Hey, I saw your post. Really cool idea!", strategy: "Fallback" };

        try {
            const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJson);
        } catch (e) {
            return { reply: "Hey, saw your post. Love the concept!", strategy: "Fallback" };
        }
    }
};
