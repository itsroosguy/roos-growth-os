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
import {
  ReportingEngine,
  ReportTimeRange,
  reportingEngine,
} from "@/lib/reports/reporting-engine";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  HelpCircle,
  MessageSquare,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

export default function ReportsPage() {
  const { currentOrg } = useTenant();
  const [timeRange, setTimeRange] = useState<ReportTimeRange>("30d");

  const report = reportingEngine.generateReport(currentOrg.slug, timeRange);
  const s = report.summary;

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-12">
      {/* Page Header & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/60">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Sales Reports & Business Analytics
            </h1>
            <span className="glass-pill rounded-full bg-white/80 border border-white text-xs font-semibold px-3 py-0.5 text-slate-700 shadow-xs">
              Live Database Records
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
            Real-time pipeline velocity, conversion metrics, and messaging delivery for {currentOrg.name}.
          </p>
        </div>

        {/* Date Filter & Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-white/70 backdrop-blur-sm border border-white/80 rounded-xl p-1 shadow-2xs">
            {(
              [
                { id: "7d", label: "7 Days" },
                { id: "30d", label: "30 Days" },
                { id: "this_month", label: "This Month" },
                { id: "all", label: "All Time" },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                onClick={() => setTimeRange(filter.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  timeRange === filter.id
                    ? "bg-white shadow-xs text-blue-600 font-bold border border-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => alert("Exporting executive summary CSV...")}
            className="text-xs h-9 rounded-xl border-white/80 bg-white/80 hover:bg-white text-slate-700 shadow-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Active Pipeline */}
        <div className="glass-card rounded-[22px] border border-white/70 shadow-glass bg-white/75 backdrop-blur-xl hover:bg-white/90 hover:shadow-glass hover:-translate-y-0.5 transition-all duration-200 p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Active Pipeline Value
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 border border-blue-500/20 shadow-xs">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
              ₹{s.pipelineValue.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Across {s.totalLeads} sales opportunities
            </p>
          </div>
        </div>

        {/* Card 2: Lead Conversion Rate */}
        <div className="glass-card rounded-[22px] border border-white/70 shadow-glass bg-white/75 backdrop-blur-xl hover:bg-white/90 hover:shadow-glass hover:-translate-y-0.5 transition-all duration-200 p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center">
              Lead Conversion Rate
              <span
                title={s.conversionFormula}
                className="ml-1 cursor-help inline-block text-slate-400 hover:text-slate-600"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </span>
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 border border-emerald-500/20 shadow-xs">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 tracking-tight">
              {s.leadConversionRate}%
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              {s.wonDealsCount} Won / {s.wonDealsCount + s.lostDealsCount} Closed Deals
            </p>
          </div>
        </div>

        {/* Card 3: Follow-Up Completion */}
        <div className="glass-card rounded-[22px] border border-white/70 shadow-glass bg-white/75 backdrop-blur-xl hover:bg-white/90 hover:shadow-glass hover:-translate-y-0.5 transition-all duration-200 p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Follow-up Completion
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 border border-amber-500/20 shadow-xs">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
              {s.taskCompletionRate}%
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
              <span>{s.completedTasksCount} of {s.totalTasks} completed</span>
              {s.overdueTasksCount > 0 && (
                <span className="text-rose-600 font-bold">
                  {s.overdueTasksCount} overdue
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Automation Reliability */}
        <div className="glass-card rounded-[22px] border border-white/70 shadow-glass bg-white/75 backdrop-blur-xl hover:bg-white/90 hover:shadow-glass hover:-translate-y-0.5 transition-all duration-200 p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Automation Health
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 border border-blue-500/20 shadow-xs">
              <Zap className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-600 tracking-tight">
              {s.workflowSuccessRate}%
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              {s.totalWorkflowExecutions} runs across {report.workflowMetrics.activeRulesCount} active rules
            </p>
          </div>
        </div>
      </div>

      {/* Pipeline Funnel & Stage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border bg-surface">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Sales Pipeline Funnel</CardTitle>
                <CardDescription className="text-xs">
                  Distribution of leads and estimated deal value by pipeline stage.
                </CardDescription>
              </div>
              <Badge variant="neutral" className="text-xs font-mono">
                Total Deals: ₹{s.pipelineValue.toLocaleString("en-IN")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.leadsByStage.map((st) => (
              <div key={st.stage} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-foreground">
                      {st.label}
                    </span>
                    <Badge variant="neutral" className="text-[10px]">
                      {st.count} leads
                    </Badge>
                  </div>
                  <div className="font-mono text-foreground font-medium">
                    ₹{st.value.toLocaleString("en-IN")}{" "}
                    <span className="text-foreground-secondary text-[11px]">
                      ({st.percentage}%)
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-surface-subtle rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      st.stage === "won"
                        ? "bg-google-green"
                        : st.stage === "lost"
                        ? "bg-google-red/60"
                        : "bg-google-blue"
                    }`}
                    style={{ width: `${Math.max(st.percentage, 3)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Won vs Lost Comparison Box */}
        <Card className="border-border bg-surface flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base">Win / Loss Breakdown</CardTitle>
            <CardDescription className="text-xs">
              Commercial outcomes for closed deals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-2xl bg-google-green-subtle/50 border border-google-green/20 space-y-1">
              <span className="text-xs font-semibold text-google-green uppercase tracking-wider block">
                Closed Won Deals
              </span>
              <div className="text-2xl font-bold text-google-green">
                ₹{s.wonDealsValue.toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-foreground-secondary">
                {s.wonDealsCount} deals successfully converted
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-google-red-subtle/50 border border-google-red/20 space-y-1">
              <span className="text-xs font-semibold text-google-red uppercase tracking-wider block">
                Closed Lost Deals
              </span>
              <div className="text-2xl font-bold text-google-red">
                {s.lostDealsCount} deals
              </div>
              <p className="text-xs text-foreground-secondary">
                Documented reasons tracked in CRM logs
              </p>
            </div>

            <div className="p-3 rounded-xl bg-surface-subtle text-[11px] text-foreground-secondary leading-relaxed border border-border">
              <strong>Formula Audit:</strong> {s.conversionFormula}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WhatsApp Delivery Funnel & Automation Reliability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WhatsApp Delivery Funnel */}
        <Card className="border-border bg-surface">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-google-green" />
              <CardTitle className="text-base">WhatsApp Delivery Funnel</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Official delivery states verified by webhook status reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-3 bg-surface-subtle rounded-xl">
                <span className="text-[11px] text-foreground-secondary block">Sent</span>
                <span className="text-base font-bold text-foreground">
                  {report.messagingFunnel.sent}
                </span>
              </div>
              <div className="p-3 bg-surface-subtle rounded-xl">
                <span className="text-[11px] text-foreground-secondary block">Delivered</span>
                <span className="text-base font-bold text-google-blue">
                  {report.messagingFunnel.delivered}
                </span>
              </div>
              <div className="p-3 bg-surface-subtle rounded-xl">
                <span className="text-[11px] text-foreground-secondary block">Read</span>
                <span className="text-base font-bold text-google-green">
                  {report.messagingFunnel.read}
                </span>
              </div>
              <div className="p-3 bg-surface-subtle rounded-xl">
                <span className="text-[11px] text-foreground-secondary block">Failed</span>
                <span className="text-base font-bold text-google-red">
                  {report.messagingFunnel.failed}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-foreground-secondary leading-relaxed">
              Acceptance and dispatch times are recorded per recipient. Read receipts are reported when the customer opens the conversation.
            </p>
          </CardContent>
        </Card>

        {/* Workflow Reliability & Execution Metrics */}
        <Card className="border-border bg-surface">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-google-blue" />
              <CardTitle className="text-base">Workflow Queue Health</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Durable background queue metrics with idempotent execution logging.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-surface-subtle rounded-xl">
                <span className="text-[11px] text-foreground-secondary block">Total Runs</span>
                <span className="text-base font-bold text-foreground">
                  {report.workflowMetrics.totalRuns}
                </span>
              </div>
              <div className="p-3 bg-surface-subtle rounded-xl">
                <span className="text-[11px] text-foreground-secondary block">Successful</span>
                <span className="text-base font-bold text-google-green">
                  {report.workflowMetrics.successfulRuns}
                </span>
              </div>
              <div className="p-3 bg-surface-subtle rounded-xl">
                <span className="text-[11px] text-foreground-secondary block">Failed / Retried</span>
                <span className="text-base font-bold text-google-red">
                  {report.workflowMetrics.failedRuns}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-subtle text-[11px] text-foreground-secondary border border-border">
              All automation executions adhere to bounded exponential backoff (max 3 retries) and anti-loop recursion depth limits.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
