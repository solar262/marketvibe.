import { NextResponse } from "next/server";
import { requireCron } from "@/lib/cron-auth";
import { runProfileAwareOpportunityVerification } from "@/lib/profile-aware-verification";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const unauthorized = requireCron(request);
  if (unauthorized) return unauthorized;
  return NextResponse.json(await runProfileAwareOpportunityVerification({ trigger: "cron" }));
}
