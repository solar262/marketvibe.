import { NextResponse } from "next/server";
import { requireAdminJson, safeApiError } from "@/lib/admin-api";
import { enrichProspects } from "@/lib/sales-navigator-persistence";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  try {
    const payload = await request.json();
    const ids = Array.isArray(payload.ids) ? payload.ids.map(String) : [];
    return NextResponse.json({ ok: true, result: await enrichProspects(ids) });
  } catch (error) {
    return safeApiError(error, "Enrichment failed.");
  }
}
