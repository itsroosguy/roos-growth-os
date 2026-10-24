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
  Layers,
  Activity,
  Zap,
  TrendingUp,
  X,
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
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-[#121214] border border-[#1C1C1F] flex items-center justify-center mx-auto text-[#FF7900] shadow-sm">
          <Lock className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-[#0D0D0E] tracking-tight">Access Restricted</h2>
          <p className="text-xs text-[#8E8E93] leading-relaxed max-w-sm mx-auto">
            The Platform Administration console is restricted strictly to verified workspace owners and authorised Level 1 system operators. Your current role is <span className="font-semibold text-[#0D0D0E] uppercase">{userRole}</span>.
          </p>
        </div>
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0E]">
              Platform Administration
            </h1>
            <Badge variant="orange" className="text-[11px] font-semibold">
              Level 1 Operator Console
            </Badge>
          </div>
          <p className="text-xs text-[#8E8E93] mt-1">
            Multi-tenant oversight, billing event history, and quota overrides for authorised operators.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl bg-emerald-50 p-3.5 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-bold underline ml-4 hover:text-emerald-950">
            Dismiss
          </button>
        </div>
      )}

      {/* Operator KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#121214] border border-[#1C1C1F] rounded-2xl p-5 text-white flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#8E8E93]">
            <span>Active Tenants</span>
            <div className="h-8 w-8 rounded-xl bg-[#1C1C1F] flex items-center justify-center text-[#FF7900]">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-white">{tenantData.length}</div>
            <div className="text-[11px] text-[#8E8E93] mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-medium">100% active</span> across fleet
            </div>
          </div>
        </div>

        <div className="bg-[#121214] border border-[#1C1C1F] rounded-2xl p-5 text-white flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#8E8E93]">
            <span>Total Contacts Managed</span>
            <div className="h-8 w-8 rounded-xl bg-[#1C1C1F] flex items-center justify-center text-[#FF7900]">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-white">4,850</div>
            <div className="text-[11px] text-[#8E8E93] mt-1 flex items-center gap-1">
              <span className="text-[#FF7900] font-medium">+12.4%</span> this billing cycle
            </div>
          </div>
        </div>

        <div className="bg-[#121214] border border-[#1C1C1F] rounded-2xl p-5 text-white flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#8E8E93]">
            <span>Monthly Run-Rate</span>
            <div className="h-8 w-8 rounded-xl bg-[#1C1C1F] flex items-center justify-center text-[#FF7900]">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-white">₹12,499</div>
            <div className="text-[11px] text-[#8E8E93] mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-medium">Auto-renew</span> healthy
            </div>
          </div>
        </div>

        <div className="bg-[#121214] border border-[#1C1C1F] rounded-2xl p-5 text-white flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#8E8E93]">
            <span>Fleet Health</span>
            <div className="h-8 w-8 rounded-xl bg-[#1C1C1F] flex items-center justify-center text-[#FF7900]">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-white">Operational</div>
            <div className="text-[11px] text-[#8E8E93] mt-1 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block"></span> 0 SLA breaches reported
            </div>
          </div>
        </div>
      </div>

      {/* Tenancies Table */}
      <Card className="border-[#E5E5E7] bg-white rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="p-5 border-b border-[#E5E5E7]/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-xl bg-[#24180E] border border-[#FF7900]/20 flex items-center justify-center text-[#FF7900]">
                <Building className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-[#0D0D0E]">Registered Workspaces & Tenants</CardTitle>
                <CardDescription className="text-xs text-[#8E8E93]">
                  Cross-tenant subscription health, consumption levels, and operational controls.
                </CardDescription>
              </div>
            </div>
            <Badge variant="neutral" className="text-[11px]">
              {tenantData.length} Active Organizations
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E5E7] bg-[#F7F7F8] text-[#8E8E93] font-medium text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Organization</th>
                  <th className="py-3 px-4">Plan Tier</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Contacts Usage</th>
                  <th className="py-3 px-4">Team Seats</th>
                  <th className="py-3 px-4">Executions</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E7]/60 text-xs">
                {tenantData.map((item) => (
                  <tr key={item.slug} className="hover:bg-[#F7F7F8]/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#0D0D0E]">
                      {item.slug === "acme-corp" ? "Acme Technologies" : "Beta Logistics"}
                      <span className="block text-[11px] font-mono text-[#8E8E93] font-normal mt-0.5">
                        /app/{item.slug}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="orangeSubtle" className="text-[10px] uppercase font-bold">
                        {item.plan.name}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={item.sub.status === "active" ? "success" : "danger"}
                        className="text-[10px] uppercase font-semibold"
                      >
                        {item.sub.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#0D0D0E]">
                      {item.usage.metrics.active_contacts.current_count} <span className="text-[#8E8E93]">/ {item.usage.metrics.active_contacts.max_quota}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#0D0D0E]">
                      {item.usage.metrics.team_seats.current_count} <span className="text-[#8E8E93]">/ {item.usage.metrics.team_seats.max_quota}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#0D0D0E]">
                      {item.usage.metrics.workflow_executions.current_count} <span className="text-[#8E8E93]">/ {item.usage.metrics.workflow_executions.max_quota}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-[#E5E5E7] hover:border-[#FF7900] hover:text-[#FF7900] transition-colors"
                        onClick={() => setSelectedOrgForOverride(item.slug)}
                      >
                        <PlusCircle className="h-3 w-3 mr-1 text-[#FF7900]" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <Card className="max-w-md w-full border-[#1C1C1F] bg-[#121214] text-white shadow-2xl rounded-2xl overflow-hidden">
            <form onSubmit={handleGrantOverride}>
              <CardHeader className="p-5 border-b border-[#1C1C1F]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="h-8 w-8 rounded-xl bg-[#24180E] border border-[#FF7900]/30 flex items-center justify-center text-[#FF7900]">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-white">
                        Grant Quota Override
                      </CardTitle>
                      <CardDescription className="text-xs text-[#8E8E93]">
                        Target workspace: <span className="font-mono text-[#FF7900]">/app/{selectedOrgForOverride}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedOrgForOverride(null)}
                    className="text-[#8E8E93] hover:text-white p-1 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-[#8E8E93] mb-1.5 font-medium">Metric Target</label>
                  <select
                    className="w-full h-9 rounded-xl border border-[#1C1C1F] bg-[#0D0D0E] text-white px-3 text-xs focus:outline-hidden focus:border-[#FF7900]"
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
                  <label className="block text-[#8E8E93] mb-1.5 font-medium">Extra Quota Amount</label>
                  <input
                    type="number"
                    className="w-full h-9 rounded-xl border border-[#1C1C1F] bg-[#0D0D0E] text-white px-3 text-xs focus:outline-hidden focus:border-[#FF7900]"
                    value={overrideAmount}
                    onChange={(e) => setOverrideAmount(Number(e.target.value))}
                    min={1}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#8E8E93] mb-1.5 font-medium">Reason for Audit Log</label>
                  <input
                    type="text"
                    className="w-full h-9 rounded-xl border border-[#1C1C1F] bg-[#0D0D0E] text-white px-3 text-xs focus:outline-hidden focus:border-[#FF7900]"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <div className="flex justify-end space-x-2 border-t border-[#1C1C1F] p-4 bg-[#0D0D0E]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-[#1C1C1F] text-white hover:bg-[#1C1C1F]"
                  onClick={() => setSelectedOrgForOverride(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-[#FF7900] hover:bg-[#E66D00] text-white font-semibold"
                >
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
