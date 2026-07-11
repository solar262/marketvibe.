"use client";

import { useState } from "react";

export function ExceptionActions({ id }: { id: string }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function act(status: "approved" | "rejected" | "deferred") {
    setBusy(status);
    setError("");
    try {
      const response = await fetch("/api/admin/operations/exceptions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, status, note: `Owner marked exception ${status}.` }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Exception action failed.");
      window.location.reload();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Exception action failed.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        <button disabled={Boolean(busy)} onClick={() => void act("approved")} className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
          {busy === "approved" ? "Approving..." : "Approve"}
        </button>
        <button disabled={Boolean(busy)} onClick={() => void act("rejected")} className="rounded-md bg-red-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
          {busy === "rejected" ? "Rejecting..." : "Reject"}
        </button>
        <button disabled={Boolean(busy)} onClick={() => void act("deferred")} className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50">
          {busy === "deferred" ? "Deferring..." : "Defer"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs font-semibold text-red-700">{error}</p>}
    </div>
  );
}
