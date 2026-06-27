import type { CartItem } from "./types";
import { products } from "./data";

export function hydrateCart(items: CartItem[]) {
  return items
    .map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId && candidate.active);
      if (!product) return null;
      return { ...item, product, lineTotal: product.price * item.quantity };
    })
    .filter(Boolean) as Array<CartItem & { product: (typeof products)[number]; lineTotal: number }>;
}

export function cartSubtotal(items: CartItem[]) {
  return hydrateCart(items).reduce((total, item) => total + item.lineTotal, 0);
}

export function orderNumber() {
  return `MV-${Math.floor(100000 + Math.random() * 900000)}`;
}
