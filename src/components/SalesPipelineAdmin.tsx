"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Download, Loader2, Mail, MessageSquareText, Search, StickyNote, UserRoundCheck } from "lucide-react";
import type {
  CustomerJourney,
  SalesLeadListRow,
  SalesLeadNoteRow,
  SalesLeadStatusHistoryRow,
  SalesLeadTaskRow,
  SalesPipelineStage,
} from "@/lib/sales-pipeline";

type SalesEmailEventView = {
  id: string;
  sequence_type: string;
  subject: string;
  status: string;
  scheduled_at: string;
  sent_at: string | null;
  failure_reason: string | null;
};

type LeadDetail = {
  lead: SalesLeadListRow;
  notes: SalesLeadNoteRow[];
  tasks: SalesLeadTaskRow[];
  statusHistory: SalesLeadStatusHistoryRow[];
  emailEvents: SalesEmailEventView[];
};

type Props = {
  initialLeads: SalesLeadListRow[];
  overview: {
    stageCounts: Record<string, number | null>;
    highFit: number | null;
    mediumFit: number | null;
    suppressed: number | null;
    queuedEmails: number | null;
  };
  filters: Record<string, string>;
  stages: SalesPipelineStage[];
  journeys: CustomerJourney[];
};

const stageLabels: Record<string, string> = {
  new_lead: "New lead",
  qualified: "Qualified",
  contacted: "Contacted",
  interested: "Interested",
  proof_pack_purchased: "Proof Pack purchased",
  proof_pack_delivered: "Proof Pack delivered",
  subscription_opportunity: "Subscription opportunity",
  subscriber: "Subscriber",
  lost: "Lost",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function fitBadge(fit: string) {
  if (fit === "high") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (fit === "medium") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function SalesPipelineAdmin({ initialLeads, overview, filters, stages, journeys }: Props) {
  const [leads, setLeads] = useState(initialLeads);
  const [busy, setBusy] = useState("");
  const [expanded, setExpanded] = useState("");
  const [details, setDetails] = useState<Record<string, LeadDetail>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [taskDrafts, setTaskDrafts] = useState<Record<string, string>>({});
  const [ownerDrafts, setOwnerDrafts] = useState<Record<string, string>>({});
  const [lostDrafts, setLostDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const exportQuery = useMemo(() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value);
    }
    return params.toString();
  }, [filters]);

  async function requestJson(url: string, init?: RequestInit) {
    const response = await fetch(url, init);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Request failed.");
    return data;
  }

  async function updateStage(id: string, stage: SalesPipelineStage) {
    setBusy(`stage:${id}`);
    setError("");
    try {
      const data = await requestJson(`/api/admin/sales-pipeline/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, lostReason: lostDrafts[id] || "" }),
      });
      setLeads((current) => current.map((lead) => lead.id === id ? data.lead : lead));
      setDetails((current) => {
        const existing = current[id];
        return existing ? { ...current, [id]: { ...existing, lead: data.lead } } : current;
      });
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Stage update failed.");
    } finally {
      setBusy("");
    }
  }

  async function loadDetail(id: string) {
    if (expanded === id) {
      setExpanded("");
      return;
    }
    setExpanded(id);
    if (details[id]) return;
    setBusy(`detail:${id}`);
    setError("");
    try {
      const data = await requestJson(`/api/admin/sales-pipeline/${id}`);
      setDetails((current) => ({ ...current, [id]: data.detail }));
      setOwnerDrafts((current) => ({ ...current, [id]: data.detail.lead.owner || "" }));
      setLostDrafts((current) => ({ ...current, [id]: data.detail.lead.lost_reason || "" }));
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : "Could not load lead detail.");
    } finally {
      setBusy("");
    }
  }

  async function saveFields(id: string) {
    setBusy(`fields:${id}`);
    setError("");
    try {
      const data = await requestJson(`/api/admin/sales-pipeline/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: ownerDrafts[id] || "", lostReason: lostDrafts[id] || "" }),
      });
      setLeads((current) => current.map((lead) => lead.id === id ? data.lead : lead));
      setDetails((current) => current[id] ? { ...current, [id]: { ...current[id], lead: data.lead } } : current);
    } catch (fieldError) {
      setError(fieldError instanceof Error ? fieldError.message : "Could not save CRM fields.");
    } finally {
      setBusy("");
    }
  }

  async function addNote(id: string) {
    setBusy(`note:${id}`);
    setError("");
    try {
      const data = await requestJson(`/api/admin/sales-pipeline/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: noteDrafts[id] || "" }),
      });
      setDetails((current) => ({
        ...current,
        [id]: { ...current[id], notes: [data.note, ...(current[id]?.notes || [])] },
      }));
      setNoteDrafts((current) => ({ ...current, [id]: "" }));
    } catch (noteError) {
      setError(noteError instanceof Error ? noteError.message : "Could not add note.");
    } finally {
      setBusy("");
    }
  }

  async function addTask(id: string) {
    setBusy(`task:${id}`);
    setError("");
    try {
      const data = await requestJson(`/api/admin/sales-pipeline/${id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: taskDrafts[id] || "" }),
      });
      setDetails((current) => ({
        ...current,
        [id]: { ...current[id], tasks: [data.task, ...(current[id]?.tasks || [])] },
      }));
      setTaskDrafts((current) => ({ ...current, [id]: "" }));
    } catch (taskError) {
      setError(taskError instanceof Error ? taskError.message : "Could not add task.");
    } finally {
      setBusy("");
    }
  }

  async function completeTask(id: string, taskId: string) {
    setBusy(`task:${taskId}`);
    setError("");
    try {
      const data = await requestJson(`/api/admin/sales-pipeline/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      });
      setDetails((current) => ({
        ...current,
        [id]: {
          ...current[id],
          tasks: (current[id]?.tasks || []).map((task) => task.id === taskId ? data.task : task),
        },
      }));
    } catch (taskError) {
      setError(taskError instanceof Error ? taskError.message : "Could not update task.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mt-6 grid gap-6">
      <section className="grid gap-4 md:grid-cols-5">
        {[
          ["High fit", overview.highFit],
          ["Medium fit", overview.mediumFit],
          ["Queued emails", overview.queuedEmails],
          ["Suppressed", overview.suppressed],
          ["Visible leads", leads.length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{value === null ? "Setup" : value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <form method="get" className="grid gap-3 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr_auto_auto]">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Search
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input name="q" defaultValue={filters.q || ""} className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-600" placeholder="Email, company, service, industry" />
            </span>
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Stage
            <select name="stage" defaultValue={filters.stage || ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600">
              <option value="">All stages</option>
              {stages.map((stage) => <option key={stage} value={stage}>{stageLabels[stage]}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Fit
            <select name="fit" defaultValue={filters.fit || ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600">
              <option value="">All fits</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Journey
            <select name="journey" defaultValue={filters.journey || ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600">
              <option value="">All journeys</option>
              {journeys.map((journey) => <option key={journey} value={journey}>{journey === "proof_pack" ? "Proof Pack" : "Subscriber"}</option>)}
            </select>
          </label>
          <button className="self-end rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Apply</button>
          <a href={`/api/admin/sales-pipeline/export${exportQuery ? `?${exportQuery}` : ""}`} className="inline-flex items-center justify-center gap-2 self-end rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-50">
            <Download className="h-4 w-4" />
            CSV
          </a>
        </form>
      </section>

      {error && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">
          {error}
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Fit</th>
                <th className="px-4 py-3">Journey</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Detail</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-950">{lead.company_name || lead.name || lead.email}</p>
                    <p className="mt-1 text-slate-500">{lead.email}</p>
                    <p className="mt-1 max-w-xs text-xs text-slate-500">{lead.service_offered}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${fitBadge(lead.fit)}`}>
                      {lead.score}/100 {lead.fit}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{lead.customer_journey === "proof_pack" ? "Proof Pack" : "Subscriber"}</td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-slate-800">{lead.target_industry}</p>
                    <p className="mt-1 text-xs text-slate-500">{lead.target_countries}</p>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={lead.stage}
                      disabled={busy === `stage:${lead.id}`}
                      onChange={(event) => updateStage(lead.id, event.target.value as SalesPipelineStage)}
                      className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    >
                      {stages.map((stage) => <option key={stage} value={stage}>{stageLabels[stage]}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{lead.owner || "-"}</td>
                  <td className="px-4 py-4 text-slate-500">{formatDate(lead.updated_at)}</td>
                  <td className="px-4 py-4">
                    <button type="button" onClick={() => loadDetail(lead.id)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-slate-50">
                      {busy === `detail:${lead.id}` ? "Loading" : expanded === lead.id ? "Close" : "Open"}
                    </button>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">No sales leads match this view.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {expanded && details[expanded] && (
          <div className="border-t border-slate-200 bg-slate-50 p-4">
            <LeadDetailPanel
              detail={details[expanded]}
              busy={busy}
              ownerDraft={ownerDrafts[expanded] || ""}
              lostDraft={lostDrafts[expanded] || ""}
              noteDraft={noteDrafts[expanded] || ""}
              taskDraft={taskDrafts[expanded] || ""}
              onOwnerChange={(value) => setOwnerDrafts((current) => ({ ...current, [expanded]: value }))}
              onLostChange={(value) => setLostDrafts((current) => ({ ...current, [expanded]: value }))}
              onNoteChange={(value) => setNoteDrafts((current) => ({ ...current, [expanded]: value }))}
              onTaskChange={(value) => setTaskDrafts((current) => ({ ...current, [expanded]: value }))}
              onSaveFields={() => saveFields(expanded)}
              onAddNote={() => addNote(expanded)}
              onAddTask={() => addTask(expanded)}
              onCompleteTask={(taskId) => completeTask(expanded, taskId)}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function LeadDetailPanel({
  detail,
  busy,
  ownerDraft,
  lostDraft,
  noteDraft,
  taskDraft,
  onOwnerChange,
  onLostChange,
  onNoteChange,
  onTaskChange,
  onSaveFields,
  onAddNote,
  onAddTask,
  onCompleteTask,
}: {
  detail: LeadDetail;
  busy: string;
  ownerDraft: string;
  lostDraft: string;
  noteDraft: string;
  taskDraft: string;
  onOwnerChange: (value: string) => void;
  onLostChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onTaskChange: (value: string) => void;
  onSaveFields: () => void;
  onAddNote: () => void;
  onAddTask: () => void;
  onCompleteTask: (taskId: string) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <UserRoundCheck className="h-4 w-4 text-emerald-700" />
          <h3 className="font-semibold text-slate-950">CRM fields</h3>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Owner
            <input value={ownerDraft} onChange={(event) => onOwnerChange(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Owner name" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Lost reason
            <input value={lostDraft} onChange={(event) => onLostChange(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Only if lost" />
          </label>
        </div>
        <button type="button" onClick={onSaveFields} className="mt-3 inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white">
          {busy === `fields:${detail.lead.id}` && <Loader2 className="h-4 w-4 animate-spin" />}
          Save CRM fields
        </button>
        <div className="mt-4 grid gap-2 text-sm text-slate-600">
          <p>Region: {detail.lead.region}</p>
          <p>Consent: {detail.lead.consent_marketing ? "Yes" : "No"} · Suppressed: {detail.lead.is_suppressed ? "Yes" : "No"}</p>
          <p>Client value: {detail.lead.average_client_value} · Capacity: {detail.lead.weekly_outreach_capacity}/week</p>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-emerald-700" />
          <h3 className="font-semibold text-slate-950">Notes</h3>
        </div>
        <div className="mt-3 flex gap-2">
          <input value={noteDraft} onChange={(event) => onNoteChange(event.target.value)} className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Add a note" />
          <button type="button" onClick={onAddNote} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">Add</button>
        </div>
        <div className="mt-3 grid gap-2">
          {detail.notes.map((note) => (
            <p key={note.id} className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">{note.body}<span className="mt-1 block text-xs text-slate-400">{formatDate(note.created_at)}</span></p>
          ))}
          {detail.notes.length === 0 && <p className="text-sm text-slate-500">No notes yet.</p>}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
          <h3 className="font-semibold text-slate-950">Tasks</h3>
        </div>
        <div className="mt-3 flex gap-2">
          <input value={taskDraft} onChange={(event) => onTaskChange(event.target.value)} className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Add a task" />
          <button type="button" onClick={onAddTask} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">Add</button>
        </div>
        <div className="mt-3 grid gap-2">
          {detail.tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 p-3 text-sm">
              <span className={task.status === "done" ? "text-slate-400 line-through" : "text-slate-700"}>{task.title}</span>
              {task.status !== "done" && (
                <button type="button" onClick={() => onCompleteTask(task.id)} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold">Done</button>
              )}
            </div>
          ))}
          {detail.tasks.length === 0 && <p className="text-sm text-slate-500">No tasks yet.</p>}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-emerald-700" />
          <h3 className="font-semibold text-slate-950">Status history</h3>
        </div>
        <div className="mt-3 grid gap-2 text-sm">
          {detail.statusHistory.map((item) => (
            <p key={item.id} className="rounded-md bg-slate-50 p-3 text-slate-700">
              {(item.from_stage && stageLabels[item.from_stage]) || "Created"} to {stageLabels[item.to_stage] || item.to_stage}
              <span className="mt-1 block text-xs text-slate-400">{formatDate(item.created_at)} {item.note ? `- ${item.note}` : ""}</span>
            </p>
          ))}
          {detail.statusHistory.length === 0 && <p className="text-sm text-slate-500">No stage changes yet.</p>}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-2">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-emerald-700" />
          <h3 className="font-semibold text-slate-950">Email events</h3>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2 pr-4">Sequence</th>
                <th className="py-2 pr-4">Subject</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Scheduled</th>
                <th className="py-2 pr-4">Error</th>
              </tr>
            </thead>
            <tbody>
              {detail.emailEvents.map((event) => (
                <tr key={event.id} className="border-t border-slate-100">
                  <td className="py-2 pr-4">{event.sequence_type}</td>
                  <td className="py-2 pr-4">{event.subject}</td>
                  <td className="py-2 pr-4">{event.status}</td>
                  <td className="py-2 pr-4">{formatDate(event.scheduled_at)}</td>
                  <td className="py-2 pr-4">{event.failure_reason || ""}</td>
                </tr>
              ))}
              {detail.emailEvents.length === 0 && <tr><td colSpan={5} className="py-4 text-slate-500">No email events yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
