import { NextResponse } from "next/server";
import {
  buildReplyOptions,
  buildSuggestedReply,
  cleanRssBody,
  compactRedditText as compactText,
  hasCustomerProblemSignal,
  hasMarketVibeBuyerIntent,
  hasUsablePostSignal,
  hasAiIntent,
  hasAnyTerm as hasAny,
  isBlockedJobPost,
  isLowIntelPost as hasLowIntel,
  isObviousRssJunk,
  isRejectedNonBuyerIntent,
} from "@/lib/reddit-radar";

type RedditChild = {
  data?: {
    title?: string;
    subreddit_name_prefixed?: string;
    permalink?: string;
    url?: string;
    selftext?: string;
    ups?: number;
    num_comments?: number;
    created_utc?: number;
    over_18?: boolean;
  };
};

type Action = "Reply" | "ManualOnly" | "Skip";

type RawPost = {
  title: string;
  subreddit: string;
  permalink: string;
  body: string;
  ups: number;
  comments: number;
};

const USER_AGENTS = [
  "MarketVibeRedditRadar/2.2 by marketvibe1.com",
  "Mozilla/5.0 (compatible; MarketVibeRadar/2.2; +https://marketvibe1.com)",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
];

const DEFAULT_BUSINESS_SUBS = [
  "web_design",
  "freelance",
  "SEO",
  "bigseo",
  "Entrepreneur",
  "smallbusiness",
  "agency",
  "marketing",
  "digital_marketing",
  "SideProject",
  "SaaS",
];

const SUBREDDIT_BLOCKLIST = [
  "buildapc",
  "gaming",
  "memes",
  "funny",
  "aww",
  "pics",
  "movies",
  "television",
  "music",
  "relationships",
  "AskReddit",
];

const postCache = new Map<string, { expires: number; posts: RawPost[]; sourceName: string }>();
const CACHE_MS = 1000 * 60 * 10;

function clean(value: string | null) {
  return (value || "").replace(/[<>]/g, "").slice(0, 220);
}

function wordTokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !["the", "and", "for", "with", "from", "this", "that", "need", "best", "how", "what", "why", "are", "you", "your", "about", "advice", "beginner"].includes(word));
}

function decodeHtml(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/<[^>]*>/g, "")
    .trim();
}

function isSensitiveThread(text: string) {
  return hasAny(text, [
    "ai-generated",
    "ai generated",
    "used ai",
    "chatgpt",
    "actual humans",
    "sound fake",
    "inauthentic",
    "remove capital letters",
    "ai to edit",
    "no one wants to interact",
    "fake writing",
  ]);
}

function isHostileThread(text: string) {
  return hasAny(text, [
    "stop doing",
    "i am sick of",
    "annoying",
    "fake",
    "downvote",
    "self promotion",
    "promotional",
  ]);
}

function recommendedAction(title: string, body: string, comments = 0, ups = 0): Action {
  const text = `${title} ${body}`.toLowerCase();
  if (isBlockedJobPost(title, body) || isRejectedNonBuyerIntent(title, body)) return "Skip";
  if (!hasMarketVibeBuyerIntent(title, body)) return "Skip";
  if (hasLowIntel(body, comments, ups) && !hasUsablePostSignal(title, body, comments, ups)) return "Skip";
  if (isSensitiveThread(text) || isHostileThread(text)) return "Skip";
  return "ManualOnly";
}

function opportunityScore(title: string, body: string, ups: number, comments: number, action: Action): "High" | "Medium" | "Low" {
  if (action === "Skip") return "Low";
  const hasProblem = hasCustomerProblemSignal(title, body) && hasMarketVibeBuyerIntent(title, body);
  const hasQuestion = title.includes("?") || body.includes("?");
  const hasActiveComments = comments > 0;
  if (hasProblem && hasQuestion && hasActiveComments) return "High";
  if (hasProblem || hasQuestion) return "Medium";
  return "Low";
}

function riskScore(title: string, body: string, action: Action): "Low" | "Medium" | "High" {
  const text = `${title} ${body}`.toLowerCase();
  if (action === "Skip" || isBlockedJobPost(title, body) || isRejectedNonBuyerIntent(title, body) || isSensitiveThread(text) || isHostileThread(text)) return "High";
  if (hasAny(text, ["hire", "promote", "self promotion", "link", "website", "agency", "client"]) || hasAiIntent(text)) return "Medium";
  return "Low";
}

function detectIntent(title: string, body: string, comments = 0, ups = 0) {
  const text = `${title} ${body}`.toLowerCase();
  if (isBlockedJobPost(title, body)) return "blocked-job";
  if (isRejectedNonBuyerIntent(title, body) || !hasMarketVibeBuyerIntent(title, body)) return "not-buyer-intent";
  if (hasLowIntel(body, comments, ups) && !hasUsablePostSignal(title, body, comments, ups)) return "low-intel";
  if (isSensitiveThread(text)) return "sensitive-ai";
  if (hasAny(text, ["what do you use", "tool", "software", "stack", "course", "courses"])) return "tools";
  if (hasAny(text, ["traffic", "visitors", "paid ads", "organic"])) return "traffic";
  if (hasAny(text, ["client", "customer", "lead", "agency"])) return "customers";
  if (hasAny(text, ["reddit", "subreddit", "karma"])) return "reddit";
  if (hasAny(text, ["web design", "seo", "lead generation", "prospecting", "outreach", "local business", "clients", "leads", "agency"])) return "customers";
  if (hasAiIntent(text)) return "ai";
  return "general";
}

function extractPain(title: string, body: string) {
  const text = `${title}. ${body}`.replace(/\s+/g, " ").trim();
  const sentences = text.split(/[.!?]/).map((item) => item.trim()).filter(Boolean);
  const pain = sentences.find((sentence) => /struggl|hard|problem|confus|not working|fail|help|stuck|traffic|client|customer|lead|fake|\bhuman\b/i.test(sentence));
  return compactText(pain || sentences[0] || title);
}

function makeReply(title: string, body: string, niche: string, target: string, subreddit: string, comments = 0, ups = 0) {
  const intent = detectIntent(title, body, comments, ups);
  const action = recommendedAction(title, body, comments, ups);
  return buildSuggestedReply({ title, body, intent, niche, target, subreddit, action, comments, ups });
}

function makeReason(title: string, body: string, comments: number, ups: number, subreddit: string, sourceName: string) {
  const intent = detectIntent(title, body, comments, ups);
  const action = recommendedAction(title, body, comments, ups);
  const pain = extractPain(title, body);
  const context = body.trim() ? `Context: "${pain}"` : "Only title/body-light context available.";
  const intentScore = conversionIntentScore({ title, body, comments, ups, subreddit, permalink: "" });

  if (intent === "low-intel") {
    return `Skip reason: low engagement / not enough context. ${context} Engagement: ${comments} comments and ${ups} upvotes. Intent score: ${intentScore}. Source: ${sourceName}.`;
  }

  if (action === "Skip") {
    return `Skip reason: high-risk or sensitive thread (${intent}). ${context} Engagement: ${comments} comments and ${ups} upvotes. Intent score: ${intentScore}. Source: ${sourceName}.`;
  }

  if (action === "ManualOnly") {
    return `Intel: ${subreddit} thread is useful but sensitive (${intent}). ${context} Engagement: ${comments} comments and ${ups} upvotes. Intent score: ${intentScore}. Recommended action: only reply if you can add a quick useful take. Source: ${sourceName}.`;
  }

  return `Intel: ${subreddit} thread appears to be about ${intent}. ${context} Engagement: ${comments} comments and ${ups} upvotes. Intent score: ${intentScore}. Recommended action: safe to reply, keep it short, no links. Source: ${sourceName}.`;
}

async function fetchWithTimeout(url: string, userAgent: string, timeoutMs = 8500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 120 },
      headers: {
        "User-Agent": userAgent,
        Accept: "application/json, text/html, application/xml;q=0.9, */*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function parseJsonPosts(payload: unknown): RawPost[] {
  const children = ((payload as { data?: { children?: RedditChild[] } })?.data?.children || []) as RedditChild[];

  return children
    .map((child) => child.data)
    .filter((post): post is NonNullable<RedditChild["data"]> => Boolean(post?.title && post?.permalink && !post?.over_18))
    .map((post) => ({
      title: post.title || "Reddit discussion",
      subreddit: post.subreddit_name_prefixed || "r/Reddit",
      permalink: post.permalink?.startsWith("http") ? post.permalink : `https://www.reddit.com${post.permalink}`,
      body: compactText(post.selftext || ""),
      ups: Number(post.ups || 0),
      comments: Number(post.num_comments || 0),
    }));
}

function parseRssPosts(xml: string): RawPost[] {
  const entries = xml.match(/<entry[\s\S]*?<\/entry>/g) || [];

  return entries.slice(0, 15).map((entry) => {
    const title = decodeHtml(entry.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] || "Reddit discussion");
    const link = decodeHtml(entry.match(/<link[^>]*href="([^"]+)"/)?.[1] || "https://www.reddit.com/search/");
    const rawBody = decodeHtml(entry.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] || "");
    const body = cleanRssBody(rawBody);
    const subredditMatch = link.match(/reddit\.com\/r\/([^/]+)/i);

    return {
      title,
      subreddit: subredditMatch ? `r/${subredditMatch[1]}` : "r/Reddit",
      permalink: link,
      body,
      ups: 0,
      comments: 0,
    };
  }).filter((post) => post.title && post.permalink);
}

function relevantSubreddits(queryText: string) {
  const text = queryText.toLowerCase();
  const subs = new Set(DEFAULT_BUSINESS_SUBS);

  if (hasAny(text, ["shopify", "ecommerce", "store", "amazon", "dropship"])) {
    ["Entrepreneur", "smallbusiness", "marketing"].forEach((sub) => subs.add(sub));
  }

  if (hasAny(text, ["roof", "roofer", "plumber", "dentist", "local", "contractor", "real estate"])) {
    ["smallbusiness", "Entrepreneur", "marketing", "web_design"].forEach((sub) => subs.add(sub));
  }

  if (hasAny(text, ["reddit", "subreddit", "community", "karma"])) {
    ["DigitalMarketing", "MarketingHelp", "socialmedia", "AskMarketing"].forEach((sub) => subs.add(sub));
  }

  if (hasAny(text, ["seo", "google", "rank", "search"])) {
    ["SEO", "bigseo", "marketing", "digital_marketing"].forEach((sub) => subs.add(sub));
  }

  if (hasAny(text, ["web design", "website", "freelance", "agency", "client", "lead", "prospect", "outreach"])) {
    ["web_design", "freelance", "agency", "marketing", "smallbusiness"].forEach((sub) => subs.add(sub));
  }

  return Array.from(subs).slice(0, 16);
}

function conversionIntentScore(post: RawPost) {
  const text = `${post.title} ${post.body}`.toLowerCase();
  let score = 0;

  if (isBlockedJobPost(post.title, post.body) || isObviousRssJunk(post.title, post.body)) return -100;
  if (isRejectedNonBuyerIntent(post.title, post.body)) return -100;
  if (!hasMarketVibeBuyerIntent(post.title, post.body)) return 0;
  score += 60;

  const strongPain = [
    "how do i find web design clients", "how do i get seo clients", "where to find local business leads",
    "how to sell websites to local businesses", "how to get clients as a freelancer", "cold outreach for web design",
    "local businesses that need websites", "website redesign leads", "lead generation for agencies",
    "finding businesses with bad websites", "prospecting for web design", "selling seo services",
    "agency lead generation", "client acquisition for web designers", "web design clients", "seo clients",
    "local business leads", "get clients", "find clients", "get leads", "find leads", "prospecting", "outreach"
  ];

  const weakOpinion = [
    "thoughts on", "hot take", "future of", "is ai replacing", "what is your favorite", "favorite tool",
    "best course", "course worth", "courses are", "showcase", "here is my", "i built", "launching", "roast my"
  ];

  for (const phrase of strongPain) {
    if (text.includes(phrase)) score += 7;
  }

  if (text.includes("?")) score += 8;
  if (/\b(clients|leads|prospects|prospecting|outreach|pitch|local businesses|web design|seo|agency)\b/i.test(text)) score += 12;
  if (post.comments > 0 && post.comments <= 25) score += 4;
  if (post.ups > 0 && post.ups <= 60) score += 2;
  if (post.comments > 80) score -= 5;

  for (const phrase of weakOpinion) {
    if (text.includes(phrase)) score -= 8;
  }

  if (hasLowIntel(post.body, post.comments, post.ups) && !hasUsablePostSignal(post.title, post.body, post.comments, post.ups)) score -= 10;
  if (hasUsablePostSignal(post.title, post.body, post.comments, post.ups)) score += 6;

  return score;
}

function isActionablePost(post: RawPost) {
  if (isBlockedJobPost(post.title, post.body) || isRejectedNonBuyerIntent(post.title, post.body)) return false;
  if (isObviousRssJunk(post.title, post.body)) return false;
  if (!hasMarketVibeBuyerIntent(post.title, post.body)) return false;
  if (hasLowIntel(post.body, post.comments, post.ups) && !hasUsablePostSignal(post.title, post.body, post.comments, post.ups)) return true;
  if (!hasUsablePostSignal(post.title, post.body, post.comments, post.ups)) return false;
  return true;
}

function relevanceScore(post: RawPost, queryText: string) {
  const haystack = `${post.title} ${post.body} ${post.subreddit}`.toLowerCase();
  const subreddit = post.subreddit.replace(/^r\//i, "").toLowerCase();
  const tokens = wordTokens(queryText);
  let score = 0;

  if (SUBREDDIT_BLOCKLIST.some((blocked) => blocked.toLowerCase() === subreddit)) return -100;
  if (isBlockedJobPost(post.title, post.body) || isRejectedNonBuyerIntent(post.title, post.body) || isObviousRssJunk(post.title, post.body)) return -100;
  if (!hasMarketVibeBuyerIntent(post.title, post.body)) return 0;
  if (DEFAULT_BUSINESS_SUBS.map((sub) => sub.toLowerCase()).includes(subreddit)) score += 8;

  for (const token of tokens) {
    if (haystack.includes(token)) score += 4;
    if (post.title.toLowerCase().includes(token)) score += 6;
  }

  if (detectIntent(post.title, post.body, post.comments, post.ups) !== "general") score += 5;
  if (/[?]|\b(clients|leads|prospects|prospecting|outreach|web design|seo|agency|local business|pitch)\b/i.test(`${post.title} ${post.body}`)) score += 15;
  score += conversionIntentScore(post) * 1.5;
  score += Math.min(post.comments, 30) * 0.8;
  score += Math.min(post.ups, 50) * 0.25;

  if (hasLowIntel(post.body, post.comments, post.ups) && !hasUsablePostSignal(post.title, post.body, post.comments, post.ups)) score -= 8;
  if (hasUsablePostSignal(post.title, post.body, post.comments, post.ups)) score += 5;

  return score;
}

async function searchReddit(queryText: string) {
  const cacheKey = queryText.toLowerCase();
  const cached = postCache.get(cacheKey);
  if (cached && cached.expires > Date.now() && cached.posts.length) {
    return { posts: cached.posts, sourceName: `${cached.sourceName}-cached` };
  }

  const encoded = encodeURIComponent(queryText);
  const endpoints: { name: string; url: string; type: "json" | "rss" }[] = [
    { name: "reddit-json", url: `https://www.reddit.com/search.json?q=${encoded}&sort=new&t=week&limit=25&type=link&raw_json=1`, type: "json" },
    { name: "reddit-comments-json", url: `https://www.reddit.com/search.json?q=${encoded}&sort=comments&t=month&limit=25&type=link&raw_json=1`, type: "json" },
    { name: "old-reddit-json", url: `https://old.reddit.com/search.json?q=${encoded}&sort=new&t=week&limit=25&type=link&raw_json=1`, type: "json" },
    { name: "reddit-rss", url: `https://www.reddit.com/search.rss?q=${encoded}&sort=new&t=week`, type: "rss" },
    { name: "old-reddit-rss", url: `https://old.reddit.com/search.rss?q=${encoded}&sort=new&t=week`, type: "rss" },
  ];

  for (const subreddit of relevantSubreddits(queryText)) {
    endpoints.push(
      { name: `r-${subreddit}-json`, url: `https://www.reddit.com/r/${subreddit}/search.json?q=${encoded}&restrict_sr=1&sort=new&t=month&limit=15&raw_json=1`, type: "json" },
      { name: `r-${subreddit}-rss`, url: `https://www.reddit.com/r/${subreddit}/search.rss?q=${encoded}&restrict_sr=1&sort=new&t=month`, type: "rss" },
    );
  }

  const errors: string[] = [];
  const collected: RawPost[] = [];
  const seen = new Set<string>();
  let winningSource = "multi-source";

  for (const endpoint of endpoints) {
    for (const userAgent of USER_AGENTS.slice(0, 2)) {
      try {
        const response = await fetchWithTimeout(endpoint.url, userAgent);
        const text = await response.text();

        if (!response.ok) {
          errors.push(`${endpoint.name}:${response.status}`);
          continue;
        }

        const posts = endpoint.type === "json" ? parseJsonPosts(JSON.parse(text)) : parseRssPosts(text);

        for (const post of posts) {
          const key = post.permalink || `${post.subreddit}-${post.title}`;
          if (!seen.has(key)) {
            seen.add(key);
            collected.push(post);
          }
        }

        if (posts.length && winningSource === "multi-source") winningSource = endpoint.name;
        if (collected.length >= 35) break;
      } catch (error) {
        errors.push(`${endpoint.name}:${error instanceof Error ? error.message : "failed"}`);
      }
    }
    if (collected.length >= 35) break;
  }

  const ranked = collected
    .map((post) => ({ post, score: relevanceScore(post, queryText), intentScore: conversionIntentScore(post) }))
    .filter((item) => !isBlockedJobPost(item.post.title, item.post.body) && !isRejectedNonBuyerIntent(item.post.title, item.post.body) && !isObviousRssJunk(item.post.title, item.post.body) && hasMarketVibeBuyerIntent(item.post.title, item.post.body) && hasUsablePostSignal(item.post.title, item.post.body, item.post.comments, item.post.ups) && item.score > 70 && item.intentScore > 70)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.post);

  if (ranked.length) {
    postCache.set(cacheKey, { expires: Date.now() + CACHE_MS, posts: ranked, sourceName: winningSource });
    return { posts: ranked, sourceName: `${winningSource}+problem-intent-ranked` };
  }

  const broad = collected
    .filter((post) => isActionablePost(post) && !SUBREDDIT_BLOCKLIST.includes(post.subreddit.replace(/^r\//i, "")))
    .sort((a, b) => conversionIntentScore(b) - conversionIntentScore(a));

  if (broad.length) {
    postCache.set(cacheKey, { expires: Date.now() + CACHE_MS, posts: broad, sourceName: winningSource });
    return { posts: broad, sourceName: `${winningSource}+problem-intent-backup` };
  }

  throw new Error(errors.slice(0, 8).join(" | ") || "no actionable Reddit posts found");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keywords = clean(searchParams.get("keywords"));
  const niche = clean(searchParams.get("niche"));
  const target = clean(searchParams.get("target")) || "founders and marketers";
  const queryText = [keywords, niche].filter(Boolean).join(" ").trim();

  if (!queryText) {
    return NextResponse.json({
      source: "empty",
      message: "Enter a niche or keywords to search Reddit.",
      opportunities: [],
    });
  }

  try {
    const { posts, sourceName } = await searchReddit(queryText);

    const visiblePosts = posts.filter((post) => isActionablePost(post));

    const opportunities = visiblePosts.slice(0, 8).map((post) => {
      const action = recommendedAction(post.title, post.body, post.comments, post.ups);
      const score = opportunityScore(post.title, post.body, post.ups, post.comments, action);
      const risk = riskScore(post.title, post.body, action);
      const intent = detectIntent(post.title, post.body, post.comments, post.ups);

      return {
        subreddit: post.subreddit,
        title: post.title,
        url: post.permalink,
        niche,
        target,
        score,
        risk,
        action,
        intent,
        reason: makeReason(post.title, post.body, post.comments, post.ups, post.subreddit, sourceName),
        ...buildReplyOptions({ title: post.title, body: post.body, intent, niche, target, subreddit: post.subreddit, action, comments: post.comments, ups: post.ups }),
        suggestedReply: makeReply(post.title, post.body, niche, target, post.subreddit, post.comments, post.ups),
      };
    });

    const skippedCount = posts.length - visiblePosts.length;

    return NextResponse.json({
      source: opportunities.length ? "live" : "empty",
      message: opportunities.length
        ? `Buyer-intent Reddit posts loaded via ${sourceName}. Hid ${skippedCount} non-buyer or junk posts.`
        : `No strong MarketVibe buyer-intent posts found right now. Try terms like web design clients, SEO clients, local business leads, prospecting, or agency lead generation.`,
      opportunities,
    });
  } catch (error) {
    return NextResponse.json({
      source: "error",
      error: error instanceof Error ? error.message : "Unable to fetch live posts",
      message: "No strong MarketVibe buyer-intent posts found right now. Try terms like web design clients, SEO clients, local business leads, prospecting, or agency lead generation.",
      opportunities: [],
    });
  }
}
