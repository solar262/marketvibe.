import { NextResponse } from "next/server";
import { addContactToMarketVibeList, addOrUpdateContact, sendTransactionalEmail } from "@/lib/brevo";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://marketvibe1.com";
const leadSearchUrl = `${baseUrl}/lead-search`;
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
      subject: "Your MarketVibe lead search is ready",
      htmlContent: `
        <p>Hi${firstName ? ` ${firstName}` : ""},</p>
        <p>Thanks for joining MarketVibe.</p>
        <p>Use MarketVibe to find businesses with website, SEO, booking, review, and conversion opportunities.</p>
        <p><a href="${leadSearchUrl}">Run your lead search</a></p>
        <p><a href="${pricingUrl}">View pricing</a></p>
      `,
      textContent: `Hi${firstName ? ` ${firstName}` : ""},

Thanks for joining MarketVibe.

Use MarketVibe to find businesses with website, SEO, booking, review, and conversion opportunities.

Run your lead search:
${leadSearchUrl}

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
