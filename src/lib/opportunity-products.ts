import type { PremiumProductCode } from "@/lib/premium-products";

export type ExclusivityMode =
  | "non_exclusive"
  | "customer_exclusive"
  | "niche_exclusive"
  | "geographic_exclusive"
  | "time_limited_exclusive";

export type ReplacementPolicy = "none" | "objective_failures" | "admin_review" | "automatic";

export type OpportunityProductConfig = {
  productCode: PremiumProductCode;
  opportunityQuantity: number;
  deliveryFrequency: "once" | "daily" | "weekly" | "monthly";
  exclusivityMode: ExclusivityMode;
  exclusivityPeriodDays: number;
  minimumFitScore: number;
  minimumIntentScore: number;
  minimumEvidenceScore: number;
  maximumRecordAgeDays: number;
  allowProfileOnly: boolean;
  replacementPolicy: ReplacementPolicy;
  replacementAllowance: number;
};

export const opportunityProductConfigs: Record<PremiumProductCode, OpportunityProductConfig> = {
  proof_pack: {
    productCode: "proof_pack",
    opportunityQuantity: 30,
    deliveryFrequency: "once",
    exclusivityMode: "non_exclusive",
    exclusivityPeriodDays: 0,
    minimumFitScore: 50,
    minimumIntentScore: 35,
    minimumEvidenceScore: 50,
    maximumRecordAgeDays: 90,
    allowProfileOnly: false,
    replacementPolicy: "admin_review",
    replacementAllowance: 3,
  },
  radar: {
    productCode: "radar",
    opportunityQuantity: 20,
    deliveryFrequency: "weekly",
    exclusivityMode: "customer_exclusive",
    exclusivityPeriodDays: 14,
    minimumFitScore: 55,
    minimumIntentScore: 40,
    minimumEvidenceScore: 55,
    maximumRecordAgeDays: 45,
    allowProfileOnly: false,
    replacementPolicy: "objective_failures",
    replacementAllowance: 10,
  },
  growth_desk: {
    productCode: "growth_desk",
    opportunityQuantity: 50,
    deliveryFrequency: "weekly",
    exclusivityMode: "niche_exclusive",
    exclusivityPeriodDays: 30,
    minimumFitScore: 60,
    minimumIntentScore: 45,
    minimumEvidenceScore: 60,
    maximumRecordAgeDays: 30,
    allowProfileOnly: false,
    replacementPolicy: "automatic",
    replacementAllowance: 25,
  },
};

export function opportunityConfigForProduct(productCode: PremiumProductCode) {
  return opportunityProductConfigs[productCode];
}

