import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync("src/lib/reddit-radar.ts", "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    strict: true,
  },
});

const sandbox = { exports: {} };
vm.runInNewContext(transpiled.outputText, sandbox, { filename: "reddit-radar.js" });

const {
  buildReplyOptions,
  buildSuggestedReply,
  cleanRssBody,
  dedupeRedditRadarPosts,
  expandRedditRadarQueries,
  expandRedditRadarSubreddits,
  hasAiIntent,
  hasClearLeadIntent,
  hasCustomerProblemSignal,
  hasMarketVibeBuyerIntent,
  hasRedditRadarProblemIntent,
  hasUsablePostSignal,
  isBlockedJobPost,
  isGenericBusinessNoise,
  isLowIntelPost,
  isObviousRssJunk,
  isRejectedNonBuyerIntent,
  lowIntelIntel,
  rankRedditRadarPosts,
  scoreRedditRadarPost,
} = sandbox.exports;

assert.equal(hasAiIntent("Vail Daily needs a new tourism website"), false, "Vail Daily should not trigger AI intent");
assert.equal(hasAiIntent("Vail Daily lost car key fob"), false, "Vail Daily lost car key fob should not trigger AI intent");
assert.equal(hasAiIntent("Can ChatGPT help with support replies?"), true, "ChatGPT should trigger AI intent");
assert.equal(hasAiIntent("Looking for an A.I. automation workflow"), true, "A.I. and automation should trigger AI intent");
assert.equal(isBlockedJobPost("Hiring remote developer", "Full-time role, apply now, worldwide"), true, "Hiring remote developer post should be blocked");
assert.equal(isBlockedJobPost("My Shopify store has no traffic, what should I do?", ""), false, "Shopify pain post should not be blocked as a job");
assert.equal(hasMarketVibeBuyerIntent("How do I find web design clients?", "I need better local business leads."), true, "Web design client post should have MarketVibe buyer intent");
assert.equal(isRejectedNonBuyerIntent("New to Shopify. Need setup help through Claude.", "I need help fixing my own store."), true, "Shopify setup help should be rejected as non-buyer intent");
assert.equal(hasRedditRadarProblemIntent("Where to sell sneakers?", "My stock is not moving."), false, "Generic seller marketplace pain should not be the main Reddit Radar intent");
assert.equal(hasRedditRadarProblemIntent("How do I get more customers?", "I launched a business but have no leads or traffic."), true, "Customer acquisition pain should count as Reddit Radar problem intent");
assert.equal(hasClearLeadIntent("How do I get customers for my app?", "I launched but nobody is signing up."), true, "App customer acquisition question should be clear lead intent");
assert.equal(hasClearLeadIntent("My site gets traffic but no sales", "I need to understand what is not converting."), true, "Traffic but no sales should be clear lead intent");
assert.equal(hasClearLeadIntent("I need a way to find leads", "Cold outreach is not working."), true, "Lead-finding need should be clear lead intent");
assert.equal(hasClearLeadIntent("How can I promote without ads?", "Organic marketing is confusing."), true, "Promote without ads should be clear lead intent");
assert.equal(hasClearLeadIntent("I'm struggling to get clients", "Where should I look first?"), true, "Struggling to get clients should be clear lead intent");
assert.equal(isGenericBusinessNoise("What is your favorite productivity quote?", "Motivation Monday"), true, "Vague motivational posts should be noise");
assert.equal(isGenericBusinessNoise("Selling handmade products online", "Here is my journey and what I learned."), true, "Generic seller/story posts should be noise without clear pain");

const acquisitionQueries = expandRedditRadarQueries("MarketVibe", "founders and freelancers", "customer discovery lead generation");
assert.ok(acquisitionQueries.includes("how do i get more customers"), "Query should expand into customer acquisition search");
assert.ok(acquisitionQueries.includes("need help finding leads"), "Query should expand into lead generation search");
assert.ok(acquisitionQueries.includes("what tool can help me with organic marketing"), "Query should expand into organic marketing tool search");

const founderQueries = expandRedditRadarQueries("SaaS app", "startup founders", "growth");
assert.ok(founderQueries.includes("how do i grow my saas"), "SaaS query should expand into founder growth search");
assert.ok(founderQueries.includes("startup no customers"), "Founder query should expand into no-customers search");
assert.ok(founderQueries.includes("organic marketing for saas"), "Founder query should expand into organic marketing search");

const localQueries = expandRedditRadarQueries("booking software", "local service businesses", "visibility");
assert.ok(localQueries.includes("local business no leads"), "Local business query should expand into no-leads search");
assert.ok(localQueries.includes("how do i get bookings"), "Local business query should expand into booking search");
assert.ok(localQueries.includes("local business visibility problem"), "Local business query should expand into visibility search");

const ecommerceQueries = expandRedditRadarQueries("ecommerce", "store owners", "shopify");
assert.ok(ecommerceQueries.includes("ecommerce no sales"), "Ecommerce query should expand into ecommerce no-sales search");
assert.ok(ecommerceQueries.includes("online store no traffic"), "Ecommerce query should expand into online store no-traffic search");
assert.ok(ecommerceQueries.includes("product page not converting"), "Ecommerce query should expand into product page conversion search");

const founderSubs = expandRedditRadarSubreddits("saas founder customer acquisition problem");
assert.ok(founderSubs.includes("SaaS") && founderSubs.includes("startups"), "Founder query should search startup/SaaS communities");
const agencySubs = expandRedditRadarSubreddits("freelancer client acquisition problem");
assert.ok(agencySubs.includes("freelance") && agencySubs.includes("agency"), "Freelancer query should search client acquisition communities");

const rssJunk = cleanRssBody(`
  submitted by /u/example to /r/marketing
  [comments] comments link reddit metadata
`);
assert.equal(rssJunk, "", "RSS metadata junk should be removed");

const usefulRss = cleanRssBody(`
  I am struggling to get any qualified leads from my local service website. The homepage gets traffic, but people do not book calls and I cannot tell if the issue is the offer, the CTA, or the contact flow.
  submitted by /u/example [comments]
`);
assert.ok(usefulRss.includes("struggling"), "Useful RSS body should be preserved after metadata lines are removed");
assert.equal(usefulRss.includes("submitted by"), false, "RSS metadata should be removed from useful body text");

assert.equal(isLowIntelPost("", 0, 0), true, "0/0 empty post should be low-intel");
assert.equal(hasCustomerProblemSignal("My Shopify store has no traffic, what should I do?", ""), true, "Shopify traffic question should have customer pain");
assert.equal(hasUsablePostSignal("My Shopify store has no traffic, what should I do?", "", 0, 0), true, "Shopify traffic question can have a usable signal before buyer-intent filtering");
assert.equal(hasMarketVibeBuyerIntent("My Shopify store has no traffic, what should I do?", ""), false, "Shopify store-fixing post is not MarketVibe buyer intent");
assert.equal(hasRedditRadarProblemIntent("My Shopify store has no traffic, what should I do?", ""), true, "Shopify no-traffic post should still count as broader problem intent");
assert.equal(hasUsablePostSignal("Need help with traffic?", "", 0, 0), true, "Title questions with pain should remain usable");
assert.equal(hasUsablePostSignal("Quiet launch update", "", 2, 0), true, "Active comments should remain usable");
assert.equal(hasUsablePostSignal("Quiet launch update", "", 0, 0), false, "Thin inactive posts should not look usable");
assert.equal(isObviousRssJunk("submitted by /u/example", "[comments] comments link"), true, "Obvious RSS junk should be hidden");
assert.equal(isObviousRssJunk("Need help with no traffic?", ""), false, "Painful title-only posts should not be treated as RSS junk");
const lowIntel = lowIntelIntel();
assert.equal(lowIntel.action, "Skip");
assert.equal(lowIntel.intent, "low-intel");
assert.equal(lowIntel.reply, "LOW INTEL — SKIP THIS ONE...\n\nThere isn't enough context or engagement to write a useful reply.\n\nLook for posts with a real question, clear problem, or active comments.");

const inventoryReply = buildSuggestedReply({
  title: "Inventory management AI: what's worth using vs hype",
  body: "We keep running into stockouts and messy reorder spreadsheets.",
  intent: "ai",
  niche: "AI tools for ecommerce",
  target: "Shopify owners",
  subreddit: "r/ecommerce",
  action: "ManualOnly",
  comments: 7,
  ups: 12,
});
assert.match(inventoryReply, /Forecasting|reorder alerts|stockout warnings/i, "Inventory AI post should get inventory-specific reply");
assert.doesNotMatch(inventoryReply, /as an AI|link|book a call/i, "Inventory reply should not sound like a pitch");
const inventoryOptions = buildReplyOptions({
  title: "Inventory management AI: what's worth using vs hype",
  body: "We keep running into stockouts and messy reorder spreadsheets.",
  intent: "ai",
  niche: "AI tools for ecommerce",
  target: "Shopify owners",
  subreddit: "r/ecommerce",
  action: "ManualOnly",
  comments: 7,
  ups: 12,
});
assert.match(inventoryOptions.quickReply, /Forecasting|reorder alerts|stockout warnings/i, "Inventory AI should return quick reply");
assert.match(inventoryOptions.deeperReply, /messy spreadsheet cleanup|automated buying decisions/i, "Inventory AI should return deeper reply");
assert.match(inventoryOptions.manualNote, /Edit before posting/i, "ManualOnly should warn to edit before posting");
assert.equal(buildSuggestedReply({
  title: "Inventory management AI: what's worth using vs hype",
  body: "We keep running into stockouts and messy reorder spreadsheets.",
  intent: "ai",
  niche: "AI tools for ecommerce",
  target: "Shopify owners",
  subreddit: "r/ecommerce",
  action: "ManualOnly",
  comments: 7,
  ups: 12,
}), inventoryOptions.quickReply, "Copy workflow should have quick reply selected by default");

const shopifyReply = buildSuggestedReply({
  title: "My Shopify store has no traffic, what should I do?",
  body: "I launched two months ago and barely get visitors. I am not sure if my product page is the issue or if nobody is seeing it.",
  intent: "ecommerce",
  niche: "Shopify traffic",
  target: "store owners",
  subreddit: "r/shopify",
  action: "Reply",
  comments: 5,
  ups: 3,
});
assert.match(shopifyReply, /traffic|product page|checkout|abandoned carts|trust/i, "Shopify no-traffic post should get ecommerce-specific reply");

const shopifySetupReply = buildSuggestedReply({
  title: "New to Shopify. Need help about general setup and automating the setup through Claude.",
  body: "I am trying to figure out what to set up first and what Claude can safely help with.",
  intent: "ai",
  niche: "AI tools for ecommerce",
  target: "Shopify owners",
  subreddit: "r/shopify",
  action: "ManualOnly",
  comments: 4,
  ups: 3,
});
assert.match(shopifySetupReply, /LOW INTEL|SKIP/i, "Shopify Claude setup post should be skipped for MarketVibe buyer intent");
assert.doesNotMatch(shopifySetupReply, /inventory|stock|reorder|forecasting|stockout/i, "Shopify setup post should not get inventory reply");

const webDesignClientReply = buildSuggestedReply({
  title: "How do I find web design clients for local business redesigns?",
  body: "I am trying cold outreach but need a better way to spot businesses worth pitching.",
  intent: "customers",
  niche: "Local Lead Opportunity Finder",
  target: "web designers and SEO freelancers",
  subreddit: "r/web_design",
  action: "ManualOnly",
  comments: 8,
  ups: 6,
});
assert.match(webDesignClientReply, /visible local business problems|weak sites|CTAs|SEO basics|prospect/i, "Buyer-intent post should get MarketVibe-style prospecting reply");
assert.doesNotMatch(webDesignClientReply, /ad|buy|sign up|checkout/i, "Buyer-intent reply should not sound like an ad");

const sneakerReply = buildSuggestedReply({
  title: "Sneaker reselling stuck, stock not moving",
  body: "I have pairs listed but no sales. Where should I sell sneakers now?",
  intent: "reselling",
  niche: "sneaker resellers",
  target: "resellers",
  subreddit: "r/Flipping",
  action: "ManualOnly",
  comments: 6,
  ups: 4,
});
assert.match(sneakerReply, /demand|pricing|platform|sold listings|stock/i, "Sneaker reseller reply should match selling/platform/pricing topic");

const bookReply = buildSuggestedReply({
  title: "Used books inventory problem, no sales",
  body: "Where to sell books online if Marketplace is slow?",
  intent: "books",
  niche: "book sellers",
  target: "used book resellers",
  subreddit: "r/bookselling",
  action: "ManualOnly",
  comments: 3,
  ups: 2,
});
assert.match(bookReply, /listings|marketplace|pricing|niche|inventory/i, "Book seller reply should match listings/pricing/inventory topic");

const roofingReply = buildSuggestedReply({
  title: "Roof leak help after storm, quote seems high",
  body: "Any advice on how to compare roofing quotes?",
  intent: "roofing",
  niche: "roofers",
  target: "homeowners",
  subreddit: "r/Roofing",
  action: "ManualOnly",
  comments: 4,
  ups: 5,
});
assert.match(roofingReply, /leak|quote|trust|homeowner/i, "Roofing reply should match leaks/quotes/trust topic");

const deduped = dedupeRedditRadarPosts([
  { title: "Sneakers no sales", permalink: "https://reddit.com/a" },
  { title: "Sneakers no sales duplicate", permalink: "https://reddit.com/a" },
  { title: "Where to sell books", permalink: "https://reddit.com/b" },
]);
assert.equal(deduped.length, 2, "Duplicate posts should be removed by permalink");

const ranked = rankRedditRadarPosts([
  { title: "Favorite startup quote?", body: "Just motivation and generic chatter", subreddit: "r/startups", permalink: "https://reddit.com/generic", comments: 10, ups: 20 },
  { title: "How do I get customers for my app?", body: "I launched but have no users and need a way to find people with this problem.", subreddit: "r/SaaS", permalink: "https://reddit.com/pain", comments: 3, ups: 2 },
], "customer acquisition");
assert.equal(ranked[0].permalink, "https://reddit.com/pain", "Clear problem/need posts should rank above generic chatter");

assert.ok(scoreRedditRadarPost({
  title: "How do I get customers for my app?",
  body: "I launched but have no users and need a way to find people with this problem.",
  subreddit: "r/SaaS",
  permalink: "https://reddit.com/high-intent",
  comments: 6,
  ups: 8,
}, "customer acquisition") >= 70, "Clear customer acquisition post should score high");
assert.ok(scoreRedditRadarPost({
  title: "Generic business advice thread",
  body: "Drop your favorite motivation tips and business mindset quotes.",
  subreddit: "r/Entrepreneur",
  permalink: "https://reddit.com/noise",
  comments: 30,
  ups: 80,
}, "customer acquisition") <= 0, "Generic advice or motivational posts should be rejected");
assert.ok(scoreRedditRadarPost({
  title: "Check out my new product",
  body: "DM me for a limited offer and use my code.",
  subreddit: "r/startups",
  permalink: "https://reddit.com/promo",
  comments: 5,
  ups: 10,
}, "customer acquisition") < 0, "Promotional seller posts should be rejected");

const redditMarketingReply = buildSuggestedReply({
  title: "How do I market on Reddit without getting ignored?",
  body: "I sell to founders but every subreddit seems to hate obvious promotion.",
  intent: "reddit",
  niche: "Reddit marketing",
  target: "founders",
  subreddit: "r/marketing",
  action: "Reply",
  comments: 11,
  ups: 9,
});
assert.match(redditMarketingReply, /community fit|comment history|niche language|links/i, "Reddit marketing post should get Reddit-specific reply");

const lowIntelReply = buildSuggestedReply({
  title: "Quick question",
  body: "",
  intent: "low-intel",
  niche: "",
  target: "",
  subreddit: "r/marketing",
  action: "Skip",
  comments: 0,
  ups: 0,
});
assert.equal(lowIntelReply, lowIntel.reply, "Low-intel post should keep skip reply");
const lowIntelOptions = buildReplyOptions({
  title: "Quick question",
  body: "",
  intent: "low-intel",
  niche: "",
  target: "",
  subreddit: "r/marketing",
  action: "Skip",
  comments: 0,
  ups: 0,
});
assert.equal(lowIntelOptions.quickReply, lowIntel.reply, "Low-intel quick reply should be skip reply");
assert.match(lowIntelOptions.deeperReply, /Not recommended/i, "Low-intel deeper reply should not be recommended");
assert.match(lowIntelOptions.manualNote, /not enough context|engagement/i, "Low-intel manual note should explain context risk");

console.log("Reddit Radar helper tests passed.");
