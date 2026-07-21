import { NextResponse } from "next/server";
import { sendTransactionalEmail } from "@/lib/brevo";
import { recordPremiumOnboarding } from "@/lib/premium-persistence";
import { isPremiumProductCode, premiumProductLabel } from "@/lib/premium-products";
import { verifyPremiumAccess } from "@/lib/premium-access";
import { appendCustomerAccessParams, createCustomerAccessToken } from "@/lib/customer-access";
import { createOrUpdateSearchProfileFromOnboarding, fillCustomerShortages } from "@/lib/opportunity-engine";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid onboarding payload." }, { status: 400 });
  }

  const productCode = String(payload.productCode || "");
  if (!isPremiumProductCode(productCode)) {
    return NextResponse.json({ error: "Invalid product code." }, { status: 400 });
  }

  const email = String(payload.email || "").trim().toLowerCase();
  const sessionId = String(payload.sessionId || "");
  const access = await verifyPremiumAccess({ productCode, sessionId, email });
  if (!access.ok) {
    return NextResponse.json({ error: "Paid access could not be verified." }, { status: 403 });
  }

  const required = ["niche", "country", "serviceOffer", "idealBuyer"] as const;
  for (const key of required) {
    if (!String(payload[key] || "").trim()) {
      return NextResponse.json({ error: `${key} is required.` }, { status: 400 });
    }
  }
  if (payload.acknowledgement !== "yes") {
    return NextResponse.json({ error: "The acknowledgement is required." }, { status: 400 });
  }

  const operationalNotes = [
    String(payload.notes || "").trim(),
    String(payload.exclusions || "").trim() ? `Exclusions: ${String(payload.exclusions).trim()}` : "",
    String(payload.opportunityPreferences || "").trim() ? `Opportunity preferences: ${String(payload.opportunityPreferences).trim()}` : "",
    String(payload.dashboardChecklist || "").trim() ? `Dashboard checklist: ${String(payload.dashboardChecklist).trim()}` : "",
    String(payload.exportPreferences || "").trim() ? `Export preferences: ${String(payload.exportPreferences).trim()}` : "",
    String(payload.dealValue || "").trim() ? `Typical deal value: ${String(payload.dealValue).trim()}` : "",
    String(payload.deliveryRecipients || "").trim() ? `Delivery recipients: ${String(payload.deliveryRecipients).trim()}` : "",
    String(payload.reportingPreference || "").trim() ? `Reporting preference: ${String(payload.reportingPreference).trim()}` : "",
  ].filter(Boolean).join("\n\n");

  const onboarding = await recordPremiumOnboarding({
    productCode,
    stripeSessionId: sessionId || undefined,
    email: access.email || email,
    name: String(payload.name || ""),
    company: String(payload.company || ""),
    website: String(payload.website || ""),
    niche: String(payload.niche || ""),
    country: String(payload.country || ""),
    city: String(payload.city || ""),
    territory: String(payload.territory || ""),
    serviceOffer: String(payload.serviceOffer || ""),
    idealBuyer: String(payload.idealBuyer || ""),
    notes: operationalNotes,
  });

  let searchProfileId = "";
  if (onboarding.onboardingId) {
    const profile = await createOrUpdateSearchProfileFromOnboarding({
      onboardingId: onboarding.onboardingId,
      productCode,
      email: access.email || email,
      niche: String(payload.niche || ""),
      country: String(payload.country || ""),
      city: String(payload.city || ""),
      territory: String(payload.territory || ""),
      serviceOffer: String(payload.serviceOffer || ""),
      idealBuyer: String(payload.idealBuyer || ""),
      notes: operationalNotes,
    });
    searchProfileId = profile.profileId;
  }

  let opportunityMatching: Awaited<ReturnType<typeof fillCustomerShortages>> | null = null;
  let opportunityMatchingError = "";
  if (searchProfileId) {
    try {
      opportunityMatching = await fillCustomerShortages({ trigger: "admin", profileId: searchProfileId });
    } catch (error) {
      opportunityMatchingError = error instanceof Error ? error.message : "Opportunity matching will retry automatically.";
    }
  }

  try {
    const accessToken = createCustomerAccessToken(access.email || email);
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://www.marketvibe1.com"}${appendCustomerAccessParams("/dashboard", access.email || email, accessToken)}`;
    const matchedNow = Number(opportunityMatching?.records_added_to_inventory || 0);
    const fulfillmentMessage = matchedNow > 0
      ? `Your profile is saved and ${matchedNow} verified opportunities entered the secure delivery workflow.`
      : opportunityMatchingError
        ? "Your profile is saved. Matching will retry automatically during the next opportunity-engine run."
        : "Your profile is saved. MarketVibe is checking source-backed opportunities for your target market and will deliver only after the evidence and intent gates pass.";
    await sendTransactionalEmail({
      to: access.email || email,
      subject: `${premiumProductLabel(productCode)} onboarding received`,
      htmlContent: `
        <p>Your ${premiumProductLabel(productCode)} onboarding has been received.</p>
        <p>${fulfillmentMessage}</p>
        <p><a href="${dashboardUrl}">Open your dashboard</a></p>
      `,
      textContent: `Your ${premiumProductLabel(productCode)} onboarding has been received.\n\nOpen your dashboard:\n${dashboardUrl}`,
    });
  } catch (error) {
    console.warn("premium_onboarding_email_failed", error);
  }

  return NextResponse.json({
    ok: true,
    onboardingId: onboarding.onboardingId,
    searchProfileId,
    fulfillmentMode: "verified_opportunity_engine",
    savedPackItems: 0,
    autoFulfillment: null,
    opportunityMatching,
    opportunityMatchingError: opportunityMatchingError || null,
    dashboardUrl: appendCustomerAccessParams("/dashboard", access.email || email, createCustomerAccessToken(access.email || email)),
  });
}
