import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync("src/lib/facebook-radar.ts", "utf8");
const pageSource = fs.readFileSync("src/app/facebook-radar/page.tsx", "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    strict: true,
  },
});

const sandbox = { exports: {} };
vm.runInNewContext(transpiled.outputText, sandbox, { filename: "facebook-radar.js" });

const { analyzeFacebookLead, generateFacebookSearchLinks } = sandbox.exports;

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

assert.match(pageSource, /activeSearchLink = availableSearchLinks/, "One-card workflow state should use one active search card");
assert.match(pageSource, /function markBadNext/, "Mark Bad / Next workflow should exist");
assert.match(pageSource, /skipSearch\(link\)/, "Mark Bad should move the current card into skipped searches");
assert.match(pageSource, /setMode\("analyze"\)/, "Mark Good should switch to Analyze mode");
assert.match(pageSource, /setPostText\(PASTE_PROMPT\)/, "Mark Good should prefill paste prompt");
assert.match(pageSource, /setCurrentSearchIndex\(0\)/, "Reset should clear progress to the first search");
assert.match(pageSource, /Previous Search/, "Previous Search button should exist");
assert.match(pageSource, /Open Posts/, "Open Posts primary button should exist");

const helperSource = source.toLowerCase();
assert.equal(helperSource.includes("fetch("), false, "Facebook Radar helper should not scrape or fetch Facebook");
assert.equal(helperSource.includes("postmessage"), false, "Facebook Radar helper should not auto-message people");
assert.equal(helperSource.includes("auto-post"), false, "Facebook Radar helper should not add autoposting functions");

console.log("Facebook Radar tests passed.");
