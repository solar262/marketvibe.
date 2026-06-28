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
  isLowIntelPost,
  lowIntelIntel,
} = sandbox.exports;

assert.equal(hasAiIntent("Vail Daily needs a new tourism website"), false, "Vail Daily should not trigger AI intent");
assert.equal(hasAiIntent("Can ChatGPT help with support replies?"), true, "ChatGPT should trigger AI intent");
assert.equal(hasAiIntent("Looking for an A.I. automation workflow"), true, "A.I. and automation should trigger AI intent");

const rssJunk = cleanRssBody(`
  submitted by /u/example to /r/marketing
  [comments] comments link reddit metadata
`);
assert.equal(rssJunk, "", "RSS metadata junk should be removed");

const usefulRss = cleanRssBody(`
  I am struggling to get any qualified leads from my local service website. The homepage gets traffic, but people do not book calls and I cannot tell if the issue is the offer, the CTA, or the contact flow.
  submitted by /u/example [comments]
`);
assert.equal(usefulRss, "", "RSS body containing Reddit metadata should not be used as post context");

assert.equal(isLowIntelPost("", 0, 0), true, "0/0 empty post should be low-intel");
const lowIntel = lowIntelIntel();
assert.equal(lowIntel.action, "Skip");
assert.equal(lowIntel.intent, "low-intel");
assert.equal(lowIntel.reply, "LOW INTEL — SKIP THIS ONE...\n\nThere isn't enough context or engagement to write a useful reply.\n\nLook for posts with a real question, clear problem, or active comments.");

console.log("Reddit Radar helper tests passed.");
