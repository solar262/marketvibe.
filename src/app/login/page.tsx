import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ADMIN_COOKIE, adminCredentials } from "@/lib/auth";
import { inputClass } from "@/lib/ui";

async function login(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const credentials = adminCredentials();
  if (email === credentials.email && password === credentials.password) {
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE, "authenticated", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
    redirect("/admin");
  }
  redirect("/login?error=1");
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <main className="mx-auto max-w-md px-4 py-12 sm:px-6 lg:px-8">
      <form action={login} className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">Login</h1>
        <p className="mt-2 text-sm text-slate-600">Demo admin login: admin@marketvibepro.test / marketvibe123</p>
        <div className="mt-6 grid gap-4">
          <label className="grid gap-1 text-sm font-medium">Email<input name="email" type="email" className={inputClass} required defaultValue="admin@marketvibepro.test" /></label>
          <label className="grid gap-1 text-sm font-medium">Password<input name="password" type="password" className={inputClass} required defaultValue="marketvibe123" /></label>
        </div>
        {params.error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">Invalid admin credentials.</p>}
        <button className="mt-5 w-full rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Login</button>
        <div className="mt-4 flex justify-between text-sm font-medium">
          <Link href="/register">Register</Link>
          <Link href="/forgot-password">Forgot password</Link>
        </div>
      </form>
    </main>
  );
}
