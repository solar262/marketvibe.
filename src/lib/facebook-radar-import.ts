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

  const usefulStart = text.search(/\b(hi|hello|hey|question|quick question|how do|i need|i want|i have|i built|i launched|i'm|im|my|we|one of|most early|recently|looking|cold|no leads|no sales|no traffic)\b/i);
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

export function scoreImportedFacebookPosts(input: {
  posts: ImportedFacebookPost[];
  searchPhrase?: string;
  targetBuyer?: string;
  painKeywords?: string;
}) {
  const searchPhrase = clean(input.searchPhrase, 180);
  const targetBuyer = clean(input.targetBuyer || "web designers, SEO freelancers, local marketers, small agencies", 240);
  const painKeywords = clean(input.painKeywords || "web design clients, SEO clients, local business leads, prospecting, cold outreach not working", 240);
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
      const fitRank = rankFromScore(analysis.score, analysis.action, analysis.risk);

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
        analysis,
        fitRank,
        label: classify(analysis, fitRank),
      };
    })
    .filter((post): post is ScoredFacebookPost => Boolean(post))
    .sort((a, b) => b.fitRank - a.fitRank)
    .slice(0, 20);
}
