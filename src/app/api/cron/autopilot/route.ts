import { NextResponse } from "next/server";
import { sendTransactionalEmail } from "@/lib/brevo";
import { ensureBuyerPipelineJobs } from "@/lib/buyer-pipeline-recovery";
import { requireCron } from "@/lib/cron-auth";
import { fillDueCustomerShortages } from "@/lib/delivery-cadence";
import {
  backfillImportedBuyerCompanies,
  runBuyerPipelineWorker,
} from "@/lib/operations-pipeline";
import {
  getOpportunityEngineSummary,
  publishDueOpportunityDeliveries,
  refreshStaleOpportunities,
  runOpportunityVerification,
} from "@/lib/opportunity-engine";
import { sendPendingPremiumDeliveryEmails } from "@/lib/premium-delivery-email";
import { runCustomerProfileOpportunityDiscovery } from "@/lib/public-opportunity-discovery";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type AutopilotStep = {
  name: string;
  ok: boolean;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  result?: unknown;
  error?: string;
};

async function runStep(name: string, action: () => Promise<unknown>): Promise<AutopilotStep> {
  const startedAt = new Date().toISOString();
  try {
    const result = await action();
    const finishedAt = new Date().toISOString();
    return {
      name,
      ok: true,
      startedAt,
      finishedAt,
      durationMs: Date.parse(finishedAt) - Date.parse(startedAt),
      result,
    };
  } catch (error) {
    const finishedAt = new Date().toISOString();
    const message = error instanceof Error ? error.message : `${name} failed`;
    console.error(`[autopilot] ${name} failed`, error);
    return {
      name,
      ok: false,
      startedAt,
      finishedAt,
      durationMs: Date.parse(finishedAt) - Date.parse(startedAt),
      error: message,
    };
  }
}

async function sendFailureAlert(steps: AutopilotStep[], startedAt: string) {
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const failures = steps.filter((step) => !step.ok);
  if (!adminEmail || failures.length === 0) {
    return {
      attempted: false,
      sent: false,
      reason: adminEmail ? "No failed stages." : "ADMIN_EMAIL is not configured.",
    };
  }

  const failureLines = failures
    .map((step) => `- ${step.name}: ${step.error || "Unknown failure"}`)
    .join("\n");
  const escapedFailureLines = failureLines
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  try {
    await sendTransactionalEmail({
      to: adminEmail,
      subject: `MarketVibe autopilot needs attention (${failures.length} failed stage${failures.length === 1 ? "" : "s"})`,
      htmlContent: `
        <p>The MarketVibe recovery run started at ${startedAt} and could not recover every stage.</p>
        <p>${escapedFailureLines}</p>
        <p>The successful stages continued running. The next scheduled run will retry the failed work.</p>
      `,
      textContent: `The MarketVibe recovery run started at ${startedAt} and could not recover every stage.\n\n${failureLines}\n\nThe successful stages continued running. The next scheduled run will retry the failed work.`,
    });
    return { attempted: true, sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failure alert could not be sent.";
    console.error("[autopilot] failure alert could not be sent", error);
    return { attempted: true, sent: false, error: message };
  }
}

export async function GET(request: Request) {
  const unauthorized = requireCron(request);
  if (unauthorized) return unauthorized;

  const startedAt = new Date().toISOString();
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        status: "blocked",
        message: "Supabase privileged access is required for the autonomous revenue loop.",
        startedAt,
      },
      { status: 500 },
    );
  }

  const steps: AutopilotStep[] = [];

  steps.push(await runStep("buyer-pipeline-recovery", async () => {
    const backfill = await backfillImportedBuyerCompanies({ supabase });
    const recovery = await ensureBuyerPipelineJobs({ supabase });
    const worker = await runBuyerPipelineWorker({
      supabase,
      workerId: "autopilot-recovery",
    });
    return { backfill, recovery, worker };
  }));

  steps.push(await runStep("opportunity-discovery", () =>
    runCustomerProfileOpportunityDiscovery({ trigger: "cron" })));

  steps.push(await runStep("opportunity-verification", () =>
    runOpportunityVerification({ trigger: "cron" })));

  steps.push(await runStep("customer-shortage-recovery", () =>
    fillDueCustomerShortages({ trigger: "cron" })));

  steps.push(await runStep("stale-opportunity-replacement", () =>
    refreshStaleOpportunities({ trigger: "cron" })));

  steps.push(await runStep("customer-delivery", async () => {
    const published = await publishDueOpportunityDeliveries({
      trigger: "cron",
      sendEmail: false,
    });
    const emailDelivery = await sendPendingPremiumDeliveryEmails({ limit: 100 });
    return { published, emailDelivery };
  }));

  steps.push(await runStep("health-summary", () => getOpportunityEngineSummary()));

  const failedSteps = steps.filter((step) => !step.ok);
  const alert = await sendFailureAlert(steps, startedAt);
  const finishedAt = new Date().toISOString();
  const ok = failedSteps.length === 0;

  return NextResponse.json(
    {
      ok,
      status: ok ? "healthy" : "degraded",
      message: ok
        ? "Autonomous revenue and customer-delivery recovery completed."
        : "Autopilot completed with failed stages; successful stages were not blocked.",
      startedAt,
      finishedAt,
      durationMs: Date.parse(finishedAt) - Date.parse(startedAt),
      failedStageCount: failedSteps.length,
      steps,
      alert,
    },
    { status: ok ? 200 : 500 },
  );
}
