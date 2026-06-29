import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync("src/lib/facebook-radar.ts", "utf8");
const importSource = fs.readFileSync("src/lib/facebook-radar-import.ts", "utf8");
const pageSource = fs.readFileSync("src/app/facebook-radar/page.tsx", "utf8");
const importedPageSource = fs.readFileSync("src/app/facebook-radar/imported/page.tsx", "utf8");
const extensionSource = fs.readFileSync("browser-extension/facebook-radar-importer/content.js", "utf8");
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
  targetBuyer: "founders, freelancers, agencies",
  niche: "customer acquisition",
  painKeywords: "no leads, no traffic, cold outreach not working",
});
assert.match(highIntentPhrases, /"no one replies to my outreach"|"cold outreach not working"|"how do i get clients"|"looking for a tool to find leads"/, "Searches should prioritize high-intent buyer pain");
assert.doesNotMatch(highIntentPhrases, /need clients web design|web design clients|looking for web developer|need web developer|cheap website|hire developer|buy leads|guaranteed leads/i, "Weak or hiring searches should be removed");

const analysis = analyzeFacebookLead({
  postText: "I run a small web design service and cold outreach is not working. How do I get clients without spamming people?",
  targetBuyer: "web designers",
  painKeywords: "need clients, cold outreach not working",
  sourceUrl: "",
});
assert.notEqual(analysis.action, "Skip", "Analyze pasted post should return a buyer opportunity");
assert.match(analysis.quickReply, /outreach|visible problem|service pitch|platforms/i, "Analyze pasted post should return helpful replies");
assert.match(analysis.manualNote, /manual|links|profile|posting/i, "Manual note should reinforce manual engagement");

const cheapDeveloper = analyzeFacebookLead({
  postText: "I need a web developer for my clients' projects. I will pay $50 per website.",
  targetBuyer: "web designers",
  painKeywords: "need clients",
  sourceUrl: "",
});
assert.equal(cheapDeveloper.action, "Skip", "Cheap web developer hiring posts should be Skip / bad fit");

const launchedBusiness = analyzeFacebookLead({
  postText: "I launched a business but don't know how to market it. Where do I find customers?",
  targetBuyer: "small business owners",
  painKeywords: "need customers, no leads",
  sourceUrl: "",
});
assert.equal(launchedBusiness.score, "High", "Launched business marketing confusion should be High fit");

const outreachPain = analyzeFacebookLead({
  postText: "Cold outreach not working. No one replies to my outreach. How do I get clients?",
  targetBuyer: "agencies",
  painKeywords: "cold outreach not working",
  sourceUrl: "",
});
assert.equal(outreachPain.score, "High", "Cold outreach not working should be High fit");

const shopifyPain = analyzeFacebookLead({
  postText: "My Shopify store has no sales and the store is not converting. What should I fix first?",
  targetBuyer: "ecommerce founders",
  painKeywords: "no sales, not converting",
  sourceUrl: "",
});
assert.equal(shopifyPain.score, "High", "Shopify store no sales should be High fit");

const guaranteedLeads = analyzeFacebookLead({
  postText: "We provide guaranteed leads for agencies. DM me for packages.",
  targetBuyer: "agencies",
  painKeywords: "need leads",
  sourceUrl: "",
});
assert.equal(guaranteedLeads.action, "Skip", "Guaranteed lead offer posts should be Skip / bad fit");

assert.ok(BUYER_INTENT_QUERY_LIBRARY.includes("I need a website for my business"), "Buyer intent query library should include website buyer queries");
assert.ok(BUYER_INTENT_QUERY_LIBRARY.includes("my business is slow need help"), "Buyer intent query library should include business slowdown queries");

const defaultFilters = createDefaultFacebookFilters();
const buyerIntentPreviews = filterAndRankFacebookLeads([
  {
    text: "I own a local cleaning business and my website is not getting customers. Need more leads for my business. Any advice?",
    url: "https://www.facebook.com/groups/local/posts/123",
    groupName: "Local Business Owners",
    groupMembers: 4200,
    groupPostsPerDay: 18,
    comments: 4,
    reactions: 7,
    language: "English",
    isPublicGroup: true,
  },
], defaultFilters);
assert.equal(buyerIntentPreviews[0].intentScore, "High", "Business-owner buyer intent should score High");
assert.equal(buyerIntentPreviews[0].passedFilters, true, "Business-owner buyer intent should pass filters");

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

assert.equal(shouldSendFacebookLead(buyerIntentPreviews[0], new Set()), true, "Only filtered High Intent posts should be sendable");
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
assert.match(extensionSource, /my website gets no traffic/, "Facebook importer should highlight traffic pain");
assert.match(extensionSource, /looking for \(\?:a \)\?tool to find leads/, "Facebook importer should highlight tool-buying intent");
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
assert.match(extensionSource, /No high-intent posts found on visible page/, "Extension should show no-results status in the floating badge");
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
assert.match(extensionSource, /MarketVibe helps spot public business signals/, "Copy reply should mention MarketVibe");
assert.match(extensionSource, /https:\/\/www\.marketvibe1\.com/, "Copy reply should include the MarketVibe URL");

assert.match(importedPageSource, /<strong className="text-white">Group:<\/strong>/, "Imported page should show group name");
assert.match(importedPageSource, /<strong className="text-white">Author:<\/strong>/, "Imported page should show author name");
assert.match(importedPageSource, /<strong className="text-white">Post:<\/strong>/, "Imported page should show clean post text");
assert.match(importedPageSource, /<strong className="text-white">Score:<\/strong>/, "Imported page should show score");

const helperSource = source.toLowerCase();
assert.equal(helperSource.includes("fetch("), false, "Facebook Radar helper should not scrape or fetch Facebook");
assert.equal(helperSource.includes("postmessage"), false, "Facebook Radar helper should not auto-message people");
assert.equal(helperSource.includes("auto-post"), false, "Facebook Radar helper should not add autoposting functions");

console.log("Facebook Radar tests passed.");
assert.match(extensionSource, /function moveToNextQualifiedPost/, "Extension should include a Next qualified post workflow");
assert.match(extensionSource, /function skipCurrentQualifiedPost/, "Extension should allow skipping the current qualified post");
assert.match(extensionSource, /function renderQueueControls/, "Extension should render queue controls");
assert.match(extensionSource, /Send \+ next/, "Extension should include a Send + next action");
assert.match(extensionSource, /Next match/, "Extension should include a Next match action");
assert.match(extensionSource, /Skip current/, "Extension should include a Skip current action");
assert.match(extensionSource, /marketvibe_facebook_handled_posts/, "Extension should persist handled posts to avoid repeats");
assert.match(extensionSource, /scrollIntoView\(\{ behavior: "smooth", block: "center" \}\)/, "Extension should scroll to the next match without opening unrelated posts");
