import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "marketvibe_admin";

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === "authenticated";
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/login");
  }
}

export function adminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL || "admin@marketvibepro.test",
    password: process.env.ADMIN_PASSWORD || "marketvibe123",
  };
}
