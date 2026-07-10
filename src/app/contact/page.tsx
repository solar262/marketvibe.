import { ContactForm } from "@/components/ContactForm";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ offer?: string }>;
}) {
  const { offer = "general" } = await searchParams;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-slate-950">Contact MarketVibe</h1>
      <p className="mt-2 text-slate-600">Send a message and we will get back to you.</p>
      <div className="mt-5 rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm leading-6 text-violet-950">
        Direct support email: <a className="font-semibold underline" href="mailto:hello@marketvibe1.com">hello@marketvibe1.com</a>
      </div>

      <ContactForm offer={offer} />
    </main>
  );
}
