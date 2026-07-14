import { discoverBuyerProspects } from "@/lib/buyer-hunt";
import { listInventory } from "@/lib/opportunity-engine";
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


type OpportunityRow = Record<string, unknown>;

function opportunityField(
  row: OpportunityRow,
  keys: string[],
) {
  const containers: OpportunityRow[] = [row];

  for (const nestedKey of [
    "raw_payload",
    "metadata",
    "source_metadata",
  ]) {
    const nested = row[nestedKey];

    if (
      nested &&
      typeof nested === "object" &&
      !Array.isArray(nested)
    ) {
      containers.push(nested as OpportunityRow);
    }
  }

  for (const container of containers) {
    for (const key of keys) {
      const value = container[key];

      if (typeof value === "string" && value.trim()) {
        return value.replace(/\s+/g, " ").trim();
      }
    }
  }

  return "";
}

function opportunitySignal(row: OpportunityRow) {
  return opportunityField(row, [
    "public_signal_text",
    "signal_text",
    "signal_summary",
    "source_evidence",
    "evidence_summary",
    "opportunity_summary",
    "problem_summary",
    "pain_point",
    "summary",
    "description",
  ]);
}

function opportunitySourceUrl(row: OpportunityRow) {
  return opportunityField(row, [
    "source_url",
    "public_source_url",
    "evidence_url",
    "original_url",
    "source_link",
    "url",
  ]);
}

function opportunityMarket(row: OpportunityRow) {
  return opportunityField(row, [
    "niche",
    "company_industry",
    "target_industry",
    "problem_type",
    "company_category",
  ]);
}

function opportunityId(row: OpportunityRow) {
  return (
    opportunityField(row, ["id"]) ||
    opportunitySourceUrl(row)
  );
}

function usableQualifiedOpportunity(row: OpportunityRow) {
  const evidenceStatus = opportunityField(row, [
    "evidence_status",
  ]).toLowerCase();

  const reviewStatus = opportunityField(row, [
    "review_status",
  ]).toLowerCase();

  if (
    evidenceStatus === "profile_only" ||
    evidenceStatus === "unverified" ||
    evidenceStatus === "discovered"
  ) {
    return false;
  }

  if (reviewStatus === "rejected") {
    return false;
  }

  return Boolean(
    opportunitySignal(row) &&
    opportunitySourceUrl(row),
  );
}

const matchingStopWords = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "your",
  "their",
  "public",
  "source",
  "signal",
  "business",
  "company",
  "market",
  "marketvibe",
  "buyer",
  "buyers",
  "prospect",
  "potential",
  "specialist",
  "service",
  "services",
  "seller",
  "team",
  "need",
  "needs",
  "agency",
  "agencies",
  "consultant",
  "consultants",
  "consulting",
  "opportunity",
  "opportunities",
  "website",
  "relevant",
]);

function matchingTokens(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter(
        (token) =>
          token.length >= 3 &&
          !matchingStopWords.has(token),
      ),
  );
}

function prospectServiceText(lead: BusinessLead) {
  return [
    lead.businessName,
    lead.businessCategory,
    lead.audit.summary,
    ...(lead.audit.issues || []),
    ...(lead.audit.findings || []).map(
      (finding) =>
        `${finding.label} ${finding.detail}`,
    ),
  ]
    .filter(Boolean)
    .join(" ");
}

function opportunityMatchesLead(
  opportunity: OpportunityRow,
  lead: BusinessLead,
) {
  const prospectTokens = matchingTokens(
    prospectServiceText(lead),
  );

  const opportunityTokens = matchingTokens(
    `${opportunityMarket(opportunity)} ${opportunitySignal(
      opportunity,
    )}`,
  );

  return Array.from(prospectTokens).some((token) =>
    opportunityTokens.has(token),
  );
}

function sourceEvidence(opportunity: OpportunityRow) {
  const signal = opportunitySignal(opportunity);
  const market = opportunityMarket(opportunity);

  return market
    ? `${signal} Market: ${market}.`
    : signal;
}

function prospectPayload(
  lead: BusinessLead,
  opportunity: OpportunityRow,
) {
  const targetMarket =
    opportunityMarket(opportunity) ||
    "Qualified buyer-intent market";

  return {
    email: lead.publicEmail,
    name: lead.businessName,
    companyName: lead.businessName,
    website: lead.website,
    country: lead.country,
    sourceUrl: opportunitySourceUrl(opportunity),
    sourceEvidence: sourceEvidence(opportunity),
    targetIndustry: targetMarket,
    companySize: "2-15",
    serviceOffered:
      "MarketVibe Proof Pack, Radar and Growth Desk buyer-intent intelligence",
    averageClientValue: 5000,
    weeklyOutreachCapacity: 10,
    currentLeadGenerationMethod:
      "Referrals, LinkedIn, CRM, manual prospecting, public research, or cold outreach",
    metadata: {
      source:
        "outbound_autopilot_qualified_opportunity_inventory",
      prospectLeadSlug: lead.slug,
      prospectSourceUrl:
        lead.sourceUrl ||
        lead.contactPageUrl ||
        lead.website,
      opportunityId: opportunityId(opportunity),
      opportunityInventoryStatus: opportunityField(
        opportunity,
        ["inventory_status"],
      ),
      opportunityEvidenceStatus: opportunityField(
        opportunity,
        ["evidence_status"],
      ),
      opportunityReviewStatus: opportunityField(
        opportunity,
        ["review_status"],
      ),
      auditScore: lead.audit.score,
      auditPriority: lead.audit.priority,
    },
  };
}

export async function runOutboundAutopilot(
  options: {
    dryRun?: boolean;
    markets?: number;
    leadsPerMarket?: number;
    queue?: boolean;
    marketOffset?: number;
  } = {},
) {
  const config = salesOutboundConfig();
  const enabled = autopilotEnabled();
  const dryRun = Boolean(options.dryRun);
  const shouldQueue = options.queue !== false;
  const selectedMarketLimit =
    options.markets || marketLimit();

  const selectedMarkets = rotatedMarkets(
    selectedMarketLimit,
    options.marketOffset,
  );

  let qualifiedSignals: OpportunityRow[] = [];
  let inventoryError = "";

  try {
    qualifiedSignals = (
      (await listInventory({
        status: "IN_INVENTORY",
      })) as OpportunityRow[]
    ).filter(usableQualifiedOpportunity);
  } catch (error) {
    inventoryError =
      error instanceof Error
        ? error.message
        : "Qualified opportunity inventory could not be loaded.";
  }

  const result = {
    enabled,
    dryRun,
    sendingEnabled: config.enabled,
    markets: selectedMarkets.length,
    marketOffset: outboundAutopilotMarkets.findIndex(
      (market) => market === selectedMarkets[0],
    ),
    qualifiedSignals: qualifiedSignals.length,
    discovered: 0,
    matched: 0,
    imported: 0,
    approved: 0,
    queued: 0,
    skipped: 0,
    failed: 0,
    inventoryError,
    failures: [] as Array<{
      email?: string;
      company?: string;
      error: string;
    }>,
    discoveryErrors: [] as Array<{
      market: LeadSearchInput;
      error: string;
    }>,
  };

  /*
   * Generic company details alone must never enter
   * automated outreach. A qualified MarketVibe
   * opportunity with a real signal and source is required.
   */
  if (!qualifiedSignals.length) {
    return result;
  }

  const discovery = await discoverBuyerProspects({
    markets: selectedMarkets,
    leadsPerMarket:
      options.leadsPerMarket || leadsPerMarket(),
  });

  result.discovered = discovery.discovered.length;
  result.discoveryErrors = discovery.errors;

  if (!enabled && !dryRun) {
    result.skipped = discovery.discovered.length;
    return result;
  }

  const usedOpportunityIds = new Set<string>();
  let queued = 0;

  for (const lead of discovery.discovered) {
    const email = lead.publicEmail || "";

    if (!email) {
      result.skipped += 1;
      continue;
    }

    const opportunity = qualifiedSignals.find((item) => {
      const id = opportunityId(item);

      return (
        id &&
        !usedOpportunityIds.has(id) &&
        opportunityMatchesLead(item, lead)
      );
    });

    if (!opportunity) {
      result.skipped += 1;
      continue;
    }

    usedOpportunityIds.add(opportunityId(opportunity));
    result.matched += 1;

    try {
      const imported = dryRun
        ? null
        : await createOutboundSalesProspect(
            prospectPayload(lead, opportunity),
          );

      result.imported += dryRun ? 0 : 1;

      if (!dryRun && imported?.canQueue) {
        await approveOutboundLead(
          imported.lead.id,
          "outbound_autopilot_qualified_signal",
        );

        result.approved += 1;

        if (shouldQueue && queued < queueLimit()) {
          const queueResult =
            await queueColdOutboundForLead(
              imported.lead.id,
            );

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
        error:
          error instanceof Error
            ? error.message
            : "Outbound autopilot import failed.",
      });
    }
  }

  return result;
}

