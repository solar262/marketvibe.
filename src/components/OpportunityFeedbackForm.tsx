"use client";

import { useState } from "react";
import { CalendarCheck, Loader2, Reply, ThumbsDown } from "lucide-react";

type FeedbackStatus = "replied" | "booked" | "not_useful";

const feedbackOptions: Array<{
  status: FeedbackStatus;
  label: string;
  savedLabel: string;
  Icon: typeof Reply;
}> = [
  { status: "replied", label: "Replied", savedLabel: "Replied", Icon: Reply },
  { status: "booked", label: "Booked", savedLabel: "Booked", Icon: CalendarCheck },
  { status: "not_useful", label: "Not useful", savedLabel: "Not useful", Icon: ThumbsDown },
];

export function OpportunityFeedbackForm({
  assignmentId,
  email,
  accessToken,
  sessionId,
  initialStatus,
}: {
  assignmentId: string;
  email: string;
  accessToken?: string;
  sessionId?: string;
  initialStatus?: FeedbackStatus | null;
}) {
  const [selected, setSelected] = useState<FeedbackStatus | null>(initialStatus || null);
  const [loadingStatus, setLoadingStatus] = useState<FeedbackStatus | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveFeedback(status: FeedbackStatus) {
    if (loadingStatus) return;
    setLoadingStatus(status);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/opportunities/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          email,
          accessToken: accessToken || "",
          sessionId: sessionId || "",
          status,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Feedback could not be saved.");
      setSelected(status);
      setMessage(status === "not_useful" ? "Replacement queued. Future matches will avoid similar records." : "Saved. Future matches will favor similar records.");
    } catch (feedbackError) {
      setError(feedbackError instanceof Error ? feedbackError.message : "Feedback could not be saved.");
    } finally {
      setLoadingStatus(null);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="flex flex-wrap items-center gap-2">
        {feedbackOptions.map(({ status, label, savedLabel, Icon }) => {
          const active = selected === status;
          const loading = loadingStatus === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => saveFeedback(status)}
              disabled={Boolean(loadingStatus)}
              aria-pressed={active}
              title={label}
              className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                active
                  ? "border-emerald-300/60 bg-emerald-300/15 text-emerald-100"
                  : "border-white/15 bg-black/20 text-violet-100 hover:bg-white/10"
              }`}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
              {active ? savedLabel : label}
            </button>
          );
        })}
      </div>
      {message && <p className="mt-2 text-xs font-semibold text-emerald-200">{message}</p>}
      {error && <p className="mt-2 text-xs font-semibold text-red-200">{error}</p>}
    </div>
  );
}
