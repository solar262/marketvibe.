import { NextResponse } from "next/server";
import { resolveCustomerAccess } from "@/lib/customer-access";
import { requestOpportunityReplacement } from "@/lib/opportunity-engine";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const accessToken = String(body.accessToken || "");
  const sessionId = String(body.sessionId || "");
  const assignmentId = String(body.assignmentId || "");
  const reason = String(body.reason || "");
  const details = String(body.details || "");

  if (!email || !assignmentId || !reason) {
    return NextResponse.json({ error: "email, assignmentId, and reason are required." }, { status: 400 });
  }

  const access = await resolveCustomerAccess({ email, accessToken, sessionId });
  if (!access.ok || access.email.trim().toLowerCase() !== email) {
    return NextResponse.json({ error: "Paid access could not be verified." }, { status: 403 });
  }

  try {
    return NextResponse.json(await requestOpportunityReplacement({
      assignmentId,
      customerEmail: access.email,
      reason,
      details,
      requestedBy: "customer",
    }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Replacement request failed." }, { status: 400 });
  }
}

