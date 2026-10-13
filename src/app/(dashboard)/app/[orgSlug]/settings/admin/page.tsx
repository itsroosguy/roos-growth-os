"use client";

import React, { useState } from "react";
import { useTenant } from "@/lib/organizations/tenant-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { subscriptionService } from "@/lib/billing/subscription-service";
import { usageService } from "@/lib/billing/usage-service";
import { getPlanDefinition } from "@/lib/billing/plans";
import { UsageMetricName } from "@/lib/billing/types";
import {
  ShieldAlert,
  Building,
  Users,
  CreditCard,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function PlatformAdminPage() {
  const { currentOrg, isOwner, userRole } = useTenant();
  const [selectedOrgForOverride, setSelectedOrgForOverride] = useState<string | null>(null);
  const [overrideMetric, setOverrideMetric] = useState<UsageMetricName>("active_contacts");
  const [overrideAmount, setOverrideAmount] = useState<number>(500);
  const [overrideReason, setOverrideReason] = useState<string>("Customer support retention grant");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Protected Operator Guard
  if (!isOwner) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-google-red-subtle border border-google-red/30 flex items-center justify-center mx-auto text-google-red">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
        <p className="text-xs text-foreground-secondary leading-relaxed">
          The Platform Administration console is restricted strictly to verified workspace owners and authorised system operators. Your current role is <span className="font-semibold uppercase">{userRole}</span>.
        </p>
      </div>
    );
  }

  const tenantSlugs = ["acme-corp", "beta-logistics"];
  const tenantData = tenantSlugs.map((slug) => {
    const sub = subscriptionService.getSubscription(slug);
    const plan = getPlanDefinition(sub.plan_tier);
    const usage = usageService.getTenantUsage(slug);
    const payments = subscriptionService.getPaymentEvents(slug);
    return { slug, sub, plan, usage, payments };
  });

  const handleGrantOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgForOverride) return;

    usageService.addOverride(
      selectedOrgForOverride,
      overrideMetric,
      Number(overrideAmount),
      overrideReason,
      "Workspace Owner / Operator"
    );

    setFeedback(`Granted +${overrideAmount} ${overrideMetric} to ${selectedOrgForOverride} successfully.`);
    setSelectedOrgForOverride(null);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleToggleSuspend = (slug: string, currentStatus: string) => {
    const newStatus = currentStatus === "suspended" ? "active" : "suspended";
    subscriptionService.updateSubscription(slug, { status: newStatus as any });
    setFeedback(`Organization ${slug} status updated to ${newStatus}.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Platform Administration
            </h1>
            <Badge variant="warning" className="text-xs">
              Operator Console
            </Badge>
          </div>
          <p className="text-sm text-foreground-secondary mt-1">
            Multi-tenant oversight, billing event history, and quota overrides for authorised operators.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="rounded-2xl bg-google-green-subtle p-3.5 border border-google-green/30 text-xs text-google-green flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-bold underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Tenancies Table */}
      <Card className="border-border bg-surface">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-google-blue" />
              <CardTitle className="text-base">Registered Workspaces & Tenants</CardTitle>
            </div>
            <Badge variant="neutral" className="text-xs">
              {tenantData.length} Active Organizations
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Cross-tenant subscription health, consumption levels, and operational controls.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-foreground-secondary font-medium">
                  <th className="py-2.5 px-3">Organization</th>
                  <th className="py-2.5 px-3">Plan Tier</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Contacts Usage</th>
                  <th className="py-2.5 px-3">Team Seats</th>
                  <th className="py-2.5 px-3">Executions</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {tenantData.map((item) => (
                  <tr key={item.slug} className="hover:bg-surface-subtle/50">
                    <td className="py-3 px-3 font-semibold text-foreground">
                      {item.slug === "acme-corp" ? "Acme Technologies" : "Beta Logistics"}
                      <span className="block text-[11px] font-mono text-foreground-secondary font-normal">
                        /app/{item.slug}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="default" className="text-[10px] uppercase font-bold">
                        {item.plan.name}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={item.sub.status === "active" ? "success" : "danger"}
                        className="text-[10px] uppercase font-semibold"
                      >
                        {item.sub.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 font-mono text-foreground">
                      {item.usage.metrics.active_contacts.current_count} / {item.usage.metrics.active_contacts.max_quota}
                    </td>
                    <td className="py-3 px-3 font-mono text-foreground">
                      {item.usage.metrics.team_seats.current_count} / {item.usage.metrics.team_seats.max_quota}
                    </td>
                    <td className="py-3 px-3 font-mono text-foreground">
                      {item.usage.metrics.workflow_executions.current_count} / {item.usage.metrics.workflow_executions.max_quota}
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setSelectedOrgForOverride(item.slug)}
                      >
                        <PlusCircle className="h-3 w-3 mr-1 text-google-blue" />
                        Bonus Quota
                      </Button>
                      <Button
                        variant={item.sub.status === "suspended" ? "default" : "secondary"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleToggleSuspend(item.slug, item.sub.status)}
                      >
                        {item.sub.status === "suspended" ? "Unsuspend" : "Suspend"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Grant Override Modal */}
      {selectedOrgForOverride && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <Card className="max-w-md w-full border-border bg-surface shadow-2xl">
            <form onSubmit={handleGrantOverride}>
              <CardHeader>
                <CardTitle className="text-base text-foreground">
                  Grant Quota Override to {selectedOrgForOverride}
                </CardTitle>
                <CardDescription className="text-xs">
                  Administrative quota expansion with mandatory audit trail log.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <label className="block text-foreground-secondary mb-1">Metric Target</label>
                  <select
                    className="w-full h-9 rounded-xl border border-border bg-surface px-3 text-xs"
                    value={overrideMetric}
                    onChange={(e) => setOverrideMetric(e.target.value as any)}
                  >
                    <option value="active_contacts">Active Contacts</option>
                    <option value="team_seats">Team Seats</option>
                    <option value="workflow_executions">Monthly Workflow Executions</option>
                    <option value="whatsapp_messages">Monthly WhatsApp Messages</option>
                  </select>
                </div>

                <div>
                  <label className="block text-foreground-secondary mb-1">Extra Quota Amount</label>
                  <input
                    type="number"
                    className="w-full h-9 rounded-xl border border-border bg-surface px-3 text-xs"
                    value={overrideAmount}
                    onChange={(e) => setOverrideAmount(Number(e.target.value))}
                    min={1}
                    required
                  />
                </div>

                <div>
                  <label className="block text-foreground-secondary mb-1">Reason for Audit Log</label>
                  <input
                    type="text"
                    className="w-full h-9 rounded-xl border border-border bg-surface px-3 text-xs"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <div className="flex justify-end space-x-2 border-t border-border p-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOrgForOverride(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="default" size="sm">
                  Apply Bonus Quota
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
