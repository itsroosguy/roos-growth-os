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
import { useMounted } from "@/lib/use-mounted";

export default function ReportsPage() {
  const { currentOrg, isJuniorManager } = useTenant();
  const mounted = useMounted();
  const [timeRange, setTimeRange] = useState<ReportTimeRange>("30d");

  const report = reportingEngine.generateReport(currentOrg.slug, timeRange);
  const s = report.summary;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E5E7]">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0D0D0E]">
              Sales Reports &amp; Analytics
            </h1>
            <span className="rounded-full bg-[#FFF4EC] border border-[#FF7900]/30 font-mono text-[11px] font-medium px-2.5 py-0.5 text-[#FF7900]">
              Live Database
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8E8E93] font-medium mt-1">
            Real-time pipeline velocity, conversion metrics, and messaging delivery for {currentOrg.name}.
          </p>
        </div>

        {/* Date Filter & Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-[#F7F7F8] border border-[#E5E5E7] rounded-xl p-1 shadow-2xs">
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
                    ? "bg-[#24180E] text-[#FF7900] shadow-2xs border border-[#FF7900]/30"
                    : "text-[#8E8E93] hover:text-[#0D0D0E]"
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
            className="text-xs h-9 rounded-xl border-[#E5E5E7] bg-white hover:bg-[#F7F7F8] text-[#0D0D0E] font-semibold shadow-2xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-[#FF7900]" />
            Export CSV
          </Button>
        </div>
      </div>

      {isJuniorManager && (
        <div className="bg-[#FFF4EC] rounded-2xl border border-[#FF7900]/30 p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-[#FF7900] text-white flex items-center justify-center font-semibold text-xs shadow-2xs">
              L3
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[#0D0D0E]">
                  Junior Manager Performance &amp; Productivity KPIs
                </span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#24180E] text-[#FF7900] border border-[#FF7900]/30">
                  Performance Clearance
                </span>
              </div>
              <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
                Tracking your personal task completion SLA, conversation turnaround, and client engagement rates.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-[#FF7900] bg-white px-3 py-1.5 rounded-xl border border-[#FF7900]/30 shadow-2xs">
              SLA Adherence: 98.4%
            </span>
          </div>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Active Pipeline */}
        <div className="bg-[#121214] text-white rounded-2xl border border-[#1F1F23] shadow-xs p-5 flex flex-col justify-between space-y-4 interactive-hover-card">
          <div className="flex items-center justify-between text-[#8E8E93]">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#FF7900]">
              Active Pipeline Value
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#24180E] text-[#FF7900] border border-[#FF7900]/30">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div
              className="text-2xl sm:text-3xl font-semibold font-mono text-white tracking-tight"
              suppressHydrationWarning
            >
              ₹{mounted ? s.pipelineValue.toLocaleString("en-IN") : s.pipelineValue.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-[#8E8E93] font-medium mt-1.5" suppressHydrationWarning>
              Across <span className="font-semibold text-white">{mounted ? s.totalLeads : s.totalLeads}</span> opportunities
            </p>
          </div>
        </div>

        {/* Card 2: Lead Conversion Rate */}
        <div className="bg-white rounded-2xl border border-[#E5E5E7] shadow-xs p-5 flex flex-col justify-between space-y-4 interactive-hover-card">
          <div className="flex items-center justify-between text-[#8E8E93]">
            <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-800 flex items-center">
              Lead Win Rate
              <span
                title={s.conversionFormula}
                className="ml-1 cursor-help inline-block text-[#8E8E93] hover:text-[#0D0D0E]"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </span>
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div
              className="text-2xl sm:text-3xl font-semibold font-mono text-emerald-600 tracking-tight"
              suppressHydrationWarning
            >
              {mounted ? s.leadConversionRate : s.leadConversionRate}%
            </div>
            <p className="text-xs text-[#8E8E93] font-medium mt-1.5" suppressHydrationWarning>
              <span className="font-semibold text-emerald-600">{mounted ? s.wonDealsCount : s.wonDealsCount}</span> Won / <span className="font-semibold text-[#0D0D0E]">{mounted ? s.wonDealsCount + s.lostDealsCount : s.wonDealsCount + s.lostDealsCount}</span> Closed
            </p>
          </div>
        </div>

        {/* Card 3: Follow-Up Completion */}
        <div className="bg-white rounded-2xl border border-[#E5E5E7] shadow-xs p-5 flex flex-col justify-between space-y-4 interactive-hover-card">
          <div className="flex items-center justify-between text-[#8E8E93]">
            <span className="text-[11px] font-medium uppercase tracking-wider text-amber-800">
              Follow-up Completion
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div
              className="text-2xl sm:text-3xl font-semibold font-mono text-[#0D0D0E] tracking-tight"
              suppressHydrationWarning
            >
              {mounted ? s.taskCompletionRate : s.taskCompletionRate}%
            </div>
            <div className="flex items-center justify-between text-xs text-[#8E8E93] font-medium mt-1.5" suppressHydrationWarning>
              <span>{mounted ? s.completedTasksCount : s.completedTasksCount} of {mounted ? s.totalTasks : s.totalTasks} done</span>
              {s.overdueTasksCount > 0 && (
                <span className="text-rose-600 font-semibold">
                  {mounted ? s.overdueTasksCount : s.overdueTasksCount} overdue
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Automation Reliability */}
        <div className="bg-white rounded-2xl border border-[#E5E5E7] shadow-xs p-5 flex flex-col justify-between space-y-4 interactive-hover-card">
          <div className="flex items-center justify-between text-[#8E8E93]">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#FF7900]">
              Workflow Health
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF4EC] text-[#FF7900] border border-[#FF7900]/30">
              <Zap className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div
              className="text-2xl sm:text-3xl font-semibold font-mono text-[#FF7900] tracking-tight"
              suppressHydrationWarning
            >
              {mounted ? s.workflowSuccessRate : s.workflowSuccessRate}%
            </div>
            <p className="text-xs text-[#8E8E93] font-medium mt-1.5" suppressHydrationWarning>
              <span className="font-semibold text-[#0D0D0E]">{mounted ? s.totalWorkflowExecutions : s.totalWorkflowExecutions}</span> runs across {report.workflowMetrics.activeRulesCount} rules
            </p>
          </div>
        </div>
      </div>

      {/* Pipeline Funnel & Stage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E5E7] shadow-2xs p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7] mb-5">
            <div>
              <h2 className="text-base font-semibold text-[#0D0D0E]">Sales Pipeline Funnel</h2>
              <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
                Distribution of leads and estimated deal value across stages.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-3 py-1 bg-[#F7F7F8] text-[#0D0D0E] rounded-lg border border-[#E5E5E7]" suppressHydrationWarning>
              Total: ₹{mounted ? s.pipelineValue.toLocaleString("en-IN") : s.pipelineValue.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="space-y-4">
            {report.leadsByStage.map((st) => (
              <div key={st.stage} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-[#0D0D0E]">
                      {st.label}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-[#F7F7F8] text-[#8E8E93] border border-[#E5E5E7] rounded-md">
                      {st.count} leads
                    </span>
                  </div>
                  <div className="font-mono text-[#0D0D0E] font-semibold">
                    ₹{st.value.toLocaleString("en-IN")}{" "}
                    <span className="text-[#8E8E93] font-semibold text-[11px]">
                      ({st.percentage}%)
                    </span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-[#E5E5E7] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      st.stage === "won"
                        ? "bg-emerald-500"
                        : st.stage === "lost"
                        ? "bg-rose-500"
                        : "bg-[#FF7900]"
                    }`}
                    style={{ width: `${Math.max(st.percentage, 3)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Won vs Lost Comparison Box */}
        <div className="bg-white rounded-2xl border border-[#E5E5E7] shadow-2xs p-6 flex flex-col justify-between">
          <div className="pb-4 border-b border-[#E5E5E7] mb-4">
            <h2 className="text-base font-semibold text-[#0D0D0E]">Win / Loss Breakdown</h2>
            <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
              Commercial outcomes for closed deals.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
              <span className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider block">
                Closed Won Revenue
              </span>
              <div className="text-2xl font-semibold font-mono text-emerald-700" suppressHydrationWarning>
                ₹{mounted ? s.wonDealsValue.toLocaleString("en-IN") : s.wonDealsValue.toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-[#8E8E93] font-medium" suppressHydrationWarning>
                <span className="font-semibold text-emerald-800">{mounted ? s.wonDealsCount : s.wonDealsCount}</span> deals successfully converted
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1">
              <span className="text-[11px] font-medium text-rose-800 uppercase tracking-wider block">
                Closed Lost Deals
              </span>
              <div className="text-2xl font-semibold font-mono text-rose-700" suppressHydrationWarning>
                {mounted ? s.lostDealsCount : s.lostDealsCount} deals
              </div>
              <p className="text-xs text-[#8E8E93] font-medium">
                Documented reasons tracked in CRM logs
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#F7F7F8] text-[11px] text-[#8E8E93] leading-relaxed border border-[#E5E5E7] font-medium">
              <strong className="text-[#0D0D0E]">Formula Audit:</strong> {s.conversionFormula}
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Delivery Funnel & Automation Reliability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WhatsApp Delivery Funnel */}
        <div className="bg-white rounded-2xl border border-[#E5E5E7] shadow-2xs p-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-[#E5E5E7] mb-5">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            <div>
              <h2 className="text-base font-semibold text-[#0D0D0E]">WhatsApp Delivery Funnel</h2>
              <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
                Official delivery states verified by webhook status reports.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2.5 text-center">
              <div className="p-3 bg-[#F7F7F8] rounded-xl border border-[#E5E5E7]">
                <span className="text-[10px] font-medium text-[#8E8E93] uppercase tracking-wider block mb-1">Sent</span>
                <span className="text-xl font-semibold font-mono text-[#0D0D0E]" suppressHydrationWarning>
                  {mounted ? report.messagingFunnel.sent : report.messagingFunnel.sent}
                </span>
              </div>
              <div className="p-3 bg-[#FFF4EC] rounded-xl border border-[#FF7900]/30">
                <span className="text-[10px] font-medium text-[#FF7900] uppercase tracking-wider block mb-1">Delivered</span>
                <span className="text-xl font-semibold font-mono text-[#FF7900]" suppressHydrationWarning>
                  {mounted ? report.messagingFunnel.delivered : report.messagingFunnel.delivered}
                </span>
              </div>
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-medium text-emerald-700 uppercase tracking-wider block mb-1">Read</span>
                <span className="text-xl font-semibold font-mono text-emerald-800" suppressHydrationWarning>
                  {mounted ? report.messagingFunnel.read : report.messagingFunnel.read}
                </span>
              </div>
              <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200">
                <span className="text-[10px] font-medium text-rose-700 uppercase tracking-wider block mb-1">Failed</span>
                <span className="text-xl font-semibold font-mono text-rose-800" suppressHydrationWarning>
                  {mounted ? report.messagingFunnel.failed : report.messagingFunnel.failed}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#8E8E93] font-medium leading-relaxed">
              Acceptance and dispatch times are recorded per recipient. Read receipts are reported when the customer opens the conversation.
            </p>
          </div>
        </div>

        {/* Workflow Reliability & Execution Metrics */}
        <div className="bg-white rounded-2xl border border-[#E5E5E7] shadow-2xs p-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-[#E5E5E7] mb-5">
            <Zap className="h-5 w-5 text-[#FF7900]" />
            <div>
              <h2 className="text-base font-semibold text-[#0D0D0E]">Workflow Queue Health</h2>
              <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
                Durable background queue metrics with idempotent execution logging.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 bg-[#F7F7F8] rounded-xl border border-[#E5E5E7]">
                <span className="text-[10px] font-medium text-[#8E8E93] uppercase tracking-wider block mb-1">Total Runs</span>
                <span className="text-xl font-semibold font-mono text-[#0D0D0E]" suppressHydrationWarning>
                  {mounted ? report.workflowMetrics.totalRuns : report.workflowMetrics.totalRuns}
                </span>
              </div>
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-medium text-emerald-700 uppercase tracking-wider block mb-1">Successful</span>
                <span className="text-xl font-semibold font-mono text-emerald-800" suppressHydrationWarning>
                  {mounted ? report.workflowMetrics.successfulRuns : report.workflowMetrics.successfulRuns}
                </span>
              </div>
              <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200">
                <span className="text-[10px] font-medium text-rose-700 uppercase tracking-wider block mb-1">Failed</span>
                <span className="text-xl font-semibold font-mono text-rose-800" suppressHydrationWarning>
                  {mounted ? report.workflowMetrics.failedRuns : report.workflowMetrics.failedRuns}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F7F7F8] text-[11px] text-[#8E8E93] border border-[#E5E5E7] font-medium">
              All automation executions adhere to bounded exponential backoff (max 3 retries) and anti-loop recursion depth limits.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
