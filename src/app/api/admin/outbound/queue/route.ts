import { NextResponse } from "next/server";
import { requireAdminJson, safeApiError } from "@/lib/admin-api";
import { queueColdOutboundForLead } from "@/lib/sales-pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => ({})) as { ids?: string[] };
    const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
    if (ids.length === 0) return NextResponse.json({ error: "Select at least one prospect." }, { status: 400 });

    const queued = [];
    const failures = [];
    for (const id of ids.slice(0, 100)) {
      try {
        queued.push({ id, result: await queueColdOutboundForLead(id) });
      } catch (error) {
        failures.push({ id, error: error instanceof Error ? error.message : "Queue failed." });
      }
    }

    return NextResponse.json({ ok: true, success: queued.length, failed: failures.length, queued, failures });
  } catch (error) {
    return safeApiError(error, "Could not queue outbound prospects.");
  }
}
