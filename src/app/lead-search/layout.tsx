import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MarketVibe Engine",
  description: "This legacy MarketVibe route redirects to the buyer-intent engine.",
};

export default function LeadSearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
