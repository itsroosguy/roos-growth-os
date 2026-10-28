"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTenant } from "@/lib/organizations/tenant-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
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
import { formatINR } from "@/lib/utils";

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
  // Senior Manager (Level 2) and Junior Manager (Level 3) are restricted.
  if (!canAccessFunds) {
    return (
      <SettingsShell
        orgSlug={currentOrg.slug}
        title="Subscription & Usage"
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
      title="Subscription & Usage"
      description={`Manage plan tier, quota consumption, and review unit economics for ${currentOrg.name}.`}
      badge={<span className="rounded-full bg-[#E6FBF2] border border-[#B8F5D8] text-[13px] uppercase font-medium px-3 py-0.5 text-[#0A7A53]">{subscription.status}</span>}
    >
      <div className="space-y-6">

        {/* Monthly / Annual Toggle */}
        <div className="flex justify-end pb-2">
          <div className="flex items-center bg-[#F7F5F0] border border-[#E6E2D8] rounded-[12px] p-1 shadow-xs">
            <button
              onClick={() => setInterval("monthly")}
              className={`px-3.5 py-1.5 text-[13px] font-medium rounded-[9px] transition-all cursor-pointer ${
                interval === "monthly"
                  ? "bg-[#0B0D12] text-white shadow-xs"
                  : "text-[#666C78] hover:text-[#12141A]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval("yearly")}
              className={`px-3.5 py-1.5 text-[13px] font-medium rounded-[9px] transition-all flex items-center space-x-1.5 cursor-pointer ${
                interval === "yearly"
                  ? "bg-[#0B0D12] text-white shadow-xs"
                  : "text-[#666C78] hover:text-[#12141A]"
              }`}
            >
              <span>Annual</span>
              <span className="text-[12px] bg-[#E6FBF2] text-[#0A7A53] border border-[#B8F5D8] font-medium px-2 py-0.5 rounded-full">
                Save ~17%
              </span>
            </button>
          </div>
        </div>

      {feedbackMessage && (
        <div className="rounded-[12px] bg-[#E6FBF2] p-4 border border-[#B8F5D8] text-[14px] text-[#0A7A53] flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 shrink-0 text-[#0A7A53]" />
            <span className="font-medium">{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="font-medium underline ml-4 hover:text-[#0A7A53] cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Active Subscription Overview Card */}
      <div className="bg-white rounded-[20px] border border-[#E6E2D8] p-6 shadow-[0_1px_2px_rgba(11,13,18,.04),0_8px_24px_-12px_rgba(11,13,18,.12)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <span className="text-[13px] font-medium text-[#666C78] uppercase tracking-wider">
              Current Plan
            </span>
            <div className="type-title text-[#12141A]">
              {currentPlanDef.name}
            </div>
            <p className="text-[15px] text-[#FF5A1F] font-medium tabular-nums">
              {formatINR(interval === "yearly" ? currentPlanDef.yearlyPriceInr : currentPlanDef.monthlyPriceInr)} /{" "}
              {interval === "yearly" ? "year" : "month"}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[13px] font-medium text-[#666C78] uppercase tracking-wider">
              Billing Cycle
            </span>
            <div className="text-[15px] font-medium text-[#12141A] capitalize flex items-center space-x-1.5">
              <Clock className="h-4 w-4 text-[#FF5A1F]" />
              <span>{subscription.billing_interval} interval</span>
            </div>
            <p className="text-[13px] text-[#666C78] font-normal">
              Renews on {new Date(subscription.current_period_end).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[13px] font-medium text-[#666C78] uppercase tracking-wider">
              Payment Method
            </span>
            <div className="text-[15px] font-medium text-[#12141A] flex items-center space-x-1.5">
              <CreditCard className="h-4 w-4 text-[#12B886]" />
              <span>UPI AutoPay / e-Mandate</span>
            </div>
            <p className="text-[13px] text-[#666C78] font-normal">
              India-compliant Razorpay Gateway
            </p>
          </div>

          <div className="flex flex-col justify-center items-start md:items-end space-y-2">
            {subscription.cancel_at_period_end ? (
              <div className="space-y-1.5">
                <Badge variant="warning" className="text-xs font-medium">
                  Cancels at end of period
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReactivate}
                  className="w-full text-xs rounded-xl border-[#E5E5E7] bg-white hover:bg-[#F7F7F8] text-[#0D0D0E] font-semibold shadow-2xs h-9"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-[#FF7A1A]" />
                  Reactivate Plan
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(true)}
                className="text-xs rounded-xl border-rose-200 bg-white hover:bg-rose-50 text-rose-600 font-semibold shadow-2xs h-9 px-3.5 cursor-pointer"
              >
                Cancel Subscription
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Usage Quota Progress Bars */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-[#0D0D0E]">
              Usage &amp; Quota Consumption
            </h2>
            <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
              Actual resource metrics for billing period {usageSummary.period_month}. Resets monthly.
            </p>
          </div>
          {usageSummary.is_any_exceeded && (
            <Badge variant="danger" className="text-xs font-medium">
              Quota Limit Reached
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.values(usageSummary.metrics).map((metric) => {
            const isExceeded = metric.is_exceeded;
            const isWarning = metric.is_warning;
            const barColor = isExceeded
              ? "bg-rose-500"
              : isWarning
              ? "bg-amber-500"
              : "bg-[#FF7A1A]";

            return (
              <div key={metric.metric_name} className="p-4 bg-white rounded-2xl border border-[#E5E5E7] shadow-2xs">
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-[#0D0D0E]">
                      {metric.label}
                    </span>
                    {metric.admin_override_quota && (
                      <span className="block text-[11px] text-emerald-700 font-semibold">
                        (+{metric.admin_override_quota} admin bonus)
                      </span>
                    )}
                  </div>
                  <span
                    className="text-xs tabular-nums font-semibold text-[#0D0D0E]"
                    suppressHydrationWarning
                  >
                    {mounted ? metric.current_count.toLocaleString("en-IN") : metric.current_count.toLocaleString("en-IN")} / {metric.max_quota.toLocaleString("en-IN")} {metric.unit}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-[#E5E5E7] rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${barColor}`}
                    style={{ width: `${Math.min(metric.percentage_used, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs text-[#8E8E93]">
                  <span className="tabular-nums font-semibold text-[#0D0D0E]" suppressHydrationWarning>
                    {mounted ? metric.percentage_used : metric.percentage_used}% consumed
                  </span>
                  {isExceeded ? (
                    <span className="text-amber-800 font-medium flex items-center text-[11px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      <AlertTriangle className="h-3 w-3 mr-1 inline" /> At limit
                    </span>
                  ) : isWarning ? (
                    <span className="text-amber-700 font-medium text-[11px]">
                      Near limit (&gt;80%)
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-medium text-[11px]">Within quota</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Available Plans Grid */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[#0D0D0E]">
            Available Subscription Plans
          </h2>
          <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
            Transparent pricing with zero hidden fees. Upgrade or adjust anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((p) => {
            const isCurrent = p.tier === subscription.plan_tier;
            const price = interval === "yearly" ? p.yearlyPriceInr : p.monthlyPriceInr;

            return (
              <div
                key={p.tier}
                className={`relative bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-2xs transition-all ${
                  p.popular ? "border-[#FF7A1A] ring-2 ring-[#FF7A1A]/20" : "border-[#E5E5E7]"
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#FF7A1A] text-white text-[10px] px-3 py-0.5 rounded-full font-semibold uppercase shadow-2xs tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-[#0D0D0E]">{p.name}</h3>
                      <p className="mt-0.5 text-xs text-[#8E8E93] font-medium">
                        {p.tagline}
                      </p>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pb-4 border-b border-[#E5E5E7]">
                    <span className="text-3xl font-semibold tabular-nums text-[#0D0D0E]">
                      ₹{price.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-[#8E8E93] font-semibold ml-1.5">
                      / {interval === "yearly" ? "year" : "month"}
                    </span>
                    <span className="block text-[11px] text-[#8E8E93] font-medium mt-0.5">
                      + 18% GST applicable
                    </span>
                  </div>

                  <div className="py-4 space-y-2.5">
                    <div className="text-[11px] font-medium uppercase tracking-wider text-[#8E8E93] mb-1">
                      Entitlements &amp; Features
                    </div>
                    {p.features.map((feat) => (
                      <div key={feat} className="flex items-start text-xs text-[#0D0D0E] font-medium">
                        <Check className="h-4 w-4 text-[#FF7A1A] stroke-[2.5] mr-2 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E5E5E7]">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full text-xs font-semibold h-9 border-[#E5E5E7] text-[#8E8E93] rounded-xl" disabled>
                      Active Plan
                    </Button>
                  ) : (
                    <Button
                      variant={p.popular ? "default" : "outline"}
                      className={`w-full text-xs font-semibold h-9 rounded-xl cursor-pointer ${
                        p.popular
                          ? "bg-[#FF7A1A] hover:bg-[#FF8833] text-white shadow-2xs"
                          : "border-[#E5E5E7] bg-white hover:bg-[#F7F7F8] text-[#0D0D0E]"
                      }`}
                      disabled={!isOwner}
                      onClick={() => handleInitiatePlanChange(p.tier)}
                    >
                      {isOwner ? "Switch to " + p.name : "Owner access required"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unit Economics & Cost Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6">
        <div className="flex items-center space-x-2 pb-4 border-b border-slate-100 mb-4">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Unit Economics & Contribution Margin ({currentPlanDef.name} Plan)
            </h2>
            <p className="text-xs text-slate-600 font-normal mt-0.5">
              Direct operational expenses deducted per monthly subscription under standard Indian SaaS cost assumptions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-medium text-slate-600 uppercase tracking-wider block mb-1">Subscription Revenue</span>
            <span className="text-xl font-semibold tabular-nums text-slate-950">₹{unitEconomics.monthlyPriceInr}</span>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">(excl. GST)</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-medium text-slate-600 uppercase tracking-wider block mb-1">Gateway Fees (2.36%)</span>
            <span className="text-xl font-semibold tabular-nums text-rose-700">-₹{unitEconomics.paymentGatewayFeeInr}</span>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Domestic UPI/Card</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-medium text-slate-600 uppercase tracking-wider block mb-1">Direct Compute</span>
            <span className="text-xl font-semibold tabular-nums text-rose-700">-₹{unitEconomics.infrastructureAllocationInr}</span>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Server & DB compute</span>
          </div>
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50">
            <span className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider block mb-1">Contribution Margin</span>
            <span className="text-xl font-semibold tabular-nums text-emerald-700">₹{unitEconomics.contributionMarginInr}</span>
            <span className="text-[11px] text-emerald-800 font-semibold block mt-0.5">{unitEconomics.contributionMarginPercentage}% margin</span>
          </div>
        </div>
      </div>

      {/* Overall Fund Transfers & Banking Settlements (Admin Level 1 Clearance Only) */}
      <div className="bg-white rounded-2xl border border-[#E5E5E7] shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-[#E5E5E7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#FFF4EC] border border-[#FF7A1A]/30 flex items-center justify-center text-[#FF7A1A]">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#0D0D0E]">Overall Fund Transfers &amp; Settlements</h2>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#24180E] text-[#FF7A1A] border border-[#FF7A1A]/30 tabular-nums">
                  Level 1 Admin Only
                </span>
              </div>
              <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
                Bank disbursement accounts, payment gateway settlements &amp; overall liquidity transfers
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[11px] tabular-nums font-medium uppercase tracking-wider text-[#8E8E93] block">Total Settled (MTD)</span>
            <span className="text-lg font-semibold tabular-nums text-[#0D0D0E]">₹ 24,50,000</span>
          </div>
        </div>

        {/* Banking Summary Cards */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-[#E5E5E7] bg-[#F7F7F8]">
          <div className="p-3.5 bg-white rounded-xl border border-[#E5E5E7]">
            <span className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wider block">Available Balance</span>
            <span className="text-xl font-semibold tabular-nums text-emerald-600">₹ 3,12,450.00</span>
            <span className="text-[11px] text-[#8E8E93] font-medium block mt-0.5">Ready for auto-disbursement</span>
          </div>
          <div className="p-3.5 bg-white rounded-xl border border-[#E5E5E7]">
            <span className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wider block">Linked Settlement Bank</span>
            <span className="text-sm font-semibold text-[#0D0D0E] block truncate">HDFC Corporate Bank</span>
            <span className="text-[11px] tabular-nums text-[#8E8E93] font-medium block mt-0.5">A/C ••••••••8491 (RTGS/NEFT)</span>
          </div>
          <div className="p-3.5 bg-white rounded-xl border border-[#E5E5E7]">
            <span className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wider block">Clearance Level</span>
            <span className="text-sm font-semibold text-[#FF7A1A] block">Admin Full Financial Access</span>
            <span className="text-[11px] text-rose-600 font-semibold block mt-0.5">Restricted from Senior &amp; Jr Managers</span>
          </div>
        </div>

        {/* Fund Transfer Ledger Table */}
        <div className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E5E7] text-[#8E8E93] font-medium uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Transfer Ref</th>
                  <th className="py-2.5 px-3">Gateway / Route</th>
                  <th className="py-2.5 px-3">Beneficiary Account</th>
                  <th className="py-2.5 px-3">Transfer Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Settled Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E7] font-medium">
                <tr className="hover:bg-[#F7F7F8]/80 transition-colors">
                  <td className="py-3 px-3 tabular-nums font-semibold text-[#0D0D0E]">TRF-884102</td>
                  <td className="py-3 px-3 text-[#0D0D0E]">Razorpay Payouts Direct</td>
                  <td className="py-3 px-3 text-[#8E8E93] tabular-nums">Operating Current A/C ••8491</td>
                  <td className="py-3 px-3 tabular-nums font-semibold text-[#0D0D0E]">₹ 1,45,000</td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Settled
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-[#8E8E93]">Today, 09:30 AM</td>
                </tr>
                <tr className="hover:bg-[#F7F7F8]/80 transition-colors">
                  <td className="py-3 px-3 tabular-nums font-semibold text-[#0D0D0E]">TRF-883918</td>
                  <td className="py-3 px-3 text-[#0D0D0E]">Stripe Automated Payout</td>
                  <td className="py-3 px-3 text-[#8E8E93] tabular-nums">Operating Current A/C ••8491</td>
                  <td className="py-3 px-3 tabular-nums font-semibold text-[#0D0D0E]">₹ 2,20,000</td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Settled
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-[#8E8E93]">Yesterday, 14:15 PM</td>
                </tr>
                <tr className="hover:bg-[#F7F7F8]/80 transition-colors">
                  <td className="py-3 px-3 tabular-nums font-semibold text-[#0D0D0E]">TRF-882045</td>
                  <td className="py-3 px-3 text-[#0D0D0E]">Razorpay Payouts Direct</td>
                  <td className="py-3 px-3 text-[#8E8E93] tabular-nums">Treasury Reserve Pool ••1024</td>
                  <td className="py-3 px-3 tabular-nums font-semibold text-[#0D0D0E]">₹ 3,75,000</td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Settled
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-[#8E8E93]">Oct 20, 2026</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment History & Receipts */}
      <div className="bg-white rounded-2xl border border-[#E5E5E7] shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-[#E5E5E7] flex items-center space-x-2">
          <Receipt className="h-5 w-5 text-[#FF7A1A]" />
          <div>
            <h2 className="text-base font-semibold text-[#0D0D0E]">Billing History &amp; GST Invoices</h2>
            <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
              Verified tax invoices and transaction records for {currentOrg.name}.
            </p>
          </div>
        </div>

        <div className="p-5">
          {paymentEvents.length === 0 ? (
            <p className="text-xs text-[#8E8E93] py-4 text-center font-medium">
              No previous payments recorded.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E5E7] text-[#8E8E93] font-medium uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Invoice ID</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E7]">
                  {paymentEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-[#F7F7F8]/80 transition-colors">
                      <td className="py-3 px-3 tabular-nums text-[#8E8E93]">
                        {new Date(event.created_at).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-3 tabular-nums text-[#0D0D0E] font-semibold">
                        {event.provider_invoice_id || "N/A"}
                      </td>
                      <td className="py-3 px-3 text-[#0D0D0E] font-medium">
                        {event.description}
                      </td>
                      <td className="py-3 px-3 tabular-nums font-semibold text-[#0D0D0E]">
                        ₹{(event.amount_inr_paise / 100).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 capitalize tabular-nums text-[#8E8E93]">
                        {event.payment_method}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-medium uppercase px-2 py-0.5 rounded-full border ${
                            event.status === "succeeded"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {event.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-[#0D0D0E] hover:text-[#FF7A1A] hover:bg-[#FFF4EC] font-semibold rounded-xl"
                          onClick={() => alert(`Downloading verified tax invoice ${event.provider_invoice_id}`)}
                        >
                          <Download className="h-3 w-3 mr-1 text-[#8E8E93]" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#E5E5E7] shadow-xl p-6">
            <div className="flex items-center space-x-2 text-amber-600 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-base font-semibold text-[#0D0D0E]">
                Confirm Plan Downgrade
              </h3>
            </div>
            <p className="text-xs text-[#8E8E93] mb-4 font-medium">
              Before switching to {getPlanDefinition(selectedPlanForDowngrade).name}, please review the following restrictions:
            </p>

            <div className="space-y-3 mb-6">
              {downgradeWarnings.length > 0 ? (
                downgradeWarnings.map((warn, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-amber-50 text-amber-900 text-xs border border-amber-200 font-medium"
                  >
                    {warn}
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#8E8E93]">
                  Your current workspace resource usage falls within {getPlanDefinition(selectedPlanForDowngrade).name} limits. No restrictions will take effect.
                </p>
              )}
              <div className="text-[11px] text-[#8E8E93]">
                Existing contacts, messages, and invoices will never be deleted.
              </div>
            </div>

            <div className="flex justify-end space-x-2 border-t border-[#E5E5E7] pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPlanForDowngrade(null)}
                className="border-[#E5E5E7] text-[#0D0D0E] font-semibold rounded-xl text-xs"
              >
                Keep Current Plan
              </Button>
              <Button
                size="sm"
                onClick={() => handleSimulatePayment(selectedPlanForDowngrade)}
                className="bg-[#FF7A1A] hover:bg-[#FF8833] text-white font-semibold rounded-xl text-xs"
              >
                Confirm Downgrade
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#E5E5E7] shadow-xl p-6">
            <h3 className="text-base font-semibold text-rose-600 mb-1">
              Cancel Subscription?
            </h3>
            <p className="text-xs text-[#8E8E93] mb-4 font-medium">
              Your workspace will remain active until {new Date(subscription.current_period_end).toLocaleDateString("en-IN")}.
            </p>

            <div className="space-y-3 text-xs text-[#8E8E93] mb-6 font-medium">
              <p>
                After your current billing cycle concludes, your workspace will switch to <strong>Read-Only Mode</strong>.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>All contacts and conversation history remain fully intact.</li>
                <li>You can view and export your customer data anytime.</li>
                <li>Automated follow-up workflows and outbound campaigns will pause.</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-2 border-t border-[#E5E5E7] pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(false)}
                className="border-[#E5E5E7] text-[#0D0D0E] font-semibold rounded-xl text-xs"
              >
                Keep Subscription
              </Button>
              <Button
                size="sm"
                onClick={handleCancelSubscription}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs"
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
