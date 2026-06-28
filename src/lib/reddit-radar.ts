export type RedditRadarAction = "Reply" | "ManualOnly" | "Skip";

export type RedditRadarIntel = {
  action: RedditRadarAction;
  intent: string;
  reply: string;
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

function shortContext(title: string, body: string) {
  const text = compactRedditText(body || title);
  const sentences = text.split(/[.!?]/).map((item) => item.trim()).filter(Boolean);
  return sentences.find((sentence) => PAIN_SIGNAL_PATTERN.test(sentence)) || sentences[0] || title;
}

export function buildSuggestedReply(input: ReplyInput) {
  const { title, body, intent, niche, target, subreddit, action, comments, ups } = input;
  const text = `${title} ${body} ${niche} ${target} ${subreddit}`.toLowerCase();
  const context = shortContext(title, body);

  if (isBlockedJobPost(title, body) || isLowIntelPost(body, comments, ups) && !hasUsablePostSignal(title, body, comments, ups)) {
    return LOW_INTEL_REPLY;
  }

  if (action === "Skip") {
    return replyParts("SKIP THIS ONE.", "This looks risky or too thin to answer usefully.");
  }

  const manualPrefix = action === "ManualOnly" ? "Rough starting point:" : "";

  if (hasTerm(text, ["inventory", "stock", "reorder", "stockout", "warehouse"])) {
    return replyParts(
      manualPrefix,
      "I'd separate the boring useful stuff from the shiny stuff.",
      "Forecasting, reorder alerts, stockout warnings and messy spreadsheet cleanup are worth testing.",
      "Fully automated buying decisions are where I'd be more careful."
    );
  }

  if (intent === "tools" || hasTerm(text, [" vs ", "worth using", "hype", "compare", "comparison", "looking for tool", "recommend"])) {
    return replyParts(
      manualPrefix,
      "I'd compare them on the boring parts first.",
      "Does it save time on the exact workflow, does it handle messy inputs, and can you undo bad output easily?",
      "The flashier features matter less than that."
    );
  }

  if (intent === "ecommerce" || hasTerm(text, ["shopify", "ecommerce", "store", "product page", "checkout", "cart"])) {
    if (hasTerm(text, ["no traffic", "traffic", "visitors"])) {
      return replyParts(
        manualPrefix,
        "I'd split this into two separate problems: getting the right traffic, then getting that traffic to trust the store.",
        "If visits are low, fix the channel and offer first.",
        "If visits are decent, I'd look at the product page, proof, checkout friction and abandoned carts."
      );
    }

    return replyParts(
      manualPrefix,
      "I'd look at where people hesitate in the store.",
      "Usually it's product page clarity, trust, shipping/returns, checkout friction, or carts getting abandoned.",
      "One of those will tell you more than changing everything at once."
    );
  }

  if (intent === "reddit" || hasTerm(text, ["reddit", "subreddit", "karma", "community"])) {
    return replyParts(
      manualPrefix,
      "I'd start with community fit before posting anything.",
      "Read the comments that already get upvoted, use the same niche language, and don't drop links early.",
      "A useful comment history matters more here than a clever pitch."
    );
  }

  if (intent === "traffic") {
    return replyParts(
      manualPrefix,
      "I'd first figure out whether this is a traffic problem or an offer problem.",
      `The part I'd dig into is: ${context}.`,
      "One clear channel and one clear customer type will make the next move easier."
    );
  }

  if (intent === "customers") {
    return replyParts(
      manualPrefix,
      `For ${target || "that audience"}, I'd make the offer more specific before changing channels.`,
      `The useful clue is: ${context}.`,
      "A clear problem/result usually beats a broader service pitch."
    );
  }

  if (intent === "ai") {
    return replyParts(
      manualPrefix,
      "I'd use AI for the parts that are repetitive and easy to check.",
      "The risky bit is letting it make decisions without enough context.",
      "A human review step is usually where it stays useful."
    );
  }

  return replyParts(
    manualPrefix,
    `I'd answer the specific bit first: ${context}.`,
    `For ${niche || "this"}, I'd keep the reply practical and skip the pitch.`
  );
}

export function lowIntelIntel(): RedditRadarIntel {
  return {
    action: "Skip",
    intent: "low-intel",
    reply: LOW_INTEL_REPLY,
  };
}
