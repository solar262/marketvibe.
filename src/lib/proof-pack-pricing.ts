import { premiumProducts } from "@/lib/premium-products";

export type ProofPackPrice = {
  amount: number;
  currency: string;
  normalizedNiche: string;
  matchedKey: string;
  source: "configured" | "default";
};

export function normalizeNichePriceKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function validAmount(value: unknown) {
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(numeric)) return null;
  const amount = Math.round(numeric);
  return amount > 0 && amount < 10_000_000 ? amount : null;
}

export function parseProofPackNichePrices(raw = process.env.PROOF_PACK_NICHE_PRICES_JSON || "") {
  if (!raw.trim()) return {};

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    const prices: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const amount = validAmount(value);
      if (!amount) continue;
      const normalizedKey = key === "default" ? "default" : normalizeNichePriceKey(key);
      if (normalizedKey) prices[normalizedKey] = amount;
    }
    return prices;
  } catch {
    return {};
  }
}

export function resolveProofPackPrice(niche = "", priceMapJson?: string): ProofPackPrice {
  const prices = parseProofPackNichePrices(priceMapJson);
  const normalizedNiche = normalizeNichePriceKey(niche);
  const defaultAmount = prices.default || premiumProducts.proof_pack.amount;
  const configuredAmount = normalizedNiche ? prices[normalizedNiche] : undefined;

  return {
    amount: configuredAmount || defaultAmount,
    currency: premiumProducts.proof_pack.currency,
    normalizedNiche,
    matchedKey: configuredAmount ? normalizedNiche : prices.default ? "default" : "premium_products.proof_pack",
    source: configuredAmount || prices.default ? "configured" : "default",
  };
}
