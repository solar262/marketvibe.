import { NextResponse } from "next/server";

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
  "MarketVibeRedditRadar/2.0 by marketvibe1.com",
  "Mozilla/5.0 (compatible; MarketVibeRadar/2.0; +https://marketvibe1.com)",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
];

const DEFAULT_BUSINESS_SUBS = [
  "marketing",
  "DigitalMarketing",
  "MarketingHelp",
  "AskMarketing",
  "smallbusiness",
  "Entrepreneur",
  "ecommerce",
  "shopify",
  "SEO",
  "PPC",
  "FacebookAds",
  "sales",
  "leadgeneration",
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

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 900);
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function wordTokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !["the", "and", "for", "with", "from", "this", "that", "need", "best", "how", "what", "why", "are", "you", "your", "about", "advice", "beginner"].includes(word));
}

function hasAiIntent(text: string) {
  return /\b(ai|a\.i\.|artificial intelligence|automation|automated|agent|agents)\b/i.test(text);
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

function cleanRssBody(value: string) {
  const body = compactText(value);
  const lower = body.toLowerCase();

  if (!body) return "";
  if (lower.includes("submitted by") || lower.includes("[comments]") || lower.includes("/u/")) return "";
  if (body.length < 120) return "";

  return body;
}

function hasLowIntel(body: string, comments: number, ups: number) {
  return compactText(body).length < 120 && comments === 0 && ups === 0;
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
  if (hasLowIntel(body, comments, ups)) return "Skip";
  if (isSensitiveThread(text) || isHostileThread(text)) return "Skip";
  if (hasAny(text, ["agency", "client", "hire", "website", "link", "promote"]) || hasAiIntent(text)) return "ManualOnly";
  return "Reply";
}

function opportunityScore(ups: number, comments: number, action: Action): "High" | "Medium" | "Low" {
  if (action === "Skip") return "Low";
  if (comments >= 15 || ups >= 20) return "High";
  if (comments >= 5 || ups >= 8) return "Medium";
  return "Low";
}

function riskScore(title: string, body: string, action: Action): "Low" | "Medium" | "High" {
  const text = `${title} ${body}`.toLowerCase();
  if (action === "Skip" || isSensitiveThread(text) || isHostileThread(text)) return "High";
  if (hasAny(text, ["hire", "promote", "self promotion", "link", "website", "agency", "client"]) || hasAiIntent(text)) return "Medium";
  return "Low";
}

function detectIntent(title: string, body: string, comments = 0, ups = 0) {
  const text = `${title} ${body}`.toLowerCase();
  if (hasLowIntel(body, comments, ups)) return "low-intel";
  if (isSensitiveThread(text)) return "sensitive-ai";
  if (hasAny(text, ["what do you use", "tool", "software", "stack"])) return "tools";
  if (hasAny(text, ["traffic", "visitors", "paid ads", "organic"])) return "traffic";
  if (hasAny(text, ["client", "customer", "lead", "agency"])) return "customers";
  if (hasAny(text, ["reddit", "subreddit", "karma"])) return "reddit";
  if (hasAny(text, ["shopify", "store", "ecommerce"])) return "ecommerce";
  if (hasAiIntent(text)) return "ai";
  return "general";
}

function extractPain(title: string, body: string) {
  const text = `${title}. ${body}`.replace(/\s+/g, " ").trim();
  const sentences = text.split(/[.!?]/).map((item) => item.trim()).filter(Boolean);
  const pain = sentences.find((sentence) => /struggl|hard|problem|confus|not working|fail|help|stuck|traffic|client|customer|lead|fake|\bhuman\b/i.test(sentence));
  return compactText(pain || sentences[0] || title);
}

function makeReply(title: string, body: string, niche: string, comments = 0, ups = 0) {
  const intent = detectIntent(title, body, comments, ups);
  const action = recommendedAction(title, body, comments, ups);
  const pain = extractPain(title, body);
  const hasBody = body.trim().length > 60;

  if (intent === "low-intel") {
    return "LOW INTEL — SKIP THIS ONE. There is not enough context or engagement to write a useful reply. Look for posts with a real question, clear problem, or active comments.";
  }

  if (action === "Skip") {
    return "SKIP THIS ONE. This thread is sensitive or already negative. A polished reply could hurt the account. If you comment anyway, write one short personal sentence manually and do not mention tools, marketing, automation, AI, or links.";
  }

  if (intent === "tools") {
    return "I would start with the workflow before the tools. Where are the people, what are they already complaining about, and what useful answer can you add? Once that is clear, the tool choice matters a lot less.";
  }

  if (intent === "traffic") {
    return "I would pick one channel and one customer type first. Trying every platform at once makes it hard to learn anything. The useful content usually comes from the exact questions people are already asking.";
  }

  if (intent === "customers") {
    return "The offer matters more than the platform. A broad service is easy to ignore, but one clear result for one type of customer is much easier to understand and trust.";
  }

  if (intent === "reddit") {
    return "Reddit feels different because people can sense a funnel quickly. I would use it as research first, comment normally, and only mention something when it genuinely fits the discussion.";
  }

  if (intent === "ecommerce") {
    return "For ecommerce, I think the content has to start with the problem, not the product. People need to understand why it matters before they care about the store.";
  }

  if (intent === "ai") {
    return "AI can help, but only if there is enough current context and a human check. Full automation is where it starts to sound wrong. The useful part is finding the right conversation and drafting something you can still judge yourself.";
  }

  if (hasBody) {
    return `The part that stands out to me is this: ${pain}. I would answer that directly first instead of trying to turn it into a pitch.`;
  }

  return `I would keep this simple. The useful reply is probably a short personal take on ${niche || "the problem"}, not a polished explanation.`;
}

function makeReason(title: string, body: string, comments: number, ups: number, subreddit: string, sourceName: string) {
  const intent = detectIntent(title, body, comments, ups);
  const action = recommendedAction(title, body, comments, ups);
  const pain = extractPain(title, body);
  const context = body.trim() ? `Context: "${pain}"` : "Only title/body-light context available.";

  if (intent === "low-intel") {
    return `Skip reason: low engagement / not enough context. ${context} Engagement: ${comments} comments and ${ups} upvotes. Source: ${sourceName}.`;
  }

  if (action === "Skip") {
    return `Skip reason: high-risk or sensitive thread (${intent}). ${context} Engagement: ${comments} comments and ${ups} upvotes. Source: ${sourceName}.`;
  }

  if (action === "ManualOnly") {
    return `Intel: ${subreddit} thread is useful but sensitive (${intent}). ${context} Engagement: ${comments} comments and ${ups} upvotes. Source: ${sourceName}. Recommended action: use the draft as a starting point, then make it sound like your own quick opinion.`;
  }

  return `Intel: ${subreddit} thread appears to be about ${intent}. ${context} Engagement: ${comments} comments and ${ups} upvotes. Source: ${sourceName}. Recommended action: safe to reply, keep it short, no links.`;
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
    ["shopify", "ecommerce", "FulfillmentByAmazon", "Entrepreneur"].forEach((sub) => subs.add(sub));
  }

  if (hasAny(text, ["roof", "roofer", "plumber", "dentist", "local", "contractor", "real estate"])) {
    ["smallbusiness", "sales", "leadgeneration", "Entrepreneur", "marketing"].forEach((sub) => subs.add(sub));
  }

  if (hasAny(text, ["reddit", "subreddit", "community", "karma"])) {
    ["DigitalMarketing", "MarketingHelp", "socialmedia", "AskMarketing"].forEach((sub) => subs.add(sub));
  }

  if (hasAny(text, ["seo", "google", "rank", "search"])) {
    ["SEO", "bigseo", "marketing", "DigitalMarketing"].forEach((sub) => subs.add(sub));
  }

  return Array.from(subs).slice(0, 16);
}

function relevanceScore(post: RawPost, queryText: string) {
  const haystack = `${post.title} ${post.body} ${post.subreddit}`.toLowerCase();
  const subreddit = post.subreddit.replace(/^r\//i, "").toLowerCase();
  const tokens = wordTokens(queryText);
  let score = 0;

  if (SUBREDDIT_BLOCKLIST.some((blocked) => blocked.toLowerCase() === subreddit)) return -100;
  if (DEFAULT_BUSINESS_SUBS.map((sub) => sub.toLowerCase()).includes(subreddit)) score += 8;

  for (const token of tokens) {
    if (haystack.includes(token)) score += 4;
    if (post.title.toLowerCase().includes(token)) score += 6;
  }

  if (detectIntent(post.title, post.body, post.comments, post.ups) !== "general") score += 5;
  if (/[?]|\b(help|advice|struggling|problem|how do|what do|need|recommend|traffic|client|customer|lead|sale|sales)\b/i.test(`${post.title} ${post.body}`)) score += 6;
  score += Math.min(post.comments, 30) * 0.8;
  score += Math.min(post.ups, 50) * 0.25;

  if (hasLowIntel(post.body, post.comments, post.ups)) score -= 8;

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
    .map((post) => ({ post, score: relevanceScore(post, queryText) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.post);

  if (ranked.length) {
    postCache.set(cacheKey, { expires: Date.now() + CACHE_MS, posts: ranked, sourceName: winningSource });
    return { posts: ranked, sourceName: `${winningSource}+ranked` };
  }

  const broad = collected
    .filter((post) => !SUBREDDIT_BLOCKLIST.includes(post.subreddit.replace(/^r\//i, "")))
    .sort((a, b) => (b.comments + b.ups) - (a.comments + a.ups));

  if (broad.length) {
    postCache.set(cacheKey, { expires: Date.now() + CACHE_MS, posts: broad, sourceName: winningSource });
    return { posts: broad, sourceName: `${winningSource}+broad-backup` };
  }

  throw new Error(errors.slice(0, 8).join(" | ") || "all reddit endpoints failed");
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

    const visiblePosts = posts.filter((post) => recommendedAction(post.title, post.body, post.comments, post.ups) !== "Skip");

    const opportunities = visiblePosts.slice(0, 8).map((post) => {
      const action = recommendedAction(post.title, post.body, post.comments, post.ups);
      const score = opportunityScore(post.ups, post.comments, action);
      const risk = riskScore(post.title, post.body, action);

      return {
        subreddit: post.subreddit,
        title: post.title,
        url: post.permalink,
        niche,
        target,
        score,
        risk,
        action,
        reason: makeReason(post.title, post.body, post.comments, post.ups, post.subreddit, sourceName),
        suggestedReply: makeReply(post.title, post.body, niche, post.comments, post.ups),
      };
    });

    const skippedCount = posts.length - visiblePosts.length;

    return NextResponse.json({
      source: opportunities.length ? "live" : "empty",
      message: opportunities.length
        ? `Live Reddit posts loaded via ${sourceName}. Hid ${skippedCount} low-intel/risky posts.`
        : `No strong Reddit opportunities found. Hid ${skippedCount} low-intel/risky posts. Try broader keywords.`,
      opportunities,
    });
  } catch (error) {
    return NextResponse.json({
      source: "error",
      error: error instanceof Error ? error.message : "Unable to fetch live posts",
      message: "Live Reddit search failed. Reddit may be rate-limiting the server. Try again in a few minutes or change the search terms.",
      opportunities: [],
    });
  }
}
