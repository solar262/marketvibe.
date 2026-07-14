import { NextResponse } from "next/server";
import { requireCron } from "@/lib/cron-auth";
import { autoFulfillPendingImportedProspectOnboardings } from "@/lib/sales-navigator-persistence";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = requireCron(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") || "20");
  const result = await autoFulfillPendingImportedProspectOnboardings({ limit });
  return NextResponse.json(result);
}
