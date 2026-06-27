"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem } from "@/lib/types";
import { hydrateCart } from "@/lib/checkout";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (productId: string, quantity?: number) => void;
  updateItem: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = window.localStorage.getItem("marketvibe_cart");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    window.localStorage.setItem("marketvibe_cart", JSON.stringify(items));
  }, [items]);

  const hydrated = useMemo(() => hydrateCart(items), [items]);
  const count = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = hydrated.reduce((total, item) => total + item.lineTotal, 0);

  const value: CartContextValue = {
    items,
    count,
    subtotal,
    addItem(productId, quantity = 1) {
      setItems((current) => {
        const existing = current.find((item) => item.productId === productId);
        if (existing) {
          return current.map((item) =>
            item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item,
          );
        }
        return [...current, { productId, quantity }];
      });
    },
    updateItem(productId, quantity) {
      setItems((current) =>
        quantity <= 0
          ? current.filter((item) => item.productId !== productId)
          : current.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
      );
    },
    removeItem(productId) {
      setItems((current) => current.filter((item) => item.productId !== productId));
    },
    clearCart() {
      setItems([]);
    },
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
