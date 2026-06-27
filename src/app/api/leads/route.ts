import { NextResponse } from "next/server";
import { generateLeads, searchLiveLeads } from "@/lib/lead-engine";
import { persistLeadSearch } from "@/lib/lead-persistence";
import type { LeadSearchInput } from "@/lib/types";

export async function POST(request: Request) {
  const input = (await request.json()) as LeadSearchInput;
  try {
    const live = await searchLiveLeads(input, 8);
    if (live.leads.length > 0) {
      const persistence = await persistLeadSearch({
        input,
        leads: live.leads,
        sourceStatus: "live",
        sourceNote: live.sourceNote,
        sourceUrl: live.sourceUrl,
      });

      return NextResponse.json({ ...live, persistence });
    }

    const demoLeads = generateLeads(input, 3);
    const persistence = await persistLeadSearch({
      input,
      leads: demoLeads,
      sourceStatus: "demo",
      sourceNote: "No qualified live public opportunities were returned for this search. Sample previews are shown instead.",
    });

    return NextResponse.json({
      leads: demoLeads,
      sourceStatus: "demo",
      sourceNote: "No qualified live public opportunities were returned for this search. Sample previews are shown instead.",
      persistence,
    });
  } catch (error) {
    const demoLeads = generateLeads(input, 3);
    const errorMessage = error instanceof Error ? error.message : "Unknown live search error.";
    const persistence = await persistLeadSearch({
      input,
      leads: demoLeads,
      sourceStatus: "demo",
      sourceNote: "Live public search is temporarily unavailable. Sample previews are shown instead.",
      errorMessage,
    });

    return NextResponse.json({
      leads: demoLeads,
      sourceStatus: "demo",
      sourceNote: "Live public search is temporarily unavailable. Sample previews are shown instead.",
      persistence,
    });
  }
}
