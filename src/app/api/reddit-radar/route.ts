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
  "MarketVibeRedditRadar/1.5 by marketvibe1.com",
  "Mozilla/5.0 (compatible; MarketVibeRadar/1.5; +https://marketvibe1.com)",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
];

function clean(value: string | null) {
  return (value || "").replace(/[<>]/g, "").slice(0, 220);
}

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 900);
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/<[^>]*>/g, "")
    .trim();
}

function hasLowIntel(body: string, comments: number, ups: number) {
  return compactText(body).length < 80 && comments === 0 && ups === 0;
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
  if (hasAny(text, ["agency", "client", "hire", "website", "link", "promote", "ai", "automation"])) return "ManualOnly";
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
  if (hasAny(text, ["hire", "promote", "self promotion", "link", "website", "agency", "client"])) return "Medium";
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
  if (hasAny(text, ["ai", "automation", "agent"])) return "ai";
  return "general";
}

function extractPain(title: string, body: string) {
  const text = `${title}. ${body}`.replace(/\s+/g, " ").trim();
  const sentences = text.split(/[.!?]/).map((item) => item.trim()).filter(Boolean);
  const pain = sentences.find((sentence) => /struggl|hard|problem|confus|not working|fail|help|stuck|traffic|client|customer|lead|fake|ai|human/i.test(sentence));
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
    return `Intel: ${subreddit} has too little context or engagement. ${context} Engagement: ${comments} comments and ${ups} upvotes. Source: ${sourceName}. Recommended action: SKIP.`;
  }

  if (action === "Skip") {
    return `Intel: ${subreddit} thread is high risk (${intent}). ${context} Engagement: ${comments} comments and ${ups} upvotes. Source: ${sourceName}. Recommended action: SKIP or write one short manual sentence only.`;
  }

  if (action === "ManualOnly") {
    return `Intel: ${subreddit} thread is useful but sensitive (${intent}). ${context} Engagement: ${comments} comments and ${ups} upvotes. Source: ${sourceName}. Recommended action: use the draft as a starting point, then make it sound like your own quick opinion.`;
  }

  return `Intel: ${subreddit} thread appears to be about ${intent}. ${context} Engagement: ${comments} comments and ${ups} upvotes. Source: ${sourceName}. Recommended action: safe to reply, keep it short, no links.`;
}

async function fetchWithTimeout(url: string, userAgent: string, timeoutMs = 6500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
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

  return entries.slice(0, 10).map((entry) => {
    const title = decodeHtml(entry.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] || "Reddit discussion");
    const link = decodeHtml(entry.match(/<link[^>]*href="([^"]+)"/)?.[1] || "https://www.reddit.com/search/");
    const body = compactText(decodeHtml(entry.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] || ""));
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

async function searchReddit(queryText: string) {
  const encoded = encodeURIComponent(queryText);
  const endpoints = [
    { name: "reddit-json", url: `https://www.reddit.com/search.json?q=${encoded}&sort=new&t=week&limit=10&type=link&raw_json=1`, type: "json" },
    { name: "old-reddit-json", url: `https://old.reddit.com/search.json?q=${encoded}&sort=new&t=week&limit=10&type=link&raw_json=1`, type: "json" },
    { name: "reddit-all-json", url: `https://www.reddit.com/r/all/search.json?q=${encoded}&restrict_sr=0&sort=new&t=week&limit=10&raw_json=1`, type: "json" },
    { name: "reddit-rss", url: `https://www.reddit.com/search.rss?q=${encoded}&sort=new&t=week`, type: "rss" },
    { name: "old-reddit-rss", url: `https://old.reddit.com/search.rss?q=${encoded}&sort=new&t=week`, type: "rss" },
  ];

  const errors: string[] = [];

  for (const endpoint of endpoints) {
    for (const userAgent of USER_AGENTS) {
      try {
        const response = await fetchWithTimeout(endpoint.url, userAgent);
        const text = await response.text();

        if (!response.ok) {
          errors.push(`${endpoint.name}:${response.status}`);
          continue;
        }

        const posts = endpoint.type === "json" ? parseJsonPosts(JSON.parse(text)) : parseRssPosts(text);

        if (posts.length) {
          return { posts, sourceName: endpoint.name };
        }

        errors.push(`${endpoint.name}:empty`);
      } catch (error) {
        errors.push(`${endpoint.name}:${error instanceof Error ? error.message : "failed"}`);
      }
    }
  }

  throw new Error(errors.slice(0, 6).join(" | ") || "all reddit endpoints failed");
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

    const opportunities = posts.slice(0, 8).map((post) => {
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

    return NextResponse.json({
      source: opportunities.length ? "live" : "empty",
      message: opportunities.length ? `Live Reddit posts loaded via ${sourceName}.` : "No live Reddit posts found for that search. Try different keywords.",
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
