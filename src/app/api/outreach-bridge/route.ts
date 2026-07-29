import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getOutreachStats } from "@/lib/outreach";
import { queueEligibleSavedLeads } from "@/lib/outreach-automation";
import { sendQueuedOutreachHardCapped } from "@/lib/outreach-hard-cap";

type Authorization = { ok: boolean; brevoKey: string };

function expectedBridgeToken() {
  const key = process.env.BREVO_API_KEY || "";
  return key ? createHash("sha256").update(`marketvibe-bridge:${key}`).digest("hex") : "";
}

async function authorize(request: Request): Promise<Authorization> {
  const suppliedKey = request.headers.get("x-brevo-key") || "";
  if (suppliedKey) {
    try {
      const response = await fetch("https://api.brevo.com/v3/account", {
        headers: { "api-key": suppliedKey, accept: "application/json" },
        cache: "no-store",
      });
      if (response.ok) return { ok: true, brevoKey: suppliedKey };
    } catch {}
  }

  const expected = expectedBridgeToken();
  const suppliedToken = request.headers.get("x-marketvibe-bridge") || "";
  if (expected && suppliedToken.length === expected.length && timingSafeEqual(Buffer.from(suppliedToken), Buffer.from(expected))) {
    return { ok: true, brevoKey: process.env.BREVO_API_KEY || "" };
  }
  return { ok: false, brevoKey: "" };
}

function applyMailerConfig(brevoKey: string) {
  if (!brevoKey) return;
  process.env.BREVO_API_KEY = brevoKey;
  process.env.OUTREACH_EMAIL_PROVIDER = "brevo";
  process.env.OUTREACH_FROM_EMAIL = "hello@marketvibe1.com";
  process.env.OUTREACH_FROM_NAME = "MarketVibe";
  process.env.OUTREACH_REPLY_TO = "hello@marketvibe1.com";
  process.env.OUTREACH_DAILY_SEND_LIMIT = process.env.OUTREACH_DAILY_SEND_LIMIT || "50";
  process.env.OUTREACH_EMAIL_ENABLED = "true";
}

function boundedLimit(value: unknown) {
  const parsed = Number(value || 5);
  if (!Number.isFinite(parsed)) return 5;
  return Math.max(1, Math.min(Math.floor(parsed), 10));
}

export async function GET(request: Request) {
  const authorization = await authorize(request);
  if (!authorization.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  applyMailerConfig(authorization.brevoKey);
  const stats = await getOutreachStats();
  return NextResponse.json({
    ok: !stats.error,
    sendReady: Boolean(stats.config?.enabled),
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
  const authorization = await authorize(request);
  if (!authorization.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  applyMailerConfig(authorization.brevoKey);
  const body = (await request.json().catch(() => ({}))) as { action?: string; limit?: number };
  const limit = boundedLimit(body.limit);

  if (body.action === "prepare") {
    const stats = await getOutreachStats();
    const pending = Number(stats.counts.pending || 0);
    if (pending > 0) return NextResponse.json({ ok: true, queued: 0, skipped: 0, existingPending: pending });
    const result = await queueEligibleSavedLeads(Math.min(limit, 10));
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  }

  if (body.action === "send") {
    const result = await sendQueuedOutreachHardCapped(Math.min(limit, 5));
    if (result.error) return NextResponse.json({ ok: false, error: result.error, delivery: result }, { status: 500 });
    return NextResponse.json({ ok: true, delivery: result });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
