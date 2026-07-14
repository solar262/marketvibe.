import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(process.cwd(), "browser-extension", "sales-navigator-companion", "content.js"), "utf8");

assert.match(source, /const DEFAULT_WORK_DURATION_MINUTES = 15;/, "Navigator break defaults must work for 15 minutes.");
assert.match(source, /const DEFAULT_BREAK_DURATION_MINUTES = 5;/, "Navigator break defaults must pause for 5 minutes.");
assert.match(source, /workDurationMinutes: DEFAULT_WORK_DURATION_MINUTES/, "Finder state must store the work duration setting.");
assert.match(source, /breakDurationMinutes: DEFAULT_BREAK_DURATION_MINUTES/, "Finder state must store the break duration setting.");
assert.match(source, /workStartedAt: ""/, "Finder state must track when the current work period started.");
assert.match(source, /breakUntil: ""/, "Finder state must track the active break end time.");

assert.match(source, /marketvibe-sn-work-duration/, "Navigator settings must expose a work duration input.");
assert.match(source, /marketvibe-sn-break-duration/, "Navigator settings must expose a break duration input.");
assert.match(source, /const workDurationInput = document\.getElementById\("marketvibe-sn-work-duration"\);/, "Start must read the configured work duration.");
assert.match(source, /const breakDurationInput = document\.getElementById\("marketvibe-sn-break-duration"\);/, "Start must read the configured break duration.");
assert.match(source, /workDurationMinutes,[\s\S]+breakDurationMinutes,[\s\S]+workStartedAt: new Date\(\)\.toISOString\(\),[\s\S]+breakUntil: ""/, "Starting the finder must persist duration settings and start the work timer.");

const continueIndex = source.indexOf("async function continueFinderIfActive()");
const continueSource = source.slice(continueIndex);
const breakActiveIndex = continueSource.indexOf("if (breakActive(current.finder))");
const workReachedIndex = continueSource.indexOf("if (workDurationReached(current.finder))");
const rateLimitIndex = continueSource.indexOf("if (rateLimitMessageVisible())");
const captureIndex = continueSource.indexOf("await autoScrollVisibleResults();");
assert.ok(continueIndex >= 0, "Navigator must keep the existing active-run loop.");
assert.ok(breakActiveIndex >= 0 && breakActiveIndex < rateLimitIndex, "Active breaks must pause the loop before browser automation advances.");
assert.ok(workReachedIndex >= 0 && workReachedIndex < rateLimitIndex, "Work duration must be checked before browser automation advances.");
assert.ok(workReachedIndex < captureIndex, "Work duration must pause before lead capture for that loop pass.");
assert.match(continueSource, /scheduleBreakResume\(current\.finder\);[\s\S]+return;/, "Active breaks must schedule resume and return without changing position.");
assert.match(continueSource, /breakUntil: "",[\s\S]+workStartedAt: new Date\(\)\.toISOString\(\),[\s\S]+status: "Break complete\. Resuming finder\."/, "Expired breaks must clear break state and restart the work timer before resuming.");

const pauseSource = source.slice(source.indexOf("async function pauseFinderForBreak"), source.indexOf("async function pauseFinderForCooldown"));
assert.match(pauseSource, /\.\.\.finder,[\s\S]+breakUntil,/, "Pausing for break must preserve the existing finder state.");
assert.doesNotMatch(pauseSource, /\bindex:|\bpage:/, "Pausing for break must not move the search index or page.");

assert.match(source, /Remaining break: \$\{formatDuration\(remainingBreakMs\(finder\)\)\}\./, "Panel status must show the remaining break time.");
assert.match(source, /scheduleBreakStatusRefresh\(finder\);/, "Panel status must refresh while a break is active.");
assert.match(source, /active: false, breakUntil: "", status: "Stopped\."/, "Manual stop must clear any pending break.");

assert.match(source, /function scheduleCooldownResume\(finder\)/, "Cooldowns must schedule an automatic resume.");
assert.match(source, /cooldownResumeTimer = window\.setTimeout\(\(\) => \{[\s\S]+void continueFinderIfActive\(\);[\s\S]+\}, remainingCooldownMs\(finder\)\);/, "Cooldown resume must call the existing loop only after the cooldown ends.");
assert.match(source, /Remaining cooldown: \$\{formatDuration\(remainingCooldownMs\(finder\)\)\}\./, "Panel status must show remaining cooldown time.");
assert.match(source, /scheduleCooldownStatusRefresh\(finder\);/, "Panel status must refresh while a cooldown is active.");
assert.match(source, /active: true,[\s\S]+cooldownUntil,[\s\S]+Finder will resume automatically\./, "Cooldown pause must preserve an active finder state for unattended resume.");
assert.match(continueSource, /if \(cooldownActive\(current\.finder\)\) \{[\s\S]+scheduleCooldownResume\(current\.finder\);[\s\S]+return;[\s\S]+\}/, "Active cooldowns must pause the loop and schedule resume.");
assert.match(continueSource, /cooldownUntil: "",[\s\S]+workStartedAt: new Date\(\)\.toISOString\(\),[\s\S]+status: "Cooldown complete\. Resuming finder\."/, "Expired cooldowns must clear cooldown state and restart the work timer before resuming.");
assert.match(continueSource, /await pauseFinderForCooldown\(current\.finder, "Sales Navigator showed Too Many Requests\."\);/, "Rate limits must trigger automatic cooldown instead of requiring manual restart.");
assert.match(source, /const LOW_YIELD_ROTATE_PASSES = 2;/, "Finder must skip low-yield searches without operator intervention.");
assert.match(source, /const AUTO_IMPORT_MIN_ROWS = 25;/, "Finder must have a conservative automatic import threshold.");
assert.match(source, /autoImport: true/, "Auto-import must default on for unattended stock collection.");
assert.match(source, /marketvibe-sn-auto-import/, "Navigator settings must expose auto-import control.");
assert.match(continueSource, /if \(noGrowthPasses >= LOW_YIELD_ROTATE_PASSES\) \{[\s\S]+Low-yield search skipped/, "Low-yield searches must rotate automatically instead of pausing for the operator.");
assert.match(continueSource, /await startAutoImportAndResume\(\{ \.\.\.afterCapture\.finder, sessionStartRows: afterCount, noGrowthPasses \}, reason\);/, "Safe batch completion must auto-import when enough rows are stored.");
assert.match(source, /navigatorAutoReturn=1/, "Automatic import must request return to Sales Navigator.");
assert.match(source, /resumeFinderAfterSuccess/, "MarketVibe auto-import must support returning to the finder.");
assert.match(source, /Returning to Sales Navigator\./, "Successful auto-import must return to Sales Navigator.");
assert.match(source, /Auto-import failed:[\s\S]+Finder paused for review\./, "Failed auto-import must pause rather than loop blindly.");

console.log("Sales Navigator break/resume tests passed.");
