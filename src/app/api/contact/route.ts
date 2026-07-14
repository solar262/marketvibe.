import { NextResponse } from "next/server";
import { recordPremiumEnquiry } from "@/lib/premium-persistence";
import { sendAdminRevenueAlert, sendCustomerSupportAutoReply } from "@/lib/revenue-automation";

const visits = new Map<string, number>();

function escapeHtml(value: unknown) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  const now = Date.now();
  const last = visits.get(ip) || 0;
  if (now - last < 10_000) return NextResponse.json({ error: "Please wait before sending another message." }, { status: 429 });
  visits.set(ip, now);

  const payload = await request.json();
  const offer = String(payload.offer || "general");
  const name = String(payload.name || "");
  const email = String(payload.email || "");
  const company = String(payload.company || "");
  const message = String(payload.message || "");

  if (offer === "agency-partner" || offer === "data-licence") {
    await recordPremiumEnquiry({
      offer,
      name,
      email,
      company,
      message,
    });
  }

  try {
    const premium = offer === "agency-partner" || offer === "data-licence";
    const adminAlert = await sendAdminRevenueAlert({
      subject: premium
        ? `MarketVibe premium enquiry: ${offer}`
        : "New MarketVibe contact message",
      htmlContent: `
        <p>${premium ? "New MarketVibe premium enquiry." : "New MarketVibe contact message."}</p>
        <p><strong>Offer:</strong> ${escapeHtml(offer)}</p>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Company:</strong> ${escapeHtml(company)}</p>
        <p>${escapeHtml(message)}</p>
      `,
      textContent: `${premium ? "New MarketVibe premium enquiry" : "New MarketVibe contact message"}\n\nOffer: ${offer}\nName: ${name}\nEmail: ${email}\nCompany: ${company}\n\n${message}`,
    });
    if (adminAlert.skipped) {
      return NextResponse.json({ error: "Admin email is not configured." }, { status: 500 });
    }
  } catch (error) {
    console.warn("contact_admin_email_failed", error);
    return NextResponse.json({ error: "Message saved, but email delivery failed." }, { status: 502 });
  }

  await sendCustomerSupportAutoReply({ email, name, offer }).catch((error) => {
    console.warn("contact_auto_reply_failed", error);
  });

  console.log("contact_message", { ...payload, offer });
  return NextResponse.json({ ok: true });
}
