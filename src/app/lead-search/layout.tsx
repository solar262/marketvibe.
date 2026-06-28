import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lead Search | MarketVibe",
  description: "Search public business opportunities by country, city, business type, and service category.",
};

export default function LeadSearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
