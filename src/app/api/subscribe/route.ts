import { NextResponse } from "next/server";
import { addContactToMarketVibeList, addOrUpdateContact, sendTransactionalEmail } from "@/lib/brevo";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://marketvibe1.com";
const leadPacksUrl = `${baseUrl}/lead-packs`;
const pricingUrl = `${baseUrl}/pricing`;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const firstName = String(body.firstName || "").trim();
  const serviceType = String(body.serviceType || "").trim();
  const city = String(body.city || "").trim();

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  try {
    const attributes = {
      FIRSTNAME: firstName,
      SERVICE_TYPE: serviceType,
      CITY: city,
      SOURCE: "free_leads_form",
    };

    await addOrUpdateContact(email, attributes);
    await addContactToMarketVibeList(email, attributes);
    await sendTransactionalEmail({
      to: email,
      subject: "Your 3 free MarketVibe lead previews are ready",
      htmlContent: `
        <p>Hi${firstName ? ` ${firstName}` : ""},</p>
        <p>Thanks for joining MarketVibe.</p>
        <p>MarketVibe helps freelancers and agencies find businesses with website, SEO, booking, review, and conversion opportunities.</p>
        <p><a href="${leadPacksUrl}">Open your lead previews</a></p>
        <p><a href="${pricingUrl}">View pricing</a></p>
      `,
      textContent: `Hi${firstName ? ` ${firstName}` : ""},

Thanks for joining MarketVibe.

MarketVibe helps freelancers and agencies find businesses with website, SEO, booking, review, and conversion opportunities.

Open your lead previews:
${leadPacksUrl}

View pricing:
${pricingUrl}`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Subscription failed.",
    }, { status: 500 });
  }
}
