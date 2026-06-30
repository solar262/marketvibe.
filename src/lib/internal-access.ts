import { isAdminAuthenticated } from "@/lib/auth";

export const INTERNAL_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-MarketVibe-Internal-Key",
};

export function internalAccessKey() {
  return process.env.INTERNAL_MARKETING_API_KEY || process.env.LEAD_HUNT_INTERNAL_KEY || "";
}

function requestKey(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1] || "";
  const header = request.headers.get("x-marketvibe-internal-key") || "";
  const query = new URL(request.url).searchParams.get("internal_key") || "";
  return header || bearer || query;
}

export async function hasInternalApiAccess(request: Request) {
  const configuredKey = internalAccessKey();
  if (configuredKey && requestKey(request) === configuredKey) return true;
  if (await isAdminAuthenticated()) return true;
  return process.env.NODE_ENV !== "production" && !configuredKey;
}
