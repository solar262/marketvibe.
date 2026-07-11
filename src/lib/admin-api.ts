import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";

export async function requireAdminJson() {
  if (await requireAdminApi()) return null;
  return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
}

export function safeApiError(error: unknown, fallback = "Request failed.") {
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ error: message }, { status: 400 });
}
