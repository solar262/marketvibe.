import { NextResponse } from "next/server";
import { ensureBuyerPipelineJobs } from "@/lib/buyer-pipeline-recovery";
import { isGitHubActionsAuthorized } from "@/lib/github-actions-oidc";
import { runEmailOperations } from "@/lib/operations-email";
import { runGovernanceControl } from "@/lib/operations-governance";
import { runIntegrationDelivery } from "@/lib/operations-integrations";
import { runOperationsLearning } from "@/lib/operations-learning";
import { backfillImportedBuyerCompanies, runBuyerPipelineWorker } from "@/lib/operations-pipeline";
import { runOperationsControl } from "@/lib/operations-reliability";
import { runContinuousSupply } from "@/lib/operations-supply";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  if (!await isGitHubActionsAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "GitHub Actions OIDC authentication required." }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "Data service is unavailable." }, { status: 503 });
  const task = new URL(request.url).searchParams.get("task") || "";
  if (task === "buyer-pipeline") {
    const [backfill, recovery] = await Promise.all([backfillImportedBuyerCompanies({ supabase }), ensureBuyerPipelineJobs({ supabase })]);
    const result = await runBuyerPipelineWorker({ supabase, workerId: "github-actions-buyer-pipeline", limit: 5 });
    return NextResponse.json({ ok: true, task, backfill, recovery, result });
  }
  if (task === "email-operations") return NextResponse.json({ task, ...await runEmailOperations({ supabase, limit: 50 }) });
  if (task === "integration-delivery") return NextResponse.json({ task, ...await runIntegrationDelivery({ supabase }) });
  if (task === "operations-control") return NextResponse.json({ task, ...await runOperationsControl({ supabase }) });
  if (task === "continuous-supply") return NextResponse.json({ task, ...await runContinuousSupply({ supabase }) });
  if (task === "operations-learning") return NextResponse.json({ task, ...await runOperationsLearning({ supabase }) });
  if (task === "governance-control") return NextResponse.json({ task, ...await runGovernanceControl({ supabase }) });
  return NextResponse.json({ ok: false, error: "Unknown automation task." }, { status: 400 });
}
