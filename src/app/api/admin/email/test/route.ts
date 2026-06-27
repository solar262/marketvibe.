import { NextResponse } from "next/server";
import { adminCredentials } from "@/lib/auth";
import { sendTransactionalEmail } from "@/lib/brevo";

export async function POST() {
  const adminEmail = adminCredentials().email;
  if (!adminEmail) {
    return NextResponse.json({ ok: false, error: "Admin email is not configured." }, { status: 500 });
  }

  try {
    await sendTransactionalEmail({
      to: adminEmail,
      subject: "MarketVibe Brevo test email",
      htmlContent: "<p>This is a MarketVibe Brevo test email for the admin address only.</p>",
      textContent: "This is a MarketVibe Brevo test email for the admin address only.",
    });
    return NextResponse.json({ ok: true, sentTo: adminEmail });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unable to send test email.",
    }, { status: 500 });
  }
}

