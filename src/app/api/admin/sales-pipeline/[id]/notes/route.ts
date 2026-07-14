import { NextResponse } from "next/server";
import { requireAdminJson, safeApiError } from "@/lib/admin-api";
import { createSalesLeadNote } from "@/lib/sales-pipeline";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const payload = await request.json();
    const note = await createSalesLeadNote({ leadId: id, body: String(payload.body || ""), createdBy: "admin" });
    return NextResponse.json({ ok: true, note });
  } catch (error) {
    return safeApiError(error, "Could not add note.");
  }
}
