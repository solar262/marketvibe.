import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth || auth !== `Bearer ${process.env.INTERNAL_MARKETING_API_KEY}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "Stripe not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Body should match Stripe.Checkout.SessionCreateParams
    const session = await stripe.checkout.sessions.create(body);

    const supabase = getSupabaseAdmin();
    if (supabase) {
      await supabase.from("marketvibe_audit_events").insert({
        event_type: "provider_api_proxy_sent",
        actor_type: "provider",
        related_record_type: "stripe_checkout",
        related_record_id: null,
        reason: "Captured by Vercel Provider Gateway",
        event_payload: {
          component: "stripe_checkout",
          session_id: session.id,
          url: session.url,
          payment_status: session.payment_status,
        }
      });
    }

    return Response.json({ success: true, session });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Stripe proxy failed" }, { status: 500 });
  }
}
