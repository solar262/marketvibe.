import { NextResponse } from "next/server";
import { getProofPackItems } from "@/lib/premium-persistence";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get("email") || "";
  if (!email) return NextResponse.json({ error: "email is required." }, { status: 400 });

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
