import { describe, it, expect } from "vitest";
import { subscriptionService } from "../../src/lib/billing/subscription-service";
import { usageService } from "../../src/lib/billing/usage-service";

describe("Multi-Tenant Billing & Usage Isolation", () => {
  const tenantA = "acme-corp";
  const tenantB = "beta-logistics";

  it("should maintain independent subscriptions and plan tiers for different tenants", () => {
    const subA = subscriptionService.getSubscription(tenantA);
    const subB = subscriptionService.getSubscription(tenantB);

    expect(subA.organization_id).toBe(tenantA);
    expect(subB.organization_id).toBe(tenantB);

    // Update tenant B's plan to business
    subscriptionService.changePlan(tenantB, "business", "yearly");

    const updatedSubB = subscriptionService.getSubscription(tenantB);
    const currentSubA = subscriptionService.getSubscription(tenantA);

    expect(updatedSubB.plan_tier).toBe("business");
    expect(updatedSubB.billing_interval).toBe("yearly");

    // Tenant A's plan must remain untouched
    expect(currentSubA.plan_tier).toBe(subA.plan_tier);
  });

  it("should isolate payment events and invoices strictly by organization", () => {
    const paymentsA = subscriptionService.getPaymentEvents(tenantA);
    const paymentsB = subscriptionService.getPaymentEvents(tenantB);

    expect(paymentsA.every((p) => p.organization_id === tenantA)).toBe(true);
    expect(paymentsB.every((p) => p.organization_id === tenantB)).toBe(true);

    // Recording an invoice for tenant A does not leak to tenant B
    const newInvoice = subscriptionService.recordPaymentEvent({
      organization_id: tenantA,
      provider: "mock",
      provider_payment_id: "pay_isolation_test",
      amount_inr_paise: 79900,
      currency: "INR",
      status: "succeeded",
      payment_method: "upi",
      description: "Isolation Test Invoice",
    });

    const refreshedPaymentsB = subscriptionService.getPaymentEvents(tenantB);
    const foundInB = refreshedPaymentsB.find((p) => p.id === newInvoice.id);
    expect(foundInB).toBeUndefined();
  });

  it("should isolate usage counters and quota overrides per tenant", () => {
    const usageA = usageService.getTenantUsage(tenantA);
    const usageB = usageService.getTenantUsage(tenantB);

    expect(usageA.organization_id).toBe(tenantA);
    expect(usageB.organization_id).toBe(tenantB);

    // Override on tenant A does not alter tenant B's limits
    const initialQuotaB = usageB.metrics.active_contacts.max_quota;

    usageService.addOverride(
      tenantA,
      "active_contacts",
      2500,
      "Tenant A exclusive expansion"
    );

    const refreshedUsageB = usageService.getTenantUsage(tenantB);
    expect(refreshedUsageB.metrics.active_contacts.max_quota).toBe(initialQuotaB);
  });
});
