import { sendQueuedOutreach } from "./outreach";
import { getSupabaseAdmin } from "./supabase";

function configuredDailyLimit() {
  const value = Number(process.env.OUTREACH_DAILY_SEND_LIMIT || "50");
  if (!Number.isFinite(value)) return 50;
  return Math.max(1, Math.min(Math.floor(value), 100));
}

export async function sendQueuedOutreachHardCapped(maxToSend?: number) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { sent: 0, skipped: true, error: "Supabase server writes are not configured." };
  }

  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { count: attemptedToday, error } = await supabase
    .from("outreach_queue")
    .select("id", { count: "exact", head: true })
    .in("status", ["sending", "sent"])
    .gte("last_attempt_at", since.toISOString());

  if (error) {
    return { sent: 0, skipped: true, error: `Daily send-cap check failed: ${error.message}` };
  }

  const dailyLimit = configuredDailyLimit();
  const remaining = Math.max(0, dailyLimit - (attemptedToday || 0));
  if (remaining <= 0) {
    return { sent: 0, skipped: true, error: "Daily send limit reached." };
  }

  const requested = Number(maxToSend || remaining);
  const safeRequested = Number.isFinite(requested) ? Math.max(1, Math.floor(requested)) : remaining;
  return sendQueuedOutreach(Math.min(remaining, safeRequested));
}
