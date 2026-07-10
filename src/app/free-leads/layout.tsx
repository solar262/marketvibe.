import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MarketVibe Proof Pack",
  description: "This legacy MarketVibe route redirects to the Proof Pack checkout flow.",
};

export default function FreeLeadsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
