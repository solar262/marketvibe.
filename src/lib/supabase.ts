import { createClient } from "@supabase/supabase-js";

export const SUPABASE_SERVICE_ROLE_KEY_ENV = "SUPABASE_SERVICE_ROLE_KEY";
export const REQUIRED_SUPABASE_SERVER_ENV = ["NEXT_PUBLIC_SUPABASE_URL", SUPABASE_SERVICE_ROLE_KEY_ENV] as const;

function cleanEnv(value: string | undefined) {
  return value?.trim() || undefined;
}

const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function supabaseServerConfig() {
  return {
    url: cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRoleKey: cleanEnv(process.env[SUPABASE_SERVICE_ROLE_KEY_ENV]),
  };
}

function safeSupabaseHost() {
  const { url } = supabaseServerConfig();
  if (!url) return "missing";
  try {
    return new URL(url).host;
  } catch {
    return "invalid url";
  }
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return supabase;
}

export function getSupabaseAdmin() {
  const { url, serviceRoleKey } = supabaseServerConfig();
  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function supabaseConnectionStatus() {
  const { url, anonKey, serviceRoleKey } = supabaseServerConfig();
  const missingRequiredServerVariables = [
    !url ? "NEXT_PUBLIC_SUPABASE_URL" : "",
    !serviceRoleKey ? SUPABASE_SERVICE_ROLE_KEY_ENV : "",
  ].filter(Boolean);

  return {
    requiredServerVariableNames: REQUIRED_SUPABASE_SERVER_ENV,
    serviceRoleKeyEnvName: SUPABASE_SERVICE_ROLE_KEY_ENV,
    missingRequiredServerVariables,
    hasUrl: Boolean(url),
    hasAnonKey: Boolean(anonKey),
    hasServiceRoleKey: Boolean(serviceRoleKey),
    serverWritesEnabled: Boolean(url && serviceRoleKey),
    host: safeSupabaseHost(),
    urlLooksValid: Boolean(url?.startsWith("https://") && url.endsWith(".supabase.co")),
  };
}

export function formatSupabaseServerEnvError() {
  const status = supabaseConnectionStatus();
  if (status.missingRequiredServerVariables.length === 0) return "";
  return `Missing required Supabase server environment variables: ${status.missingRequiredServerVariables.join(", ")}. Required server variables are NEXT_PUBLIC_SUPABASE_URL and ${SUPABASE_SERVICE_ROLE_KEY_ENV}. Secret values are never logged.`;
}

let startupValidationLogged = false;

export function logSupabaseStartupValidation() {
  if (startupValidationLogged) return;
  startupValidationLogged = true;
  const status = supabaseConnectionStatus();
  if (status.missingRequiredServerVariables.length > 0) {
    console.warn(`[marketvibe] ${formatSupabaseServerEnvError()}`);
    return;
  }
  console.info(`[marketvibe] Supabase server environment ready for privileged access. Host: ${status.host}. ${SUPABASE_SERVICE_ROLE_KEY_ENV}: present. Secret values hidden.`);
}

if (typeof window === "undefined" && ["dev", "start"].includes(process.env.npm_lifecycle_event || "")) {
  logSupabaseStartupValidation();
}
