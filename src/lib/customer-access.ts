import { createHmac, timingSafeEqual } from "node:crypto";
import Stripe from "stripe";
import {
  isLegacyProductCode,
  isPremiumProductCode,
  legacyProductMap,
  premiumProducts,
  type PremiumProductCode,
} from "@/lib/premium-products";

const tokenTtlMs = 90 * 24 * 60 * 60 * 1000;

function normalizedEmail(value: string) {
  return value.trim().toLowerCase();
}

function tokenSecret() {
  return (
    process.env.CUSTOMER_ACCESS_SECRET ||
    process.env.STRIPE_WEBHOOK_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    ""
  ).trim();
}

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string) {
  const secret = tokenSecret();
  if (!secret) return "";
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createCustomerAccessToken(email: string) {
  const cleanEmail = normalizedEmail(email);
  if (!cleanEmail) return "";
  const payload = base64Url(JSON.stringify({ email: cleanEmail, exp: Date.now() + tokenTtlMs }));
  const signature = sign(payload);
  return signature ? `${payload}.${signature}` : "";
}

export function verifyCustomerAccessToken(email: string, token: string) {
  const cleanEmail = normalizedEmail(email);
  const [payload, signature] = token.split(".");
  if (!cleanEmail || !payload || !signature) return false;
  const expected = sign(payload);
  if (!expected || !safeEqual(signature, expected)) return false;

  try {
    const parsed = JSON.parse(fromBase64Url(payload)) as { email?: string; exp?: number };
    return normalizedEmail(parsed.email || "") === cleanEmail && Number(parsed.exp || 0) > Date.now();
  } catch {
    return false;
  }
}

function classifyCheckoutSession(session: Stripe.Checkout.Session): PremiumProductCode {
  const product = session.metadata?.product_code || session.metadata?.product || session.metadata?.plan;
  if (isPremiumProductCode(product)) return product;
  if (isLegacyProductCode(product)) return legacyProductMap[product];
  if (session.mode === "subscription") {
    const amount = session.amount_total || 0;
    return amount >= premiumProducts.growth_desk.amount ? "growth_desk" : "radar";
  }
  return "proof_pack";
}

export async function resolveCustomerAccess({
  email,
  accessToken,
  sessionId,
}: {
  email?: string | null;
  accessToken?: string | null;
  sessionId?: string | null;
}) {
  const cleanEmail = normalizedEmail(email || "");

  if (sessionId === "demo" && process.env.NODE_ENV !== "production") {
    return { ok: true, email: cleanEmail, source: "demo" as const, productCode: "proof_pack" as PremiumProductCode };
  }

  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const sessionEmail = normalizedEmail(session.customer_details?.email || session.customer_email || "");
    const paid = session.payment_status === "paid" || session.mode === "subscription";
    if (paid && sessionEmail) {
      return {
        ok: true,
        email: sessionEmail,
        source: "stripe_session" as const,
        productCode: classifyCheckoutSession(session),
      };
    }
  }

  if (cleanEmail && accessToken && verifyCustomerAccessToken(cleanEmail, accessToken)) {
    return { ok: true, email: cleanEmail, source: "access_token" as const, productCode: null };
  }

  return { ok: false, email: cleanEmail, source: "none" as const, productCode: null };
}

export function appendCustomerAccessParams(path: string, email: string, accessToken: string) {
  const params = new URLSearchParams();
  params.set("email", normalizedEmail(email));
  if (accessToken) params.set("access_token", accessToken);
  return `${path}?${params.toString()}`;
}
