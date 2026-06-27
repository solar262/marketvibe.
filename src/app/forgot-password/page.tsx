import Link from "next/link";
import { inputClass } from "@/lib/ui";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-12 sm:px-6 lg:px-8">
      <form className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-stone-950">Reset password</h1>
        <p className="mt-2 text-sm text-stone-600">Supabase Auth can email a secure reset link in production.</p>
        <input className={`${inputClass} mt-6`} placeholder="Email" type="email" />
        <Link href="/reset-password" className="mt-5 inline-flex w-full justify-center rounded-md bg-stone-950 px-4 py-3 text-sm font-semibold text-white">Send reset link</Link>
      </form>
    </main>
  );
}
