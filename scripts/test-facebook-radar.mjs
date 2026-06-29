import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync("src/lib/facebook-radar.ts", "utf8");
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

const webDesignPhrases = phrasesFor({
  targetBuyer: "web designers, SEO freelancers",
  niche: "web design",
  painKeywords: "need clients, cold outreach not working",
});
assert.match(webDesignPhrases, /need more clients web design|cold outreach not working web design/, "Web designer input should create web design client search links");

const sneakerPhrases = phrasesFor({
  targetBuyer: "sneaker resellers",
  niche: "sneaker reselling",
  painKeywords: "no sales, need customers",
});
assert.match(sneakerPhrases, /sneaker reselling no sales|where to sell sneakers|reselling shoes/, "Sneaker reseller input should create sneaker selling/reselling links");

const bookPhrases = phrasesFor({
  targetBuyer: "book sellers",
  niche: "book selling",
  painKeywords: "no sales",
});
assert.match(bookPhrases, /book selling no sales|where to sell books online|book seller no customers/, "Book seller input should create book selling/no sales links");

const roofingPhrases = phrasesFor({
  targetBuyer: "roofers",
  niche: "roofing",
  painKeywords: "need leads",
});
assert.match(roofingPhrases, /roofing leads|roofer no leads|roofing quote problem/, "Roofer input should create roofing lead/search links");

const analysis = analyzeFacebookLead({
  postText: "I run a small web design service and cold outreach is not working. How do I get clients without spamming people?",
  targetBuyer: "web designers",
  painKeywords: "need clients, cold outreach not working",
  sourceUrl: "",
});
assert.notEqual(analysis.action, "Skip", "Analyze pasted post should return a buyer opportunity");
assert.match(analysis.quickReply, /outreach|visible problem|service pitch|platforms/i, "Analyze pasted post should return helpful replies");
assert.match(analysis.manualNote, /manual|links|profile|posting/i, "Manual note should reinforce manual engagement");

const helperSource = source.toLowerCase();
assert.equal(helperSource.includes("fetch("), false, "Facebook Radar helper should not scrape or fetch Facebook");
assert.equal(helperSource.includes("postmessage"), false, "Facebook Radar helper should not auto-message people");
assert.equal(helperSource.includes("auto-post"), false, "Facebook Radar helper should not add autoposting functions");

console.log("Facebook Radar tests passed.");
