import type { Metadata } from "next";
import { ToolIndex } from "@/components/ToolIndex";

export const metadata: Metadata = {
  title: "Free Business Calculators | Profit & Margin Tools | MarketVibe",
  description: "Calculate digital product profit, dropshipping profit, and Shopify product margins before launching a beginner online business.",
};

export default function CalculatorsPage() {
  return (
    <ToolIndex
      title="Free Business Calculators"
      description="Estimate product margins, fees, costs, and profit potential before spending money on inventory, ads, apps, or templates."
      filter={(category) => category === "Calculators"}
    />
  );
}

