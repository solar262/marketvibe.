import { createPublicKey, verify, type JsonWebKey } from "node:crypto";

type OidcClaims = {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  repository_owner?: string;
  workflow_ref?: string;
  ref?: string;
};

type Jwk = JsonWebKey & { kid?: string; alg?: string };
let keyCache: { expiresAt: number; keys: Jwk[] } | null = null;

function decodePart(value: string) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Record<string, unknown>;
}

export function validMarketVibeActionsClaims(claims: OidcClaims, nowSeconds = Math.floor(Date.now() / 1000)) {
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud || ""];
  return claims.iss === "https://token.actions.githubusercontent.com"
    && audience.includes("https://www.marketvibe1.com/automation")
    && claims.repository_owner === "solar262"
    && Boolean(claims.workflow_ref?.includes("/.github/workflows/marketvibe-operations.yml@"))
    && Boolean(claims.ref === "refs/heads/main")
    && Number(claims.exp || 0) > nowSeconds
    && Number(claims.nbf || 0) <= nowSeconds + 30;
}

async function githubKeys() {
  if (keyCache && keyCache.expiresAt > Date.now()) return keyCache.keys;
  const response = await fetch("https://token.actions.githubusercontent.com/.well-known/jwks", {
    signal: AbortSignal.timeout(5_000),
    next: { revalidate: 3600 },
  });
  if (!response.ok) throw new Error(`github_oidc_jwks_http_${response.status}`);
  const payload = await response.json() as { keys?: Jwk[] };
  const keys = Array.isArray(payload.keys) ? payload.keys : [];
  keyCache = { expiresAt: Date.now() + 3_600_000, keys };
  return keys;
}

export async function isGitHubActionsAuthorized(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const header = decodePart(parts[0]) as { kid?: string; alg?: string };
    const claims = decodePart(parts[1]) as OidcClaims;
    if (header.alg !== "RS256" || !header.kid || !validMarketVibeActionsClaims(claims)) return false;
    const key = (await githubKeys()).find((candidate) => candidate.kid === header.kid && (!candidate.alg || candidate.alg === "RS256"));
    if (!key) return false;
    return verify(
      "RSA-SHA256",
      Buffer.from(`${parts[0]}.${parts[1]}`),
      createPublicKey({ key: key as unknown as JsonWebKey, format: "jwk" }),
      Buffer.from(parts[2], "base64url"),
    );
  } catch {
    return false;
  }
}
