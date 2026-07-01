import { analyzeFacebookLead, type FacebookRadarResult } from "@/lib/facebook-radar";

export type ImportedFacebookPost = {
  text?: string;
  sourceName?: string;
  author?: string;
  dateText?: string;
  reactions?: string | number;
  comments?: string | number;
  url?: string;
  queryUsed?: string;
  sourceUsed?: string;
  painPoint?: string;
  replyDraft?: string;
  outreachMode?: string;
  confidenceScore?: number;
  matchReason?: string;
  status?: string;
  outreachStatus?: string;
};

export type ScoredFacebookPost = ImportedFacebookPost & {
  id: string;
  fitRank: number;
  label: "Good" | "ManualOnly" | "Skip" | "Bad fit";
  analysis: FacebookRadarResult;
};

const FB_JUNK_WORDS = new Set([
  "facebook",
  "home",
  "watch",
  "marketplace",
  "groups",
  "gaming",
  "notifications",
  "menu",
  "search",
  "filters",
  "all",
  "people",
  "reels",
  "pages",
  "events",
  "follow",
  "like",
  "comment",
  "share",
  "send",
  "join",
]);

const HARD_REJECT_PATTERNS = [
  /\b(dm me|message me|inbox me|comment info|book a call|schedule a call)\b/i,
  /\b(i can help|i can assist|we can help|we help|i offer|we offer|i provide|we provide|my services|our services)\b/i,
  /\b(need clients\?|want clients\?|need leads\?|want leads\?|do you need clients|do you need leads|get more clients today)\b/i,
  /\b(guaranteed clients|guaranteed leads|verified leads|targeted leads|buy leads|sell leads|pay per lead|lead generation service)\b/i,
  /\b(join my group|join our group|facebook group of|promote your business|networking group|want an invite)\b/i,
  /\b(course|webinar|masterclass|academy|training|coaching program|free training|workshop|download my guide)\b/i,
  /\b(hiring|job|vacancy|roles? open|looking for work|open to work|for hire|commission only|commission based|upwork|fiverr)\b/i,
  /\b(real estate|realtor|mortgage|insurance|crypto|forex|mlm|affiliate|dropshipping|reseller|giveaway|promo code)\b/i,
  /\b(affordable website services|websites? for small budgets|we build websites|i build websites for|i make websites for)\b/i,
];

const BUYER_PAIN_PATTERNS = [
  /\bneed (?:more )?(?:clients|leads|customers|sales)\b/i,
  /\blooking for (?:more )?(?:clients|leads|customers|prospects)\b/i,
  /\bhow (?:do|can) i (?:get|find) (?:more )?(?:clients|leads|customers|prospects)\b/i,
  /\bwhere (?:do|can) i find (?:clients|leads|customers|prospects)\b/i,
  /\bstruggling (?:to|with) (?:get|getting|find|finding|generate|generating) (?:more )?(?:clients|leads|customers|sales)\b/i,
  /\b(?:ads|facebook ads|google ads) (?:are )?(?:not working|don'?t work|aren'?t working)\b/i,
  /\b(?:cold outreach|cold email|cold emails|cold calling|prospecting) (?:is )?(?:not working|doesn'?t work|isn'?t working)\b/i,
  /\bno one replies(?: to my outreach| to my emails| to my messages)?\b/i,
  /\blead generation help\b/i,
  /\bclient acquisition\b/i,
];

const HELP_REQUEST_PATTERNS = [
  /\b(how do i|how can i|where do i|where can i|any advice|what should i do|can someone help|need help|recommendations|ideas|tips)\b/i,
  /\?/,
];

const SERVICE_OR_BUSINESS_CONTEXT_PATTERNS = [
  /\b(agency|freelancer|consultant|coach|marketer|service provider|business owner|small business|startup|founder)\b/i,
  /\b(web design|website|seo|marketing|social media|smma|appointment setting|booking system|automation|shopify|ecommerce)\b/i,
  /\b(my business|our business|my agency|our agency|my service|our service|my offer|our offer)\b/i,
];

function clean(value: unknown, limit = 900) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
}

function hasMatch(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function countMatches(text: string, patterns: RegExp[]) {
  return patterns.reduce((total, pattern) => total + (pattern.test(text) ? 1 : 0), 0);
}

function dedupeRepeatedWords(text: string) {
  const words = text.split(" ");
  const output: string[] = [];
  let previous = "";
  let repeatCount = 0;

  for (const word of words) {
    const normalized = word.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normalized && normalized === previous) {
      repeatCount += 1;
      if (repeatCount <= 1 && !FB_JUNK_WORDS.has(normalized)) output.push(word);
      continue;
    }

    previous = normalized;
    repeatCount = 0;
    if (normalized && FB_JUNK_WORDS.has(normalized) && word.length <= 14) continue;
    output.push(word);
  }

  return output.join(" ");
}

function stripFacebookSpam(value: unknown, limit = 900) {
  return dedupeRepeatedWords(clean(value, 3000)
    .replace(/(?:Facebook){2,}/gi, " ")
    .replace(/\bFacebook\b(?:\s*\bFacebook\b)+/gi, " ")
    .replace(/\b(Home|Watch|Marketplace|Groups|Gaming|Notifications|Menu|Search|Filters|All|People|Reels|Pages|Events)\b/gi, " ")
    .replace(/\b(Search results|Most relevant|Top comments|Write a comment|Add a comment|View more comments|See more|See less)\b/gi, " ")
    .replace(/\b(Like|Comment|Share|Send|Follow|Join)\b\s*/gi, " ")
    .replace(/\b\d+\s*(likes?|comments?|shares?)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()).slice(0, limit);
}

function cleanImportedText(value: unknown, limit = 900) {
  let text = stripFacebookSpam(value, 3000);

  const usefulStart = text.search(/\b(hi|hello|hey|question|quick question|how do|how can|where do|where can|i need|i want|i have|i built|i launched|i'm|im|my|we|one of|most early|recently|looking|cold|no leads|no sales|no traffic|ads not working|need clients|need leads|need customers|need sales)\b/i);
  if (usefulStart > 0 && usefulStart < 450) text = text.slice(usefulStart);

  const cleaned = clean(text, limit);
  return cleaned && !/^facebook$/i.test(cleaned) ? cleaned : "Facebook post imported";
}

function scoreBuyerIntent(post: ImportedFacebookPost, text: string, suppliedConfidence: number) {
  const evidence = [text, post.matchReason, post.painPoint, post.queryUsed, post.sourceUsed].map((item) => clean(item, 300)).join(" ");

  if (hasMatch(evidence, HARD_REJECT_PATTERNS)) return 0;

  const painMatches = countMatches(evidence, BUYER_PAIN_PATTERNS);
  const helpMatches = countMatches(evidence, HELP_REQUEST_PATTERNS);
  const contextMatches = countMatches(evidence, SERVICE_OR_BUSINESS_CONTEXT_PATTERNS);
  const firstPerson = /\b(i|i'm|im|my|we|our)\b/i.test(evidence);
  const sellerQuestionTrap = /\b(?:need|want) (?:clients|leads|customers)\?/i.test(evidence);

  if (!painMatches || sellerQuestionTrap) return 0;

  let score = 38;
  score += Math.min(34, painMatches * 17);
  score += Math.min(18, helpMatches * 9);
  score += Math.min(14, contextMatches * 7);
  if (firstPerson) score += 10;
  if (/\b(no one replies|cold outreach|ads not working|struggling|need help|any advice|what should i do)\b/i.test(evidence)) score += 12;
  if (suppliedConfidence >= 78) score += 8;
  if (text.length < 60) score -= 18;

  return Math.max(0, Math.min(100, score));
}

function rankFromScore(score: FacebookRadarResult["score"], action: FacebookRadarResult["action"], risk: FacebookRadarResult["risk"]) {
  let rank = score === "High" ? 90 : score === "Medium" ? 62 : 28;
  if (action === "Skip") rank -= 45;
  if (risk === "High") rank -= 25;
  if (risk === "Low") rank += 8;
  return Math.max(0, Math.min(100, rank));
}

function classifyByBuyerIntent(buyerRank: number): ScoredFacebookPost["label"] {
  if (buyerRank >= 78) return "Good";
  if (buyerRank >= 60) return "ManualOnly";
  if (buyerRank <= 0) return "Bad fit";
  return "Skip";
}

export function scoreImportedFacebookPosts(input: {
  posts: ImportedFacebookPost[];
  searchPhrase?: string;
  targetBuyer?: string;
  painKeywords?: string;
}) {
  const searchPhrase = clean(input.searchPhrase, 180);
  const targetBuyer = clean(input.targetBuyer || "people asking for clients, leads, customers, sales, prospecting help, or outreach help", 240);
  const painKeywords = clean(input.painKeywords || "need clients, need leads, looking for clients, looking for leads, how do I get clients, how do I find customers, ads not working, cold outreach not working, no one replies, struggling to generate leads, where do I find prospects", 240);
  const seen = new Set<string>();

  return (input.posts || [])
    .map((post, index): ScoredFacebookPost | null => {
      const text = cleanImportedText(post.text);
      if (!text || text.length < 20 || text === "Facebook post imported") return null;
      const signature = text.toLowerCase().slice(0, 180);
      if (seen.has(signature)) return null;
      seen.add(signature);

      const sourceUrl = clean(post.url || "https://www.facebook.com/search/posts/", 500);
      const analysis = analyzeFacebookLead({
        postText: text,
        targetBuyer,
        painKeywords: [painKeywords, searchPhrase].filter(Boolean).join(", "),
        sourceUrl,
      });
      const analyzedRank = rankFromScore(analysis.score, analysis.action, analysis.risk);
      const suppliedConfidence = Number(post.confidenceScore || 0);
      const buyerRank = scoreBuyerIntent(post, text, suppliedConfidence);
      const label = classifyByBuyerIntent(buyerRank);
      const fitRank = label === "Good" || label === "ManualOnly"
        ? Math.max(buyerRank, Math.min(analyzedRank, 78))
        : Math.min(buyerRank, analyzedRank);

      return {
        id: `${Date.now()}-${index}`,
        text,
        sourceName: stripFacebookSpam(post.sourceName, 160) || "Facebook source",
        author: stripFacebookSpam(post.author, 120) || "Unknown author",
        dateText: stripFacebookSpam(post.dateText, 80),
        reactions: clean(post.reactions, 40),
        comments: clean(post.comments, 40),
        url: sourceUrl,
        queryUsed: clean(post.queryUsed, 160),
        sourceUsed: clean(post.sourceUsed, 120),
        painPoint: clean(post.painPoint || analysis.intent.replace(/-/g, " "), 120),
        replyDraft: clean(post.replyDraft, 600),
        outreachMode: clean(post.outreachMode, 80),
        confidenceScore: buyerRank || Number(post.confidenceScore || fitRank || 0),
        matchReason: clean(post.matchReason || analysis.reason, 300),
        analysis: label === "Bad fit" || label === "Skip"
          ? {
              ...analysis,
              action: "Skip",
              score: "Low",
              risk: "High",
              reason: buyerRank <= 0
                ? "Rejected: seller, job, promo, group/course, off-topic, or no clear buyer pain request."
                : "Skipped: buyer intent is not strong enough for import.",
              quickReply: "SKIP THIS ONE.",
              deeperReply: "Not recommended",
            }
          : {
              ...analysis,
              reason: `${analysis.reason} Buyer-intent filter ${buyerRank}/100: person appears to be asking for leads, clients, customers, sales, prospecting, ads, or outreach help.`,
            },
        fitRank,
        label,
      };
    })
    .filter((post): post is ScoredFacebookPost => Boolean(post))
    .sort((a, b) => b.fitRank - a.fitRank)
    .slice(0, 20);
}
