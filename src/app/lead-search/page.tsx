import { LeadSearchApp } from "@/components/LeadSearchApp";
import { sampleLeads } from "@/lib/lead-engine";

export default function LeadSearchPage() {
  return (
    <main className="bg-[radial-gradient(circle_at_top_left,#d1fae5_0,transparent_28rem),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <LeadSearchApp initialLeads={sampleLeads.slice(0, 3)} />
      </div>
    </main>
  );
}
