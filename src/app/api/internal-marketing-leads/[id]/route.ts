import { NextResponse } from "next/server";
import { updateInternalMarketingLead } from "@/lib/internal-marketing-leads";
import { hasInternalApiAccess, INTERNAL_CORS_HEADERS } from "@/lib/internal-access";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: INTERNAL_CORS_HEADERS });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await hasInternalApiAccess(request))) {
      return NextResponse.json({ error: "Internal access required" }, { status: 401, headers: INTERNAL_CORS_HEADERS });
    }
    const { id } = await context.params;
    const payload = await request.json();
    return NextResponse.json(await updateInternalMarketingLead(id, {
      status: payload.status,
      outreachStatus: payload.outreachStatus,
    }), { headers: INTERNAL_CORS_HEADERS });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Lead update failed" }, { status: 400, headers: INTERNAL_CORS_HEADERS });
  }
}
