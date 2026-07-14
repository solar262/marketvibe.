import { NextResponse } from "next/server";
import { getLatestSavedLeads } from "@/lib/lead-persistence";
import { sendTransactionalEmail } from "@/lib/brevo";
import { recordPremiumOnboarding, saveProofPackItems } from "@/lib/premium-persistence";
import { isPremiumProductCode, premiumProductLabel } from "@/lib/premium-products";
import { verifyPremiumAccess } from "@/lib/premium-access";
import { appendCustomerAccessParams, createCustomerAccessToken } from "@/lib/customer-access";
import { createOrUpdateSearchProfileFromOnboarding } from "@/lib/opportunity-engine";
import { autoFulfillImportedProspectsForOnboarding } from "@/lib/sales-navigator-persistence";

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

  let savedPackItems = 0;
  if (productCode === "proof_pack" && onboarding.onboardingId) {
    const leads = (await getLatestSavedLeads(80))
      .filter((lead) => lead.sourceStatus === "live")
      .filter((lead) => lead.sourceUrl || lead.googleProfileUrl || lead.website)
      .filter((lead) => {
        const text = `${lead.businessCategory} ${lead.city} ${lead.country} ${lead.audit.summary}`.toLowerCase();
        return text.includes(String(payload.niche || "").toLowerCase().split(" ")[0]) || text.includes(String(payload.country || "").toLowerCase());
      })
      .slice(0, 30);

    const result = await saveProofPackItems({
      onboardingId: onboarding.onboardingId,
      email: access.email || email,
      leads,
    });
    savedPackItems = result.count;
  }

  let autoFulfillment: Awaited<ReturnType<typeof autoFulfillImportedProspectsForOnboarding>> | null = null;
  if (onboarding.onboardingId) {
    try {
      autoFulfillment = await autoFulfillImportedProspectsForOnboarding({
        onboardingId: onboarding.onboardingId,
        customerEmail: access.email || email,
        productCode,
        niche: String(payload.niche || ""),
        country: String(payload.country || ""),
        city: String(payload.city || ""),
        territory: String(payload.territory || ""),
        serviceOffer: String(payload.serviceOffer || ""),
        idealBuyer: String(payload.idealBuyer || ""),
      });
    } catch (error) {
      autoFulfillment = {
        ok: false,
        status: "failed",
        customerEmail: access.email || email,
        productCode,
        matchedProspects: 0,
        targetQuantity: 0,
        minimumQuantity: 0,
        error: error instanceof Error ? error.message : "Automatic fulfillment failed.",
      };
    }
  }

  try {
    const accessToken = createCustomerAccessToken(access.email || email);
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://www.marketvibe1.com"}${appendCustomerAccessParams("/dashboard", access.email || email, accessToken)}`;
    const fulfillmentMessage = autoFulfillment?.status === "delivered"
      ? `Your matched delivery is ready with ${autoFulfillment.matchedProspects} opportunities. A secure dashboard and CSV link has been sent separately.`
      : autoFulfillment?.status === "awaiting_supply"
        ? "Your profile is saved. MarketVibe is preparing enough relevant opportunities for your target market and will continue checking automatically."
        : autoFulfillment?.status === "failed"
          ? "Your profile is saved. Delivery hit a temporary issue and will be retried automatically."
          : "";
    await sendTransactionalEmail({
      to: access.email || email,
      subject: `${premiumProductLabel(productCode)} onboarding received`,
      htmlContent: `
        <p>Your ${premiumProductLabel(productCode)} onboarding has been received.</p>
        <p>${fulfillmentMessage || (productCode === "proof_pack"
          ? savedPackItems > 0
            ? `We found ${savedPackItems} verified saved opportunities for your pack. Your dashboard and CSV are ready.`
            : "We are preparing relevant opportunities for your pack and will deliver them when the delivery is ready."
          : "Your access is being prepared from your niche and territory details."
        )}</p>
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
    savedPackItems,
    autoFulfillment,
    dashboardUrl: appendCustomerAccessParams("/dashboard", access.email || email, createCustomerAccessToken(access.email || email)),
  });
}
