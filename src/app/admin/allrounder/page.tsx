import { Bot, ShieldCheck } from "lucide-react";
import { AllRounderConsole } from "./AllRounderConsole";

export default function AdminAllRounderPage() {
  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Real operations control</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">AllRounder</h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Run connected MarketVibe operations from a phone-friendly command screen. Read-only checks run immediately. Any command that changes live data, publishes deliveries, or sends email requires explicit approval.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
          <ShieldCheck className="h-4 w-4" />
          Admin only
        </div>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <Bot className="h-5 w-5 text-emerald-700" />
          <p className="mt-4 font-semibold text-slate-950">Connected execution</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">Uses the existing buyer, opportunity, replacement, delivery, and autopilot functions.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <ShieldCheck className="h-5 w-5 text-emerald-700" />
          <p className="mt-4 font-semibold text-slate-950">Approval controlled</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">Live changes and email delivery cannot run from an accidental first click.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <Bot className="h-5 w-5 text-emerald-700" />
          <p className="mt-4 font-semibold text-slate-950">No pretend completions</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">Unsupported commands are rejected, and completed commands show the direct operation result.</p>
        </div>
      </section>

      <div className="mt-6">
        <AllRounderConsole />
      </div>
    </main>
  );
}
