import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync("src/lib/facebook-radar.ts", "utf8");
const importSource = fs.readFileSync("src/lib/facebook-radar-import.ts", "utf8");
const pageSource = fs.readFileSync("src/app/facebook-radar/page.tsx", "utf8");
const leadHuntPageSource = fs.readFileSync("src/app/lead-hunt-autopilot/page.tsx", "utf8");
const importedPageSource = fs.readFileSync("src/app/facebook-radar/imported/page.tsx", "utf8");
const internalMarketingLeadsPageSource = fs.readFileSync("src/app/internal-marketing-leads/page.tsx", "utf8");
const internalMarketingLeadsApiSource = fs.readFileSync("src/app/api/internal-marketing-leads/route.ts", "utf8");
const internalMarketingLeadAuthStatusSource = fs.readFileSync("src/app/api/internal-marketing-leads/auth-status/route.ts", "utf8");
const internalMarketingLeadEventsApiSource = fs.readFileSync("src/app/api/internal-marketing-leads/events/route.ts", "utf8");
const huntStatusSource = fs.readFileSync("src/app/api/internal-marketing-leads/hunt-status/route.ts", "utf8");
const internalMarketingLeadsSource = fs.readFileSync("src/lib/internal-marketing-leads.ts", "utf8");
const internalMarketingLeadsMigration = fs.readFileSync("supabase/migrations/0004_internal_marketing_leads.sql", "utf8");
const leadHuntPipelineMigration = fs.readFileSync("supabase/migrations/0005_lead_hunt_pipeline.sql", "utf8");
const internalAccessSource = fs.readFileSync("src/lib/internal-access.ts", "utf8");
const extensionSource = fs.readFileSync("browser-extension/facebook-radar-importer/content.js", "utf8");
const contactFlowSource = fs.readFileSync("browser-extension/facebook-radar-importer/contact-flow.js", "utf8");
const extensionManifest = fs.readFileSync("browser-extension/facebook-radar-importer/manifest.json", "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    strict: true,
  },
});
const importTranspiled = ts.transpileModule(importSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    strict: true,
  },
});

const sandbox = { exports: {} };
vm.runInNewContext(transpiled.outputText, sandbox, { filename: "facebook-radar.js" });
const importSandbox = { exports: {}, require: (id) => (id === "@/lib/facebook-radar" ? sandbox.exports : {}) };
vm.runInNewContext(importTranspiled.outputText, importSandbox, { filename: "facebook-radar-import.js" });

const {
  BUYER_INTENT_QUERY_LIBRARY,
  analyzeFacebookLead,
  createDefaultFacebookFilters,
  filterAndRankFacebookLeads,
  generateFacebookSearchLinks,
  shouldSendFacebookLead,
} = sandbox.exports;
const { scoreImportedFacebookPosts } = importSandbox.exports;

function phrasesFor(input) {
  return generateFacebookSearchLinks(input).map((link) => link.phrase).join(" | ");
}

function linksFor(input) {
  return generateFacebookSearchLinks(input);
}

class FakeFacebookElement {
  constructor({ tag = "div", text = "", attrs = {}, selectors = [], children = [] } = {}) {
    this.tag = tag;
    this._text = text;
    this.attrs = attrs;
    this.selectors = selectors;
    this.children = children;
    this.removed = false;
  }

  get textContent() {
    return [this._text, ...this.children.filter((child) => !child.removed).map((child) => child.textContent)].filter(Boolean).join(" ");
  }

  getAttribute(name) {
    return this.attrs[name] || null;
  }

  getBoundingClientRect() {
    return { width: 100, height: 24, top: 0, bottom: 24 };
  }

  remove() {
    this.removed = true;
  }

  cloneNode() {
    return new FakeFacebookElement({
      tag: this.tag,
      text: this._text,
      attrs: { ...this.attrs },
      selectors: [...this.selectors],
      children: this.children.map((child) => child.cloneNode(true)),
    });
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const selectors = selector.split(",").map((item) => item.trim()).filter(Boolean);
    const nodes = [];
    const visit = (node) => {
      for (const child of node.children || []) {
        if (child.removed) continue;
        if (selectors.some((item) => child.matches(item))) nodes.push(child);
        visit(child);
      }
    };
    visit(this);
    return nodes;
  }

  matches(selector) {
    if (this.selectors.includes(selector)) return true;
    if (selector === "[data-ad-preview='message']") return this.attrs["data-ad-preview"] === "message";
    if (selector === "[dir='auto']") return this.attrs.dir === "auto";
    if (selector === "span" || selector === "div" || selector === "abbr") return this.tag === selector;
    if (selector === "a[href]") return this.tag === "a" && Boolean(this.attrs.href);
    if (selector === "a[role='link']") return this.tag === "a" && this.attrs.role === "link";
    if (/^a\[href\*='\/groups\/'\]/.test(selector)) return this.tag === "a" && this.attrs.role === "link" && String(this.attrs.href || "").includes("/groups/");
    if (/^a\[href\*='\/pages\/'\]/.test(selector)) return this.tag === "a" && this.attrs.role === "link" && String(this.attrs.href || "").includes("/pages/");
    return false;
  }
}

function loadExtensionTestApi() {
  const fakeDocument = {
    title: "Facebook",
    getElementById: () => null,
    querySelectorAll: () => [],
    createElement: (tag) => new FakeFacebookElement({ tag }),
    body: { appendChild: () => {} },
  };
  const fakeWindow = {
    __MARKETVIBE_BUYER_RADAR_TEST__: true,
    getComputedStyle: () => ({ display: "block", visibility: "visible", opacity: "1" }),
    clearTimeout: () => {},
    setTimeout: () => 0,
    clearInterval: () => {},
    setInterval: () => 0,
    crypto: {},
  };
  const extensionSandbox = {
    window: fakeWindow,
    document: fakeDocument,
    location: {
      hostname: "www.facebook.com",
      origin: "https://www.facebook.com",
      href: "https://www.facebook.com/search/posts/?q=web%20developer%20need%20leads",
      search: "?q=web%20developer%20need%20leads",
    },
    URL,
    console,
    HTMLElement: FakeFacebookElement,
    localStorage: { getItem: () => null, setItem: () => {} },
    globalThis: {},
  };
  vm.runInNewContext(extensionSource, extensionSandbox, { filename: "buyer-radar-content.js" });
  return extensionSandbox.window.__MarketVibeBuyerRadarTest;
}

const webDesignPhrases = phrasesFor({
  targetBuyer: "web designers, SEO freelancers",
  niche: "web design",
  painKeywords: "need clients, cold outreach not working",
});
const webDesignTop = linksFor({
  targetBuyer: "web designers, SEO freelancers",
  niche: "web design",
  painKeywords: "need clients, cold outreach not working",
}).slice(0, 5).map((link) => link.phrase).join(" | ");
const firstWebDesignLink = linksFor({
  targetBuyer: "web designers, SEO freelancers",
  niche: "web design",
  painKeywords: "need clients, cold outreach not working",
})[0];
assert.doesNotMatch(webDesignTop, /\bneed clients web design\b/, "Web design input must not generate weak need-clients-web-design as a top result");
assert.match(webDesignPhrases, /"cold outreach not working"|"how do i get clients"|"no one replies to my outreach"/, "Search phrases should include pain/question wording");
assert.doesNotMatch(webDesignPhrases, /hiring|remote developer|pay per website|cheap website/i, "Generated searches should avoid obvious hiring intent");
assert.match(firstWebDesignLink.postsUrl, /^https:\/\/(www|m)\.facebook\.com\/search\/posts\/\?q=/, "Posts URL should use Facebook posts search");
assert.match(firstWebDesignLink.groupsUrl, /^https:\/\/(www|m)\.facebook\.com\/search\/groups\/\?q=/, "Groups URL should keep Facebook group search");
assert.ok(firstWebDesignLink.fitScore >= 90, "High-intent searches should rank first");

const highIntentPhrases = phrasesFor({
  targetBuyer: "web designers, SEO freelancers, agencies",
  niche: "client acquisition",
  painKeywords: "local business leads, prospects, cold outreach not working",
});
assert.match(highIntentPhrases, /"no one replies to my outreach"|"cold outreach not working"|"how do i get clients"|"looking for a tool to find leads"/, "Searches should prioritize high-intent buyer pain");
assert.doesNotMatch(highIntentPhrases, /need clients web design|looking for web developer|need web developer|cheap website|hire developer|buy leads|guaranteed leads/i, "Weak or hiring searches should be removed");

const analysis = analyzeFacebookLead({
  postText: "I run a small web design service and cold outreach is not working. How do I get clients without spamming people?",
  targetBuyer: "web designers",
  painKeywords: "need clients, cold outreach not working",
  sourceUrl: "",
});
assert.notEqual(analysis.action, "Skip", "Analyze pasted post should return a buyer opportunity");
assert.match(analysis.quickReply, /outreach|visible problem|service pitch|platforms/i, "Analyze pasted post should return helpful replies");
assert.match(analysis.manualNote, /manual|links|profile|posting/i, "Manual note should reinforce manual engagement");

const websiteServiceSellerPost = "Hey everyone, I'm in the business of helping people with their websites. Any tips on how to get clients? I do good work, but I'm terrible at marketing.";
const websiteServiceSellerAnalysis = analyzeFacebookLead({
  postText: websiteServiceSellerPost,
  targetBuyer: "web designers, freelancers, agencies",
  painKeywords: "how to get clients, terrible at marketing",
  sourceUrl: "",
});
assert.notEqual(websiteServiceSellerAnalysis.action, "Skip", "Website service seller asking how to get clients should not be skipped");
assert.equal(websiteServiceSellerAnalysis.score, "High", "Website service seller client-acquisition pain should be High fit");
assert.equal(websiteServiceSellerAnalysis.reason, "Website service seller asking how to get clients.", "Exact website-service buyer match should explain why it matched");

const cheapDeveloper = analyzeFacebookLead({
  postText: "I need a web developer for my clients' projects. I will pay $50 per website.",
  targetBuyer: "web designers",
  painKeywords: "need clients",
  sourceUrl: "",
});
assert.equal(cheapDeveloper.action, "Skip", "Cheap web developer hiring posts should be Skip / bad fit");

const launchedBusiness = analyzeFacebookLead({
  postText: "I launched a cafe and don't know how to market it. Where do I find customers?",
  targetBuyer: "small business owners",
  painKeywords: "need customers, no leads",
  sourceUrl: "",
});
assert.equal(launchedBusiness.action, "Skip", "Generic local business owner posts should be skipped as buyer-radar inventory");

const outreachPain = analyzeFacebookLead({
  postText: "I run a small agency and cold outreach is not working. No one replies to my outreach. How do I get clients?",
  targetBuyer: "agencies",
  painKeywords: "cold outreach not working",
  sourceUrl: "",
});
assert.equal(outreachPain.score, "High", "Service-seller cold outreach pain should be High fit");

const genericNeedClients = analyzeFacebookLead({
  postText: "Need clients and sales this month. Any tips for closing more clients?",
  targetBuyer: "agencies",
  painKeywords: "need clients",
  sourceUrl: "",
});
assert.equal(genericNeedClients.action, "Skip", "Generic need-clients posts without service context should be skipped");

const realEstateClosing = analyzeFacebookLead({
  postText: "Real estate closing clients keep asking about escrow and mortgage insurance. Any advice?",
  targetBuyer: "web designers",
  painKeywords: "web design clients",
  sourceUrl: "",
});
assert.equal(realEstateClosing.action, "Skip", "Real estate closing posts should be off-topic for buyer radar");

const skippedAgencyExample = analyzeFacebookLead({
  postText: "I'm running a web development agency and struggling on generating more leads. I find cold calling is too time consuming and I am looking for alternatives.",
  targetBuyer: "web designers, SEO freelancers, local marketers, small agencies",
  painKeywords: "struggling generating more leads, looking for alternatives to cold calling, agency owner struggling",
  sourceUrl: "https://www.facebook.com/groups/webdesign/posts/123",
});
assert.notEqual(skippedAgencyExample.action, "Skip", "Agency lead-generation pain must not be skipped");
assert.equal(skippedAgencyExample.score, "High", "Agency struggling to generate more leads should be High fit");

const shopifyPain = analyzeFacebookLead({
  postText: "I sell Shopify setup services and need ecommerce prospects. How do I find local businesses that need a better store?",
  targetBuyer: "booking-system sellers, automation consultants, Shopify service providers",
  painKeywords: "local business leads, prospects",
  sourceUrl: "",
});
assert.equal(shopifyPain.score, "High", "Service sellers seeking ecommerce prospects should be High fit");

const guaranteedLeads = analyzeFacebookLead({
  postText: "We provide guaranteed leads for agencies. DM me for packages.",
  targetBuyer: "agencies",
  painKeywords: "need leads",
  sourceUrl: "",
});
assert.equal(guaranteedLeads.action, "Skip", "Guaranteed lead offer posts should be Skip / bad fit");

assert.ok(BUYER_INTENT_QUERY_LIBRARY.includes("how do I get web design clients"), "Buyer intent query library should include web design client-acquisition queries");
assert.ok(BUYER_INTENT_QUERY_LIBRARY.includes("where can I find local business leads"), "Buyer intent query library should include local-business-lead sourcing queries");
assert.equal(BUYER_INTENT_QUERY_LIBRARY.includes("I need a website for my business"), false, "Buyer intent query library should not target local business owners as buyers");

const defaultFilters = createDefaultFacebookFilters();
const genericGroupWebsiteSellerPreviews = filterAndRankFacebookLeads([
  {
    text: websiteServiceSellerPost,
    url: "https://www.facebook.com/groups/entrepreneurship/posts/321",
    groupName: "Small Business and Entrepreneurship",
    groupMembers: 18000,
    groupPostsPerDay: 22,
    comments: 9,
    reactions: 14,
    language: "English",
    isPublicGroup: true,
  },
], defaultFilters);
assert.equal(genericGroupWebsiteSellerPreviews[0].passedFilters, true, "Generic entrepreneurship group should not block genuine website-service client-acquisition posts");
assert.equal(genericGroupWebsiteSellerPreviews[0].intentScore, "High", "Website service seller preview should score High");
assert.match(genericGroupWebsiteSellerPreviews[0].reason, /Website service seller asking how to get clients/i, "Preview should summarize the website-service client-acquisition pain");

const buyerIntentPreviews = filterAndRankFacebookLeads([
  {
    text: "I run a small web design service and cold outreach is not working. Where can I find local business leads and get clients without spamming?",
    url: "https://www.facebook.com/groups/local/posts/123",
    groupName: "Web Design Agency Owners",
    groupMembers: 4200,
    groupPostsPerDay: 18,
    comments: 4,
    reactions: 7,
    language: "English",
    isPublicGroup: true,
  },
], defaultFilters);
assert.equal(buyerIntentPreviews[0].intentScore, "High", "Service-seller buyer intent should score High");
assert.equal(buyerIntentPreviews[0].passedFilters, true, "Service-seller buyer intent should pass filters");

const genericBusinessOwnerPreviews = filterAndRankFacebookLeads([
  {
    text: "I own a local cleaning business and my website is not getting customers. Need more leads for my business. Any advice?",
    url: "https://www.facebook.com/groups/local/posts/124",
    groupName: "Local Business Owners",
    groupMembers: 4200,
    groupPostsPerDay: 18,
    comments: 4,
    reactions: 7,
    language: "English",
    isPublicGroup: true,
  },
], defaultFilters);
assert.equal(genericBusinessOwnerPreviews[0].passedFilters, false, "Generic local business owners should not pass buyer-radar filters");
assert.match(genericBusinessOwnerPreviews[0].reason, /service-seller|local business owner/i, "Generic local owner skips should explain the buyer mismatch");

const badIntentPreviews = filterAndRankFacebookLeads([
  {
    text: "Hire me. I am a freelancer looking for work and I build cheap websites. DM me for crypto affiliate offers.",
    url: "https://www.facebook.com/groups/spam/posts/456",
    groupName: "Freelancer Jobs",
    groupMembers: 8000,
    groupPostsPerDay: 20,
    comments: 5,
    reactions: 5,
    language: "English",
    isPublicGroup: true,
  },
], defaultFilters);
assert.equal(badIntentPreviews[0].passedFilters, false, "Freelancer/job/spam posts should be rejected");
assert.match(badIntentPreviews[0].reason, /seller|job|spam|crypto|excluded keyword/i, "Rejected posts should explain why");

const lowActivityPreviews = filterAndRankFacebookLeads([
  {
    text: "I own a salon and need help getting more customers from my website.",
    url: "https://www.facebook.com/groups/small/posts/789",
    groupName: "Tiny Group",
    groupMembers: 12,
    groupPostsPerDay: 0,
    comments: 0,
    reactions: 0,
    language: "English",
    isPublicGroup: true,
  },
], defaultFilters);
assert.equal(lowActivityPreviews[0].passedFilters, false, "Low activity groups should be filtered");
assert.match(lowActivityPreviews[0].reason, /minimum members|daily activity|minimum reactions/i, "Low activity filtering should explain skipped reasons");

const duplicatePreviews = filterAndRankFacebookLeads([
  {
    text: "My business has no leads and I need marketing help.",
    url: "https://www.facebook.com/groups/local/posts/999",
    groupName: "Business Owners",
    groupMembers: 5000,
    groupPostsPerDay: 15,
    comments: 3,
    reactions: 3,
    language: "English",
    isPublicGroup: true,
  },
], defaultFilters, new Set(["https://www.facebook.com/groups/local/posts/999"]));
assert.equal(duplicatePreviews[0].passedFilters, false, "Duplicate posts should be blocked");
assert.match(duplicatePreviews[0].duplicateWarning, /Duplicate/i, "Duplicate posts should show a warning");

assert.equal(shouldSendFacebookLead(buyerIntentPreviews[0], new Set()), true, "Only filtered service-seller High Intent posts should be sendable");
assert.equal(shouldSendFacebookLead(badIntentPreviews[0], new Set()), false, "Rejected posts should not be sendable");
assert.equal(shouldSendFacebookLead(duplicatePreviews[0], new Set([duplicatePreviews[0].id])), false, "Duplicate posts should not be sendable");

const cleanedImports = scoreImportedFacebookPosts({
  posts: [{
    text: "FacebookFacebookFacebook Home Watch Groups Most freelancers don't have a skill problem. They have a client acquisition problem. Like Comment Share",
    sourceName: "FacebookFacebookFacebook Web Design and Development | Facebook",
    author: "FacebookFacebookFacebook Muhammad Adnan",
    dateText: "2 h",
    url: "https://www.facebook.com/groups/webdev/posts/123",
  }],
  searchPhrase: "client acquisition problem",
});
assert.equal(cleanedImports.length, 1, "Importer should keep real post content after cleaning Facebook spam");
assert.doesNotMatch(cleanedImports[0].text, /FacebookFacebook|Home Watch Groups|Like Comment Share/i, "Imported post text should remove repeated Facebook navigation text");
assert.match(cleanedImports[0].text, /client acquisition problem/i, "Imported post text should preserve the actual post");
assert.equal(cleanedImports[0].sourceName, "Web Design and Development |", "Importer should clean group/page names");
assert.equal(cleanedImports[0].author, "Muhammad Adnan", "Importer should clean author names");

const extensionTestApi = loadExtensionTestApi();
const buyerRadarSourceName = "I Need A Website Designer / Web Developer";
const buyerRadarAuthor = "Max Narron";
const buyerRadarBody = "I am a web developer, I need leads. Comment if you are interested.";
const buyerRadarCard = new FakeFacebookElement({
  children: [
    new FakeFacebookElement({
      tag: "a",
      text: buyerRadarSourceName,
      attrs: { href: "https://www.facebook.com/groups/webdesigners", role: "link" },
      selectors: ["h1 a[role='link']", "h2 strong a", "a[href*='/groups/'][role='link']", "a[role='link']"],
    }),
    new FakeFacebookElement({
      tag: "a",
      text: buyerRadarAuthor,
      attrs: { href: "https://www.facebook.com/max.narron", role: "link" },
      selectors: ["h2 strong a", "strong a[role='link']", "a[role='link']"],
    }),
    new FakeFacebookElement({
      tag: "div",
      text: `${buyerRadarSourceName} ${buyerRadarAuthor} Shared with public group ${buyerRadarBody} Like Share`,
      attrs: { "data-ad-preview": "message", dir: "auto" },
    }),
    new FakeFacebookElement({
      tag: "a",
      text: "25 June at 20:16",
      attrs: { href: "https://www.facebook.com/groups/webdesigners/posts/123456789", role: "link" },
      selectors: ["a[role='link']"],
    }),
  ],
});
const buyerRadarPayload = extensionTestApi.buildPostFromNode(buyerRadarCard, 100, {
  queryUsed: "web developer need leads",
  sourceUsed: "Facebook Search",
  painPoint: "client acquisition",
  matchReason: "100/100 confidence: specific client-acquisition phrase",
});
assert.equal(buyerRadarPayload.sourceName, buyerRadarSourceName, "Extension should map the group/page title to sourceName");
assert.equal(buyerRadarPayload.author, buyerRadarAuthor, "Extension should map the real post author to author");
assert.notEqual(buyerRadarPayload.author, buyerRadarSourceName, "Extension must reject group/page names as author");
assert.equal(buyerRadarPayload.text, buyerRadarBody, "Extension should send only the cleaned post body");
assert.equal(buyerRadarPayload.confidenceScore, 100, "Extension payload should preserve confidenceScore");
assert.equal(buyerRadarPayload.matchReason, "100/100 confidence: specific client-acquisition phrase", "Extension payload should preserve matchReason");
assert.equal(buyerRadarPayload.painPoint, "client acquisition", "Extension payload should preserve painPoint");
assert.equal(buyerRadarPayload.queryUsed, "web developer need leads", "Extension payload should preserve queryUsed");
assert.equal(buyerRadarPayload.sourceUsed, "Facebook Search", "Extension payload should preserve sourceUsed");
assert.equal(buyerRadarPayload.url, "https://www.facebook.com/groups/webdesigners/posts/123456789", "Extension payload should preserve exact post URL");

const freelanceWebDesignerModalText = "how to get clients as a freelance web designer?";
assert.equal(
  extensionTestApi.isHighQualityBuyerText(freelanceWebDesignerModalText, { sourceName: "i need a website" }),
  true,
  "Facebook modal post asking how to get clients as a freelance web designer should be high-quality buyer intent",
);
assert.ok(
  extensionTestApi.scorePost(freelanceWebDesignerModalText, { sourceName: "i need a website" }) >= 78,
  "Facebook modal post asking how to get clients as a freelance web designer should meet the import threshold",
);

const agencyLeadPainImport = scoreImportedFacebookPosts({
  posts: [{
    text: "I'm running a web development agency and struggling on generating more leads. I find cold calling is too time consuming and I am looking for alternatives.",
    sourceName: "Web Design and Development",
    author: "Agency owner",
    url: "https://www.facebook.com/groups/webdesign/posts/123",
  }],
  searchPhrase: "agency owner need leads",
});
assert.equal(agencyLeadPainImport[0]?.label, "Good", "Exact agency lead-generation pain should import as Good");
assert.ok(agencyLeadPainImport[0]?.fitRank >= 70, "Exact skipped example should rank as high-intent import");

const websiteServiceSellerImport = scoreImportedFacebookPosts({
  posts: [{
    text: websiteServiceSellerPost,
    sourceName: "Small Business and Entrepreneurship",
    author: "Website helper",
    url: "https://www.facebook.com/groups/entrepreneurship/posts/321",
  }],
  searchPhrase: "how to get clients website services",
});
assert.equal(websiteServiceSellerImport[0]?.label, "Good", "Exact website-service client-acquisition post should import as Good");
assert.equal(websiteServiceSellerImport[0]?.matchReason, "Website service seller asking how to get clients.", "Imported item should store the exact match reason");

assert.match(pageSource, /activeSearchLink = availableSearchLinks/, "One-card workflow state should use one active search card");
assert.match(pageSource, /MAIN_TABS/, "Facebook Radar should expose main workflow tabs");
assert.match(pageSource, /Presets/, "Facebook Radar should include a Presets tab");
assert.match(pageSource, /Sent Leads/, "Facebook Radar should include a Sent Leads tab");
assert.match(pageSource, /Logs and Analytics/, "Facebook Radar should include logs and analytics");
assert.match(pageSource, /Send Visible High-Intent Posts to MarketVibe/, "Facebook Radar should include filtered high-intent send action");
assert.match(pageSource, /Facebook API permissions/, "Facebook Radar should warn about API permission limits");
assert.match(pageSource, /function markBadNext/, "Mark Bad / Next workflow should exist");
assert.match(pageSource, /skipSearch\(link\)/, "Mark Bad should move the current card into skipped searches");
assert.match(pageSource, /setMode\("analyze"\)/, "Mark Good should switch to Analyze mode");
assert.match(pageSource, /setPostText\(PASTE_PROMPT\)/, "Mark Good should prefill paste prompt");
assert.match(pageSource, /setCurrentSearchIndex\(0\)/, "Reset should clear progress to the first search");
assert.match(pageSource, /Previous Search/, "Previous Search button should exist");
assert.match(pageSource, /Open Posts/, "Open Posts primary button should exist");
assert.match(pageSource, /Group Welcome/, "Facebook Radar should include a manual group welcome mode");
assert.match(pageSource, /Clear link/, "Facebook Radar should provide a clear/reset link button");
assert.match(pageSource, /No reply link available/, "Facebook Radar should show a safe missing reply-link message");
assert.match(pageSource, /Confirmation required before send\/post/, "Facebook welcome mode should require operator confirmation");
assert.match(pageSource, /Do not auto-spam groups/, "Facebook welcome mode should warn against group spam");

assert.match(leadHuntPageSource, /Run Buyer Radar/, "Buyer Radar Autopilot should have one main run button");
assert.match(leadHuntPageSource, /Facebook Search/, "Lead Hunt Autopilot should include Facebook source toggle");
assert.match(leadHuntPageSource, /Google indexed Facebook results/, "Lead Hunt Autopilot should include Google indexed Facebook source");
assert.match(leadHuntPageSource, /Bing indexed Facebook results/, "Lead Hunt Autopilot should include Bing indexed Facebook source");
assert.match(leadHuntPageSource, /Max searches/, "Lead Hunt Autopilot should include max searches cap");
assert.match(leadHuntPageSource, /Max imported leads/, "Lead Hunt Autopilot should include max imported leads cap");
assert.match(leadHuntPageSource, /Delay between actions/, "Lead Hunt Autopilot should include delay cap");
assert.match(leadHuntPageSource, /marketvibeLeadHunt/, "Lead Hunt Autopilot should launch extension mode with encoded settings");
assert.match(leadHuntPageSource, /Latest processed buyer-intent items/, "Lead Hunt Autopilot should show latest processed buyer-intent items");
assert.match(leadHuntPageSource, /No auto-DM, no auto-comment, no private data/, "Lead Hunt Autopilot should show safety guardrails");
assert.match(leadHuntPageSource, /Current target/, "Lead Hunt Autopilot should show current target");
assert.match(leadHuntPageSource, /Live source/, "Lead Hunt Autopilot should show live source");
assert.match(leadHuntPageSource, /Current URL/, "Lead Hunt Autopilot should show current URL");
assert.match(leadHuntPageSource, /Runtime/, "Lead Hunt Autopilot should show runtime");
assert.match(leadHuntPageSource, /Duplicates/, "Lead Hunt Autopilot should show duplicate count");
assert.match(leadHuntPageSource, /Failed/, "Lead Hunt Autopilot should show failed count");
assert.match(leadHuntPageSource, /Ignored low-confidence/, "Lead Hunt Autopilot should show ignored low-confidence count");
assert.match(leadHuntPageSource, /Minimum confidence/, "Lead Hunt Autopilot should include a minimum confidence setting");
assert.match(leadHuntPageSource, /Matched because/, "Lead Hunt Autopilot should show why an item matched");
assert.match(leadHuntPageSource, /Confidence \{lead\.confidenceScore/, "Lead Hunt Autopilot should show visible confidence score for saved items");
assert.match(leadHuntPageSource, /Current item/, "Lead Hunt Autopilot should show current item progress");
assert.match(leadHuntPageSource, /Completed/, "Lead Hunt Autopilot should show completed count");
assert.match(leadHuntPageSource, /Last error/, "Lead Hunt Autopilot should show last error");
assert.match(leadHuntPageSource, /Run logs/, "Lead Hunt Autopilot should show browser run logs");
assert.match(leadHuntPageSource, /refreshRunLogs/, "Lead Hunt Autopilot should poll recent run logs");
assert.match(leadHuntPageSource, /Skip Current/, "Lead Hunt Autopilot should include a Skip Current control");
assert.match(leadHuntPageSource, /updateHuntControl/, "Lead Hunt dashboard controls should write to the status API");
assert.match(leadHuntPageSource, /Recovery needed/, "Lead Hunt page should show recovery needed state");
assert.match(leadHuntPageSource, /\/api\/internal-marketing-leads\/hunt-status/, "Lead Hunt page should poll internal marketing lead status counters");
assert.match(leadHuntPageSource, /\/api\/internal-marketing-leads/, "Lead Hunt page should read internal marketing leads only");
assert.doesNotMatch(leadHuntPageSource, /\/api\/facebook-radar\/import/, "Lead Hunt page must not read the old Facebook Radar import endpoint");
assert.match(huntStatusSource, /INTERNAL_CORS_HEADERS/, "Lead Hunt status API should allow extension CORS updates");
assert.match(internalMarketingLeadsSource, /skipped/, "Lead Hunt status store should keep skipped counters");
assert.match(internalMarketingLeadsSource, /duplicates/, "Lead Hunt status store should keep duplicate counters");
assert.match(internalMarketingLeadsSource, /RUN_STALE_MS/, "Lead Hunt status store should detect stale active runs");
assert.match(internalMarketingLeadsSource, /currentItem/, "Lead Hunt status store should keep current item progress");
assert.match(internalMarketingLeadsSource, /lastError/, "Lead Hunt status store should keep last error progress");
assert.match(internalMarketingLeadsApiSource, /importInternalMarketingLeads/, "Internal marketing lead API should import Lead Hunt posts");
assert.match(internalMarketingLeadEventsApiSource, /export async function GET/, "Internal marketing lead events API should expose read-only run logs");
assert.match(internalMarketingLeadsSource, /getLeadHuntEvents/, "Internal marketing lead store should read run logs for the dashboard");
assert.match(internalMarketingLeadsSource, /internal_marketing_leads/, "Internal marketing lead store should use the internal_marketing_leads table");
assert.doesNotMatch(internalMarketingLeadsSource, /\.from\("leads"\)|\.from\("audits"\)|\.from\("search_runs"\)/, "Internal marketing lead store must not use customer lead tables");
assert.match(internalMarketingLeadsMigration, /create table if not exists public\.internal_marketing_leads/, "Migration should create the internal_marketing_leads table");
assert.match(internalMarketingLeadsMigration, /set search_path = public/, "Internal marketing migration should use the public schema search path");
assert.match(internalMarketingLeadsMigration, /public\.internal_marketing_leads/, "Internal marketing migration should schema-qualify the expected table");
assert.match(internalMarketingLeadsMigration, /add column if not exists run_id/, "Internal marketing migration should be idempotent for Lead Hunt columns");
assert.match(internalMarketingLeadsMigration, /internal_marketing_leads_status_check/, "Internal marketing migration should add the follow-up status constraint idempotently");
assert.match(leadHuntPipelineMigration, /create table if not exists public\.internal_marketing_leads/, "Pipeline migration should self-heal if internal_marketing_leads is missing");
assert.match(leadHuntPipelineMigration, /set search_path = public/, "Pipeline migration should use the public schema search path");
assert.doesNotMatch(leadHuntPipelineMigration, /alter table internal_marketing_leads\b/i, "Pipeline migration must not use an unqualified internal_marketing_leads alter");
assert.doesNotMatch(leadHuntPipelineMigration, /on internal_marketing_leads\b/i, "Pipeline migration must not use unqualified internal_marketing_leads indexes");
assert.match(leadHuntPipelineMigration, /create table if not exists public\.lead_hunt_runs/, "Pipeline migration should create lead_hunt_runs");
assert.match(leadHuntPipelineMigration, /create table if not exists public\.lead_hunt_events/, "Pipeline migration should create lead_hunt_events");
assert.match(leadHuntPipelineMigration, /create table if not exists public\.lead_hunt_processed_urls/, "Pipeline migration should create processed URL table");
assert.match(internalMarketingLeadsSource, /No memory-store fallback is allowed/, "Production internal lead storage should not silently fall back to memory");
assert.match(internalAccessSource, /X-MarketVibe-Internal-Key/, "Internal APIs should support extension auth headers");
assert.match(internalMarketingLeadsPageSource, /Buyer Radar Contact Queue|Manual Contact Queue/, "Internal marketing leads UI should exist under its own Buyer Radar route");
assert.match(internalMarketingLeadsPageSource, /\/api\/internal-marketing-leads/, "Internal marketing leads UI should read the internal API");
assert.match(internalMarketingLeadsPageSource, /Export CSV/, "Internal marketing leads UI should export CSV");
assert.match(internalMarketingLeadsPageSource, /follow_up/, "Internal marketing leads UI should support follow-up status");
assert.match(internalMarketingLeadsPageSource, /Automation status/, "Internal marketing leads UI should show automation status");
assert.match(internalMarketingLeadsPageSource, /Open post\/profile/, "Internal marketing leads UI should include an open post/profile button");
assert.match(internalMarketingLeadsPageSource, /No reply link available/, "Internal marketing leads UI should handle missing reply links safely");
assert.match(leadHuntPageSource, /Outreach engine mode/, "Lead Hunt Autopilot should include outreach mode architecture");
assert.match(leadHuntPageSource, /Autopilot for allowed adapters only/, "Lead Hunt Autopilot should include allowed-adapter outreach mode");
assert.match(leadHuntPageSource, /Create test internal lead/, "Lead Hunt page should include test lead verification control");
assert.match(leadHuntPageSource, /Extension version warning/, "Lead Hunt page should warn about old extension versions");
assert.match(leadHuntPageSource, /MARKETVIBE_BUYER_RADAR_SAVE_KEY/, "Lead Hunt page should send verified keys to the extension storage bridge");
assert.match(leadHuntPageSource, /Connected/, "Lead Hunt page should show connected key status");
assert.match(leadHuntPageSource, /Invalid key/, "Lead Hunt page should show invalid key status");
assert.match(leadHuntPageSource, /Missing key/, "Lead Hunt page should show missing key status");
assert.match(leadHuntPageSource, /\/api\/internal-marketing-leads\/auth-status/, "Lead Hunt page should validate internal keys server-side");
assert.doesNotMatch(leadHuntPageSource, /internalKey: internalKey\.trim/, "Lead Hunt launch must not expose the internal key in the URL hash");

assert.match(extensionSource, /function extractPostUrl/, "Facebook importer should extract exact post URLs");
assert.match(extensionSource, /function cleanLeadText/, "Extension should clean imported lead text");
assert.match(extensionSource, /function trimRepeatedWords/, "Extension should trim repeated words");
assert.match(extensionSource, /function extractAuthorName/, "Extension should extract author name");
assert.match(extensionSource, /function extractGroupName/, "Extension should extract group or page name");
assert.match(extensionSource, /function extractTimestamp/, "Extension should extract timestamp when available");
assert.match(extensionSource, /Facebook post imported/, "Extension should use a clear fallback when post text is unavailable");
assert.match(extensionSource, /Group: \$\{post\.sourceName/, "Recent imports popup should show group name");
assert.match(extensionSource, /Author: \$\{post\.author/, "Recent imports popup should show author name");
assert.match(extensionSource, /Post: \$\{cleanLeadText/, "Recent imports popup should show clean post snippet");
assert.match(extensionSource, /Score: \$\{post\.score/, "Recent imports popup should show score");
assert.match(extensionSource, /function isExactPostUrl/, "Facebook importer should detect exact post URLs");
assert.match(extensionSource, /function scoreFacebookUrl/, "Facebook importer should rank exact source URLs");
assert.match(extensionSource, /story_fbid/, "Facebook importer should preserve story_fbid post links");
assert.match(extensionSource, /comment_id=\\d\+/, "Facebook importer should prefer comment links over generic group URLs");
assert.match(extensionSource, /\/photo/, "Facebook importer should support photo source URLs");
assert.match(extensionSource, /fbid=\\d\+/, "Facebook importer should support fbid source URLs");
assert.ok(extensionSource.includes("/\\/groups\\/[^/?#]+\\/posts\\/\\d+/i"), "Facebook importer should support exact group post links");
assert.ok(extensionSource.includes("/\\/groups\\/[^/?#]+\\/permalink\\/\\d+/i"), "Facebook importer should support exact group permalink links");
assert.match(extensionSource, /function isGenericFacebookUrl/, "Facebook importer should reject generic source URLs");
assert.ok(extensionSource.includes("/^\\/groups\\/[^/]+$/i"), "Facebook importer should reject bare group URLs");
assert.ok(extensionSource.includes("/^\\/pages\\/[^/]+$/i"), "Facebook importer should reject bare page URLs");
assert.doesNotMatch(extensionSource, /querySelector\('a\[href\*="\/posts\/"\], a\[href\*="\/groups\/"\]/, "Facebook importer should not use broad group links as source URLs");
assert.match(extensionSource, /cold outreach\.\*not working/, "Facebook importer should highlight outreach pain");
assert.match(extensionSource, /struggling \(\?:on \|with \|to \)\?\(\?:generat/, "Facebook importer should import struggling-to-generate-leads posts");
assert.match(extensionSource, /looking for alternatives\? to cold calling/, "Facebook importer should import cold-calling alternative buyer intent");
assert.match(extensionSource, /where \(\?:do\|can\) i find \(\?:prospects\|local business leads\|business leads\)/, "Facebook importer should highlight prospect sourcing pain");
assert.match(extensionSource, /looking for \(\?:a \)\?tool to find leads/, "Facebook importer should highlight tool-buying intent");
assert.doesNotMatch(extensionSource, /need more customers/, "Facebook importer should not target generic customer-need posts");
assert.match(extensionSource, /OFF_TOPIC_PATTERN/, "Facebook importer should penalize off-topic categories");
assert.match(extensionSource, /WEAK_GENERIC_CLIENT_PATTERN/, "Facebook importer should penalize generic client language");
assert.match(extensionSource, /SPECIFIC_INTENT_PATTERN/, "Facebook importer should require specific client-acquisition context");
assert.match(extensionSource, /Website service seller asking how to get clients\./, "Facebook importer should store the website-service match reason");
assert.match(extensionSource, /cheap website/, "Facebook importer should reject cheap-work posts");
assert.match(extensionSource, /guaranteed clients/, "Facebook importer should reject guaranteed-client spam");
assert.match(extensionSource, /group directory/, "Facebook importer should reject directory noise");
assert.match(extensionSource, /Send this post to MarketVibe/, "Highlighted posts should get a one-post import button");
assert.match(extensionSource, /function sendSinglePost/, "Per-post import workflow should exist");
assert.match(extensionSource, /sendPosts\(\[post\]\)/, "Per-post import should send only one post");
assert.match(extensionSource, /function sendVisible/, "Bulk visible import should remain as backup");
assert.match(extensionSource, /const SCAN_INTERVAL_MS = 1500/, "Extension should rescan Facebook cards every 1.5 seconds");
assert.match(extensionSource, /const SCAN_CLEANUP_MS = 3000/, "Extension should clean scan UI if scanning takes more than 3 seconds");
assert.match(extensionSource, /setInterval\(markFeed, SCAN_INTERVAL_MS\)/, "Extension should use one interval scanner without repeatedly adding overlays");
assert.match(extensionSource, /function cleanupScanUi/, "Extension should always clean scan UI");
assert.match(extensionSource, /finally \{[\s\S]*cleanupScanUi\(\)/, "Failed scans should clean up scan UI in finally");
assert.match(extensionSource, /No (?:high-intent posts|service-seller buyer intent) found on (?:visible page|this page)/, "Extension should show no-results status in the floating badge");
assert.match(extensionSource, /pointer-events:none/, "Floating scan status should not block normal Facebook clicks");
assert.doesNotMatch(extensionSource, /opacity = "0\.12"/, "Extension should not dim non-qualifying Facebook posts");
assert.doesNotMatch(extensionSource, /grayscale\(1\)/, "Extension should not grey out the Facebook page");
assert.match(extensionSource, /marketvibe-intent-badge/, "Extension should avoid duplicate buyer-intent badges");
assert.match(extensionSource, /marketvibe-card-actions/, "Extension should avoid duplicate one-post buttons");
assert.match(extensionSource, /const MAX_RECENT_IMPORTS = 20/, "Local import cache should keep a max of 20 posts");
assert.match(extensionSource, /\.slice\(0, MAX_RECENT_IMPORTS\)/, "Local import cache should trim to max 20");
assert.match(extensionSource, /Recent MarketVibe imports/, "Recent imports panel should exist");
assert.match(extensionSource, /getRecentImports\(\)\.slice\(0, 3\)/, "Recent imports panel should show the last 3 posts");
assert.match(extensionSource, /function createReply/, "Cached posts should have a copyable reply");
assert.match(extensionSource, /MarketVibe stores researched opportunity inventory/, "Copy reply should frame MarketVibe as opportunity inventory");
assert.match(extensionSource, /https:\/\/www\.marketvibe1\.com/, "Copy reply should include the MarketVibe URL");
assert.match(extensionManifest, /www\.google\.com/, "Extension should be allowed to inspect Google result pages");
assert.match(extensionManifest, /www\.bing\.com/, "Extension should be allowed to inspect Bing result pages");
assert.match(extensionSource, /LEAD_HUNT_PRESETS/, "Extension should include Lead Hunt query presets");
assert.match(extensionSource, /function startLeadHunt/, "Extension should include Start Lead Hunt mode");
assert.match(extensionSource, /function logLeadHunt/, "Autopilot should log runner events");
assert.match(extensionSource, /LEAD_HUNT_START/, "Autopilot should log hunt started");
assert.match(extensionSource, /LEAD_HUNT_SCAN_TICK/, "Autopilot should log scan tick");
assert.match(extensionSource, /score decision/, "Autopilot should log score decisions");
assert.match(extensionSource, /LEAD_HUNT_IMPORT/, "Autopilot should log import success");
assert.match(extensionSource, /next match/, "Autopilot should log next match/scroll decisions");
assert.match(extensionSource, /hunt completed/, "Autopilot should log hunt completion");
assert.match(extensionSource, /function ensureLeadHuntRunner/, "Autopilot should explicitly start the unattended runner");
assert.match(extensionSource, /leadHuntIntervalId/, "Autopilot should guard against duplicate runner intervals");
assert.match(extensionSource, /leadHuntTickRunning/, "Autopilot should guard against overlapping ticks");
assert.match(extensionSource, /__MARKETVIBE_BUYER_RADAR_CONTENT_ACTIVE__/, "Extension should use a runtime guard instead of stale DOM to prevent duplicate bootstraps");
assert.match(extensionSource, /#marketvibe-import-button[\s\S]*#marketvibe-lead-hunt-panel[\s\S]*forEach\(\(item\) => item\.remove\(\)\)/, "Extension should remove stale overlay buttons before reinstalling live handlers");
assert.doesNotMatch(extensionSource, /if \(document\.getElementById\("marketvibe-import-button"\)\) return/, "Extension must not skip startup because stale overlay DOM exists");
assert.match(extensionSource, /ensureLeadHuntRunner\("hunt started"\)/, "Run Lead Hunt should start the runner immediately");
assert.match(extensionSource, /ensureLeadHuntRunner\("state restored"\)/, "Restored hunts should restart the runner immediately after navigation");
assert.match(extensionSource, /scheduleLeadHuntAction\(\(\) => void runLeadHuntTick\(reason\), 250, reason\)/, "Runner should fire a tracked immediate tick instead of waiting for manual buttons");
assert.match(extensionSource, /const MAX_SCROLL_ATTEMPTS = 4/, "Autopilot should have a bounded scroll/rescan loop");
assert.match(extensionSource, /function scrollAndRescan/, "Autopilot should scroll and rescan without manual buttons");
assert.match(extensionSource, /function advanceAfterFacebookPage/, "Autopilot should advance to next result or query by itself");
assert.match(extensionSource, /function closeOpenFacebookModal/, "Autopilot should close Facebook modal posts after successful import");
assert.match(extensionSource, /close-modal-after-import|escape-modal-after-import/, "Autopilot should close modal or use Escape after import");
assert.match(extensionSource, /function autoImportLeadHuntNode/, "Lead Hunt should auto-import a high-intent visible card or modal");
assert.match(extensionSource, /buyer-intent-badge/, "High-intent badge path should trigger Lead Hunt auto-import");
assert.match(extensionSource, /data-marketvibe-auto-importing/, "Lead Hunt auto-import should guard against duplicate in-flight imports");
assert.match(extensionSource, /Auto-imported high-intent buyer item/, "High-intent modal auto-import should update running status");
assert.match(extensionSource, /post-import continuation/, "Autopilot should schedule a continuation tick after successful import");
assert.match(extensionSource, /Continuing Buyer Radar/, "Successful import status should not imply the hunt has stopped");
assert.match(extensionSource, /nextActionAt: Date\.now\(\) \+ continuationDelay/, "Successful import should wait a randomized delay before continuing");
assert.match(extensionSource, /ensureLeadHuntRunner\("active state detected"\)/, "Autopilot should run from active localStorage state without manual Send/Next/Skip");
assert.match(extensionSource, /LEAD_HUNT_START/, "Autopilot should log LEAD_HUNT_START");
assert.match(extensionSource, /LEAD_HUNT_SCAN_TICK/, "Autopilot should log LEAD_HUNT_SCAN_TICK");
assert.match(extensionSource, /LEAD_HUNT_IMPORT/, "Autopilot should log LEAD_HUNT_IMPORT");
assert.match(extensionSource, /LEAD_HUNT_SKIP/, "Autopilot should log LEAD_HUNT_SKIP");
assert.match(extensionSource, /LEAD_HUNT_NEXT_QUERY/, "Autopilot should log LEAD_HUNT_NEXT_QUERY");
assert.match(extensionSource, /function scanVisibleLeadHuntCards/, "Autopilot should scan and decide visible cards directly");
assert.match(extensionSource, /decisions\.skipped \+= 1/, "Autopilot should increment skipped decisions for rejected cards");
assert.match(extensionSource, /\[role="dialog"\]/, "Autopilot should scan Facebook modal post text");
assert.match(extensionSource, /STATUS_API_URL/, "Autopilot should sync live counters back to MarketVibe");
assert.match(extensionSource, /api\/internal-marketing-leads/, "Lead Hunt extension should send imports to the internal marketing lead API");
assert.doesNotMatch(extensionSource, /api\/facebook-radar\/import/, "Lead Hunt extension must not send imports to old Facebook Radar import API");
assert.match(extensionManifest, /"storage"/, "Extension should have storage permission for the internal key");
assert.match(extensionManifest, /marketvibe1\.com/, "Extension should run on MarketVibe pages for key storage bridge");
assert.match(extensionManifest, /"version": "0\.1\.9"/, "Extension manifest should be bumped for Auto DM prep toggle release");
assert.match(extensionSource, /chrome\.storage\.local\.set/, "Extension should store the internal key in extension storage");
assert.match(extensionSource, /chrome\.storage\.local\.get/, "Extension should read the internal key from extension storage");
assert.match(extensionSource, /MARKETVIBE_BUYER_RADAR_SAVE_KEY/, "Extension should receive key-save messages from the dashboard");
assert.match(extensionSource, /X-MarketVibe-Internal-Key/, "Extension should pass the internal key in import headers");
assert.match(extensionSource, /Invalid key|Missing key|Connected/, "Extension should expose clear key states");
assert.doesNotMatch(extensionSource, /localStorage\.setItem\("marketvibe_internal_key"/, "Extension must not store the internal key in page localStorage");
assert.match(internalMarketingLeadAuthStatusSource, /internalAccessKey/, "Internal key status API should validate against the server-side configured key");
assert.match(internalMarketingLeadAuthStatusSource, /Connected/, "Internal key status API should return Connected");
assert.match(internalMarketingLeadAuthStatusSource, /Invalid key/, "Internal key status API should return Invalid key");
assert.match(internalMarketingLeadAuthStatusSource, /Missing key/, "Internal key status API should return Missing key");
assert.match(extensionSource, /syncLeadHuntStatus/, "Autopilot should update MarketVibe hunt status counters");
assert.match(extensionSource, /function withLeadHuntStateHash/, "Autopilot should preserve queue state while moving across Facebook, Google, and Bing");
assert.match(extensionSource, /marketvibeLeadHuntState/, "Autopilot should restore cross-domain queue state from URL hash");
assert.match(extensionSource, /function pauseLeadHunt/, "Extension should include Pause Lead Hunt control");
assert.match(extensionSource, /function resumeLeadHunt/, "Extension should include Resume Lead Hunt control");
assert.match(extensionSource, /function stopLeadHunt/, "Extension should include Stop Lead Hunt control");
assert.match(extensionSource, /function clearLeadHuntTimers/, "Stop should clear active Lead Hunt timers");
assert.match(extensionSource, /function pollLeadHuntControl/, "Extension should poll dashboard control state");
assert.match(extensionSource, /fetchWithTimeout/, "Extension should wrap external actions in safe timeouts");
assert.match(extensionSource, /currentLock/, "Extension should keep a per-run current task lock");
assert.match(extensionSource, /skip current requested/i, "Extension should accept dashboard Skip Current requests");
assert.match(extensionSource, /function recoverCurrentLeadHuntItem/, "Skip current should force stuck modal recovery");
assert.match(extensionSource, /function forceCloseModalOrBack/, "Recovery should close modal or navigate back");
assert.match(extensionSource, /STUCK_RECOVERY/, "Extension should log stuck recovery");
assert.match(extensionSource, /const STUCK_RECOVERY_MS = 45000/, "Stuck watchdog should recover after 45 seconds");
assert.match(extensionSource, /const LOADING_RECOVERY_MS = 30000/, "Loading watchdog should recover after 30 seconds");
assert.match(extensionSource, /isFacebookLoadingScreen/, "Extension should detect Facebook loading screens");
assert.match(extensionSource, /recordProcessedUrl/, "Extension should persist processed URL decisions");
assert.match(extensionSource, /postLeadHuntEvent/, "Extension should sync runner events");
assert.match(extensionSource, /function collectIndexedFacebookResultUrls/, "Extension should collect indexed public Facebook result URLs");
assert.match(extensionSource, /LEAD_HUNT_VISITED_URLS_KEY/, "Autopilot should maintain a Buyer Radar-specific visited URL store");
assert.match(extensionSource, /function normalizeLeadHuntUrl/, "Autopilot should normalize URLs before storing or comparing them");
assert.match(extensionSource, /story_fbid/, "Autopilot should canonicalize Facebook story/permalink URLs");
assert.match(extensionSource, /function markLeadHuntUrlVisited/, "Autopilot should mark visited URLs with statuses");
assert.match(extensionSource, /function isLeadHuntUrlVisited/, "Autopilot should skip already visited URLs");
assert.match(extensionSource, /function resetLeadHuntVisitedUrls/, "Fresh Buyer Radar starts should clear stale visited URL state");
assert.match(extensionSource, /resetLeadHuntVisitedUrls\(\);\s*const searches = buildLeadHuntSearches/s, "Start Buyer Radar should reset stale crawler visited state before building a new run");
assert.match(extensionSource, /function isNonUsefulLeadHuntUrl/, "Autopilot should detect non-useful result URLs");
assert.ok(extensionSource.includes("/^\\/images(?:\\/search)?/i"), "Autopilot should skip Bing image result pages");
assert.ok(extensionSource.includes("^\\/photo(?:\\.php)?$") && extensionSource.includes("^\\/media(?:\\/|$)"), "Autopilot should skip Facebook photo/media pages");
assert.match(extensionSource, /function scanVisibleLeadHuntCards/, "Extension should scan visible posts for autopilot");
assert.match(extensionSource, /decisions\.duplicates \+= 1/, "Autopilot should count duplicate/handled posts");
assert.match(extensionSource, /HIGH_INTENT_IMPORT_THRESHOLD = 78/, "Autopilot should keep the high-intent import threshold explicit");
assert.match(extensionSource, /confidenceThreshold/, "Autopilot should use the configured minimum confidence threshold");
assert.match(extensionSource, /score >= confidenceThreshold\(state\)/, "Autopilot should only import matches above the configured threshold");
assert.match(extensionSource, /isHandledPostKey/, "Autopilot should skip duplicate or handled posts");
assert.match(extensionSource, /ignoredLowConfidenceCount/, "Autopilot should count ignored low-confidence items");
assert.match(extensionSource, /function scheduleContinuousAdvance/, "Autopilot should continue after imports by closing modals and scrolling");
assert.match(extensionSource, /function scheduleResultAdvance/, "Autopilot should continue to the next indexed result after imports");
assert.match(extensionSource, /function closeModalAndContinue/, "Autopilot should close stale Facebook pop-outs and continue");
assert.match(extensionSource, /advanceAfterFacebookPage\(stateWithDuplicates, "No service-seller buyer intent found on this page\.", "no_match"\)/, "Autopilot should advance to the next result after no match");
assert.match(extensionSource, /post\.url \|\| location\.href,\s*"imported"/, "Imported posts should mark their post URL visited");
assert.match(extensionSource, /location\.href,\s*"imported"/, "Imported posts should mark the page URL visited");
assert.match(extensionSource, /nextUnvisitedResultIndex/, "Autopilot should avoid revisiting the same indexed Facebook result");
assert.match(extensionSource, /LEAD_HUNT_NEXT_CYCLE/, "Autopilot should start a fresh query cycle instead of stopping at the last search");
assert.match(extensionSource, /Continuing until Stop is pressed/, "Autopilot should keep running until the user presses Stop");
assert.match(extensionSource, /function isKnownHandledUrl/, "Autopilot should avoid reopening indexed URLs it already handled");
assert.match(extensionSource, /maxImportedLeads/, "Autopilot should keep imported lead cap configuration visible");
assert.match(extensionSource, /maxSearches/, "Autopilot should keep search cap configuration visible");
assert.match(extensionSource, /No auto-send or auto-comment/, "Extension panel should show no silent sending/commenting safety");
assert.match(extensionSource, /AUTO_DM_PREP_KEY/, "Extension panel should share the Auto DM prep toggle state");
assert.match(extensionSource, /Auto DM: Off/, "Extension panel should expose an off-by-default Auto DM switch");
assert.match(contactFlowSource, /AUTO_DM_PREP_KEY/, "Contact flow should read the Auto DM prep toggle");
assert.match(contactFlowSource, /AUTO_DM_PREPARED_KEY/, "Contact flow should remember prepared contacts");
assert.match(contactFlowSource, /function runAutoDmPrepForVisibleMatches/, "Contact flow should prepare one visible matched post when Auto DM is enabled");
assert.match(contactFlowSource, /Send manually/, "Contact flow should keep final send manual");
assert.match(contactFlowSource, /if \(!options\.automatic\) opened = openContactTarget\(node\)/, "Automatic Auto DM prep should not open new tabs");
assert.match(contactFlowSource, /Use Open profile\/post to send manually/, "Automatic Auto DM prep should tell the user to open the profile manually");
assert.match(contactFlowSource, /function isOpenableFacebookContactUrl/, "Contact flow should validate profile/post URLs before opening a tab");
assert.doesNotMatch(contactFlowSource, /\.click\(\)/, "Contact flow must not click Facebook buttons programmatically");
assert.match(extensionSource, /Start Buyer Radar/, "Extension panel should label the internal buyer-radar workflow");
assert.match(extensionSource, /Recovered from a blocked, blank, or unavailable page/, "Autopilot should recover from blocked or blank pages");
assert.match(extensionSource, /Repeated failures on this page/, "Autopilot should advance after repeated failures");
assert.match(extensionSource, /Buyer Radar skipped rejected or stuck Facebook post/, "Rejected or stuck Facebook post modals should be skipped and advanced immediately");
assert.match(extensionSource, /OUTREACH_MODES/, "Extension should include outreach mode architecture");
assert.match(extensionSource, /function createContextualReply/, "Extension should generate contextual reply drafts");
assert.match(extensionSource, /replyDraft/, "Autopilot should save reply draft with imported leads");
assert.match(extensionSource, /outreachMode/, "Autopilot should save outreach mode with imported leads");

assert.match(importedPageSource, /<strong className="text-white">Group:<\/strong>/, "Imported page should show group name");
assert.match(importedPageSource, /<strong className="text-white">Author:<\/strong>/, "Imported page should show author name");
assert.match(importedPageSource, /<strong className="text-white">Post:<\/strong>/, "Imported page should show clean post text");
assert.match(importedPageSource, /<strong className="text-white">Score:<\/strong>/, "Imported page should show score");
assert.match(importedPageSource, /card\.queryUsed/, "Imported page should show query used when available");
assert.match(importedPageSource, /card\.sourceUsed/, "Imported page should show source used when available");
assert.match(importedPageSource, /card\.replyDraft/, "Imported page should show reply draft when available");

const helperSource = source.toLowerCase();
assert.equal(helperSource.includes("fetch("), false, "Facebook Radar helper should not scrape or fetch Facebook");
assert.equal(helperSource.includes("postmessage"), false, "Facebook Radar helper should not auto-message people");
assert.equal(helperSource.includes("auto-post"), false, "Facebook Radar helper should not add autoposting functions");

console.log("Facebook Radar tests passed.");
