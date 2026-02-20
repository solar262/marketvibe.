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

                const { error } = await supabase.from('growth_leads').upsert({
                    platform: rawLead.platform,
                    platform_id: rawLead.platform_id,
                    username: rawLead.username,
                    post_content: rawLead.post_content,
                    niche: rawLead.niche,
                    interest_score: interestScore,
                    teaser_report: report,
                    draft_reply: draftReply,
                    draft_reply_twitter: draftReplyTwitter,
                    status: (process.env.CLOSER_MODE === 'true' && interestScore >= 6 && !isSystemSpam) ? 'contacted' : 'pending'
                }, { onConflict: 'platform_id', ignoreDuplicates: true });

                if (error) throw error;
                console.log(`✅ Persisted lead from ${rawLead.username} (Spam: ${isSystemSpam})`);

                // 5. "The Closer" Auto-Pilot (Optional/Experimental)
                if (process.env.CLOSER_MODE === 'true' && interestScore >= 6 && !isSystemSpam) {
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

        // Deduplicate results by platform_id before returning
        const uniqueResults = Array.from(new Map(allResults.map(item => [item.platform_id, item])).values());
        return uniqueResults;
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
            { id: 'engagement', keywords: ['engagement', 'chat', 'retention', 'participation', 'community building'], solution: "optimizing user engagement is the key to a sticky platform." },
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
        if (/\b(renovate|remodel|plumbing|roofing|landscaping|contractor|repairs)\b/i.test(textLower) && /\b(house|home|apartment)\b/i.test(textLower)) return 'Home Improvement';

        // 🏥 Professional & Local Services (Medical/Legal/Agency)
        if (/\b(clinic|doctor|dentist|patient|receptionist|medical|surgeon|hospital)\b/i.test(textLower)) return 'Medical/Professional Service';
        if (/\b(lawyer|attorney|legal|consultant|advisor)\b/i.test(textLower)) return 'Consulting/Professional Service';
        if (/\b(marketing|agency|smma|outreach|ad management|clients)\b/i.test(textLower)) return 'Marketing/Service Agency';

        // 🛠️ Productivity & Utilities
        if (/\b(clipboard|workflow|productivity|task|calendar|notes|todo|organize|system tray|windows app|mac app|desktop app|utility)\b/i.test(textLower)) return 'Productivity Tool';

        // 🎨 Physical Products & Hobbies
        if (/\b(writing tools|stationery)\b/i.test(textLower) || (/\bpen\b/i.test(textLower) && !/\bapp\b/i.test(textLower))) return 'Stationery & Writing Tools';
        if (/\b(miniature|toy|collectible|hobby)\b/i.test(textLower)) return 'Hobby & Collectibles';

        if (/\b(pet|dog|cat|feline|canine)\b/i.test(textLower)) return 'Pet Tech';
        if (/\bcoffee\b/i.test(textLower)) return 'Coffee Subscription';
        if (/\b(real estate|realtor|property)\b/i.test(textLower)) return 'Real Estate Tech';

        // 🎮 Entertainment & Media
        if (/\b(stream|twitch|kick|creator|youtube|tiktok)\b/i.test(textLower)) return 'Streaming & Content Creation';

        // 💻 E-commerce & Retail
        if (/\b(ecommerce|shopify|dropshipping)\b/i.test(textLower)) return 'E-commerce';
        if (/\b(amazon|fba|selling products)\b/i.test(textLower)) return 'Retail Arbitrage';

        // 🤖 Tech & AI
        if (/\b(ai |bot|agent|gpt)\b/i.test(textLower)) return 'AI/Automation Agent';
        // Precise SaaS check (Avoid "happy", "apps", etc matching "app")
        if (/\b(software|builder|saas)\b/i.test(textLower) || (/\bapp\b/i.test(textLower) && !/\bhappy\b/i.test(textLower))) return 'SaaS / Micro-SaaS';

        // 🎓 Edtech & Academic
        if (/\b(learn|school|course|teaching|tutor|university|admissions|harvard|phd|student|institute|institute|training)\b/i.test(textLower)) return 'Education/Training';

        return 'High-Value Venture'; // Replaces "Indie Project" for better tone
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
                keywords: ['\bco-founder\b', '\bpartner\b', '\bco founder\b'],
                type: 'co-founder',
                openers: [
                    "finding a co-founder is honestly such a grind, but finding the right person for your project makes it worth it.",
                    "saw you're looking for a partner. tbh that's a high-stakes search but it changes everything when you find the one.",
                    "building with the right teammate is a literal game changer. hope you find someone solid."
                ],
                supportOpener: "finding a co-founder is easily the hardest part. it's draining but vital imo."
            },
            {
                keywords: ['\bhiring\b', '\bjob\b', '\brole\b', '\bcontract\b'],
                type: 'hiring',
                openers: [
                    "building out a team is the ultimate leveling up move.",
                    "hiring is a whole different skill set than building but it's how you scale honestly.",
                    "finding solid talent to bring the vision to life is high-leverage work."
                ],
                supportOpener: "scaling the team is always a transition phase. wishing you luck with the new hires!"
            },
            {
                keywords: ['\bfeedback\b', '\bcritique\b', '\bthoughts\b', '\broast\b'],
                type: 'feedback',
                openers: [
                    "asking for feedback early is how you avoid building in a vacuum.",
                    "getting fresh eyes on a project is crucial honestly.",
                    "roasting your own idea before you launch is a pro move."
                ],
                supportOpener: "feedback loops are the secret weapon of building in public imo."
            },
            {
                keywords: ['\blaunch\b', '\btoday\b', '\bwent live\b', '\bshipping\b'],
                type: 'launch',
                openers: [
                    "launching is easily the most nerve-wracking and exciting part of the journey.",
                    "just saw you went live. huge milestone, keep that momentum going honestly!",
                    "shipping is a win in itself. wishing you a smooth launch week tbh."
                ],
                supportOpener: "shipping is a win in itself. wishing you a smooth launch week tbh."
            },
            {
                keywords: ['\bwrong\b', '\bnot converting\b', '\bhelp me fix\b', '\blow conversion\b', '\bno sales\b', '\bfailing\b'],
                type: 'troubleshooting',
                openers: [
                    "ads not converting is easily the most frustrating part of the game. tracking exactly where the traffic is leaking usually helps tbh.",
                    "saw yours ads aren't hitting. honestly that usually comes down to either the hook or the market alignment.",
                    "not converting is a grind. usually it's a data gap between the offer and the audience imo."
                ],
                supportOpener: "troubleshooting a live funnel is a high-stress move. rooting for you to find the leak honestly."
            }
        ];

        const match = intents.find(i => i.keywords.some(word => textLower.includes(word)));
        let opener = "";

        if (match) {
            opener = (sentiment === 'supportive') ? (match.supportOpener || match.openers[0]) : match.openers[Math.floor(Math.random() * match.openers.length)];
        } else {
            const niche = this.detectNiche(text);
            const label = niche.includes('SaaS') ? "project" : "venture";
            opener = `That ${niche} ${label} sounds like it has serious potential.`;
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

        // 3. Academic/Emotional Venting & Life Crisis Guard (Phase 32 Hardening)
        const ventingSignals = [
            'phd', 'harvard', 'admissions', 'rejections', 'venting', 'university', 'professor',
            'medicine', 'doctor', 'medical school', 'graduate entry', 'husband', 'children',
            'family', 'dream', 'fulfil', 'nhs', 'pharmacy', 'radiography', 'physicians associate',
            'career advice', 'life advice', 'not realistic', 'settled', 'disturb my family'
        ];
        if (ventingSignals.some(signal => textLower.includes(signal))) return true;

        // 4. Personal Narrative Guard (Long posts with "I" and "My")
        const iCount = (textLower.match(/\b(i|my|we|husband)\b/g) || []).length;
        if (textLower.length > 500 && iCount > 15) return true; // Likely a personal story, not a business pitch

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
        // Force production domain for outreach
        const SITE_URL = 'https://marketvibe1.com';

        // 🛡️ HUMANIZED REDDIT STRATEGY: No direct link in 50% of posts to build trust/karma
        const roll = Math.random();

        if (roll < 0.5) {
            // "Value First" - No Link
            const valueTemplates = [
                `hey @${lead.username}, ${intent.opener} i actually pulled some growth data for the ${niche} space recently. looks like a solid six-figure play if you focus on ${report.targetAudience.primarySegment}. would you be interested in the full revenue forecast breakdown?`,
                `hi @${lead.username}, ${intent.opener} the ${niche} trends are looking pretty bullish right now tbh. i mapped out a quick 30-day execution plan for a similar concept - lmk if you want me to send it over.`,
                `tagging @${lead.username} because i love this idea. ${intent.opener} i'm seeing some interesting signals in the ${niche} market that most people miss. i have the TAM numbers if you want to see them?`,
                `saw your post @${lead.username}. if you're navigating the ${niche} market, i've got a free toolkit for mapping out market limits. happy to share the link if it helps with your research.`
            ];
            return valueTemplates[Math.floor(Math.random() * valueTemplates.length)];
        } else {
            // "Soft CTA" - Link included but wrapped in context
            const softTemplates = [
                `hey @${lead.username}, ${intent.opener} i was looking at ${niche} data earlier and the potential for ${report.targetAudience.primarySegment} is huge. i put the full revenue analysis in this research hub if you're interested: ${SITE_URL}/hub`,
                `hi @${lead.username}, ${intent.opener} tracking ${niche} breakout momentum right now. saw some live signals that might give you an edge on the ads/outreach: ${SITE_URL}/newsroom`,
                `really solid play @${lead.username}. ${intent.opener} i actually built a free research tool for ${niche} founders to avoid the validation grind. you can run your niche through it here: ${SITE_URL}`
            ];
            return softTemplates[Math.floor(Math.random() * softTemplates.length)];
        }
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
            'customer', 'revenue', 'launch', 'market', 'competitor', 'business model'
        ];
        highIntent.forEach(word => {
            if (textLower.includes(word)) score += 1;
        });

        // 2b. HIGH TICKET SIGNALS (+3) - The "Money" keywords
        const moneyWords = ['budget', 'hiring', 'investing', 'pricing', 'pay for', 'willing to pay', 'cost'];
        if (moneyWords.some(w => textLower.includes(w))) {
            score += 3; // These people have wallets open
        }

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
        const hashMatches = text.match(/#\s+\d+\./g); // Matches "# 1." style headers
        if ((listMatches && listMatches.length >= 2) || (hashMatches && hashMatches.length >= 2)) {
            score -= 6;
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
        const SITE_URL = 'https://marketvibe1.com';

        const twitterTemplates = [
            `hey @${lead.username}, ${intent.opener} just saw some data for ${niche} and it looks like solid six-figure potential for ${report.targetAudience.primarySegment} tbh. data breakdown here: ${SITE_URL}`,
            `@${lead.username} love the ${niche} play. i'm seeing huge yearly potential for ${report.targetAudience.primarySegment} right now imo. mapped it out here: ${SITE_URL}`,
            `hey @${lead.username}, i noticed you're building in ${niche}. if you're looking for a name, i built an AI generator that just dropped some cool ones for this niche: ${SITE_URL}/tools/naming`,
            `@${lead.username} if you're still mapping out the ${niche} market, i built a free TAM calculator that might save you some time: ${SITE_URL}/tools/market-size`,
            `really interesting play @${lead.username}. tracking breakout momentum in the ${niche} space right now. check this out: ${SITE_URL}/newsroom`
        ];

        // Contextual Tool Injection (Twitter) 🛠️
        if (lead.post_content.match(/name|naming|brand/i)) {
            twitterTemplates.push(`@${lead.username} naming is tough. i built a free AI generator for ${niche} ventures if you want to try it: ${SITE_URL}/tools/naming`);
        }
        if (lead.post_content.match(/market size|tam|investor|pitch/i)) {
            twitterTemplates.push(`@${lead.username} if you're pitching this, i built a free TAM calculator that maps out the ${niche} market: ${SITE_URL}/tools/market-size`);
        }
        if (lead.post_content.match(/trend|demand|growing|popular/i)) {
            twitterTemplates.push(`@${lead.username} tracking breakout momentum in ${niche} right now. check out these live signals: ${SITE_URL}/newsroom`);
        }

        return twitterTemplates[Math.floor(Math.random() * twitterTemplates.length)];
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
        // Normal continuous mode (Loop every 10 minutes)
        console.log("🔄 Starting Continuous Sentinel Mode (10m Interval)...");
        sentinel.runCycle(); // Run immediately first
        setInterval(() => {
            sentinel.runCycle();
        }, 10 * 60 * 1000);
    }
}
