import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildAdminBlockerAlertEmail,
  buildCheckoutRecoveryEmail,
  buildCheckoutStartedEmail,
  buildOnboardingReminderEmail,
  buildSupportAutoReplyEmail,
  checkoutStartedOffer,
  isValidRevenueEmail,
  mergeRevenueAutomationMetadata,
  normalizeRevenueEmail,
  productFromCheckoutStartedOffer,
} from "../src/lib/revenue-automation";

assert.equal(normalizeRevenueEmail(" Buyer@Example.COM "), "buyer@example.com");
assert.equal(isValidRevenueEmail("buyer@example.com"), true);
assert.equal(isValidRevenueEmail("not-an-email"), false);

assert.equal(checkoutStartedOffer("proof_pack"), "checkout_started:proof_pack");
assert.equal(productFromCheckoutStartedOffer("checkout_started:radar"), "radar");
assert.equal(productFromCheckoutStartedOffer("contact"), null);

const checkoutStarted = buildCheckoutStartedEmail({
  email: "buyer@example.com",
  name: "Buyer",
  productCode: "proof_pack",
  checkoutUrl: "https://checkout.stripe.com/c/test",
});
assert.match(checkoutStarted.subject, /MarketVibe Proof Pack checkout link/);
assert.match(checkoutStarted.textContent, /https:\/\/checkout\.stripe\.com\/c\/test/);

const checkoutRecovery = buildCheckoutRecoveryEmail({
  email: "buyer@example.com",
  name: "Buyer",
  productCode: "growth_desk",
});
assert.match(checkoutRecovery.subject, /Finish your MarketVibe Growth Desk checkout/);
assert.match(checkoutRecovery.textContent, /Return to MarketVibe pricing/);

const onboardingReminder = buildOnboardingReminderEmail({
  email: "buyer@example.com",
  productCode: "radar",
  stripeSessionId: "cs_test_123",
});
assert.match(onboardingReminder.subject, /Complete your MarketVibe Radar onboarding/);
assert.match(onboardingReminder.textContent, /\/onboarding\/radar\?session_id=cs_test_123&email=buyer%40example\.com/);

const supportReply = buildSupportAutoReplyEmail({
  email: "buyer@example.com",
  name: "Buyer",
  offer: "agency-partner",
});
assert.match(supportReply.subject, /MarketVibe enquiry/);
assert.match(supportReply.textContent, /View MarketVibe pricing/);

const adminAlert = buildAdminBlockerAlertEmail([
  {
    kind: "onboarding",
    status: "awaiting_supply",
    email: "buyer@example.com",
    product: "proof_pack",
    detail: "Niche: agencies",
  },
]);
assert.match(adminAlert.subject, /MarketVibe revenue blockers: 1/);
assert.match(adminAlert.textContent, /awaiting_supply/);

const metadata = mergeRevenueAutomationMetadata({ existing: true }, "sent_at", "2026-07-13T09:15:00.000Z");
assert.deepEqual(metadata, { existing: true, sent_at: "2026-07-13T09:15:00.000Z" });

const checkoutRouteSource = readFileSync(join(process.cwd(), "src", "app", "api", "checkout", "route.ts"), "utf8");
assert.match(checkoutRouteSource, /recordCheckoutStarted/, "Checkout must record recoverable checkout starts.");
assert.match(checkoutRouteSource, /sendCheckoutStartedEmail/, "Checkout must send a checkout-link follow-up when email is known.");
assert.match(checkoutRouteSource, /Promise\.allSettled/, "Checkout automation must not block Stripe checkout on email/persistence failure.");

const checkoutButtonSource = readFileSync(join(process.cwd(), "src", "components", "CheckoutButton.tsx"), "utf8");
assert.match(checkoutButtonSource, /customer: \{ email: normalizedEmail, name \}/, "Direct checkout buttons must pass customer email for recovery.");
assert.match(checkoutButtonSource, /Enter a valid email address to continue/, "Direct checkout buttons must collect a valid email.");

const contactRouteSource = readFileSync(join(process.cwd(), "src", "app", "api", "contact", "route.ts"), "utf8");
assert.match(contactRouteSource, /sendCustomerSupportAutoReply/, "Contact requests must send an automatic customer reply.");
assert.match(contactRouteSource, /sendAdminRevenueAlert/, "Contact requests must alert the admin recipient.");

const cronRoute = join(process.cwd(), "src", "app", "api", "cron", "revenue-automation", "route.ts");
assert.equal(existsSync(cronRoute), true, "Revenue automation cron route must exist.");
const cronRouteSource = readFileSync(cronRoute, "utf8");
assert.match(cronRouteSource, /requireCron/, "Revenue automation cron route must be protected.");
assert.match(cronRouteSource, /runRevenueAutomation/, "Revenue automation cron route must run the automation module.");

const vercelConfig = readFileSync(join(process.cwd(), "vercel.json"), "utf8");
assert.match(vercelConfig, /\/api\/cron\/revenue-automation/, "Vercel must schedule revenue automation.");
assert.match(vercelConfig, /15 9 \* \* \*/, "Revenue automation cron must use a daily Hobby-compatible schedule.");

console.log("Revenue automation tests passed.");
