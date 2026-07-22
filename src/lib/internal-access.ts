import { timingSafeEqual } from "crypto";
import { isAdminAuthenticated } from "@/lib/auth";

export const INTERNAL_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-MarketVibe-Internal-Key",
};

export const INTERNAL_ACCESS_HEADER = "x-marketvibe-internal-key";
export const INTERNAL_ACCESS_QUERY_PARAM = "internal_key";

export function internalAccessKey() {
  return (
    process.env.OPERATOR_NERVE_NETWORK_API_KEY ||
    process.env.BUYER_RADAR_INTERNAL_API_KEY ||
    process.env.INTERNAL_MARKETING_API_KEY ||
    process.env.LEAD_HUNT_INTERNAL_KEY ||
    ""
  ).trim();
}

function safeEqual(a: string, b: string) {
  if (!a || !b) return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function requestInternalAccessKey(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1] || "";
  const header = request.headers.get(INTERNAL_ACCESS_HEADER) || "";
  const query = new URL(request.url).searchParams.get(INTERNAL_ACCESS_QUERY_PARAM) || "";
  return (header || bearer || query).trim();
}

export function validateInternalAccessKey(request: Request) {
  const key = requestInternalAccessKey(request);
  if (!key) return { ok: false as const, status: "Missing key" };
  const configuredKey = internalAccessKey();
  if (!configuredKey || !safeEqual(key, configuredKey)) {
    return { ok: false as const, status: "Invalid key" };
  }
  return { ok: true as const, status: "Connected" };
}

export async function hasInternalApiAccess(request: Request) {
  const validated = validateInternalAccessKey(request);
  if (validated.ok) return true;

  const configuredKey = internalAccessKey();
  if (await isAdminAuthenticated()) return true;
  return process.env.NODE_ENV !== "production" && !configuredKey;
}
