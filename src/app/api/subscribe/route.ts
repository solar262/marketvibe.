import { NextResponse } from "next/server";
import { track } from "@vercel/analytics/server";
import {
  addContactToMarketVibeList,
  addOrUpdateContact,
  leadSearchUrl,
  pricingUrl,
  scheduleFreeLeadSequence,
  sendTransactionalEmail,
} from "@/lib/brevo";

function emailHtml(firstName: string) {
  const greeting = firstName ? `Hi ${firstName},` : "Hi,";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="max-width:620px;margin:0 auto;padding:28px 18px;">
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:26px;">
        <p style="font-size:16px;line-height:24px;margin:0 0 14px;">${greeting}</p>
        <h1 style="font-size:24px;line-height:30px;margin:0 0 14px;color:#020617;">Your MarketVibe lead search is ready</h1>
        <p style="font-size:16px;line-height:24px;margin:0 0 18px;">MarketVibe helps freelancers, agencies, web designers, SEO workers, and service sellers find businesses with weak websites, missing booking/contact routes, review gaps, and conversion opportunities.</p>
        <p style="font-size:16px;line-height:24px;margin:0 0 20px;">Click below to run a lead search on MarketVibe.</p>
        <p style="margin:0 0 22px;">
          <a href="${leadSearchUrl}" style="display:inline-block;background:#020617;color:#ffffff;text-decoration:none;font-weight:700;border-radius:8px;padding:12px 18px;">Run your lead search</a>
        </p>
        <p style="font-size:14px;line-height:22px;margin:0 0 8px;color:#334155;">Direct link:</p>
        <p style="font-size:14px;line-height:22px;margin:0 0 18px;"><a href="${leadSearchUrl}" style="color:#047857;">${leadSearchUrl}</a></p>
        <p style="font-size:14px;line-height:22px;margin:0;color:#334155;">Pricing: <a href="${pricingUrl}" style="color:#047857;">${pricingUrl}</a></p>
      </div>
    </div>
  </body>
</html>`;
}

function emailText(firstName: string) {
  return `${firstName ? `Hi ${firstName},` : "Hi,"}

Your MarketVibe lead search is ready.

MarketVibe helps freelancers, agencies, web designers, SEO workers, and service sellers find businesses with weak websites, missing booking/contact routes, review gaps, and conversion opportunities.

Run your lead search:
${leadSearchUrl}

View pricing:
${pricingUrl}

MarketVibe`;
}

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
      FUNNEL_STAGE: "free_lead",
    };

    await addOrUpdateContact(email, attributes);
    await addContactToMarketVibeList(email, attributes);
    await sendTransactionalEmail({
      to: email,
      subject: "Your MarketVibe lead search is ready",
      htmlContent: emailHtml(firstName),
      textContent: emailText(firstName),
    });
    await scheduleFreeLeadSequence(email, firstName).catch((error) => {
      console.warn("Free lead follow-up scheduling skipped:", error instanceof Error ? error.message : error);
    });
    await track("free_leads_success", { source: "free_leads_form" }).catch(() => undefined);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Subscription failed.",
    }, { status: 500 });
  }
}
