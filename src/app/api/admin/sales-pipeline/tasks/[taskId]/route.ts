import { NextResponse } from "next/server";
import { requireAdminJson, safeApiError } from "@/lib/admin-api";
import { updateSalesLeadTask } from "@/lib/sales-pipeline";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  try {
    const { taskId } = await params;
    const payload = await request.json();
    const status = payload.status === "done" || payload.status === "skipped" ? payload.status : "todo";
    return NextResponse.json({ ok: true, task: await updateSalesLeadTask({ id: taskId, status }) });
  } catch (error) {
    return safeApiError(error, "Could not update task.");
  }
}
