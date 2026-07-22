import { NextResponse } from "next/server";
import { INTERNAL_CORS_HEADERS, internalAccessKey, validateInternalAccessKey } from "@/lib/internal-access";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: INTERNAL_CORS_HEADERS });
}

export async function POST(request: Request) {
  const configuredKey = internalAccessKey();
  if (!configuredKey) {
    return NextResponse.json({ status: "Invalid key" }, { status: 401, headers: INTERNAL_CORS_HEADERS });
  }

  const validation = validateInternalAccessKey(request);
  if (!validation.ok) {
    if (validation.status === "Missing key") {
      return NextResponse.json({ status: "Missing key" }, { status: 401, headers: INTERNAL_CORS_HEADERS });
    }
    return NextResponse.json({ status: "Invalid key" }, { status: 401, headers: INTERNAL_CORS_HEADERS });
  }
  return NextResponse.json({ status: "Connected" }, { headers: INTERNAL_CORS_HEADERS });
}
