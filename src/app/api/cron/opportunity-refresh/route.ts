import { NextResponse } from "next/server";
import { requireCron } from "@/lib/cron-auth";
import { refreshStaleOpportunities } from "@/lib/opportunity-engine";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const unauthorized = requireCron(request);
  if (unauthorized) return unauthorized;
  return NextResponse.json(await refreshStaleOpportunities({ trigger: "cron" }));
}

