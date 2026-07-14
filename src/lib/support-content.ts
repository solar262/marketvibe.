export type SupportAnswer = {
  question: string;
  answer: string;
  tags: string[];
  href?: string;
};

export const supportAnswers: SupportAnswer[] = [
  {
    question: "What does MarketVibe1 do?",
    answer: "MarketVibe1 turns public/source-backed business signals into scored opportunities, proof packs, dashboards, and CSV exports for outreach planning. It is research and prioritization software, not a promise of clients or revenue.",
    tags: ["what", "marketvibe", "does", "product"],
    href: "/pricing",
  },
  {
    question: "What does MarketVibe1 not do?",
    answer: "MarketVibe1 does not guarantee replies, sales, customers, rankings, revenue, or funding. It does not authorize spam, misleading outreach, credential collection, or unsupported claims.",
    tags: ["guarantee", "not", "spam", "linkedin", "scraping"],
    href: "/acceptable-use",
  },
  {
    question: "What is a buyer-intent signal?",
    answer: "A buyer-intent signal is context suggesting a practical reason to review an opportunity. MarketVibe presents that context so you can decide whether outreach is worth your time.",
    tags: ["intent", "signal", "score", "buyer"],
    href: "/pricing",
  },
  {
    question: "Where do opportunities come from?",
    answer: "Opportunities come from visible business information and reviewed market context. MarketVibe is designed to support research, not replace your final judgment.",
    tags: ["source", "opportunities", "csv", "proof"],
    href: "/privacy",
  },
  {
    question: "How does intent scoring work?",
    answer: "MarketVibe prioritizes opportunities using relevance, urgency, clarity, and confidence. Scores are decision support, not a guarantee that a company will buy.",
    tags: ["score", "fit", "intent", "evidence"],
    href: "/pricing",
  },
  {
    question: "Can there be duplicates or stale records?",
    answer: "Yes. MarketVibe deduplicates known imports and delivery rows where possible, but public data changes and duplicate companies can still appear. Review source context before outreach.",
    tags: ["duplicate", "fresh", "stale"],
  },
  {
    question: "How should I use MarketVibe outputs responsibly?",
    answer: "Use outputs for research and prioritization. Review sources, avoid misleading claims, identify yourself clearly, follow local marketing/privacy rules, and honor opt-out or removal requests.",
    tags: ["outreach", "responsible", "gdpr", "privacy"],
    href: "/acceptable-use",
  },
  {
    question: "What is included in Proof Pack?",
    answer: "Proof Pack is a one-off niche test. You provide your market, territory, offer, and ideal buyer, then MarketVibe prepares a focused shortlist with context, source links where available, and outreach angles so you can judge whether the signal is useful before subscribing.",
    tags: ["proof", "pack", "delivery", "99"],
    href: "/sample",
  },
  {
    question: "How do Radar and Growth Desk differ?",
    answer: "Radar is recurring dashboard access for ongoing opportunity review. Growth Desk is managed monthly delivery with more operator involvement, delivery preferences, reporting preferences, and priority support.",
    tags: ["radar", "growth", "plans", "pricing"],
    href: "/pricing",
  },
  {
    question: "How do invoices, billing, and cancellation work?",
    answer: "Card payments, invoices, payment-method updates, and subscription cancellation are handled through Stripe Checkout and the Stripe Customer Portal. Use the secure dashboard billing button or contact support if the portal is unavailable.",
    tags: ["billing", "invoice", "cancel", "portal", "subscription"],
    href: "/billing-help",
  },
  {
    question: "What happens after a failed payment?",
    answer: "If a subscription payment fails, access may become unavailable until the payment method is updated through Stripe Customer Portal.",
    tags: ["failed", "payment", "past_due", "card"],
    href: "/billing-help",
  },
  {
    question: "Where is my access email?",
    answer: "Check the billing email used at checkout, spam/promotions folders, and any company mail filters. If it is missing, use the contact form with your billing email and order context.",
    tags: ["missing", "email", "access", "login"],
    href: "/contact?offer=access-help",
  },
  {
    question: "How do exports work?",
    answer: "Exports are available only from authorized dashboard or delivery links and are limited to the customer account that purchased access.",
    tags: ["csv", "export", "download"],
    href: "/dashboard",
  },
  {
    question: "How do data correction or removal requests work?",
    answer: "Use the data request page with the affected email, company, URL, and requested action. Operator review is required; automated support cannot make legal conclusions.",
    tags: ["data", "correction", "removal", "gdpr"],
    href: "/data-requests",
  },
  {
    question: "What support response should I expect?",
    answer: "MarketVibe is operated as a lean one-person business. Routine requests are reviewed by email; urgent billing/access issues should include the billing email, product, and Stripe receipt context.",
    tags: ["support", "response", "help"],
    href: "/contact",
  },
];

export function findSupportAnswer(query: string) {
  const normalized = query.toLowerCase();
  if (!normalized.trim()) return null;
  const scored = supportAnswers
    .map((item) => ({
      item,
      score: item.tags.reduce((sum, tag) => sum + (normalized.includes(tag) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score);
  return scored[0]?.score ? scored[0].item : null;
}
