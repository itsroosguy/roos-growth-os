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
    <div className="space-y-7 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/60">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Workflow Automation & Triggers
            </h1>
            <span className="glass-pill rounded-full bg-white/80 border border-white text-xs font-semibold px-3 py-0.5 text-slate-700 shadow-xs">
              {workflowUsage.current_count} / {workflowUsage.max_quota} Active Workflows
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
            Automate lead assignments, follow-up reminders, and customer notifications for {currentOrg.name}.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-white/70 backdrop-blur-sm border border-white/80 rounded-xl p-1 shadow-2xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("workflows")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === "workflows"
                ? "bg-white shadow-xs text-blue-600 font-bold border border-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Configured Workflows ({rules.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === "templates"
                ? "bg-white shadow-xs text-blue-600 font-bold border border-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>Templates A–F</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === "history"
                ? "bg-white shadow-xs text-blue-600 font-bold border border-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Execution Logs</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="rounded-2xl bg-blue-50/90 backdrop-blur-sm p-4 border border-blue-200/80 text-xs text-blue-700 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 shrink-0 text-blue-600" />
            <span className="font-semibold">{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-bold underline ml-4 hover:text-blue-900 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Tab 1: Configured Workflows */}
      {activeTab === "workflows" && (
        <div className="space-y-4">
          {rules.length === 0 ? (
            <div className="p-10 text-center glass-panel rounded-3xl border border-white/70 bg-white/75 backdrop-blur-xl shadow-glass">
              <Zap className="h-9 w-9 text-blue-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-900">
                No automation rules active yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Activate one of our pre-built workflow templates with a single click.
              </p>
              <Button
                variant="default"
                size="sm"
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
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
                  className={`glass-card rounded-[22px] border border-white/75 bg-white/80 backdrop-blur-xl p-5 shadow-glass hover:bg-white/95 transition-all ${
                    rule.is_active ? "border-l-4 border-l-blue-600" : "opacity-80"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-foreground text-sm">
                          {rule.name}
                        </span>
                        <Badge
                          variant={rule.is_active ? "success" : "neutral"}
                          className="text-[10px] uppercase font-bold"
                        >
                          {rule.is_active ? "Active" : "Paused"}
                        </Badge>
                        <Badge variant="neutral" className="text-[10px] font-mono">
                          {rule.trigger_type}
                        </Badge>
                      </div>

                      <p className="text-xs text-foreground-secondary">
                        {rule.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-foreground-secondary">
                        <span>
                          <strong>Actions:</strong> {rule.actions.map((a) => a.type).join(" → ")}
                        </span>
                        <span>•</span>
                        <span>
                          <strong>Runs:</strong> {rule.total_executions} ({rule.success_count} success, {rule.failure_count} fail)
                        </span>
                        {rule.last_executed_at && (
                          <>
                            <span>•</span>
                            <span>
                              <strong>Last Run:</strong> {new Date(rule.last_executed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => handleTestTrigger(rule)}
                        title="Simulate trigger event"
                      >
                        <Play className="h-3 w-3 mr-1 text-google-blue" />
                        Test Run
                      </Button>

                      <Button
                        variant={rule.is_active ? "secondary" : "default"}
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => handleToggleRule(rule.id, rule.is_active)}
                      >
                        {rule.is_active ? "Pause" : "Enable"}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-google-red hover:bg-google-red-subtle"
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
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Predefined Workflow Templates (Templates A–F)
            </h2>
            <p className="text-xs text-slate-500">
              Production-tested workflow patterns ready for instant activation with zero coding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PREDEFINED_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                className="p-5 flex flex-col justify-between glass-card rounded-[22px] border border-white/75 bg-white/80 backdrop-blur-xl shadow-glass hover:bg-white/95 hover:shadow-glass hover:-translate-y-0.5 transition-all duration-200"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="neutral" className="text-[10px] uppercase font-bold shadow-2xs">
                      {tmpl.category.replace("_", " ")}
                    </Badge>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">
                      {tmpl.id.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 mb-1">
                    {tmpl.name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    {tmpl.tagline}
                  </p>

                  <div className="space-y-2 text-xs bg-white/60 p-3.5 rounded-2xl border border-white/80 backdrop-blur-xs mb-4 shadow-2xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        When (Trigger):
                      </span>
                      <span className="text-slate-800 font-semibold">{tmpl.trigger_label}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Then (Actions):
                      </span>
                      <span className="text-slate-700">
                        {tmpl.actions.length} automated steps (tasks, assignment & internal notes)
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="default"
                  size="sm"
                  className="w-full text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
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
        <Card className="border-border bg-surface">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Execution Audit Trail</CardTitle>
                <CardDescription className="text-xs">
                  Idempotent execution history and duration diagnostics for background jobs.
                </CardDescription>
              </div>
              <Badge variant="neutral" className="text-xs font-mono">
                {executions.length} Events Logged
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {executions.length === 0 ? (
              <p className="text-xs text-foreground-secondary py-6 text-center">
                No workflow execution events logged yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-foreground-secondary font-medium">
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Rule Name</th>
                      <th className="py-2.5 px-3">Trigger Event</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Duration</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {executions.map((exec) => (
                      <tr key={exec.id} className="hover:bg-surface-subtle/50">
                        <td className="py-3 px-3 font-mono text-foreground-secondary">
                          {new Date(exec.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-3 font-semibold text-foreground">
                          {exec.rule_name || "Custom Rule"}
                        </td>
                        <td className="py-3 px-3 font-mono text-foreground-secondary">
                          {exec.trigger_event}
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              exec.status === "completed"
                                ? "success"
                                : exec.status === "failed"
                                ? "danger"
                                : "warning"
                            }
                            className="text-[10px]"
                          >
                            {exec.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 font-mono text-foreground-secondary">
                          {exec.duration_ms ? `${exec.duration_ms}ms` : "—"}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {exec.status === "failed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-google-blue"
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
