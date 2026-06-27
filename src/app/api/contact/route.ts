import { NextResponse } from "next/server";

const visits = new Map<string, number>();

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  const now = Date.now();
  const last = visits.get(ip) || 0;
  if (now - last < 10_000) return NextResponse.json({ error: "Please wait before sending another message." }, { status: 429 });
  visits.set(ip, now);
  const payload = await request.json();
  console.log("contact_message", payload);
  return NextResponse.json({ ok: true });
}
