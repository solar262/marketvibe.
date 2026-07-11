import { NextResponse } from "next/server";
import { requireAdminJson, safeApiError } from "@/lib/admin-api";
import { getSupabaseAdmin } from "@/lib/supabase";
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

async function createPropertyOpportunityProfile() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase privileged access is not configured.");

  const profileRow = {
    customer_email: "admin@marketvibe.local",
    product_code: "radar",
    status: "active",
    niche: "High-value property and construction opportunities",
    target_service: "Property development, construction, renovation, land, planning, buyer and seller opportunities",
    target_industries: [
      "property development",
      "residential construction",
      "commercial construction",
      "luxury renovation",
      "real estate",
      "land development",
      "architecture",
      "general contracting",
    ],
    target_locations: ["Dallas, United States"],
    company_sizes: [],
    target_job_roles: [
      "owner",
      "founder",
      "chief executive officer",
      "managing director",
      "property developer",
      "real estate investor",
      "development director",
      "construction director",
      "project director",
      "general contractor",
    ],
    minimum_fit_score: 35,
    minimum_intent_score: 25,
    minimum_evidence_score: 30,
    maximum_record_age_days: 60,
    opportunity_quantity: 25,
    delivery_frequency: "weekly",
    exclusivity_mode: "customer_exclusive",
    exclusivity_period_days: 14,
    allow_profile_only: false,
    replacement_policy: "admin_review",
    metadata: {
      name: "MarketVibe Property Opportunity Profile",
      created_by: "admin_one_click_profile",
      buyer_type: "High-ticket property, construction, development, renovation, and real-estate service businesses",
      opportunity_signals: [
        "looking for builder",
        "need contractor",
        "planning permission",
        "land for sale",
        "new build",
        "property development",
        "commercial development",
        "luxury renovation",
        "property buyer",
        "property seller",
        "real estate investment",
      ],
    },
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("customer_search_profiles")
    .upsert(profileRow, { onConflict: "customer_email,product_code,niche" })
    .select("id,status,niche,target_locations")
    .single();

  if (error || !data) throw error || new Error("Property opportunity profile could not be created.");

  let discovery: unknown = null;
  let discoveryError = "";
  try {
    discovery = await runOpportunityDiscovery({ trigger: "admin", profileId: String(data.id) });
  } catch (error) {
    discoveryError = error instanceof Error ? error.message : "Initial discovery could not run.";
  }

  return {
    ok: true,
    profileId: String(data.id),
    profile: data,
    discovery,
    discoveryError,
    message: discoveryError
      ? `Property opportunity profile is active. Initial discovery needs attention: ${discoveryError}`
      : "Property opportunity profile is active and the first discovery run completed.",
  };
}

export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  const { action } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    if (action === "create-property-profile") return NextResponse.json(await createPropertyOpportunityProfile());
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
