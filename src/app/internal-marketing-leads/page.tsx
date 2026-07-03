"use client";

import { useEffect, useState } from "react";
import { Copy, ExternalLink, RefreshCw } from "lucide-react";

type InternalMarketingLead = {
  id: string;
  text: string;
  sourceName?: string;
  author?: string;
  dateText?: string;
  url?: string;
  queryUsed?: string;
  sourceUsed?: string;
  painPoint?: string;
  replyDraft?: string;
  outreachMode?: string;
  status?: string;
  outreachStatus?: string;
  fitRank: number;
  label: string;
  analysis: {
    action: string;
    score: string;
    risk: string;
    intent: string;
    reason: string;
    quickReply: string;
    deeperReply: string;
    manualNote: string;
  };
};

type InternalMarketingLeadResponse = {
  importedAt: string;
  storage: string;
  counts: { imported: number; scored: number; good: number; manualOnly: number; skipped: number };
  results: InternalMarketingLead[];
  skipped: InternalMarketingLead[];
};

type LeadHuntStatus = {
  active: boolean;
  paused: boolean;
  recoveryNeeded?: boolean;
  status: string;
  imported: number;
  skipped: number;
  failed: number;
  updatedAt: string;
};

function leadStatus(card: InternalMarketingLead) {
  return card.status || card.outreachStatus || "new";
}

function isContacted(card: InternalMarketingLead) {
  return /contacted|replied|follow_up|closed/i.test(leadStatus(card));
}

function isNotFit(card: InternalMarketingLead) {
  return /not_fit|skip|skipped|bad|closed/i.test(leadStatus(card));
}

function createInboxMessage(card: InternalMarketingLead) {
  const pain = card.painPoint || card.analysis?.intent?.replace(/-/g, " ") || "getting more clients";
  return `Hey, I saw your post about ${pain}.\n\nI built something for exactly that purpose — it finds local businesses with visible website issues and gives you a ready-to-use lead report plus outreach angle.\n\nGive it a try and see if it’s what you’re looking for:\nhttps://www.marketvibe1.com`;
}

export default function InternalMarketingLeadsPage() {
  const [data, setData] = useState<InternalMarketingLeadResponse | null>(null);
  const [huntStatus, setHuntStatus] = useState<LeadHuntStatus | null>(null);
  const [showSkipped, setShowSkipped] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [replyNotice, setReplyNotice] = useState("");

  async function load() {
    const [leadsResponse, statusResponse] = await Promise.all([
      fetch("/api/internal-marketing-leads", { cache: "no-store" }),
      fetch("/api/internal-marketing-leads/hunt-status", { cache: "no-store" }),
    ]);
    setData(await leadsResponse.json());
    if (statusResponse.ok) setHuntStatus(await statusResponse.json());
  }

  useEffect(() => {
    let ignore = false;

    void Promise.all([
      fetch("/api/internal-marketing-leads", { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/internal-marketing-leads/hunt-status", { cache: "no-store" }).then((response) => response.ok ? response.json() : null),
    ])
      .then(([nextData, nextStatus]: [InternalMarketingLeadResponse, LeadHuntStatus | null]) => {
        if (!ignore) {
          setData(nextData);
          if (nextStatus) setHuntStatus(nextStatus);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/internal-marketing-leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, outreachStatus: status }),
    });
    await load();
  }

  async function copyInboxMessage(card: InternalMarketingLead) {
    await copy(createInboxMessage(card));
    setReplyNotice("Inbox message copied. Open the post/profile, paste it, then press Send manually.");
    window.setTimeout(() => setReplyNotice(""), 2600);
  }

  function openReplyLink(url?: string) {
    if (!url) {
      setReplyNotice("No reply link available");
      window.setTimeout(() => setReplyNotice(""), 1800);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const allResults = data?.results || [];
  const pendingCards = allResults.filter((card) => !isContacted(card) && !isNotFit(card));
  const doneCards = allResults.filter((card) => isContacted(card) || isNotFit(card));
  const skippedCards = data?.skipped || [];
  const cards = showSkipped ? skippedCards : showDone ? doneCards : pendingCards;
  const contactedCount = allResults.filter((card) => /contacted|replied|follow_up/i.test(leadStatus(card))).length;
  const notFitCount = allResults.filter((card) => /not_fit|skip|skipped|bad|closed/i.test(leadStatus(card))).length;

  return (
    <main className="min-h-screen bg-[#050b16] px-4 py-8 text-white sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Buyer Radar Contact Queue</p>
          <h1 className="mt-3 text-4xl font-semibold">Manual Contact Queue</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Buyer Radar finds service sellers who are asking for clients/leads. Use this queue to copy the MarketVibe inbox message, open the post, and mark each person as contacted, skipped, or not fit.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs text-slate-400">Pending</p><p className="text-2xl font-bold text-white">{pendingCards.length}</p></div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs text-slate-400">Contacted</p><p className="text-2xl font-bold text-emerald-300">{contactedCount}</p></div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs text-slate-400">Good</p><p className="text-2xl font-bold text-emerald-300">{data?.counts.good || 0}</p></div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs text-slate-400">Manual</p><p className="text-2xl font-bold text-cyan-200">{data?.counts.manualOnly || 0}</p></div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs text-slate-400">Not fit</p><p className="text-2xl font-bold text-amber-200">{notFitCount}</p></div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs text-slate-400">Store</p><p className="text-sm font-bold text-white">{data?.storage || "memory"}</p></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={load} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-bold text-slate-950"><RefreshCw className="h-4 w-4" /> Refresh</button>
            <button onClick={() => { setShowDone(false); setShowSkipped(false); }} className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-5 py-3 font-bold text-emerald-100">Pending queue</button>
            <button onClick={() => { setShowDone((value) => !value); setShowSkipped(false); }} className="rounded-full border border-white/15 bg-white/10 px-5 py-3 font-bold text-white">{showDone ? "Hide done" : "Show done"}</button>
            <button onClick={() => { setShowSkipped((value) => !value); setShowDone(false); }} className="rounded-full border border-white/15 bg-white/10 px-5 py-3 font-bold text-white">{showSkipped ? "Hide skipped" : "Show skipped"}</button>
            <button onClick={() => { window.location.href = "/api/internal-marketing-leads/export"; }} className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-5 py-3 font-bold text-emerald-100">Export CSV</button>
            <a href="/lead-hunt-autopilot" className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 font-bold text-cyan-100">Back to Buyer Radar</a>
          </div>
          {copied && <p className="mt-4 text-sm font-semibold text-emerald-300">Copied.</p>}
          {replyNotice && <p className="mt-4 text-sm font-semibold text-amber-200">{replyNotice}</p>}
          <p className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm font-semibold text-cyan-50">
            Automation status: {huntStatus?.recoveryNeeded ? "Recovery needed" : huntStatus?.paused ? "Paused" : huntStatus?.active ? "Running" : huntStatus?.status?.includes("Stopped") ? "Stopped" : "Queued/imported"}.
            Imported {huntStatus?.imported || data?.counts.imported || 0}, skipped {huntStatus?.skipped || 0}, failed {huntStatus?.failed || 0}.
          </p>
        </div>

        <div className="mt-6 grid gap-4">
          {cards.length ? cards.map((card) => {
            const inboxMessage = createInboxMessage(card);
            return (
              <article key={card.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100">{card.label} · {card.fitRank}/100</span>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-slate-100">{card.analysis.score}</span>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-slate-100">{card.analysis.risk} risk</span>
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">{leadStatus(card)}</span>
                </div>
                <div className="mt-4 grid gap-2 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm leading-6 text-slate-200 sm:grid-cols-2">
                  <p><strong className="text-white">Group:</strong> {card.sourceName || "Facebook source"}</p>
                  <p><strong className="text-white">Author:</strong> {card.author || "Unknown author"}</p>
                  <p><strong className="text-white">Timestamp:</strong> {card.dateText || "Not available"}</p>
                  <p><strong className="text-white">Score:</strong> {card.fitRank}</p>
                  <p><strong className="text-white">Intent:</strong> {card.analysis.intent}</p>
                  <p><strong className="text-white">Pain point:</strong> {card.painPoint || card.analysis.intent.replace(/-/g, " ")}</p>
                  {card.queryUsed && <p><strong className="text-white">Query:</strong> {card.queryUsed}</p>}
                  {card.sourceUsed && <p><strong className="text-white">Source:</strong> {card.sourceUsed}</p>}
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-300"><strong className="text-white">Why:</strong> {card.analysis.reason}</p>
                <p className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4 leading-7 text-slate-100"><strong className="text-white">Post:</strong> {card.text || "Facebook post imported"}</p>
                <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
                  <p className="text-sm font-bold text-emerald-100">Inbox message</p>
                  <p className="mt-2 whitespace-pre-line leading-7 text-emerald-50">{inboxMessage}</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <button onClick={() => void copyInboxMessage(card)} className="rounded-full bg-white px-4 py-3 font-bold text-slate-950"><Copy className="mr-2 inline h-4 w-4" />Copy inbox message</button>
                  <button onClick={() => openReplyLink(card.url)} className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-3 text-center font-bold text-cyan-100"><ExternalLink className="mr-2 inline h-4 w-4" />Open post/profile</button>
                  <button onClick={() => void updateStatus(card.id, "contacted")} className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 font-bold text-emerald-100">Mark contacted</button>
                  <button onClick={() => void updateStatus(card.id, "not_fit")} className="rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-3 font-bold text-amber-100">Not fit</button>
                  <button onClick={() => copy(card.analysis.quickReply)} className="rounded-full border border-white/15 bg-white/10 px-4 py-3 font-bold text-white">Copy public reply</button>
                  <button onClick={() => copy(card.analysis.deeperReply)} className="rounded-full border border-white/15 bg-white/10 px-4 py-3 font-bold text-white">Copy deeper</button>
                  <button onClick={() => void updateStatus(card.id, "follow_up")} className="rounded-full border border-white/15 bg-white/10 px-4 py-3 font-bold text-white">Follow up</button>
                  <button onClick={() => void updateStatus(card.id, "closed")} className="rounded-full border border-rose-300/25 bg-rose-300/10 px-4 py-3 font-bold text-rose-100">Do not show again</button>
                </div>
              </article>
            );
          }) : (
            <div className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 p-8 text-center text-amber-50">
              No pending contact queue items here. Run Buyer Radar, refresh, or open Show done / Show skipped.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
