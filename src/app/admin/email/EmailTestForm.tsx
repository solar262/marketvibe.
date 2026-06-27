"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function EmailTestForm() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendTest() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/admin/email/test", { method: "POST" });
    const data = await response.json();
    setLoading(false);
    setMessage(data.ok ? `Test email sent to ${data.sentTo}.` : data.error || "Test email failed.");
  }

  return (
    <div>
      <button onClick={sendTest} disabled={loading} className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Send admin test email
      </button>
      {message && <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
    </div>
  );
}

