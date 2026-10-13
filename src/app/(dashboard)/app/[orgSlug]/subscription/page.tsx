"use client";

import React, { useState } from "react";
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
} from "lucide-react";

export default function SubscriptionPage() {
  const { currentOrg, isOwner } = useTenant();
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

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/60">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Subscription & Usage Limits
            </h1>
            <span className="glass-pill rounded-full bg-white/80 border border-white text-xs uppercase font-bold px-3 py-0.5 text-emerald-700 shadow-xs">
              {subscription.status}
            </span>
            <span className="glass-pill rounded-full bg-white/80 border border-white text-xs font-semibold px-3 py-0.5 text-slate-700 shadow-xs">
              Sandbox Billing Mode
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
            Manage billing, monitor monthly quota consumption, and review unit economics for {currentOrg.name}.
          </p>
        </div>

        {/* Monthly / Annual Toggle */}
        <div className="flex items-center bg-white/70 backdrop-blur-sm border border-white/80 rounded-xl p-1 shadow-2xs self-start sm:self-auto">
          <button
            onClick={() => setInterval("monthly")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              interval === "monthly"
                ? "bg-white shadow-xs text-blue-600 font-bold border border-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval("yearly")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1 cursor-pointer ${
              interval === "yearly"
                ? "bg-white shadow-xs text-blue-600 font-bold border border-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Annual</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-bold px-1.5 py-0.5 rounded-full shadow-2xs">
              Save ~17%
            </span>
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="rounded-2xl bg-emerald-50/90 backdrop-blur-sm p-4 border border-emerald-200/80 text-xs text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="font-bold underline ml-4 hover:text-emerald-950 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Active Subscription Overview Card */}
      <div className="glass-panel rounded-[26px] border border-white/70 bg-white/75 backdrop-blur-xl p-6 shadow-glass">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Current Plan
            </span>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {currentPlanDef.name}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              ₹{interval === "yearly" ? currentPlanDef.yearlyPriceInr : currentPlanDef.monthlyPriceInr} /{" "}
              {interval === "yearly" ? "year" : "month"}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Billing Cycle
            </span>
            <div className="text-sm font-bold text-slate-900 capitalize flex items-center space-x-1.5">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>{subscription.billing_interval} interval</span>
            </div>
            <p className="text-xs text-slate-500">
              Renews on {new Date(subscription.current_period_end).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Payment Method
            </span>
            <div className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              <span>UPI AutoPay / e-Mandate</span>
            </div>
            <p className="text-xs text-slate-500">
              Powered by India-compliant Razorpay Gateway
            </p>
          </div>

          <div className="flex flex-col justify-center items-start md:items-end space-y-2">
            {subscription.cancel_at_period_end ? (
              <div className="space-y-1.5">
                <Badge variant="warning" className="text-xs shadow-2xs">
                  Cancels at end of period
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReactivate}
                  className="w-full text-xs rounded-xl border-white/80 bg-white/80 hover:bg-white text-slate-700 shadow-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1.5" />
                  Reactivate Plan
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(true)}
                className="text-xs rounded-xl border-white/80 bg-white/80 hover:bg-white text-rose-600 hover:text-rose-700 shadow-xs"
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
            <h2 className="text-lg font-semibold text-foreground">
              Current Usage & Quota Consumption
            </h2>
            <p className="text-xs text-foreground-secondary">
              Actual resource metrics reconciled for period {usageSummary.period_month}. Resets monthly.
            </p>
          </div>
          {usageSummary.is_any_exceeded && (
            <Badge variant="danger" className="text-xs">
              Quota Limit Reached
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.values(usageSummary.metrics).map((metric) => {
            const isExceeded = metric.is_exceeded;
            const isWarning = metric.is_warning;
            const barColor = isExceeded
              ? "bg-google-red"
              : isWarning
              ? "bg-google-yellow"
              : "bg-google-blue";

            return (
              <Card key={metric.metric_name} className="p-4 bg-surface border-border">
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground">
                      {metric.label}
                    </span>
                    {metric.admin_override_quota && (
                      <span className="block text-[10px] text-google-green font-medium">
                        (+{metric.admin_override_quota} admin bonus)
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono font-medium text-foreground">
                    {metric.current_count.toLocaleString("en-IN")} / {metric.max_quota.toLocaleString("en-IN")} {metric.unit}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-surface-subtle rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${Math.min(metric.percentage_used, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] text-foreground-secondary">
                  <span>{metric.percentage_used}% consumed</span>
                  {isExceeded ? (
                    <span className="text-google-red font-semibold flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1 inline" /> Exceeded
                    </span>
                  ) : isWarning ? (
                    <span className="text-google-yellow font-medium">
                      Warning (&gt;80%)
                    </span>
                  ) : (
                    <span className="text-google-green">Normal</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Available Plans Grid */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Available Subscription Plans
          </h2>
          <p className="text-xs text-foreground-secondary">
            Transparent pricing with zero hidden fees. Upgrade or adjust anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = p.tier === subscription.plan_tier;
            const price = interval === "yearly" ? p.yearlyPriceInr : p.monthlyPriceInr;

            return (
              <Card
                key={p.tier}
                className={`relative flex flex-col justify-between ${
                  p.popular ? "border-google-blue shadow-card" : "border-border"
                } ${isCurrent ? "bg-surface-subtle/50" : "bg-surface"}`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="text-xs px-3 py-1 font-semibold">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{p.name}</CardTitle>
                      <CardDescription className="mt-1 text-xs">
                        {p.tagline}
                      </CardDescription>
                    </div>
                    {isCurrent && (
                      <Badge variant="success" className="text-xs uppercase font-bold">
                        Current
                      </Badge>
                    )}
                  </div>

                  <div className="mt-4">
                    <span className="text-3xl font-bold text-foreground">
                      ₹{price.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-foreground-secondary ml-1">
                      / {interval === "yearly" ? "year" : "month"}
                    </span>
                    <span className="block text-[11px] text-foreground-secondary mt-0.5">
                      + 18% GST applicable
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary mb-2">
                    Entitlements & Features
                  </div>
                  {p.features.map((feat) => (
                    <div key={feat} className="flex items-start text-xs text-foreground">
                      <Check className="h-4 w-4 text-google-green mr-2 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </CardContent>

                <CardFooter className="pt-4 border-t border-border">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full text-xs" disabled>
                      Active Plan
                    </Button>
                  ) : (
                    <Button
                      variant={p.popular ? "default" : "secondary"}
                      className="w-full text-xs"
                      disabled={!isOwner}
                      onClick={() => handleInitiatePlanChange(p.tier)}
                    >
                      {isOwner ? "Switch to " + p.name : "Owner access required"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Unit Economics & Cost Breakdown */}
      <Card className="border-border bg-surface">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-google-blue" />
            <CardTitle className="text-base">
              Unit Economics & Contribution Margin ({currentPlanDef.name} Plan)
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Direct operational expenses deducted per monthly subscription under standard Indian SaaS cost assumptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-surface-subtle rounded-xl">
              <span className="text-foreground-secondary block mb-1">Subscription Revenue</span>
              <span className="text-base font-bold text-foreground">₹{unitEconomics.monthlyPriceInr}</span>
              <span className="text-[10px] text-foreground-secondary block">(excl. GST)</span>
            </div>
            <div className="p-3 bg-surface-subtle rounded-xl">
              <span className="text-foreground-secondary block mb-1">Gateway Fees (Razorpay 2.36%)</span>
              <span className="text-base font-bold text-google-red">-₹{unitEconomics.paymentGatewayFeeInr}</span>
              <span className="text-[10px] text-foreground-secondary block">Domestic UPI/Card</span>
            </div>
            <div className="p-3 bg-surface-subtle rounded-xl">
              <span className="text-foreground-secondary block mb-1">Direct Infrastructure</span>
              <span className="text-base font-bold text-google-red">-₹{unitEconomics.infrastructureAllocationInr}</span>
              <span className="text-[10px] text-foreground-secondary block">Server & DB compute</span>
            </div>
            <div className="p-3 bg-surface-subtle rounded-xl border border-google-green/30 bg-google-green-subtle/30">
              <span className="text-foreground-secondary block mb-1">Contribution Margin</span>
              <span className="text-base font-bold text-google-green">₹{unitEconomics.contributionMarginInr}</span>
              <span className="text-[10px] text-google-green font-semibold block">{unitEconomics.contributionMarginPercentage}% margin</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History & Receipts */}
      <Card className="border-border bg-surface">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Receipt className="h-5 w-5 text-google-blue" />
            <CardTitle className="text-base">Billing History & GST Invoices</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Verified tax invoices and transaction records for {currentOrg.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentEvents.length === 0 ? (
            <p className="text-xs text-foreground-secondary py-4 text-center">
              No previous payments recorded.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-foreground-secondary font-medium">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Invoice ID</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paymentEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-surface-subtle/50">
                      <td className="py-3 px-3 font-mono text-foreground-secondary">
                        {new Date(event.created_at).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-3 font-mono text-foreground">
                        {event.provider_invoice_id || "N/A"}
                      </td>
                      <td className="py-3 px-3 text-foreground font-medium">
                        {event.description}
                      </td>
                      <td className="py-3 px-3 font-semibold text-foreground">
                        ₹{(event.amount_inr_paise / 100).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 capitalize font-mono text-foreground-secondary">
                        {event.payment_method}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={event.status === "succeeded" ? "success" : "danger"}
                          className="text-[10px]"
                        >
                          {event.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-google-blue hover:text-google-blue-hover"
                          onClick={() => alert(`Downloading verified tax invoice ${event.provider_invoice_id}`)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Downgrade Warning Modal */}
      {selectedPlanForDowngrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <Card className="max-w-md w-full border-border bg-surface shadow-2xl animate-in fade-in zoom-in-95">
            <CardHeader>
              <div className="flex items-center space-x-2 text-google-yellow">
                <AlertTriangle className="h-5 w-5" />
                <CardTitle className="text-base text-foreground">
                  Confirm Plan Downgrade
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Before switching to {getPlanDefinition(selectedPlanForDowngrade).name}, please review the following restrictions:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {downgradeWarnings.length > 0 ? (
                downgradeWarnings.map((warn, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-google-yellow-subtle text-foreground text-xs border border-google-yellow/20"
                  >
                    {warn}
                  </div>
                ))
              ) : (
                <p className="text-xs text-foreground-secondary">
                  Your current workspace resource usage falls within {getPlanDefinition(selectedPlanForDowngrade).name} limits. No restrictions will take effect.
                </p>
              )}
              <div className="text-[11px] text-foreground-secondary pt-2">
                Existing contacts, messages, and invoices will never be deleted.
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2 border-t border-border pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPlanForDowngrade(null)}
              >
                Keep Current Plan
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleSimulatePayment(selectedPlanForDowngrade)}
              >
                Confirm Downgrade
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <Card className="max-w-md w-full border-border bg-surface shadow-2xl">
            <CardHeader>
              <CardTitle className="text-base text-google-red">
                Cancel Subscription?
              </CardTitle>
              <CardDescription className="text-xs">
                Your workspace will remain active until {new Date(subscription.current_period_end).toLocaleDateString("en-IN")}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-foreground-secondary">
              <p>
                After your current billing cycle concludes, your workspace will switch to <strong>Read-Only Mode</strong>.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>All contacts and conversation history remain fully intact.</li>
                <li>You can view and export your customer data anytime.</li>
                <li>Automated follow-up workflows and outbound campaigns will pause.</li>
              </ul>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2 border-t border-border pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(false)}
              >
                Keep Subscription
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancelSubscription}
              >
                Confirm Cancellation
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
