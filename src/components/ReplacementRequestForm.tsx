"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

const reasons = [
  ["website_dead", "Website dead"],
  ["company_closed", "Company closed"],
  ["person_no_longer_in_role", "Person no longer in role"],
  ["contact_invalid", "Contact invalid"],
  ["duplicate", "Duplicate"],
  ["outside_criteria", "Outside criteria"],
  ["evidence_unavailable", "Evidence unavailable"],
  ["other", "Other"],
] as const;

export function ReplacementRequestForm({
  assignmentId,
  email,
  accessToken,
  sessionId,
}: {
  assignmentId: string;
  email: string;
  accessToken?: string;
  sessionId?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/opportunities/replacement", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          email,
          accessToken,
          sessionId,
          reason: form.get("reason"),
          details: form.get("details"),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Replacement request failed.");
      setMessage("Replacement request submitted for review.");
      event.currentTarget.reset();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Replacement request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
      <label className="grid gap-1 text-xs font-semibold text-violet-100/80">
        Replacement reason
        <select name="reason" required className="rounded-md border border-white/10 bg-[#10071d] px-3 py-2 text-sm text-white">
          {reasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-semibold text-violet-100/80">
        Details
        <textarea name="details" rows={2} className="rounded-md border border-white/10 bg-[#10071d] px-3 py-2 text-sm text-white" />
      </label>
      <button disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-md border border-violet-300/30 px-3 py-2 text-xs font-semibold text-violet-100 hover:bg-white/10 disabled:opacity-60">
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        Request replacement
      </button>
      {message && <p className="text-xs font-semibold text-emerald-200">{message}</p>}
      {error && <p className="text-xs font-semibold text-red-200">{error}</p>}
    </form>
  );
}

