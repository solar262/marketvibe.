import { NextResponse } from "next/server";
import { resolveCustomerAccess } from "@/lib/customer-access";
import { normalizeOpportunityFeedbackStatus, recordOpportunityFeedback } from "@/lib/opportunity-engine";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const accessToken = String(body.accessToken || "");
  const sessionId = String(body.sessionId || "");
  const assignmentId = String(body.assignmentId || "");
  const status = normalizeOpportunityFeedbackStatus(body.status);
  const note = String(body.note || "");

  if (!email || !assignmentId || !status) {
    return NextResponse.json({ error: "email, assignmentId, and a valid feedback status are required." }, { status: 400 });
  }

  const access = await resolveCustomerAccess({ email, accessToken, sessionId });
  if (!access.ok || access.email.trim().toLowerCase() !== email) {
    return NextResponse.json({ error: "Paid access could not be verified." }, { status: 403 });
  }

  try {
    return NextResponse.json(await recordOpportunityFeedback({
      assignmentId,
      customerEmail: access.email,
      status,
      note,
      submittedBy: "customer",
    }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Feedback could not be saved." }, { status: 400 });
  }
}
