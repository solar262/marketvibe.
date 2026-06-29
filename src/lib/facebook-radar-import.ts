import { analyzeFacebookLead, type FacebookRadarResult } from "@/lib/facebook-radar";

export type ImportedFacebookPost = {
  text?: string;
  sourceName?: string;
  author?: string;
  dateText?: string;
  reactions?: string | number;
  comments?: string | number;
  url?: string;
};

export type ScoredFacebookPost = ImportedFacebookPost & {
  id: string;
  fitRank: number;
  label: "Good" | "ManualOnly" | "Skip" | "Bad fit";
  analysis: FacebookRadarResult;
};

function clean(value: unknown, limit = 900) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
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
  const painKeywords = clean(input.painKeywords || "need clients, looking for leads, cold outreach not working, no customers", 240);
  const seen = new Set<string>();

  return (input.posts || [])
    .map((post, index): ScoredFacebookPost | null => {
      const text = clean(post.text);
      if (!text || text.length < 20) return null;
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
        sourceName: clean(post.sourceName, 160),
        author: clean(post.author, 120),
        dateText: clean(post.dateText, 80),
        reactions: clean(post.reactions, 40),
        comments: clean(post.comments, 40),
        url: sourceUrl,
        analysis,
        fitRank,
        label: classify(analysis, fitRank),
      };
    })
    .filter((post): post is ScoredFacebookPost => Boolean(post))
    .sort((a, b) => b.fitRank - a.fitRank)
    .slice(0, 20);
}
