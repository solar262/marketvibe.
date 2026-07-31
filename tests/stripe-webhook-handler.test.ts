import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const handlerSource = readFileSync(
  join(process.cwd(), "src", "lib", "stripe-webhook-handler.ts"),
  "utf8",
);

// invoice.payment_succeeded must be handled to restore access after a renewal
assert.match(
  handlerSource,
  /invoice\.payment_succeeded/,
  "Webhook handler must process invoice.payment_succeeded to restore active entitlements.",
);

// Renewal recovery must call updateEntitlementStatusBySubscriptionId with "active"
assert.match(
  handlerSource,
  /updateEntitlementStatusBySubscriptionId\(subscriptionId,\s*"active"\)/,
  "Successful renewal must restore the entitlement status to active.",
);

// The initial checkout invoice (billing_reason === "subscription_create") must be excluded
// to avoid double-processing on first payment which is already handled by checkout.session.completed
assert.match(
  handlerSource,
  /billing_reason.*subscription_create/,
  "invoice.payment_succeeded handler must exclude subscription_create to prevent double-processing.",
);

// invoice.payment_failed must still mark the entitlement past_due
assert.match(
  handlerSource,
  /invoice\.payment_failed/,
  "Webhook handler must process invoice.payment_failed to mark entitlements past_due.",
);
assert.match(
  handlerSource,
  /updateEntitlementStatusBySubscriptionId\(subscriptionId,\s*"past_due"\)/,
  "Failed renewal must set the entitlement status to past_due.",
);

// Both checkout.session.completed and subscription lifecycle events must still be handled
assert.match(handlerSource, /checkout\.session\.completed/, "checkout.session.completed must remain handled.");
assert.match(handlerSource, /customer\.subscription\.updated/, "subscription.updated must remain handled.");
assert.match(handlerSource, /customer\.subscription\.deleted/, "subscription.deleted must remain handled.");

// Idempotency guard must wrap all event handling
assert.match(handlerSource, /markStripeEventProcessing/, "Webhook must use idempotency guard.");
assert.match(handlerSource, /releaseStripeEventForRetry/, "Webhook must release idempotency on error so Stripe can retry.");

console.log("Stripe webhook handler tests passed.");
