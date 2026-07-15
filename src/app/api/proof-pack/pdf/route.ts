import { NextResponse } from "next/server";
import { resolveCustomerAccess } from "@/lib/customer-access";
import { filterDeliverableBuyerIntentAssignments } from "@/lib/customer-delivery-quality";
import { getCustomerOpportunityDeliveries } from "@/lib/opportunity-engine";
import { buildProofPackPdf, proofPackPdfItemsFromOpportunityRows } from "@/lib/proof-pack-pdf";

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

  const rows = (await getCustomerOpportunityDeliveries(access.email)) as Array<Record<string, unknown>>;
  const proofPackRows = filterDeliverableBuyerIntentAssignments(rows.filter((row) => String(row.product_code || "") === "proof_pack"));

  if (proofPackRows.length === 0) {
    return NextResponse.json(
      { error: "No verified buyer-intent opportunities are ready for this Proof Pack." },
      { status: 404 },
    );
  }

  const pdf = buildProofPackPdf(
    proofPackPdfItemsFromOpportunityRows(proofPackRows),
    { customerEmail: access.email, generatedAt: new Date().toISOString() },
  );

  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": "attachment; filename=marketvibe-proof-pack.pdf",
      "cache-control": "private, no-store",
    },
  });
}
