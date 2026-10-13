import {
  CheckoutSessionParams,
  CheckoutSessionResult,
  PaymentProvider,
  WebhookVerificationResult,
} from "./payment-provider";
import { getPlanDefinition } from "./plans";
import { subscriptionService } from "./subscription-service";
import crypto from "crypto";

export class MockPaymentProvider implements PaymentProvider {
  public readonly name = "Mock Sandbox Provider";
  public readonly isSandbox = true;

  private mockSecret = "sandbox_webhook_secret_for_local_testing";

  public async createCheckoutSession(
    params: CheckoutSessionParams
  ): Promise<CheckoutSessionResult> {
    const plan = getPlanDefinition(params.planTier);
    const amountInr =
      params.interval === "yearly" ? plan.yearlyPriceInr : plan.monthlyPriceInr;
    const amountPaise = amountInr * 100;

    const sessionId = `mock_sess_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const checkoutUrl = `/app/${params.orgSlug}/subscription?session=${sessionId}&tier=${params.planTier}&interval=${params.interval}&checkout=sandbox`;

    return {
      sessionId,
      checkoutUrl,
      provider: "mock",
      amountPaise,
      currency: "INR",
      isSandbox: true,
    };
  }

  public async verifyWebhook(
    rawBody: string,
    signature: string
  ): Promise<WebhookVerificationResult> {
    if (!signature) {
      return { isValid: false, error: "Missing webhook signature header." };
    }

    try {
      const parsed = JSON.parse(rawBody);

      // Verify HMAC SHA-256 signature against mockSecret
      const expectedSignature = crypto
        .createHmac("sha256", this.mockSecret)
        .update(rawBody)
        .digest("hex");

      // In sandbox mode, also allow explicit test bypass signature "test-mock-signature"
      const isValid =
        signature === expectedSignature || signature === "test-mock-signature";

      if (!isValid) {
        return {
          isValid: false,
          error: "Webhook signature verification failed (invalid HMAC hash).",
        };
      }

      return {
        isValid: true,
        eventId: parsed.event_id || `evt_${Date.now()}`,
        eventType: parsed.event_type || "payment.succeeded",
        orgSlug: parsed.organization_id || parsed.org_slug,
        planTier: parsed.plan_tier,
        interval: parsed.billing_interval || "monthly",
        amountPaise: parsed.amount_inr_paise || 79900,
        providerPaymentId: parsed.provider_payment_id || `pay_mock_${Date.now()}`,
        providerInvoiceId: parsed.provider_invoice_id || `inv_mock_${Date.now()}`,
        rawPayload: parsed,
      };
    } catch (err: any) {
      return {
        isValid: false,
        error: `Malformed JSON payload in webhook body: ${err?.message}`,
      };
    }
  }

  public async cancelSubscription(
    providerSubscriptionId: string
  ): Promise<boolean> {
    // Sandbox cancellation succeeds immediately
    return true;
  }

  /**
   * Generates a valid test payload and matching HMAC signature for integration tests
   */
  public generateSignedTestWebhook(payload: Record<string, any>): {
    rawBody: string;
    signature: string;
  } {
    const rawBody = JSON.stringify(payload);
    const signature = crypto
      .createHmac("sha256", this.mockSecret)
      .update(rawBody)
      .digest("hex");
    return { rawBody, signature };
  }

  /**
   * Explicit server-side simulated payment confirmation for Sandbox UI
   */
  public simulateSuccessfulPayment(
    orgSlug: string,
    planTier: any,
    interval: any
  ): { success: boolean; message: string } {
    const plan = getPlanDefinition(planTier);
    const amountInr = interval === "yearly" ? plan.yearlyPriceInr : plan.monthlyPriceInr;
    const amountPaise = amountInr * 100;

    // 1. Authoritatively update subscription status
    subscriptionService.changePlan(orgSlug, planTier, interval);

    // 2. Record payment event in tenant billing history
    subscriptionService.recordPaymentEvent({
      organization_id: orgSlug,
      provider: "mock",
      provider_payment_id: `pay_sandbox_${Date.now()}`,
      provider_invoice_id: `inv_sandbox_${Date.now()}`,
      amount_inr_paise: amountPaise,
      currency: "INR",
      status: "succeeded",
      payment_method: "upi",
      receipt_url: `https://receipts.business-os.in/inv_sandbox_${Date.now()}.pdf`,
      description: `${plan.name} Plan — ${interval === "yearly" ? "Annual" : "Monthly"} Subscription (Sandbox)`,
    });

    return {
      success: true,
      message: `Sandbox payment of ₹${amountInr.toLocaleString("en-IN")} processed authoritatively. Workspace upgraded to ${plan.name}.`,
    };
  }
}

export const mockPaymentProvider = new MockPaymentProvider();
