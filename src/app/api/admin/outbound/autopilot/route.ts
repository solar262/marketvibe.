import { NextResponse } from "next/server";
import { requireAdminJson, safeApiError } from "@/lib/admin-api";
import { runOutboundAutopilot } from "@/lib/outbound-autopilot";
import { processDueSalesEmails, salesOutboundRunLimit } from "@/lib/sales-pipeline";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function optionalSafeNumber(value: unknown, min: number, max: number) {
  if (value === undefined || value === null || String(value).trim() === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => ({})) as { dryRun?: boolean; markets?: number; leadsPerMarket?: number };
    const dryRun = Boolean(body.dryRun);
    const autopilot = await runOutboundAutopilot({
      dryRun,
      markets: optionalSafeNumber(body.markets, 1, 8),
      leadsPerMarket: optionalSafeNumber(body.leadsPerMarket, 1, 10),
      queue: true,
    });
    const emails = dryRun ? { processed: 0, sent: 0, skipped: 0, failed: 0 } : await processDueSalesEmails({ limit: salesOutboundRunLimit() });
    return NextResponse.json({ ok: autopilot.failed === 0, autopilot, emails });
  } catch (error) {
    return safeApiError(error, "Outbound autopilot failed.");
  }
}
