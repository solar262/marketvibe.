import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "marketvibe_admin";

export function adminCredentials() {
  return {
    email: (process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
    password: (process.env.ADMIN_PASSWORD || "").trim(),
  };
}

export function isAdminLoginConfigured() {
  const credentials = adminCredentials();
  return Boolean(credentials.email && credentials.password);
}

function adminSessionSecret() {
  return (process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "").trim();
}

export function adminSessionValue() {
  const credentials = adminCredentials();
  const secret = adminSessionSecret();
  if (!credentials.email || !secret) return "";

  return createHmac("sha256", secret)
    .update(`marketvibe-admin:${credentials.email}`)
    .digest("hex");
}

function safeEqual(a: string, b: string) {
  if (!a || !b) return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function isAdminAuthenticated() {
  if (!isAdminLoginConfigured()) return false;
  const expected = adminSessionValue();
  const cookieStore = await cookies();
  const actual = cookieStore.get(ADMIN_COOKIE)?.value || "";
  return safeEqual(actual, expected);
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/login");
  }
}

export async function requireAdminApi() {
  return isAdminAuthenticated();
}
