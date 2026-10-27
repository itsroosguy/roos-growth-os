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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E5E7]">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0D0D0E]">
              Automations
            </h1>
            <span className="rounded-full bg-[#FFF4EC] border border-[#FF7900]/30 text-xs font-semibold px-3 py-0.5 text-[#FF7900] shadow-2xs font-mono">
              {workflowUsage.current_count} / {workflowUsage.max_quota} Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8E8E93] font-medium mt-1">
            Create workflows to automate your customer communication.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => setActiveTab("templates")}
            className="rounded-xl text-xs bg-[#FF7900] hover:bg-[#E66D00] text-white font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer h-9 px-3.5"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>New Automation</span>
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("workflows")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
            activeTab === "workflows"
              ? "bg-[#0D0D0E] text-white shadow-xs"
              : "bg-white border border-[#E5E5E7] text-[#0D0D0E] hover:bg-[#F7F7F8]"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>All Workflows ({rules.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
            activeTab === "templates"
              ? "bg-[#0D0D0E] text-white shadow-xs"
              : "bg-white border border-[#E5E5E7] text-[#0D0D0E] hover:bg-[#F7F7F8]"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-[#FF7900]" />
          <span>Templates A–F</span>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
            activeTab === "history"
              ? "bg-[#0D0D0E] text-white shadow-xs"
              : "bg-white border border-[#E5E5E7] text-[#0D0D0E] hover:bg-[#F7F7F8]"
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>Execution Logs ({executions.length})</span>
        </button>
      </div>

      {feedback && (
        <div className="rounded-2xl bg-[#FFF4EC] p-4 border border-[#FF7900]/30 text-xs text-[#0D0D0E] flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 shrink-0 text-[#FF7900]" />
            <span className="font-semibold">{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-semibold text-[#FF7900] underline ml-4 hover:text-[#E66D00] cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Tab 1: Configured Workflows */}
      {activeTab === "workflows" && (
        <div className="space-y-4">
          {rules.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-[#E5E5E7] bg-white shadow-2xs">
              <Zap className="h-9 w-9 text-[#FF7900] mx-auto mb-2" />
              <h3 className="text-base font-semibold text-[#0D0D0E]">
                No automation rules active yet
              </h3>
              <p className="text-xs text-[#8E8E93] max-w-sm mx-auto mt-1 mb-4 font-medium">
                Activate one of our pre-built workflow templates with a single click.
              </p>
              <Button
                variant="default"
                size="sm"
                className="rounded-xl bg-[#FF7900] hover:bg-[#E66D00] text-white font-semibold shadow-xs cursor-pointer text-xs"
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
                  className={`rounded-2xl border border-[#E5E5E7] bg-white p-5 shadow-2xs hover:shadow-md hover:border-[#FF7900]/40 transition-all ${
                    rule.is_active ? "border-l-4 border-l-[#FF7900]" : "opacity-80"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 max-w-2xl">
                      <div className="h-10 w-10 rounded-2xl bg-[#FFF4EC] text-[#FF7900] border border-[#FF7900]/30 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                        <Zap className="h-5 w-5" />
                      </div>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-[#0D0D0E] text-sm sm:text-base">
                            {rule.name}
                          </span>
                          <Badge
                            variant={rule.is_active ? "success" : "neutral"}
                            className="text-[10px] uppercase font-semibold"
                          >
                            {rule.is_active ? "Active" : "Paused"}
                          </Badge>
                          <Badge variant="neutral" className="text-[10px] font-mono font-medium">
                            {rule.trigger_type}
                          </Badge>
                        </div>

                        <p className="text-xs sm:text-sm text-[#8E8E93] font-medium">
                          {rule.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#8E8E93] font-medium">
                          <span>
                            <strong className="text-[#0D0D0E]">Flow:</strong> {rule.actions.map((a) => a.type).join(" → ")}
                          </span>
                          <span>•</span>
                          <span>
                            <strong className="text-[#0D0D0E]">Executed:</strong> {rule.total_executions} runs
                          </span>
                          <span>•</span>
                          <span className="text-emerald-600 font-semibold">
                            {rule.total_executions > 0 ? Math.round((rule.success_count / rule.total_executions) * 100) : 100}% Success
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 font-semibold border-[#E5E5E7] rounded-xl text-[#0D0D0E] hover:bg-[#F7F7F8] cursor-pointer"
                        onClick={() => handleTestTrigger(rule)}
                        title="Simulate trigger event"
                      >
                        <Play className="h-3 w-3 mr-1 text-[#FF7900]" />
                        Test Run
                      </Button>

                      <Button
                        variant={rule.is_active ? "secondary" : "default"}
                        size="sm"
                        className={`text-xs h-8 font-semibold rounded-xl cursor-pointer ${
                          rule.is_active
                            ? "bg-[#F7F7F8] text-[#0D0D0E] border border-[#E5E5E7] hover:bg-[#E5E5E7]"
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
            <p className="text-xs sm:text-sm text-[#8E8E93] font-medium">
              Production-tested workflow patterns ready for instant activation with zero coding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PREDEFINED_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                className="p-5 flex flex-col justify-between rounded-2xl border border-[#E5E5E7] bg-white shadow-2xs hover:shadow-md hover:border-[#FF7900]/40 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="orangeSubtle" className="text-[10px] uppercase font-medium shadow-2xs">
                      {tmpl.category.replace("_", " ")}
                    </Badge>
                    <span className="text-[11px] font-mono text-[#8E8E93] font-semibold">
                      {tmpl.id.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="font-semibold text-sm sm:text-base text-[#0D0D0E] mb-1">
                    {tmpl.name}
                  </h3>
                  <p className="text-xs text-[#8E8E93] font-medium mb-3">
                    {tmpl.tagline}
                  </p>

                  <div className="space-y-2 text-xs bg-[#F7F7F8] p-3.5 rounded-xl border border-[#E5E5E7] mb-4 shadow-2xs">
                    <div>
                      <span className="text-[10px] uppercase font-medium text-[#8E8E93] block">
                        When (Trigger):
                      </span>
                      <span className="text-[#0D0D0E] font-semibold">{tmpl.trigger_label}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-medium text-[#8E8E93] block">
                        Then (Actions):
                      </span>
                      <span className="text-[#8E8E93] font-medium">
                        {tmpl.actions.length} automated steps (tasks, assignment &amp; internal notes)
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="default"
                  size="sm"
                  className="w-full text-xs font-semibold rounded-xl bg-[#FF7900] hover:bg-[#E66D00] text-white shadow-xs cursor-pointer"
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
        <div className="rounded-2xl border border-[#E5E5E7] bg-white overflow-hidden shadow-2xs">
          <div className="p-5 border-b border-[#E5E5E7] flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#0D0D0E]">Recent Execution Audit Trail</h3>
              <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
                Idempotent execution history and duration diagnostics for background jobs.
              </p>
            </div>
            <Badge variant="neutral" className="text-xs font-mono font-medium">
              {executions.length} Events Logged
            </Badge>
          </div>
          <div>
            {executions.length === 0 ? (
              <p className="text-xs text-[#8E8E93] py-12 text-center font-medium">
                No workflow execution events logged yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#F7F7F8] border-b border-[#E5E5E7] text-[#8E8E93] font-medium uppercase font-mono text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Rule Name</th>
                      <th className="py-3 px-4">Trigger Event</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E7]">
                    {executions.map((exec) => (
                      <tr key={exec.id} className="hover:bg-[#F7F7F8]/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-[#8E8E93] text-xs">
                          {new Date(exec.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#0D0D0E]">
                          {exec.rule_name || "Custom Rule"}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#8E8E93] text-xs">
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
                        <td className="py-3 px-4 font-mono font-semibold text-[#0D0D0E] text-xs">
                          {exec.duration_ms ? `${exec.duration_ms}ms` : "—"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {exec.status === "failed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs font-semibold text-[#FF7900] hover:text-[#E66D00]"
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
