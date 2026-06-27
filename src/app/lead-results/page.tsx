import { LeadSearchApp } from "@/components/LeadSearchApp";
import { sampleLeads } from "@/lib/lead-engine";
import { getLatestSavedLeads } from "@/lib/lead-persistence";

export default async function LeadResultsPage() {
  const savedLeads = await getLatestSavedLeads(10);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <LeadSearchApp initialLeads={savedLeads.length ? savedLeads : sampleLeads} />
    </main>
  );
}
