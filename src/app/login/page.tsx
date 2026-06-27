import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ADMIN_COOKIE, adminCredentials, adminSessionValue, isAdminLoginConfigured } from "@/lib/auth";
import { inputClass } from "@/lib/ui";

async function login(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const credentials = adminCredentials();

  if (!credentials.email || !credentials.password) {
    redirect("/login?error=config");
  }

  if (email === credentials.email.toLowerCase() && password === credentials.password) {
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE, adminSessionValue(), {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    redirect("/admin");
  }

  redirect("/login?error=1");
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const configured = isAdminLoginConfigured();

  return (
    <main className="mx-auto max-w-md px-4 py-12 sm:px-6 lg:px-8">
      <form action={login} className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">Admin login</h1>
        <p className="mt-2 text-sm text-slate-600">Admin access is private. Demo credentials are disabled.</p>
        {!configured && (
          <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm font-semibold text-amber-900">
            Admin login is locked until ADMIN_EMAIL and ADMIN_PASSWORD are set in Vercel.
          </p>
        )}
        <div className="mt-6 grid gap-4">
          <label className="grid gap-1 text-sm font-medium">Email<input name="email" type="email" className={inputClass} required /></label>
          <label className="grid gap-1 text-sm font-medium">Password<input name="password" type="password" className={inputClass} required /></label>
        </div>
        {params.error === "1" && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">Invalid admin credentials.</p>}
        {params.error === "config" && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">Admin credentials are not configured.</p>}
        <button disabled={!configured} className="mt-5 w-full rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400">Login</button>
        <div className="mt-4 flex justify-between text-sm font-medium">
          <Link href="/">Back to site</Link>
          <Link href="/contact">Support</Link>
        </div>
      </form>
    </main>
  );
}
