import { NextResponse } from "next/server";
import { getProofPackItems } from "@/lib/premium-persistence";
import { verifyPremiumAccess } from "@/lib/premium-access";
import { buildCustomerDeliveryCsv } from "@/lib/sales-navigator-persistence";
import { csvEscape } from "@/lib/sales-navigator-import";
import { resolveCustomerAccess } from "@/lib/customer-access";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email") || "";
  const deliveryToken = url.searchParams.get("delivery_token") || "";
  const sessionId = url.searchParams.get("session_id") || "";
  const accessToken = url.searchParams.get("access_token") || "";
  if (!email) return NextResponse.json({ error: "email is required." }, { status: 400 });

  if (deliveryToken) {
    const importedCsv = await buildCustomerDeliveryCsv(email, deliveryToken);
    if (!importedCsv.split("\n")[1]) {
      return NextResponse.json({ error: "No delivery records found for this secure link." }, { status: 403 });
    }
    return new Response(importedCsv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=marketvibe-delivery.csv",
      },
    });
  }

  const access = sessionId
    ? await verifyPremiumAccess({ productCode: "proof_pack", sessionId, email })
    : await resolveCustomerAccess({ email, accessToken });
  if (!access.ok || access.email.trim().toLowerCase() !== email.trim().toLowerCase()) {
    return NextResponse.json({ error: "Paid access could not be verified." }, { status: 403 });
  }

  const items = await getProofPackItems(access.email);
  const rows = [
    ["business_name", "website", "source_url", "intent_score", "pain_point", "outreach_angle"],
    ...items.map((item) => [
      item.business_name,
      item.website || "",
      item.source_url || "",
      item.intent_score,
      item.pain_point,
      item.outreach_angle,
    ]),
  ];
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=marketvibe-proof-pack.csv",
    },
  });
}
