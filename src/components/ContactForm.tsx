"use client";

import { useState } from "react";
import { inputClass } from "@/lib/ui";

export function ContactForm({ offer }: { offer: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    try {
      const response = await fetch(offer === "data-request" ? "/api/data-requests" : "/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || "Your message could not be sent. Please try again.");
      }

      formElement.reset();
      setStatus("sent");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Your message could not be sent. Please try again.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={submit} className="mt-7 grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <input type="hidden" name="offer" value={offer} />
      {offer !== "general" && (
        <p className="rounded-md bg-violet-50 p-3 text-sm font-semibold text-violet-900">
          Enquiry type: {offer === "agency-partner" ? "Agency Partner" : offer === "data-licence" ? "Data Licence" : offer === "data-request" ? "Data request" : offer}
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
      {offer === "data-request" && (
        <label className="grid gap-1 text-sm font-medium">
          Request type
          <select required name="requestType" defaultValue="access" className={inputClass}>
            <option value="access">Access my data</option>
            <option value="correction">Correct my data</option>
            <option value="deletion">Delete my data</option>
            <option value="objection">Object to processing</option>
            <option value="suppression">Stop all marketing</option>
          </select>
        </label>
      )}
      <label className="grid gap-1 text-sm font-medium">
        Message
        <textarea required name="message" rows={5} className={inputClass} />
      </label>
      <button
        disabled={status === "sending"}
        className="rounded-md bg-stone-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
      {status === "sent" && (
        <p className="rounded-md bg-violet-50 p-3 text-sm text-violet-900">{offer === "data-request" ? "Request recorded. Marketing suppression is immediate where applicable." : "Message sent."}</p>
      )}
      {status === "error" && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">{errorMessage}</p>
      )}
    </form>
  );
}
