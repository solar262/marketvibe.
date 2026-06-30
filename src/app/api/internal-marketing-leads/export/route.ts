import { NextResponse } from "next/server";
import { exportInternalMarketingLeadsCsv } from "@/lib/internal-marketing-leads";
import { hasInternalApiAccess, INTERNAL_CORS_HEADERS } from "@/lib/internal-access";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: INTERNAL_CORS_HEADERS });
}

export async function GET(request: Request) {
  try {
    if (!(await hasInternalApiAccess(request))) {
      return NextResponse.json({ error: "Internal access required" }, { status: 401, headers: INTERNAL_CORS_HEADERS });
    }
    const csv = await exportInternalMarketingLeadsCsv();
    return new NextResponse(csv, {
      headers: {
        ...INTERNAL_CORS_HEADERS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="marketvibe-internal-marketing-leads.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Export failed" }, { status: 400, headers: INTERNAL_CORS_HEADERS });
  }
}
