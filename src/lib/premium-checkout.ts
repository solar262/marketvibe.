import Stripe from "stripe";
import { hydrateCart, orderNumber } from "@/lib/checkout";
import { resolveProofPackPrice } from "@/lib/proof-pack-pricing";
import type { CartItem } from "@/lib/types";
import {
  isLegacyProductCode,
  isPremiumProductCode,
  legacyProductLabels,
  normalizeCheckoutProduct,
  premiumProducts,
  type CheckoutProductCode,
  type LegacyProductCode,
  type PremiumProductCode,
} from "@/lib/premium-products";

const liveOrigin = "https://www.marketvibe1.com";

export function checkoutOrigin(request: Request) {
  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || liveOrigin;
  return origin.includes("localhost") || origin.includes("127.0.0.1") ? origin : liveOrigin;
}

export function isCheckoutProduct(value: unknown): value is CheckoutProductCode {
  return isPremiumProductCode(value) || isLegacyProductCode(value);
}

export type BuildCheckoutInput = {
  cart?: CartItem[];
  customer?: { email?: string; name?: string };
  product?: unknown;
  niche?: string;
  leadSlug?: string;
  returnOrigin: string;
  order?: string;
};

export function buildCheckoutSessionParams({
  cart = [],
  customer,
  product,
  niche = "",
  leadSlug = "",
  returnOrigin,
  order = orderNumber(),
}: BuildCheckoutInput): Stripe.Checkout.SessionCreateParams & {
  __marketvibe: {
    premiumProduct: PremiumProductCode;
    requestedProduct: CheckoutProductCode;
    orderNumber: string;
    legacyProduct?: LegacyProductCode;
  };
} {
  const items = hydrateCart(cart || []);
  const requestedProduct: CheckoutProductCode = isCheckoutProduct(product) ? product : "proof_pack";
  const legacyProduct = isLegacyProductCode(requestedProduct) ? requestedProduct : undefined;
  const premiumProductCode = normalizeCheckoutProduct(requestedProduct);
  const premiumProduct = premiumProducts[premiumProductCode];

  if (items.length > 0) {
    return {
      mode: "payment",
      customer_email: customer?.email,
      client_reference_id: leadSlug || "cart",
      line_items: items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          product_data: { name: item.product.title, description: item.product.description },
          unit_amount: Math.round(item.product.price * 100),
        },
      })),
      metadata: {
        order_number: order,
        customer_name: customer?.name || "",
        product: "cart",
        product_code: "cart",
        plan: "cart",
        leadSlug,
        lead_slug: leadSlug,
      },
      success_url: `${returnOrigin}/payment-success?order=${order}&product=cart&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnOrigin}/cart`,
      __marketvibe: { premiumProduct: premiumProductCode, requestedProduct, orderNumber: order, legacyProduct },
    };
  }

  const successDestination = premiumProduct.successDestination;
  const successUrl = `${returnOrigin}/payment-success?order=${order}&product=${premiumProductCode}&session_id={CHECKOUT_SESSION_ID}`;
  const proofPackPrice = premiumProductCode === "proof_pack" ? resolveProofPackPrice(niche) : null;
  const unitAmount = proofPackPrice?.amount || premiumProduct.amount;

  return {
    mode: premiumProduct.mode,
    customer_email: customer?.email,
    client_reference_id: leadSlug || premiumProductCode,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: premiumProduct.currency,
          product_data: {
            name: legacyProduct ? legacyProductLabels[legacyProduct] : premiumProduct.stripeName,
            description: premiumProduct.description,
          },
          unit_amount: unitAmount,
          ...(premiumProduct.mode === "subscription" ? { recurring: { interval: "month" as const } } : {}),
        },
      },
    ],
    metadata: {
      order_number: order,
      customer_name: customer?.name || "",
      product: premiumProductCode,
      product_code: premiumProductCode,
      requested_product: requestedProduct,
      legacy_product: legacyProduct || "",
      plan: premiumProductCode,
      entitlement: premiumProduct.entitlement,
      success_destination: successDestination,
      niche: niche.trim(),
      amount_total: String(unitAmount),
      pricing_key: proofPackPrice?.matchedKey || "",
      pricing_source: proofPackPrice?.source || "",
      leadSlug,
      lead_slug: leadSlug,
    },
    subscription_data:
      premiumProduct.mode === "subscription"
        ? {
            metadata: {
              product: premiumProductCode,
              product_code: premiumProductCode,
              entitlement: premiumProduct.entitlement,
              order_number: order,
            },
          }
        : undefined,
    success_url: successUrl,
    cancel_url: `${returnOrigin}/pricing`,
    __marketvibe: { premiumProduct: premiumProductCode, requestedProduct, orderNumber: order, legacyProduct },
  };
}

