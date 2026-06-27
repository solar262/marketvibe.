import { LeadSearchApp } from "@/components/LeadSearchApp";
import { sampleLeads } from "@/lib/lead-engine";

export default function LeadSearchPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <LeadSearchApp initialLeads={sampleLeads.slice(0, 3)} />
    </main>
  );
}
