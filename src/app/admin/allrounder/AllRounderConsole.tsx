"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Play, ShieldCheck, TerminalSquare } from "lucide-react";

const presets = [
  "Show live health",
  "Run full autopilot",
  "Recover buyer pipeline",
  "Find and verify opportunities",
  "Replace stale opportunities",
  "Publish due deliveries",
];

type CommandPlan = {
  action: string;
  label: string;
  mutatesData: boolean;
  sendsEmail: boolean;
  requiresApproval: boolean;
};

type ApiResponse = {
  ok: boolean;
  executed?: boolean;
  requiresApproval?: boolean;
  message?: string;
  error?: string;
  command?: string;
  plan?: CommandPlan;
  action?: string;
  label?: string;
  result?: unknown;
  verification?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  supportedCommands?: readonly string[];
};

export function AllRounderConsole() {
  const [command, setCommand] = useState("Show live health");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [approval, setApproval] = useState<{ command: string; plan: CommandPlan; message: string } | null>(null);

  async function runCommand(nextCommand = command, approved = false) {
    const cleanCommand = nextCommand.trim();
    if (!cleanCommand) {
      setResponse({ ok: false, error: "Enter a command first." });
      return;
    }

    setLoading(true);
    setResponse(null);
    if (approved) setApproval(null);

    try {
      const request = await fetch("/api/admin/allrounder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ command: cleanCommand, approved }),
      });
      const data = await request.json() as ApiResponse;

      if (data.requiresApproval && data.plan) {
        setApproval({
          command: cleanCommand,
          plan: data.plan,
          message: data.message || "Approval is required before this operation can run.",
        });
      } else {
        setApproval(null);
        setResponse(data);
      }
    } catch (error) {
      setResponse({
        ok: false,
        error: error instanceof Error ? error.message : "The command request failed.",
      });
    } finally {
      setLoading(false);
    }
  }

  function selectPreset(value: string) {
    setCommand(value);
    setApproval(null);
    setResponse(null);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-slate-950 p-2 text-white">
            <TerminalSquare className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Direct command</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Commands below are wired to existing MarketVibe operations. Unsupported requests are rejected rather than converted into invented plans.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => selectPreset(preset)}
              className="rounded-full border border-slate-300 bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
            >
              {preset}
            </button>
          ))}
        </div>

        <label className="mt-5 block text-sm font-semibold text-slate-900" htmlFor="allrounder-command">
          What should MarketVibe do?
        </label>
        <textarea
          id="allrounder-command"
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          rows={4}
          className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-slate-950 focus:bg-white"
          placeholder="Example: Show live health"
        />

        <button
          type="button"
          onClick={() => runCommand()}
          disabled={loading}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
          {loading ? "Running…" : "Run command"}
        </button>
      </section>

      {approval && (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">Approval required</p>
              <h2 className="mt-1 text-xl font-semibold text-amber-950">{approval.plan.label}</h2>
              <p className="mt-2 text-sm leading-6 text-amber-900">{approval.message}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-amber-900">
                {approval.plan.mutatesData && <span className="rounded-full bg-amber-100 px-3 py-1">Changes live data</span>}
                {approval.plan.sendsEmail && <span className="rounded-full bg-amber-100 px-3 py-1">May send delivery email</span>}
              </div>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => runCommand(approval.command, true)}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-900 px-4 py-3 font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
                >
                  <ShieldCheck className="h-5 w-5" />
                  Approve and run
                </button>
                <button
                  type="button"
                  onClick={() => setApproval(null)}
                  className="rounded-lg border border-amber-400 bg-white px-4 py-3 font-semibold text-amber-950 hover:bg-amber-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {response && (
        <section className={`rounded-xl border p-4 shadow-sm sm:p-6 ${response.ok ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
          <div className="flex items-start gap-3">
            {response.ok ? (
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />
            ) : (
              <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-red-700" />
            )}
            <div className="min-w-0 flex-1">
              <p className={`font-semibold ${response.ok ? "text-emerald-950" : "text-red-950"}`}>
                {response.ok ? (response.executed ? "Verified operation completed" : "Command checked") : "Nothing was executed"}
              </p>
              <p className={`mt-1 text-sm leading-6 ${response.ok ? "text-emerald-900" : "text-red-900"}`}>
                {response.message || response.error || response.label || "MarketVibe returned a result."}
              </p>
              {response.verification && (
                <p className="mt-2 text-xs font-medium text-emerald-800">{response.verification}</p>
              )}
              <pre className="mt-4 max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                {JSON.stringify(response.result ?? response, null, 2)}
              </pre>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
