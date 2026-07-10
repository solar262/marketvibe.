"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileUp, Loader2, Send, ShieldCheck } from "lucide-react";

type ImportField =
  | "first_name"
  | "last_name"
  | "full_name"
  | "job_title"
  | "company_name"
  | "company_website"
  | "company_domain"
  | "linkedin_profile_url"
  | "company_linkedin_url"
  | "location"
  | "country"
  | "city"
  | "industry"
  | "company_size"
  | "public_email"
  | "public_phone"
  | "public_signal_url"
  | "public_signal_text"
  | "source_note";

type Mapping = Partial<Record<ImportField, string>>;

type Preview = {
  filename: string;
  headers: string[];
  mapping: Mapping;
  rows: Record<string, string>[];
  previewRows: PreviewRow[];
  duplicateRows: Array<{ index: number; reason: string; dedupe_key: string }>;
  rejectedRows: Array<{ index: number; reason: string }>;
  stats: {
    totalRows: number;
    validRows: number;
    rejectedRows: number;
    duplicateRows: number;
    rowsMissingCompany: number;
    rowsMissingAllUsableSourceReferences: number;
  };
};

type PreviewRow = Record<ImportField, string> & {
  dedupe_key: string;
  fit_score: number;
  intent_score: number | null;
  evidence_status: string;
};

type ImportBatch = {
  id: string;
  original_filename: string;
  created_at: string;
};

type ProspectAssignment = {
  customer_email?: string | null;
  assignment_status?: string | null;
};

type Prospect = Partial<Record<ImportField, string>> & {
  id: string;
  fit_score?: number | null;
  intent_score?: number | null;
  evidence_status?: string | null;
  enrichment_status?: string | null;
  review_status?: string | null;
  premium_prospect_assignments?: ProspectAssignment[] | null;
};

type ImportActionResponse = {
  result?: {
    csvUrl?: string;
    importedRows?: number;
    duplicateRows?: number;
    rejectedRows?: number;
  };
};

const fields: Array<{ value: ImportField; label: string }> = [
  ["first_name", "First name"],
  ["last_name", "Last name"],
  ["full_name", "Full name"],
  ["job_title", "Job title"],
  ["company_name", "Company name"],
  ["company_website", "Company website"],
  ["company_domain", "Company domain"],
  ["linkedin_profile_url", "LinkedIn source URL"],
  ["company_linkedin_url", "Company LinkedIn source URL"],
  ["location", "Location"],
  ["country", "Country"],
  ["city", "City"],
  ["industry", "Industry"],
  ["company_size", "Company size"],
  ["public_email", "Public email"],
  ["public_phone", "Public phone"],
  ["public_signal_url", "Public signal URL"],
  ["public_signal_text", "Public signal text"],
  ["source_note", "Source note"],
].map(([value, label]) => ({ value: value as ImportField, label }));

const productOptions = [
  ["proof_pack", "Proof Pack"],
  ["radar", "Radar"],
  ["growth_desk", "Growth Desk"],
] as const;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const contentType = response.headers.get("content-type") || "";
  const data: unknown = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    const errorMessage =
      typeof data === "string"
        ? data
        : data && typeof data === "object" && "error" in data
          ? String((data as { error?: unknown }).error || "Request failed.")
          : "Request failed.";
    throw new Error(errorMessage);
  }
  return data as T;
}

export function AdminImportConsole() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [mapping, setMapping] = useState<Mapping>({});
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [filters, setFilters] = useState({ batchId: "", evidenceStatus: "", enrichmentStatus: "", company: "", country: "", city: "", industry: "", minFitScore: "" });
  const [assignment, setAssignment] = useState({ customerEmail: "", productCode: "proof_pack", count: "25", adminNotes: "", adminConfirmedCustomer: false, includeProfileOnly: false });

  const selectedIds = useMemo(() => Array.from(selected), [selected]);
  const selectedProspects = useMemo(() => prospects.filter((prospect) => selected.has(String(prospect.id))), [prospects, selected]);
  const evidenceCounts = useMemo(() => ({
    profileOnly: selectedProspects.filter((prospect) => prospect.evidence_status === "profile_only").length,
    website: selectedProspects.filter((prospect) => prospect.evidence_status === "website_verified").length,
    publicSignal: selectedProspects.filter((prospect) => prospect.evidence_status === "public_signal_verified").length,
    noIntent: selectedProspects.filter((prospect) => prospect.intent_score == null).length,
  }), [selectedProspects]);

  const refresh = useCallback(async () => {
    try {
      const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
      const [batchData, prospectData] = await Promise.all([
        request<{ batches?: ImportBatch[] }>("/api/admin/import/batches"),
        request<{ prospects?: Prospect[] }>(`/api/admin/import/prospects?${params.toString()}`),
      ]);
      setBatches(batchData.batches || []);
      setProspects(prospectData.prospects || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Admin data could not be loaded.");
    }
  }, [filters]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [refresh]);

  async function upload(file?: File) {
    if (!file) return;
    setBusy("preview");
    setError("");
    setStatus("");
    try {
      const formData = new FormData();
      formData.set("file", file);
      const data = await request<{ preview: Preview }>("/api/admin/import/preview", { method: "POST", body: formData });
      setPreview(data.preview);
      setMapping(data.preview.mapping || {});
      setStatus("Preview ready. Confirm import when the counts and mapping look correct.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Preview failed.");
    } finally {
      setBusy("");
    }
  }

  async function confirmImport() {
    if (!preview) return;
    setBusy("import");
    setError("");
    setStatus("");
    try {
      const data = await request<ImportActionResponse>("/api/admin/import/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ filename: preview.filename, rows: preview.rows, mapping }),
      });
      setStatus(`Import saved: ${data.result?.importedRows || 0} imported, ${data.result?.duplicateRows || 0} duplicates skipped, ${data.result?.rejectedRows || 0} rejected.`);
      setPreview(null);
      await refresh();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Import failed.");
    } finally {
      setBusy("");
    }
  }

  async function action(path: string, body: Record<string, unknown>, success: string) {
    setBusy(path);
    setError("");
    setStatus("");
    try {
      const data = await request<ImportActionResponse>(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      setStatus(data.result?.csvUrl ? `${success} CSV: ${data.result.csvUrl}` : success);
      await refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Action failed.");
    } finally {
      setBusy("");
    }
  }

  async function exportSelected() {
    if (selectedIds.length === 0) {
      setError("Select at least one row to export.");
      return;
    }
    setBusy("export");
    setError("");
    try {
      const response = await fetch("/api/admin/import/export", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Export failed.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "marketvibe-selected-prospects.csv";
      link.click();
      URL.revokeObjectURL(url);
      setStatus("Selected CSV downloaded.");
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Export failed.");
    } finally {
      setBusy("");
    }
  }

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function fieldSource(field: ImportField, value: string) {
    setMapping((current) => ({ ...current, [field]: value || undefined }));
  }

  return (
    <main className="min-h-screen bg-[#08030f] p-4 text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-violet-300">Protected admin workflow</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold">CSV Import Console</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-violet-100/70">
              CSV importer only. LinkedIn URLs are stored as source references from the file. No LinkedIn login, scraping, cookies, browser sessions, or unofficial API calls are used.
            </p>
          </div>
          <a href="/api/admin/import/template" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10">
            <Download className="h-4 w-4" /> Download template
          </a>
        </div>

        <section className="mt-6 grid gap-3 lg:grid-cols-9">
          {["Upload CSV", "Map columns", "Preview and validate", "Import and deduplicate", "Enrich public website data", "Score and review", "Assign to customer", "Publish to dashboard", "Download delivery CSV"].map((stage, index) => (
            <div key={stage} className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs font-semibold text-violet-100">
              <span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-md bg-violet-500/20 text-violet-100">{index + 1}</span>
              {stage}
            </div>
          ))}
        </section>

        {status && <p className="mt-5 rounded-lg border border-violet-300/30 bg-violet-400/10 p-3 text-sm font-semibold text-violet-50">{status}</p>}
        {error && <p className="mt-5 rounded-lg border border-red-300/30 bg-red-950/40 p-3 text-sm font-semibold text-red-100">{error}</p>}

        <section className="mt-6 rounded-lg border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">1. Upload CSV</h2>
              <p className="mt-1 text-sm text-violet-100/65">UTF-8 CSV only. Comma, semicolon, and tab delimiters are detected. Maximum 10 MB and 10,000 rows.</p>
            </div>
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-950/30 hover:brightness-110">
              {busy === "preview" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
              Choose CSV
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void upload(event.target.files?.[0])} />
            </label>
          </div>
        </section>

        {preview && (
          <section className="mt-6 rounded-lg border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
              <div>
                <h2 className="text-xl font-semibold">2. Map columns</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {fields.map((field) => (
                    <label key={field.value} className="grid gap-1 text-xs font-semibold text-violet-100">
                      {field.label}
                      <select value={mapping[field.value] || ""} onChange={(event) => fieldSource(field.value, event.target.value)} className="rounded-lg border border-white/10 bg-[#13071f] px-3 py-2 text-sm text-white outline-none">
                        <option value="">Not mapped</option>
                        {preview.headers.map((header) => <option key={header} value={header}>{header}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold">3. Preview and validate</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Total rows", preview.stats.totalRows],
                    ["Valid rows", preview.stats.validRows],
                    ["Rejected rows", preview.stats.rejectedRows],
                    ["Duplicate rows", preview.stats.duplicateRows],
                    ["Missing company", preview.stats.rowsMissingCompany],
                    ["Missing references", preview.stats.rowsMissingAllUsableSourceReferences],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-xs text-violet-100/55">{label}</p>
                      <p className="mt-1 text-2xl font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 max-h-[420px] overflow-auto rounded-lg border border-white/10">
                  <table className="w-full min-w-[900px] text-left text-xs">
                    <thead className="bg-white/10 text-violet-100"><tr><th className="px-3 py-2">Name</th><th>Title</th><th>Company</th><th>Website</th><th>Fit</th><th>Intent</th><th>Evidence</th></tr></thead>
                    <tbody>
                      {preview.previewRows.map((row, index) => (
                        <tr key={`${row.dedupe_key}-${index}`} className="border-t border-white/10">
                          <td className="px-3 py-2">{row.full_name || `${row.first_name} ${row.last_name}`}</td>
                          <td>{row.job_title}</td>
                          <td>{row.company_name}</td>
                          <td>{row.company_website}</td>
                          <td>{row.fit_score}</td>
                          <td>{row.intent_score ?? "Intent not evidenced"}</td>
                          <td>{row.evidence_status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button disabled={busy === "import"} onClick={() => void confirmImport()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3 text-sm font-bold text-white hover:brightness-110 disabled:opacity-60">
                  {busy === "import" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Confirm import and deduplicate
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="mt-6 rounded-lg border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Batch history and review</h2>
              <p className="mt-1 text-sm text-violet-100/65">Imported prospects do not publish automatically. Select records, review evidence, assign, then publish.</p>
            </div>
            <button onClick={() => void refresh()} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10">Refresh</button>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-4">
            <select value={filters.batchId} onChange={(event) => setFilters({ ...filters, batchId: event.target.value })} className="rounded-lg border border-white/10 bg-[#13071f] px-3 py-2 text-sm">
              <option value="">All batches</option>
              {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.original_filename} · {new Date(batch.created_at).toLocaleString()}</option>)}
            </select>
            <select value={filters.evidenceStatus} onChange={(event) => setFilters({ ...filters, evidenceStatus: event.target.value })} className="rounded-lg border border-white/10 bg-[#13071f] px-3 py-2 text-sm">
              <option value="">Any evidence</option>
              <option value="profile_only">Profile-only</option>
              <option value="website_verified">Website verified</option>
              <option value="public_signal_verified">Public signal verified</option>
            </select>
            <input value={filters.company} onChange={(event) => setFilters({ ...filters, company: event.target.value })} placeholder="Company filter" className="rounded-lg border border-white/10 bg-[#13071f] px-3 py-2 text-sm outline-none" />
            <button onClick={() => void refresh()} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#13071f]">Apply filters</button>
          </div>

          <div className="mt-5 overflow-auto rounded-lg border border-white/10">
            <table className="w-full min-w-[1400px] text-left text-xs">
              <thead className="bg-white/10 text-violet-100">
                <tr>
                  <th className="px-3 py-2">Select</th><th>Name</th><th>Title</th><th>Company</th><th>Location</th><th>Industry</th><th>Website</th><th>LinkedIn source</th><th>Fit</th><th>Intent</th><th>Evidence</th><th>Enrichment</th><th>Review</th><th>Assigned</th><th>Delivery</th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((prospect) => {
                  const assignments = Array.isArray(prospect.premium_prospect_assignments) ? prospect.premium_prospect_assignments : [];
                  return (
                    <tr key={prospect.id} className="border-t border-white/10 align-top">
                      <td className="px-3 py-2"><input type="checkbox" checked={selected.has(String(prospect.id))} onChange={() => toggle(String(prospect.id))} /></td>
                      <td>{prospect.full_name || `${prospect.first_name || ""} ${prospect.last_name || ""}`}</td>
                      <td>{prospect.job_title}</td>
                      <td>{prospect.company_name}</td>
                      <td>{prospect.location || [prospect.city, prospect.country].filter(Boolean).join(", ")}</td>
                      <td>{prospect.industry}</td>
                      <td>{prospect.company_website ? <a className="text-violet-200 underline" href={prospect.company_website} target="_blank" rel="noreferrer">Website</a> : ""}</td>
                      <td>{prospect.linkedin_profile_url ? <a className="text-violet-200 underline" href={prospect.linkedin_profile_url} target="_blank" rel="noreferrer">Source</a> : ""}</td>
                      <td>{prospect.fit_score}</td>
                      <td>{prospect.intent_score ?? "Not evidenced"}</td>
                      <td>{prospect.evidence_status}</td>
                      <td>{prospect.enrichment_status}</td>
                      <td>{prospect.review_status}</td>
          <td>{assignments.map((item) => item.customer_email).filter(Boolean).join(", ")}</td>
          <td>{assignments.map((item) => item.assignment_status).filter(Boolean).join(", ")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1.2fr]">
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">Selected actions</h3>
              <p className="mt-1 text-sm text-violet-100/65">{selectedIds.length} selected · {evidenceCounts.profileOnly} profile-only · {evidenceCounts.website} website-verified · {evidenceCounts.publicSignal} public-signal-verified · {evidenceCounts.noIntent} without intent evidence</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => void action("/api/admin/import/enrich", { ids: selectedIds }, "Enrichment finished. Review statuses updated.")} className="rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/10">Enrich selected</button>
                <button onClick={() => void action("/api/admin/import/review", { ids: selectedIds, reviewStatus: "approved" }, "Selected records approved.")} className="rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/10">Approve selected</button>
                <button onClick={() => void action("/api/admin/import/review", { ids: selectedIds, reviewStatus: "rejected" }, "Selected records rejected.")} className="rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/10">Reject selected</button>
                <button onClick={() => void exportSelected()} className="rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/10">Export selected</button>
                <button onClick={() => void action("/api/admin/import/assign", { ids: selectedIds, action: "remove" }, "Assignments removed.")} className="rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/10">Remove assignment</button>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">Assign and publish</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input value={assignment.customerEmail} onChange={(event) => setAssignment({ ...assignment, customerEmail: event.target.value })} placeholder="Customer billing email" className="rounded-lg border border-white/10 bg-[#13071f] px-3 py-2 text-sm outline-none" />
                <select value={assignment.productCode} onChange={(event) => setAssignment({ ...assignment, productCode: event.target.value })} className="rounded-lg border border-white/10 bg-[#13071f] px-3 py-2 text-sm">
                  {productOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <input value={assignment.count} onChange={(event) => setAssignment({ ...assignment, count: event.target.value })} placeholder="Number of opportunities" className="rounded-lg border border-white/10 bg-[#13071f] px-3 py-2 text-sm outline-none" />
                <input value={assignment.adminNotes} onChange={(event) => setAssignment({ ...assignment, adminNotes: event.target.value })} placeholder="Internal delivery note" className="rounded-lg border border-white/10 bg-[#13071f] px-3 py-2 text-sm outline-none" />
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={assignment.adminConfirmedCustomer} onChange={(event) => setAssignment({ ...assignment, adminConfirmedCustomer: event.target.checked })} /> Administrator-confirmed customer record</label>
              <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={assignment.includeProfileOnly} onChange={(event) => setAssignment({ ...assignment, includeProfileOnly: event.target.checked })} /> Include profile-only records in delivery</label>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => void action("/api/admin/import/assign", { ids: selectedIds.slice(0, Number(assignment.count) || selectedIds.length), ...assignment }, "Selected records assigned.")} className="rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/10">Assign selected</button>
                <button onClick={() => void action("/api/admin/import/publish", { ids: selectedIds.slice(0, Number(assignment.count) || selectedIds.length), ...assignment }, "Publish attempted. Delivery recorded only if the server completed every step.")} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3 py-2 text-sm font-bold text-white hover:brightness-110">
                  {busy === "/api/admin/import/publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Publish to customer
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
