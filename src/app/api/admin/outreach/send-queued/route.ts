import { NextResponse } from "next/server";
import { sendQueuedOutreach } from "@/lib/outreach";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit") || "5"), 25));
  const result = await sendQueuedOutreach(limit);
  return NextResponse.json(result, { status: result.error ? 400 : 200 });
}

