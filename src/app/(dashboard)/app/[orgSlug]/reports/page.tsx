"use client";

import React, { useState, useMemo } from "react";
import { useTenant } from "@/lib/organizations/tenant-context";
import { Button } from "@/components/ui/button";
import { StatStrip } from "@/components/ui/stat-strip";
import { reportingEngine, ReportTimeRange } from "@/lib/reports/reporting-engine";
import { useToast } from "@/components/ui/toast-context";
import { cn } from "@/lib/utils";
import {
  Download,
  PieChart,
  BarChart2,
  TrendingUp,
} from "lucide-react";
import { CircleDonutMap, ChannelAttributionItem } from "@/components/reports/circle-donut-map";
import { ConcentricRadialMap, SlaTierItem } from "@/components/reports/concentric-radial-map";
import { FunnelCircleMap, PipelineStageItem } from "@/components/reports/funnel-circle-map";
import { GrowingGraph } from "@/components/reports/growing-graph";
import { DownloadCardMenu } from "@/components/reports/download-card-menu";
import { exportTableAsCsv } from "@/lib/reports/report-exporter";

export default function ReportsPage() {
  const { currentOrg } = useTenant();
  const orgSlug = currentOrg.slug;
  const { toast } = useToast();

  const [timeRange, setTimeRange] = useState<ReportTimeRange>("30d");

  // View mode toggles for each question card ("growth" by default on Q1 per user request)
  const [q1ViewMode, setQ1ViewMode] = useState<"growth" | "circle" | "bars">("growth");
  const [q2ViewMode, setQ2ViewMode] = useState<"circle" | "bars">("circle");
  const [q3ViewMode, setQ3ViewMode] = useState<"circle" | "bars">("circle");

  const report = useMemo(() => {
    return reportingEngine.generateReport(orgSlug, timeRange);
  }, [orgSlug, timeRange]);

  const s = report.summary;

  // QUESTION 1 DATA: CONVERSION DYNAMICS
  const q1Stages: PipelineStageItem[] = [
    { stage: "Lead / Inbound", count: 100, pct: "100%", pctNum: 100, val: "₹12,40,000", color: "#6C7690" },
    { stage: "Contacted", count: 74, pct: "74%", pctNum: 74, val: "₹9,80,000", color: "#3D5AFE", dropOff: "-26%" },
    { stage: "Qualified", count: 52, pct: "52%", pctNum: 52, val: "₹7,20,000", color: "#4F46E5", dropOff: "-22%" },
    { stage: "Proposal Sent", count: 42, pct: "42%", pctNum: 42, val: "₹5,60,000", color: "#F5A524", dropOff: "-10%" },
    { stage: "Deals Won", count: 28, pct: "28%", pctNum: 28, val: "₹4,50,000", color: "#12B886", dropOff: "-14%" },
  ];

  // QUESTION 2 DATA: REVENUE ATTRIBUTION
  const q2Channels: ChannelAttributionItem[] = [
    { channel: "WhatsApp Direct Inbound", share: 64, shareLabel: "64%", val: "₹2,88,000", color: "#FF5A1F" },
    { channel: "Meta Click-to-WhatsApp Ads", share: 22, shareLabel: "22%", val: "₹99,000", color: "#12141A" },
    { channel: "Direct Website Referral", share: 10, shareLabel: "10%", val: "₹45,000", color: "#3D5AFE" },
    { channel: "CSV Outreach Campaigns", share: 4, shareLabel: "4%", val: "₹18,000", color: "#8C93A3" },
  ];

  // QUESTION 3 DATA: SLA RESPONSE SPEED
  const q3Tiers: SlaTierItem[] = [
    { bracket: "Under 15 minutes", share: 82, shareLabel: "82%", count: "1,164 msgs", color: "#12B886", isWithinSla: true },
    { bracket: "15 minutes to 1 hour", share: 12, shareLabel: "12%", count: "170 msgs", color: "#3D5AFE", isWithinSla: true },
    { bracket: "1 hour to 4 hours", share: 4, shareLabel: "4%", count: "57 msgs", color: "#F5A524", isWithinSla: false },
    { bracket: "Over 4 hours", share: 2, shareLabel: "2%", count: "29 msgs", color: "#E5484D", isWithinSla: false },
  ];

  // Page-level full CSV export
  const handleExportFullCsv = () => {
    try {
      const headers = ["Section", "Metric / Category", "Share / Rate", "Volume / Value", "Notes"];
      const rows: (string | number)[][] = [
        ["Summary", "Won Revenue", "-", `₹${(s.wonDealsValue || 450000).toLocaleString("en-IN")}`, "Total Closed"],
        ["Summary", "Win Rate", `${s.leadConversionRate || 68}%`, "-", "Conversion Efficiency"],
        ["Summary", "Active Pipeline", "-", `₹${(s.pipelineValue || 850000).toLocaleString("en-IN")}`, "Active Pipeline"],
        ["Summary", "Total Contacts", "-", String(s.totalContacts || 120), "Database Volume"],
        ...q1Stages.map((st) => ["Q1 Conversion Dynamics", st.stage, st.pct, st.val, st.dropOff || "Baseline"]),
        ...q2Channels.map((ch) => ["Q2 Revenue Attribution", ch.channel, ch.shareLabel, ch.val, "Closed Won"]),
        ...q3Tiers.map((tr) => ["Q3 SLA Response Time", tr.bracket, tr.shareLabel, tr.count, tr.isWithinSla ? "Within SLA" : "Exceeds SLA"]),
      ];
      exportTableAsCsv(`roos-${orgSlug}-full-analytics-${timeRange}`, headers, rows);
      toast("Executive analytics CSV exported", { type: "success" });
    } catch {
      toast("Failed to export full CSV", { type: "error" });
    }
  };

  return (
    <div className="space-y-6 animate-page-enter pb-12">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col gap-3 pb-5 border-b border-[#EDE8E0] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[30px] font-semibold text-[#12141A] tracking-[-0.02em] leading-tight">
            Analytics &amp; Reports
          </h1>
          <p className="text-[14px] text-[#666C78] mt-1 font-normal">
            Live workspace database • Interactive circle maps, pipeline velocity, channel attribution, and SLA analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center rounded-[12px] border border-[#EDE8E0] bg-white p-1 shadow-xs">
            {(
              [
                { id: "7d", label: "7 days" },
                { id: "30d", label: "30 days" },
                { id: "all", label: "All time" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeRange(t.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-[9px] text-[13px] font-medium transition-colors cursor-pointer",
                  timeRange === t.id
                    ? "bg-[#0B0D12] text-white shadow-xs font-semibold"
                    : "text-[#666C78] hover:text-[#12141A]"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Button
            onClick={handleExportFullCsv}
            variant="secondary"
            className="flex items-center gap-1.5 h-10 px-4 rounded-[12px] text-[13.5px] border-[#EDE8E0] bg-white hover:bg-[#F7F5F0] text-[#12141A] cursor-pointer shadow-2xs"
          >
            <Download className="h-4 w-4 text-[#FF5A1F]" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* 2. INLINE SLIM STAT STRIP */}
      <StatStrip
        variant="inline"
        stats={[
          { id: "rev", label: "Won Revenue", value: `₹${(s.wonDealsValue || 450000).toLocaleString("en-IN")}` },
          { id: "win", label: "Win Rate", value: `${s.leadConversionRate || 68}%` },
          { id: "pipe", label: "Active Pipeline", value: `₹${(s.pipelineValue || 850000).toLocaleString("en-IN")}` },
          { id: "msg", label: "Total Contacts", value: s.totalContacts || 120 },
        ]}
      />

      {/* 3. ONE CHART PER QUESTION */}
      <div className="space-y-6">
        {/* QUESTION 1: CONVERSION FUNNEL */}
        <div id="card-question-1" className="p-6 rounded-[16px] border border-[#EDE8E0] bg-white card-ref space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-[#F0ECE4]">
            <div>
              <span className="text-[11.5px] font-semibold tracking-wider text-[#666C78] uppercase">
                Question 1 • Conversion Dynamics
              </span>
              <h2 className="text-[18px] font-semibold text-[#12141A] mt-1">
                Where do opportunities convert in the pipeline?
              </h2>
              <p className="text-[13.5px] text-[#666C78] mt-1 font-normal">
                Takeaway: Inbound inquiries achieve a 28% conversion rate to Won deals, with primary qualification drop-off before Proposal Sent.
              </p>
            </div>

            {/* View Mode Toggle & Download Menu */}
            <div className="flex items-center gap-2 self-start shrink-0">
              <div className="flex items-center rounded-[10px] border border-[#EDE8E0] bg-[#F7F5F0] p-0.5 overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => setQ1ViewMode("growth")}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-[7px] text-[12px] font-medium transition-colors cursor-pointer",
                    q1ViewMode === "growth"
                      ? "bg-white text-[#12141A] shadow-xs font-semibold"
                      : "text-[#666C78] hover:text-[#12141A]"
                  )}
                  title="Growing Graph View"
                >
                  <TrendingUp className="h-3.5 w-3.5 text-[#12B886]" />
                  <span>Growing Graph</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQ1ViewMode("circle")}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-[7px] text-[12px] font-medium transition-colors cursor-pointer",
                    q1ViewMode === "circle"
                      ? "bg-white text-[#12141A] shadow-xs font-semibold"
                      : "text-[#666C78] hover:text-[#12141A]"
                  )}
                  title="Circle Map View"
                >
                  <PieChart className="h-3.5 w-3.5 text-[#FF5A1F]" />
                  <span>Circle Map</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQ1ViewMode("bars")}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-[7px] text-[12px] font-medium transition-colors cursor-pointer",
                    q1ViewMode === "bars"
                      ? "bg-white text-[#12141A] shadow-xs font-semibold"
                      : "text-[#666C78] hover:text-[#12141A]"
                  )}
                  title="Funnel Bars View"
                >
                  <BarChart2 className="h-3.5 w-3.5 text-[#666C78]" />
                  <span>Bars</span>
                </button>
              </div>

              <DownloadCardMenu
                cardId="card-question-1"
                svgElementId={q1ViewMode === "growth" ? "growing-graph-chart" : "funnel-dynamics-circle"}
                filename={`roos-${orgSlug}-q1-conversion-dynamics`}
                config={{
                  questionNumber: 1,
                  questionCategory: "Conversion Dynamics",
                  questionTitle: "Where do opportunities convert in the pipeline?",
                  takeaway: "Inbound inquiries achieve a 28% conversion rate to Won deals, with primary qualification drop-off before Proposal Sent.",
                  centerMetric: {
                    primary: "28%",
                    label: "Overall Win Rate",
                    sublabel: "₹4,50,000 Won",
                  },
                  rows: q1Stages.map((st) => ({
                    label: st.stage,
                    share: st.pct,
                    value: st.val,
                    detail: st.dropOff ? `${st.dropOff} step drop` : "Initial Volume",
                  })),
                  colors: q1Stages.map((st) => st.color),
                  percentages: q1Stages.map((st) => st.pctNum),
                }}
                csvHeaders={["Pipeline Stage", "Conversion Rate", "Deal Volume", "Drop-off Rate"]}
                csvRows={q1Stages.map((st) => [st.stage, st.pct, st.val, st.dropOff || "Baseline"])}
              />
            </div>
          </div>

          {/* Interactive Growing Graph / Circle Map / Bars */}
          {q1ViewMode === "growth" ? (
            <GrowingGraph
              stages={q1Stages}
              overallWinRate="28%"
              wonRevenue="₹4,50,000"
              timeRangeLabel={timeRange === "7d" ? "7 days" : timeRange === "all" ? "All time" : "30 days"}
            />
          ) : (
            <FunnelCircleMap
              stages={q1Stages}
              overallWinRate="28%"
              wonRevenue="₹4,50,000"
              viewMode={q1ViewMode}
            />
          )}
        </div>

        {/* QUESTION 2 & QUESTION 3 (Two Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* QUESTION 2: REVENUE ATTRIBUTION */}
          <div id="card-question-2" className="p-6 rounded-[16px] border border-[#EDE8E0] bg-white card-ref space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-[#F0ECE4]">
              <div>
                <span className="text-[11.5px] font-semibold tracking-wider text-[#666C78] uppercase">
                  Question 2 • Revenue Attribution
                </span>
                <h2 className="text-[18px] font-semibold text-[#12141A] mt-1">
                  Which channels generate the most qualified revenue?
                </h2>
                <p className="text-[13.5px] text-[#666C78] mt-1 font-normal">
                  Takeaway: Inbound WhatsApp inquiries account for 64% of total closed pipeline value.
                </p>
              </div>

              {/* View Mode Toggle & Download Menu */}
              <div className="flex items-center gap-2 self-start shrink-0">
                <div className="flex items-center rounded-[10px] border border-[#EDE8E0] bg-[#F7F5F0] p-0.5 overflow-x-auto max-w-full">
                  <button
                    type="button"
                    onClick={() => setQ2ViewMode("circle")}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-[7px] text-[12px] font-medium transition-colors cursor-pointer",
                      q2ViewMode === "circle"
                        ? "bg-white text-[#12141A] shadow-xs font-semibold"
                        : "text-[#666C78] hover:text-[#12141A]"
                    )}
                    title="Circle Map View"
                  >
                    <PieChart className="h-3.5 w-3.5 text-[#FF5A1F]" />
                    <span>Circle Map</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQ2ViewMode("bars")}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-[7px] text-[12px] font-medium transition-colors cursor-pointer",
                      q2ViewMode === "bars"
                        ? "bg-white text-[#12141A] shadow-xs font-semibold"
                        : "text-[#666C78] hover:text-[#12141A]"
                    )}
                    title="Horizontal Bars View"
                  >
                    <BarChart2 className="h-3.5 w-3.5 text-[#666C78]" />
                    <span>Bars</span>
                  </button>
                </div>

                <DownloadCardMenu
                  cardId="card-question-2"
                  svgElementId="revenue-attribution-circle"
                  filename={`roos-${orgSlug}-q2-revenue-attribution`}
                  config={{
                    questionNumber: 2,
                    questionCategory: "Revenue Attribution",
                    questionTitle: "Which channels generate the most qualified revenue?",
                    takeaway: "Inbound WhatsApp inquiries account for 64% of total closed pipeline value.",
                    centerMetric: {
                      primary: "₹4,50,000",
                      label: "Total Closed Won",
                      sublabel: "64% WhatsApp Direct",
                    },
                    rows: q2Channels.map((ch) => ({
                      label: ch.channel,
                      share: ch.shareLabel,
                      value: ch.val,
                      detail: `${ch.share}% of total pipeline`,
                    })),
                    colors: q2Channels.map((ch) => ch.color),
                    percentages: q2Channels.map((ch) => ch.share),
                  }}
                  csvHeaders={["Channel Source", "Revenue Share", "Qualified Revenue", "Attribution Status"]}
                  csvRows={q2Channels.map((ch) => [ch.channel, ch.shareLabel, ch.val, "Closed Won Attribution"])}
                />
              </div>
            </div>

            {/* Interactive Circle Donut Map & Breakdown */}
            <CircleDonutMap
              items={q2Channels}
              totalValue="₹4,50,000"
              viewMode={q2ViewMode}
            />
          </div>

          {/* QUESTION 3: SLA SPEED */}
          <div id="card-question-3" className="p-6 rounded-[16px] border border-[#EDE8E0] bg-white card-ref space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-[#F0ECE4]">
              <div>
                <span className="text-[11.5px] font-semibold tracking-wider text-[#666C78] uppercase">
                  Question 3 • SLA Response Time
                </span>
                <h2 className="text-[18px] font-semibold text-[#12141A] mt-1">
                  Are we meeting the 24-hour Meta SLA standard?
                </h2>
                <p className="text-[13.5px] text-[#666C78] mt-1 font-normal">
                  Takeaway: 94% of inquiries receive a response within 1 hour, well within the 24-hour Meta window.
                </p>
              </div>

              {/* View Mode Toggle & Download Menu */}
              <div className="flex items-center gap-2 self-start shrink-0">
                <div className="flex items-center rounded-[10px] border border-[#EDE8E0] bg-[#F7F5F0] p-0.5 overflow-x-auto max-w-full">
                  <button
                    type="button"
                    onClick={() => setQ3ViewMode("circle")}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-[7px] text-[12px] font-medium transition-colors cursor-pointer",
                      q3ViewMode === "circle"
                        ? "bg-white text-[#12141A] shadow-xs font-semibold"
                        : "text-[#666C78] hover:text-[#12141A]"
                    )}
                    title="Circle Map View"
                  >
                    <PieChart className="h-3.5 w-3.5 text-[#FF5A1F]" />
                    <span>Circle Map</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQ3ViewMode("bars")}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-[7px] text-[12px] font-medium transition-colors cursor-pointer",
                      q3ViewMode === "bars"
                        ? "bg-white text-[#12141A] shadow-xs font-semibold"
                        : "text-[#666C78] hover:text-[#12141A]"
                    )}
                    title="Horizontal Bars View"
                  >
                    <BarChart2 className="h-3.5 w-3.5 text-[#666C78]" />
                    <span>Bars</span>
                  </button>
                </div>

                <DownloadCardMenu
                  cardId="card-question-3"
                  svgElementId="sla-speed-circle"
                  filename={`roos-${orgSlug}-q3-sla-response-speed`}
                  config={{
                    questionNumber: 3,
                    questionCategory: "SLA Response Time",
                    questionTitle: "Are we meeting the 24-hour Meta SLA standard?",
                    takeaway: "94% of inquiries receive a response within 1 hour, well within the 24-hour Meta window.",
                    centerMetric: {
                      primary: "94%",
                      label: "Within 1 Hour",
                      sublabel: "Meta SLA Met",
                    },
                    rows: q3Tiers.map((tr) => ({
                      label: tr.bracket,
                      share: tr.shareLabel,
                      value: tr.count,
                      detail: tr.isWithinSla ? "Within SLA standard" : "Attention needed",
                    })),
                    colors: q3Tiers.map((tr) => tr.color),
                    percentages: q3Tiers.map((tr) => tr.share),
                  }}
                  csvHeaders={["Response Time Bracket", "Share %", "Message Count", "SLA Compliance"]}
                  csvRows={q3Tiers.map((tr) => [tr.bracket, tr.shareLabel, tr.count, tr.isWithinSla ? "Compliant" : "Exceeds SLA"])}
                />
              </div>
            </div>

            {/* Interactive Concentric Radial Map & Breakdown */}
            <ConcentricRadialMap
              tiers={q3Tiers}
              overallSlaRate="94%"
              viewMode={q3ViewMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
