"use client";

import React, { useState, useMemo } from "react";
import { useTenant } from "@/lib/organizations/tenant-context";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { Switch } from "@/components/ui/switch";
import { Drawer } from "@/components/ui/drawer";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { automationEngine } from "@/lib/automations/automation-engine";
import { AutomationRule, AutomationExecution } from "@/lib/automations/types";
import { useToast } from "@/components/ui/toast-context";
import { cn } from "@/lib/utils";
import {
  Zap,
  Play,
  RotateCw,
  Clock,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  History,
} from "lucide-react";

export default function AutomationsPage() {
  const { currentOrg } = useTenant();
  const orgSlug = currentOrg.slug;
  const { toast } = useToast();

  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"workflows" | "history">("workflows");
  const [selectedExecution, setSelectedExecution] = useState<AutomationExecution | null>(null);

  // Live state
  const rules = useMemo(() => {
    return automationEngine.getRules(orgSlug);
  }, [orgSlug, refreshKey]);

  const executions = useMemo(() => {
    return automationEngine.getExecutions(orgSlug, 50);
  }, [orgSlug, refreshKey]);

  // Human-readable translator for trigger types
  const getHumanTrigger = (rule: AutomationRule) => {
    switch (rule.trigger_type) {
      case "lead.created":
        return "When a new opportunity is created";
      case "lead.stage_changed":
        return "When an opportunity status changes";
      case "message.received":
        return "When a customer sends a WhatsApp message";
      case "followup.overdue":
        return "When a follow-up SLA deadline expires";
      case "conversation.unanswered":
        return "When an incoming conversation remains unanswered";
      default:
        return `When ${rule.trigger_type.replace(/\./g, " ")} occurs`;
    }
  };

  const getHumanAction = (rule: AutomationRule) => {
    if (rule.actions && rule.actions.length > 0) {
      const act = rule.actions[0];
      switch (act.type) {
        case "lead.assign":
          return "Assign opportunity to Account Executive";
        case "whatsapp.send_template":
          return "Dispatch pre-approved WhatsApp welcome template";
        case "task.create":
          return "Generate urgent follow-up task";
        case "internal_note.create":
          return "Create internal staff note in thread";
        default:
          return act.type.replace(/\./g, " ");
      }
    }
    return "Execute workflow pipeline actions";
  };

  const handleToggleRule = (ruleId: string, currentActive: boolean) => {
    automationEngine.toggleRule(orgSlug, ruleId, !currentActive);
    setRefreshKey((k) => k + 1);
    toast(!currentActive ? "Workflow activated" : "Workflow paused", { type: "info" });
  };

  const handleTestTrigger = async (rule: AutomationRule) => {
    toast(`Simulating workflow: "${rule.name}"...`, { type: "info" });
    const results = await automationEngine.triggerAutomations({
      organization_id: orgSlug,
      trigger_type: rule.trigger_type,
      entity_id: `test-${Date.now()}`,
      data: {
        lead: { id: "test-lead-1", title: "Test Lead Opportunity", stage: "qualified" },
        contact: { id: "test-contact-1", first_name: "Test", last_name: "User" },
      },
    });

    if (results.length > 0) {
      setRefreshKey((k) => k + 1);
      toast("Workflow executed successfully in sandbox", { type: "success" });
    } else {
      toast("Workflow conditions not met", { type: "info" });
    }
  };

  return (
    <div className="space-y-6 animate-page-enter">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col gap-3 pb-5 border-b border-[#EDE8E0] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="type-display text-[#12141A]">
            Automations
          </h1>
          <p className="type-body text-[#454B57] mt-1">
            {rules.length} trigger-action workflows for lead routing, customer SLAs, and automated WhatsApp responses
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab Selector */}
          <div className="flex items-center rounded-[12px] border border-[#EDE8E0] bg-white p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab("workflows")}
              className={cn(
                "px-3.5 py-1.5 rounded-[9px] text-[14px] font-medium transition-colors cursor-pointer",
                activeTab === "workflows"
                  ? "bg-[#0B0D12] text-white shadow-xs"
                  : "text-[#666C78] hover:text-[#12141A]"
              )}
            >
              Active Workflows
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={cn(
                "px-3.5 py-1.5 rounded-[9px] text-[14px] font-medium transition-colors cursor-pointer",
                activeTab === "history"
                  ? "bg-[#0B0D12] text-white shadow-xs"
                  : "text-[#666C78] hover:text-[#12141A]"
              )}
            >
              Execution History
            </button>
          </div>

          <Button
            onClick={() => toast("Workflow builder available in next update", { type: "info" })}
            variant="primary"
            className="flex items-center gap-1.5 h-10 px-4 rounded-[12px] text-[14px]"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>New workflow</span>
          </Button>
        </div>
      </div>

      {/* 2. ACTIVE WORKFLOWS LIST */}
      {activeTab === "workflows" && (
        <div className="space-y-4">
          {rules.map((rule) => {
            const whenText = getHumanTrigger(rule);
            const thenText = getHumanAction(rule);

            return (
              <div
                key={rule.id}
                className="p-6 rounded-[16px] border border-[#EDE8E0] bg-white shadow-[0_1px_2px_rgba(11,13,18,.04),0_8px_24px_-12px_rgba(11,13,18,.12)] space-y-4 hover:border-[#D2CEC2] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#FFF3D6] text-[#8F5300] border border-[#FFE5A3] shadow-xs">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-[16px] font-medium text-[#12141A]">
                        {rule.name}
                      </h3>
                      <p className="text-[13px] text-[#666C78] mt-0.5">
                        {rule.description || "Automatic workspace execution rule"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusPill
                      variant={rule.is_active ? "emerald" : "slate"}
                      dot
                      size="sm"
                    >
                      {rule.is_active ? "Active" : "Paused"}
                    </StatusPill>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => handleToggleRule(rule.id, rule.is_active)}
                    />
                  </div>
                </div>

                {/* Human-Readable Chain: When -> If -> Then */}
                <div className="p-4 rounded-[14px] bg-[#F7F5F0] border border-[#EDE8E0] text-[14px] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#12141A] w-14 shrink-0">When:</span>
                    <span className="text-[#454B57]">{whenText}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#12141A] w-14 shrink-0">If:</span>
                    <span className="text-[#454B57]">All lead validation and consent conditions are met</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#12141A] w-14 shrink-0">Then:</span>
                    <span className="text-[#0A7A53] font-medium">{thenText}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EDE8E0] flex items-center justify-between text-[13px] text-[#666C78]">
                  <span>Trigger: {rule.trigger_type}</span>
                  <button
                    type="button"
                    onClick={() => handleTestTrigger(rule)}
                    className="flex items-center gap-1.5 text-[#12141A] hover:text-[#FF5A1F] font-medium transition-colors cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5 text-[#FF5A1F]" />
                    <span>Test Workflow in Sandbox</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. EXECUTION HISTORY */}
      {activeTab === "history" && (
        <div className="rounded-[16px] border border-[#EDE8E0] bg-white shadow-[0_1px_2px_rgba(11,13,18,.04),0_8px_24px_-12px_rgba(11,13,18,.12)] overflow-hidden divide-y divide-[#EDE8E0]">
          <div className="p-4 bg-[#FAF9F5] text-[13px] font-medium text-[#666C78] uppercase tracking-[0.06em]">
            Recent Workflow Runs
          </div>
          {executions.map((exec) => (
            <div
              key={exec.id}
              onClick={() => setSelectedExecution(exec)}
              className="p-4 flex items-center justify-between hover:bg-[#F6F5F1] transition-colors cursor-pointer text-[13px]"
            >
              <div>
                <span className="font-medium text-[#12141A]">{exec.rule_name}</span>
                <span className="text-[11px] text-[#6A707C] block mt-0.5">
                  Trigger: {exec.trigger_event} • ID: {exec.id}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <StatusPill
                  variant={exec.status === "completed" ? "success" : "danger"}
                  dot
                  size="sm"
                >
                  {exec.status}
                </StatusPill>
                <span className="text-[11px] text-[#6A707C] font-variant-numeric tabular-nums">
                  {new Date(exec.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}

          {executions.length === 0 && (
            <div className="p-8 text-center text-[12px] text-[#6A707C]">
              No execution history recorded yet.
            </div>
          )}
        </div>
      )}

      {/* Execution Detail Drawer */}
      <Drawer
        isOpen={!!selectedExecution}
        onClose={() => setSelectedExecution(null)}
        title={selectedExecution?.rule_name || "Execution Details"}
        description={`Status: ${selectedExecution?.status}`}
      >
        <div className="space-y-4 text-[13px]">
          <div className="p-3 rounded-[8px] bg-[#EFEDE7] space-y-2">
            <div className="flex items-center justify-between text-[#4B515D]">
              <span>Trigger Event</span>
              <span className="font-medium text-[#12141A]">{selectedExecution?.trigger_event}</span>
            </div>
            <div className="flex items-center justify-between text-[#4B515D]">
              <span>Execution Time</span>
              <span className="font-medium text-[#12141A]">
                {selectedExecution && new Date(selectedExecution.created_at).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E4E1D8] flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setSelectedExecution(null)}>
              Close
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
