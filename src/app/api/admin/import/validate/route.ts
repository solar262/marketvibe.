import { NextResponse } from "next/server";
import { requireAdminJson, safeApiError } from "@/lib/admin-api";
import { buildImportPreviewFromRows, type ColumnMapping } from "@/lib/sales-navigator-import";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  try {
    const payload = await request.json();
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    const headers = Array.isArray(payload.headers) ? payload.headers.map(String) : [];
    if (rows.length === 0) return NextResponse.json({ error: "No rows to validate." }, { status: 400 });
    if (headers.length === 0) return NextResponse.json({ error: "No CSV headers were supplied." }, { status: 400 });

    const preview = buildImportPreviewFromRows({
      filename: String(payload.filename || "uploaded.csv"),
      delimiter: payload.delimiter === ";" || payload.delimiter === "\t" ? payload.delimiter : ",",
      sourceFormat: payload.sourceFormat === "xlsx" ? "xlsx" : "csv",
      worksheetName: payload.worksheetName ? String(payload.worksheetName) : undefined,
      headers,
      rows: rows as Record<string, string>[],
      fileChecksum: payload.fileChecksum ? String(payload.fileChecksum) : undefined,
      rowFingerprints: Array.isArray(payload.rowFingerprints) ? payload.rowFingerprints.map(String) : undefined,
      mapping: (payload.mapping || undefined) as ColumnMapping | undefined,
    });
    return NextResponse.json({ ok: true, preview });
  } catch (error) {
    return safeApiError(error, "CSV validation failed.");
  }
}
