import { NextResponse } from "next/server";
import { createSalesLead, validateSalesLeadInput } from "@/lib/sales-pipeline";

export const runtime = "nodejs";

const visits = new Map<string, number>();

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  const now = Date.now();
  const last = visits.get(ip) || 0;
  if (now - last < 8_000) return NextResponse.json({ error: "Please wait before sending another qualification." }, { status: 429 });
  visits.set(ip, now);

  const payload = await request.json().catch(() => null);
  const body = payload && typeof payload === "object" ? { ...(payload as Record<string, unknown>) } : {};
  body.consentIp = ip;
  const validation = validateSalesLeadInput(body);
  if (!validation.ok) return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });

  try {
    const result = await createSalesLead(body);
    return NextResponse.json({
      ok: true,
      score: result.score,
      fit: result.fit,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Sales qualification failed.",
    }, { status: 500 });
  }
}
