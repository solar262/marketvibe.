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

export type RedditRadarRankablePost = {
  title: string;
  body: string;
  subreddit: string;
  permalink: string;
  comments: number;
  ups: number;
};

const LOW_INTEL_REPLY = "LOW INTEL — SKIP THIS ONE...\n\nThere isn't enough context or engagement to write a useful reply.\n\nLook for posts with a real question, clear problem, or active comments.";
const PAIN_SIGNAL_PATTERN = /\b(need help|help|problem|struggling|struggle|stuck|traffic|not converting|no traffic|no sales|website not working|what should i do|how do i get|how can i get|any advice|need advice|advice|looking for tool|recommend|shopify|ecommerce|customers|clients|leads|sales|prospects|prospecting|outreach|local businesses|web design clients|seo clients|agency lead generation|client acquisition)\b/i;
const JOB_POST_PATTERN = /\b(hiring|remote developer|salary|full-time|full time|part-time|part time|job|career|vacancy|looking for developer|apply now|worldwide|per month)\b|\$\s*\/\s*month|\$\s*\d[\d,]*(?:\.\d{2})?\s*\/\s*month/i;
const RSS_METADATA_PATTERN = /\bsubmitted by\b|\/u\/|\[comments\]|\bcomments link\b|\bpermalink\b|\breddit metadata\b|\bto \/r\/|\bfrom \/r\/|reddit\.com\/comments/i;
const MARKETVIBE_BUYER_INTENT_PATTERN = /\b(how do i find web design clients|how do i get seo clients|where to find local business leads|how to sell websites to local businesses|how to get clients as a freelancer|cold outreach for web design|local businesses that need websites|website redesign leads|lead generation for agencies|finding businesses with bad websites|prospecting for web design|selling seo services|agency lead generation|client acquisition for web designers|web design clients|seo clients|local business leads|sell websites to local businesses|get clients as a freelancer|client acquisition|cold outreach|website redesign|redesign leads|bad websites|prospecting|businesses to pitch|find clients|find leads|get clients|get leads|lead generation|local leads|agency leads|outreach help)\b/i;
const NON_BUYER_INTENT_PATTERN = /\b(shopify setup|new to shopify|claude setup|store automation|automating the setup|dropshipping|dropshipping beginners|fixing my website|fix my website|technical help|general business advice|business advice|setup help)\b/i;
const BROAD_PROBLEM_INTENT_PATTERN = /\b(need help|struggling|problem|no sales|no traffic|not converting|customers|leads|where to sell|how do i|any advice|looking for tool|recommend|stuck|stock not moving|inventory problem|quote problem|customer problem|no customers|not selling|abandoned cart|product page)\b/i;
const SPAM_PROMO_PATTERN = /\b(check out my|use my code|promo code|limited offer|dm me|buy now|launching my|i built this|my app|my course|subscribe|newsletter)\b/i;

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

export function hasMarketVibeBuyerIntent(title: string, body: string) {
  return MARKETVIBE_BUYER_INTENT_PATTERN.test(`${title} ${body}`);
}

export function isRejectedNonBuyerIntent(title: string, body: string) {
  const text = `${title} ${body}`;
  return NON_BUYER_INTENT_PATTERN.test(text) && !hasMarketVibeBuyerIntent(title, body);
}

export function hasRedditRadarProblemIntent(title: string, body: string) {
  const text = `${title} ${body}`;
  return hasMarketVibeBuyerIntent(title, body) || BROAD_PROBLEM_INTENT_PATTERN.test(text);
}

export function isSpamOrPromotion(title: string, body: string) {
  return SPAM_PROMO_PATTERN.test(`${title} ${body}`);
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

function hasSneakerIntent(text: string) {
  return /\b(sneaker|sneakers|shoes|shoe resell|reselling shoes|flipping shoes|sneaker flipping|stock not moving)\b/i.test(text);
}

function hasBookIntent(text: string) {
  return /\b(book seller|book selling|selling books|used books|book reseller|bookstore|self published|self-published|books online)\b/i.test(text);
}

function hasRoofingIntent(text: string) {
  return /\b(roofer|roofers|roofing|roof leak|roof repair|storm damage|roofing quote|roofing leads)\b/i.test(text);
}

export function expandRedditRadarQueries(niche: string, customer = "", keywords = "") {
  const base = [niche, customer, keywords].map(compactRedditText).filter(Boolean);
  const primary = base[0] || base.join(" ");
  const queries = new Set<string>();
  const add = (value: string) => {
    const cleaned = compactRedditText(value).toLowerCase();
    if (cleaned) queries.add(cleaned);
  };

  add(base.join(" "));
  for (const seed of base) {
    ["need help", "problem", "struggling", "no sales", "customers", "where to sell", "how do i", "advice", "looking for tool"].forEach((pain) => add(`${seed} ${pain}`));
  }

  const text = base.join(" ").toLowerCase();
  if (/\b(sneaker|sneakers|shoe|shoes|resell|reseller|flipping)\b/.test(text)) {
    ["sneakers no sales", "reselling sneakers stuck", "sneaker inventory problem", "where to sell sneakers", "stock not moving", "reselling shoes advice", "sneaker flipping problem"].forEach(add);
  }
  if (/\b(book|books|bookstore|author|self publish|self-published)\b/.test(text)) {
    ["book selling no sales", "selling books online help", "used books inventory problem", "where to sell books online", "book reseller advice", "bookstore no customers", "self published book not selling"].forEach(add);
  }
  if (/\b(roof|roofer|roofing|contractor)\b/.test(text)) {
    ["roof leak help", "roofing quote problem", "storm damage roof advice", "roofing leads", "roof repair customer problem", "roofer no leads"].forEach(add);
  }
  if (/\b(ecommerce|shopify|online store|store|cart|product page)\b/.test(text)) {
    ["shopify no traffic", "store not converting", "abandoned cart problem", "product page not converting", "ecommerce no sales", "need help with online store"].forEach(add);
  }
  if (!queries.size && primary) add(primary);

  return Array.from(queries).slice(0, 40);
}

export function expandRedditRadarSubreddits(queryText: string) {
  const text = queryText.toLowerCase();
  const subs = new Set(["smallbusiness", "Entrepreneur", "startups", "marketing", "DigitalMarketing", "sales", "ecommerce"]);
  if (/\b(sneaker|sneakers|shoe|shoes|resell|reselling|flipping)\b/.test(text)) {
    ["Flipping", "reselling", "Sneakers", "SneakerMarket"].forEach((sub) => subs.add(sub));
  }
  if (/\b(book|books|bookstore|author|self publish|self-published)\b/.test(text)) {
    ["bookselling", "selfpublish", "Flipping"].forEach((sub) => subs.add(sub));
  }
  if (/\b(roof|roofer|roofing|contractor|home improvement)\b/.test(text)) {
    ["HomeImprovement", "Roofing", "Contractor", "smallbusiness"].forEach((sub) => subs.add(sub));
  }
  if (/\b(web design|website|seo|agency|freelance|client|lead|prospect|outreach)\b/.test(text)) {
    ["web_design", "freelance", "SEO", "bigseo", "agency"].forEach((sub) => subs.add(sub));
  }
  return Array.from(subs).slice(0, 18);
}

export function dedupeRedditRadarPosts<T extends { title: string; permalink: string }>(posts: T[]) {
  const seen = new Set<string>();
  return posts.filter((post) => {
    const key = compactRedditText(post.permalink || post.title).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function scoreRedditRadarPost(post: RedditRadarRankablePost, queryText = "") {
  const text = `${post.title} ${post.body}`.toLowerCase();
  if (isBlockedJobPost(post.title, post.body) || isRejectedNonBuyerIntent(post.title, post.body) || isObviousRssJunk(post.title, post.body) || isSpamOrPromotion(post.title, post.body)) return -100;
  if (!hasRedditRadarProblemIntent(post.title, post.body)) return 0;

  let score = 35;
  if (BROAD_PROBLEM_INTENT_PATTERN.test(text)) score += 24;
  if (hasMarketVibeBuyerIntent(post.title, post.body)) score += 14;
  if (text.includes("?")) score += 8;
  if (/\b(no sales|no traffic|not converting|stuck|struggling|where to sell|need help|problem|any advice|recommend|looking for tool)\b/i.test(text)) score += 16;
  if (/\b(customers|leads|prospects|buyers|clients)\b/i.test(text)) score += 8;
  if (queryText && queryText.toLowerCase().split(/\s+/).some((word) => word.length > 4 && text.includes(word))) score += 6;
  score += Math.min(post.comments, 20) * 0.8;
  score += Math.min(post.ups, 40) * 0.2;
  if (/\b(thoughts on|hot take|favorite|showcase|i built|launching)\b/i.test(text)) score -= 18;
  return Math.round(score);
}

export function rankRedditRadarPosts<T extends RedditRadarRankablePost>(posts: T[], queryText = "") {
  return dedupeRedditRadarPosts(posts)
    .map((post) => ({ post, score: scoreRedditRadarPost(post, queryText) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.post);
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

  if (isBlockedJobPost(title, body) || isRejectedNonBuyerIntent(title, body) || isLowIntelPost(body, comments, ups) && !hasUsablePostSignal(title, body, comments, ups)) {
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

  if (hasSneakerIntent(text)) {
    return {
      quickReply: replyParts("I'd first check whether this is a demand problem or a pricing/platform problem.", "If stock is not moving, compare sold listings before changing where you sell."),
      deeperReply: replyParts("I'd first check demand, pricing and platform fit separately.", "For sneakers, sold listings matter more than asking prices. If pairs sit too long, it can be the model, size, condition, timing, photos, fees, or the marketplace.", "I'd test one change at a time before buying more stock."),
      manualNote,
    };
  }

  if (hasBookIntent(text)) {
    return {
      quickReply: replyParts("I'd look at listings, niche and pricing before assuming the books are the problem.", "Used books can sit if the marketplace or keywords are wrong, even when the inventory is fine."),
      deeperReply: replyParts("I'd separate inventory quality from listing quality.", "For books, niche demand, edition/condition, photos, keywords, shipping cost and marketplace choice all matter.", "Check sold comps first, then improve the listing before buying more inventory."),
      manualNote,
    };
  }

  if (hasRoofingIntent(text)) {
    return {
      quickReply: replyParts("I'd answer the homeowner concern first: leak, quote, timing or trust.", "For roofing, people usually need clarity and confidence before they care who gets the job."),
      deeperReply: replyParts("I'd focus on the exact homeowner concern first.", "Leaks, storm damage, quote confusion and trust are different problems.", "Clear photos, simple explanation, proof of local work and fast follow-up usually matter more than a generic sales pitch."),
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
        "I'd start by narrowing the prospect list before writing outreach.",
        "Look for visible local business problems first, like weak sites, unclear CTAs, missing trust signals, or old SEO basics."
      ),
      deeperReply: replyParts(
        "I'd start by narrowing the prospect list before writing outreach.",
        `The useful clue is: ${context}.`,
        "For web design or SEO, finding visible local business problems gives you a more natural reason to reach out than a generic pitch.",
        "Then keep the first message about the problem you noticed, not about your service."
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
    quickReply: replyParts(
      "I'd start with a tighter prospecting angle.",
      "Find local businesses with visible website or SEO gaps, then reach out about one specific thing you noticed."
    ),
    deeperReply: replyParts(
      "I'd start with a tighter prospecting angle.",
      `The useful clue is: ${context}.`,
      "For web design, SEO, or local lead gen, visible business problems make outreach feel less random.",
      "Bad websites, weak CTAs, missing service pages, thin Google presence, or unclear contact flows are good places to look."
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
