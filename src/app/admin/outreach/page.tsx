import Link from "next/link";
import { AlertTriangle, Inbox, Mail, ShieldCheck, Users } from "lucide-react";
import { getOutreachStats } from "@/lib/outreach";

export default async function AdminOutreachPage() {
  const stats = await getOutreachStats();
  const config = stats.config;

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Outreach Queue</h1>
          <p className="mt-2 max-w-2xl text-slate-600">Queue compliant outreach from saved public business contacts. Sending stays disabled until a provider, sender domain, and daily limits are configured.</p>
        </div>
        <Link href="/api/admin/outreach/queue-from-leads?limit=10" className="inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
          Queue saved leads
        </Link>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <Mail className="h-5 w-5 text-emerald-700" />
          <p className="mt-4 text-sm text-slate-500">Sending</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{config.enabled ? "Enabled" : "Disabled"}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <Inbox className="h-5 w-5 text-emerald-700" />
          <p className="mt-4 text-sm text-slate-500">Pending</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{stats.counts.pending || 0}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <Users className="h-5 w-5 text-emerald-700" />
          <p className="mt-4 text-sm text-slate-500">Prospects</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{stats.counts.prospects || 0}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <ShieldCheck className="h-5 w-5 text-emerald-700" />
          <p className="mt-4 text-sm text-slate-500">Suppressed</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{stats.counts.suppressed || 0}</p>
        </div>
      </section>

      {!config.enabled && (
        <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Email sending is disabled by default.</p>
              <p className="mt-1">Configure `OUTREACH_EMAIL_PROVIDER`, provider API key, `OUTREACH_FROM_EMAIL`, `OUTREACH_DAILY_SEND_LIMIT`, and set `OUTREACH_EMAIL_ENABLED=true` only after the sender domain is ready.</p>
            </div>
          </div>
        </section>
      )}

      {stats.error && (
        <section className="mt-6 rounded-lg border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-900">
          <p className="font-semibold">Outreach storage warning</p>
          <p className="mt-1">{stats.error}</p>
        </section>
      )}

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Provider readiness</h2>
          <div className="mt-4 grid gap-2 text-sm text-slate-700">
            <p>Provider: {config.provider || "Not set"}</p>
            <p>Provider key: {config.providerReady ? "Configured" : "Missing"}</p>
            <p>Sender email: {config.fromEmail || "Missing"}</p>
            <p>Reply-to: {config.replyTo || "Missing"}</p>
            <p>Daily send limit: {config.dailyLimit}</p>
          </div>
          <Link href="/api/admin/outreach/send-queued?limit=5" className="mt-5 inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-slate-50">
            Test send queued
          </Link>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Latest queue items</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Recipient</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Subject</th>
                  <th className="py-2 pr-4">Error</th>
                </tr>
              </thead>
              <tbody>
                {stats.latest.map((item: Record<string, unknown>) => (
                  <tr key={String(item.id)} className="border-t border-slate-100">
                    <td className="py-3 pr-4">{String(item.recipient_email)}</td>
                    <td className="py-3 pr-4">{String(item.status)}</td>
                    <td className="py-3 pr-4">{String(item.subject)}</td>
                    <td className="py-3 pr-4">{String(item.error_message || "")}</td>
                  </tr>
                ))}
                {stats.latest.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-slate-500">No queued outreach yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

