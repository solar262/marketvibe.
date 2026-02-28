import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function generateBlogContent(lead) {
    const niche = lead.niche || 'Emerging Tech';
    const report = lead.teaser_report || {};

    const title = `Why ${niche} is the Next $100M Opportunity in 2026`;
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const slug = `${niche.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.floor(Math.random() * 1000)}`;

    const content = `
# The Hidden Gold Rush in ${niche}

Scaling a business in 2026 isn't about working harder—it's about finding the right market gap before the noise takes over. Our autonomous discovery engine just flagged a high-signal opportunity in the **${niche}** space.

## Why This Market?
Based on the latest signals from active communities, builders are struggling with specific pain points in ${niche}. We've identified a significant "Signal-to-Noise" gap that early-movers can exploit.

[**Unlock the Full ${niche} Data Pack**](trigger_email_capture)

## Market Dynamics
- **High Intent:** Founders are actively seeking solutions for this exact problem.
- **Low Competition:** Most existing solutions are outdated or too generic.
- **Monetization Potential:** There is a proven willingness to pay for specialized tools in this niche.

## The Verdict
The data suggests that ${niche} is currently in a "Breakout" phase. Momentum is building, but the market isn't saturated yet.

[**Validate Your ${niche} Idea Now**](/validate/${slug})

## Key Takeaways
1. **Focus on Niche Pain:** Don't build a general tool. Solve a specific problem for high-intent users.
2. **Speed to Market:** The window for $100M opportunities is shrinking. Validation is key.
3. **Data-Driven Growth:** Use live signals to pivot your product-market fit in real-time.

---
*Authored by MarketVibe AI Intelligence Unit*
`;

    return {
        title,
        slug,
        niche,
        content,
        date,
        author: 'MarketVibe AI'
    };
}

async function runBlogCycle() {
    console.log("✍️ Blog Engine: Scanning for pending content requests...");
    try {
        const { data: leads, error } = await supabase
            .from('growth_leads')
            .select('*')
            .eq('status', 'generating_blog')
            .limit(5);

        if (error) throw error;

        if (!leads || leads.length === 0) {
            console.log("✅ No pending blog requests.");
            return;
        }

        for (const lead of leads) {
            console.log(`📝 Generating blog for niche: ${lead.niche}...`);
            const post = await generateBlogContent(lead);

            // 1. Try to save to Supabase (Optional)
            try {
                await supabase.from('blog_posts').insert(post);
                console.log(`✅ Saved post to Database: ${post.slug}`);
            } catch (e) {
                console.warn(`⚠️ Database save failed (Table might not exist): ${e.message}`);
            }

            // 2. Save to Filesystem (Eager loading for BlogIndex)
            const blogDir = path.join(__dirname, 'src', 'content', 'blog');
            if (!fs.existsSync(blogDir)) {
                fs.mkdirSync(blogDir, { recursive: true });
            }
            const filePath = path.join(blogDir, `${post.slug}.json`);
            fs.writeFileSync(filePath, JSON.stringify(post, null, 2));
            console.log(`📂 Saved post to Filesystem: ${filePath}`);

            // 3. Update lead status
            await supabase
                .from('growth_leads')
                .update({ status: 'blogged' })
                .eq('id', lead.id);

            console.log(`🚀 Blog for ${lead.username} is LIVE.`);
        }
    } catch (err) {
        console.error("❌ Blog Engine Error:", err.message);
    }
}

// Run frequently for "One Click" feel
setInterval(runBlogCycle, 10000); // Every 10 seconds
runBlogCycle();
