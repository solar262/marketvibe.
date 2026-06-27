import Link from "next/link";
import { Gauge, MailWarning, Search, Settings, ShieldCheck } from "lucide-react";
import { leadSettings, sampleLeads } from "@/lib/lead-engine";

export default function AdminDashboard() {
  const averageScore = Math.round(sampleLeads.reduce((sum, lead) => sum + lead.audit.score, 0) / sampleLeads.length);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-semibold text-slate-950">Admin Dashboard</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Sample leads", String(sampleLeads.length), Search],
          ["Average score", String(averageScore), Gauge],
          ["Daily send limit", String(leadSettings.dailySendLimit), MailWarning],
          ["Sending", leadSettings.emailSendingEnabled ? "On" : "Off", ShieldCheck],
        ].map(([label, value, Icon]) => (
          <div key={label as string} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <Icon className="h-5 w-5 text-emerald-700" />
            <p className="mt-4 text-sm text-slate-500">{label as string}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{value as string}</p>
          </div>
        ))}
      </div>
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-950">Lead Engine Controls</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Manage prices, monthly limits, allowed countries, allowed business categories, and email sending safety defaults.</p>
        <Link href="/admin/settings" className="mt-5 inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
          <Settings className="h-4 w-4" /> Open settings
        </Link>
      </section>
    </main>
  );
}
