import { NextResponse } from "next/server";
import { requireAdminJson, safeApiError } from "@/lib/admin-api";
import { buildDeliveryCsv } from "@/lib/sales-navigator-import";
import { listImportedProspects } from "@/lib/sales-navigator-persistence";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  try {
    const payload = await request.json();
    const selectedIds = new Set(Array.isArray(payload.ids) ? payload.ids.map(String) : []);
    const prospects = await listImportedProspects({});
    const rows = prospects.filter((prospect: { id: string }) => selectedIds.has(String(prospect.id)));
    if (rows.length === 0) return NextResponse.json({ error: "Select at least one row to export." }, { status: 400 });
    const csv = buildDeliveryCsv(rows);
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=marketvibe-selected-prospects.csv",
      },
    });
  } catch (error) {
    return safeApiError(error, "Export failed.");
  }
}
