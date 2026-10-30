"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTenant } from "@/lib/organizations/tenant-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SettingsShell } from "@/components/layout/settings-shell";
import { RestrictedState } from "@/components/ui/restricted-state";
import {
  BillingInterval,
  PlanTier,
} from "@/lib/billing/types";
import {
  getAllPlans,
  getPlanDefinition,
  calculateUnitEconomics,
} from "@/lib/billing/plans";
import { subscriptionService } from "@/lib/billing/subscription-service";
import { usageService } from "@/lib/billing/usage-service";
import { mockPaymentProvider } from "@/lib/billing/mock-provider";
import {
  Check,
  CreditCard,
  Download,
  AlertTriangle,
  Zap,
  TrendingUp,
  Receipt,
  RotateCcw,
  Clock,
  ShieldCheck,
  Lock,
  Building2,
  ArrowRight,
  DollarSign,
  Landmark,
} from "lucide-react";
import { useMounted } from "@/lib/use-mounted";
import { cn, formatINR } from "@/lib/utils";

export default function SubscriptionPage() {
  const { currentOrg, isOwner, userRole, canAccessFunds } = useTenant();
  const mounted = useMounted();
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [selectedPlanForDowngrade, setSelectedPlanForDowngrade] = useState<PlanTier | null>(null);
  const [downgradeWarnings, setDowngradeWarnings] = useState<string[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Load live state
  const subscription = subscriptionService.getSubscription(currentOrg.slug);
  const usageSummary = usageService.getTenantUsage(currentOrg.slug);
  const paymentEvents = subscriptionService.getPaymentEvents(currentOrg.slug);
  const plans = getAllPlans();
  const unitEconomics = calculateUnitEconomics(subscription.plan_tier);

  const handleSimulatePayment = (tier: PlanTier) => {
    const res = mockPaymentProvider.simulateSuccessfulPayment(
      currentOrg.slug,
      tier,
      interval
    );
    setFeedbackMessage(res.message);
    setSelectedPlanForDowngrade(null);
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const handleInitiatePlanChange = (targetTier: PlanTier) => {
    const currentTier = subscription.plan_tier;
    const tierRanks: Record<PlanTier, number> = {
      starter: 1,
      growth: 2,
      business: 3,
    };

    if (tierRanks[targetTier] < tierRanks[currentTier]) {
      // Downgrade pre-flight checks
      const evalRes = subscriptionService.evaluateDowngrade(
        currentOrg.slug,
        targetTier,
        {
          teamMembers: usageSummary.metrics.team_seats.current_count,
          contacts: usageSummary.metrics.active_contacts.current_count,
          leads: usageSummary.metrics.active_leads.current_count,
          activeWorkflows: usageSummary.metrics.active_workflows.current_count,
        }
      );
      setSelectedPlanForDowngrade(targetTier);
      setDowngradeWarnings(evalRes.warnings);
    } else {
      // Upgrade immediately in Sandbox
      handleSimulatePayment(targetTier);
    }
  };

  const handleCancelSubscription = () => {
    subscriptionService.cancelSubscription(
      currentOrg.slug,
      "Customer initiated cancellation from dashboard",
      false
    );
    setShowCancelModal(false);
    setFeedbackMessage(
      "Your subscription has been marked to cancel at the end of the billing period. Your existing records remain completely safe in read-only mode."
    );
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const handleReactivate = () => {
    subscriptionService.reactivateSubscription(currentOrg.slug);
    setFeedbackMessage("Subscription reactivated successfully!");
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const currentPlanDef = getPlanDefinition(subscription.plan_tier);

  // Clearance Guard: Only Admin (Level 1) can view overall fund transfers & billing details.
  if (!canAccessFunds) {
    return (
      <SettingsShell
        orgSlug={currentOrg.slug}
        title="Subscription & Limits"
        description="Plan tiers, quota limits, and billing settlements."
      >
        <RestrictedState
          title="Billing Clearance Restricted"
          description={`Your active credential is ${userRole.replace("_", " ")}. Financial controls and payment settlements require Administrator clearance.`}
          requiredRole="Administrator or Owner"
        />
      </SettingsShell>
    );
  }

  return (
    <SettingsShell
      orgSlug={currentOrg.slug}
      title="Subscription & Limits"
      description={`Manage plan tier, quota consumption, and review unit economics for ${currentOrg.name}.`}
      badge={
        <span className="rounded-full bg-[#E4F7EF] border border-[#BDECD7] text-[11px] uppercase font-semibold px-2.5 py-0.5 text-[#0A7A53] shadow-2xs">
          {subscription.status}
        </span>
      }
      contentClassName="max-w-[960px]"
    >
      <div className="space-y-6">
        {/* Monthly / Annual Toggle */}
        <div className="flex justify-end pb-1">
          <div className="inline-flex items-center bg-[#EDE8E0] p-1 rounded-[12px] shadow-2xs">
            <button
              type="button"
              onClick={() => setInterval("monthly")}
              className={cn(
                "px-3.5 py-1.5 text-[13px] font-medium rounded-[9px] transition-all cursor-pointer",
                interval === "monthly"
                  ? "bg-[#0B0D12] text-white shadow-xs font-semibold"
                  : "text-[#666C78] hover:text-[#12141A]"
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval("yearly")}
              className={cn(
                "px-3.5 py-1.5 text-[13px] font-medium rounded-[9px] transition-all flex items-center gap-1.5 cursor-pointer",
                interval === "yearly"
                  ? "bg-[#0B0D12] text-white shadow-xs font-semibold"
                  : "text-[#666C78] hover:text-[#12141A]"
              )}
            >
              <span>Annual</span>
              <span className="text-[11px] bg-[#E4F7EF] text-[#0A7A53] border border-[#BDECD7] font-semibold px-2 py-0.5 rounded-full">
                Save ~17%
              </span>
            </button>
          </div>
        </div>

        {feedbackMessage && (
          <div className="rounded-[12px] bg-[#E4F7EF] p-4 border border-[#BDECD7] text-[13.5px] text-[#0A7A53] flex items-center justify-between shadow-2xs animate-fade-rise">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-[#0A7A53]" />
              <span className="font-medium">{feedbackMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackMessage(null)}
              className="font-medium underline ml-4 hover:text-[#065F46] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Active Subscription Overview Card */}
        <div className="card-ref p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
            <div className="space-y-1">
              <span className="text-[11.5px] font-semibold text-[#666C78] uppercase tracking-wider block">
                Current Plan
              </span>
              <div className="text-[22px] font-semibold text-[#12141A] tracking-tight">
                {currentPlanDef.name}
              </div>
              <p className="text-[15px] text-[#FF5A1F] font-semibold tabular-nums">
                {formatINR(interval === "yearly" ? currentPlanDef.yearlyPriceInr : currentPlanDef.monthlyPriceInr)} /{" "}
                {interval === "yearly" ? "year" : "month"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11.5px] font-semibold text-[#666C78] uppercase tracking-wider block">
                Billing Cycle
              </span>
              <div className="text-[14px] font-semibold text-[#12141A] capitalize flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#FF5A1F]" />
                <span>{subscription.billing_interval} interval</span>
              </div>
              <p className="text-[13px] text-[#666C78] font-normal">
                Renews on{" "}
                {new Date(subscription.current_period_end).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11.5px] font-semibold text-[#666C78] uppercase tracking-wider block">
                Payment Method
              </span>
              <div className="text-[14px] font-semibold text-[#12141A] flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-[#12B886]" />
                <span>UPI AutoPay / e-Mandate</span>
              </div>
              <p className="text-[13px] text-[#666C78] font-normal">
                India-compliant Razorpay Gateway
              </p>
            </div>

            <div className="flex flex-col justify-center items-start lg:items-end space-y-2">
              {subscription.cancel_at_period_end ? (
                <div className="space-y-1.5 w-full sm:w-auto">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF8E6] text-[#B45309] border border-[#FDE68A]">
                    Cancels at end of period
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReactivate}
                    className="w-full text-xs rounded-[10px] border-[#EDE8E0] bg-white hover:bg-[#FAF9F5] text-[#12141A] font-semibold shadow-2xs h-9 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-[#FF5A1F]" />
                    Reactivate Plan
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelModal(true)}
                  className="text-xs rounded-[10px] border-[#EDE8E0] bg-white hover:bg-[#FFE9EA] hover:text-[#B42336] hover:border-[#FFCCD0] text-[#666C78] font-medium shadow-2xs h-9 px-3.5 transition-colors cursor-pointer"
                >
                  Cancel Subscription
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Usage Quota Progress Bars */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[17px] font-semibold text-[#12141A]">
                Usage &amp; Quota Consumption
              </h2>
              <p className="text-[13px] text-[#666C78] font-normal mt-0.5">
                Actual resource metrics for billing period {usageSummary.period_month}. Resets monthly.
              </p>
            </div>
            {usageSummary.is_any_exceeded && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFE9EA] text-[#B42336] border border-[#FFCCD0]">
                Quota Limit Reached
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(usageSummary.metrics).map((metric) => {
              const isExceeded = metric.is_exceeded;
              const isWarning = metric.is_warning;
              const barColor = isExceeded
                ? "bg-[#E5484D]"
                : isWarning
                ? "bg-[#F5A524]"
                : "bg-gradient-to-r from-[#FF7A3D] to-[#FF5A1F]";

              return (
                <div key={metric.metric_name} className="card-ref p-4.5 rounded-[14px] space-y-2.5">
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="text-[13px] font-semibold text-[#12141A] leading-snug">
                        {metric.label}
                      </span>
                      {metric.admin_override_quota && (
                        <span className="text-[11px] text-[#0A7A53] font-semibold shrink-0">
                          (+{metric.admin_override_quota} bonus)
                        </span>
                      )}
                    </div>
                    <div
                      className="text-[12px] tabular-nums text-[#666C78]"
                      suppressHydrationWarning
                    >
                      <span className="font-semibold text-[#12141A]">
                        {mounted ? metric.current_count.toLocaleString("en-IN") : metric.current_count.toLocaleString("en-IN")}
                      </span>{" "}
                      / {metric.max_quota.toLocaleString("en-IN")} {metric.unit}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-[#EDE8E0] rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all duration-300 rounded-full", barColor)}
                      style={{ width: `${Math.min(metric.percentage_used, 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[12px] text-[#666C78]">
                    <span className="tabular-nums font-semibold text-[#12141A]" suppressHydrationWarning>
                      {mounted ? metric.percentage_used : metric.percentage_used}% consumed
                    </span>
                    {isExceeded ? (
                      <span className="text-[#B42336] font-medium flex items-center text-[11px] bg-[#FFE9EA] px-2 py-0.5 rounded-full border border-[#FFCCD0]">
                        <AlertTriangle className="h-3 w-3 mr-1 inline" /> At limit
                      </span>
                    ) : isWarning ? (
                      <span className="text-[#8F5300] font-medium text-[11px] bg-[#FFF3D6] px-2 py-0.5 rounded-full border border-[#FFE5A3]">
                        Near limit (&gt;80%)
                      </span>
                    ) : (
                      <span className="text-[#0A7A53] font-medium text-[11px] bg-[#E4F7EF] px-2 py-0.5 rounded-full border border-[#BDECD7]">
                        Within quota
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Available Plans Grid */}
        <div className="space-y-4">
          <div>
            <h2 className="text-[17px] font-semibold text-[#12141A]">
              Available Subscription Plans
            </h2>
            <p className="text-[13px] text-[#666C78] font-normal mt-0.5">
              Transparent pricing with zero hidden fees. Upgrade or adjust anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {plans.map((p) => {
              const isCurrent = p.tier === subscription.plan_tier;
              const price = interval === "yearly" ? p.yearlyPriceInr : p.monthlyPriceInr;

              return (
                <div
                  key={p.tier}
                  className={cn(
                    "card-ref relative p-6 rounded-[16px] flex flex-col justify-between transition-all duration-150",
                    p.popular
                      ? "border-[#FF5A1F] ring-1 ring-[#FF5A1F]/30 shadow-[0_4px_24px_-8px_rgba(255,90,31,0.22)]"
                      : "border-[#EDE8E0]"
                  )}
                >
                  {/* Integrated top ribbon banner (zero badge overlap) */}
                  {p.popular && (
                    <div className="bg-gradient-to-r from-[#FF7A3D] to-[#FF5A1F] text-white text-[11px] font-semibold tracking-wider uppercase py-1 text-center -mx-6 -mt-6 mb-4 rounded-t-[15px] shadow-2xs">
                      Most Popular
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="text-[18px] font-semibold text-[#12141A] leading-tight">{p.name}</h3>
                        <p className="mt-0.5 text-[12.5px] text-[#666C78] font-normal leading-snug">
                          {p.tagline}
                        </p>
                      </div>
                      {isCurrent && (
                        <span className="text-[10.5px] uppercase font-semibold px-2.5 py-0.5 rounded-full bg-[#E4F7EF] text-[#0A7A53] border border-[#BDECD7] shrink-0">
                          Current
                        </span>
                      )}
                    </div>

                    <div className="mt-4 pb-4 border-b border-[#EDE8E0]">
                      <span className="text-[32px] font-semibold tabular-nums text-[#12141A] tracking-tight">
                        ₹{price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[13px] text-[#666C78] font-normal ml-1.5">
                        / {interval === "yearly" ? "year" : "month"}
                      </span>
                      <span className="block text-[11px] text-[#8A909D] font-medium mt-0.5">
                        + 18% GST applicable
                      </span>
                    </div>

                    <div className="py-4 space-y-2.5">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#666C78] mb-1">
                        Entitlements &amp; Features
                      </div>
                      {p.features.map((feat) => (
                        <div key={feat} className="flex items-start text-[12.5px] text-[#343A46] font-normal leading-snug">
                          <Check className="h-4 w-4 text-[#12B886] stroke-[2.5] mr-2 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#EDE8E0]">
                    {isCurrent ? (
                      <button
                        type="button"
                        disabled
                        className="w-full h-10 rounded-[12px] bg-[#FAF9F5] border border-[#EDE8E0] text-[#12141A] font-semibold text-[13px] flex items-center justify-center gap-1.5 shadow-2xs select-none"
                      >
                        <Check className="h-4 w-4 text-[#12B886] stroke-[2.5]" />
                        <span>Active Plan</span>
                      </button>
                    ) : (
                      <Button
                        variant={p.popular ? "primary" : "outline"}
                        className={cn(
                          "w-full h-10 rounded-[12px] text-[13.5px] font-medium cursor-pointer shadow-xs flex items-center justify-center gap-1.5",
                          p.popular
                            ? "bg-gradient-to-b from-[#FF7A3D] to-[#FF5A1F] text-white hover:opacity-95"
                            : "border-[#EDE8E0] bg-white hover:bg-[#FAF9F5] text-[#12141A]"
                        )}
                        disabled={!isOwner}
                        onClick={() => handleInitiatePlanChange(p.tier)}
                      >
                        <span>{isOwner ? "Switch to " + p.name : "Owner access required"}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Unit Economics & Cost Breakdown */}
        <div className="card-ref p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#EDE8E0]">
            <div className="h-8 w-8 rounded-[8px] bg-[#EAEEFF] text-[#2A3DB5] flex items-center justify-center">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-[#12141A]">
                Unit Economics &amp; Contribution Margin ({currentPlanDef.name} Plan)
              </h2>
              <p className="text-[12px] text-[#666C78] font-normal">
                Direct operational expenses deducted per monthly subscription under standard Indian SaaS cost assumptions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 bg-[#FAF9F5] rounded-[12px] border border-[#EDE8E0] space-y-1">
              <span className="text-[11px] font-medium text-[#666C78] uppercase tracking-wider block">Subscription Revenue</span>
              <span className="text-[20px] font-semibold tabular-nums text-[#12141A] block">₹{unitEconomics.monthlyPriceInr}</span>
              <span className="text-[11px] text-[#8A909D] font-normal block">(excl. GST)</span>
            </div>
            <div className="p-3.5 bg-[#FAF9F5] rounded-[12px] border border-[#EDE8E0] space-y-1">
              <span className="text-[11px] font-medium text-[#666C78] uppercase tracking-wider block">Gateway Fees (2.36%)</span>
              <span className="text-[20px] font-semibold tabular-nums text-[#B42336] block">-₹{unitEconomics.paymentGatewayFeeInr}</span>
              <span className="text-[11px] text-[#8A909D] font-normal block">Domestic UPI/Card</span>
            </div>
            <div className="p-3.5 bg-[#FAF9F5] rounded-[12px] border border-[#EDE8E0] space-y-1">
              <span className="text-[11px] font-medium text-[#666C78] uppercase tracking-wider block">Direct Compute</span>
              <span className="text-[20px] font-semibold tabular-nums text-[#B42336] block">-₹{unitEconomics.infrastructureAllocationInr}</span>
              <span className="text-[11px] text-[#8A909D] font-normal block">Server &amp; DB compute</span>
            </div>
            <div className="p-3.5 rounded-[12px] border border-[#BDECD7] bg-[#E4F7EF] space-y-1">
              <span className="text-[11px] font-semibold text-[#0A7A53] uppercase tracking-wider block">Contribution Margin</span>
              <span className="text-[20px] font-semibold tabular-nums text-[#0A7A53] block">₹{unitEconomics.contributionMarginInr}</span>
              <span className="text-[11px] text-[#0A7A53] font-semibold block">{unitEconomics.contributionMarginPercentage}% margin</span>
            </div>
          </div>
        </div>

        {/* Overall Fund Transfers & Banking Settlements */}
        <div className="card-ref overflow-hidden !p-0">
          <div className="p-5 border-b border-[#EDE8E0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
            <div className="flex items-center space-x-2.5">
              <div className="h-9 w-9 rounded-[10px] bg-[#FFEFEA] border border-[#FFDFC4] flex items-center justify-center text-[#FF5A1F]">
                <Landmark className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[16px] font-semibold text-[#12141A]">Overall Fund Transfers &amp; Settlements</h2>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#FFF8E6] text-[#92400E] border border-[#FDE68A] tabular-nums">
                    Level 1 Admin Only
                  </span>
                </div>
                <p className="text-[12px] text-[#666C78] font-normal mt-0.5">
                  Bank disbursement accounts, payment gateway settlements &amp; overall liquidity transfers
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[11px] tabular-nums font-semibold uppercase tracking-wider text-[#666C78] block">Total Settled (MTD)</span>
              <span className="text-[18px] font-semibold tabular-nums text-[#12141A]">₹ 24,50,000</span>
            </div>
          </div>

          {/* Banking Summary Cards */}
          <div className="p-4.5 grid grid-cols-1 sm:grid-cols-3 gap-3.5 border-b border-[#EDE8E0] bg-[#FAF9F5]">
            <div className="p-3.5 bg-white rounded-[12px] border border-[#EDE8E0] shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-[#666C78] uppercase tracking-wider block">Available Balance</span>
              <span className="text-[18px] font-semibold tabular-nums text-[#0A7A53] block">₹ 3,12,450.00</span>
              <span className="text-[11px] text-[#666C78] font-normal block">Ready for auto-disbursement</span>
            </div>
            <div className="p-3.5 bg-white rounded-[12px] border border-[#EDE8E0] shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-[#666C78] uppercase tracking-wider block">Linked Settlement Bank</span>
              <span className="text-[14px] font-semibold text-[#12141A] block truncate">HDFC Corporate Bank</span>
              <span className="text-[11px] tabular-nums text-[#666C78] font-normal block">A/C ••••••••8491 (RTGS/NEFT)</span>
            </div>
            <div className="p-3.5 bg-white rounded-[12px] border border-[#EDE8E0] shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-[#666C78] uppercase tracking-wider block">Clearance Level</span>
              <span className="text-[14px] font-semibold text-[#FF5A1F] block">Admin Full Financial Access</span>
              <span className="text-[11px] text-[#B42336] font-medium block">Restricted from Senior &amp; Jr Managers</span>
            </div>
          </div>

          {/* Fund Transfer Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EDE8E0] bg-[#FAF9F5] text-[#666C78] font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-4">Transfer Ref</th>
                  <th className="py-2.5 px-4">Gateway / Route</th>
                  <th className="py-2.5 px-4">Beneficiary Account</th>
                  <th className="py-2.5 px-4">Transfer Amount</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Settled Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE8E0]/70 font-medium">
                <tr className="hover:bg-[#FAF9F5] transition-colors">
                  <td className="py-3 px-4 tabular-nums font-semibold text-[#12141A]">TRF-884102</td>
                  <td className="py-3 px-4 text-[#12141A]">Razorpay Payouts Direct</td>
                  <td className="py-3 px-4 text-[#666C78] tabular-nums">Operating Current A/C ••8491</td>
                  <td className="py-3 px-4 tabular-nums font-semibold text-[#12141A]">₹ 1,45,000</td>
                  <td className="py-3 px-4">
                    <span className="text-[10.5px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#E4F7EF] text-[#0A7A53] border border-[#BDECD7]">
                      Settled
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-[#666C78]">Today, 09:30 AM</td>
                </tr>
                <tr className="hover:bg-[#FAF9F5] transition-colors">
                  <td className="py-3 px-4 tabular-nums font-semibold text-[#12141A]">TRF-883918</td>
                  <td className="py-3 px-4 text-[#12141A]">Stripe Automated Payout</td>
                  <td className="py-3 px-4 text-[#666C78] tabular-nums">Operating Current A/C ••8491</td>
                  <td className="py-3 px-4 tabular-nums font-semibold text-[#12141A]">₹ 2,20,000</td>
                  <td className="py-3 px-4">
                    <span className="text-[10.5px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#E4F7EF] text-[#0A7A53] border border-[#BDECD7]">
                      Settled
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-[#666C78]">Yesterday, 14:15 PM</td>
                </tr>
                <tr className="hover:bg-[#FAF9F5] transition-colors">
                  <td className="py-3 px-4 tabular-nums font-semibold text-[#12141A]">TRF-882045</td>
                  <td className="py-3 px-4 text-[#12141A]">Razorpay Payouts Direct</td>
                  <td className="py-3 px-4 text-[#666C78] tabular-nums">Treasury Reserve Pool ••1024</td>
                  <td className="py-3 px-4 tabular-nums font-semibold text-[#12141A]">₹ 3,75,000</td>
                  <td className="py-3 px-4">
                    <span className="text-[10.5px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#E4F7EF] text-[#0A7A53] border border-[#BDECD7]">
                      Settled
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-[#666C78]">Oct 20, 2026</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment History & Receipts */}
        <div className="card-ref overflow-hidden !p-0">
          <div className="p-5 border-b border-[#EDE8E0] flex items-center space-x-2.5 bg-white">
            <div className="h-8 w-8 rounded-[8px] bg-[#EAEEFF] text-[#2A3DB5] flex items-center justify-center">
              <Receipt className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-[#12141A]">Billing History &amp; GST Invoices</h2>
              <p className="text-[12px] text-[#666C78] font-normal mt-0.5">
                Verified tax invoices and transaction records for {currentOrg.name}.
              </p>
            </div>
          </div>

          <div>
            {paymentEvents.length === 0 ? (
              <p className="text-[13px] text-[#666C78] py-8 text-center font-normal">
                No previous payments recorded.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#EDE8E0] bg-[#FAF9F5] text-[#666C78] font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Invoice ID</th>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4">Amount</th>
                      <th className="py-2.5 px-4">Method</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE8E0]/70">
                    {paymentEvents.map((event) => (
                      <tr key={event.id} className="hover:bg-[#FAF9F5] transition-colors">
                        <td className="py-3 px-4 tabular-nums text-[#666C78]">
                          {new Date(event.created_at).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4 tabular-nums text-[#12141A] font-semibold">
                          {event.provider_invoice_id || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-[#12141A] font-medium">
                          {event.description}
                        </td>
                        <td className="py-3 px-4 tabular-nums font-semibold text-[#12141A]">
                          ₹{(event.amount_inr_paise / 100).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 capitalize tabular-nums text-[#666C78]">
                          {event.payment_method}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border",
                              event.status === "succeeded"
                                ? "bg-[#E4F7EF] text-[#0A7A53] border-[#BDECD7]"
                                : "bg-[#FFE9EA] text-[#B42336] border-[#FFCCD0]"
                            )}
                          >
                            {event.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-[#12141A] hover:text-[#FF5A1F] hover:bg-[#FFF4ED] font-semibold rounded-[8px]"
                            onClick={() => alert(`Downloading verified tax invoice ${event.provider_invoice_id}`)}
                          >
                            <Download className="h-3.5 w-3.5 mr-1 text-[#FF5A1F]" />
                            PDF
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Downgrade Warning Modal */}
        {selectedPlanForDowngrade && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-rise">
            <div className="max-w-md w-full bg-white rounded-[16px] border border-[#EDE8E0] shadow-xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-[#B45309]">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-[17px] font-semibold text-[#12141A]">
                  Confirm Plan Downgrade
                </h3>
              </div>
              <p className="text-[13px] text-[#666C78] font-normal leading-relaxed">
                Before switching to {getPlanDefinition(selectedPlanForDowngrade).name}, please review the following restrictions:
              </p>

              <div className="space-y-2.5">
                {downgradeWarnings.length > 0 ? (
                  downgradeWarnings.map((warn, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-[10px] bg-[#FFF8E6] text-[#92400E] text-[12.5px] border border-[#FDE68A] font-medium"
                    >
                      {warn}
                    </div>
                  ))
                ) : (
                  <p className="text-[13px] text-[#666C78]">
                    Your current workspace resource usage falls within {getPlanDefinition(selectedPlanForDowngrade).name} limits. No restrictions will take effect.
                  </p>
                )}
                <div className="text-[12px] text-[#666C78]">
                  Existing contacts, messages, and invoices will never be deleted.
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-[#EDE8E0] pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPlanForDowngrade(null)}
                  className="rounded-[10px] border-[#EDE8E0] text-[#12141A] font-medium text-[13px] h-9 px-3.5 cursor-pointer"
                >
                  Keep Current Plan
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSimulatePayment(selectedPlanForDowngrade)}
                  className="btn-primary rounded-[10px] text-white font-medium text-[13px] h-9 px-4 cursor-pointer"
                >
                  Confirm Downgrade
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-rise">
            <div className="max-w-md w-full bg-white rounded-[16px] border border-[#EDE8E0] shadow-xl p-6 space-y-4">
              <div>
                <h3 className="text-[17px] font-semibold text-[#B42336]">
                  Cancel Subscription?
                </h3>
                <p className="text-[13px] text-[#666C78] mt-1 font-normal">
                  Your workspace will remain active until {new Date(subscription.current_period_end).toLocaleDateString("en-IN")}.
                </p>
              </div>

              <div className="space-y-2.5 text-[12.5px] text-[#454B57]">
                <p>
                  After your current billing cycle concludes, your workspace will switch to <strong>Read-Only Mode</strong>.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[#666C78]">
                  <li>All contacts and conversation history remain fully intact.</li>
                  <li>You can view and export your customer data anytime.</li>
                  <li>Automated follow-up workflows and outbound campaigns will pause.</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2 border-t border-[#EDE8E0] pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelModal(false)}
                  className="rounded-[10px] border-[#EDE8E0] text-[#12141A] font-medium text-[13px] h-9 px-3.5 cursor-pointer"
                >
                  Keep Subscription
                </Button>
                <Button
                  size="sm"
                  onClick={handleCancelSubscription}
                  className="rounded-[10px] bg-[#E5484D] hover:bg-[#D9383D] text-white font-medium text-[13px] h-9 px-4 cursor-pointer shadow-xs"
                >
                  Confirm Cancellation
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SettingsShell>
  );
}
