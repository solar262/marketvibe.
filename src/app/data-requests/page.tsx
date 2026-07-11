import { ContactForm } from "@/components/ContactForm";

export default function DataRequestsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-slate-950">Data Correction and Removal Request</h1>
      <p className="mt-4 leading-7 text-slate-600">
        Use this form for privacy, data correction, removal, or access questions. Include the affected email address, company name, URL/source reference, and the action requested. Operator review is required.
      </p>
      <ContactForm offer="data-request" />
    </main>
  );
}
