import { NextResponse } from "next/server";
import { createDataRequestCase } from "@/lib/operations-governance";
import { sendAdminRevenueAlert, sendCustomerSupportAutoReply } from "@/lib/revenue-automation";
import { getSupabaseAdmin } from "@/lib/supabase";

const visits = new Map<string, number>();

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const last = visits.get(ip) || 0;
  if (Date.now() - last < 10_000) return NextResponse.json({ ok: false, error: "Please wait before sending another request." }, { status: 429 });
  visits.set(ip, Date.now());
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "Data request service is unavailable." }, { status: 503 });
  try {
    const payload = await request.json();
    const result = await createDataRequestCase({ supabase, payload });
    const email = String(payload.email || "");
    const name = String(payload.name || "");
    await Promise.allSettled([
      sendAdminRevenueAlert({
        subject: `MarketVibe data request: ${result.requestType}`,
        textContent: `Data request ${result.id} received. Type: ${result.requestType}. Immediate suppression: ${result.immediateSuppression}.`,
        htmlContent: `<p>Data request <strong>${result.id}</strong> received.</p><p>Type: ${result.requestType}</p><p>Immediate suppression: ${result.immediateSuppression}</p>`,
      }),
      sendCustomerSupportAutoReply({ email, name, offer: "data-request" }),
    ]);
    return NextResponse.json({ ok: true, caseId: result.id, immediateSuppression: result.immediateSuppression, message: "Your request is recorded. Marketing suppression is immediate where applicable; identity-sensitive fulfilment requires verification." });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "The request could not be recorded." }, { status: 400 });
  }
}
