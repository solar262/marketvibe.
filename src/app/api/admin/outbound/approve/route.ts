import { NextResponse } from "next/server";
import { requireAdminJson, safeApiError } from "@/lib/admin-api";
import { approveOutboundLead } from "@/lib/sales-pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => ({})) as { ids?: string[] };
    const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
    if (ids.length === 0) return NextResponse.json({ error: "Select at least one prospect." }, { status: 400 });

    const leads = [];
    const failures = [];
    for (const id of ids.slice(0, 100)) {
      try {
        leads.push(await approveOutboundLead(id, "admin"));
      } catch (error) {
        failures.push({ id, error: error instanceof Error ? error.message : "Approval failed." });
      }
    }

    return NextResponse.json({ ok: true, success: leads.length, failed: failures.length, leads, failures });
  } catch (error) {
    return safeApiError(error, "Could not approve outbound prospects.");
  }
}
