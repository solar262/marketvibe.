import { NextResponse } from "next/server";
import { runLeadHunt } from "@/lib/autopilot";
import { sendTransactionalEmail } from "@/lib/brevo";
import { runOutreachAutomation } from "@/lib/outreach-automation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ONE_TIME_TOKEN = "mv-more-live-leads-20260728-a91f6c2d";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("token") !== ONE_TIME_TOKEN) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const hunt = await runLeadHunt({ markets: 6, leads: 8 });
  const liveFound = hunt.reduce((total, result) => total + result.leads.length, 0);
  const marketsCompleted = hunt.filter((result) => result.saved).length;
  const marketFailures = hunt.filter((result) => !result.saved).length;
  const outreach = await runOutreachAutomation({ queueLimit: 50, sendLimit: 50 });
  const sent = Number(outreach.delivery.sent || 0);
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

  if (adminEmail) {
    await sendTransactionalEmail({
      to: adminEmail,
      subject: `MarketVibe found ${liveFound} more live leads`,
      htmlContent: `<p>MarketVibe completed the expanded live lead hunt.</p><p><strong>${liveFound}</strong> live public-email leads found across ${marketsCompleted} completed markets.</p><p><strong>${sent}</strong> additional emails sent today. ${outreach.queue.queued} newly queued, ${outreach.queue.skipped} skipped, ${outreach.queue.brevoFailed} Brevo failures.</p><p>Market failures: ${marketFailures}.</p>`,
      textContent: `MarketVibe completed the expanded live lead hunt.\n\n${liveFound} live public-email leads found across ${marketsCompleted} completed markets.\n${sent} additional emails sent today.\n${outreach.queue.queued} newly queued.\n${outreach.queue.skipped} skipped.\n${outreach.queue.brevoFailed} Brevo failures.\nMarket failures: ${marketFailures}.`,
    }).catch((error) => console.error("More-live-leads summary email failed", error));
  }

  return NextResponse.json({
    ok: outreach.ok,
    liveFound,
    marketsCompleted,
    marketFailures,
    hunt,
    outreach,
  }, { status: outreach.ok ? 200 : 500 });
}
