"use client";

import Link from "next/link";
import { LayoutDashboard, Menu, Search, X } from "lucide-react";
import { useState } from "react";

const links = [
  ["Home", "/"],
  ["Dashboard", "/dashboard"],
  ["Lead Search", "/lead-search"],
  ["Pricing", "/pricing"],
  ["Compliance", "/compliance"],
  ["Contact", "/contact"],
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 font-semibold text-slate-950">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-emerald-700 text-sm text-white">MV</span>
          <span>MarketVibe Lead Engine</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-700 lg:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-slate-950">
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Link aria-label="Admin dashboard" title="Admin dashboard" href="/admin" className="rounded-md border border-slate-200 p-2 hover:bg-slate-50">
            <LayoutDashboard className="h-5 w-5" />
          </Link>
          <Link href="/lead-search" className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            <Search className="h-4 w-4" /> Find Leads
          </Link>
        </div>
        <button aria-label="Menu" className="rounded-md border border-slate-200 p-2 lg:hidden" onClick={() => setOpen((value) => !value)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-3 text-sm font-medium">
            {links.map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}>
                {label}
              </Link>
            ))}
            <Link href="/admin" onClick={() => setOpen(false)}>Admin</Link>
          </div>
        </div>
      )}
    </header>
  );
}
