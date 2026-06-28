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
  hasAiIntent,
  hasCustomerProblemSignal,
  hasMarketVibeBuyerIntent,
  hasUsablePostSignal,
  isBlockedJobPost,
  isLowIntelPost,
  isObviousRssJunk,
  isRejectedNonBuyerIntent,
  lowIntelIntel,
} = sandbox.exports;

assert.equal(hasAiIntent("Vail Daily needs a new tourism website"), false, "Vail Daily should not trigger AI intent");
assert.equal(hasAiIntent("Vail Daily lost car key fob"), false, "Vail Daily lost car key fob should not trigger AI intent");
assert.equal(hasAiIntent("Can ChatGPT help with support replies?"), true, "ChatGPT should trigger AI intent");
assert.equal(hasAiIntent("Looking for an A.I. automation workflow"), true, "A.I. and automation should trigger AI intent");
assert.equal(isBlockedJobPost("Hiring remote developer", "Full-time role, apply now, worldwide"), true, "Hiring remote developer post should be blocked");
assert.equal(isBlockedJobPost("My Shopify store has no traffic, what should I do?", ""), false, "Shopify pain post should not be blocked as a job");
assert.equal(hasMarketVibeBuyerIntent("How do I find web design clients?", "I need better local business leads."), true, "Web design client post should have MarketVibe buyer intent");
assert.equal(isRejectedNonBuyerIntent("New to Shopify. Need setup help through Claude.", "I need help fixing my own store."), true, "Shopify setup help should be rejected as non-buyer intent");

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
assert.equal(hasMarketVibeBuyerIntent("My Shopify store has no traffic, what should I do?", ""), false, "Shopify store-fixing post should not have MarketVibe buyer intent");
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
assert.match(shopifyReply, /LOW INTEL|SKIP/i, "Shopify no-traffic store-help post should be skipped for MarketVibe buyer intent");

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
