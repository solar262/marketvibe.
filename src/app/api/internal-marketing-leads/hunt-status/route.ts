import { NextResponse } from "next/server";
import { latestInternalMarketingLeadStatus, updateInternalMarketingLeadStatus, type InternalMarketingLeadStatus } from "@/lib/internal-marketing-leads";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  return NextResponse.json(latestInternalMarketingLeadStatus, { headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<InternalMarketingLeadStatus>;
    return NextResponse.json(updateInternalMarketingLeadStatus(payload), { headers: CORS_HEADERS });
  } catch (error) {
    return NextResponse.json(
      { ...latestInternalMarketingLeadStatus, error: error instanceof Error ? error.message : "Status update failed" },
      { status: 400, headers: CORS_HEADERS },
    );
  }
}
