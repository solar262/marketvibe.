"use client";

import { useMemo, useState } from "react";
import { Bot, CheckCircle2, Loader2, MailPlus, Search, ShieldAlert, UploadCloud } from "lucide-react";
import type { SalesLeadListRow } from "@/lib/sales-pipeline";

type Props = {
  initialLeads: SalesLeadListRow[];
  overview: {
    config: {
      enabled: boolean;
      dailyLimit: number;
      postalAddress: string;
      allowedRegions: string[];
      missing: {
        enabledFlag: boolean;
        postalAddress: boolean;
      };
    };
    imported: number | null;
    approved: number | null;
    manualReview: number | null;
    blocked: number | null;
    queued: number | null;
  };
  filters: Record<string, string>;
};

function statusClass(status: string) {
  if (status === "approved" || status === "can_email") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "manual_review") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "blocked" || status === "do_not_email") return "border-red-200 bg-red-50 text-red-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function exampleCsv() {
  return [
    "email,name,companyName,website,country,region,sourceUrl,sourceEvidence,targetIndustry,companySize",
    "founder@exampleagency.com,Sam Founder,Example Agency,https://exampleagency.com,United Kingdom,UK,https://exampleagency.com/careers,Hiring a business development manager,AI automation consultants,2-15",
    "growth@exampleconsulting.com,Alex Growth,Example Consulting,https://exampleconsulting.com,United States,US,https://exampleconsulting.com/services,Launched a new RevOps service page,RevOps consultants,2-15",
  ].join("\n");
}

export function OutboundSalesAdmin({ initialLeads, overview, filters }: Props) {
  const [leads] = useState(initialLeads);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [autopilotMessage, setAutopilotMessage] = useState("");
  const [autopilotError, setAutopilotError] = useState("");
  const [dryRunPassed, setDryRunPassed] = useState(false);

  const selectedIds = useMemo(() => Object.entries(selected).filter(([, checked]) => checked).map(([id]) => id), [selected]);

  async function requestJson(url: string, init?: RequestInit) {
    const response = await fetch(url, init);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Request failed.");
    return data;
  }

  async function importCsv() {
    setBusy("import");
    setError("");
    setMessage("");
    try {
      const data = await requestJson("/api/admin/outbound/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      setMessage(`Imported ${data.imported} prospects. ${data.rejected} rejected.`);
      window.setTimeout(() => window.location.reload(), 900);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Import failed.");
    } finally {
      setBusy("");
    }
  }

  async function bulk(endpoint: "approve" | "queue") {
    if (selectedIds.length === 0) {
      setError("Select at least one prospect first.");
      return;
    }
    setBusy(endpoint);
    setError("");
    setMessage("");
    try {
      const data = await requestJson(`/api/admin/outbound/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      setMessage(`${endpoint === "approve" ? "Approved" : "Queued"} ${data.success} prospect${data.success === 1 ? "" : "s"}. ${data.failed} failed.`);
      window.setTimeout(() => window.location.reload(), 900);
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : "Action failed.");
    } finally {
      setBusy("");
    }
  }

  async function runAutopilot(dryRun: boolean) {
    setBusy(dryRun ? "autopilot-dry" : "autopilot");
    setAutopilotError("");
    setAutopilotMessage("");
    if (dryRun) setDryRunPassed(false);

    try {
      const response = await fetch("/api/admin/outbound/autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Autopilot failed.");

      const summary = data.autopilot || {};
      const qualifiedSignals = Number(summary.qualifiedSignals || 0);
      const discovered = Number(summary.discovered || 0);
      const matched = Number(summary.matched || 0);
      const imported = Number(summary.imported || 0);
      const approved = Number(summary.approved || 0);
      const queued = Number(summary.queued || 0);
      const failed = Number(summary.failed || 0);
      const inventoryError = String(summary.inventoryError || "").trim();

      if (inventoryError) {
        setAutopilotError(`Stopped safely: ${inventoryError}`);
        return;
      }

      if (qualifiedSignals === 0) {
        setAutopilotError("Stopped safely: no qualified buyer-intent signals are available.");
        return;
      }

      const resultText = `${dryRun ? "Dry run" : "Autopilot run"} complete — qualified signals: ${qualifiedSignals}, prospects discovered: ${discovered}, matches: ${matched}, imported: ${imported}, approved: ${approved}, queued: ${queued}, failed: ${failed}.`;
      setAutopilotMessage(resultText);

      if (dryRun) {
        setDryRunPassed(matched > 0 && failed === 0);
      } else {
        window.setTimeout(() => window.location.reload(), 1200);
      }
    } catch (autopilotRunError) {
      setAutopilotError(autopilotRunError instanceof Error ? autopilotRunError.message : "Autopilot failed.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mt-6 grid gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              {overview.config.enabled ? <CheckCircle2 className="h-5 w-5 text-emerald-700" /> : <ShieldAlert className="h-5 w-5 text-amber-700" />}
              <h2 className="font-semibold text-slate-950">Outbound sending status</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Sending is {overview.config.enabled ? "enabled" : "paused"}. Daily limit: {overview.config.dailyLimit}. Allowed regions: {overview.config.allowedRegions.join(", ")}.
            </p>
            {!overview.config.enabled && <p className="mt-1 text-sm font-semibold text-amber-800">Set SALES_OUTBOUND_ENABLED=true only after your sender domain, postal address, and suppression handling are ready.</p>}
            {overview.config.missing.postalAddress && <p className="mt-1 text-sm font-semibold text-red-800">US sending needs SALES_OUTBOUND_POSTAL_ADDRESS.</p>}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-md bg-slate-50 p-3"><p className="text-slate-500">Review</p><p className="font-semibold text-slate-950">{overview.manualReview ?? 0}</p></div>
            <div className="rounded-md bg-slate-50 p-3"><p className="text-slate-500">Blocked</p><p className="font-semibold text-slate-950">{overview.blocked ?? 0}</p></div>
            <div className="rounded-md bg-slate-50 p-3"><p className="text-slate-500">Selected</p><p className="font-semibold text-slate-950">{selectedIds.length}</p></div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-emerald-800" />
              <h2 className="font-semibold text-emerald-950">Outbound autopilot</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-emerald-900">
              Matches public UK/US B2B prospects to qualified source-backed buyer-intent signals. Nothing is imported or queued unless a valid match exists.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => runAutopilot(true)} disabled={busy === "autopilot-dry"} className="inline-flex items-center gap-2 rounded-md border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-100 disabled:opacity-60">
              {busy === "autopilot-dry" && <Loader2 className="h-4 w-4 animate-spin" />}
              Dry run
            </button>
            <button
              type="button"
              onClick={() => runAutopilot(false)}
              disabled={busy === "autopilot" || !dryRunPassed}
              title={dryRunPassed ? "Run the verified matched batch" : "Complete a successful dry run with at least one match first"}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "autopilot" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
              Run autopilot
            </button>
          </div>
        </div>

        {(autopilotMessage || autopilotError) && (
          <div className={`mt-4 rounded-md border p-3 text-sm font-semibold ${autopilotError ? "border-red-200 bg-red-50 text-red-900" : "border-emerald-300 bg-white text-emerald-950"}`}>
            {autopilotError || autopilotMessage}
          </div>
        )}

        {!dryRunPassed && !autopilotMessage && !autopilotError && (
          <p className="mt-3 text-xs font-medium text-emerald-800">Run autopilot stays locked until a Dry run confirms at least one safe match.</p>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <UploadCloud className="h-5 w-5 text-emerald-700" />
          <h2 className="font-semibold text-slate-950">Import buyer prospects</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Paste CSV with email, company, country/region, sourceUrl, and sourceEvidence. Only approved UK/US business contacts can be queued.
        </p>
        <textarea
          value={csv}
          onChange={(event) => setCsv(event.target.value)}
          className="mt-4 min-h-40 w-full rounded-md border border-slate-300 p-3 font-mono text-xs outline-none focus:border-emerald-600"
          placeholder={exampleCsv()}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={importCsv} disabled={busy === "import"} className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
            {busy === "import" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            Import prospects
          </button>
          <button type="button" onClick={() => setCsv(exampleCsv())} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-50">Use sample</button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <form method="get" className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_auto_auto_auto]">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Search
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input name="q" defaultValue={filters.q || ""} className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-600" placeholder="Email, company, evidence, niche" />
            </span>
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Compliance
            <select name="status" defaultValue={filters.status || ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600">
              <option value="">All</option>
              <option value="approved">Approved</option>
              <option value="manual_review">Manual review</option>
              <option value="blocked">Blocked</option>
            </select>
          </label>
          <button className="self-end rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Apply</button>
          <button type="button" onClick={() => bulk("approve")} disabled={busy === "approve"} className="self-end rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-50 disabled:opacity-60">Approve</button>
          <button type="button" onClick={() => bulk("queue")} disabled={busy === "queue"} className="inline-flex items-center justify-center gap-2 self-end rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
            <MailPlus className="h-4 w-4" />
            Queue
          </button>
        </form>
      </section>

      {(message || error) && (
        <section className={`rounded-lg border p-4 text-sm font-semibold ${error ? "border-red-200 bg-red-50 text-red-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>
          {error || message}
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3"><input type="checkbox" aria-label="Select all" onChange={(event) => setSelected(Object.fromEntries(leads.map((lead) => [lead.id, event.target.checked])))} /></th>
                <th className="px-4 py-3">Prospect</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Compliance</th>
                <th className="px-4 py-3">Source evidence</th>
                <th className="px-4 py-3">Sequence</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-4">
                    <input type="checkbox" checked={Boolean(selected[lead.id])} onChange={(event) => setSelected((current) => ({ ...current, [lead.id]: event.target.checked }))} aria-label={`Select ${lead.email}`} />
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-950">{lead.company_name || lead.name || lead.email}</p>
                    <p className="mt-1 text-slate-500">{lead.email}</p>
                    <p className="mt-1 text-xs text-slate-500">{lead.region} · {lead.recipient_type}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${lead.fit === "high" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : lead.fit === "medium" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                      {lead.score}/100 {lead.fit}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(lead.compliance_status)}`}>{lead.compliance_status}</span>
                    <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(lead.email_permission_status)}`}>{lead.email_permission_status}</span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="max-w-sm text-slate-700">{lead.source_evidence || "-"}</p>
                    {lead.source_url && <a href={lead.source_url} target="_blank" rel="noreferrer" className="mt-1 block max-w-sm truncate text-xs font-semibold text-emerald-700">{lead.source_url}</a>}
                  </td>
                  <td className="px-4 py-4 text-slate-700">{lead.outbound_sequence_status}</td>
                  <td className="px-4 py-4 text-slate-500">{formatDate(lead.updated_at)}</td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">No outbound prospects yet. Paste a CSV above to start.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
