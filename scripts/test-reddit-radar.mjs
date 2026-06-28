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
  cleanRssBody,
  hasAiIntent,
  hasCustomerProblemSignal,
  hasUsablePostSignal,
  isBlockedJobPost,
  isLowIntelPost,
  isObviousRssJunk,
  lowIntelIntel,
} = sandbox.exports;

assert.equal(hasAiIntent("Vail Daily needs a new tourism website"), false, "Vail Daily should not trigger AI intent");
assert.equal(hasAiIntent("Vail Daily lost car key fob"), false, "Vail Daily lost car key fob should not trigger AI intent");
assert.equal(hasAiIntent("Can ChatGPT help with support replies?"), true, "ChatGPT should trigger AI intent");
assert.equal(hasAiIntent("Looking for an A.I. automation workflow"), true, "A.I. and automation should trigger AI intent");
assert.equal(isBlockedJobPost("Hiring remote developer", "Full-time role, apply now, worldwide"), true, "Hiring remote developer post should be blocked");
assert.equal(isBlockedJobPost("My Shopify store has no traffic, what should I do?", ""), false, "Shopify pain post should not be blocked as a job");

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
assert.equal(hasUsablePostSignal("My Shopify store has no traffic, what should I do?", "", 0, 0), true, "Shopify traffic question should be shown");
assert.equal(hasUsablePostSignal("Need help with traffic?", "", 0, 0), true, "Title questions with pain should remain usable");
assert.equal(hasUsablePostSignal("Quiet launch update", "", 2, 0), true, "Active comments should remain usable");
assert.equal(hasUsablePostSignal("Quiet launch update", "", 0, 0), false, "Thin inactive posts should not look usable");
assert.equal(isObviousRssJunk("submitted by /u/example", "[comments] comments link"), true, "Obvious RSS junk should be hidden");
assert.equal(isObviousRssJunk("Need help with no traffic?", ""), false, "Painful title-only posts should not be treated as RSS junk");
const lowIntel = lowIntelIntel();
assert.equal(lowIntel.action, "Skip");
assert.equal(lowIntel.intent, "low-intel");
assert.equal(lowIntel.reply, "LOW INTEL — SKIP THIS ONE...\n\nThere isn't enough context or engagement to write a useful reply.\n\nLook for posts with a real question, clear problem, or active comments.");

console.log("Reddit Radar helper tests passed.");
