import { NextResponse } from "next/server";
import { requireAdminJson, safeApiError } from "@/lib/admin-api";
import { listImportedProspects } from "@/lib/sales-navigator-persistence";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  try {
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams.entries());
    return NextResponse.json({ ok: true, prospects: await listImportedProspects(filters) });
  } catch (error) {
    return safeApiError(error, "Prospects could not be loaded.");
  }
}
