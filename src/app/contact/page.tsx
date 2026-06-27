"use client";

import { useState } from "react";
import { inputClass } from "@/lib/ui";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await fetch("/api/contact", { method: "POST", body: JSON.stringify(Object.fromEntries(form.entries())) });
    setSent(true);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-slate-950">Contact MarketVibe</h1>
      <p className="mt-2 text-slate-600">Send a message and we will get back to you.</p>

      <form onSubmit={submit} className="mt-7 grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <label className="grid gap-1 text-sm font-medium">
          Name
          <input required name="name" className={inputClass} />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Email
          <input required type="email" name="email" className={inputClass} />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Message
          <textarea required name="message" rows={5} className={inputClass} />
        </label>
        <button className="rounded-md bg-stone-950 px-4 py-3 text-sm font-semibold text-white">Send message</button>
        {sent && <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">Message sent.</p>}
      </form>
    </main>
  );
}
