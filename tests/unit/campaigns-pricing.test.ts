import { describe, it, expect } from "vitest";
import { calculateCampaignPricing, META_PRICING_CONFIG } from "../../src/lib/campaigns/pricing";

describe("Milestone 6: Meta WhatsApp Cloud API Pricing Unit Tests", () => {
  it("should calculate correct marketing conversation cost based on Meta rate card (₹0.82/msg)", () => {
    const pricing = calculateCampaignPricing("marketing", 100, 120, 10, 10, 500);

    expect(pricing.unitCostINR).toBe(0.82);
    expect(pricing.eligibleRecipients).toBe(100);
    expect(pricing.estimatedTotalCostINR).toBe(82.0); // 100 * 0.82
    expect(pricing.currency).toBe("INR");
    expect(pricing.isOverBudget).toBe(false);
  });

  it("should calculate correct utility conversation cost (₹0.35/msg)", () => {
    const pricing = calculateCampaignPricing("utility", 200, 200, 0, 0, 1000);

    expect(pricing.unitCostINR).toBe(0.35);
    expect(pricing.estimatedTotalCostINR).toBe(70.0); // 200 * 0.35
    expect(pricing.isOverBudget).toBe(false);
  });

  it("should flag isOverBudget when campaign exceeds monthly spending limit", () => {
    // Current usage ₹9,500 + estimated ₹600 = ₹10,100 (exceeds ₹10,000 monthly limit)
    const pricing = calculateCampaignPricing("marketing", 1000, 1000, 0, 0, 9500);

    expect(pricing.estimatedTotalCostINR).toBe(820.0);
    expect(pricing.isOverBudget).toBe(true);
  });
});
