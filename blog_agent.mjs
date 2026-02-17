
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Replicate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const TRENDS_CACHE = path.join(__dirname, 'src', 'lib', 'trends_cache.json');
const BLOG_DIR = path.join(__dirname, 'src', 'content', 'blog');

// Templates
const generateArticle = (trend) => {
    const title = `Why ${trend.niche} is the Next Big Thing in 2026`;
    const slug = trend.niche.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const date = new Date().toISOString().split('T')[0];

    const body = `
# The Rise of ${trend.niche}

The data doesn't lie. In the last 7 days alone, we've detected **${trend.velocity} new signals** indicating that ${trend.niche} is heating up.

## Why Now?
Founders are flocking to this space because the market gap is undeniable. Users are asking for solutions, but the current incumbents are either too expensive or too complex.

## The Opportunity
With a "Heat Score" of **${trend.heatScore}**, ${trend.niche} represents a perfect storm for bootstrapped founders. You don't need VC money to win here; you just need to move fast.

## specific Signals
We are seeing high intent around:
- **Budget**: Users are willing to pay.
- **Urgency**: "How do I..." queries are spiking.
- **Vacancy**: Few established competitors.

## Conclusion
If you've been waiting for a sign, this is it. The ${trend.niche} wave is just starting. Don't let it pass you by.

[**Validate Your ${trend.niche} Idea Now →**](/validate/${slug})
    `;

    return {
        id: slug,
        title,
        slug,
        date,
        author: "MarketVibe AI",
        niche: trend.niche,
        velocity: trend.velocity,
        content: body.trim()
    };
};

async function runBlogAgent() {
    console.log("✍️ Blog Agent: Reading trends...");

    if (!fs.existsSync(TRENDS_CACHE)) {
        console.error("❌ No trends cache found. Run trend_agent.mjs first.");
        return;
    }

    const trends = JSON.parse(fs.readFileSync(TRENDS_CACHE, 'utf-8'));
    const topTrends = trends.slice(0, 5); // Take top 5

    console.log(`📝 Generating articles for top ${topTrends.length} trends...`);

    if (!fs.existsSync(BLOG_DIR)) {
        fs.mkdirSync(BLOG_DIR, { recursive: true });
    }

    topTrends.forEach(trend => {
        const article = generateArticle(trend);
        const filePath = path.join(BLOG_DIR, `${article.slug}.json`);
        fs.writeFileSync(filePath, JSON.stringify(article, null, 2));
        console.log(`✅ Wrote: ${article.title}`);
    });

    console.log("\n🚀 Content generation complete.");
}

runBlogAgent();
