import { sendTransactionalEmail } from "@/lib/brevo";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth || auth !== `Bearer ${process.env.INTERNAL_MARKETING_API_KEY}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { to, subject, htmlContent, textContent, providerId } = body;

    const result = await sendTransactionalEmail({
      to,
      subject,
      htmlContent,
      textContent,
    });

    const supabase = getSupabaseAdmin();
    if (supabase) {
      await supabase.from("marketvibe_audit_events").insert({
        event_type: "provider_api_proxy_sent",
        actor_type: "provider",
        related_record_type: "email_proxy",
        related_record_id: null,
        reason: "Captured by Vercel Provider Gateway",
        event_payload: {
          component: "email",
          to,
          subject,
          result_message_id: result?.messageId || result?.message_id || "unknown",
        }
      });
    }

    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Email proxy failed" }, { status: 500 });
  }
}
