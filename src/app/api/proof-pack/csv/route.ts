import { NextResponse } from "next/server";
import { getProofPackItems } from "@/lib/premium-persistence";
import { verifyPremiumAccess } from "@/lib/premium-access";
import { buildCustomerDeliveryCsv } from "@/lib/sales-navigator-persistence";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email") || "";
  const deliveryToken = url.searchParams.get("delivery_token") || "";
  const sessionId = url.searchParams.get("session_id") || "";
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

  if (!sessionId) {
    return NextResponse.json({ error: "A secure delivery token or paid session is required." }, { status: 403 });
  }

  const access = await verifyPremiumAccess({ productCode: "proof_pack", sessionId, email });
  if (!access.ok) {
    return NextResponse.json({ error: "Paid access could not be verified." }, { status: 403 });
  }

  const items = await getProofPackItems(email);
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
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=marketvibe-proof-pack.csv",
    },
  });
}
