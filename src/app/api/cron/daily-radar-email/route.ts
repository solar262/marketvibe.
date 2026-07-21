import { NextResponse } from "next/server";
import { requireCron } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = requireCron(request);
  if (unauthorized) return unauthorized;

  return NextResponse.json({
    ok: true,
    skipped: true,
    reason: "legacy_lead_vault_radar_email_retired",
    replacement: "/api/cron/opportunity-delivery",
  });
}
