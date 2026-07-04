"use client";

import { useState } from "react";
import { Play } from "lucide-react";

type LeadHuntResult = {
  savedLeadCount?: number;
  results?: Array<{
    error?: string;
    auditSlugs?: string[];
  }>;
};

type RunState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; payload: LeadHuntResult }
  | { status: "error"; message: string; payload?: LeadHuntResult };

function auditSlugs(payload?: LeadHuntResult) {
  return (payload?.results || []).flatMap((result) => Array.isArray(result.auditSlugs) ? result.auditSlugs : []);
}

function errorText(payload?: LeadHuntResult) {
  return (payload?.results || []).map((result) => result.error).filter(Boolean).join(" | ");
}

export function RunTestHuntButton() {
  const [runState, setRunState] = useState<RunState>({ status: "idle" });

  async function runTestHunt() {
    setRunState({ status: "loading" });
    try {
      const response = await fetch("/api/cron/lead-hunt?markets=1&leads=2", { cache: "no-store" });
      const payload = await response.json().catch(() => null) as (LeadHuntResult & { ok?: boolean; error?: string }) | null;
      if (!response.ok || !payload || payload.ok === false) {
        const message = payload?.error || errorText(payload || undefined) || `Lead hunt failed with HTTP ${response.status}`;
        setRunState({ status: "error", message, payload: payload || undefined });
        return;
      }
      setRunState({ status: "success", payload });
    } catch (error) {
      setRunState({ status: "error", message: error instanceof Error ? error.message : "Lead hunt request failed." });
    }
  }

  const slugs = runState.status === "success" || runState.status === "error" ? auditSlugs(runState.payload) : [];

  return (
    <div className="w-full sm:w-auto sm:min-w-72">
      <button
        type="button"
        onClick={() => void runTestHunt()}
        disabled={runState.status === "loading"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        <Play className="h-4 w-4" /> {runState.status === "loading" ? "Loading..." : "Run test hunt"}
      </button>
      {runState.status === "success" && (
        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <p className="font-semibold">Test hunt completed. Saved leads: {runState.payload.savedLeadCount ?? 0}</p>
          <p className="mt-1 break-words">Audit slugs: {slugs.length ? slugs.join(", ") : "none returned"}</p>
        </div>
      )}
      {runState.status === "error" && (
        <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          <p className="font-semibold">Test hunt failed.</p>
          <p className="mt-1 break-words">{runState.message}</p>
          {slugs.length ? <p className="mt-1 break-words">Audit slugs returned before failure: {slugs.join(", ")}</p> : null}
        </div>
      )}
    </div>
  );
}
