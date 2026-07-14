import { ensureBuyerPipelineJobs } from "@/lib/buyer-pipeline-recovery";
import {
  backfillImportedBuyerCompanies,
  runBuyerPipelineWorker,
} from "@/lib/operations-pipeline";
import {
  fillCustomerShortages,
  getOpportunityEngineSummary,
  publishDueOpportunityDeliveries,
  refreshStaleOpportunities,
  runOpportunityVerification,
} from "@/lib/opportunity-engine";
import { sendPendingPremiumDeliveryEmails } from "@/lib/premium-delivery-email";
import { runPropertyDiscoveryWithIntegrity } from "@/lib/property-opportunity-integrity";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  classifyMarketVibeCommand,
  supportedMarketVibeCommands,
} from "@/lib/allrounder-command-router";

export {
  classifyMarketVibeCommand,
  supportedMarketVibeCommands,
} from "@/lib/allrounder-command-router";
export type {
  AllRounderAction,
  AllRounderCommandPlan,
} from "@/lib/allrounder-command-router";

type StepResult = {
  name: string;
  ok: boolean;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  result?: unknown;
  error?: string;
};

async function runStep(name: string, action: () => Promise<unknown>): Promise<StepResult> {
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
    return {
      name,
      ok: false,
      startedAt,
      finishedAt,
      durationMs: Date.parse(finishedAt) - Date.parse(startedAt),
      error: error instanceof Error ? error.message : `${name} failed`,
    };
  }
}

async function runBuyerPipeline() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Supabase privileged access is required for buyer-pipeline recovery.");
  }

  const backfill = await backfillImportedBuyerCompanies({ supabase });
  const recovery = await ensureBuyerPipelineJobs({ supabase });
  const worker = await runBuyerPipelineWorker({
    supabase,
    workerId: "allrounder-admin",
  });

  return { backfill, recovery, worker };
}

async function runDiscoveryAndVerification() {
  const discovery = await runPropertyDiscoveryWithIntegrity({ trigger: "admin" });
  const verification = await runOpportunityVerification({ trigger: "admin" });
  return { discovery, verification };
}

async function runDelivery() {
  const published = await publishDueOpportunityDeliveries({
    trigger: "admin",
    sendEmail: false,
  });
  const emailDelivery = await sendPendingPremiumDeliveryEmails({ limit: 100 });
  return { published, emailDelivery };
}

async function runFullAutopilot() {
  const steps: StepResult[] = [];
  steps.push(await runStep("buyer-pipeline-recovery", runBuyerPipeline));
  steps.push(await runStep("opportunity-discovery-and-verification", runDiscoveryAndVerification));
  steps.push(await runStep("customer-shortage-recovery", () => fillCustomerShortages({ trigger: "admin" })));
  steps.push(await runStep("stale-opportunity-replacement", () => refreshStaleOpportunities({ trigger: "admin" })));
  steps.push(await runStep("customer-delivery", runDelivery));
  steps.push(await runStep("health-summary", () => getOpportunityEngineSummary()));

  const failedSteps = steps.filter((step) => !step.ok);
  return {
    ok: failedSteps.length === 0,
    status: failedSteps.length === 0 ? "healthy" : "degraded",
    failedStageCount: failedSteps.length,
    steps,
  };
}

export async function executeMarketVibeCommand(command: string) {
  const plan = classifyMarketVibeCommand(command);
  const startedAt = new Date().toISOString();

  if (plan.action === "unsupported") {
    return {
      ok: false,
      executed: false,
      action: plan.action,
      message: "This command is not connected to a real MarketVibe operation. Nothing was executed.",
      supportedCommands: supportedMarketVibeCommands,
      startedAt,
      finishedAt: new Date().toISOString(),
    };
  }

  let result: unknown;
  if (plan.action === "health") {
    result = await getOpportunityEngineSummary();
  } else if (plan.action === "autopilot") {
    result = await runFullAutopilot();
  } else if (plan.action === "buyer-pipeline") {
    result = await runBuyerPipeline();
  } else if (plan.action === "opportunity-discovery") {
    result = await runDiscoveryAndVerification();
  } else if (plan.action === "stale-replacement") {
    result = await refreshStaleOpportunities({ trigger: "admin" });
  } else {
    result = await runDelivery();
  }

  const finishedAt = new Date().toISOString();
  return {
    ok: true,
    executed: true,
    action: plan.action,
    label: plan.label,
    mutatesData: plan.mutatesData,
    sendsEmail: plan.sendsEmail,
    startedAt,
    finishedAt,
    durationMs: Date.parse(finishedAt) - Date.parse(startedAt),
    result,
  };
}
