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

const IMPORT_BUYER_PAIN_PATTERN = /\b(need (?:more )?(?:clients|leads|customers|sales)|looking for (?:clients|leads|customers|prospects)|how (?:do|can) i (?:get|find|reach|attract|land) (?:online )?(?:clients|leads|customers|prospects)|where (?:do|can) i find (?:clients|leads|customers|prospects)|what (?:are|is) (?:the )?(?:best |effective )?ways? (?:to|for).*(?:get|find|reach|attract|land).*(?:clients|leads|prospects)|advice (?:for|on|about).*(?:getting|finding|reaching|attracting|landing).*(?:clients|leads|prospects)|struggling (?:to|with) (?:get|getting|find|finding|generate|generating) (?:clients|leads|customers|sales)|struggling to find clients|ads (?:are )?not working|cold outreach (?:is )?not working|no one replies|lead generation help|client acquisition|prospecting|local business leads)\b/i;
const IMPORT_SERVICE_SELLER_PATTERN = /\b(web designers?|website designers?|web developers?|website developers?|web devs?|web design(?: agency| agencies| services?)?|web development(?: agency| agencies| services?)?|website creation services?|website services?|i build websites?|i make websites?|free websites?|offer(?:ing)? free websites?|help(?:ing)? people with (?:their )?websites?|help people with (?:their )?websites?|business of helping people with (?:their )?websites?|seo freelancers?|seo agencies?|seo consultants?|seo services?|marketing agencies?|local marketers?|local marketing agencies?|agency owners?|smma|social media managers?|booking systems?|booking-system sellers?|automation consultants?|lead gen(?:eration)? agencies?|appointment setters?|service providers?|freelancers?|consultants?)\b/i;
const IMPORT_GENERIC_LOCAL_BUSINESS_PATTERN = /\b(i own|my|our)\s+(?:salon|restaurant|cafe|gym|clinic|dentist|law firm|shop|store|boutique|plumbing|roofing|contractor|local business|small business)\b|\b(?:salon|restaurant|cafe|gym|clinic|dentist|law firm|shop|store|boutique|plumber|roofer|contractor)\s+(?:owner|business)\b/i;
const IMPORT_HARD_REJECT_PATTERN = /\b(guaranteed clients|guaranteed leads|buy leads|sell leads|join my group|course|webinar|masterclass|hiring|job|looking for work|open to work|real estate|insurance|crypto|forex|mlm|affiliate|dropshipping|reseller|giveaway|promo code)\b/i;
const IMPORT_SOFT_SELLER_PATTERN = /\b(dm me|message me|inbox me|i can help|we can help|i offer|we offer|i provide|we provide|my services|our services|need clients\?|need leads\?|promote your business|affordable website services|we build websites)\b/i;

function clean(value: unknown, limit = 900) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
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

  const usefulStart = text.search(/\b(hi|hello|hey|question|quick question|how do|how can|where do|where can|what are|what is|any advice|advice for|i need|i want|i have|i built|i launched|i'm|im|my|we|one of|most early|recently|looking|cold|no leads|no sales|no traffic|struggling to find clients)\b/i);
  if (usefulStart > 0 && usefulStart < 450) text = text.slice(usefulStart);

  const cleaned = clean(text, limit);
  return cleaned && !/^facebook$/i.test(cleaned) ? cleaned : "Facebook post imported";
}

function rankFromScore(score: FacebookRadarResult["score"], action: FacebookRadarResult["action"], risk: FacebookRadarResult["risk"]) {
  let rank = score === "High" ? 90 : score === "Medium" ? 62 : 28;
  if (action === "Skip") rank -= 45;
  if (risk === "High") rank -= 25;
  if (risk === "Low") rank += 8;
  return Math.max(0, Math.min(100, rank));
}

function classify(analysis: FacebookRadarResult, rank: number): ScoredFacebookPost["label"] {
  if (analysis.action === "Skip") return rank <= 25 ? "Bad fit" : "Skip";
  if (rank >= 70) return "Good";
  return "ManualOnly";
}

function buyerTypeReason(text: string) {
  if (/\b(web designers?|website designers?|web developers?|website developers?|web design|web development|website creation services?|help(?:ing)? people with (?:their )?websites?|business of helping people with (?:their )?websites?|free websites?)\b/i.test(text)) return "web/website service seller";
  if (/\bseo freelancers?|seo agencies?|seo consultants?|seo services?\b/i.test(text)) return "SEO service seller";
  if (/\bsmma|social media managers?|marketing agencies?|local marketers?\b/i.test(text)) return "marketing service seller";
  if (/\bautomation consultants?|booking systems?|appointment setters?|lead gen(?:eration)? agencies?\b/i.test(text)) return "service seller";
  if (/\bfreelancers?|consultants?|agency owners?|service providers?\b/i.test(text)) return "freelancer/service seller";
  return "service seller";
}

function painReason(text: string) {
  if (/\bcold outreach|no one replies|prospecting\b/i.test(text)) return "outreach/prospecting pain";
  if (/\blocal business leads|lead generation|need leads|find leads|get leads\b/i.test(text)) return "lead-generation pain";
  if (/\bclients|client acquisition|online clients|struggling to find clients\b/i.test(text)) return "client-acquisition pain";
  return "client-acquisition pain";
}

function hasBuyerPain(text: string) {
  return IMPORT_BUYER_PAIN_PATTERN.test(text);
}

function hasServiceSellerContext(text: string) {
  return IMPORT_SERVICE_SELLER_PATTERN.test(text);
}

function isExtensionQualified(post: ImportedFacebookPost, text: string, confidenceScore: number) {
  if (confidenceScore < 78) return false;
  const postEvidence = [text, post.matchReason, post.painPoint].map((item) => clean(item, 300)).join(" ");
  const strongBuyer = hasBuyerPain(postEvidence) && hasServiceSellerContext(postEvidence);
  if (IMPORT_HARD_REJECT_PATTERN.test(postEvidence)) return false;
  if (!strongBuyer && IMPORT_SOFT_SELLER_PATTERN.test(postEvidence)) return false;
  if (isGenericLocalBusinessLead(postEvidence)) return false;
  if (!strongBuyer) return false;
  return /\b(clients|client|leads|lead|customers|sales|prospect|prospects|outreach|ads|marketing|agency|freelancer|website|web design|web development|web developer|seo)\b/i.test(postEvidence);
}

function isGenericLocalBusinessLead(text: string) {
  return IMPORT_GENERIC_LOCAL_BUSINESS_PATTERN.test(text) && !IMPORT_SERVICE_SELLER_PATTERN.test(text);
}

function extensionLabel(confidenceScore: number): ScoredFacebookPost["label"] {
  return confidenceScore >= 78 ? "Good" : "ManualOnly";
}

export function scoreImportedFacebookPosts(input: {
  posts: ImportedFacebookPost[];
  searchPhrase?: string;
  targetBuyer?: string;
  painKeywords?: string;
}) {
  const searchPhrase = clean(input.searchPhrase, 180);
  const targetBuyer = clean(input.targetBuyer || "web designers, web developers, SEO freelancers, local marketers, small agencies", 240);
  const painKeywords = clean(input.painKeywords || "web design clients, website clients, web developer clients, SEO clients, local business leads, prospecting, cold outreach not working", 240);
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
      const extensionQualified = isExtensionQualified(post, text, suppliedConfidence);
      const genericLocalBusiness = isGenericLocalBusinessLead(text);
      const fitRank = genericLocalBusiness ? Math.min(analyzedRank, 25) : extensionQualified ? Math.max(analyzedRank, suppliedConfidence) : analyzedRank;
      const label = genericLocalBusiness ? "Skip" : extensionQualified ? extensionLabel(fitRank) : classify(analysis, fitRank);
      const improvedReason = extensionQualified
        ? `Matched: ${buyerTypeReason(text)} + ${painReason(text)}.`
        : genericLocalBusiness
          ? "Skipped: generic local business owner, not a MarketVibe buyer."
          : analysis.reason;

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
        painPoint: extensionQualified ? painReason(text) : clean(post.painPoint || analysis.intent.replace(/-/g, " "), 120),
        replyDraft: clean(post.replyDraft, 600),
        outreachMode: clean(post.outreachMode, 80),
        confidenceScore: Number(post.confidenceScore || fitRank || 0),
        matchReason: clean(improvedReason || post.matchReason || analysis.reason, 300),
        analysis,
        fitRank,
        label,
      };
    })
    .filter((post): post is ScoredFacebookPost => Boolean(post))
    .sort((a, b) => b.fitRank - a.fitRank)
    .slice(0, 20);
}
