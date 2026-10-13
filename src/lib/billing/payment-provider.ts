import { BillingInterval, PlanTier } from "./types";

export interface CheckoutSessionParams {
  orgSlug: string;
  planTier: PlanTier;
  interval: BillingInterval;
  customerEmail: string;
  customerName: string;
  returnUrl: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
  provider: "mock" | "razorpay";
  amountPaise: number;
  currency: string;
  isSandbox: boolean;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  eventId?: string;
  eventType?: string;
  orgSlug?: string;
  planTier?: PlanTier;
  interval?: BillingInterval;
  amountPaise?: number;
  providerPaymentId?: string;
  providerInvoiceId?: string;
  error?: string;
  rawPayload?: Record<string, any>;
}

export interface PaymentProvider {
  readonly name: string;
  readonly isSandbox: boolean;

  createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult>;
  verifyWebhook(rawBody: string, signature: string): Promise<WebhookVerificationResult>;
  cancelSubscription(providerSubscriptionId: string): Promise<boolean>;
}

/**
 * Detailed Provider Comparison & Recommendation Analysis for Indian B2B SaaS:
 * 
 * 1. Razorpay (Recommended):
 *    - Payment Methods: UPI, UPI AutoPay, Credit/Debit cards (RuPay, Visa, Mastercard), 50+ NetBanking banks.
 *    - Recurring Mandates: Complete support for RBI e-Mandates on Cards and UPI AutoPay.
 *    - Indian Compliance: Native GST invoicing, automated TDS certificates, local settlement in INR without cross-border forex markups.
 *    - Fees: Standard 2% domestic transaction fee (plus 18% GST on the 2% fee).
 *    - Webhook Reliability: Robust signed webhooks with HMAC SHA-256 and automatic retry delivery.
 * 
 * 2. Cashfree:
 *    - Good alternative with 1.9-2% fees and UPI AutoPay, but developer tooling and ecosystem plugins are less mature than Razorpay.
 * 
 * 3. Stripe:
 *    - Exceptional global developer experience, but in India Stripe requires special business invitation,
 *      has complex RBI compliance for recurring e-mandates, and higher forex/transaction overhead for Indian businesses.
 */
export const PAYMENT_PROVIDER_COMPARISON = {
  recommended: "Razorpay",
  rationale:
    "Razorpay is the market leader for India-based SaaS with seamless UPI AutoPay, RBI-compliant recurring e-mandates, instant INR domestic settlement, and automated GST invoice issuance at standard 2% fees.",
  alternativesEvaluated: ["Cashfree", "Stripe"],
};
