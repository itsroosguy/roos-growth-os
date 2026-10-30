"use client";

import React, { useState } from "react";
import { useTenant } from "@/lib/organizations/tenant-context";
import { subscriptionService } from "@/lib/billing/subscription-service";
import { usageService } from "@/lib/billing/usage-service";
import { getPlanDefinition } from "@/lib/billing/plans";
import { UsageMetricName } from "@/lib/billing/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SettingsShell } from "@/components/layout/settings-shell";
import {
  ShieldAlert,
  Building,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Users,
  CreditCard,
  PlusCircle,
  X,
  Activity,
} from "lucide-react";

export default function PlatformAdminPage() {
  const { currentOrg, isOwner, isAdmin } = useTenant();

  // Selected Org for Quota Override Modal
  const [selectedOrgForOverride, setSelectedOrgForOverride] = useState<string | null>(null);
  const [overrideMetric, setOverrideMetric] = useState<UsageMetricName>("active_contacts");
  const [overrideAmount, setOverrideAmount] = useState<number>(500);
  const [overrideReason, setOverrideReason] = useState<string>("VIP Expansion Grant");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Cross-tenant data
  const tenantSlugs = ["acme-corp", "sub-brand-2"];
  const tenantData = tenantSlugs.map((slug) => {
    const sub = subscriptionService.getSubscription(slug);
    const plan = getPlanDefinition(sub.plan_tier);
    const usage = usageService.getTenantUsage(slug);
    return { slug, sub, plan, usage };
  });

  const handleGrantOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgForOverride) return;

    usageService.addOverride(
      selectedOrgForOverride,
      overrideMetric,
      Number(overrideAmount),
      overrideReason,
      "Platform Administrator"
    );

    setFeedbackMessage(
      `Successfully granted +${overrideAmount} ${overrideMetric.replace("_", " ")} to ${selectedOrgForOverride}.`
    );
    setSelectedOrgForOverride(null);
    setOverrideAmount(500);
  };

  const handleToggleSuspend = (slug: string, currentStatus: string) => {
    const nextStatus = currentStatus === "suspended" ? "active" : "suspended";
    subscriptionService.updateSubscription(slug, { status: nextStatus as any });
    setFeedbackMessage(
      `Organization ${slug} status updated to: ${nextStatus.toUpperCase()}`
    );
  };

  if (!isOwner) {
    return (
      <SettingsShell
        orgSlug={currentOrg.slug}
        title="Fleet Administration"
        description="Root platform management and cross-tenant operations."
      >
        <div className="rounded-[16px] bg-[#FFE9EA] border border-[#FFCCD0] p-6 text-[13.5px] text-[#B42336] flex items-center space-x-3 card-ref">
          <ShieldAlert className="h-6 w-6 text-[#E5484D] shrink-0" />
          <div>
            <h3 className="font-semibold text-[15px] text-[#B42336]">Unauthorized Access Restricted</h3>
            <p className="mt-1 text-[13px] text-[#B42336] font-normal leading-relaxed">
              Platform fleet controls and tenant quota overrides require Level 1 Root Owner clearance.
            </p>
          </div>
        </div>
      </SettingsShell>
    );
  }

  return (
    <SettingsShell
      orgSlug={currentOrg.slug}
      title="Platform Fleet Operator"
      description="System-wide administration, tenant quota overrides, and cross-organization health."
      contentClassName="max-w-[960px]"
      badge={
        <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-[#FFE9EA] text-[#B42336] border border-[#FFCCD0]">
          Root Master Clearance
        </span>
      }
    >
      <div className="space-y-6">
        {feedbackMessage && (
          <div className="rounded-[12px] bg-[#E4F7EF] p-4 border border-[#BDECD7] text-[13.5px] text-[#0A7A53] font-medium flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-[#0A7A53] shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-[#0A7A53] underline font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Operator KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0B0D12] border border-[#242A38] rounded-[16px] p-5 text-white flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-[13px] text-[#A3A9B6]">
              <span className="font-medium">Active Tenants</span>
              <div className="h-8 w-8 rounded-[10px] bg-[#1B1F29] flex items-center justify-center text-[#FF5A1F]">
                <Building className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-[26px] font-semibold tracking-tight text-white tabular-nums">{tenantData.length}</div>
              <div className="text-[12px] text-[#A3A9B6] mt-1 flex items-center gap-1">
                <span className="text-[#12B886] font-medium">100% active</span> across fleet
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#EDE8E0] rounded-[16px] p-5 text-[#12141A] flex flex-col justify-between card-ref">
            <div className="flex items-center justify-between text-[13px] text-[#666C78]">
              <span className="font-medium">Total Contacts</span>
              <div className="h-8 w-8 rounded-[10px] bg-[#FFF0EB] flex items-center justify-center text-[#FF5A1F]">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-[26px] font-semibold tracking-tight text-[#12141A] tabular-nums">4,850</div>
              <div className="text-[12px] text-[#666C78] mt-1 flex items-center gap-1">
                <span className="text-[#FF5A1F] font-semibold">+12.4%</span> this billing cycle
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#EDE8E0] rounded-[16px] p-5 text-[#12141A] flex flex-col justify-between card-ref">
            <div className="flex items-center justify-between text-[13px] text-[#666C78]">
              <span className="font-medium">Monthly Run-Rate</span>
              <div className="h-8 w-8 rounded-[10px] bg-[#E4F7EF] flex items-center justify-center text-[#0A7A53]">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-[26px] font-semibold tracking-tight text-[#12141A] tabular-nums">₹12,499</div>
              <div className="text-[12px] text-[#666C78] mt-1 flex items-center gap-1">
                <span className="text-[#0A7A53] font-medium">Auto-renew</span> healthy
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#EDE8E0] rounded-[16px] p-5 text-[#12141A] flex flex-col justify-between card-ref">
            <div className="flex items-center justify-between text-[13px] text-[#666C78]">
              <span className="font-medium">Fleet Health</span>
              <div className="h-8 w-8 rounded-[10px] bg-[#EBF2FF] flex items-center justify-center text-[#3D5AFE]">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-[26px] font-semibold tracking-tight text-[#12141A]">Operational</div>
              <div className="text-[12px] text-[#666C78] mt-1 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#12B886] inline-block"></span> 0 SLA breaches reported
              </div>
            </div>
          </div>
        </div>

        {/* Tenancies Table */}
        <div className="border border-[#EDE8E0] bg-white rounded-[16px] card-ref p-0 overflow-hidden">
          <div className="p-5 border-b border-[#EDE8E0] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-[10px] bg-[#FFF0EB] border border-[#FF5A1F]/30 flex items-center justify-center text-[#FF5A1F]">
                <Building className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-[16px] font-semibold text-[#12141A]">Registered Workspaces &amp; Tenants</h2>
                <p className="text-[13px] text-[#666C78] font-normal mt-0.5">
                  Cross-tenant subscription health, consumption levels, and operational controls.
                </p>
              </div>
            </div>
            <Badge variant="neutral" className="text-[12px] font-semibold">
              {tenantData.length} Active Organizations
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#EDE8E0] bg-[#F7F5F0] text-[#666C78] font-semibold text-[12px] uppercase tracking-wider">
                  <th className="py-3 px-4">Organization</th>
                  <th className="py-3 px-4">Plan Tier</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Contacts Usage</th>
                  <th className="py-3 px-4">Team Seats</th>
                  <th className="py-3 px-4">Executions</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE8E0]/70">
                {tenantData.map((item) => (
                  <tr key={item.slug} className="hover:bg-[#F7F5F0]/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#12141A]">
                      {item.slug === "acme-corp" ? "ABC Testing Brand" : "Sub Testing 2"}
                      <span className="block text-[11.5px] tabular-nums text-[#666C78] font-normal mt-0.5">
                        /app/{item.slug}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#FFF0EB] text-[#FF5A1F] border border-[#FF5A1F]/30">
                        {item.plan.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={item.sub.status === "active" ? "success" : "danger"}
                        className="text-[11px] uppercase font-semibold"
                      >
                        {item.sub.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 tabular-nums text-[#12141A] font-medium">
                      {item.usage.metrics.active_contacts.current_count.toLocaleString("en-IN")}{" "}
                      <span className="text-[#666C78] font-normal">/ {item.usage.metrics.active_contacts.max_quota.toLocaleString("en-IN")}</span>
                    </td>
                    <td className="py-3.5 px-4 tabular-nums text-[#12141A] font-medium">
                      {item.usage.metrics.team_seats.current_count.toLocaleString("en-IN")}{" "}
                      <span className="text-[#666C78] font-normal">/ {item.usage.metrics.team_seats.max_quota.toLocaleString("en-IN")}</span>
                    </td>
                    <td className="py-3.5 px-4 tabular-nums text-[#12141A] font-medium">
                      {item.usage.metrics.workflow_executions.current_count.toLocaleString("en-IN")}{" "}
                      <span className="text-[#666C78] font-normal">/ {item.usage.metrics.workflow_executions.max_quota.toLocaleString("en-IN")}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-[12.5px] rounded-[10px] border-[#EDE8E0] hover:border-[#FF5A1F] hover:text-[#FF5A1F] transition-colors cursor-pointer"
                        onClick={() => setSelectedOrgForOverride(item.slug)}
                      >
                        <PlusCircle className="h-3.5 w-3.5 mr-1 text-[#FF5A1F]" />
                        Bonus Quota
                      </Button>
                      <Button
                        variant={item.sub.status === "suspended" ? "default" : "secondary"}
                        size="sm"
                        className="h-8 text-[12.5px] rounded-[10px] cursor-pointer"
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
        </div>

        {/* Grant Override Modal */}
        {selectedOrgForOverride && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="max-w-md w-full border border-[#EDE8E0] bg-white text-[#12141A] shadow-2xl rounded-[16px] overflow-hidden">
              <form onSubmit={handleGrantOverride}>
                <div className="p-5 border-b border-[#EDE8E0] flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="h-8 w-8 rounded-[10px] bg-[#FFF0EB] border border-[#FF5A1F]/30 flex items-center justify-center text-[#FF5A1F]">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-[16px] font-semibold text-[#12141A]">
                        Grant Quota Override
                      </h3>
                      <p className="text-[12.5px] text-[#666C78]">
                        Target workspace: <span className="tabular-nums font-semibold text-[#FF5A1F]">/app/{selectedOrgForOverride}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedOrgForOverride(null)}
                    className="text-[#666C78] hover:text-[#12141A] p-1 rounded-lg cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4 text-[13px]">
                  <div className="space-y-1">
                    <label className="block text-[#12141A] font-medium">Metric Target</label>
                    <select
                      className="w-full h-10 rounded-[12px] border border-[#EDE8E0] bg-[#F7F5F0] text-[#12141A] px-3 text-[13.5px] focus:outline-hidden focus:border-[#FF5A1F] cursor-pointer"
                      value={overrideMetric}
                      onChange={(e) => setOverrideMetric(e.target.value as any)}
                    >
                      <option value="active_contacts">Active Contacts</option>
                      <option value="team_seats">Team Seats</option>
                      <option value="workflow_executions">Monthly Workflow Executions</option>
                      <option value="whatsapp_messages">Monthly WhatsApp Messages</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[#12141A] font-medium">Extra Quota Amount</label>
                    <input
                      type="number"
                      className="w-full h-10 rounded-[12px] border border-[#EDE8E0] bg-[#F7F5F0] text-[#12141A] px-3 text-[13.5px] focus:outline-hidden focus:border-[#FF5A1F]"
                      value={overrideAmount}
                      onChange={(e) => setOverrideAmount(Number(e.target.value))}
                      min={1}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[#12141A] font-medium">Reason for Audit Log</label>
                    <input
                      type="text"
                      className="w-full h-10 rounded-[12px] border border-[#EDE8E0] bg-[#F7F5F0] text-[#12141A] px-3 text-[13.5px] focus:outline-hidden focus:border-[#FF5A1F]"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 border-t border-[#EDE8E0] p-4 bg-[#F7F5F0]">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-[#EDE8E0] text-[#12141A] hover:bg-white rounded-[10px] text-[13px]"
                    onClick={() => setSelectedOrgForOverride(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="rounded-[10px] text-[13px] font-semibold px-4 cursor-pointer"
                  >
                    Apply Bonus Quota
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SettingsShell>
  );
}
