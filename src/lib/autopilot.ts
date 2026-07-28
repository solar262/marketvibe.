import { normalizeCustomSearchTerm } from "./custom-search";
import { searchLiveLeads, normalizeLeadSearchInput } from "./lead-engine";
import { persistLeadSearch } from "./lead-persistence";
import { supabaseConnectionStatus } from "./supabase";
import type { BusinessLead, LeadSearchInput } from "./types";

export const autopilotMarkets: LeadSearchInput[] = [
  { country: "United Kingdom", city: "Manchester", businessType: "cafes", serviceCategory: "Web design" },
  { country: "United Kingdom", city: "Birmingham", businessType: "salons", serviceCategory: "Booking systems" },
  { country: "Ireland", city: "Dublin", businessType: "restaurants", serviceCategory: "SEO" },
  { country: "Germany", city: "Berlin", businessType: "dentists", serviceCategory: "Local presence" },
  { country: "United States", city: "Austin", businessType: "gyms", serviceCategory: "Reviews" },
  { country: "United Kingdom", city: "London", businessType: "plumbers", serviceCategory: "Web design" },
  { country: "United Kingdom", city: "Leeds", businessType: "roofers", serviceCategory: "SEO" },
  { country: "United Kingdom", city: "Glasgow", businessType: "barbers", serviceCategory: "Booking systems" },
  { country: "United Kingdom", city: "Liverpool", businessType: "restaurants", serviceCategory: "Local presence" },
  { country: "United Kingdom", city: "Bristol", businessType: "cleaners", serviceCategory: "Google profile" },
  { country: "Germany", city: "Hamburg", businessType: "plumbers", serviceCategory: "Web design" },
  { country: "Germany", city: "Munich", businessType: "dentists", serviceCategory: "Local presence" },
  { country: "Germany", city: "Cologne", businessType: "gyms", serviceCategory: "Reviews" },
  { country: "France", city: "Paris", businessType: "salons", serviceCategory: "Booking systems" },
  { country: "France", city: "Lyon", businessType: "restaurants", serviceCategory: "SEO" },
  { country: "Spain", city: "Madrid", businessType: "dentists", serviceCategory: "Local presence" },
  { country: "Spain", city: "Barcelona", businessType: "gyms", serviceCategory: "Reviews" },
  { country: "United States", city: "New York", businessType: "salons", serviceCategory: "Booking systems" },
  { country: "United States", city: "Chicago", businessType: "dentists", serviceCategory: "Web design" },
  { country: "United States", city: "Miami", businessType: "restaurants", serviceCategory: "SEO" },
  { country: "United States", city: "Los Angeles", businessType: "gyms", serviceCategory: "Reviews" },
  { country: "United States", city: "Seattle", businessType: "cleaners", serviceCategory: "Google profile" },
  { country: "United States", city: "Boston", businessType: "roofers", serviceCategory: "Web design" },
  { country: "United States", city: "San Diego", businessType: "cafes", serviceCategory: "Local presence" },
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

function rotatingMarkets(count: number) {
  const safeCount = Math.max(1, Math.min(Math.floor(count), autopilotMarkets.length));
  const dayNumber = Math.floor(Date.now() / 86_400_000);
  const start = (dayNumber * safeCount) % autopilotMarkets.length;
  return Array.from({ length: safeCount }, (_, index) => autopilotMarkets[(start + index) % autopilotMarkets.length]);
}

export function autopilotStatus() {
  const supabase = supabaseConnectionStatus();
  return {
    enabled: true,
    automaticEmailSendingEnabled: true,
    marketsInRotation: autopilotMarkets,
    cronEndpoint: "/api/cron/lead-hunt",
    supabase,
  };
}

async function huntMarket(market: LeadSearchInput, leadLimit: number): Promise<LeadHuntResult> {
  try {
    const live = await searchLiveLeads(market, leadLimit);
    if (live.leads.length === 0) {
      return {
        market,
        sourceStatus: "live",
        sourceNote: `${live.sourceNote} No qualified public-email leads were found in this market during this run.`,
        saved: true,
        leads: [],
      };
    }

    const persistence = await persistLeadSearch({
      input: market,
      leads: live.leads,
      sourceStatus: "live",
      sourceNote: live.sourceNote,
      sourceUrl: live.sourceUrl,
    });

    return {
      market,
      sourceStatus: "live",
      sourceNote: live.sourceNote,
      saved: persistence.saved,
      savedSearchRunId: persistence.searchRunId,
      error: persistence.error,
      leads: live.leads,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown live lead hunt error.";
    return {
      market,
      sourceStatus: "live",
      sourceNote: "The live public lead hunt failed for this market. No demo or invented leads were saved.",
      saved: false,
      error: message,
      leads: [],
    };
  }
}

export async function runLeadHunt({ markets = 4, leads = 8, customSearchTerm = "" }: { markets?: number; leads?: number; customSearchTerm?: string }): Promise<LeadHuntResult[]> {
  const customTerm = normalizeCustomSearchTerm(customSearchTerm);
  const selectedMarkets = rotatingMarkets(markets)
    .map((market) => customTerm ? normalizeLeadSearchInput({ ...market, customSearchTerm: customTerm }) : market);
  const leadLimit = Math.max(1, Math.min(leads, 8));
  const results: LeadHuntResult[] = [];
  const concurrency = 3;

  for (let index = 0; index < selectedMarkets.length; index += concurrency) {
    const batch = selectedMarkets.slice(index, index + concurrency);
    results.push(...await Promise.all(batch.map((market) => huntMarket(market, leadLimit))));
  }

  return results;
}
