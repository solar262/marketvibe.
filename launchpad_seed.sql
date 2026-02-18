-- Seed Data for MarketVibe Launchpad
-- Run this in Supabase SQL Editor to populate the directory

INSERT INTO launchpad_listings (name, tagline, description, niche, url, founder_email, founder_name, tier, upvotes, revenue_potential, status)
VALUES
    ('ContentFlow AI', 'Automate your LinkedIn and Twitter growth with one click.', 'An AI-powered social media manager that learns your voice and schedules high-engagement posts automatically.', 'AI', 'https://contentflow.ai', 'demo@marketvibe1.com', 'Alex Rivera', 'featured', 42, '$120k/yr', 'approved'),
    
    ('InvoiceSnap', 'Get paid faster with smart recurring invoices for freelancers.', 'Simple, beautiful invoicing for creative professionals. focused on recurring retainers and automated follow-ups.', 'FinTech', 'https://invoicesnap.io', 'demo@marketvibe1.com', 'Sarah Chen', 'validated', 38, '$85k/yr', 'approved'),
    
    ('DevHealth Monitor', 'Real-time burnout monitoring for engineering teams.', 'Integrates with GitHub and Slack to detect early signs of developer burnout based on commit patterns and communication sentiment.', 'Developer Tools', 'https://devhealth.io', 'demo@marketvibe1.com', 'Mike Ross', 'featured', 31, '$250k/yr', 'approved'),
    
    ('NicheHunt', 'Find profitable micro-SaaS ideas in seconds.', 'A database of 5,000+ under-served niches with low competition and high search volume.', 'SaaS', 'https://nichehunt.com', 'demo@marketvibe1.com', 'Jessica Wu', 'free', 14, '$60k/yr', 'approved'),
    
    ('CourseBuilder', 'Turn your notion notes into a profitable course.', 'The fastest way to launch a cohort-based course directly from your existing Notion documents.', 'Education', 'https://coursebuilder.so', 'demo@marketvibe1.com', 'David Kim', 'free', 22, '$150k/yr', 'approved'),

    ('FitTrack Pro', 'Personal training software for remote coaches.', 'Manage clients, workouts, and nutrition plans all in one place. Built specifically for online fitness coaches.', 'Health', 'https://fittrack.pro', 'demo@marketvibe1.com', 'Emily Stone', 'validated', 27, '$90k/yr', 'approved'),

    ('AdScale', 'Automate your Facebook Ads with generative AI.', 'Create high-converting ad creatives and copy in seconds using our fine-tuned marketing models.', 'Marketing', 'https://adscale.io', 'demo@marketvibe1.com', 'Chris Paul', 'featured', 56, '$400k/yr', 'approved'),

    ('LegalEase', 'Contract templates for modern agencies.', 'Vetted legal contracts for digital agencies and freelancers. eSign integration included.', 'SaaS', 'https://legalease.com', 'demo@marketvibe1.com', 'Amanda Lee', 'free', 9, '$45k/yr', 'approved'),

    ('PetConnect', 'Tinder for adopting rescue pets near you.', 'Swipe right to find your perfect furry friend. Partners with 500+ local shelters.', 'Health', 'https://petconnect.app', 'demo@marketvibe1.com', 'Tom Baker', 'free', 18, 'Non-profit', 'approved'),
    
    ('CryptoTax Solver', 'Calculate your DeFi taxes in minutes.', 'Connects to your wallet and automatically generates tax reports for complicated DeFi transactions.', 'FinTech', 'https://cryptotax.io', 'demo@marketvibe1.com', 'Ryan Gokul', 'validated', 65, '$300k/yr', 'approved'),

    ('EduGamify', 'Gamification plugin for LMS platforms.', 'Add badges, leaderboards, and rewards to any Learning Management System to boost student engagement.', 'Education', 'https://edugamify.com', 'demo@marketvibe1.com', 'Sophie Turner', 'free', 12, '$75k/yr', 'approved'),

    ('ShopifySEO', 'One-click SEO optimization for e-commerce stores.', 'Fix broken links, optimize meta tags, and speed up image loading automatically.', 'E-commerce', 'https://shopifyseo.app', 'demo@marketvibe1.com', 'Kevin Hart', 'featured', 29, '$180k/yr', 'approved'),

    ('RemoteRetreats', 'Curated offsites for distributed teams.', 'We handle logistics, booking, and activities for company retreats. You just show up.', 'SaaS', 'https://remoteretreats.com', 'demo@marketvibe1.com', 'Laura Jin', 'free', 25, '$500k/yr', 'approved'),

    ('CodeReview AI', 'Instant code reviews before you merge.', 'Catch bugs, security vulnerabilities, and style issues automatically in your PRs.', 'Developer Tools', 'https://codereview.ai', 'demo@marketvibe1.com', 'Sam Altman (Parody)', 'validated', 89, '$1M/yr', 'approved'),

    ('WellnessBot', 'Slack bot for team mental health.', 'Daily check-ins, guided breathing exercises, and mood tracking for remote teams.', 'Health', 'https://wellnessbot.io', 'demo@marketvibe1.com', 'Nina Patel', 'free', 15, '$55k/yr', 'approved');
