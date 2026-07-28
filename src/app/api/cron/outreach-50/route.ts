import { NextResponse } from "next/server";
import { sendTransactionalEmail } from "@/lib/brevo";
import { requireCron } from "@/lib/cron-auth";
import { runOutreachAutomation } from "@/lib/outreach-automation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ONE_TIME_TOKEN = "mv-outreach-50-20260728-8e4c1a7f";

function authorize(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("token") === ONE_TIME_TOKEN) return null;
  return requireCron(request);
}

export async function GET(request: Request) {
  const unauthorized = authorize(request);
  if (unauthorized) return unauthorized;

  process.env.OUTREACH_EMAIL_PROVIDER = "brevo";
  process.env.OUTREACH_EMAIL_ENABLED = "true";
  process.env.OUTREACH_FROM_EMAIL = process.env.OUTREACH_FROM_EMAIL || process.env.BREVO_SENDER_EMAIL || "hello@marketvibe1.com";
  process.env.OUTREACH_FROM_NAME = process.env.OUTREACH_FROM_NAME || process.env.BREVO_SENDER_NAME || "MarketVibe";
  process.env.OUTREACH_REPLY_TO = process.env.OUTREACH_REPLY_TO || process.env.OUTREACH_FROM_EMAIL;
  process.env.OUTREACH_DAILY_SEND_LIMIT = "50";

  const result = await runOutreachAutomation({ queueLimit: 50, sendLimit: 50 });
  const sent = Number(result.delivery.sent || 0);
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

  if (adminEmail) {
    await sendTransactionalEmail({
      to: adminEmail,
      subject: `MarketVibe outreach run: ${sent} sent`,
      htmlContent: `<p>MarketVibe completed the automated outreach run.</p><p><strong>${sent}</strong> emails sent.</p><p>${result.queue.queued} newly queued, ${result.queue.skipped} skipped, ${result.queue.brevoSynced} synced to Brevo, ${result.queue.brevoFailed} Brevo sync failures.</p>`,
      textContent: `MarketVibe completed the automated outreach run.\n\n${sent} emails sent.\n${result.queue.queued} newly queued.\n${result.queue.skipped} skipped.\n${result.queue.brevoSynced} synced to Brevo.\n${result.queue.brevoFailed} Brevo sync failures.`,
    }).catch((error) => console.error("Outreach summary email failed", error));
  }

  return NextResponse.json({ ok: result.ok, dailyLimit: 50, ...result }, { status: result.ok ? 200 : 500 });
}
