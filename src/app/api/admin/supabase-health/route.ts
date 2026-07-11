import { NextResponse } from "next/server";
import { requireAdminJson } from "@/lib/admin-api";
import { formatSupabaseServerEnvError, supabaseConnectionStatus } from "@/lib/supabase";

export const runtime = "nodejs";

function errorDetails(error: unknown) {
  if (!(error instanceof Error)) {
    return { message: String(error) };
  }

  const cause = error.cause as { code?: string; errno?: number; syscall?: string; hostname?: string; message?: string } | undefined;
  return {
    name: error.name,
    message: error.message,
    causeCode: cause?.code,
    causeErrno: cause?.errno,
    causeSyscall: cause?.syscall,
    causeHostname: cause?.hostname,
    causeMessage: cause?.message,
  };
}

export async function GET() {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  const safeStatus = supabaseConnectionStatus();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const serviceRoleKey = process.env[safeStatus.serviceRoleKeyEnvName]?.trim() || "";

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ ok: false, safeStatus, error: formatSupabaseServerEnvError() });
  }

  const endpoint = `${supabaseUrl}/rest/v1/search_runs?select=id&limit=1`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: "no-store",
    });

    const body = await response.text();

    return NextResponse.json({
      ok: response.ok,
      safeStatus,
      httpStatus: response.status,
      httpStatusText: response.statusText,
      responsePreview: body.slice(0, 500),
      interpretation: response.ok
        ? "Supabase REST is reachable from Vercel and the service role key can read search_runs."
        : "Vercel reached Supabase, but Supabase rejected or errored on the request. Check table schema, RLS/service role key, or project state.",
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      safeStatus,
      fetchFailed: true,
      error: errorDetails(error),
      interpretation: "Vercel could not complete a network fetch to the Supabase REST endpoint. This is not a normal wrong-key error.",
    });
  }
}
