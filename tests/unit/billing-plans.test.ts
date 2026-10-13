import { describe, it, expect } from "vitest";
import {
  getAllPlans,
  getPlanDefinition,
  calculateUnitEconomics,
  SUBSCRIPTION_PLANS,
} from "../../src/lib/billing/plans";

describe("Subscription Plans & Pricing Configuration", () => {
  it("should provide exactly 3 configurable tiers: Starter, Growth, Business", () => {
    const plans = getAllPlans();
    expect(plans).toHaveLength(3);
    const tiers = plans.map((p) => p.tier);
    expect(tiers).toEqual(["starter", "growth", "business"]);
  });

  it("should match proposed Indian pricing: Starter ₹299, Growth ₹799, Business ₹1,499", () => {
    expect(SUBSCRIPTION_PLANS.starter.monthlyPriceInr).toBe(299);
    expect(SUBSCRIPTION_PLANS.growth.monthlyPriceInr).toBe(799);
    expect(SUBSCRIPTION_PLANS.business.monthlyPriceInr).toBe(1499);
  });

  it("should offer annual pricing with approximately 17% discount (2 months free)", () => {
    // Starter: ₹299 * 10 = ₹2,990
    expect(SUBSCRIPTION_PLANS.starter.yearlyPriceInr).toBe(2990);
    // Growth: ₹799 * 10 = ₹7,990
    expect(SUBSCRIPTION_PLANS.growth.yearlyPriceInr).toBe(7990);
    // Business: ₹1,499 * 10 = ₹14,990
    expect(SUBSCRIPTION_PLANS.business.yearlyPriceInr).toBe(14990);
  });

  it("should enforce distinct progressive limits across plan tiers", () => {
    const starter = SUBSCRIPTION_PLANS.starter.limits;
    const growth = SUBSCRIPTION_PLANS.growth.limits;
    const business = SUBSCRIPTION_PLANS.business.limits;

    // Team seats
    expect(starter.maxTeamMembers).toBe(2);
    expect(growth.maxTeamMembers).toBe(5);
    expect(business.maxTeamMembers).toBe(15);

    // Contacts
    expect(starter.maxContacts).toBe(500);
    expect(growth.maxContacts).toBe(5000);
    expect(business.maxContacts).toBe(20000);

    // Active workflow rules
    expect(starter.maxActiveWorkflows).toBe(3);
    expect(growth.maxActiveWorkflows).toBe(10);
    expect(business.maxActiveWorkflows).toBe(50);

    // Monthly workflow executions
    expect(starter.maxWorkflowExecutionsPerMonth).toBe(50);
    expect(growth.maxWorkflowExecutionsPerMonth).toBe(500);
    expect(business.maxWorkflowExecutionsPerMonth).toBe(2500);

    // Feature gating
    expect(starter.campaignsEnabled).toBe(false);
    expect(growth.campaignsEnabled).toBe(true);
    expect(business.campaignsEnabled).toBe(true);

    expect(starter.sharedInboxEnabled).toBe(false);
    expect(growth.sharedInboxEnabled).toBe(true);
    expect(business.sharedInboxEnabled).toBe(true);
  });

  it("should compute accurate preliminary unit economics and positive contribution margins", () => {
    const starterEcon = calculateUnitEconomics("starter");
    expect(starterEcon.monthlyPriceInr).toBe(299);
    expect(starterEcon.revenueExclGstInr).toBe(299);
    expect(starterEcon.gstInr).toBe(54); // 18% of 299 = 53.82 -> 54
    expect(starterEcon.paymentGatewayFeeInr).toBeGreaterThan(6); // ~2.36% of 299
    expect(starterEcon.contributionMarginInr).toBeGreaterThan(150);
    expect(starterEcon.contributionMarginPercentage).toBeGreaterThan(60);

    const growthEcon = calculateUnitEconomics("growth");
    expect(growthEcon.monthlyPriceInr).toBe(799);
    expect(growthEcon.contributionMarginInr).toBeGreaterThan(500);
    expect(growthEcon.contributionMarginPercentage).toBeGreaterThan(70);

    const businessEcon = calculateUnitEconomics("business");
    expect(businessEcon.monthlyPriceInr).toBe(1499);
    expect(businessEcon.contributionMarginInr).toBeGreaterThan(1000);
    expect(businessEcon.contributionMarginPercentage).toBeGreaterThan(70);
  });
});
