import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { requireAdminJson, safeApiError } from "@/lib/admin-api";

export const runtime = "nodejs";

export async function GET() {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  try {
    const csv = await readFile(join(process.cwd(), "samples", "sales-navigator-import-template.csv"), "utf8");
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=sales-navigator-import-template.csv",
      },
    });
  } catch (error) {
    return safeApiError(error, "Template could not be loaded.");
  }
}
