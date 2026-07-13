import { NextResponse } from "next/server";
import { unsubscribeSalesLead } from "@/lib/sales-pipeline";

export const runtime = "nodejs";

async function handle(request: Request) {
  const url = new URL(request.url);
  const body = request.method === "POST" ? await request.json().catch(() => ({})) : {};
  const email = String((body as Record<string, unknown>).email || url.searchParams.get("email") || "");
  const token = String((body as Record<string, unknown>).token || url.searchParams.get("token") || "");
  const reason = String((body as Record<string, unknown>).reason || "unsubscribed");

  try {
    await unsubscribeSalesLead({ email, token, reason, source: request.method === "POST" ? "unsubscribe_post" : "unsubscribe_link" });
    if (request.method === "GET") {
      return new Response("You have been unsubscribed from MarketVibe sales follow-up.", {
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unsubscribe failed.",
    }, { status: 400 });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
