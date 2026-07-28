import { NextResponse } from "next/server";
import { requireAdminJson } from "@/lib/admin-api";
import { queueEligibleSavedLeads } from "@/lib/outreach-automation";

export async function GET(request: Request) {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit") || "10"), 100));
  const result = await queueEligibleSavedLeads(limit);

  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
