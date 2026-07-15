import { NextResponse } from "next/server";
import { requireCron } from "@/lib/cron-auth";
import { fillDueCustomerShortages } from "@/lib/delivery-cadence";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const unauthorized = requireCron(request);
  if (unauthorized) return unauthorized;
  const result = await fillDueCustomerShortages({ trigger: "cron" });
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
