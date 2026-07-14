"use client";

import { useState } from "react";
import Link from "next/link";
import { findSupportAnswer } from "@/lib/support-content";

export function SupportAssistant() {
  const [query, setQuery] = useState("");
  const answer = findSupportAnswer(query);

  return (
    <section className="rounded-lg border border-violet-300/20 bg-violet-400/10 p-5 text-violet-50">
      <h2 className="text-xl font-semibold">Automated support assistant</h2>
      <p className="mt-2 text-sm leading-6 text-violet-100/70">
        I can help with product questions, billing, access, exports, privacy, and troubleshooting. For pricing changes, refund requests, legal questions, or outcome guarantees, I will route you to support.
      </p>
      <label className="mt-4 grid gap-2 text-sm font-semibold">
        Ask about product, billing, access, exports, privacy, or troubleshooting
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="rounded-lg border border-white/10 bg-[#13071f] px-3 py-3 text-sm text-white outline-none placeholder:text-violet-100/45"
          placeholder="Example: how do I cancel?"
        />
      </label>
      <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4 text-sm leading-6">
        {answer ? (
          <>
            <p className="font-semibold text-white">{answer.question}</p>
            <p className="mt-2 text-violet-100/75">{answer.answer}</p>
            {answer.href && <Link href={answer.href} className="mt-3 inline-flex font-semibold text-violet-200 hover:text-white">Open related help</Link>}
          </>
        ) : (
          <>
            <p className="font-semibold text-white">This needs a support review.</p>
            <p className="mt-2 text-violet-100/75">Send the support form with your billing email, product, and any receipt or delivery details so it can be reviewed properly.</p>
            <Link href="/contact?offer=support" className="mt-3 inline-flex font-semibold text-violet-200 hover:text-white">Open support form</Link>
          </>
        )}
      </div>
    </section>
  );
}
