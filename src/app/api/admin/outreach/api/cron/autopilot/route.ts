import { NextResponse } from "next/server";
import { requireAdminJson } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  url.pathname = "/api/cron/autopilot";
  url.search = "";
  return NextResponse.redirect(url, 307);
}
