export const generateValidationReport = (projectData) => {
    const { name, description, audience, niche } = projectData;
    const projectName = name?.trim() || "MarketVibe";
    const projectDescription = description?.trim() || "your business idea";
    const projectAudience = audience?.trim() || "your target users";
    const projectNiche = niche?.trim() || "General Business";

    // 1. Generate Landing Page Copy
    const landingPage = {
        headline: `Transform how you handle ${projectDescription.split(' ').slice(0, 4).join(' ')} with ${projectName}`,
        subheadline: `The ultimate solution built specifically for ${projectAudience}. Validate your potential and scale faster.`,
        features: [
            {
                title: "Automated Workflow",
                detail: `Stop wasting time on manual processes. ${projectName} automates your core tasks so you can focus on growth.`
            },
            {
                title: "Data-Driven Insights",
                detail: `Get real-time feedback from ${projectAudience} and make informed decisions based on actual interest.`
            },
            {
                title: "Seamless Integration",
                detail: `Works perfectly with your existing tools. No complex setup required to start validating your idea.`
            }
        ],
        cta: `Get Early Access to ${projectName}`,
        socialProof: `Join 100+ ${projectAudience} already on the waitlist.`
    };

    // 2. Generate Revenue Forecast
    // 2. Generate Revenue Forecast (Variance Engine)
    const getMarketWeights = (projectName, content) => {
        const text = (projectName + " " + content).toLowerCase();
        if (text.includes('ai') || text.includes('saas') || text.includes('software')) return { size: 100000, price: 79 };
        if (text.includes('pet') || text.includes('dog')) return { size: 25000, price: 39 };
        if (text.includes('coffee') || text.includes('food')) return { size: 40000, price: 29 };
        if (text.includes('real estate') || text.includes('property')) return { size: 15000, price: 199 };
        if (text.includes('marketing') || text.includes('agency')) return { size: 30000, price: 99 };
        return { size: 50000, price: 49 }; // Default
    };

    const weights = getMarketWeights(projectName, projectDescription);
    const chaosFactor = 0.85 + (Math.random() * 0.3); // +/- 15% variance

    const estimatedMarketSize = Math.round(weights.size * chaosFactor);
    const basePrice = Math.round(weights.price * (0.9 + Math.random() * 0.2));
    const realisticCaptureRate = 0.005 + (Math.random() * 0.01); // 0.5% to 1.5%

    const monthlyRevenue = Math.round(estimatedMarketSize * realisticCaptureRate * basePrice);
    const annualRevenue = monthlyRevenue * 12;

    const revenueForecast = {
        totalAddressableMarket: estimatedMarketSize.toLocaleString(),
        marketSize: estimatedMarketSize.toLocaleString(), // Alias for backward compatibility
        estimatedAnnualRevenue: annualRevenue.toLocaleString(),
        pricingTiers: [
            { name: "Starter", price: `$${basePrice}`, features: ["Basic Analytics", "1 Project", "Email Support"] },
            { name: "Pro", price: `$${Math.round(basePrice * 2.5)}`, features: ["Advanced Analytics", "Unlimited Projects", "Priority Support"] },
            { name: "Enterprise", price: "Custom", features: ["SLA", "Dedicated Manager", "On-premise option"] }
        ]
    };

    // 3. THE VALUE UPGRADE: 30-Day Execution Playbook
    const executionPlan = [
        {
            week: "Week 1: Foundation & Visibility",
            tasks: [
                { day: "Day 1-2", task: `Setup a landing page using the "MarketVibe" generated copy for ${projectName}.` },
                { day: "Day 3", task: `Identify 5 subreddits where ${projectAudience} hang out.` },
                { day: "Day 4-5", task: `Post "Value-First" content in those communities without a link to build authority.` },
                { day: "Day 7", task: `Secure first 5 waitlist signups via direct manual outreach.` }
            ]
        },
        {
            week: "Week 2: The Outreach Blitz",
            tasks: [
                { day: "Day 8-10", task: `Send 20 personalized cold emails per day using the scripts in your Founder Assets.` },
                { day: "Day 11", task: `Launch a "Waitlist Leaderboard" to encourage viral sharing among signups.` },
                { day: "Day 14", task: `Review feedback from the first 50 signups to refine your MVP features.` }
            ]
        },
        {
            week: "Week 3: Traction & Validation",
            tasks: [
                { day: "Day 15-18", task: `Offer a "Founder's Lifetime Deal" to your most engaged waitlist members.` },
                { day: "Day 21", task: `Aim for $500 in "Pre-Sales" to mathematically prove Willingness to Pay.` }
            ]
        },
        {
            week: "Week 4: Scaling to V1",
            tasks: [
                { day: "Day 22-25", task: `Build the core "Minimum Viable Product" based ONLY on the pre-sale feedback.` },
                { day: "Day 30", task: `Official Beta Launch to your waitlist. Transition to monthly recurring revenue.` }
            ]
        }
    ];

    // 4. THE VALUE UPGRADE: Founder Assets (Outreach Scripts)
    const founderAssets = {
        outreachEmail: {
            subject: `Quick question about your ${projectDescription.split(' ').slice(0, 2).join(' ')} workflow`,
            body: `Hi [Name],\n\nI noticed you're working on ${projectDescription}. I'm building ${projectName} to specifically help ${projectAudience} automate [Pain Point].\n\nWould you be open to a 2-minute chat? I'd love to give you free early access in exchange for your honest feedback.\n\nBest,\n[Your Name]`
        },
        socialTemplate: {
            reddit: `I was tired of [Pain Point] when dealing with ${projectDescription}, so I'm building a tool specifically for ${projectAudience}. It's called ${projectName}. Just curious—have any of you solved this already?`,
            twitter: `Building ${projectName} in public to help ${projectAudience} finally master ${projectDescription.split(' ').slice(0, 3).join(' ')} 🚀\n\nWho wants free early access? DM me.`
        }
    };

    // 5. THE VALUE UPGRADE: Expert Intelligence (Premium)
    const competitorIntelligence = [
        { name: "Direct Rival A", strength: "High Brand Recall", weakness: "Poor Mobile UI", strategy: `Undercut on ${projectNiche} specialty.` },
        { name: "Indirect Rival B", strength: "Broad Ecosystem", weakness: "Complex Pricing", strategy: `Focus on ${projectAudience} simplicity.` },
        { name: "Niche Player C", strength: "Deep Automation", weakness: "High Barrier to Entry", strategy: "Offer a free tier for fast validation." }
    ];

    const expertAdCopy = {
        facebook: {
            headline: `Tired of ${projectDescription.split(' ').slice(0, 3).join(' ')}?`,
            body: `Discover ${projectName}, the #1 solution for ${projectAudience}. Stop guessing and start scaling with a data-driven 30-day roadmap. Limitied lifetime deals available.`,
            cta: "Get Early Access"
        },
        google: {
            headline: `${projectName} - The Best ${projectNiche} Tool`,
            description: `Built for ${projectAudience}. Get your 30-day validation playbook and revenue forecast in 60 seconds. Start today!`
        }
    };

    // 6. Semantic Awareness (The "Physical vs Digital" split)
    const isPhysical = projectNiche.includes('Stationery') || projectNiche.includes('Hobby') || projectNiche.includes('Tool') || projectNiche.includes('Retail');

    return {
        projectName,
        landingPage: {
            ...landingPage,
            subheadline: isPhysical
                ? `Get the perfect ${projectName} for your needs. Built for true enthusiasts and ${projectAudience}.`
                : landingPage.subheadline
        },
        revenueForecast,
        executionPlan: executionPlan.map(week => ({
            ...week,
            tasks: week.tasks.map(t => ({
                ...t,
                task: isPhysical ? t.task.replace('SaaS', 'Product').replace('signups', 'pre-orders') : t.task
            }))
        })),
        founderAssets,
        competitorIntelligence,
        expertAdCopy,
        targetAudience: {
            primarySegment: projectAudience,
            painPoints: isPhysical
                ? ["High shipping costs", "Low quality alternatives", "Niche unavailability"]
                : ["Manual overhead", "Slow validation", "Lack of niche-specific tools"],
            valueProp: isPhysical
                ? `Premium physical products for ${projectDescription}`
                : `Automated validation and scaling for ${projectDescription}`
        },
        timestamp: new Date().toISOString()
    };
};
