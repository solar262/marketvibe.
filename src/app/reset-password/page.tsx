import { inputClass } from "@/lib/ui";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-12 sm:px-6 lg:px-8">
      <form className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-stone-950">Choose new password</h1>
        <div className="mt-6 grid gap-4">
          <input className={inputClass} placeholder="New password" type="password" />
          <input className={inputClass} placeholder="Confirm password" type="password" />
        </div>
        <button type="button" className="mt-5 w-full rounded-md bg-stone-950 px-4 py-3 text-sm font-semibold text-white">Update password</button>
      </form>
    </main>
  );
}
