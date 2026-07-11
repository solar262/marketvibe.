import { NextResponse } from "next/server";
import { requireAdminJson, safeApiError } from "@/lib/admin-api";
import { importQuickPasteOpportunities } from "@/lib/opportunity-engine";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  try {
    const payload = await request.json();
    const result = await importQuickPasteOpportunities({
      urls: String(payload.urls || ""),
      niche: String(payload.niche || ""),
      location: String(payload.location || ""),
      sourceNote: String(payload.sourceNote || ""),
      publicSignalText: String(payload.publicSignalText || ""),
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return safeApiError(error, "Quick Paste import failed.");
  }
}
