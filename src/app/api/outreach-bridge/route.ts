import { NextResponse } from "next/server";
import { getOutreachStats } from "@/lib/outreach";
import { queueEligibleSavedLeads } from "@/lib/outreach-automation";
import { sendQueuedOutreachHardCapped } from "@/lib/outreach-hard-cap";

async function isAuthorized(request: Request) {
  const supplied = request.headers.get("x-brevo-key") || "";
  if (!supplied) return false;

  try {
    const response = await fetch("https://api.brevo.com/v3/senders", {
      headers: { "api-key": supplied, accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return false;
    const data = (await response.json()) as { senders?: Array<{ email?: string; active?: boolean }> };
    return Boolean(data.senders?.some((sender) => sender.email?.toLowerCase() === "hello@marketvibe1.com" && sender.active !== false));
  } catch {
    return false;
  }
}

function boundedLimit(value: unknown) {
  const parsed = Number(value || 25);
  if (!Number.isFinite(parsed)) return 25;
  return Math.max(1, Math.min(Math.floor(parsed), 25));
}

export async function GET(request: Request) {
  if (!(await isAuthorized(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const stats = await getOutreachStats();
  return NextResponse.json({
    ok: !stats.error,
    counts: stats.counts,
    latest: stats.latest.slice(0, 10).map((item: Record<string, unknown>) => ({
      recipient: String(item.recipient_email || "").replace(/(^.).*(@.*$)/, "$1***$2"),
      status: String(item.status || ""),
      subject: String(item.subject || ""),
    })),
    error: stats.error || null,
  });
}

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { action?: string; limit?: number };
  const limit = boundedLimit(body.limit);

  if (body.action === "prepare") {
    const stats = await getOutreachStats();
    const pending = Number(stats.counts.pending || 0);
    if (pending > 0) {
      return NextResponse.json({ ok: true, queued: 0, skipped: 0, existingPending: pending });
    }
    const result = await queueEligibleSavedLeads(Math.min(limit, 10));
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  }

  if (body.action === "send") {
    const result = await sendQueuedOutreachHardCapped(limit);
    return NextResponse.json({ ok: !result.error, delivery: result }, { status: result.error ? 500 : 200 });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
