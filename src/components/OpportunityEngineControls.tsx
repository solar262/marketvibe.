"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Pause, Play, RefreshCw, Rocket, Search, ShieldCheck, Target, Zap } from "lucide-react";

const actions = [
  ["run-pipeline", "Run full automation pipeline", Zap],
  ["create-property-profile", "Activate property profile and clean inventory", Target],
  ["run-discovery", "Run discovery now", Search],
  ["run-verification", "Run verification now", ShieldCheck],
  ["refresh-stale", "Refresh stale records", RefreshCw],
  ["fill-shortages", "Fill customer shortages", Rocket],
  ["pause", "Pause automation", Pause],
  ["resume", "Resume automation", Play],
] as const;

export function OpportunityEngineControls() {
  const router = useRouter();
  const [active, setActive] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function run(action: string) {
    if (active) return;
    setActive(action);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/admin/opportunities/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Action failed.");
      const runId = result.runId || result.discovery?.runId;
      setMessage(result.message || `${action} completed.${runId ? ` Run ${runId}.` : ""}`);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Action failed.");
    } finally {
      setActive("");
    }
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {actions.map(([action, label, Icon]) => (
        <button
          key={action}
          type="button"
          onClick={() => run(action)}
          disabled={Boolean(active)}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {active === action ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
          {label}
        </button>
      ))}
      <p className="md:col-span-2 xl:col-span-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        Property opportunities use dedicated property and construction sources only. The legacy local-business website-audit engine is quarantined.
      </p>
      {message && <p className="md:col-span-2 xl:col-span-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">{message}</p>}
      {error && <p className="md:col-span-2 xl:col-span-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-900">{error}</p>}
    </div>
  );
}
