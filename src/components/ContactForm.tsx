"use client";

import { useState } from "react";
import { inputClass } from "@/lib/ui";

export function ContactForm({ offer }: { offer: string }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    setSent(false);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Message could not be sent.");
      setSent(true);
      event.currentTarget.reset();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Message could not be sent.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-7 grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <input type="hidden" name="offer" value={offer} />
      {offer !== "general" && (
        <p className="rounded-md bg-violet-50 p-3 text-sm font-semibold text-violet-900">
          Enquiry type: {offer === "agency-partner" ? "Agency Partner" : "Data Licence"}
        </p>
      )}
      <label className="grid gap-1 text-sm font-medium">
        Name
        <input required name="name" className={inputClass} />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Company
        <input name="company" className={inputClass} />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Email
        <input required type="email" name="email" className={inputClass} />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Message
        <textarea required name="message" rows={5} className={inputClass} />
      </label>
      <button disabled={loading} className="rounded-md bg-stone-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {loading ? "Sending..." : "Send message"}
      </button>
      {sent && <p className="rounded-md bg-violet-50 p-3 text-sm text-violet-900">Message received. We will reply by email when operator review is needed.</p>}
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </form>
  );
}
