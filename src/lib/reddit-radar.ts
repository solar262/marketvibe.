export type RedditRadarAction = "Reply" | "ManualOnly" | "Skip";

export type RedditRadarIntel = {
  action: RedditRadarAction;
  intent: string;
  reply: string;
};

export type RedditRadarReplyOptions = {
  quickReply: string;
  deeperReply: string;
  manualNote: string;
};

type ReplyInput = {
  title: string;
  body: string;
  intent: string;
  niche: string;
  target: string;
  subreddit: string;
  action: RedditRadarAction;
  comments: number;
  ups: number;
};

const LOW_INTEL_REPLY = "LOW INTEL — SKIP THIS ONE...\n\nThere isn't enough context or engagement to write a useful reply.\n\nLook for posts with a real question, clear problem, or active comments.";
const PAIN_SIGNAL_PATTERN = /\b(need help|help|problem|struggling|struggle|stuck|traffic|not converting|no traffic|no sales|website not working|what should i do|how do i get|how can i get|any advice|need advice|advice|looking for tool|recommend|shopify|ecommerce|customers|clients|leads|sales|can't|cant|conversion)\b/i;
const JOB_POST_PATTERN = /\b(hiring|remote developer|salary|full-time|full time|part-time|part time|job|career|vacancy|looking for developer|apply now|worldwide|per month)\b|\$\s*\/\s*month|\$\s*\d[\d,]*(?:\.\d{2})?\s*\/\s*month/i;
const RSS_METADATA_PATTERN = /\bsubmitted by\b|\/u\/|\[comments\]|\bcomments link\b|\bpermalink\b|\breddit metadata\b|\bto \/r\/|\bfrom \/r\/|reddit\.com\/comments/i;

export function compactRedditText(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 900);
}

export function hasAnyTerm(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export function hasAiIntent(text: string) {
  return /(^|[^a-z0-9])(?:ai|a\.i\.|artificial intelligence|chatgpt|automation|automated|agent|agents)(?=$|[^a-z0-9])/i.test(text);
}

export function cleanRssBody(value: string) {
  const decoded = value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, " ");

  const lines = decoded
    .split(/\r?\n/)
    .map((line) => compactRedditText(line))
    .filter((line) => line && !RSS_METADATA_PATTERN.test(line));
  const body = compactRedditText(lines.join(" "));

  if (!body) return "";
  if (RSS_METADATA_PATTERN.test(body)) return "";
  if (body.length < 120) return "";

  return body;
}

export function isObviousRssJunk(title: string, body: string) {
  const combined = compactRedditText(`${title} ${body}`);
  if (!combined) return true;
  const metadataOnly = RSS_METADATA_PATTERN.test(combined) && !PAIN_SIGNAL_PATTERN.test(combined) && !combined.includes("?");
  return metadataOnly || /^(submitted by|comments|permalink|reddit metadata)$/i.test(combined);
}

export function isBlockedJobPost(title: string, body: string) {
  return JOB_POST_PATTERN.test(`${title} ${body}`);
}

export function hasUsablePostSignal(title: string, body: string, comments: number, ups: number) {
  const text = `${title} ${body}`;
  return title.includes("?") || PAIN_SIGNAL_PATTERN.test(text) || comments > 0 || ups > 0;
}

export function hasCustomerProblemSignal(title: string, body: string) {
  return PAIN_SIGNAL_PATTERN.test(`${title} ${body}`);
}

export function usefulBodyLength(body: string) {
  return compactRedditText(body).length;
}

export function isLowIntelPost(body: string, comments: number, ups: number) {
  return usefulBodyLength(body) < 120 && comments === 0 && ups === 0;
}

function replyParts(...parts: string[]) {
  return parts
    .map((part) => compactRedditText(part))
    .filter(Boolean)
    .join("\n\n")
    .replace(/\bI would\b/g, "I'd")
    .replace(/\bdo not\b/g, "don't")
    .replace(/\bthat is\b/g, "that's")
    .replace(/\bthere is\b/g, "there's");
}

function hasTerm(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term));
}

function hasInventoryIntent(text: string) {
  return /\b(inventory|stock|stocks|reorder|warehouse|forecasting|stockout|stockouts|sku|skus|supply chain)\b/i.test(text);
}

function hasShopifySetupIntent(text: string) {
  return /\bshopify\b/i.test(text) && /\b(setup|set up|setting up|new to|claude|automation|automating|theme|navigation|checkout|policies|seo|products?)\b/i.test(text);
}

function shortContext(title: string, body: string) {
  const text = compactRedditText(body || title);
  const sentences = text.split(/[.!?]/).map((item) => item.trim()).filter(Boolean);
  return sentences.find((sentence) => PAIN_SIGNAL_PATTERN.test(sentence)) || sentences[0] || title;
}

export function buildReplyOptions(input: ReplyInput): RedditRadarReplyOptions {
  const { title, body, intent, niche, target, subreddit, action, comments, ups } = input;
  const text = `${title} ${body} ${niche} ${target} ${subreddit}`.toLowerCase();
  const context = shortContext(title, body);

  if (isBlockedJobPost(title, body) || isLowIntelPost(body, comments, ups) && !hasUsablePostSignal(title, body, comments, ups)) {
    return {
      quickReply: LOW_INTEL_REPLY,
      deeperReply: "Not recommended",
      manualNote: "Skip this one. There is not enough context or engagement to write a useful Reddit reply.",
    };
  }

  if (action === "Skip") {
    return {
      quickReply: "SKIP THIS ONE.",
      deeperReply: "Not recommended",
      manualNote: "Skip this thread. It looks risky, sensitive, promotional, or too thin to answer safely.",
    };
  }

  const manualNote = action === "ManualOnly"
    ? "Edit before posting. Use this as a starting point and make sure it fits the thread tone."
    : comments > 0 || ups > 0
      ? "Good candidate. Post manually, keep it short, and do not add links."
      : "Use the quick reply by default. The deeper version only makes sense if the thread has more context.";

  if (hasShopifySetupIntent(text)) {
    return {
      quickReply: replyParts(
        "I'd use Claude as a helper, not the driver.",
        "Start with store structure, products, theme, navigation, checkout, policies and basic SEO before automating anything."
      ),
      deeperReply: replyParts(
        "I'd map the store manually first: collections, products, theme, navigation, checkout, policies and basic SEO.",
        "Then use Claude to draft copy, organize tasks, and check for gaps.",
        "I wouldn't blindly automate the setup until you know what the store actually needs."
      ),
      manualNote,
    };
  }

  if (hasInventoryIntent(text)) {
    return {
      quickReply: replyParts(
        "I'd separate the boring useful stuff from the shiny stuff.",
        "Forecasting, reorder alerts and stockout warnings are worth testing. Fully automated buying decisions are where I'd be careful."
      ),
      deeperReply: replyParts(
        "I'd separate the boring useful stuff from the shiny stuff.",
        "Forecasting, reorder alerts, stockout warnings and messy spreadsheet cleanup are worth testing.",
        "Fully automated buying decisions are where I'd be more careful, especially if the data is messy or seasonal."
      ),
      manualNote,
    };
  }

  if (intent === "tools" || hasTerm(text, [" vs ", "worth using", "hype", "compare", "comparison", "looking for tool", "recommend"])) {
    return {
      quickReply: replyParts(
        "I'd compare them on the boring parts first.",
        "Does it save time on the exact workflow, handle messy inputs, and let you undo bad output?"
      ),
      deeperReply: replyParts(
        "I'd compare them on the boring parts first.",
        "Does it save time on the exact workflow, does it handle messy inputs, and can you undo bad output easily?",
        "The flashier features matter less than that."
      ),
      manualNote,
    };
  }

  if (intent === "ecommerce" || hasTerm(text, ["shopify", "ecommerce", "store", "product page", "checkout", "cart"])) {
    if (hasTerm(text, ["no traffic", "traffic", "visitors"])) {
      return {
        quickReply: replyParts(
          "I'd split this into traffic first, conversion second.",
          "If visits are low, fix the channel and offer. If visits are decent, check the product page, trust signals and checkout friction."
        ),
        deeperReply: replyParts(
          "I'd split this into two separate problems: getting the right traffic, then getting that traffic to trust the store.",
          "If visits are low, fix the channel and offer first.",
          "If visits are decent, I'd look at the product page, proof, checkout friction and abandoned carts."
        ),
        manualNote,
      };
    }

    return {
      quickReply: replyParts(
        "I'd look at where people hesitate in the store.",
        "Product page clarity, trust, shipping/returns or checkout friction usually tells you more than changing everything."
      ),
      deeperReply: replyParts(
        "I'd look at where people hesitate in the store.",
        "Usually it's product page clarity, trust, shipping/returns, checkout friction, or carts getting abandoned.",
        "One of those will tell you more than changing everything at once."
      ),
      manualNote,
    };
  }

  if (intent === "reddit" || hasTerm(text, ["reddit", "subreddit", "karma", "community"])) {
    return {
      quickReply: replyParts(
        "I'd start with community fit before posting anything.",
        "Use the niche language people already use there, comment normally, and don't drop links early."
      ),
      deeperReply: replyParts(
        "I'd start with community fit before posting anything.",
        "Read the comments that already get upvoted, use the same niche language, and don't drop links early.",
        "A useful comment history matters more here than a clever pitch."
      ),
      manualNote,
    };
  }

  if (intent === "traffic") {
    return {
      quickReply: replyParts(
        "I'd first figure out whether this is a traffic problem or an offer problem.",
        `The part I'd dig into is: ${context}.`
      ),
      deeperReply: replyParts(
        "I'd first figure out whether this is a traffic problem or an offer problem.",
        `The part I'd dig into is: ${context}.`,
        "One clear channel and one clear customer type will make the next move easier."
      ),
      manualNote,
    };
  }

  if (intent === "customers") {
    return {
      quickReply: replyParts(
        `For ${target || "that audience"}, I'd make the offer more specific before changing channels.`,
        `The useful clue is: ${context}.`
      ),
      deeperReply: replyParts(
        `For ${target || "that audience"}, I'd make the offer more specific before changing channels.`,
        `The useful clue is: ${context}.`,
        "A clear problem/result usually beats a broader service pitch."
      ),
      manualNote,
    };
  }

  if (intent === "ai") {
    return {
      quickReply: replyParts(
        "I'd use AI for the repetitive parts that are easy to check.",
        "The risky bit is letting it make decisions without enough context."
      ),
      deeperReply: replyParts(
        "I'd use AI for the parts that are repetitive and easy to check.",
        "The risky bit is letting it make decisions without enough context.",
        "A human review step is usually where it stays useful."
      ),
      manualNote,
    };
  }

  return {
    quickReply: replyParts(`I'd answer the specific bit first: ${context}.`),
    deeperReply: replyParts(
      `I'd answer the specific bit first: ${context}.`,
      `For ${niche || "this"}, I'd keep the reply practical and skip the pitch.`
    ),
    manualNote,
  };
}

export function buildSuggestedReply(input: ReplyInput) {
  return buildReplyOptions(input).quickReply;
}

export function lowIntelIntel(): RedditRadarIntel {
  return {
    action: "Skip",
    intent: "low-intel",
    reply: LOW_INTEL_REPLY,
  };
}
