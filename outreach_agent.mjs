/**
 * 🤖 MarketVibe Sentinel (MV-AGA Phase 1)
 * This agent autonomously discovers business ideas and persists them
 * for approval in the MarketVibe Commander Center.
 */

import { createClient } from '@supabase/supabase-js';
import { generateValidationReport } from './src/lib/generator.js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

class MarketVibeSentinel {
    constructor() {
        this.keywords = [
            "Roast my landing page",
            "Ads are not converting",
            "Why is nobody buying my SaaS",
            "Validating business idea before building",
            "Alternative to SurveySparrow",
            "best way to validate a niche",
            "looking for first 10 customers",
            "conversion rate is too low",
            "feedback on my startup idea"
        ];
        this.targetSubreddits = ['saas', 'Entrepreneur', 'indiehackers', 'startups', 'SideProject', 'MicroSaaS'];
    }

    async runCycle() {
        console.log("🚀 Sentinel Cycle Started...");

        // 1. Discovery (Live Reddit Search)
        const rawLeads = await this.discoverLeads();

        for (const rawLead of rawLeads) {
            try {
                // 2. Duplicate Detection
                const { data: existing } = await supabase
                    .from('growth_leads')
                    .select('id')
                    .eq('platform_id', rawLead.platform_id)
                    .single();

                if (existing) {
                    continue; // Skip silently to keep logs clean
                }

                console.log(`🎯 New Lead Found: ${rawLead.username} on ${rawLead.platform}`);

                // 3. The Oracle Logic (Generate Teaser)
                const teaserData = {
                    name: rawLead.niche,
                    description: rawLead.post_content.substring(0, 200) + '...',
                    audience: "Founders & Builders",
                    niche: rawLead.niche
                };
                const report = generateValidationReport(teaserData);

                // 4.  Persistence
                const draftReply = this.generateDraftReply(rawLead, report);
                const draftReplyTwitter = this.generateTwitterReply(rawLead, report);

                const interestScore = this.calculateInterestScore(rawLead.post_content);
                const isSystemSpam = this.isSpammy(rawLead.post_content);

                const { error } = await supabase.from('growth_leads').insert({
                    platform: rawLead.platform,
                    platform_id: rawLead.platform_id,
                    username: rawLead.username,
                    post_content: rawLead.post_content,
                    niche: rawLead.niche,
                    interest_score: interestScore,
                    teaser_report: report,
                    draft_reply: draftReply,
                    draft_reply_twitter: draftReplyTwitter,
                    status: (process.env.CLOSER_MODE === 'true' && interestScore >= 9 && !isSystemSpam) ? 'contacted' : 'pending'
                });

                if (error) throw error;
                console.log(`✅ Persisted lead from ${rawLead.username} (Spam: ${isSystemSpam})`);

                // 5. "The Closer" Auto-Pilot (Optional/Experimental)
                if (process.env.CLOSER_MODE === 'true' && interestScore >= 9 && !isSystemSpam) {
                    console.log(`🤖 THE CLOSER: Auto-replying to high-intent lead @${rawLead.username}...`);
                    // In a production environment, this would call the Reddit/Twitter API
                    // For now, we update the status to 'contacted' to signal it's handled.
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
                } else if (isSystemSpam) {
                    console.log(`🛡️ ANTI-SPAM: Filtered low-quality post from @${rawLead.username}`);
                }
            } catch (err) {
                console.error(`❌ Error processing lead ${rawLead.platform_id}:`, err.message);
            }
        }

        console.log("🏁 Sentinel Cycle Complete.");
    }

    async discoverLeads() {
        console.log("🔍 Searching Reddit for High-Intent Founders...");
        const allResults = [];

        // 1. General Keyword Search (Cross-Reddit)
        for (const query of this.keywords.slice(0, 3)) { // Top 3 keywords globally
            try {
                const response = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&limit=5`);
                const json = await response.json();
                if (json.data?.children) this.processRedditResults(json.data.children, allResults);
            } catch (err) { console.error(`Reddit global search error: ${err.message}`); }
        }

        // 2. Subreddit Laser Targeting (Niche Communities)
        for (const sub of this.targetSubreddits) {
            for (const query of this.keywords.slice(0, 3)) {
                try {
                    const fullQuery = `subreddit:${sub} ${query}`;
                    const response = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(fullQuery)}&sort=new&limit=5`);
                    const json = await response.json();
                    if (json.data?.children) this.processRedditResults(json.data.children, allResults);
                } catch (err) { console.error(`Reddit sub search error [${sub}]: ${err.message}`); }
            }
        }

        return allResults;
    }

    processRedditResults(children, resultsArray) {
        children.forEach(post => {
            const data = post.data;
            if (data.author === 'AutoModerator' || data.over_18) return;

            resultsArray.push({
                platform: 'reddit',
                platform_id: `rd_${data.id}`,
                username: data.author,
                post_content: data.title + "\n" + (data.selftext || ''),
                niche: this.detectNiche(data.title + " " + data.selftext)
            });
        });
    }

    extractEntities(text) {
        const textLower = text.toLowerCase();
        const techStack = [
            { id: 'nextjs', match: /\bnext\.?js\b/i },
            { id: 'react', match: /\breact\b/i },
            { id: 'supabase', match: /\bsupabase\b/i },
            { id: 'firebase', match: /\bfirebase\b/i },
            { id: 'stripe', match: /\bstripe\b/i },
            { id: 'node', match: /\bnode\b/i },
            { id: 'python', match: /\bpython\b/i },
            { id: 'rails', match: /\brails\b/i },
            { id: 'gpt', match: /\bgpt(-4)?\b/i },
            { id: 'vercel', match: /\bvercel\b/i },
            { id: 'tailwind', match: /\btailwind\b/i }
        ];
        const foundTech = techStack.filter(tech => tech.match.test(textLower)).map(t => t.id);
        return foundTech.length > 0 ? foundTech : null;
    }

    analyzeProblemRoadblock(text) {
        const roadblocks = [
            { id: 'pricing', keywords: ['price', 'pricing', 'charge', 'cost', 'subscription', 'monetize'], solution: "getting the pricing model right is a major hurdle early on." },
            { id: 'marketing', keywords: ['marketing', 'traffic', 'users', 'customers', 'growth', 'acquisition'], solution: "cracking the distribution code is what separates the winners." },
            { id: 'technical', keywords: ['code', 'bug', 'deploy', 'error', 'stack', 'database', 'slow'], solution: "overcoming the technical debt trap is crucial before scaling." },
            { id: 'co-founder', keywords: ['partner', 'team', 'solo', 'cofounder', 'founder search'], solution: "finding a complimentary partner can 10x your speed." }
        ];
        const textLower = text.toLowerCase();
        return roadblocks.find(r => r.keywords.some(k => textLower.includes(k)));
    }

    detectSentimentExtra(text) {
        const textLower = text.toLowerCase();
        const supportiveKeywords = ['stuck', 'struggling', 'frustrated', 'help', 'advice', 'not sure', 'confused', 'difficult', 'tough'];
        if (supportiveKeywords.some(k => textLower.includes(k))) return 'supportive';
        if (textLower.includes('excited') || textLower.includes('happy') || textLower.includes('finally') || textLower.includes('launch')) return 'celebratory';
        return 'professional';
    }

    detectNiche(text) {
        const textLower = text.toLowerCase();

        // 🏠 Service & Physical
        if (/\b(cleaning|maid|vacuum|scrub)\b/i.test(textLower)) return 'Service Business (Cleaning)';
        if (/\b(house|renovate|remodel)\b/i.test(textLower) && /\b(cleaning|renovate|house)\b/i.test(textLower)) return 'Home Improvement';

        // 🎨 Physical Products & Hobbies
        if (/\b(writing tools|stationery)\b/i.test(textLower) || (/\bpen\b/i.test(textLower) && !/\bapp\b/i.test(textLower))) return 'Stationery & Writing Tools';
        if (/\b(miniature|toy|collectible|hobby)\b/i.test(textLower)) return 'Hobby & Collectibles';

        if (/\b(pet|dog|cat)\b/i.test(textLower)) return 'Pet Tech';
        if (/\bcoffee\b/i.test(textLower)) return 'Coffee Subscription';
        if (/\b(real estate|realtor|property)\b/i.test(textLower)) return 'Real Estate Tech';

        // 💻 E-commerce & Retail
        if (/\b(ecommerce|shopify|dropshipping)\b/i.test(textLower)) return 'E-commerce';
        if (/\b(amazon|fba|selling products)\b/i.test(textLower)) return 'Retail Arbitrage';

        // 🤖 Tech & AI
        if (/\b(ai |bot|agent|gpt)\b/i.test(textLower)) return 'AI/Automation Agent';
        // Precise SaaS check (Avoid "happy", "apps", etc matching "app")
        if (/\b(software|builder|saas)\b/i.test(textLower) || /\bapp\b/i.test(textLower)) return 'SaaS / Micro-SaaS';

        // 📈 Marketing & Agency
        if (/\b(marketing|agency|smma|outreach)\b/i.test(textLower)) return 'Marketing Agency';

        // 💸 Fintech & Wealth
        if (/\b(money|pay|bank|crypto|finance)\b/i.test(textLower)) return 'Fintech';

        // 🎓 Edtech & Academic (Exclude from SaaS)
        if (/\b(learn|school|course|teaching|tutor|university|admissions|harvard|phd|student)\b/i.test(textLower)) return 'Education & Academic';

        return 'Indie Project';
    }

    detectIntent(text, platform = 'reddit') {
        const textLower = text.toLowerCase();
        const entities = this.extractEntities(text);
        const roadblock = this.analyzeProblemRoadblock(text);
        const sentiment = this.detectSentimentExtra(text);

        // 1. Context Extraction (Extracting the "Seed" of the post)
        const projectMatch = text.match(/project|app|tool|startup|business|idea/i);
        const contextSeed = projectMatch ? `your ${projectMatch[0].toLowerCase()}` : "your idea";

        const intents = [
            {
                keywords: ['co-founder', 'partner', 'co founder'],
                type: 'co-founder',
                openers: [
                    `Finding the right co-founder for ${contextSeed} is easily the hardest part.`,
                    `Saw your post about looking for a partner for ${contextSeed}. It's a tough search.`,
                    `Building ${contextSeed} with the right teammate makes all the difference.`
                ],
                supportOpener: `I feel you on the co-founder search for ${contextSeed}—it's draining but vital.`
            },
            {
                keywords: ['hire', 'hiring', 'developer', 'non-technical'],
                type: 'hiring',
                openers: [
                    `Finding the right talent to build ${contextSeed} is a massive hurdle.`,
                    `Saw you're looking to hire for ${contextSeed}. Good luck with the search!`,
                    `Hiring for a new ${contextSeed} can be hit or miss without the right validation.`
                ],
                supportOpener: `Scaling the team for ${contextSeed} is a high-stakes move.`
            },
            {
                keywords: ['feedback', 'advice', 'thoughts'],
                type: 'feedback',
                openers: [
                    `Getting honest feedback on ${contextSeed} early on saves so much time later.`,
                    `Love the concept behind ${contextSeed}. Honest feedback is gold at this stage.`,
                    `I saw your post asking for thoughts on ${contextSeed}. It's a solid niche.`
                ],
                supportOpener: `Don't let the early feedback for ${contextSeed} discourage you—it's all data.`
            },
            {
                keywords: ['launch', 'today', 'live'],
                type: 'launch',
                openers: [
                    `Huge congrats on the launch for ${contextSeed}! Day one is always a rush.`,
                    `Saw that ${contextSeed} just went live. Massive milestone!`,
                    `Wishing you a smooth launch for ${contextSeed}. It's a great feeling to ship.`
                ],
                supportOpener: `Launching ${contextSeed} is just the beginning of the real work.`
            }
        ];

        const match = intents.find(i => i.keywords.some(word => textLower.includes(word)));
        let opener = "";

        if (match) {
            opener = (sentiment === 'supportive') ? (match.supportOpener || match.openers[0]) : match.openers[Math.floor(Math.random() * match.openers.length)];
        } else {
            opener = `That ${this.detectNiche(text)} idea sounds like it has serious potential.`;
        }

        // Add entity mention if found
        if (entities && entities.length > 0) {
            const entityList = entities.join(' & ');
            opener += ` Using ${entityList} is a solid choice for building this out.`;
        }

        // Add roadblock mention if found
        if (roadblock && sentiment === 'supportive') {
            opener += ` Especially since ${roadblock.solution}`;
        }

        return { type: match?.type || 'general', opener, platform };
    }


    isSpammy(text) {
        const textLower = text.toLowerCase();
        // 1. Length Check (Ignore extremely short/vague posts)
        if (text.length < 40) return true;

        // 2. Sentiment/Hostility Guard
        const hostileWords = ['stupid', 'dumb', 'scam', 'hate', 'terrible', 'worst', 'sucks', 'bitter'];
        if (hostileWords.some(word => textLower.includes(word))) return true;

        // 3. Academic/Emotional Venting Guard (Phase 29 Fix)
        const ventingSignals = ['phd', 'harvard', 'admissions', 'rejections', 'venting', 'university', 'professor'];
        if (ventingSignals.some(word => textLower.includes(word))) return true;

        // 4. Repetition Check (Basic) - If they repeat the same word 5+ times
        const words = textLower.split(/\s+/);
        const counts = {};
        for (const w of words) {
            counts[w] = (counts[w] || 0) + 1;
            if (counts[w] > 5 && w.length > 3) return true;
        }

        return false;
    }

    generateDraftReply(lead, report) {
        const intent = this.detectIntent(lead.post_content, 'reddit');
        const niche = this.detectNiche(lead.post_content);

        return `Hey @${lead.username}, ${intent.opener} 🔬

I actually ran a quick MarketVibe study on the ${niche} market data for you:
- Est. Year 1 Revenue: $${report.revenueForecast.estimatedAnnualRevenue}
- Primary Audience: ${report.targetAudience.primarySegment}

I put together a full 30-day execution blueprint for your project based on these numbers here:
👉 https://www.marketvibe1.com

Rooting for you!`;
    }

    calculateInterestScore(text) {
        let score = 5; // Base score
        const textLower = text.toLowerCase();

        // 1. Transactional Weighting (Founder + Question = High Intent)
        const hasQuestion = text.includes('?');
        const founderSignals = ['stuck', 'how do i', 'help with', 'advice on', 'struggling', 'validation', 'feedback'];
        if (hasQuestion && founderSignals.some(s => textLower.includes(s))) {
            score += 5; // Huge boost for direct questions from founders
        }

        // 2. High intent keywords (+2)
        const highIntent = [
            'validate', 'feedback', 'struggling', 'stuck',
            'customer', 'revenue', 'launch', 'market', 'budget', 'hiring',
            'investing', 'competitor', 'business model', 'pricing'
        ];
        highIntent.forEach(word => {
            if (textLower.includes(word)) score += 1;
        });

        // 3. Negative Semantic Mapping (The "Advice-Giver" Filter) -7 to -10
        const adviceSignals = [
            'my tips', 'i learned', 'how to build', 'how to scale', 'lesson',
            'thread:', 'sharing this', 'guide', 'tutorial', 'case study',
            'not shiny new hacks', 'instead of just reading', 'generic advice'
        ];
        if (adviceSignals.some(s => textLower.includes(s))) {
            score -= 8; // Heavy penalty for advice-giving/educational content
        }

        // 4. Listicle Detection (Often signals advice/guides)
        const listMatches = text.match(/\d+\.\s+\*\*/g); // Matches "1. **" style lists
        if (listMatches && listMatches.length >= 2) {
            score -= 5;
        }

        // 5. Semantic Proximity to "Founder Pain"
        const painPoints = ['losing money', 'no users', 'zero traffic', 'quitting', 'fail', 'burn rate'];
        if (painPoints.some(p => textLower.includes(p))) score += 3;

        // 6. Curiosity/Vague only (-3)
        const lowIntent = ['just curious', 'wondering', 'thinking about', 'someday', 'theoretical'];
        lowIntent.forEach(word => {
            if (textLower.includes(word)) score -= 2;
        });

        return Math.min(10, Math.max(1, score));
    }

    generateTwitterReply(lead, report) {
        const intent = this.detectIntent(lead.post_content, 'twitter');
        const niche = this.detectNiche(lead.post_content);
        return `Hey @${lead.username}, ${intent.opener} 🔬 

I ran a quick MarketVibe test on the ${niche} data for you:
- Est. Revenue: $${report.revenueForecast.estimatedAnnualRevenue}
- Audience: ${report.targetAudience.primarySegment}

Blueprint: 👉 https://www.marketvibe1.com`;
    }
}

export { MarketVibeSentinel };

// Only run immediately if executed directly
const isDirectRun = process.argv[1] && (
    import.meta.url.includes(process.argv[1].replace(/\\/g, '/')) ||
    import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop())
);

if (isDirectRun) {
    const isOnce = process.argv.includes('--once');
    console.log(`🚀 Running Sentinel directly${isOnce ? ' (Once mode)' : ''}...`);
    const sentinel = new MarketVibeSentinel();
    if (isOnce) {
        sentinel.runCycle();
    } else {
        // Normal continuous mode
        sentinel.runCycle();
    }
}
