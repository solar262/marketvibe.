import { NextResponse } from "next/server";
import { INTERNAL_CORS_HEADERS, validateInternalAccessKey } from "@/lib/internal-access";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: INTERNAL_CORS_HEADERS });
}

export async function POST(request: Request) {
  const validation = validateInternalAccessKey(request);
  if (!validation.ok) {
    return NextResponse.json({ status: validation.status }, { status: 401, headers: INTERNAL_CORS_HEADERS });
  }
  return NextResponse.json({ status: validation.status }, { headers: INTERNAL_CORS_HEADERS });
}
