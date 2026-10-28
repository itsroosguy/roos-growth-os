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
import { StatStrip } from "@/components/ui/stat-strip";
import { automationEngine } from "@/lib/automations/automation-engine";
import { PREDEFINED_TEMPLATES } from "@/lib/automations/templates";
import {
  AutomationExecution,
  AutomationRule,
  PredefinedTemplateId,
} from "@/lib/automations/types";
import { usageService } from "@/lib/billing/usage-service";
import {
  CheckCircle2,
  Play,
  RotateCw,
  Sparkles,
  Trash2,
  Zap,
  Clock,
  AlertTriangle,
  History,
  Layers,
  Plus,
} from "lucide-react";

export default function AutomationsPage() {
  const { currentOrg, isOwner } = useTenant();
  const [activeTab, setActiveTab] = useState<"workflows" | "templates" | "history">("workflows");
  const [selectedExecution, setSelectedExecution] = useState<AutomationExecution | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Live state
  const rules = automationEngine.getRules(currentOrg.slug);
  const executions = automationEngine.getExecutions(currentOrg.slug, 50);
  const usage = usageService.getTenantUsage(currentOrg.slug);
  const workflowUsage = usage.metrics.active_workflows;

  const handleActivateTemplate = (templateId: PredefinedTemplateId) => {
    const res = automationEngine.activatePredefinedTemplate(currentOrg.slug, templateId);
    if (res.success) {
      setFeedback(`Activated template "${res.rule?.name}" successfully!`);
      setActiveTab("workflows");
    } else {
      setFeedback(`Activation failed: ${res.error}`);
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleToggleRule = (ruleId: string, currentActive: boolean) => {
    const res = automationEngine.toggleRule(currentOrg.slug, ruleId, !currentActive);
    if (!res.success) {
      setFeedback(`Cannot enable: ${res.error}`);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm("Are you sure you want to delete this workflow rule?")) {
      automationEngine.deleteRule(currentOrg.slug, ruleId);
      setFeedback("Rule deleted successfully.");
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleTestTrigger = async (rule: AutomationRule) => {
    setFeedback(`Simulating test event for trigger "${rule.trigger_type}"...`);
    const results = await automationEngine.triggerAutomations({
      organization_id: currentOrg.slug,
      trigger_type: rule.trigger_type,
      entity_id: `test-${Date.now()}`,
      data: {
        lead: { id: "test-lead-1", title: "Test Lead Opportunity", stage: "qualified" },
        contact: { id: "test-contact-1", first_name: "Test", last_name: "User" },
      },
    });

    if (results.length > 0) {
      setFeedback(`Workflow executed successfully! (ID: ${results[0].id})`);
    } else {
      setFeedback("Trigger sent, but rule conditions did not match test payload.");
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleRetryExecution = async (execId: string) => {
    try {
      const res = await automationEngine.retryExecution(currentOrg.slug, execId);
      setFeedback(`Execution retried: status is now "${res.status}".`);
    } catch (err: any) {
      setFeedback(`Retry failed: ${err.message}`);
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0D0D0E]">
              Automations &amp; Workflows
            </h1>
            <span className="rounded-full bg-[#FFF4EC] border border-[#FF7A1A]/30 text-xs sm:text-sm font-semibold px-3.5 py-1 text-[#FF7A1A] shadow-2xs tabular-nums">
              {workflowUsage.current_count} / {workflowUsage.max_quota} Active
            </span>
          </div>
          <p className="text-sm text-[#525866] font-normal mt-1">
            Trigger-based communication rules, event-driven CRM task assignment, and automated lead follow-ups.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => setActiveTab("templates")}
            className="rounded-xl text-xs sm:text-sm bg-[#FF7A1A] hover:bg-[#FF8833] text-white font-medium flex items-center gap-1.5 shadow-2xs cursor-pointer h-10 px-4"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>New Automation</span>
          </Button>
        </div>
      </div>

      {/* StatStrip Metrics Banner */}
      <StatStrip
        stats={[
          {
            id: "active",
            label: "Active Workflows",
            value: `${workflowUsage.current_count} / ${workflowUsage.max_quota}`,
            subtext: "Capacity limit",
          },
          {
            id: "total_rules",
            label: "Configured Rules",
            value: rules.length,
          },
          {
            id: "executions",
            label: "Total Executions",
            value: executions.length,
            change: { value: "Live events", trend: "neutral" },
          },
          {
            id: "success",
            label: "Execution Reliability",
            value: `${executions.length > 0 ? Math.round((executions.filter(e => e.status === "completed").length / executions.length) * 100) : 100}%`,
            change: { value: "Engine verified", trend: "up" },
          },
        ]}
      />

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("workflows")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
            activeTab === "workflows"
              ? "bg-[#0D0D0E] text-white shadow-xs font-semibold"
              : "bg-white border border-[#E5E7EB] text-[#525866] hover:text-[#0D0D0E] hover:bg-[#F7F7F8]"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>All Workflows ({rules.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
            activeTab === "templates"
              ? "bg-[#0D0D0E] text-white shadow-xs font-semibold"
              : "bg-white border border-[#E5E7EB] text-[#525866] hover:text-[#0D0D0E] hover:bg-[#F7F7F8]"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-[#FF7A1A]" />
          <span>Templates A–F</span>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
            activeTab === "history"
              ? "bg-[#0D0D0E] text-white shadow-xs font-semibold"
              : "bg-white border border-[#E5E7EB] text-[#525866] hover:text-[#0D0D0E] hover:bg-[#F7F7F8]"
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>Execution Logs ({executions.length})</span>
        </button>
      </div>

      {feedback && (
        <div className="rounded-2xl bg-[#FFF4EC] p-4 border border-[#FF7A1A]/30 text-xs text-[#0D0D0E] flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 shrink-0 text-[#FF7A1A]" />
            <span className="font-medium">{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-medium text-[#FF7A1A] underline ml-4 hover:text-[#FF8833] cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Tab 1: Configured Workflows */}
      {activeTab === "workflows" && (
        <div className="space-y-4">
          {rules.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-[#E5E7EB] bg-white shadow-2xs">
              <Zap className="h-9 w-9 text-[#FF7A1A] mx-auto mb-2" />
              <h3 className="text-base font-semibold text-[#0D0D0E]">
                No automation rules active yet
              </h3>
              <p className="text-sm text-[#525866] max-w-sm mx-auto mt-1 mb-4 font-normal">
                Activate one of our pre-built workflow templates with a single click.
              </p>
              <Button
                variant="default"
                size="sm"
                className="rounded-xl bg-[#FF7A1A] hover:bg-[#FF8833] text-white font-medium shadow-xs cursor-pointer text-xs h-9 px-4"
                onClick={() => setActiveTab("templates")}
              >
                Browse Ready-to-Use Templates
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-2xs hover:shadow-md hover:border-[#FF7A1A]/40 transition-all ${
                    rule.is_active ? "border-l-4 border-l-[#FF7A1A]" : "opacity-80"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 max-w-2xl">
                      <div className="h-10 w-10 rounded-2xl bg-[#FFF4EC] text-[#FF7A1A] border border-[#FFE1CC] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                        <Zap className="h-5 w-5" />
                      </div>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-[#0D0D0E] text-sm sm:text-base">
                            {rule.name}
                          </span>
                          <Badge
                            variant={rule.is_active ? "success" : "neutral"}
                            className="text-[10px] uppercase font-medium"
                          >
                            {rule.is_active ? "Active" : "Paused"}
                          </Badge>
                          <Badge variant="neutral" className="text-[10px] tabular-nums font-medium border border-[#E5E7EB] bg-[#F7F7F8] text-[#525866]">
                            {rule.trigger_type}
                          </Badge>
                        </div>

                        <p className="text-xs sm:text-sm text-[#525866] font-normal">
                          {rule.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#F4F4F5] border border-[#E4E4E7] text-[#0D0D0E] font-medium text-[11px]">
                            <span className="text-[#717680] uppercase tracking-wider text-[10px]">When</span>
                            <span>{rule.trigger_type.replace(/_/g, " ")}</span>
                          </span>
                          <span className="text-[#717680] text-xs">→</span>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#F4F4F5] border border-[#E4E4E7] text-[#0D0D0E] font-medium text-[11px]">
                            <span className="text-[#717680] uppercase tracking-wider text-[10px]">Then</span>
                            <span>{rule.actions.map((a) => a.type.replace(/_/g, " ")).join(", ")}</span>
                          </span>
                          <span className="text-[#717680]">•</span>
                          <span className="text-xs text-[#717680] tabular-nums">
                            {rule.total_executions} runs
                          </span>
                          <span className="text-[#717680]">•</span>
                          <span className="text-xs text-emerald-700 font-medium tabular-nums">
                            {rule.total_executions > 0 ? Math.round((rule.success_count / rule.total_executions) * 100) : 100}% success
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 font-medium border-[#E5E7EB] rounded-xl text-[#0D0D0E] hover:bg-[#F7F7F8] cursor-pointer"
                        onClick={() => handleTestTrigger(rule)}
                        title="Simulate trigger event"
                      >
                        <Play className="h-3 w-3 mr-1 text-[#FF7A1A]" />
                        Test Run
                      </Button>

                      <Button
                        variant={rule.is_active ? "secondary" : "default"}
                        size="sm"
                        className={`text-xs h-8 font-medium rounded-xl cursor-pointer ${
                          rule.is_active
                            ? "bg-[#F7F7F8] text-[#0D0D0E] border border-[#E5E7EB] hover:bg-[#E5E7EB]"
                            : "bg-[#0D0D0E] text-white hover:bg-[#1C1C1F]"
                        }`}
                        onClick={() => handleToggleRule(rule.id, rule.is_active)}
                      >
                        {rule.is_active ? "Pause" : "Enable"}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Predefined Templates A through F Gallery */}
      {activeTab === "templates" && (
        <div className="space-y-4">
          <div className="mb-2">
            <h2 className="text-base font-semibold text-[#0D0D0E] tracking-tight">
              Predefined Workflow Templates (Templates A–F)
            </h2>
            <p className="text-sm text-[#525866] font-normal">
              Production-tested workflow patterns ready for instant activation with zero coding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PREDEFINED_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                className="p-5 flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white shadow-2xs hover:shadow-md hover:border-[#FF7A1A]/40 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="orangeSubtle" className="text-[10px] uppercase font-medium shadow-2xs">
                      {tmpl.category.replace("_", " ")}
                    </Badge>
                    <span className="text-[11px] tabular-nums text-[#525866] font-medium">
                      {tmpl.id.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="font-semibold text-sm sm:text-base text-[#0D0D0E] mb-1">
                    {tmpl.name}
                  </h3>
                  <p className="text-xs text-[#525866] font-normal mb-3">
                    {tmpl.tagline}
                  </p>

                  <div className="space-y-2 text-xs bg-[#F8F9FA] p-3.5 rounded-xl border border-[#E5E7EB] mb-4 shadow-2xs">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#525866] block">
                        When (Trigger):
                      </span>
                      <span className="text-[#0D0D0E] font-medium">{tmpl.trigger_label}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#525866] block">
                        Then (Actions):
                      </span>
                      <span className="text-[#525866] font-normal">
                        {tmpl.actions.length} automated steps (tasks, assignment &amp; internal notes)
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="default"
                  size="sm"
                  className="w-full text-xs font-medium rounded-xl bg-[#FF7A1A] hover:bg-[#FF8833] text-white shadow-xs cursor-pointer h-9"
                  onClick={() => handleActivateTemplate(tmpl.id)}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Activate This Workflow
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Execution History & Audit Logs */}
      {activeTab === "history" && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden shadow-2xs">
          <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#0D0D0E]">Recent Execution Audit Trail</h3>
              <p className="text-xs text-[#525866] font-normal mt-0.5">
                Idempotent execution history and duration diagnostics for background jobs.
              </p>
            </div>
            <Badge variant="neutral" className="text-xs tabular-nums font-medium border border-[#E5E7EB] bg-[#F7F7F8] text-[#525866]">
              {executions.length} Events Logged
            </Badge>
          </div>
          <div>
            {executions.length === 0 ? (
              <p className="text-xs text-[#525866] py-12 text-center font-normal">
                No workflow execution events logged yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#F8F9FA] border-b border-[#E5E7EB] text-[#525866] font-semibold uppercase tabular-nums text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Rule Name</th>
                      <th className="py-3 px-4">Trigger Event</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {executions.map((exec) => (
                      <tr key={exec.id} className="hover:bg-[#FFF4EC]/15 transition-colors">
                        <td className="py-3 px-4 tabular-nums text-[#525866] text-xs">
                          {new Date(exec.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#0D0D0E]">
                          {exec.rule_name || "Custom Rule"}
                        </td>
                        <td className="py-3 px-4 tabular-nums text-[#525866] text-xs">
                          {exec.trigger_event}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              exec.status === "completed"
                                ? "success"
                                : exec.status === "failed"
                                ? "danger"
                                : "warning"
                            }
                            className="text-[10px] uppercase font-medium"
                          >
                            {exec.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 tabular-nums font-medium text-[#0D0D0E] text-xs">
                          {exec.duration_ms ? `${exec.duration_ms}ms` : "—"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {exec.status === "failed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs font-medium text-[#FF7A1A] hover:text-[#FF8833] rounded-lg"
                              onClick={() => handleRetryExecution(exec.id)}
                            >
                              <RotateCw className="h-3 w-3 mr-1" />
                              Retry
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
