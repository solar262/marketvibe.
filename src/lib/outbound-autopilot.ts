import { discoverBuyerProspects } from "@/lib/buyer-hunt";
import type { LeadSearchInput, BusinessLead } from "@/lib/types";
import {
  approveOutboundLead,
  createOutboundSalesProspect,
  queueColdOutboundForLead,
  salesOutboundConfig,
} from "@/lib/sales-pipeline";

export const outboundAutopilotMarkets: LeadSearchInput[] = [
  { country: "United Kingdom", city: "London", businessType: "digital marketing agencies", serviceCategory: "MarketVibe Proof Pack" },
  { country: "United Kingdom", city: "Manchester", businessType: "automation agencies", serviceCategory: "MarketVibe Proof Pack" },
  { country: "United Kingdom", city: "Birmingham", businessType: "data consultancies", serviceCategory: "MarketVibe Proof Pack" },
  { country: "United Kingdom", city: "Leeds", businessType: "RevOps consultants", serviceCategory: "MarketVibe Proof Pack" },
  { country: "United Kingdom", city: "Bristol", businessType: "AI consultants", serviceCategory: "MarketVibe Proof Pack" },
  { country: "United Kingdom", city: "Edinburgh", businessType: "digital transformation consultancies", serviceCategory: "MarketVibe Proof Pack" },
  { country: "United Kingdom", city: "Glasgow", businessType: "CRM consultants", serviceCategory: "MarketVibe Proof Pack" },
  { country: "United Kingdom", city: "Liverpool", businessType: "growth agencies", serviceCategory: "MarketVibe Proof Pack" },
  { country: "United Kingdom", city: "Newcastle", businessType: "B2B marketing agencies", serviceCategory: "MarketVibe Proof Pack" },
  { country: "United Kingdom", city: "Nottingham", businessType: "web development agencies", serviceCategory: "MarketVibe Proof Pack" },
  { country: "United Kingdom", city: "Sheffield", businessType: "data analytics consultants", serviceCategory: "MarketVibe Proof Pack" },
  { country: "United Kingdom", city: "Cambridge", businessType: "technology consultancies", serviceCategory: "MarketVibe Proof Pack" },
  { country: "United States", city: "New York", businessType: "RevOps consultants", serviceCategory: "MarketVibe Proof Pack" },
  { country: "United States", city: "Austin", businessType: "AI consultants", serviceCategory: "MarketVibe Proof Pack" },
  { country: "United States", city: "Chicago", businessType: "growth consultants", serviceCategory: "MarketVibe Proof Pack" },
  { country: "United States", city: "San Francisco", businessType: "automation agencies", serviceCategory: "MarketVibe Proof Pack" },
  { country: "United States", city: "Boston", businessType: "data consultancies", serviceCategory: "MarketVibe Proof Pack" },
  { country: "United States", city: "Seattle", businessType: "B2B SaaS consultants", serviceCategory: "MarketVibe Proof Pack" },
  { country: "United States", city: "Denver", businessType: "CRM consultants", serviceCategory: "MarketVibe Proof Pack" },
  { country: "United States", city: "Atlanta", businessType: "demand generation agencies", serviceCategory: "MarketVibe Proof Pack" },
  { country: "United States", city: "Miami", businessType: "growth agencies", serviceCategory: "MarketVibe Proof Pack" },
  { country: "United States", city: "Dallas", businessType: "cybersecurity consultants", serviceCategory: "MarketVibe Proof Pack" },
  { country: "United States", city: "Los Angeles", businessType: "B2B marketing agencies", serviceCategory: "MarketVibe Proof Pack" },
  { country: "United States", city: "Philadelphia", businessType: "executive recruitment firms", serviceCategory: "MarketVibe Proof Pack" },
  { country: "United States", city: "Phoenix", businessType: "workflow automation consultants", serviceCategory: "MarketVibe Proof Pack" },
];

function autopilotEnabled() {
  return process.env.SALES_OUTBOUND_AUTOPILOT_ENABLED === "true";
}

function marketLimit() {
  const parsed = Number(process.env.SALES_OUTBOUND_AUTOPILOT_MARKETS || "5");
  return Number.isFinite(parsed) ? Math.max(1, Math.min(Math.round(parsed), outboundAutopilotMarkets.length)) : 5;
}

function leadsPerMarket() {
  const parsed = Number(process.env.SALES_OUTBOUND_AUTOPILOT_LEADS_PER_MARKET || "10");
  return Number.isFinite(parsed) ? Math.max(1, Math.min(Math.round(parsed), 10)) : 10;
}

function queueLimit() {
  const parsed = Number(process.env.SALES_OUTBOUND_AUTOPILOT_QUEUE_LIMIT || "250");
  return Number.isFinite(parsed) ? Math.max(0, Math.min(Math.round(parsed), 300)) : 250;
}

function marketRotationOffset(limit: number) {
  const explicitRaw = process.env.SALES_OUTBOUND_AUTOPILOT_MARKET_OFFSET?.trim();
  const explicit = Number(explicitRaw || Number.NaN);
  if (explicitRaw && Number.isFinite(explicit)) return Math.max(0, Math.floor(explicit)) % outboundAutopilotMarkets.length;
  const now = new Date();
  const day = Math.floor(now.getTime() / 86400000);
  const slot = Math.floor(now.getUTCHours() / 2);
  return (day * Math.max(1, limit) + slot * Math.max(1, limit)) % outboundAutopilotMarkets.length;
}

function rotatedMarkets(limit: number, offset = marketRotationOffset(limit)) {
  const size = Math.max(1, Math.min(limit, outboundAutopilotMarkets.length));
  return Array.from({ length: size }, (_, index) => outboundAutopilotMarkets[(offset + index) % outboundAutopilotMarkets.length]);
}

function sourceEvidence(lead: BusinessLead) {
  const issue = lead.audit.issues[0] || lead.audit.summary || "Public business listing and website show relevant service-market fit.";
  return `${lead.businessName} appears to be a potential MarketVibe buyer from public business data in ${lead.city}, ${lead.country}. ${issue}`;
}

function prospectPayload(lead: BusinessLead) {
  return {
    email: lead.publicEmail,
    name: lead.businessName,
    companyName: lead.businessName,
    website: lead.website,
    country: lead.country,
    sourceUrl: lead.sourceUrl || lead.contactPageUrl || lead.website,
    sourceEvidence: sourceEvidence(lead),
    targetIndustry: "Specialist consultants, boutique agencies, AI, automation, data, RevOps, growth and marketing service sellers",
    companySize: "2-15",
    serviceOffered: "MarketVibe Proof Pack and recurring Radar opportunity intelligence",
    averageClientValue: 5000,
    weeklyOutreachCapacity: 10,
    currentLeadGenerationMethod: "Public website, local listing, LinkedIn, CRM, manual prospecting, or cold email",
    metadata: {
      source: "outbound_autopilot_public_buyer_hunt",
      leadSlug: lead.slug,
      buyerCategory: lead.businessCategory,
      auditScore: lead.audit.score,
      auditPriority: lead.audit.priority,
      sourceStatus: lead.sourceStatus,
    },
  };
}

export async function runOutboundAutopilot(options: { dryRun?: boolean; markets?: number; leadsPerMarket?: number; queue?: boolean; marketOffset?: number } = {}) {
  const config = salesOutboundConfig();
  const enabled = autopilotEnabled();
  const dryRun = Boolean(options.dryRun);
  const shouldQueue = options.queue !== false;
  const selectedMarketLimit = options.markets || marketLimit();
  const selectedMarkets = rotatedMarkets(selectedMarketLimit, options.marketOffset);
  const discovery = await discoverBuyerProspects({
    markets: selectedMarkets,
    leadsPerMarket: options.leadsPerMarket || leadsPerMarket(),
  });

  const result = {
    enabled,
    dryRun,
    sendingEnabled: config.enabled,
    markets: selectedMarkets.length,
    marketOffset: outboundAutopilotMarkets.findIndex((market) => market === selectedMarkets[0]),
    discovered: discovery.discovered.length,
    imported: 0,
    approved: 0,
    queued: 0,
    skipped: 0,
    failed: 0,
    failures: [] as Array<{ email?: string; company?: string; error: string }>,
    discoveryErrors: discovery.errors,
  };

  if (!enabled && !dryRun) {
    result.skipped = discovery.discovered.length;
    return result;
  }

  let queued = 0;
  for (const lead of discovery.discovered) {
    const email = lead.publicEmail || "";
    if (!email) {
      result.skipped += 1;
      continue;
    }

    try {
      const imported = dryRun
        ? null
        : await createOutboundSalesProspect(prospectPayload(lead));
      result.imported += dryRun ? 0 : 1;

      if (!dryRun && imported?.canQueue) {
        await approveOutboundLead(imported.lead.id, "outbound_autopilot");
        result.approved += 1;

        if (shouldQueue && queued < queueLimit()) {
          const queueResult = await queueColdOutboundForLead(imported.lead.id);
          if (queueResult.queued) {
            queued += 1;
            result.queued += queueResult.queued;
          } else {
            result.skipped += 1;
          }
        }
      } else if (!dryRun) {
        result.skipped += 1;
      }
    } catch (error) {
      result.failed += 1;
      result.failures.push({
        email,
        company: lead.businessName,
        error: error instanceof Error ? error.message : "Outbound autopilot import failed.",
      });
    }
  }

  return result;
}
