import { NextResponse } from "next/server";
import { customerEmailForApiKey, listCustomerOpportunityData } from "@/lib/operations-integrations";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const customerEmail = customerEmailForApiKey(token);
  if (!customerEmail) return NextResponse.json({ ok: false, error: "Invalid customer API key." }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "Data service is unavailable." }, { status: 503 });
  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 50), 1), 100);
  const before = url.searchParams.get("before") || undefined;
  const items = await listCustomerOpportunityData({ supabase, customerEmail, limit, before });
  await supabase.from("marketvibe_audit_events").insert({
    event_type: "customer_opportunity_api_accessed",
    actor_type: "customer",
    related_record_type: "customer_search_profile",
    reason: `${items.length} delivered opportunity record(s) returned through the authenticated customer API.`,
    event_payload: { customer_email: customerEmail, count: items.length, before: before || null },
  });
  return NextResponse.json({ ok: true, count: items.length, items, next_before: items[items.length - 1]?.delivered_at || null });
}
