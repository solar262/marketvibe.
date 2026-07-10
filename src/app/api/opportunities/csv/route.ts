import { NextResponse } from "next/server";
import { resolveCustomerAccess } from "@/lib/customer-access";
import { buildOpportunityDeliveryCsv, getCustomerOpportunityDeliveries } from "@/lib/opportunity-engine";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email") || "";
  const accessToken = url.searchParams.get("access_token") || "";
  const sessionId = url.searchParams.get("session_id") || "";
  if (!email) return NextResponse.json({ error: "email is required." }, { status: 400 });

  const access = await resolveCustomerAccess({ email, accessToken, sessionId });
  if (!access.ok || access.email.trim().toLowerCase() !== email.trim().toLowerCase()) {
    return NextResponse.json({ error: "Paid access could not be verified." }, { status: 403 });
  }

  const rows = await getCustomerOpportunityDeliveries(access.email);
  const csv = buildOpportunityDeliveryCsv(rows as Array<Record<string, unknown>>);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=marketvibe-opportunities.csv",
    },
  });
}

