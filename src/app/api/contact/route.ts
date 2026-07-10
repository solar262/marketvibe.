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
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid contact request." }, { status: 400 });
  }
  const offer = String(payload.offer || "general");
  const email = String(payload.email || "").trim().toLowerCase();
  const name = String(payload.name || "").trim();
  const message = String(payload.message || "").trim();
  if (!name || !message || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Name, valid email, and message are required." }, { status: 400 });
  }

  let persisted = false;
  let adminNotified = false;
  let customerAcknowledged = false;
  try {
    await recordPremiumEnquiry({
      offer,
      name,
      email,
      company: String(payload.company || ""),
      message,
    });
    persisted = true;
  } catch (error) {
    console.warn("contact_request_persist_failed", error);
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    try {
      await sendTransactionalEmail({
        to: adminEmail,
        subject: `MarketVibe support request: ${offer}`,
        htmlContent: `
          <p>New MarketVibe support/contact request.</p>
          <p><strong>Type:</strong> ${escapeHtml(offer)}</p>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Company:</strong> ${escapeHtml(payload.company)}</p>
          <p>${escapeHtml(message)}</p>
        `,
        textContent: `New MarketVibe support/contact request\n\nType: ${offer}\nName: ${name}\nEmail: ${email}\nCompany: ${payload.company || ""}\n\n${message}`,
      });
      adminNotified = true;
    } catch (error) {
      console.warn("contact_request_admin_email_failed", error);
    }
  }

  if (persisted || adminNotified) {
    try {
      await sendTransactionalEmail({
        to: email,
        subject: "MarketVibe request received",
        htmlContent: "<p>Your MarketVibe request has been received for operator review.</p><p>We do not authorize refunds, legal conclusions, or custom promises through automated replies.</p>",
        textContent: "Your MarketVibe request has been received for operator review.\n\nWe do not authorize refunds, legal conclusions, or custom promises through automated replies.",
      });
      customerAcknowledged = true;
    } catch (error) {
      console.warn("contact_request_ack_failed", error);
    }
  }

  if (!persisted && !adminNotified) {
    return NextResponse.json({ error: "Support request could not be recorded. Please email hello@marketvibe1.com directly." }, { status: 503 });
  }

  return NextResponse.json({ ok: true, persisted, adminNotified, customerAcknowledged });
}
