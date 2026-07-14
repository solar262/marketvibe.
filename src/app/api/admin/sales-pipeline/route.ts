import { NextResponse } from "next/server";
import { requireAdminJson, safeApiError } from "@/lib/admin-api";
import { listSalesLeads } from "@/lib/sales-pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  try {
    const url = new URL(request.url);
    const result = await listSalesLeads({
      stage: url.searchParams.get("stage") || "",
      fit: url.searchParams.get("fit") || "",
      journey: url.searchParams.get("journey") || "",
      q: url.searchParams.get("q") || "",
      limit: Number(url.searchParams.get("limit") || "100"),
    });
    return NextResponse.json({ ok: !result.error, ...result });
  } catch (error) {
    return safeApiError(error, "Could not load sales pipeline.");
  }
}
