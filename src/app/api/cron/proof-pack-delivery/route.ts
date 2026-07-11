import { NextResponse } from "next/server";
import { requireCron } from "@/lib/cron-auth";
import { sendPendingProofPackPdfs } from "@/lib/proof-pack-delivery";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = requireCron(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") || "10");
  const result = await sendPendingProofPackPdfs({ limit });
  return NextResponse.json(result);
}
