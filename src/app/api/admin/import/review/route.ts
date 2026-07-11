import { NextResponse } from "next/server";
import { requireAdminJson, safeApiError } from "@/lib/admin-api";
import { updateProspectReview } from "@/lib/sales-navigator-persistence";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  try {
    const payload = await request.json();
    const ids = Array.isArray(payload.ids) ? payload.ids.map(String) : [];
    const reviewStatus = payload.reviewStatus === "approved" || payload.reviewStatus === "rejected" ? payload.reviewStatus : "pending";
    return NextResponse.json({ ok: true, result: await updateProspectReview(ids, reviewStatus, String(payload.adminNote || "")) });
  } catch (error) {
    return safeApiError(error, "Review update failed.");
  }
}
