import { NextResponse } from "next/server";

type RedditChild = {
  data?: {
    title?: string;
    subreddit_name_prefixed?: string;
    permalink?: string;
    selftext?: string;
    ups?: number;
    num_comments?: number;
    created_utc?: number;
    over_18?: boolean;
  };
};

type Action = "Reply" | "ManualOnly" | "Skip";

const fallbackPosts = [
  {
    subreddit: "r/DigitalMarketing",
    title: "Worth starting a marketing agency in 2026?",
    url: "https://www.reddit.com/r/DigitalMarketing/",
    niche: "agency growth",
    target: "freelancers and agencies",
    score: "High",
    risk: "Medium",
    action: "ManualOnly" as Action,
    reason: "Intel: broad agency thread. Good opportunity, but avoid sounding like a consultant. Use a short personal take.",
    suggestedReply:
      "I think agencies can still work, but the offer has to be really specific now. Broad marketing promises feel easy to ignore. One niche, one painful problem, one clear outcome is much easier to trust.",
  },
  {
    subreddit: "r/MarketingHelp",
    title: "I barely understand Reddit marketing",
    url: "https://www.reddit.com/r/MarketingHelp/",
    niche: "reddit marketing",
    target: "brands and agencies",
    score: "High",
    risk: "Low",
    action: "Reply" as Action,
    reason: "Intel: beginner-friendly Reddit marketing thread. Safe to add a useful observation, but keep it human and avoid links.",
    suggestedReply:
      "The biggest thing I am noticing is that Reddit rewards people who actually sound like they belong in the conversation. I would treat it as research first: comment normally, learn the niche, and only mention a product when it genuinely fits.",
  },
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

function recommendedAction(title: string, body: string): Action {
  const text = `${title} ${body}`.toLowerCase();
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

function detectIntent(title: string, body: string) {
  const text = `${title} ${body}`.toLowerCase();
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

function makeReply(title: string, body: string, niche: string) {
  const intent = detectIntent(title, body);
  const action = recommendedAction(title, body);
  const pain = extractPain(title, body);
  const hasBody = body.trim().length > 60;

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

function makeReason(title: string, body: string, comments: number, ups: number, subreddit: string) {
  const intent = detectIntent(title, body);
  const action = recommendedAction(title, body);
  const pain = extractPain(title, body);
  const context = body.trim() ? `Context: "${pain}"` : "Only title/body-light context available.";

  if (action === "Skip") {
    return `Intel: ${subreddit} thread is high risk (${intent}). ${context} Engagement: ${comments} comments and ${ups} upvotes. Recommended action: SKIP or write one short manual sentence only.`;
  }

  if (action === "ManualOnly") {
    return `Intel: ${subreddit} thread is useful but sensitive (${intent}). ${context} Engagement: ${comments} comments and ${ups} upvotes. Recommended action: use the draft as a starting point, then make it sound like your own quick opinion.`;
  }

  return `Intel: ${subreddit} thread appears to be about ${intent}. ${context} Engagement: ${comments} comments and ${ups} upvotes. Recommended action: safe to reply, keep it short, no links.`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keywords = clean(searchParams.get("keywords")) || "customers marketing ecommerce automation";
  const niche = clean(searchParams.get("niche")) || "online business";
  const target = clean(searchParams.get("target")) || "founders and marketers";

  const query = encodeURIComponent(`${keywords} ${niche}`);
  const searchUrl = `https://www.reddit.com/search.json?q=${query}&sort=new&t=week&limit=10&type=link`;

  try {
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "MarketVibeRedditRadar/1.2",
        Accept: "application/json",
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) throw new Error(`Reddit search failed: ${response.status}`);

    const payload = await response.json();
    const children = (payload?.data?.children || []) as RedditChild[];

    const opportunities = children
      .map((child) => child.data)
      .filter((post): post is NonNullable<RedditChild["data"]> => Boolean(post?.title && post?.permalink && !post?.over_18))
      .slice(0, 8)
      .map((post) => {
        const ups = Number(post.ups || 0);
        const comments = Number(post.num_comments || 0);
        const title = post.title || "Reddit discussion";
        const body = compactText(post.selftext || "");
        const subreddit = post.subreddit_name_prefixed || "r/Reddit";
        const action = recommendedAction(title, body);
        const score = opportunityScore(ups, comments, action);
        const risk = riskScore(title, body, action);

        return {
          subreddit,
          title,
          url: `https://www.reddit.com${post.permalink}`,
          niche,
          target,
          score,
          risk,
          action,
          reason: makeReason(title, body, comments, ups, subreddit),
          suggestedReply: makeReply(title, body, niche),
        };
      });

    return NextResponse.json({
      source: opportunities.length ? "live" : "fallback",
      opportunities: opportunities.length ? opportunities : fallbackPosts,
    });
  } catch (error) {
    return NextResponse.json({
      source: "fallback",
      error: error instanceof Error ? error.message : "Unable to fetch live posts",
      opportunities: fallbackPosts,
    });
  }
}
