import { NextResponse } from "next/server";
import { sendTransactionalEmail } from "@/lib/brevo";
import { recordPremiumEnquiry } from "@/lib/premium-persistence";

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
  if (offer === "agency-partner" || offer === "data-licence") {
    await recordPremiumEnquiry({
      offer,
      name: String(payload.name || ""),
      email: String(payload.email || ""),
      company: String(payload.company || ""),
      message: String(payload.message || ""),
    });

    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      try {
        await sendTransactionalEmail({
          to: adminEmail,
          subject: `MarketVibe premium enquiry: ${offer}`,
          htmlContent: `
            <p>New MarketVibe premium enquiry.</p>
            <p><strong>Offer:</strong> ${escapeHtml(offer)}</p>
            <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
            <p><strong>Company:</strong> ${escapeHtml(payload.company)}</p>
            <p>${escapeHtml(payload.message)}</p>
          `,
          textContent: `New MarketVibe premium enquiry\n\nOffer: ${offer}\nName: ${payload.name || ""}\nEmail: ${payload.email || ""}\nCompany: ${payload.company || ""}\n\n${payload.message || ""}`,
        });
      } catch (error) {
        console.warn("premium_enquiry_admin_email_failed", error);
      }
    }
  }
  console.log("contact_message", { ...payload, offer });
  return NextResponse.json({ ok: true });
}
