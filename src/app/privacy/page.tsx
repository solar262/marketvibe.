const sections = [
  {
    title: "Who we are",
    body: "MarketVibe Lead Engine helps service sellers find public business opportunities, create audit previews, and manage access to paid reports and lead tools.",
  },
  {
    title: "Information we collect",
    body: "We may collect your name, email address, company or service interest, city or market search preferences, form submissions, support messages, checkout status, and basic website analytics such as pages visited and referral source.",
  },
  {
    title: "How we use information",
    body: "We use this information to provide the MarketVibe service, send requested lead previews, process purchases, deliver paid access, respond to support requests, improve the website, prevent misuse, and understand which pages and features are working.",
  },
  {
    title: "Payments",
    body: "Payments are handled by Stripe. MarketVibe does not store full card numbers. Stripe may process payment details, billing information, fraud checks, invoices, and subscription status according to its own privacy and security policies.",
  },
  {
    title: "Email and marketing",
    body: "If you submit your email address, we may send service emails, requested lead previews, payment/access emails, and relevant MarketVibe follow-up messages. You can unsubscribe from marketing emails where an unsubscribe option is provided, or contact us to request removal.",
  },
  {
    title: "Public business data",
    body: "MarketVibe may display or process publicly visible business information such as business names, websites, public contact pages, generic business emails, phone numbers, social links, and visible website signals. This is used to create lead previews and audit-style reports for users.",
  },
  {
    title: "Analytics and cookies",
    body: "We use analytics tools, including Vercel Analytics, to understand visits, page views, button clicks, checkout referrals, and general performance. Your browser may also use cookies or similar technology for login, checkout, security, and site functionality.",
  },
  {
    title: "Service providers",
    body: "We may use trusted providers such as Vercel for hosting and analytics, Stripe for payments, Brevo for email delivery and contact management, Supabase or similar database providers for storage, and other tools needed to operate the service.",
  },
  {
    title: "Data retention",
    body: "We keep information only for as long as needed to provide the service, maintain business records, support customers, prevent misuse, meet legal or tax obligations, and improve MarketVibe. Some records may be kept longer where required for accounting, security, or dispute handling.",
  },
  {
    title: "Your choices",
    body: "You can request access, correction, deletion, or removal from marketing where applicable. Some information may need to be retained for legal, payment, tax, fraud-prevention, or security reasons.",
  },
  {
    title: "Contact",
    body: "For privacy questions or data requests, contact MarketVibe through the Contact page or email hello@marketvibe1.com.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#f8fafc_100%)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 sm:p-8">
        <p className="text-sm font-semibold text-emerald-700">MarketVibe Lead Engine</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Privacy Policy</h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: June 2026</p>
        <p className="mt-6 leading-7 text-slate-700">
          This Privacy Policy explains how MarketVibe collects, uses, and protects information when you visit the website,
          request lead previews, use the lead search tools, contact support, or purchase access.
        </p>
      </div>

      <section className="mx-auto mt-6 grid max-w-3xl gap-4">
        {sections.map((section) => (
          <div key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-950/5">
            <h2 className="text-lg font-semibold text-slate-950">{section.title}</h2>
            <p className="mt-2 leading-7 text-slate-700">{section.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
