import { NextResponse } from "next/server";
import { requireCron } from "@/lib/cron-auth";
import { runOutboundAutopilot } from "@/lib/outbound-autopilot";
import { processDueSalesEmails, salesOutboundRunLimit } from "@/lib/sales-pipeline";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function optionalSafeNumber(value: string | null, min: number, max: number) {
  if (value === null || value.trim() === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

export async function GET(request: Request) {
  const unauthorized = requireCron(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "true";
  const markets = optionalSafeNumber(url.searchParams.get("markets"), 1, 8);
  const leadsPerMarket = optionalSafeNumber(url.searchParams.get("leadsPerMarket"), 1, 10);
  const autopilot = await runOutboundAutopilot({ dryRun, markets, leadsPerMarket, queue: true });
  const emails = dryRun ? { processed: 0, sent: 0, skipped: 0, failed: 0 } : await processDueSalesEmails({ limit: salesOutboundRunLimit() });

  return NextResponse.json({
    ok: autopilot.failed === 0,
    mode: "outbound_autopilot",
    note: "Automatically discovers public UK/US B2B buyer prospects, imports them into outbound sales, queues eligible rows, and sends due emails only when compliance and sending gates pass.",
    autopilot,
    emails,
  });
}
