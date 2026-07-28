import { NextResponse } from "next/server";
import { sendTransactionalEmail } from "@/lib/brevo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ONE_TIME_TOKEN = "mv-20260728-7c3f2f9e1b6a4d8c";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("token") !== ONE_TIME_TOKEN) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const to = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (!to) {
    return NextResponse.json({ ok: false, error: "ADMIN_EMAIL is not configured." }, { status: 500 });
  }

  try {
    const result = await sendTransactionalEmail({
      to,
      subject: "MarketVibe live Brevo test",
      htmlContent: "<p>This is the requested live Brevo test from MarketVibe.</p><p>If you received this, Brevo sending is working.</p>",
      textContent: "This is the requested live Brevo test from MarketVibe. If you received this, Brevo sending is working.",
    });
    return NextResponse.json({ ok: true, sentTo: to.replace(/(^.).*(@.*$)/, "$1***$2"), result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Brevo test failed." }, { status: 500 });
  }
}
