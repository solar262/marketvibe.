"use client";

import Link from "next/link";
import { Menu, PackageCheck, X } from "lucide-react";
import { useState } from "react";

const links = [
  ["Home", "/"],
  ["Pricing", "/pricing"],
  ["Proof Pack", "/sample"],
  ["Get Started", "/qualify"],
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#08030f]/90 shadow-sm shadow-black/20 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3 font-semibold text-white">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-violet-300/25 bg-[linear-gradient(145deg,#12051f,#4c1d95_58%,#a855f7)] text-sm font-bold text-white shadow-lg shadow-violet-950/30 ring-1 ring-white/10">MV</span>
          <span className="truncate">MarketVibe</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-300 lg:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-full px-2 py-1 transition hover:bg-white/10 hover:text-white">
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/qualify" className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110">
            <PackageCheck className="h-4 w-4" /> Check fit
          </Link>
        </div>
        <button aria-label="Menu" className="rounded-md border border-white/15 p-2 text-white lg:hidden" onClick={() => setOpen((value) => !value)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-white/10 bg-[#08030f]/95 px-4 py-4 shadow-xl shadow-black/20 backdrop-blur lg:hidden">
          <div className="flex flex-col gap-3 text-sm font-medium text-slate-200">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className="rounded-lg px-3 py-2 hover:bg-white/10 hover:text-white" onClick={() => setOpen(false)}>
                {label}
              </Link>
            ))}
            <Link href="/qualify" className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3 py-2 text-center font-semibold text-white" onClick={() => setOpen(false)}>
              Check fit
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
