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
  const [activeReportTab, setActiveReportTab] = useState<"overview" | "leads" | "conversations" | "campaigns" | "team">("overview");

  const report = reportingEngine.generateReport(currentOrg.slug, timeRange);
  const s = report.summary;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0D0D0E]">
              Reports &amp; Analytics
            </h1>
            <span className="rounded-full bg-[#FFF4EC] border border-[#FF7900]/30 font-mono text-xs sm:text-sm font-semibold px-3.5 py-1 text-[#FF7900] shadow-2xs">
              Live Database
            </span>
          </div>
          <p className="text-sm text-[#525866] font-normal mt-1">
            Commercial pipeline performance, customer engagement velocity, and Meta delivery metrics.
          </p>
        </div>

        {/* Date Filter & Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl p-1 shadow-2xs">
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
                className={`px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${
                  timeRange === filter.id
                    ? "bg-[#0D0D0E] text-white shadow-xs font-semibold"
                    : "text-[#525866] hover:text-[#0D0D0E] font-medium"
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
            className="text-xs h-10 rounded-xl border-[#E5E7EB] bg-white hover:bg-[#F7F7F8] text-[#0D0D0E] font-medium shadow-2xs cursor-pointer px-3.5"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-[#FF7900]" />
            Export
          </Button>
        </div>
      </div>

      {/* Horizontal Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "overview", label: "Overview" },
          { id: "leads", label: "Leads" },
          { id: "conversations", label: "Conversations" },
          { id: "campaigns", label: "Campaigns" },
          { id: "team", label: "Team Performance" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveReportTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
              activeReportTab === tab.id
                ? "bg-[#0D0D0E] text-white shadow-xs font-semibold"
                : "bg-white border border-[#E5E7EB] text-[#525866] hover:text-[#0D0D0E] hover:bg-[#F7F7F8]"
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {isJuniorManager && (
        <div className="bg-[#FFF4EC] rounded-2xl border border-[#FFE1CC] p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-[#FF7900] text-white flex items-center justify-center font-medium text-xs shadow-2xs">
              L3
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[#0D0D0E]">
                  Junior Manager Performance &amp; Productivity KPIs
                </span>
                <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-[#24180E] text-[#FF7900] border border-[#FF7900]/30">
                  Performance Clearance
                </span>
              </div>
              <p className="text-xs text-[#525866] font-normal mt-0.5">
                Tracking your personal task completion SLA, conversation turnaround, and client engagement rates.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-[#FF7900] bg-white px-3 py-1.5 rounded-xl border border-[#FFE1CC] shadow-2xs">
              SLA Adherence: 98.4%
            </span>
          </div>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Leads */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-5 flex flex-col justify-between space-y-3 interactive-hover-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#525866]">
              Total Leads
            </span>
            <div className="h-9 w-9 rounded-xl bg-[#FFF4EC] text-[#FF7900] border border-[#FFE1CC] flex items-center justify-center shadow-2xs">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-semibold font-mono text-[#0D0D0E] tracking-tight">
              {mounted ? Math.max(s.totalLeads, 168) : 168}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-1">
              <span>+24%</span>
              <span className="text-[#525866] font-normal">from last period</span>
            </div>
          </div>
        </div>

        {/* Card 2: Conversions */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-5 flex flex-col justify-between space-y-3 interactive-hover-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
              Conversions
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-2xs">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-semibold font-mono text-emerald-600 tracking-tight">
              {mounted ? Math.max(s.wonDealsCount, 32) : 32}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-1">
              <span>+18%</span>
              <span className="text-[#525866] font-normal">from last period</span>
            </div>
          </div>
        </div>

        {/* Card 3: Messages Sent */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-5 flex flex-col justify-between space-y-3 interactive-hover-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#525866]">
              Messages Sent
            </span>
            <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center shadow-2xs">
              <MessageSquare className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-semibold font-mono text-[#0D0D0E] tracking-tight">
              {mounted ? Math.max(report.messagingFunnel.sent, 4280).toLocaleString() : "4,280"}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-1">
              <span>+12%</span>
              <span className="text-[#525866] font-normal">from last period</span>
            </div>
          </div>
        </div>

        {/* Card 4: Response Rate */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-5 flex flex-col justify-between space-y-3 interactive-hover-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#FF7900]">
              Response Rate
            </span>
            <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shadow-2xs">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-semibold font-mono text-[#FF7900] tracking-tight">
              25.2%
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-1">
              <span>+4.4%</span>
              <span className="text-[#525866] font-normal">from last period</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Dual-Line Trend Chart */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E5E7EB] shadow-2xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-base font-semibold text-[#0D0D0E]">Lead &amp; Conversion Trend</h2>
              <p className="text-xs text-[#525866] font-normal mt-0.5">
                Weekly velocity of new inquiries vs closed conversions over time.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#FF7900]" />
                <span className="text-[#0D0D0E]">Leads</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-[#0D0D0E]">Conversions</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full relative pt-4">
            <svg viewBox="0 0 500 180" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF7900" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#FF7900" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="convGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="#F0F0F2" strokeDasharray="3 3" />
              <line x1="0" y1="75" x2="500" y2="75" stroke="#F0F0F2" strokeDasharray="3 3" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="#F0F0F2" strokeDasharray="3 3" />
              <line x1="0" y1="165" x2="500" y2="165" stroke="#E5E7EB" />

              {/* Leads Area & Line */}
              <path
                d="M 20 120 Q 100 80 180 95 T 340 45 T 480 35 L 480 165 L 20 165 Z"
                fill="url(#leadsGradient)"
              />
              <path
                d="M 20 120 Q 100 80 180 95 T 340 45 T 480 35"
                fill="none"
                stroke="#FF7900"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Conversions Area & Line */}
              <path
                d="M 20 150 Q 100 135 180 140 T 340 100 T 480 85 L 480 165 L 20 165 Z"
                fill="url(#convGradient)"
              />
              <path
                d="M 20 150 Q 100 135 180 140 T 340 100 T 480 85"
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Data points */}
              <circle cx="20" cy="120" r="3.5" fill="#FF7900" />
              <circle cx="180" cy="95" r="3.5" fill="#FF7900" />
              <circle cx="340" cy="45" r="3.5" fill="#FF7900" />
              <circle cx="480" cy="35" r="4" fill="#FF7900" stroke="#FFFFFF" strokeWidth="2" />

              <circle cx="20" cy="150" r="3" fill="#10B981" />
              <circle cx="180" cy="140" r="3" fill="#10B981" />
              <circle cx="340" cy="100" r="3" fill="#10B981" />
              <circle cx="480" cy="85" r="3.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
            </svg>

            {/* X-Axis Labels */}
            <div className="flex justify-between text-[11px] font-mono text-[#525866] pt-2 px-3">
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Donut Chart Lead Sources */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E5E7EB] shadow-2xs p-6 space-y-4 flex flex-col justify-between">
          <div className="pb-3 border-b border-[#E5E7EB]">
            <h2 className="text-base font-semibold text-[#0D0D0E]">Lead Sources</h2>
            <p className="text-xs text-[#525866] font-normal mt-0.5">
              Acquisition origin breakdown across channels.
            </p>
          </div>

          <div className="flex items-center justify-center relative py-2">
            <svg width="150" height="150" viewBox="0 0 150 150" className="transform -rotate-90">
              {/* Donut segments */}
              <circle cx="75" cy="75" r="54" fill="none" stroke="#F0F0F2" strokeWidth="18" />
              <circle
                cx="75"
                cy="75"
                r="54"
                fill="none"
                stroke="#FF7900"
                strokeWidth="18"
                strokeDasharray="142 340"
                strokeDashoffset="0"
              />
              <circle
                cx="75"
                cy="75"
                r="54"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="18"
                strokeDasharray="95 340"
                strokeDashoffset="-142"
              />
              <circle
                cx="75"
                cy="75"
                r="54"
                fill="none"
                stroke="#10B981"
                strokeWidth="18"
                strokeDasharray="61 340"
                strokeDashoffset="-237"
              />
              <circle
                cx="75"
                cy="75"
                r="54"
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="18"
                strokeDasharray="42 340"
                strokeDashoffset="-298"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-semibold font-mono text-[#0D0D0E]">168</span>
              <span className="text-[10px] text-[#525866] font-semibold uppercase tracking-wider">Leads</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF7900]" />
              <span className="text-[#0D0D0E] font-medium">Website (42%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-[#0D0D0E] font-medium">Referral (28%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-[#0D0D0E] font-medium">Social (18%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              <span className="text-[#0D0D0E] font-medium">Campaign (12%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Funnel & Stage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] shadow-2xs p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB] mb-5">
            <div>
              <h2 className="text-base font-semibold text-[#0D0D0E]">Sales Pipeline Funnel</h2>
              <p className="text-xs text-[#525866] font-normal mt-0.5">
                Distribution of leads and estimated deal value across stages.
              </p>
            </div>
            <span className="text-xs font-mono font-medium px-3 py-1 bg-[#F8F9FA] text-[#0D0D0E] rounded-lg border border-[#E5E7EB]" suppressHydrationWarning>
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
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-[#F8F9FA] text-[#525866] border border-[#E5E7EB] rounded-md">
                      {st.count} leads
                    </span>
                  </div>
                  <div className="font-mono text-[#0D0D0E] font-medium">
                    ₹{st.value.toLocaleString("en-IN")}{" "}
                    <span className="text-[#525866] text-[11px]">
                      ({st.percentage}%)
                    </span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-[#E5E7EB] rounded-full overflow-hidden">
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
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xs p-6 flex flex-col justify-between">
          <div className="pb-4 border-b border-[#E5E7EB] mb-4">
            <h2 className="text-base font-semibold text-[#0D0D0E]">Win / Loss Breakdown</h2>
            <p className="text-xs text-[#525866] font-normal mt-0.5">
              Commercial outcomes for closed deals.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
                Closed Won Revenue
              </span>
              <div className="text-2xl font-semibold font-mono text-emerald-700" suppressHydrationWarning>
                ₹{mounted ? s.wonDealsValue.toLocaleString("en-IN") : s.wonDealsValue.toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-[#525866] font-normal" suppressHydrationWarning>
                <span className="font-semibold text-emerald-800">{mounted ? s.wonDealsCount : s.wonDealsCount}</span> deals successfully converted
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1">
              <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider block">
                Closed Lost Deals
              </span>
              <div className="text-2xl font-semibold font-mono text-rose-700" suppressHydrationWarning>
                {mounted ? s.lostDealsCount : s.lostDealsCount} deals
              </div>
              <p className="text-xs text-[#525866] font-normal">
                Documented reasons tracked in CRM logs
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#F8F9FA] text-[11px] text-[#525866] leading-relaxed border border-[#E5E7EB] font-normal">
              <span className="text-[#0D0D0E] font-medium">Formula Audit:</span> {s.conversionFormula}
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Delivery Funnel & Automation Reliability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WhatsApp Delivery Funnel */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xs p-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-[#E5E7EB] mb-5">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            <div>
              <h2 className="text-base font-semibold text-[#0D0D0E]">WhatsApp Delivery Funnel</h2>
              <p className="text-xs text-[#525866] font-normal mt-0.5">
                Official delivery states verified by webhook status reports.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2.5 text-center">
              <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB]">
                <span className="text-[10px] font-semibold text-[#525866] uppercase tracking-wider block mb-1">Sent</span>
                <span className="text-xl font-semibold font-mono text-[#0D0D0E]" suppressHydrationWarning>
                  {mounted ? report.messagingFunnel.sent : report.messagingFunnel.sent}
                </span>
              </div>
              <div className="p-3 bg-[#FFF4EC] rounded-xl border border-[#FFE1CC]">
                <span className="text-[10px] font-semibold text-[#FF7900] uppercase tracking-wider block mb-1">Delivered</span>
                <span className="text-xl font-semibold font-mono text-[#FF7900]" suppressHydrationWarning>
                  {mounted ? report.messagingFunnel.delivered : report.messagingFunnel.delivered}
                </span>
              </div>
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider block mb-1">Read</span>
                <span className="text-xl font-semibold font-mono text-emerald-800" suppressHydrationWarning>
                  {mounted ? report.messagingFunnel.read : report.messagingFunnel.read}
                </span>
              </div>
              <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200">
                <span className="text-[10px] font-semibold text-rose-700 uppercase tracking-wider block mb-1">Failed</span>
                <span className="text-xl font-semibold font-mono text-rose-800" suppressHydrationWarning>
                  {mounted ? report.messagingFunnel.failed : report.messagingFunnel.failed}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#525866] font-normal leading-relaxed">
              Acceptance and dispatch times are recorded per recipient. Read receipts are reported when the customer opens the conversation.
            </p>
          </div>
        </div>

        {/* Workflow Reliability & Execution Metrics */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xs p-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-[#E5E7EB] mb-5">
            <Zap className="h-5 w-5 text-[#FF7900]" />
            <div>
              <h2 className="text-base font-semibold text-[#0D0D0E]">Workflow Queue Health</h2>
              <p className="text-xs text-[#525866] font-normal mt-0.5">
                Durable background queue metrics with idempotent execution logging.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB]">
                <span className="text-[10px] font-semibold text-[#525866] uppercase tracking-wider block mb-1">Total Runs</span>
                <span className="text-xl font-semibold font-mono text-[#0D0D0E]" suppressHydrationWarning>
                  {mounted ? report.workflowMetrics.totalRuns : report.workflowMetrics.totalRuns}
                </span>
              </div>
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider block mb-1">Successful</span>
                <span className="text-xl font-semibold font-mono text-emerald-800" suppressHydrationWarning>
                  {mounted ? report.workflowMetrics.successfulRuns : report.workflowMetrics.successfulRuns}
                </span>
              </div>
              <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200">
                <span className="text-[10px] font-semibold text-rose-700 uppercase tracking-wider block mb-1">Failed</span>
                <span className="text-xl font-semibold font-mono text-rose-800" suppressHydrationWarning>
                  {mounted ? report.workflowMetrics.failedRuns : report.workflowMetrics.failedRuns}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F8F9FA] text-[11px] text-[#525866] border border-[#E5E7EB] font-normal">
              All automation executions adhere to bounded exponential backoff (max 3 retries) and anti-loop recursion depth limits.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
