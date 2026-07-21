import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { ingestLicensedOpportunityBatch, type LicensedOpportunityInput } from "@/lib/operations-supply";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const expected = process.env.OPPORTUNITY_SOURCE_WEBHOOK_SECRET || "";
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!expected || expected.length !== supplied.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: "Unauthorized source webhook." }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase server access is not configured." }, { status: 503 });
  const payload = await request.json().catch(() => null) as { provider?: string; license_basis?: string; items?: LicensedOpportunityInput[] } | null;
  if (!payload || !Array.isArray(payload.items) || payload.items.length === 0 || payload.items.length > 250) {
    return NextResponse.json({ ok: false, error: "Provide between 1 and 250 opportunity items." }, { status: 400 });
  }
  if (!String(payload.license_basis || "").trim()) {
    return NextResponse.json({ ok: false, error: "A documented license_basis is required." }, { status: 400 });
  }
  const provider = String(payload.provider || "licensed_opportunity_webhook").replace(/[^a-z0-9_-]/gi, "_").slice(0, 80);
  const result = await ingestLicensedOpportunityBatch({
    supabase,
    providerIdentifier: provider,
    items: payload.items.map((item) => ({ ...item, license_basis: item.license_basis || payload.license_basis })),
  });
  return NextResponse.json({ ok: true, provider, ...result });
}
