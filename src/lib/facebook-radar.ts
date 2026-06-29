export type FacebookRadarAction = "ManualOnly" | "Skip";
export type FacebookRadarScore = "High" | "Medium" | "Low";
export type FacebookRadarRisk = "Low" | "Medium" | "High";

export type FacebookRadarInput = {
  postText: string;
  targetBuyer: string;
  painKeywords: string;
  sourceUrl: string;
};

export type FacebookRadarResult = {
  action: FacebookRadarAction;
  score: FacebookRadarScore;
  risk: FacebookRadarRisk;
  intent: string;
  reason: string;
  quickReply: string;
  deeperReply: string;
  manualNote: string;
  searchUrl: string;
};

export type FacebookRadarSearchInput = {
  targetBuyer: string;
  niche: string;
  painKeywords: string;
};

export type FacebookRadarSearchLink = {
  phrase: string;
  reason: string;
  fitScore: number;
  goodSignals: string[];
  skipSignals: string[];
  postsUrl: string;
  groupsUrl: string;
};

const BUYER_PATTERN = /\b(web designer|web designers|seo freelancer|seo freelancers|seo consultant|seo agency|local marketer|digital marketer|lead generation freelancer|lead gen|small agency|agency|freelancer|sell websites|selling websites|website redesign|local business services|automation service|client acquisition)\b/i;
const PAIN_PATTERN = /\b(need clients|how do i get clients|get clients|looking for leads|find local businesses|get seo clients|local lead generation|cold outreach not working|outreach not working|no one replies|no replies|prospecting help|businesses without websites|how do i prospect|agency clients|lead generation|outreach|prospecting|local business prospects|website clients|seo clients|where do i find customers|no traffic|no sales|no leads|not converting|bookings|appointments|don't know how to market|dont know how to market)\b/i;
const BAD_PATTERN = /\b(hiring|looking for web developer|need a web developer|web developer needed|pay per website|\$50 per website|remote developer|salary|full-time|part-time|job opening|job post|vacancy|apply now|course launch|buy my|dm me for|limited offer|promo code|giveaway|i built this|we provide leads|guaranteed clients|guaranteed leads|buy leads|sell leads|cheap website)\b/i;
const PRIVATE_GROUP_PATTERN = /\b(private group|members only|screenshot from a private group|do not share|confidential)\b/i;
const SEARCH_SKIP_SIGNALS = ["hiring", "jobs", "cheap web developer", "pay per website", "people selling leads", "spam offers", "DM me", "guaranteed clients"];
const SEARCH_GOOD_SIGNALS = ["questions", "advice requests", "business owner pain", "no sales/no leads/no traffic", "outreach failure", "marketing confusion"];

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 1400);
}

function hasAny(text: string, pattern: RegExp) {
  return pattern.test(text);
}

function buildFacebookSearchUrl(targetBuyer: string, painKeywords: string) {
  const query = cleanText([targetBuyer, painKeywords].filter(Boolean).join(" "));
  return query ? `https://www.facebook.com/search/posts/?q=${encodeURIComponent(query)}` : "https://www.facebook.com/search/posts/";
}

function facebookPostsUrl(query: string) {
  return `https://www.facebook.com/search/posts/?q=${encodeURIComponent(query)}`;
}

function facebookGroupsUrl(query: string) {
  return `https://www.facebook.com/search/groups/?q=${encodeURIComponent(query)}`;
}

function splitTerms(value: string) {
  return value
    .split(/[,;\n]/)
    .map((item) => cleanText(item).toLowerCase())
    .filter(Boolean);
}

function nicheVariants(value: string) {
  const text = value.toLowerCase();
  const variants = new Set<string>();
  const add = (item: string) => variants.add(item);

  if (/\b(web design|website|web designer|redesign)\b/.test(text)) {
    ["web design", "website design", "website redesign", "web designer"].forEach(add);
  }
  if (/\bseo|search engine|rankings?\b/.test(text)) {
    ["SEO freelancer", "SEO clients", "local SEO"].forEach(add);
  }
  if (/\bshopify|ecommerce|online store|store\b/.test(text)) {
    ["Shopify", "ecommerce", "online store", "product page"].forEach(add);
  }
  if (/\bsneaker|sneakers|shoe|reseller|reselling\b/.test(text)) {
    ["sneaker reselling", "sneaker reseller", "selling sneakers", "reselling shoes"].forEach(add);
  }
  if (/\bbook|books|bookstore|author\b/.test(text)) {
    ["book selling", "book seller", "selling books online", "used books"].forEach(add);
  }
  if (/\broof|roofer|roofing\b/.test(text)) {
    ["roofing leads", "roof repair", "roofing quote", "roofer"].forEach(add);
  }
  if (/\blocal business|local businesses\b/.test(text)) {
    ["local businesses", "local business leads", "service business"].forEach(add);
  }
  if (/\bfreelancer|freelance\b/.test(text)) {
    ["freelancer", "freelance clients"].forEach(add);
  }
  if (/\bagency|agencies\b/.test(text)) {
    ["small agency", "agency clients", "agency lead generation"].forEach(add);
  }
  if (/\bsaas|founder|startup\b/.test(text)) {
    ["SaaS founders", "startup customers", "B2B leads"].forEach(add);
  }
  if (/\bcoach|coaches|consultant|consultants\b/.test(text)) {
    ["coaches", "consultants", "consulting clients"].forEach(add);
  }

  if (!variants.size && cleanText(value)) variants.add(cleanText(value).toLowerCase());
  return Array.from(variants).slice(0, 8);
}

function addQuotedNiche(phrase: string, niche: string) {
  return niche ? `"${phrase}" "${niche}"` : `"${phrase}"`;
}

function marketVibeSearchScore(phrase: string) {
  const text = phrase.toLowerCase();
  let score = 45;
  if (/\b(cold outreach not working|outreach not working|no one replies|prospecting is not working)\b/.test(text)) score += 45;
  if (/\b(how do i get clients|where do i find customers|how do i get leads|looking for a tool to find leads)\b/.test(text)) score += 38;
  if (/\b(no traffic|no sales|no leads|not converting|store not converting|website gets no traffic)\b/.test(text)) score += 45;
  if (/\b(launched my business|don't know how to market|dont know how to market|how do i market|need help getting customers)\b/.test(text)) score += 30;
  if (/\b(bookings|appointments|service business|small business|agency|web design|seo|shopify)\b/.test(text)) score += 8;
  if (/\b(need clients web design|web design clients|how do i sell websites|looking for leads small business)\b/.test(text)) score -= 35;
  if (BAD_PATTERN.test(text)) score -= 70;
  return Math.max(0, Math.min(100, score));
}

export function generateFacebookSearchLinks(input: FacebookRadarSearchInput): FacebookRadarSearchLink[] {
  const painTerms = splitTerms(input.painKeywords);
  const niches = nicheVariants([input.targetBuyer, input.niche, input.painKeywords].join(" "));
  const precisePains = [
    "cold outreach not working",
    "no one replies to my outreach",
    "prospecting is not working",
    "how do I get clients",
    "where do I find customers",
    "my website gets no traffic",
    "my business has no leads",
    "how do I get leads",
    "how do I market my small business",
    "launched my business don't know how to market",
    "need help getting customers",
    "looking for a tool to find leads",
    "outreach not working",
    "how do I get bookings",
    "how do I get appointments",
    "my Shopify store has no sales",
    "store not converting",
  ];
  const phrases = new Set<string>();
  const add = (phrase: string) => {
    const cleaned = cleanText(phrase).toLowerCase();
    if (cleaned && !BAD_PATTERN.test(cleaned)) phrases.add(cleaned);
  };

  if (/\bweb design|website|web designer\b/i.test(`${input.targetBuyer} ${input.niche}`)) {
    [
      addQuotedNiche("cold outreach not working", "web design"),
      addQuotedNiche("how do I get clients", "web design"),
      addQuotedNiche("no one replies to my outreach", "web designer"),
      addQuotedNiche("where do I find customers", "website design"),
    ].forEach(add);
  }
  if (/\bseo\b/i.test(`${input.targetBuyer} ${input.niche}`)) {
    [
      addQuotedNiche("how do I get clients", "SEO freelancer"),
      addQuotedNiche("cold outreach not working", "SEO agency"),
      addQuotedNiche("how do I get leads", "SEO"),
    ].forEach(add);
  }
  if (/\bsneaker|resell|shoe\b/i.test(`${input.targetBuyer} ${input.niche}`)) {
    [addQuotedNiche("no sales", "sneaker reselling"), addQuotedNiche("where do I find customers", "sneaker reseller"), addQuotedNiche("need help getting customers", "selling sneakers")].forEach(add);
  }
  if (/\bbook|bookstore|author\b/i.test(`${input.targetBuyer} ${input.niche}`)) {
    [addQuotedNiche("no sales", "book selling"), addQuotedNiche("where do I find customers", "book seller"), addQuotedNiche("need help getting customers", "selling books online")].forEach(add);
  }
  if (/\broof|roofer|roofing\b/i.test(`${input.targetBuyer} ${input.niche}`)) {
    [addQuotedNiche("how do I get leads", "roofing"), addQuotedNiche("my business has no leads", "roofer"), addQuotedNiche("how do I get bookings", "roofing")].forEach(add);
  }
  if (/\bagency|local marketing|small agency\b/i.test(`${input.targetBuyer} ${input.niche}`)) {
    [addQuotedNiche("cold outreach not working", "agency"), addQuotedNiche("how do I get clients", "local marketing"), addQuotedNiche("no one replies to my outreach", "small agency")].forEach(add);
  }

  for (const niche of niches) {
    for (const pain of [...painTerms, ...precisePains].slice(0, 14)) {
      if (/\bneed clients\b/i.test(pain) && !/\b(how do i|get|help|not working|no|where)\b/i.test(pain)) continue;
      add(addQuotedNiche(pain, niche));
    }
  }

  precisePains.slice(0, 10).forEach((pain) => add(`"${pain}"`));

  return Array.from(phrases)
    .map((phrase) => ({
      phrase,
      fitScore: marketVibeSearchScore(phrase),
    }))
    .filter((item) => item.fitScore >= 45)
    .sort((a, b) => b.fitScore - a.fitScore || a.phrase.localeCompare(b.phrase))
    .slice(0, 30)
    .map(({ phrase, fitScore }) => ({
      phrase,
      fitScore,
      goodSignals: SEARCH_GOOD_SIGNALS,
      skipSignals: SEARCH_SKIP_SIGNALS,
      reason: `MarketVibe fit ${fitScore}/100: best when results show lead, customer, traffic, conversion, or outreach pain.`,
      postsUrl: facebookPostsUrl(phrase),
      groupsUrl: facebookGroupsUrl(phrase),
    }));
}

function detectIntent(text: string) {
  if (/\b(cold outreach|no replies|outreach)\b/i.test(text)) return "outreach";
  if (/\b(seo clients|seo freelancer|seo services|rankings|local seo)\b/i.test(text)) return "seo-clients";
  if (/\b(web design|sell websites|website clients|website redesign|businesses without websites)\b/i.test(text)) return "web-design-clients";
  if (/\b(lead generation|local leads|agency clients|prospecting|local business prospects)\b/i.test(text)) return "lead-generation";
  if (/\b(automation|automations)\b/i.test(text)) return "automation-services";
  return "client-acquisition";
}

function scorePost(text: string, targetBuyer: string, painKeywords: string) {
  let score = 0;
  if (hasAny(text, BUYER_PATTERN)) score += 28;
  if (hasAny(text, PAIN_PATTERN)) score += 42;
  if (/\?/.test(text)) score += 8;
  if (/\b(help|advice|struggling|stuck|not working|where do i find|how do i)\b/i.test(text)) score += 10;
  if (/\b(cold outreach not working|outreach not working|no one replies|no replies to my outreach|prospecting is not working)\b/i.test(text)) score += 24;
  if (/\b(launched my business|don't know how to market|dont know how to market|how do i market my small business)\b/i.test(text)) score += 36;
  if (/\b(my website gets no traffic|website gets no traffic|my business has no leads|no leads|no sales|store not converting|shopify store has no sales)\b/i.test(text)) score += 30;
  if (/\b(looking for a tool to find leads|how do i get leads|how do i get clients|where do i find customers|need help getting customers)\b/i.test(text)) score += 26;
  if (targetBuyer && text.toLowerCase().includes(targetBuyer.toLowerCase().split(/\s+/)[0] || "")) score += 4;
  for (const keyword of painKeywords.toLowerCase().split(/[,;\n]/).map((item) => item.trim()).filter(Boolean)) {
    if (keyword.length > 2 && text.toLowerCase().includes(keyword)) score += 4;
  }
  if (BAD_PATTERN.test(text)) score -= 55;
  if (PRIVATE_GROUP_PATTERN.test(text)) score -= 35;
  return Math.max(0, Math.min(100, score));
}

function replyForIntent(intent: string) {
  if (intent === "outreach") {
    return {
      quickReply: "I'd tighten the reason for reaching out before changing platforms. Replies usually improve when the message points to one visible problem, not a broad service pitch.",
      deeperReply: "I'd start by narrowing the prospect list and the reason for outreach. Local businesses are easier to approach when you can point to one clear issue, like weak Google visibility, no clear CTA, an outdated website, or a missing service page. Then keep the first message short and about that specific problem.",
    };
  }

  if (intent === "seo-clients") {
    return {
      quickReply: "I'd look for businesses where the SEO gap is visible before pitching. Missing service pages, weak titles, thin local pages, or poor Google visibility give you a more natural reason to start a conversation.",
      deeperReply: "For SEO clients, I'd avoid starting with a generic audit pitch. Find a visible local search gap first: missing service pages, weak page titles, thin location content, poor Google visibility, or competitors clearly outranking them. Then lead with the specific thing you noticed.",
    };
  }

  if (intent === "web-design-clients") {
    return {
      quickReply: "I'd start with businesses where the website problem is obvious. Outdated design, unclear CTA, weak mobile layout, or missing trust signals makes the outreach feel less random.",
      deeperReply: "For web design, I'd build a list around visible problems instead of just business categories. Look for outdated sites, unclear CTAs, slow mobile pages, missing booking/contact paths, weak trust signals, or messy service pages. Then mention one problem in plain language rather than pitching a full redesign immediately.",
    };
  }

  if (intent === "lead-generation") {
    return {
      quickReply: "I'd separate the niche from the trigger. The best prospects are local businesses where you can see a reason they might need help, not just businesses in a list.",
      deeperReply: "I'd look for a clear trigger before outreach. For local lead gen, that might be weak Google visibility, poor website conversion, unclear contact paths, bad review signals, or a competitor looking much stronger. A visible problem gives you a better opener than just saying you generate leads.",
    };
  }

  return {
    quickReply: "I'd start by narrowing the offer before chasing more platforms. Local businesses are easier to prospect when you can spot one clear problem, like weak Google visibility, no clear CTA, or an outdated website.",
    deeperReply: "I'd focus on the specific prospecting trigger first. Pick one buyer type, then look for visible problems: outdated websites, unclear CTAs, missing service pages, weak Google visibility, poor trust signals, or no easy contact path. That gives you a useful reason to start a conversation without sounding like a pitch.",
  };
}

export function analyzeFacebookLead(input: FacebookRadarInput): FacebookRadarResult {
  const postText = cleanText(input.postText);
  const combined = cleanText([postText, input.targetBuyer, input.painKeywords].filter(Boolean).join(" "));
  const rawScore = postText ? scorePost(combined, input.targetBuyer, input.painKeywords) : 0;
  const blocked = !postText || BAD_PATTERN.test(postText);
  const privateRisk = PRIVATE_GROUP_PATTERN.test(postText);
  const action: FacebookRadarAction = blocked || rawScore < 35 ? "Skip" : "ManualOnly";
  const score: FacebookRadarScore = rawScore >= 75 ? "High" : rawScore >= 50 ? "Medium" : "Low";
  const risk: FacebookRadarRisk = blocked || privateRisk ? "High" : rawScore >= 70 ? "Low" : "Medium";
  const intent = detectIntent(combined);
  const replies = replyForIntent(intent);

  if (action === "Skip") {
    return {
      action,
      score,
      risk,
      intent: blocked ? "blocked-or-empty" : intent,
      reason: blocked ? "Skip: empty, job-like, promotional, or not suitable for manual engagement." : "Skip: not enough buyer pain or MarketVibe-fit intent.",
      quickReply: "SKIP THIS ONE.",
      deeperReply: "Not recommended",
      manualNote: "Do not post a normal reply. Look for posts where someone is asking for clients, leads, prospecting, web design, SEO, or local business outreach help.",
      searchUrl: input.sourceUrl || buildFacebookSearchUrl(input.targetBuyer, input.painKeywords),
    };
  }

  return {
    action,
    score,
    risk,
    intent,
    reason: `Detected ${intent.replace(/-/g, " ")} pain with a ${rawScore}/100 fit score. Manual engagement only.`,
    quickReply: replies.quickReply,
    deeperReply: replies.deeperReply,
    manualNote: privateRisk
      ? "Edit before posting. Do not copy content from private groups outside Facebook, and only reply manually where you are allowed to participate."
      : "Edit before posting. Be helpful first, avoid links, and let profile visits or later conversation do the selling.",
    searchUrl: input.sourceUrl || buildFacebookSearchUrl(input.targetBuyer, input.painKeywords),
  };
}
