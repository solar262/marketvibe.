import {
  fillCustomerShortages,
  publishDueOpportunityDeliveries,
  runOpportunityVerification,
} from "@/lib/opportunity-engine";
import { runPropertyDiscoveryWithIntegrity } from "@/lib/property-opportunity-integrity";

type PipelineTrigger = "admin" | "cron" | "test";

function configuredOpportunityFeeds() {
  return (process.env.OPPORTUNITY_RSS_FEEDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function runOpportunityAutomationPipeline({
  trigger = "admin",
  profileId,
  publishDeliveries = false,
  sendEmail = false,
}: {
  trigger?: PipelineTrigger;
  profileId?: string;
  publishDeliveries?: boolean;
  sendEmail?: boolean;
} = {}) {
  const discovery = await runPropertyDiscoveryWithIntegrity({ trigger, profileId });
  const verification = await runOpportunityVerification({ trigger });
  const matching = await fillCustomerShortages({ trigger, profileId });
  const delivery = publishDeliveries
    ? await publishDueOpportunityDeliveries({ trigger, sendEmail })
    : null;

  const feeds = configuredOpportunityFeeds();
  const sourceSetupNeeded = discovery.records_discovered === 0 && feeds.length === 0;
  const matchedCount = matching.records_added_to_inventory;

  const message = sourceSetupNeeded
    ? "Full pipeline ran, but no qualified opportunities can be created until OPPORTUNITY_RSS_FEEDS or reviewed public opportunity imports are configured."
    : matchedCount > 0
      ? `Full pipeline ran and assigned ${matchedCount} opportunities.`
      : "Full pipeline ran. No matching opportunities were available for the active searches yet.";

  return {
    ok: true,
    trigger,
    profileId: profileId || null,
    publishDeliveries,
    sourceSetupNeeded,
    configuredSourceCount: feeds.length,
    discovery,
    verification,
    matching,
    delivery,
    message,
  };
}
