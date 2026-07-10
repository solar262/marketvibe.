import { NextResponse } from "next/server";
import { requireAdminJson, safeApiError } from "@/lib/admin-api";
import {
  approveReplacementRequest,
  fillCustomerShortages,
  publishDueOpportunityDeliveries,
  refreshStaleOpportunities,
  requestOpportunityReplacement,
  runOpportunityDiscovery,
  runOpportunityVerification,
  setOpportunityAutomationPaused,
} from "@/lib/opportunity-engine";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  const { action } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    if (action === "run-discovery") return NextResponse.json(await runOpportunityDiscovery({ trigger: "admin", profileId: body.profileId }));
    if (action === "run-verification") return NextResponse.json(await runOpportunityVerification({ trigger: "admin" }));
    if (action === "refresh-stale") return NextResponse.json(await refreshStaleOpportunities({ trigger: "admin" }));
    if (action === "fill-shortages") return NextResponse.json(await fillCustomerShortages({ trigger: "admin", profileId: body.profileId }));
    if (action === "publish-deliveries") return NextResponse.json(await publishDueOpportunityDeliveries({ trigger: "admin", sendEmail: body.sendEmail !== false }));
    if (action === "pause") return NextResponse.json(await setOpportunityAutomationPaused(true, String(body.reason || "Paused by admin.")));
    if (action === "resume") return NextResponse.json(await setOpportunityAutomationPaused(false));
    if (action === "request-replacement") {
      return NextResponse.json(await requestOpportunityReplacement({
        assignmentId: String(body.assignmentId || ""),
        customerEmail: String(body.customerEmail || ""),
        reason: String(body.reason || "other"),
        details: String(body.details || ""),
        requestedBy: "admin",
      }));
    }
    if (action === "approve-replacement") {
      return NextResponse.json(await approveReplacementRequest(String(body.requestId || ""), "admin", String(body.reviewNote || "")));
    }
    return NextResponse.json({ error: "Unknown opportunity admin action." }, { status: 404 });
  } catch (error) {
    return safeApiError(error, "Opportunity action failed.");
  }
}

