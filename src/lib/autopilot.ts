import { generateLeads, searchLiveLeads } from "./lead-engine";
import { persistLeadSearch } from "./lead-persistence";
import { supabaseConnectionStatus } from "./supabase";
import type { BusinessLead, LeadSearchInput } from "./types";

export const autopilotMarkets: LeadSearchInput[] = [
  { country: "United Kingdom", city: "Manchester", businessType: "cafes", serviceCategory: "Web design" },
  { country: "United Kingdom", city: "Birmingham", businessType: "salons", serviceCategory: "Booking systems" },
  { country: "Ireland", city: "Dublin", businessType: "restaurants", serviceCategory: "SEO" },
  { country: "Germany", city: "Berlin", businessType: "dentists", serviceCategory: "Local presence" },
  { country: "United States", city: "Austin", businessType: "gyms", serviceCategory: "Reviews" },
];

export type LeadHuntResult = {
  market: LeadSearchInput;
  sourceStatus: "live" | "demo";
  sourceNote: string;
  saved: boolean;
  savedSearchRunId?: string;
  error?: string;
  leads: BusinessLead[];
};

export function autopilotStatus() {
  const supabase = supabaseConnectionStatus();
  return {
    enabled: true,
    automaticEmailSendingEnabled: false,
    marketsInRotation: autopilotMarkets,
    cronEndpoint: "/api/cron/lead-hunt",
    supabase,
  };
}

export async function runLeadHunt({ markets = 1, leads = 2 }: { markets?: number; leads?: number }): Promise<LeadHuntResult[]> {
  const selectedMarkets = autopilotMarkets.slice(0, Math.max(1, Math.min(markets, autopilotMarkets.length)));
  const leadLimit = Math.max(1, Math.min(leads, 8));
  const results: LeadHuntResult[] = [];

  for (const market of selectedMarkets) {
    try {
      const live = await searchLiveLeads(market, leadLimit);
      const foundLeads = live.leads.length ? live.leads : generateLeads(market, Math.min(3, leadLimit));
      const sourceStatus = live.leads.length ? "live" : "demo";
      const sourceNote = live.leads.length
        ? live.sourceNote
        : "No qualified live public leads were found for this market. Sample previews were generated instead.";
      const persistence = await persistLeadSearch({
        input: market,
        leads: foundLeads,
        sourceStatus,
        sourceNote,
        sourceUrl: live.sourceUrl,
      });

      results.push({
        market,
        sourceStatus,
        sourceNote,
        saved: persistence.saved,
        savedSearchRunId: persistence.searchRunId,
        error: persistence.error,
        leads: foundLeads,
      });
    } catch (error) {
      const fallback = generateLeads(market, Math.min(3, leadLimit));
      const message = error instanceof Error ? error.message : "Unknown lead hunt error.";
      const persistence = await persistLeadSearch({
        input: market,
        leads: fallback,
        sourceStatus: "demo",
        sourceNote: "Live public lead hunt failed. Sample previews were generated instead.",
        errorMessage: message,
      });

      results.push({
        market,
        sourceStatus: "demo",
        sourceNote: "Live public lead hunt failed. Sample previews were generated instead.",
        saved: persistence.saved,
        savedSearchRunId: persistence.searchRunId,
        error: persistence.error || message,
        leads: fallback,
      });
    }
  }

  return results;
}

