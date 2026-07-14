import assert from "node:assert/strict";
import { classifyMarketVibeCommand } from "../src/lib/allrounder-command-router";

const health = classifyMarketVibeCommand("Show live health");
assert.equal(health.action, "health");
assert.equal(health.requiresApproval, false);
assert.equal(health.mutatesData, false);

const autopilot = classifyMarketVibeCommand("Run full autopilot");
assert.equal(autopilot.action, "autopilot");
assert.equal(autopilot.requiresApproval, true);
assert.equal(autopilot.mutatesData, true);
assert.equal(autopilot.sendsEmail, true);

const buyer = classifyMarketVibeCommand("Recover buyer pipeline");
assert.equal(buyer.action, "buyer-pipeline");
assert.equal(buyer.requiresApproval, true);
assert.equal(buyer.sendsEmail, false);

const discovery = classifyMarketVibeCommand("Find and verify opportunities");
assert.equal(discovery.action, "opportunity-discovery");
assert.equal(discovery.requiresApproval, true);

const stale = classifyMarketVibeCommand("Replace stale opportunities");
assert.equal(stale.action, "stale-replacement");
assert.equal(stale.requiresApproval, true);

const delivery = classifyMarketVibeCommand("Publish due deliveries");
assert.equal(delivery.action, "delivery");
assert.equal(delivery.requiresApproval, true);
assert.equal(delivery.sendsEmail, true);

const unsupported = classifyMarketVibeCommand("Write me a generic marketing plan");
assert.equal(unsupported.action, "unsupported");
assert.equal(unsupported.requiresApproval, false);
assert.equal(unsupported.mutatesData, false);

console.log("AllRounder command router tests passed.");
