import {
  addContactToMarketVibeList,
  addOrUpdateContact,
  dashboardUrl,
  marketVibeUrl,
  pricingUrl,
  sendTransactionalEmail,
} from "@/lib/brevo";
import { appendCustomerAccessParams, createCustomerAccessToken } from "@/lib/customer-access";
import { onboardingPathForProduct, premiumProductLabel, type PremiumProductCode } from "@/lib/premium-products";
import { getSupabaseAdmin } from "@/lib/supabase";

type RevenueEmail = {
  subject: string;
  htmlContent: string;
  textContent: string;
};

type CheckoutStartedInput = {
  email?: string;
  name?: string;
  productCode: PremiumProductCode;
  requestedProduct?: string;
  stripeSessionId?: string;
  checkoutUrl?: string | null;
  orderNumber?: string;
  niche?: string;
};

type SupportReplyInput = {
  email: string;
  name?: string;
  offer?: string;
};

type AutomationOptions = {
  limit?: number;
  abandonedCheckoutAfterHours?: number;
  onboardingReminderAfterHours?: number;
};

type Blocker = {
  kind: string;
  status: string;
  email: string;
  product?: string;
  detail: string;
};

const checkoutStartedPrefix = "checkout_started:";
const onboardingReminderMetadataKey = "revenue_onboarding_reminder_sent_at";

export function normalizeRevenueEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export function isValidRevenueEmail(value: unknown) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizeRevenueEmail(value));
}

function escapeHtml(value: unknown) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function productFromUnknown(value: unknown): PremiumProductCode | null {
  if (value === "proof_pack" || value === "radar" || value === "growth_desk") return value;
  return null;
}

function plainRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {};
}

export function checkoutStartedOffer(productCode: PremiumProductCode) {
  return `${checkoutStartedPrefix}${productCode}`;
}

export function productFromCheckoutStartedOffer(offer: string) {
  if (!offer.startsWith(checkoutStartedPrefix)) return null;
  return productFromUnknown(offer.slice(checkoutStartedPrefix.length));
}

export function mergeRevenueAutomationMetadata(metadata: unknown, key: string, value: string) {
  return { ...plainRecord(metadata), [key]: value };
}

export function revenueAdminRecipient() {
  return normalizeRevenueEmail(
    process.env.MARKETVIBE_ALERT_EMAIL
    || process.env.ADMIN_ALERT_EMAIL
    || process.env.ADMIN_EMAIL
    || process.env.OUTREACH_FROM_EMAIL
    || "",
  );
}

export function buildCheckoutStartedEmail(input: CheckoutStartedInput): RevenueEmail {
  const label = premiumProductLabel(input.productCode);
  const checkoutUrl = input.checkoutUrl || pricingUrl;
  return {
    subject: `Your ${label} checkout link`,
    htmlContent: `
      <p>Hi${input.name ? ` ${escapeHtml(input.name)}` : ""},</p>
      <p>Your ${label} checkout is ready.</p>
      <p><a href="${escapeHtml(checkoutUrl)}">Continue secure checkout</a></p>
      <p>If you already completed payment, use the onboarding link from your confirmation email.</p>
      <p>MarketVibe</p>
    `,
    textContent: `Hi${input.name ? ` ${input.name}` : ""},

Your ${label} checkout is ready.

Continue secure checkout:
${checkoutUrl}

If you already completed payment, use the onboarding link from your confirmation email.

MarketVibe`,
  };
}

export function buildCheckoutRecoveryEmail(input: { email: string; name?: string | null; productCode: PremiumProductCode }): RevenueEmail {
  const label = premiumProductLabel(input.productCode);
  return {
    subject: `Finish your ${label} checkout`,
    htmlContent: `
      <p>Hi${input.name ? ` ${escapeHtml(input.name)}` : ""},</p>
      <p>You started MarketVibe checkout for ${label}, but payment has not completed yet.</p>
      <p><a href="${pricingUrl}">Return to MarketVibe pricing</a></p>
      <p>Reply to this email if you need help choosing the right product.</p>
      <p>MarketVibe</p>
    `,
    textContent: `Hi${input.name ? ` ${input.name}` : ""},

You started MarketVibe checkout for ${label}, but payment has not completed yet.

Return to MarketVibe pricing:
${pricingUrl}

Reply to this email if you need help choosing the right product.

MarketVibe`,
  };
}

export function buildOnboardingReminderEmail(input: {
  email: string;
  productCode: PremiumProductCode;
  stripeSessionId?: string | null;
}): RevenueEmail {
  const label = premiumProductLabel(input.productCode);
  const onboardingUrl = `${marketVibeUrl}${onboardingPathForProduct(input.productCode, input.stripeSessionId || undefined, input.email)}`;
  return {
    subject: `Complete your ${label} onboarding`,
    htmlContent: `
      <p>Hi,</p>
      <p>Your ${label} payment is active, but onboarding is not complete yet.</p>
      <p><a href="${onboardingUrl}">Complete onboarding</a></p>
      <p>Once that is submitted, MarketVibe can match and deliver your buyer-intent opportunities automatically.</p>
      <p>MarketVibe</p>
    `,
    textContent: `Hi,

Your ${label} payment is active, but onboarding is not complete yet.

Complete onboarding:
${onboardingUrl}

Once that is submitted, MarketVibe can match and deliver your buyer-intent opportunities automatically.

MarketVibe`,
  };
}

export function buildSupportAutoReplyEmail(input: SupportReplyInput): RevenueEmail {
  const premium = input.offer === "agency-partner" || input.offer === "data-licence";
  const greeting = `Hi${input.name ? ` ${input.name}` : ""},`;
  const subject = premium ? "We received your MarketVibe enquiry" : "We received your MarketVibe message";
  const body = premium
    ? "Your enquiry is in the MarketVibe queue. If you want to move faster, you can also start with Proof Pack, Radar, or Growth Desk from the pricing page."
    : "Your message is in the MarketVibe queue. You can continue exploring MarketVibe pricing and dashboard access while we review it.";

  return {
    subject,
    htmlContent: `
      <p>${escapeHtml(greeting)}</p>
      <p>${body}</p>
      <p><a href="${pricingUrl}">View MarketVibe pricing</a></p>
      <p><a href="${dashboardUrl}">Open dashboard</a></p>
      <p>MarketVibe</p>
    `,
    textContent: `${greeting}

${body}

View MarketVibe pricing:
${pricingUrl}

Open dashboard:
${dashboardUrl}

MarketVibe`,
  };
}

export function buildAdminBlockerAlertEmail(blockers: Blocker[]): RevenueEmail {
  const lines = blockers.map((blocker) => (
    `${blocker.kind} | ${blocker.status} | ${blocker.email} | ${blocker.product || "n/a"} | ${blocker.detail}`
  ));
  const htmlRows = blockers.map((blocker) => `
    <li><strong>${escapeHtml(blocker.kind)}</strong> ${escapeHtml(blocker.status)} - ${escapeHtml(blocker.email)} - ${escapeHtml(blocker.product || "n/a")}<br>${escapeHtml(blocker.detail)}</li>
  `).join("");

  return {
    subject: `MarketVibe revenue blockers: ${blockers.length}`,
    htmlContent: `
      <p>MarketVibe found ${blockers.length} revenue or delivery blocker${blockers.length === 1 ? "" : "s"}.</p>
      <ul>${htmlRows}</ul>
    `,
    textContent: `MarketVibe found ${blockers.length} revenue or delivery blockers.\n\n${lines.join("\n")}`,
  };
}

export async function sendAdminRevenueAlert(email: RevenueEmail) {
  const to = revenueAdminRecipient();
  if (!to) return { sent: false, skipped: true, reason: "No admin alert email configured." };

  await sendTransactionalEmail({ to, ...email });
  return { sent: true, skipped: false };
}

export async function sendCustomerSupportAutoReply(input: SupportReplyInput) {
  const email = normalizeRevenueEmail(input.email);
  if (!isValidRevenueEmail(email)) return { sent: false, skipped: true, reason: "Invalid customer email." };

  const attributes = {
    SOURCE: "contact_form",
    OFFER: input.offer || "general",
    FUNNEL_STAGE: input.offer === "agency-partner" || input.offer === "data-licence" ? "premium_enquiry" : "support_contact",
  };
  await addOrUpdateContact(email, attributes);
  await addContactToMarketVibeList(email, attributes);
  await sendTransactionalEmail({ to: email, ...buildSupportAutoReplyEmail({ ...input, email }) });
  return { sent: true, skipped: false };
}

export async function recordCheckoutStarted(input: CheckoutStartedInput) {
  const supabase = getSupabaseAdmin();
  const email = normalizeRevenueEmail(input.email);
  if (!supabase || !isValidRevenueEmail(email)) return { saved: false, skipped: true };

  const label = premiumProductLabel(input.productCode);
  const { error } = await supabase.from("premium_enquiries").insert({
    offer: checkoutStartedOffer(input.productCode),
    name: input.name || "Checkout visitor",
    email,
    company: null,
    message: [
      `Checkout started for ${label}.`,
      input.requestedProduct ? `Requested product: ${input.requestedProduct}` : "",
      input.stripeSessionId ? `Stripe session: ${input.stripeSessionId}` : "",
      input.orderNumber ? `Order: ${input.orderNumber}` : "",
      input.niche ? `Niche: ${input.niche}` : "",
      input.checkoutUrl ? `Checkout URL: ${input.checkoutUrl}` : "",
    ].filter(Boolean).join("\n"),
  });

  if (error) throw error;
  return { saved: true, skipped: false };
}

export async function sendCheckoutStartedEmail(input: CheckoutStartedInput) {
  const email = normalizeRevenueEmail(input.email);
  if (!isValidRevenueEmail(email) || !input.checkoutUrl) return { sent: false, skipped: true };

  const attributes = {
    SOURCE: "checkout_started",
    PRODUCT: input.productCode,
    REQUESTED_PRODUCT: input.requestedProduct || input.productCode,
    STRIPE_SESSION_ID: input.stripeSessionId || "",
    FUNNEL_STAGE: "checkout_started",
  };
  await addOrUpdateContact(email, attributes);
  await addContactToMarketVibeList(email, attributes);
  await sendTransactionalEmail({ to: email, ...buildCheckoutStartedEmail({ ...input, email }) });
  return { sent: true, skipped: false };
}

async function hasCompletedOrderAfter(input: {
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>;
  email: string;
  productCode: PremiumProductCode;
  since: string;
}) {
  const { data, error } = await input.supabase
    .from("premium_orders")
    .select("id")
    .eq("customer_email", input.email)
    .eq("product_code", input.productCode)
    .gte("created_at", input.since)
    .limit(1);

  if (error) throw error;
  return Boolean(data?.length);
}

async function recoverAbandonedCheckouts(options: Required<Pick<AutomationOptions, "limit" | "abandonedCheckoutAfterHours">>) {
  const supabase = getSupabaseAdmin();
  const result = { checked: 0, recovered: 0, converted: 0, skipped: 0, errors: [] as string[] };
  if (!supabase) return { ...result, skipped: 1 };

  const cutoff = new Date(Date.now() - options.abandonedCheckoutAfterHours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("premium_enquiries")
    .select("id,offer,name,email,created_at")
    .like("offer", `${checkoutStartedPrefix}%`)
    .eq("status", "new")
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(options.limit);

  if (error) throw error;
  for (const row of data || []) {
    result.checked += 1;
    const email = normalizeRevenueEmail(row.email);
    const productCode = productFromCheckoutStartedOffer(String(row.offer || ""));
    if (!productCode || !isValidRevenueEmail(email)) {
      await supabase.from("premium_enquiries").update({ status: "invalid" }).eq("id", row.id);
      result.skipped += 1;
      continue;
    }

    try {
      const paid = await hasCompletedOrderAfter({ supabase, email, productCode, since: String(row.created_at) });
      if (paid) {
        await supabase.from("premium_enquiries").update({ status: "converted" }).eq("id", row.id);
        result.converted += 1;
        continue;
      }

      await sendTransactionalEmail({
        to: email,
        ...buildCheckoutRecoveryEmail({ email, name: row.name || "", productCode }),
      });
      await supabase.from("premium_enquiries").update({ status: "reminder_sent" }).eq("id", row.id);
      result.recovered += 1;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : "Checkout recovery failed.");
    }
  }

  return result;
}

async function hasMatchingOnboarding(input: {
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>;
  email: string;
  productCode: PremiumProductCode;
  stripeSessionId?: string | null;
  orderCreatedAt: string;
}) {
  let query = input.supabase
    .from("premium_onboarding")
    .select("id")
    .eq("customer_email", input.email)
    .eq("product_code", input.productCode)
    .limit(1);

  query = input.stripeSessionId
    ? query.eq("stripe_session_id", input.stripeSessionId)
    : query.gte("created_at", input.orderCreatedAt);

  const { data, error } = await query;
  if (error) throw error;
  return Boolean(data?.length);
}

async function remindIncompleteOnboarding(options: Required<Pick<AutomationOptions, "limit" | "onboardingReminderAfterHours">>) {
  const supabase = getSupabaseAdmin();
  const result = { checked: 0, sent: 0, skipped: 0, errors: [] as string[] };
  if (!supabase) return { ...result, skipped: 1 };

  const cutoff = new Date(Date.now() - options.onboardingReminderAfterHours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("premium_orders")
    .select("id,customer_email,product_code,stripe_session_id,metadata,created_at")
    .eq("status", "completed")
    .lt("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(options.limit);

  if (error) throw error;
  for (const row of data || []) {
    result.checked += 1;
    const email = normalizeRevenueEmail(row.customer_email);
    const productCode = productFromUnknown(row.product_code);
    const metadata = plainRecord(row.metadata);
    if (!productCode || !isValidRevenueEmail(email) || metadata[onboardingReminderMetadataKey]) {
      result.skipped += 1;
      continue;
    }

    try {
      const onboarded = await hasMatchingOnboarding({
        supabase,
        email,
        productCode,
        stripeSessionId: row.stripe_session_id || null,
        orderCreatedAt: String(row.created_at),
      });
      if (onboarded) {
        result.skipped += 1;
        continue;
      }

      const timestamp = new Date().toISOString();
      await sendTransactionalEmail({
        to: email,
        ...buildOnboardingReminderEmail({ email, productCode, stripeSessionId: row.stripe_session_id || null }),
      });
      await supabase
        .from("premium_orders")
        .update({ metadata: mergeRevenueAutomationMetadata(metadata, onboardingReminderMetadataKey, timestamp), updated_at: timestamp })
        .eq("id", row.id);
      result.sent += 1;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : "Onboarding reminder failed.");
    }
  }

  return result;
}

async function collectRevenueBlockers(limit: number): Promise<Blocker[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const blockers: Blocker[] = [];
  const oldPaidCutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const [onboarding, batches, samples] = await Promise.all([
    supabase
      .from("premium_onboarding")
      .select("id,customer_email,product_code,status,niche,created_at")
      .in("status", ["awaiting_supply", "fulfillment_failed"])
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("premium_delivery_batches")
      .select("id,customer_email,product_code,status,opportunity_count,error_summary,created_at")
      .in("status", ["email_failed", "failed"])
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("sample_requests")
      .select("id,customer_email,product_code,status,niche,error_summary,created_at")
      .in("status", ["paid", "email_failed"])
      .lt("created_at", oldPaidCutoff)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  for (const response of [onboarding, batches, samples]) {
    if (response.error) throw response.error;
  }

  for (const row of onboarding.data || []) {
    blockers.push({
      kind: "onboarding",
      status: String(row.status || ""),
      email: normalizeRevenueEmail(row.customer_email),
      product: String(row.product_code || ""),
      detail: `Niche: ${row.niche || "not set"} | id: ${row.id}`,
    });
  }

  for (const row of batches.data || []) {
    blockers.push({
      kind: "delivery_batch",
      status: String(row.status || ""),
      email: normalizeRevenueEmail(row.customer_email),
      product: String(row.product_code || ""),
      detail: `Opportunities: ${row.opportunity_count || 0} | ${JSON.stringify(row.error_summary || {})} | id: ${row.id}`,
    });
  }

  for (const row of samples.data || []) {
    blockers.push({
      kind: "sample_request",
      status: String(row.status || ""),
      email: normalizeRevenueEmail(row.customer_email),
      product: String(row.product_code || "proof_pack"),
      detail: `Niche: ${row.niche || "not set"} | ${JSON.stringify(row.error_summary || {})} | id: ${row.id}`,
    });
  }

  return blockers.slice(0, limit);
}

async function sendDailyBlockerAlert(limit: number) {
  const blockers = await collectRevenueBlockers(limit);
  if (blockers.length === 0) return { sent: false, blockers: 0, skipped: true };

  const alert = await sendAdminRevenueAlert(buildAdminBlockerAlertEmail(blockers));
  return { sent: alert.sent, blockers: blockers.length, skipped: alert.skipped };
}

export async function runRevenueAutomation(options: AutomationOptions = {}) {
  const limit = Math.min(Math.max(Number(options.limit || 25), 1), 100);
  const abandonedCheckoutAfterHours = Math.max(Number(options.abandonedCheckoutAfterHours || 12), 1);
  const onboardingReminderAfterHours = Math.max(Number(options.onboardingReminderAfterHours || 4), 1);

  const checkoutRecovery = await recoverAbandonedCheckouts({ limit, abandonedCheckoutAfterHours });
  const onboardingReminders = await remindIncompleteOnboarding({ limit, onboardingReminderAfterHours });
  const adminAlerts = await sendDailyBlockerAlert(limit);

  return {
    ok: true,
    checkoutRecovery,
    onboardingReminders,
    adminAlerts,
  };
}
