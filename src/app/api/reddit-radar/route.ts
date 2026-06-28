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
    reason: "Sample fallback: people are discussing customer acquisition, positioning, and whether agencies still work.",
    suggestedReply:
      "I think the agency model still works, but only when the offer is very specific. Broad 'I do marketing' feels hard to sell now. Something like lead generation for one niche, automation for one type of business, or fixing one clear revenue problem is easier to trust and easier to explain.",
  },
  {
    subreddit: "r/MarketingHelp",
    title: "I barely understand Reddit marketing",
    url: "https://www.reddit.com/r/MarketingHelp/",
    niche: "reddit marketing",
    target: "brands and agencies",
    score: "High",
    risk: "Low",
    reason: "Sample fallback: the post asks how brands can join Reddit conversations without looking fake or corporate.",
    suggestedReply:
      "From what I am seeing, Reddit rewards people who sound like they belong in the conversation and punishes anything that feels like marketing. The safer play is to comment usefully for weeks, learn the language of each niche, and let people check your profile naturally instead of forcing links into posts.",
  },
];

function clean(value: string | null) {
  return (value || "").replace(/[<>]/g, "").slice(0, 160);
}

function opportunityScore(ups: number, comments: number): "High" | "Medium" | "Low" {
  if (comments >= 15 || ups >= 20) return "High";
  if (comments >= 5 || ups >= 8) return "Medium";
  return "Low";
}

function riskScore(title: string, body: string): "Low" | "Medium" | "High" {
  const text = `${title} ${body}`.toLowerCase();
  if (text.includes("hire") || text.includes("promote") || text.includes("self promotion") || text.includes("spam")) return "High";
  if (text.includes("link") || text.includes("website") || text.includes("agency")) return "Medium";
  return "Low";
}

function makeReply(title: string, niche: string) {
  const lower = title.toLowerCase();

  if (lower.includes("reddit")) {
    return "I think Reddit works best when you treat it as research and conversation first, not a traffic source. The safest move is to be useful in a niche for a while, learn how people talk, and only mention a product or service when it directly answers the problem.";
  }

  if (lower.includes("shopify") || lower.includes("store") || lower.includes("traffic")) {
    return "For organic traffic, I would start by finding the exact problem customers are already searching or complaining about, then create helpful posts around that problem before pushing products. Reddit comments, Pinterest, short videos, and comparison-style articles can work together if the offer is clear.";
  }

  if (lower.includes("agency") || lower.includes("client") || lower.includes("customers")) {
    return "The offer probably matters more than the platform. A broad service is hard to trust, but a specific result for one niche is easier to understand. I would start with one customer type, one pain point, and a simple proof-based reply instead of trying to pitch everything at once.";
  }

  return `This is an interesting ${niche || "business"} question. I would approach it by looking at the real conversations people are already having, then replying with practical advice before mentioning any tool or service. That usually feels more natural than trying to send people straight to a landing page.`;
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
        "User-Agent": "MarketVibeRedditRadar/1.0",
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
        const body = post.selftext || "";
        const score = opportunityScore(ups, comments);
        const risk = riskScore(title, body);

        return {
          subreddit: post.subreddit_name_prefixed || "r/Reddit",
          title,
          url: `https://www.reddit.com${post.permalink}`,
          niche,
          target,
          score,
          risk,
          reason: `Live result: ${comments} comments and ${ups} upvotes. Good fit if you can add useful advice without posting links.`,
          suggestedReply: makeReply(title, niche),
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
