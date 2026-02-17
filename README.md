
# MarketVibe 🚀
**The Autonomous Growth Engine for SaaS Founders.**

MarketVibe is not just a landing page. It is a self-driving business system that validates ideas, generates leads, writes its own content, and closes sales.

## 🌟 Core Systems

### 1. The Trend Engine (`/newsroom`)
- **What it does**: Scrapes Reddit/Twitter for breakout niches.
- **How to run**: `node trend_agent.mjs`
- **Output**: Populates the "Newsroom" with top 10 trends and "Launch This" buttons.

### 2. The Sales Bot (`/admin`)
- **What it does**: Identifies high-ticket leads and queues sales DMs.
- **How to run**: `node outreach_agent.mjs` (Findings) -> `node closer_autopilot.mjs` (DM Queuing).
- **Manual Override**: Go to `/admin` and click "Send Script (DM)" to auto-copy the perfect message.

### 3. The Content Machine (`/blog`)
- **What it does**: Writes SEO-optimized articles based on trending niches.
- **How to run**: `node blog_agent.mjs`
- **Output**: Generates JSON content in `src/content/blog` which hot-reloads the `/blog` page.

### 4. The Viral Loop (`/viral`)
- **What it does**: Incentivizes users to refer 3 friends to unlock the "Expert Report".
- **Logic**: Users get a unique `?ref=CODE` link. 3 signups = Free Upgrade.

---

## 🛠️ Technical Stack
- **Frontend**: React 19 + Vite
- **Backend Logic**: Node.js Scripts (`.mjs`)
- **Database**: Supabase (Leads, Referrals, Trends)
- **Deployment**: Vercel

## 🚀 Quick Start (Operator's Guide)

### Install Dependencies
```bash
npm install
```

### Run the Development Server
```bash
npm run dev
```

### Run the Autonomous Agents (Cron Jobs)
To keep the data fresh, you should set up these scripts to run daily (e.g., via GitHub Actions or a local scheduler):
```bash
# 1. Update Trends
node trend_agent.mjs

# 2. Find New Leads
node outreach_agent.mjs

# 3. Write New Content
node blog_agent.mjs
```

### Deploy to Production
```bash
npx vercel --prod
```

## 🔐 Admin Access
Access the "God Mode" dashboard at: `https://www.marketvibe1.com/admin` (or `http://localhost:5173/admin`).
*Note: Ensure your IP is whitelisted or add auth if deploying publicly.*

---
*Built by Antigravity & You.*
