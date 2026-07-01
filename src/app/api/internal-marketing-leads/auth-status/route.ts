import { NextResponse } from "next/server";
import { internalAccessKey, INTERNAL_CORS_HEADERS } from "@/lib/internal-access";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: INTERNAL_CORS_HEADERS });
}

function requestKey(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1] || "";
  return request.headers.get("x-marketvibe-internal-key") || bearer || "";
}

export async function POST(request: Request) {
  const key = requestKey(request).trim();
  if (!key) return NextResponse.json({ status: "Missing key" }, { status: 401, headers: INTERNAL_CORS_HEADERS });

  const configuredKey = internalAccessKey();
  if (!configuredKey || key !== configuredKey) {
    return NextResponse.json({ status: "Invalid key" }, { status: 401, headers: INTERNAL_CORS_HEADERS });
  }

  return NextResponse.json({ status: "Connected" }, { headers: INTERNAL_CORS_HEADERS });
}
