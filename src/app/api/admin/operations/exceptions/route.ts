import { NextResponse } from "next/server";
import { requireAdminJson, safeApiError } from "@/lib/admin-api";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const allowedActions = new Set(["approved", "rejected", "deferred", "resolved"]);

export async function POST(request: Request) {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  try {
    const payload = await request.json();
    const id = String(payload.id || "");
    const status = String(payload.status || "");
    const note = String(payload.note || "");
    if (!id) return NextResponse.json({ error: "Exception id is required." }, { status: 400 });
    if (!allowedActions.has(status)) return NextResponse.json({ error: "Unsupported exception action." }, { status: 400 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: "Supabase server writes are not configured." }, { status: 500 });

    const { data: current, error: loadError } = await supabase
      .from("marketvibe_exceptions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (loadError) throw loadError;
    if (!current) return NextResponse.json({ error: "Exception was not found." }, { status: 404 });

    const history = Array.isArray(current.resolution_audit_history) ? current.resolution_audit_history : [];
    const nextHistory = [
      ...history,
      {
        status,
        note,
        actor_type: "admin",
        created_at: new Date().toISOString(),
      },
    ];
    const { error: updateError } = await supabase
      .from("marketvibe_exceptions")
      .update({
        status,
        resolution_audit_history: nextHistory,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (updateError) throw updateError;

    await supabase.from("marketvibe_audit_events").insert({
      event_type: "exception_resolution",
      actor_type: "admin",
      related_record_type: current.affected_record_type || "exception",
      related_record_id: current.affected_record_id || id,
      source_state: current.status,
      destination_state: status,
      reason: note || `Exception marked ${status}.`,
      event_payload: { exception_id: id, category: current.category },
    });

    return NextResponse.json({ ok: true, status });
  } catch (error) {
    return safeApiError(error, "Exception action failed.");
  }
}
