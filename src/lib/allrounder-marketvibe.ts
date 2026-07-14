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

export type AllRounderAction =
  | "health"
  | "autopilot"
  | "buyer-pipeline"
  | "opportunity-discovery"
  | "stale-replacement"
  | "delivery"
  | "unsupported";

export type AllRounderCommandPlan = {
  action: AllRounderAction;
  label: string;
  mutatesData: boolean;
  sendsEmail: boolean;
  requiresApproval: boolean;
};

type StepResult = {
  name: string;
  ok: boolean;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  result?: unknown;
  error?: string;
};

export const supportedMarketVibeCommands = [
  "Show live health",
  "Run full autopilot",
  "Recover buyer pipeline",
  "Find and verify opportunities",
  "Replace stale opportunities",
  "Publish due deliveries",
] as const;

export function classifyMarketVibeCommand(command: string): AllRounderCommandPlan {
  const normalized = command.trim().toLowerCase();

  if (!normalized) {
    return {
      action: "unsupported",
      label: "Empty command",
      mutatesData: false,
      sendsEmail: false,
      requiresApproval: false,
    };
  }

  if (/(health|status|summary|what needs attention|check operations)/.test(normalized)) {
    return {
      action: "health",
      label: "Read live MarketVibe health",
      mutatesData: false,
      sendsEmail: false,
      requiresApproval: false,
    };
  }

  if (/(full autopilot|run autopilot|run all operations|recover everything)/.test(normalized)) {
    return {
      action: "autopilot",
      label: "Run the complete MarketVibe recovery loop",
      mutatesData: true,
      sendsEmail: true,
      requiresApproval: true,
    };
  }

  if (/(buyer pipeline|recover buyers|process buyers|buyer recovery)/.test(normalized)) {
    return {
      action: "buyer-pipeline",
      label: "Recover and process the buyer pipeline",
      mutatesData: true,
      sendsEmail: false,
      requiresApproval: true,
    };
  }

  if (/(find opportunities|discover opportunities|verify opportunities|opportunity discovery)/.test(normalized)) {
    return {
      action: "opportunity-discovery",
      label: "Discover and verify opportunities",
      mutatesData: true,
      sendsEmail: false,
      requiresApproval: true,
    };
  }

  if (/(replace stale|stale opportunities|refresh stale|replacement)/.test(normalized)) {
    return {
      action: "stale-replacement",
      label: "Replace stale opportunities",
      mutatesData: true,
      sendsEmail: false,
      requiresApproval: true,
    };
  }

  if (/(publish due|deliveries|send pending|delivery emails|publish deliveries)/.test(normalized)) {
    return {
      action: "delivery",
      label: "Publish due deliveries and send pending delivery emails",
      mutatesData: true,
      sendsEmail: true,
      requiresApproval: true,
    };
  }

  return {
    action: "unsupported",
    label: "Unsupported command",
    mutatesData: false,
    sendsEmail: false,
    requiresApproval: false,
  };
}

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
