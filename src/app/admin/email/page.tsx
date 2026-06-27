import { MailCheck, ShieldCheck } from "lucide-react";
import { getBrevoStatus } from "@/lib/brevo";
import { adminCredentials } from "@/lib/auth";
import { EmailTestForm } from "./EmailTestForm";

export default function AdminEmailPage() {
  const status = getBrevoStatus();
  const adminEmail = adminCredentials().email;

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-sm font-semibold text-emerald-700">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Email Controls</h1>
        <p className="mt-2 max-w-2xl text-slate-600">Brevo is used for MarketVibe subscribers, free users, and paying customers only. It is not connected to scraped business outreach.</p>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          ["Brevo configured", status.configured ? "Yes" : "No"],
          ["Sender email configured", status.hasSenderEmail ? "Yes" : "No"],
          ["List ID configured", status.hasListId ? "Yes" : "No"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <MailCheck className="h-5 w-5 text-emerald-700" />
            <p className="mt-4 text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Daily send safety note</p>
            <p className="mt-1">Use Brevo only for opted-in MarketVibe users, subscribers, and customers. Do not import scraped leads or auto-send cold outreach to businesses found by the lead engine.</p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Configuration</h2>
          <div className="mt-4 grid gap-2 text-sm text-slate-700">
            <p>Admin test recipient: {adminEmail}</p>
            <p>Sender email: {status.senderEmail || "Missing"}</p>
            <p>Sender name: {status.senderName || "Missing"}</p>
            <p>MarketVibe list ID: {status.listId || "Missing"}</p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Test email</h2>
          <p className="mt-2 text-sm text-slate-600">Sends one transactional test email to the admin email only.</p>
          <div className="mt-5">
            <EmailTestForm />
          </div>
        </div>
      </section>
    </main>
  );
}

