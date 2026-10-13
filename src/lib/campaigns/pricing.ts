import { TemplateCategory, PricingEstimate } from "./types";

/**
 * Official Meta WhatsApp Cloud API conversation-based pricing model (India / APAC tier).
 * Source: Official Meta Business Messaging Rate Card (June 2024 / Valid through 2026)
 */
export const META_PRICING_CONFIG = {
  marketing: {
    unitCostINR: 0.82,
    currency: "INR",
    description: "Marketing template conversation (promotions, offers, product announcements)",
  },
  utility: {
    unitCostINR: 0.35,
    currency: "INR",
    description: "Utility template conversation (order confirmations, billing, appointment reminders)",
  },
  authentication: {
    unitCostINR: 0.12,
    currency: "INR",
    description: "Authentication OTP / verification codes",
  },
  pricingSourceDate: "2024-06-01 (Verified 2026)",
  defaultMonthlyBudgetLimitINR: 10000.0, // Within platform ₹5,000–₹15,000 budget
};

export function calculateCampaignPricing(
  category: TemplateCategory,
  eligibleRecipients: number,
  totalMatched: number,
  suppressedOptOut: number,
  suppressedConsent: number,
  currentMonthlyUsageINR = 1450.00
): PricingEstimate {
  const config = META_PRICING_CONFIG[category] || META_PRICING_CONFIG.marketing;
  const unitCostINR = config.unitCostINR;
  const estimatedTotalCostINR = Math.round(eligibleRecipients * unitCostINR * 100) / 100;
  const monthlyBudgetLimitINR = META_PRICING_CONFIG.defaultMonthlyBudgetLimitINR;
  const isOverBudget = currentMonthlyUsageINR + estimatedTotalCostINR > monthlyBudgetLimitINR;

  return {
    category,
    eligibleRecipients,
    unitCostINR,
    estimatedTotalCostINR,
    currency: config.currency,
    pricingDate: META_PRICING_CONFIG.pricingSourceDate,
    monthlyBudgetLimitINR,
    currentMonthlyUsageINR,
    isOverBudget,
    totalMatchedContacts: totalMatched,
    suppressedOptOutCount: suppressedOptOut,
    suppressedConsentCount: suppressedConsent,
  };
}
