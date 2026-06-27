import type { Metadata } from "next";
import { ToolIndex } from "@/components/ToolIndex";

export const metadata: Metadata = {
  title: "Free Online Business Tools | MarketVibe",
  description: "Use free MarketVibe tools to research side hustle ideas, product ideas, affiliate niches, digital products, and online business opportunities.",
};

export default function ToolsPage() {
  return (
    <ToolIndex
      title="Free Online Business Tools"
      description="Research side hustle ideas, AI business ideas, YouTube niches, TikTok niches, product ideas, and affiliate opportunities with beginner-friendly tools."
    />
  );
}

