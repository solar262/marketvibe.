import { assignVerifiedBuyerIntentOpportunities } from "@/lib/buyer-intent-matching";
import { replacementAutoApprovalReason } from "@/lib/opportunity-quality";
import { getSupabaseAdmin } from "@/lib/supabase";

function nowIso() {
  return new Date().toISOString();
}

async function assignmentIsNonExclusive(searchProfileId: string | null, productCode: string) {
  if (productCode === "proof_pack") return true;
  const supabase = getSupabaseAdmin();
  if (!supabase || !searchProfileId) return false;
  const { data, error } = await supabase
    .from("customer_search_profiles")
    .select("exclusivity_mode")
    .eq("id", searchProfileId)
    .maybeSingle();
  if (error) throw error;
  return String(data?.exclusivity_mode || "") === "non_exclusive";
}

export async function requestBuyerIntentReplacement(input: {
  assignmentId: string;
  customerEmail: string;
  reason: string;
  details?: string;
  requestedBy?: "customer" | "admin" | "system";
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase privileged access is not configured.");
  const customerEmail = input.customerEmail.trim().toLowerCase();

  const { data: assignment, error: assignmentError } = await supabase
    .from("opportunity_assignments")
    .select("id,opportunity_id,customer_email,search_profile_id,product_code")
    .eq("id", input.assignmentId)
    .eq("customer_email", customerEmail)
    .maybeSingle();
  if (assignmentError) throw assignmentError;
  if (!assignment) throw new Error("Delivery assignment was not found for this customer.");

  const { data, error } = await supabase.from("opportunity_replacement_requests").insert({
    assignment_id: assignment.id,
    opportunity_id: assignment.opportunity_id,
    customer_email: customerEmail,
    reason: input.reason,
    details: input.details || null,
    requested_by: input.requestedBy || "customer",
  }).select("id").single();
  if (error) throw error;

  const reusable = await assignmentIsNonExclusive(
    assignment.search_profile_id ? String(assignment.search_profile_id) : null,
    String(assignment.product_code || ""),
  );
  if (!reusable) {
    const { error: opportunityError } = await supabase.from("opportunities").update({
      inventory_status: "REPLACEMENT_REQUESTED",
      replacement_status: "requested",
      updated_at: nowIso(),
    }).eq("id", assignment.opportunity_id);
    if (opportunityError) throw opportunityError;
  }

  if (replacementAutoApprovalReason(input.reason) && input.requestedBy === "system") {
    await approveBuyerIntentReplacement(String(data.id), "system", "Automatically approved after objective verification failure.");
  }

  return { requestId: data.id as string };
}

export async function approveBuyerIntentReplacement(requestId: string, reviewedBy = "admin", reviewNote = "") {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase privileged access is not configured.");

  const { data: request, error } = await supabase
    .from("opportunity_replacement_requests")
    .select("*, opportunity_assignments(search_profile_id,product_code,customer_email)")
    .eq("id", requestId)
    .maybeSingle();
  if (error) throw error;
  if (!request) throw new Error("Replacement request was not found.");

  const assignment = Array.isArray(request.opportunity_assignments)
    ? request.opportunity_assignments[0]
    : request.opportunity_assignments;
  const profileId = assignment?.search_profile_id ? String(assignment.search_profile_id) : null;
  const productCode = String(assignment?.product_code || "");
  const reusable = await assignmentIsNonExclusive(profileId, productCode);

  const { error: requestUpdateError } = await supabase.from("opportunity_replacement_requests").update({
    status: "approved",
    reviewed_by: reviewedBy,
    review_note: reviewNote || null,
    updated_at: nowIso(),
  }).eq("id", requestId);
  if (requestUpdateError) throw requestUpdateError;

  const { error: assignmentUpdateError } = await supabase.from("opportunity_assignments").update({
    assignment_status: "replaced",
    updated_at: nowIso(),
  }).eq("id", request.assignment_id);
  if (assignmentUpdateError) throw assignmentUpdateError;

  const { error: opportunityUpdateError } = await supabase.from("opportunities").update(reusable ? {
    inventory_status: "IN_INVENTORY",
    replacement_status: "none",
    assignment_status: null,
    delivery_status: null,
    customer_email: null,
    product_code: null,
    updated_at: nowIso(),
  } : {
    inventory_status: "REPLACED",
    replacement_status: "approved",
    updated_at: nowIso(),
  }).eq("id", request.opportunity_id);
  if (opportunityUpdateError) throw opportunityUpdateError;

  const replacement = profileId
    ? await assignVerifiedBuyerIntentOpportunities({ trigger: "admin", profileId, quantity: 1 })
    : null;
  return { approved: true, reusableInventory: reusable, replacement };
}
