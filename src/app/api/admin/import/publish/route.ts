import { NextResponse } from "next/server";
import { requireAdminJson } from "@/lib/admin-api";

export const runtime = "nodejs";

export async function POST() {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;
  return NextResponse.json({
    error: "Direct imported-prospect delivery is retired. Approve source-backed signals and deliver them through the Opportunity Engine.",
    fulfillmentMode: "verified_opportunity_engine",
  }, { status: 410 });
}
