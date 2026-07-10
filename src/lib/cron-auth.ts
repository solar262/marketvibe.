import { NextResponse } from "next/server";

export function isCronAuthorized(request: Request) {
  const secret = (process.env.CRON_SECRET || process.env.ADMIN_SESSION_SECRET || "").trim();
  if (!secret) return process.env.NODE_ENV !== "production";

  const url = new URL(request.url);
  const authorization = request.headers.get("authorization") || "";
  const headerSecret = request.headers.get("x-cron-secret") || "";
  const querySecret = url.searchParams.get("secret") || "";
  return authorization === `Bearer ${secret}` || headerSecret === secret || querySecret === secret;
}

export function requireCron(request: Request) {
  if (isCronAuthorized(request)) return null;
  return NextResponse.json({ error: "Cron authentication required." }, { status: 401 });
}

