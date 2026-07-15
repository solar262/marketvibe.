import { NextResponse } from "next/server";
import { requireCron } from "@/lib/cron-auth";
import { runCustomerProfileOpportunityDiscovery } from "@/lib/public-opportunity-discovery";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const unauthorized = requireCron(request);
  if (unauthorized) return unauthorized;
  return NextResponse.json(await runCustomerProfileOpportunityDiscovery({ trigger: "cron" }));
}
