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

export type FacebookRadarFilters = {
  recentOnly: boolean;
  postedWithin: "24h" | "72h" | "7d" | "30d";
  publicGroupsOnly: boolean;
  minimumMembers: number;
  minimumPostsPerDay: number;
  minimumEngagement: number;
  language: string;
  location: string;
  includeCategories: string[];
  excludeCategories: string[];
  excludeKeywords: string[];
};

export type FacebookLeadCandidate = {
  text: string;
  url?: string;
  groupName?: string;
  groupMembers?: number;
  groupPostsPerDay?: number;
  reactions?: number;
  comments?: number;
  language?: string;
  location?: string;
  isPublicGroup?: boolean;
  source?: string;
};

export type FacebookLeadPreview = {
  id: string;
  groupName: string;
  groupSizeActivity: string;
  snippet: string;
  authorType: string;
  intentScore: FacebookRadarScore;
  intentRank: number;
  painPoint: string;
  businessCategory: string;
  location: string;
  reason: string;
  duplicateWarning: string;
  passedFilters: boolean;
  skipReasons: string[];
  url: string;
  suggestedReply: string;
};

export type FacebookRadarSchedule = {
  id: string;
  name: string;
  cadence: "every 3h" | "every 6h" | "every 12h" | "daily";
  paused: boolean;
  queries: string[];
};

export const BUYER_INTENT_QUERY_LIBRARY = [
  "how do I get web design clients",
  "how do I get SEO clients",
  "where can I find local business leads",
  "how to sell websites to local businesses",
  "how to sell SEO to local businesses",
  "how to find clients for local marketing agency",
  "web designer struggling to get clients",
  "SEO freelancer struggling to get clients",
  "agency owner client acquisition",
  "cold outreach not working for agency",
  "no one replies to my outreach",
  "where do marketers find prospects",
  "how to find booking system clients",
  "how to sell booking systems to small businesses",
  "how to get social media management clients",
  "automation consultant how to find clients",
  "best niches for local lead generation",
  "how to prospect local businesses",
  "where to find businesses that need websites",
];

export const DEFAULT_FACEBOOK_EXCLUDE_KEYWORDS = [
  "job",
  "hire me",
  "looking for work",
  "crypto",
  "MLM",
  "affiliate",
  "dropshipping",
  "reseller",
  "spam",
];

const SERVICE_SELLER_PATTERN = /\b(web designers?|website designers?|web design services?|website services?|seo freelancers?|seo agencies?|seo consultants?|seo services?|local marketers?|local marketing agencies?|marketing agencies?|agency owners?|freelancers?|booking system sellers?|booking systems?|automation consultants?|social media managers?|service providers?|lead gen agencies?|lead generation agencies?|web design agency|website agency)\b/i;
const PAIN_PATTERN = /\b(need clients|how do i get clients|get clients|client acquisition|looking for clients|find clients|finding clients|need leads|looking for leads|local business leads|local leads|prospecting|prospect list|find prospects|business prospects|generating more leads|generate more leads|struggling generating more leads|struggling to generate leads|lead generation|cold outreach not working|outreach not working|cold calling is too time consuming|alternatives to cold calling|no one replies|no replies|where do i find prospects|where can i find prospects|where do i find local business leads|sell websites|selling websites|sell seo|selling seo|sell booking systems|social media management clients)\b/i;
const LOCAL_BUSINESS_OWNER_PATTERN = /\b(my business|our business|business owner|small business owner|restaurant|cafe|clinic|salon|contractor|roofer|plumber|law firm|gym|dentist|shopify store|ecommerce store|online store|need a website for my business|my website is not getting customers|business is slow)\b/i;
const BAD_PATTERN = /\b(hiring|hire me|looking for work|looking for web developer|need a web developer|web developer needed|pay per website|\$50 per website|remote developer|salary|full-time|part-time|job opening|job post|vacancy|apply now|course launch|buy my|dm me for|limited offer|promo code|giveaway|i built this|i build websites|i can build|i offer|we provide leads|guaranteed clients|guaranteed leads|buy leads|sell leads|cheap website|crypto|forex|mlm|multi level|affiliate|dropshipping|drop shipping|reseller|wholesale|telegram)\b/i;
const PRIVATE_GROUP_PATTERN = /\b(private group|members only|screenshot from a private group|do not share|confidential)\b/i;
const SEARCH_SKIP_SIGNALS = ["hiring", "jobs", "cheap web developer", "pay per website", "people selling leads", "spam offers", "DM me", "guaranteed clients"];
const SEARCH_GOOD_SIGNALS = ["client-acquisition questions", "prospecting advice requests", "agency/freelancer pain", "local business lead sourcing", "outreach failure", "service-selling strategy"];
const WEAK_SEARCH_PATTERN = /\b(need clients web design|looking for web developer|need web developer|cheap website|hire developer|buy leads|guaranteed leads|looking for leads small business)\b/i;

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 1400);
}

function hasAny(text: string, pattern: RegExp) {
  return pattern.test(text);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasExcludedKeyword(text: string, keyword: string) {
  const cleanKeyword = keyword.trim();
  if (!cleanKeyword) return false;
  if (/^[a-z0-9 ]+$/i.test(cleanKeyword)) {
    return new RegExp(`\\b${escapeRegExp(cleanKeyword).replace(/\s+/g, "\\s+")}\\b`, "i").test(text);
  }
  return text.toLowerCase().includes(cleanKeyword.toLowerCase());
}

function buildFacebookSearchUrl(targetBuyer: string, painKeywords: string) {
  const query = cleanText([targetBuyer, painKeywords].filter(Boolean).join(" "));
  return query ? `https://m.facebook.com/search/posts/?q=${encodeURIComponent(query)}` : "https://m.facebook.com/search/";
}

function facebookPostsUrl(query: string) {
  return `https://m.facebook.com/search/posts/?q=${encodeURIComponent(query)}`;
}

function facebookGroupsUrl(query: string) {
  return `https://m.facebook.com/search/groups/?q=${encodeURIComponent(query)}`;
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
    ["Shopify service clients", "ecommerce service clients", "store audit prospects"].forEach(add);
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
  if (/\b(how do i get clients|where do i find prospects|where can i find prospects|how do i get leads|where can i find local business leads)\b/.test(text)) score += 38;
  if (/\b(sell websites|sell seo|sell booking systems|social media management clients|automation consultant)\b/.test(text)) score += 30;
  if (/\b(agency|freelancer|web design|seo|local marketing|booking system|automation consultant|social media manager)\b/.test(text)) score += 12;
  if (WEAK_SEARCH_PATTERN.test(text)) score -= 80;
  if (BAD_PATTERN.test(text)) score -= 90;
  return Math.max(0, Math.min(100, score));
}

export function createDefaultFacebookFilters(): FacebookRadarFilters {
  return {
    recentOnly: true,
    postedWithin: "7d",
    publicGroupsOnly: true,
    minimumMembers: 500,
    minimumPostsPerDay: 3,
    minimumEngagement: 1,
    language: "English",
    location: "",
    includeCategories: [],
    excludeCategories: ["jobs", "crypto", "mlm", "reseller", "dropshipping"],
    excludeKeywords: DEFAULT_FACEBOOK_EXCLUDE_KEYWORDS,
  };
}

export function generateFacebookSearchLinks(input: FacebookRadarSearchInput): FacebookRadarSearchLink[] {
  const painTerms = splitTerms(input.painKeywords);
  const niches = nicheVariants([input.targetBuyer, input.niche, input.painKeywords].join(" "));
  const precisePains = [
    "no one replies to my outreach",
    "cold outreach not working",
    "how do I get clients",
    "where can I find local business leads",
    "how do I get leads",
    "how do I get web design clients",
    "how do I get SEO clients",
    "where do marketers find prospects",
    "prospecting is not working",
    "how do I sell websites to local businesses",
    "how do I sell SEO to small businesses",
    "how do I get booking system clients",
    "how do I get social media management clients",
    "outreach not working",
    "agency owner client acquisition",
    ...BUYER_INTENT_QUERY_LIBRARY,
  ];
  const phrases = new Set<string>();
  const add = (phrase: string) => {
    const cleaned = cleanText(phrase).toLowerCase();
    if (cleaned && !BAD_PATTERN.test(cleaned) && !WEAK_SEARCH_PATTERN.test(cleaned)) phrases.add(cleaned);
  };

  precisePains.forEach((pain) => add(`"${pain}"`));

  if (/\bweb design|website|web designer\b/i.test(`${input.targetBuyer} ${input.niche}`)) {
    [
      addQuotedNiche("cold outreach not working", "web design"),
      addQuotedNiche("how do I get clients", "web design"),
      addQuotedNiche("no one replies to my outreach", "web designer"),
      addQuotedNiche("where can I find local business leads", "website design"),
      addQuotedNiche("how to sell websites to local businesses", "web designer"),
    ].forEach(add);
  }
  if (/\bseo\b/i.test(`${input.targetBuyer} ${input.niche}`)) {
    [
      addQuotedNiche("how do I get clients", "SEO freelancer"),
      addQuotedNiche("cold outreach not working", "SEO agency"),
      addQuotedNiche("how do I get leads", "SEO"),
      addQuotedNiche("how to sell SEO to local businesses", "SEO consultant"),
    ].forEach(add);
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
      reason: `MarketVibe fit ${fitScore}/100: best when results show agency, freelancer, prospecting, local-lead, client-acquisition, or outreach pain.`,
      postsUrl: facebookPostsUrl(phrase),
      groupsUrl: facebookGroupsUrl(phrase),
    }));
}

function detectPainPoint(text: string) {
  if (/\b(cold outreach|no one replies|outreach not working)\b/i.test(text)) return "outreach not working";
  if (/\b(web design|web designer|sell websites|website clients)\b/i.test(text)) return "web design client acquisition";
  if (/\b(seo clients|seo freelancer|seo agency|sell seo)\b/i.test(text)) return "SEO client acquisition";
  if (/\b(local business leads|local leads|prospects|prospecting)\b/i.test(text)) return "local prospect sourcing";
  if (/\b(booking system|booking software|appointments)\b/i.test(text)) return "booking-system client acquisition";
  if (/\b(social media management|social media manager)\b/i.test(text)) return "social media client acquisition";
  if (/\b(automation consultant|automation clients)\b/i.test(text)) return "automation client acquisition";
  if (/\b(leads|clients|client acquisition)\b/i.test(text)) return "client acquisition";
  return "service-seller buyer intent";
}

function detectBusinessCategory(text: string) {
  if (/\b(web design|web designer|website agency)\b/i.test(text)) return "web design seller";
  if (/\b(seo|local seo)\b/i.test(text)) return "SEO seller";
  if (/\b(local marketing|marketing agency|agency owner)\b/i.test(text)) return "local marketing agency";
  if (/\b(booking system|booking software)\b/i.test(text)) return "booking-system seller";
  if (/\b(automation consultant|automation agency)\b/i.test(text)) return "automation consultant";
  if (/\b(social media manager|social media management)\b/i.test(text)) return "social media manager";
  if (/\b(freelancer|service provider|consultant)\b/i.test(text)) return "freelancer/service provider";
  return "service seller";
}

function detectLocation(text: string, fallback = "") {
  if (fallback) return fallback;
  const match = text.match(/\b(?:in|near|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/);
  return match?.[1] || "Not detected";
}

function scoreLabel(score: number): FacebookRadarScore {
  if (score >= 75) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

export function normalizeFacebookLeadSignature(value: { text?: string; url?: string }) {
  const url = cleanText(value.url || "").toLowerCase();
  if (url && !/facebook\.com\/?$/.test(url)) return url;
  return cleanText(value.text || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").slice(0, 220);
}

export function scoreFacebookLeadPreview(candidate: FacebookLeadCandidate, filters: FacebookRadarFilters = createDefaultFacebookFilters(), seen = new Set<string>()): FacebookLeadPreview {
  const text = cleanText(candidate.text || "");
  const combined = cleanText([text, candidate.groupName, candidate.location].filter(Boolean).join(" "));
  let rank = scorePost(combined, "service sellers", filters.includeCategories.join(", "));
  const skipReasons: string[] = [];
  const signature = normalizeFacebookLeadSignature({ text, url: candidate.url });

  if (!text || text.length < 35) skipReasons.push("post has too little useful text");
  if (seen.has(signature)) skipReasons.push("duplicate post");
  if (BAD_PATTERN.test(combined)) skipReasons.push("job, spam, crypto, MLM, reseller, seller marketplace, or low-quality intent");
  if (LOCAL_BUSINESS_OWNER_PATTERN.test(combined) && !SERVICE_SELLER_PATTERN.test(combined)) skipReasons.push("generic local business owner post, not a service-seller buyer");
  if (!SERVICE_SELLER_PATTERN.test(combined) && !/\b(sell websites|sell seo|local business leads|find prospects|prospecting|client acquisition|agency clients)\b/i.test(combined)) skipReasons.push("not clearly from a freelancer, agency, marketer, or service seller");
  if (filters.publicGroupsOnly && candidate.isPublicGroup === false) skipReasons.push("not confirmed public");
  if ((candidate.groupMembers || 0) < filters.minimumMembers) skipReasons.push("group below minimum members");
  if ((candidate.groupPostsPerDay || 0) < filters.minimumPostsPerDay) skipReasons.push("group below minimum daily activity");
  if (((candidate.reactions || 0) + (candidate.comments || 0)) < filters.minimumEngagement) skipReasons.push("below minimum reactions/comments");
  if (filters.language && candidate.language && candidate.language.toLowerCase() !== filters.language.toLowerCase()) skipReasons.push("language mismatch");
  if (filters.location && !combined.toLowerCase().includes(filters.location.toLowerCase())) skipReasons.push("location mismatch");

  for (const keyword of filters.excludeKeywords) {
    if (hasExcludedKeyword(combined, keyword)) skipReasons.push(`excluded keyword: ${keyword}`);
  }

  const category = detectBusinessCategory(combined);
  if (filters.includeCategories.length && !filters.includeCategories.some((item) => category.includes(item.toLowerCase()) || combined.toLowerCase().includes(item.toLowerCase()))) {
    skipReasons.push("does not match included business categories");
  }
  if (filters.excludeCategories.some((item) => category.includes(item.toLowerCase()) || combined.toLowerCase().includes(item.toLowerCase()))) {
    skipReasons.push("matches excluded business category");
  }

  if (skipReasons.length) rank = Math.min(rank, 45);
  const painPoint = detectPainPoint(combined);
  const passedFilters = skipReasons.length === 0 && rank >= 50;

  return {
    id: signature || `${Date.now()}`,
    groupName: candidate.groupName || "Facebook source",
    groupSizeActivity: `${candidate.groupMembers || 0} members · ${candidate.groupPostsPerDay || 0} posts/day`,
    snippet: text.slice(0, 260),
    authorType: SERVICE_SELLER_PATTERN.test(text) ? "Likely service seller" : "Unknown",
    intentScore: scoreLabel(rank),
    intentRank: rank,
    painPoint,
    businessCategory: category,
    location: detectLocation(combined, candidate.location),
    reason: passedFilters
      ? `Matched ${painPoint} from a service-seller buyer and passed activity/safety filters.`
      : `Skipped or downgraded: ${skipReasons.join("; ") || "not enough buyer intent"}.`,
    duplicateWarning: seen.has(signature) ? "Duplicate: already seen or sent." : "No duplicate detected.",
    passedFilters,
    skipReasons,
    url: candidate.url || "https://www.facebook.com",
    suggestedReply: replyForIntent(detectIntent(combined)).quickReply,
  };
}

export function filterAndRankFacebookLeads(candidates: FacebookLeadCandidate[], filters: FacebookRadarFilters = createDefaultFacebookFilters(), previouslySent = new Set<string>()) {
  const seen = new Set(previouslySent);
  return candidates
    .map((candidate) => {
      const preview = scoreFacebookLeadPreview(candidate, filters, seen);
      seen.add(preview.id);
      return preview;
    })
    .sort((a, b) => b.intentRank - a.intentRank);
}

export function shouldSendFacebookLead(preview: FacebookLeadPreview, sent = new Set<string>()) {
  return preview.passedFilters && preview.intentScore === "High" && !sent.has(preview.id);
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
  const hasServiceSeller = hasAny(text, SERVICE_SELLER_PATTERN);
  const localBusinessOwner = hasAny(text, LOCAL_BUSINESS_OWNER_PATTERN);
  if (hasServiceSeller) score += 34;
  if (hasAny(text, PAIN_PATTERN)) score += 42;
  if (/\?/.test(text)) score += 8;
  if (/\b(help|advice|struggling|stuck|not working|where do i find|how do i)\b/i.test(text)) score += 10;
  if (/\b(cold outreach not working|outreach not working|no one replies|no replies to my outreach|prospecting is not working)\b/i.test(text)) score += 24;
  if (/\b(struggling (?:on |with |to )?(?:generat(?:e|ing)|get(?:ting)?) (?:more )?leads?|looking for alternatives? to cold calling|cold calling is too time consuming)\b/i.test(text)) score += 36;
  if (/\b(agency|web designer|seo freelancer|freelancer)\b/i.test(text) && /\b(leads|clients|appointments|outreach|cold calling)\b/i.test(text)) score += 16;
  if (/\b(looking for a tool to find leads|how do i get leads|how do i get clients|where can i find local business leads|where do i find prospects)\b/i.test(text)) score += 26;
  if (/\b(sell websites|sell seo|booking system clients|social media management clients|automation clients)\b/i.test(text)) score += 26;
  if (targetBuyer && text.toLowerCase().includes(targetBuyer.toLowerCase().split(/\s+/)[0] || "")) score += 4;

  for (const keyword of splitTerms(painKeywords)) {
    if (keyword.length > 2 && text.toLowerCase().includes(keyword)) score += 4;
  }
  if (localBusinessOwner && !hasServiceSeller) score -= 60;
  if (!hasServiceSeller && !/\b(sell websites|sell seo|local business leads|find prospects|prospecting|client acquisition|agency clients)\b/i.test(text)) score -= 35;
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
      manualNote: "Do not post a normal reply. Look for service sellers asking for clients, local business leads, prospecting help, web design clients, SEO clients, or outreach help.",
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
