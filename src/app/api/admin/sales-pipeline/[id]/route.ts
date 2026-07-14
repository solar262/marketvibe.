import { NextResponse } from "next/server";
import { requireAdminJson, safeApiError } from "@/lib/admin-api";
import { getSalesLeadDetail, isSalesPipelineStage, updateSalesLeadFields, updateSalesLeadStage } from "@/lib/sales-pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    return NextResponse.json({ ok: true, detail: await getSalesLeadDetail(id) });
  } catch (error) {
    return safeApiError(error, "Could not load lead detail.");
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const payload = await request.json();
    if ("stage" in payload) {
      if (!isSalesPipelineStage(payload.stage)) {
        return NextResponse.json({ error: "Choose a valid sales pipeline stage." }, { status: 400 });
      }
      const lead = await updateSalesLeadStage({
        id,
        stage: payload.stage,
        changedBy: "admin",
        note: String(payload.note || ""),
        lostReason: String(payload.lostReason || ""),
      });
      return NextResponse.json({ ok: true, lead });
    }

    return NextResponse.json({ ok: true, lead: await updateSalesLeadFields(id, payload) });
  } catch (error) {
    return safeApiError(error, "Could not update lead.");
  }
}
