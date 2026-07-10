import { NextResponse } from "next/server";
import { requireAdminJson, safeApiError } from "@/lib/admin-api";
import { buildImportPreview, MAX_IMPORT_BYTES } from "@/lib/sales-navigator-import";

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
    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json({ error: "Only .csv files are supported." }, { status: 400 });
    }
    if (file.size > MAX_IMPORT_BYTES) {
      return NextResponse.json({ error: "CSV file is too large. Maximum size is 10 MB." }, { status: 400 });
    }

    const text = Buffer.from(await file.arrayBuffer()).toString("utf8");
    const preview = buildImportPreview({ text, filename: file.name, byteSize: file.size });
    return NextResponse.json({ ok: true, preview });
  } catch (error) {
    return safeApiError(error, "CSV preview failed.");
  }
}
