import { NextResponse } from "next/server";
import { requireAdminJson, safeApiError } from "@/lib/admin-api";
import { buildImportPreview, buildImportPreviewFromWorkbookBuffer, MAX_IMPORT_BYTES } from "@/lib/sales-navigator-import";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload a CSV file." }, { status: 400 });
    }
    const lowerName = file.name.toLowerCase();
    const isCsv = lowerName.endsWith(".csv");
    const isXlsx = lowerName.endsWith(".xlsx");
    if (!isCsv && !isXlsx) {
      return NextResponse.json({ error: "Only .csv and .xlsx files are supported." }, { status: 400 });
    }
    if (file.size > MAX_IMPORT_BYTES) {
      return NextResponse.json({ error: "CSV file is too large. Maximum size is 10 MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const preview = isXlsx
      ? await buildImportPreviewFromWorkbookBuffer({ buffer, filename: file.name, byteSize: file.size })
      : buildImportPreview({ text: buffer.toString("utf8"), filename: file.name, byteSize: file.size });
    return NextResponse.json({ ok: true, preview });
  } catch (error) {
    return safeApiError(error, "CSV preview failed.");
  }
}
