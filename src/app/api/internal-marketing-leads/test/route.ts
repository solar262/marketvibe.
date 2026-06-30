import { NextResponse } from "next/server";
import { createTestInternalMarketingLead } from "@/lib/internal-marketing-leads";
import { hasInternalApiAccess, INTERNAL_CORS_HEADERS } from "@/lib/internal-access";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: INTERNAL_CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    if (!(await hasInternalApiAccess(request))) {
      return NextResponse.json({ error: "Internal access required" }, { status: 401, headers: INTERNAL_CORS_HEADERS });
    }
    return NextResponse.json(await createTestInternalMarketingLead(), { headers: INTERNAL_CORS_HEADERS });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Test lead failed" }, { status: 400, headers: INTERNAL_CORS_HEADERS });
  }
}
