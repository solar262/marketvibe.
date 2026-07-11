import { NextResponse } from "next/server";
import { requireAdminJson, safeApiError } from "@/lib/admin-api";
import { importProspectsFromRows } from "@/lib/sales-navigator-persistence";
import type { ColumnMapping } from "@/lib/sales-navigator-import";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  try {
    const payload = await request.json();
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    const mapping = (payload.mapping || {}) as ColumnMapping;
    if (rows.length === 0) return NextResponse.json({ error: "No rows to import." }, { status: 400 });
    const result = await importProspectsFromRows({
      filename: String(payload.filename || "uploaded.csv"),
      rows,
      mapping,
      sourceFormat: payload.sourceFormat === "xlsx" ? "xlsx" : "csv",
      worksheetName: payload.worksheetName ? String(payload.worksheetName) : undefined,
      fileChecksum: payload.fileChecksum ? String(payload.fileChecksum) : undefined,
      rowFingerprints: Array.isArray(payload.rowFingerprints) ? payload.rowFingerprints.map(String) : undefined,
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return safeApiError(error, "Import failed.");
  }
}
