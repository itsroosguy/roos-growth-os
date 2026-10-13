import { NextRequest, NextResponse } from "next/server";
import { mockPaymentProvider } from "@/lib/billing/mock-provider";
import { razorpayProvider } from "@/lib/billing/razorpay-provider";
import { subscriptionService } from "@/lib/billing/subscription-service";

// In-memory deduplication set for processed webhook event IDs
const processedWebhookEventIds = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get("x-razorpay-signature") ||
      req.headers.get("x-mock-signature") ||
      req.headers.get("x-signature") ||
      "";

    if (!signature) {
      return NextResponse.json(
        { error: "Missing required webhook signature header" },
        { status: 400 }
      );
    }

    // Determine provider to verify with
    const provider = razorpayProvider.isConfigured()
      ? razorpayProvider
      : mockPaymentProvider;

    const verification = await provider.verifyWebhook(rawBody, signature);

    if (!verification.isValid) {
      return NextResponse.json(
        { error: verification.error || "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const {
      eventId,
      eventType,
      orgSlug,
      planTier,
      interval,
      amountPaise,
      providerPaymentId,
      providerInvoiceId,
    } = verification;

    // Idempotent deduplication check
    if (eventId && processedWebhookEventIds.has(eventId)) {
      return NextResponse.json(
        { success: true, message: "Duplicate webhook event already processed" },
        { status: 200 }
      );
    }

    if (eventId) {
      processedWebhookEventIds.add(eventId);
    }

    if (!orgSlug) {
      return NextResponse.json(
        { error: "Webhook event missing organization identifier" },
        { status: 400 }
      );
    }

    // Process authoritative payment events
    switch (eventType) {
      case "payment.succeeded":
      case "subscription.activated":
      case "subscription.charged": {
        if (planTier) {
          subscriptionService.changePlan(orgSlug, planTier, interval || "monthly");
        } else {
          subscriptionService.reactivateSubscription(orgSlug);
        }

        subscriptionService.recordPaymentEvent({
          organization_id: orgSlug,
          provider: provider.isSandbox ? "mock" : "razorpay",
          provider_payment_id: providerPaymentId || `pay_${Date.now()}`,
          provider_invoice_id: providerInvoiceId || `inv_${Date.now()}`,
          amount_inr_paise: amountPaise || 79900,
          currency: "INR",
          status: "succeeded",
          payment_method: "upi",
          description: `Authoritative payment verified (${eventType})`,
        });
        break;
      }

      case "payment.failed": {
        // Mark subscription past_due with 3-day grace period
        subscriptionService.updateSubscription(orgSlug, {
          status: "past_due",
          grace_period_ends_at: new Date(Date.now() + 86400000 * 3).toISOString(),
        });

        subscriptionService.recordPaymentEvent({
          organization_id: orgSlug,
          provider: provider.isSandbox ? "mock" : "razorpay",
          provider_payment_id: providerPaymentId || `pay_fail_${Date.now()}`,
          amount_inr_paise: amountPaise || 0,
          currency: "INR",
          status: "failed",
          payment_method: "upi",
          description: "Recurring payment attempt failed. Grace period active (3 days).",
        });
        break;
      }

      case "subscription.cancelled": {
        subscriptionService.cancelSubscription(
          orgSlug,
          "Cancelled via payment provider webhook",
          false
        );
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({
      success: true,
      eventId,
      eventType,
      organization_id: orgSlug,
      processed: true,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal webhook processing error", details: err?.message },
      { status: 500 }
    );
  }
}
