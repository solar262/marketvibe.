import { NextResponse } from "next/server";
import { requireAdminJson, safeApiError } from "@/lib/admin-api";
import { listImportBatches } from "@/lib/sales-navigator-persistence";

export const runtime = "nodejs";

export async function GET() {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  try {
    return NextResponse.json({ ok: true, batches: await listImportBatches() });
  } catch (error) {
    return safeApiError(error, "Batch history could not be loaded.");
  }
}
