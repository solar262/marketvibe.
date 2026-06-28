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

const fallbackPosts = [
  {
    subreddit: "r/DigitalMarketing",
    title: "Worth starting a marketing agency in 2026?",
    url: "https://www.reddit.com/r/DigitalMarketing/",
    niche: "agency growth",
    target: "freelancers and agencies",
    score: "High",
    risk: "Low",
    reason: "Sample fallback: this is a broad discussion about whether agencies still work and how to make an offer credible.",
    suggestedReply:
      "I think agencies can still work, but the broad 'we do marketing' offer feels much harder to trust now. The ones that make sense to me are specific: one niche, one problem, one clear outcome. For example, lead gen for dentists is easier to understand than a general agency promising growth.",
  },
  {
    subreddit: "r/MarketingHelp",
    title: "I barely understand Reddit marketing",
    url: "https://www.reddit.com/r/MarketingHelp/",
    niche: "reddit marketing",
    target: "brands and agencies",
    score: "High",
    risk: "Low",
    reason: "Sample fallback: the thread is about how brands can join Reddit without looking fake or corporate.",
    suggestedReply:
      "The biggest thing I am noticing is that Reddit does not really reward polished marketing. It rewards people who sound like they actually belong in the conversation. I would treat Reddit as research first: comment for a while, learn how each niche talks, then only mention a product when it genuinely fits the problem.",
  },
];

function clean(value: string | null) {
  return (value || "").replace(/[<>]/g, "").slice(0, 220);
}

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 700);
}

function opportunityScore(ups: number, comments: number): "High" | "Medium" | "Low" {
  if (comments >= 15 || ups >= 20) return "High";
  if (comments >= 5 || ups >= 8) return "Medium";
  return "Low";
}

function riskScore(title: string, body: string): "Low" | "Medium" | "High" {
  const text = `${title} ${body}`.toLowerCase();
  if (text.includes("hire") || text.includes("promote") || text.includes("self promotion") || text.includes("spam") || text.includes("buy my")) return "High";
  if (text.includes("link") || text.includes("website") || text.includes("agency") || text.includes("client")) return "Medium";
  return "Low";
}

function detectIntent(title: string, body: string) {
  const text = `${title} ${body}`.toLowerCase();
  if (text.includes("what do you use") || text.includes("tool") || text.includes("software") || text.includes("stack")) return "tools";
  if (text.includes("traffic") || text.includes("visitors") || text.includes("paid ads") || text.includes("organic")) return "traffic";
  if (text.includes("client") || text.includes("customer") || text.includes("lead") || text.includes("agency")) return "customers";
  if (text.includes("reddit") || text.includes("subreddit") || text.includes("karma")) return "reddit";
  if (text.includes("shopify") || text.includes("store") || text.includes("ecommerce")) return "ecommerce";
  if (text.includes("ai") || text.includes("automation") || text.includes("agent")) return "ai";
  return "general";
}

function extractPain(title: string, body: string) {
  const text = `${title}. ${body}`.replace(/\s+/g, " ").trim();
  const sentences = text.split(/[.!?]/).map((item) => item.trim()).filter(Boolean);
  const pain = sentences.find((sentence) => /struggl|hard|problem|confus|not working|fail|help|stuck|traffic|client|customer|lead/i.test(sentence));
  return pain || sentences[0] || title;
}

function makeReply(title: string, body: string, niche: string, subreddit: string) {
  const intent = detectIntent(title, body);
  const pain = extractPain(title, body);
  const hasBody = body.trim().length > 60;
  const contextLine = hasBody ? `Based on the post, it sounds like the main issue is: ${pain}.` : "Based on the title, I would keep the answer practical rather than trying to pitch anything.";

  if (intent === "tools") {
    return `${contextLine}\n\nFor me, tools only help once the workflow is clear. I would separate it into: 1) where the audience hangs out, 2) what problem they are talking about, 3) what useful reply you can add, and 4) what to track after. A simple spreadsheet plus a good search process can beat a fancy tool if the offer is not clear yet.`;
  }

  if (intent === "traffic") {
    return `${contextLine}\n\nI would not start by chasing every traffic channel. I would pick one customer type, find the exact questions they ask, and answer those repeatedly in places where they already spend time. Reddit, Pinterest, YouTube Shorts, and SEO can all work, but only if the content is tied to a real problem rather than just pushing products.`;
  }

  if (intent === "customers") {
    return `${contextLine}\n\nThe thing that seems to matter most is being specific. A broad offer is easy to ignore, but a clear offer for one niche is easier to trust. I would focus on one customer type, one painful problem, and one simple result before trying to scale outreach.`;
  }

  if (intent === "reddit") {
    return `${contextLine}\n\nReddit seems to work better when you treat it as community research first. Comment normally, learn how the niche talks, and build a history before asking for anything. The moment it sounds like a funnel, people usually push back.`;
  }

  if (intent === "ecommerce") {
    return `${contextLine}\n\nFor ecommerce, I think the mistake is trying to sell before proving why the product matters. I would build content around the problem the product solves, then use Reddit/comments/search content to learn the objections people actually have before sending them to a store.`;
  }

  if (intent === "ai") {
    return `${contextLine}\n\nAI helps, but it needs current context and a human check. The useful setup is not full auto-posting. It is finding the right conversations, summarising the situation, drafting a natural reply, and letting a person decide whether it actually fits.`;
  }

  return `${contextLine}\n\nI would approach this by looking at the real conversation first, then replying with something useful from experience rather than trying to direct people somewhere. That usually comes across better and gives you a better chance of people checking your profile naturally.`;
}

function makeReason(title: string, body: string, comments: number, ups: number, subreddit: string) {
  const intent = detectIntent(title, body);
  const pain = extractPain(title, body);
  const context = body.trim() ? `Post context: "${compactText(pain)}"` : "Only title/body-light context available, so reply should stay careful and general.";
  return `Intel: ${subreddit} thread appears to be about ${intent}. ${context} Engagement: ${comments} comments and ${ups} upvotes. Best approach: answer the pain directly, no links.`;
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
        "User-Agent": "MarketVibeRedditRadar/1.1",
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
        const score = opportunityScore(ups, comments);
        const risk = riskScore(title, body);

        return {
          subreddit,
          title,
          url: `https://www.reddit.com${post.permalink}`,
          niche,
          target,
          score,
          risk,
          reason: makeReason(title, body, comments, ups, subreddit),
          suggestedReply: makeReply(title, body, niche, subreddit),
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
