"use client";

import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { useState } from "react";

const links = [
  ["Home", "/"],
  ["Free Leads", "/free-leads"],
  ["Lead Search", "/lead-search"],
  ["Reddit Radar", "/reddit-radar"],
  ["Pricing", "/pricing"],
  ["Contact", "/contact"],
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050b16]/90 shadow-sm shadow-black/20 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3 font-semibold text-white">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-300/20 bg-[linear-gradient(145deg,#020617,#0f172a_55%,#065f46)] text-sm font-bold text-white shadow-lg shadow-emerald-950/30 ring-1 ring-white/10">MV</span>
          <span className="truncate">MarketVibe Lead Engine</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-300 lg:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-full px-2 py-1 transition hover:bg-white/10 hover:text-white">
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/free-leads" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:brightness-105">
            <Search className="h-4 w-4" /> Get Free Leads
          </Link>
        </div>
        <button aria-label="Menu" className="rounded-md border border-white/15 p-2 text-white lg:hidden" onClick={() => setOpen((value) => !value)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-white/10 bg-[#050b16]/95 px-4 py-4 shadow-xl shadow-black/20 backdrop-blur lg:hidden">
          <div className="flex flex-col gap-3 text-sm font-medium text-slate-200">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className="rounded-lg px-3 py-2 hover:bg-white/10 hover:text-white" onClick={() => setOpen(false)}>
                {label}
              </Link>
            ))}
            <Link href="/free-leads" className="rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-300 px-3 py-2 text-center font-semibold text-slate-950" onClick={() => setOpen(false)}>
              Get Free Leads
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
