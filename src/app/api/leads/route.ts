import { NextResponse } from "next/server";
import { generateLeads, normalizeLeadSearchInput, searchLiveLeads } from "@/lib/lead-engine";
import { persistLeadSearch } from "@/lib/lead-persistence";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const input = normalizeLeadSearchInput(payload);
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
    const emptyLiveNote = input.searchMode === "custom"
      ? `No qualified live public opportunities were returned for custom search seed "${input.customSearchTerm}". Sample previews are shown instead.`
      : "No qualified live public opportunities were returned for this search. Sample previews are shown instead.";
    const persistence = await persistLeadSearch({
      input,
      leads: demoLeads,
      sourceStatus: "demo",
      sourceNote: emptyLiveNote,
    });

    return NextResponse.json({
      leads: demoLeads,
      sourceStatus: "demo",
      sourceNote: emptyLiveNote,
      persistence,
    });
  } catch (error) {
    const demoLeads = generateLeads(input, 3);
    const errorMessage = error instanceof Error ? error.message : "Unknown live search error.";
    const fallbackNote = input.searchMode === "custom"
      ? `Live public search is temporarily unavailable for custom search seed "${input.customSearchTerm}". Sample previews are shown instead.`
      : "Live public search is temporarily unavailable. Sample previews are shown instead.";
    const persistence = await persistLeadSearch({
      input,
      leads: demoLeads,
      sourceStatus: "demo",
      sourceNote: fallbackNote,
      errorMessage,
    });

    return NextResponse.json({
      leads: demoLeads,
      sourceStatus: "demo",
      sourceNote: fallbackNote,
      persistence,
    });
  }
}
