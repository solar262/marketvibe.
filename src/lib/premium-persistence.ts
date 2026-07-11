import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  normalizeCheckoutProduct,
  premiumProducts,
  type PremiumProductCode,
} from "@/lib/premium-products";
import type { BusinessLead } from "@/lib/types";

export type PremiumOnboardingInput = {
  productCode: PremiumProductCode;
  stripeSessionId?: string;
  name?: string;
  email: string;
  company?: string;
  website?: string;
  niche: string;
  country: string;
  city?: string;
  territory?: string;
  serviceOffer: string;
  idealBuyer: string;
  notes?: string;
};

export type PaidSampleRequestRow = {
  customer_email: string;
  customer_name: string | null;
  niche: string | null;
  product_code: "proof_pack";
  amount_total: number;
  currency: string;
  status: "paid";
  stripe_session_id: string;
  stripe_customer_id: string | null;
  paid_at: string;
  metadata: Record<string, unknown>;
};

export async function markStripeEventProcessing(event: Stripe.Event) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { shouldProcess: true, skipped: true };

  const { error } = await supabase.from("processed_stripe_events").insert({
    id: event.id,
    event_type: event.type,
    stripe_object_id: typeof event.data.object === "object" && "id" in event.data.object ? String(event.data.object.id) : null,
  });

  if (!error) return { shouldProcess: true, skipped: false };
  if (error.code === "23505") return { shouldProcess: false, skipped: false };
  throw error;
}

export async function recordCompletedPremiumOrder(session: Stripe.Checkout.Session) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { saved: false, orderId: null };

  const email = normalizedEmail(session.customer_details?.email || session.customer_email || "");
  if (!email) return { saved: false, orderId: null };

  const productCode = normalizeCheckoutProduct(session.metadata?.product_code || session.metadata?.product);
  const row = {
    order_number: session.metadata?.order_number || session.id,
    stripe_session_id: session.id,
    stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
    stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : null,
    customer_email: email,
    product_code: productCode,
    requested_product: session.metadata?.requested_product || session.metadata?.product || productCode,
    amount_total: session.amount_total || premiumProducts[productCode].amount,
    currency: session.currency || premiumProducts[productCode].currency,
    mode: session.mode || premiumProducts[productCode].mode,
    status: "completed",
    metadata: session.metadata || {},
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("premium_orders")
    .upsert(row, { onConflict: "stripe_session_id" })
    .select("id")
    .single();

  if (error) throw error;
  await upsertPremiumEntitlement({
    email,
    productCode,
    status: "active",
    stripeCustomerId: row.stripe_customer_id || undefined,
    stripeSubscriptionId: row.stripe_subscription_id || undefined,
    sourceOrderId: data?.id,
    metadata: session.metadata || {},
  });

  return { saved: true, orderId: data?.id || null };
}

export async function upsertPremiumEntitlement({
  email,
  productCode,
  status,
  stripeCustomerId,
  stripeSubscriptionId,
  sourceOrderId,
  metadata = {},
}: {
  email: string;
  productCode: PremiumProductCode;
  status: "active" | "past_due" | "cancelled" | "inactive";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  sourceOrderId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { saved: false };

  const { error } = await supabase.from("premium_entitlements").upsert(
    {
      customer_email: normalizedEmail(email),
      product_code: productCode,
      status,
      stripe_customer_id: stripeCustomerId || null,
      stripe_subscription_id: stripeSubscriptionId || null,
      source_order_id: sourceOrderId || null,
      metadata,
      ends_at: status === "active" ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "customer_email,product_code" },
  );

  if (error) throw error;
  return { saved: true };
}

function stripeCustomerId(session: Stripe.Checkout.Session) {
  return typeof session.customer === "string" ? session.customer : null;
}

export function sampleRequestRowFromStripeSession(session: Stripe.Checkout.Session): PaidSampleRequestRow | null {
  const rawProduct = session.metadata?.product_code || session.metadata?.product || "";
  if (rawProduct !== "proof_pack" && rawProduct !== "audit") return null;

  const productCode = normalizeCheckoutProduct(rawProduct);
  if (productCode !== "proof_pack") return null;

  const email = normalizedEmail(session.customer_details?.email || session.customer_email || "");
  if (!email || !session.id) return null;

  return {
    customer_email: email,
    customer_name: session.metadata?.customer_name || session.customer_details?.name || null,
    niche: session.metadata?.niche || null,
    product_code: "proof_pack",
    amount_total: session.amount_total || premiumProducts.proof_pack.amount,
    currency: session.currency || premiumProducts.proof_pack.currency,
    status: "paid",
    stripe_session_id: session.id,
    stripe_customer_id: stripeCustomerId(session),
    paid_at: new Date().toISOString(),
    metadata: { ...(session.metadata || {}) },
  };
}

export async function recordPaidSampleRequestFromSession(session: Stripe.Checkout.Session) {
  const supabase = getSupabaseAdmin();
  const row = sampleRequestRowFromStripeSession(session);
  if (!supabase || !row) return { saved: false, requestId: null };

  const { data: existing, error: existingError } = await supabase
    .from("sample_requests")
    .select("id,status")
    .eq("stripe_session_id", row.stripe_session_id)
    .maybeSingle();

  if (existingError) throw existingError;

  const updatedAt = new Date().toISOString();
  if (existing?.id) {
    const update: Record<string, unknown> = {
      customer_email: row.customer_email,
      customer_name: row.customer_name,
      niche: row.niche,
      product_code: row.product_code,
      amount_total: row.amount_total,
      currency: row.currency,
      stripe_customer_id: row.stripe_customer_id,
      paid_at: row.paid_at,
      metadata: row.metadata,
      updated_at: updatedAt,
    };
    if (String(existing.status || "") !== "pdf_sent") update.status = "paid";

    const { error } = await supabase.from("sample_requests").update(update).eq("id", existing.id);
    if (error) throw error;
    return { saved: true, requestId: existing.id as string };
  }

  const { data, error } = await supabase
    .from("sample_requests")
    .insert({
      ...row,
      created_at: updatedAt,
      updated_at: updatedAt,
    })
    .select("id")
    .single();

  if (error) throw error;
  return { saved: true, requestId: data?.id || null };
}

export async function updateEntitlementForSubscription(subscription: Stripe.Subscription, statusOverride?: "past_due" | "cancelled" | "inactive") {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { updated: false };

  const productCode = normalizeCheckoutProduct(subscription.metadata?.product_code || subscription.metadata?.product);
  const stripeSubscriptionId = subscription.id;
  const active = subscription.status === "active" || subscription.status === "trialing";
  const status = statusOverride || (active ? "active" : subscription.status === "past_due" ? "past_due" : "cancelled");
  const subscriptionTiming = subscription as unknown as { current_period_end?: number; cancel_at_period_end?: boolean };
  const periodEnd = typeof subscriptionTiming.current_period_end === "number"
    ? new Date(subscriptionTiming.current_period_end * 1000).toISOString()
    : null;
  const cancelAtPeriodEnd = Boolean(subscriptionTiming.cancel_at_period_end);

  const { error } = await supabase
    .from("premium_entitlements")
    .update({
      status,
      ends_at: status === "active" ? (cancelAtPeriodEnd ? periodEnd : null) : periodEnd || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: { stripe_status: subscription.status },
    })
    .eq("stripe_subscription_id", stripeSubscriptionId);

  if (error) throw error;
  return { updated: true, productCode, status };
}

export async function updateEntitlementStatusBySubscriptionId(stripeSubscriptionId: string, status: "active" | "past_due" | "cancelled" | "inactive") {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { updated: false };

  const { error } = await supabase
    .from("premium_entitlements")
    .update({
      status,
      ends_at: status === "active" ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", stripeSubscriptionId);

  if (error) throw error;
  return { updated: true };
}

export async function getPremiumEntitlement(email: string, productCode: PremiumProductCode) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("premium_entitlements")
    .select("*")
    .eq("customer_email", normalizedEmail(email))
    .eq("product_code", productCode)
    .eq("status", "active")
    .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getPremiumEntitlements(email: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("premium_entitlements")
    .select("*")
    .eq("customer_email", normalizedEmail(email))
    .eq("status", "active")
    .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function recordPremiumOnboarding(input: PremiumOnboardingInput) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { saved: false, onboardingId: null };

  const { data, error } = await supabase
    .from("premium_onboarding")
    .insert({
      customer_email: normalizedEmail(input.email),
      product_code: input.productCode,
      stripe_session_id: input.stripeSessionId || null,
      name: input.name || null,
      company: input.company || null,
      website: input.website || null,
      niche: input.niche,
      country: input.country,
      city: input.city || null,
      territory: input.territory || null,
      service_offer: input.serviceOffer,
      ideal_buyer: input.idealBuyer,
      notes: input.notes || null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return { saved: true, onboardingId: data?.id || null };
}

export async function saveProofPackItems({
  onboardingId,
  email,
  leads,
}: {
  onboardingId: string;
  email: string;
  leads: BusinessLead[];
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase || leads.length === 0) return { saved: false, count: 0 };

  const rows = leads.map((lead) => ({
    onboarding_id: onboardingId,
    customer_email: normalizedEmail(email),
    product_code: "proof_pack",
    business_name: lead.businessName,
    website: lead.website || null,
    source_url: lead.sourceUrl || lead.googleProfileUrl || null,
    source_status: lead.sourceStatus || "demo",
    intent_score: lead.audit.score,
    pain_point: lead.audit.summary,
    context: lead.source,
    outreach_angle: lead.audit.serviceAngle,
    raw_data: lead,
  }));

  const { error } = await supabase.from("premium_pack_items").insert(rows);
  if (error) throw error;
  return { saved: true, count: rows.length };
}

export async function getProofPackItems(email: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("premium_pack_items")
    .select("*")
    .eq("customer_email", normalizedEmail(email))
    .order("intent_score", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function recordPremiumEnquiry(input: {
  offer: string;
  name: string;
  email: string;
  company?: string;
  message: string;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { saved: false };

  const { error } = await supabase.from("premium_enquiries").insert({
    offer: input.offer,
    name: input.name,
    email: normalizedEmail(input.email),
    company: input.company || null,
    message: input.message,
  });

  if (error) throw error;
  return { saved: true };
}

function normalizedEmail(value: string) {
  return value.trim().toLowerCase();
}
