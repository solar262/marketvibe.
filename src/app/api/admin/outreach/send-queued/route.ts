import { NextResponse } from "next/server";
import { requireAdminJson } from "@/lib/admin-api";
import { sendQueuedOutreachHardCapped } from "@/lib/outreach-hard-cap";

export async function GET(request: Request) {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit") || "5"), 25));
  const result = await sendQueuedOutreachHardCapped(limit);
  return NextResponse.json(result, { status: result.error ? 400 : 200 });
}
