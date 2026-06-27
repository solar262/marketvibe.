export default function TermsPage() {
  return <Policy title="Terms" body="Use MarketVibe Pro responsibly. Product availability, supplier timing, and taxes may vary. Operators are responsible for accurate product information, fulfillment, and customer support." />;
}

function Policy({ title, body }: { title: string; body: string }) {
  return <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8"><h1 className="text-3xl font-semibold text-stone-950">{title}</h1><p className="mt-5 leading-7 text-stone-700">{body}</p></main>;
}
