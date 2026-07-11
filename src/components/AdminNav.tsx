import Link from "next/link";
import { BarChart3, Bot, Database, FileUp, Mail, Radar, Settings, ShieldCheck, Workflow } from "lucide-react";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";

const links = [
  ["Dashboard", "/admin", BarChart3],
  ["Operations", "/admin/operations", Workflow],
  ["Exceptions", "/admin/exceptions", ShieldCheck],
  ["Opportunity Engine", "/admin/opportunity-engine", Radar],
  ["Inventory", "/admin/inventory", Database],
  ["CSV Import", "/admin/import", FileUp],
  ["Autopilot", "/admin/autopilot", Bot],
  ["Email", "/admin/email", Mail],
  ["Outreach", "/admin/outreach", Mail],
  ["Compliance", "/compliance", ShieldCheck],
  ["Persistence", "/admin/persistence", Database],
  ["Setup", "/admin/setup", Settings],
  ["Settings", "/admin/settings", Settings],
];

export function AdminNav() {
  return (
    <aside className="border-b border-slate-200 bg-white lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="px-4 py-5">
        <p className="text-sm font-semibold text-slate-950">MarketVibe Admin</p>
        <p className="text-xs text-slate-500">Opportunity intelligence console</p>
      </div>
      <nav className="flex flex-wrap gap-1 px-3 pb-3 lg:grid">
        {links.map(([label, href, Icon]) => (
          <Link key={href as string} href={href as string} className="inline-flex min-w-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950">
            <Icon className="h-4 w-4 shrink-0" />
            <span className="break-words">{label as string}</span>
          </Link>
        ))}
        <AdminLogoutButton />
      </nav>
    </aside>
  );
}
