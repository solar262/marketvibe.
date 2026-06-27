import { generateLeads, searchLiveLeads } from "./lead-engine";
import { getLatestSavedLeads, persistLeadSearch } from "./lead-persistence";
import type { BusinessLead, LeadSearchInput } from "./types";

export type AutopilotMarket = LeadSearchInput & {
  label: string;
  buyerAngle: string;
};

export const autopilotMarkets: AutopilotMarket[] = [
  {
    label: "Manchester salon web design leads",
    country: "United Kingdom",
    city: "Manchester",
    businessType: "salons",
    serviceCategory: "Web design",
    buyerAngle: "Useful for web designers who want beauty and salon businesses with weak conversion signals.",
  },
  {
    label: "London dentist SEO leads",
    country: "United Kingdom",
    city: "London",
    businessType: "dentists",
    serviceCategory: "SEO",
    buyerAngle: "Useful for SEO freelancers looking for local businesses with metadata, review, and contact visibility gaps.",
  },
  {
    label: "Birmingham restaurant booking leads",
    country: "United Kingdom",
    city: "Birmingham",
    businessType: "restaurants",
    serviceCategory: "Booking systems",
    buyerAngle: "Useful for service sellers who install booking, reservation, and conversion improvements.",
  },
  {
    label: "Liverpool cafe social media leads",
    country: "United Kingdom",
    city: "Liverpool",
    businessType: "cafes",
    serviceCategory: "Social media",
    buyerAngle: "Useful for social media managers looking for local venues with weak trust or social proof signals.",
  },
  {
    label: "Leeds plumber local presence leads",
    country: "United Kingdom",
    city: "Leeds",
    businessType: "plumbers",
    serviceCategory: "Local presence",
    buyerAngle: "Useful for local marketing sellers who want trade businesses with website and contact issues.",
  },
  {
    label: "Bristol gym review leads",
    country: "United Kingdom",
    city: "Bristol",
    businessType: "gyms",
    serviceCategory: "Reviews",
    buyerAngle: "Useful for review, reputation, and conversion service offers.",
  },
];

export const leadPackConfigs = [
  {
    title: "Web Design Leads",
    description: "Businesses with website conversion, CTA, mobile, speed, and contact visibility opportunities.",
    input: autopilotMarkets[0],
  },
  {
    title: "SEO Leads",
    description: "Businesses with weak titles, missing descriptions, poor local search signals, and low trust proof.",
    input: autopilotMarkets[1],
  },
  {
    title: "Booking & CTA Leads",
    description: "Businesses where customers may need to hunt for booking, quote, appointment, or contact routes.",
    input: autopilotMarkets[2],
  },
  {
    title: "Social Proof Leads",
    description: "Businesses with weak review, social, or testimonial visibility that agencies can turn into a service offer.",
    input: autopilotMarkets[3],
  },
];

function marketKey(input: LeadSearchInput) {
  return `${input.country}:${input.city}:${input.businessType}:${input.serviceCategory}`.toLowerCase();
}

function selectMarkets(maxMarkets: number) {
  const safeMax = Math.max(1, Math.min(maxMarkets, autopilotMarkets.length));
  const windowIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 6));
  const start = windowIndex % autopilotMarkets.length;
  return Array.from({ length: safeMax }, (_, index) => autopilotMarkets[(start + index) % autopilotMarkets.length]);
}

export async function runAutopilotLeadHunt({
  maxMarkets = 2,
  maxLeadsPerMarket = 4,
}: {
  maxMarkets?: number;
  maxLeadsPerMarket?: number;
} = {}) {
  const markets = selectMarkets(maxMarkets);
  const startedAt = new Date().toISOString();
  const runs = [] as Array<{
    market: AutopilotMarket;
    sourceStatus: "live" | "demo";
    resultCount: number;
    saved: boolean;
    error?: string;
  }>;

  for (const market of markets) {
    try {
      const live = await searchLiveLeads(market, maxLeadsPerMarket);
      const leads = live.leads.length ? live.leads : generateLeads(market, Math.min(3, maxLeadsPerMarket));
      const sourceStatus = live.leads.length ? "live" : "demo";
      const sourceNote = live.leads.length
        ? live.sourceNote
        : "DEMO: Autopilot found no live public businesses with listed websites and contact details for this run.";

      const persistence = await persistLeadSearch({
        input: market,
        leads,
        sourceStatus,
        sourceNote,
        sourceUrl: live.sourceUrl,
      });

      runs.push({
        market,
        sourceStatus,
        resultCount: leads.length,
        saved: persistence.saved,
        error: persistence.error,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown autopilot lead hunt error.";
      const leads = generateLeads(market, Math.min(3, maxLeadsPerMarket));
      const persistence = await persistLeadSearch({
        input: market,
        leads,
        sourceStatus: "demo",
        sourceNote: "DEMO: Autopilot live source failed, so fallback sample leads were generated.",
        errorMessage,
      });

      runs.push({
        market,
        sourceStatus: "demo",
        resultCount: leads.length,
        saved: persistence.saved,
        error: persistence.error || errorMessage,
      });
    }
  }

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    marketsChecked: runs.length,
    totalResults: runs.reduce((sum, run) => sum + run.resultCount, 0),
    savedRuns: runs.filter((run) => run.saved).length,
    runs,
  };
}

export async function buildLeadPacks() {
  const savedLeads = await getLatestSavedLeads(24);
  const packs = leadPackConfigs.map((pack) => {
    const generated = generateLeads(pack.input, 3);
    const relevantSaved = savedLeads.filter((lead) => marketKey({
      country: lead.country,
      city: lead.city,
      businessType: lead.businessCategory,
      serviceCategory: pack.input.serviceCategory,
    }) === marketKey(pack.input));

    const leads: BusinessLead[] = (relevantSaved.length ? relevantSaved : generated).slice(0, 3);

    return {
      ...pack,
      leads,
      sourceLabel: relevantSaved.length ? "Saved live/scheduled leads" : "Sample pack preview",
    };
  });

  return packs;
}
