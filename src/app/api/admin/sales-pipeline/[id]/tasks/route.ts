import { NextResponse } from "next/server";
import { requireAdminJson, safeApiError } from "@/lib/admin-api";
import { createSalesLeadTask } from "@/lib/sales-pipeline";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const payload = await request.json();
    const task = await createSalesLeadTask({
      leadId: id,
      title: String(payload.title || ""),
      dueAt: String(payload.dueAt || ""),
      assignedTo: String(payload.assignedTo || ""),
    });
    return NextResponse.json({ ok: true, task });
  } catch (error) {
    return safeApiError(error, "Could not add task.");
  }
}
