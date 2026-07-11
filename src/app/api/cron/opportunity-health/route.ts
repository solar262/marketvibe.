import { NextResponse } from "next/server";
import { requireCron } from "@/lib/cron-auth";
import { getOpportunityEngineSummary } from "@/lib/opportunity-engine";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const unauthorized = requireCron(request);
  if (unauthorized) return unauthorized;
  return NextResponse.json({ ok: true, summary: await getOpportunityEngineSummary() });
}

