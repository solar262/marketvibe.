import Link from "next/link";
import { inputClass } from "@/lib/ui";

export default function RegisterPage() {
  return <AuthShell title="Register" action="Create account" note="Customer accounts are available through the secure access link sent after purchase." />;
}

function AuthShell({ title, action, note }: { title: string; action: string; note: string }) {
  return (
    <main className="mx-auto max-w-md px-4 py-12 sm:px-6 lg:px-8">
      <form className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{note}</p>
        <div className="mt-6 grid gap-4">
          <input className={inputClass} placeholder="Name" />
          <input className={inputClass} placeholder="Email" type="email" />
          <input className={inputClass} placeholder="Password" type="password" />
        </div>
        <button type="button" className="mt-5 w-full rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white">{action}</button>
        <Link href="/login" className="mt-4 block text-center text-sm font-medium">Back to login</Link>
      </form>
    </main>
  );
}
