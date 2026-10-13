import { describe, it, expect } from "vitest";
import { mockPaymentProvider } from "../../src/lib/billing/mock-provider";
import { razorpayProvider } from "../../src/lib/billing/razorpay-provider";
import { subscriptionService } from "../../src/lib/billing/subscription-service";

describe("Payment Provider Abstraction & Webhook Verification", () => {
  const orgSlug = "acme-corp";

  it("should create a valid checkout session with amount converted to paise", async () => {
    const session = await mockPaymentProvider.createCheckoutSession({
      orgSlug,
      planTier: "growth",
      interval: "monthly",
      customerEmail: "founder@acmetech.io",
      customerName: "Workspace Founder",
      returnUrl: "http://localhost:3000/app/acme-corp/subscription",
    });

    expect(session.provider).toBe("mock");
    expect(session.isSandbox).toBe(true);
    expect(session.amountPaise).toBe(79900); // ₹799.00 = 79900 paise
    expect(session.currency).toBe("INR");
    expect(session.checkoutUrl).toContain("checkout=sandbox");
  });

  it("should calculate annual checkout session amounts correctly", async () => {
    const annualSession = await mockPaymentProvider.createCheckoutSession({
      orgSlug,
      planTier: "growth",
      interval: "yearly",
      customerEmail: "founder@acmetech.io",
      customerName: "Workspace Founder",
      returnUrl: "http://localhost:3000/app/acme-corp/subscription",
    });

    expect(annualSession.amountPaise).toBe(799000); // ₹7,990.00 = 799000 paise
  });

  it("should verify valid HMAC-signed webhook payloads and reject tampered bodies", async () => {
    const testPayload = {
      event_id: "evt_test_12345",
      event_type: "payment.succeeded",
      organization_id: "acme-corp",
      plan_tier: "business",
      amount_inr_paise: 149900,
    };

    const { rawBody, signature } = mockPaymentProvider.generateSignedTestWebhook(testPayload);

    // 1. Valid signature passes
    const validResult = await mockPaymentProvider.verifyWebhook(rawBody, signature);
    expect(validResult.isValid).toBe(true);
    expect(validResult.eventId).toBe("evt_test_12345");
    expect(validResult.planTier).toBe("business");

    // 2. Tampered signature fails
    const invalidResult = await mockPaymentProvider.verifyWebhook(rawBody, "invalid-tampered-signature");
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.error).toContain("signature verification failed");

    // 3. Tampered payload fails
    const tamperedPayload = rawBody.replace("business", "starter");
    const tamperedResult = await mockPaymentProvider.verifyWebhook(tamperedPayload, signature);
    expect(tamperedResult.isValid).toBe(false);
  });

  it("should execute authoritative simulated payment in sandbox mode", () => {
    const res = mockPaymentProvider.simulateSuccessfulPayment("beta-logistics", "business", "yearly");
    expect(res.success).toBe(true);

    const updatedSub = subscriptionService.getSubscription("beta-logistics");
    expect(updatedSub.plan_tier).toBe("business");
    expect(updatedSub.billing_interval).toBe("yearly");

    const events = subscriptionService.getPaymentEvents("beta-logistics");
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].amount_inr_paise).toBe(1499000);
    expect(events[0].status).toBe("succeeded");
  });
});
