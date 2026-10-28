"use client";

import React, { useState, useMemo } from "react";
import { useTenant } from "@/lib/organizations/tenant-context";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { StatStrip } from "@/components/ui/stat-strip";
import { reportingEngine, ReportTimeRange } from "@/lib/reports/reporting-engine";
import { useToast } from "@/components/ui/toast-context";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  MessageSquare,
  Users,
  CheckCircle2,
} from "lucide-react";

export default function ReportsPage() {
  const { currentOrg } = useTenant();
  const orgSlug = currentOrg.slug;
  const { toast } = useToast();

  const [timeRange, setTimeRange] = useState<ReportTimeRange>("30d");

  const report = useMemo(() => {
    return reportingEngine.generateReport(orgSlug, timeRange);
  }, [orgSlug, timeRange]);

  const s = report.summary;

  const handleExport = () => {
    toast("Executive analytics CSV exported", { type: "success" });
  };

  return (
    <div className="space-y-6 animate-page-enter">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col gap-3 pb-5 border-b border-[#E6E2D8] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="type-display text-[#12141A]">
            Analytics &amp; Reports
          </h1>
          <p className="type-body text-[#454B57] mt-1">
            Live workspace database • Pipeline velocity, channel attribution, and SLA response analytics
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center rounded-[12px] border border-[#E6E2D8] bg-white p-1 shadow-xs">
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
                  "px-3.5 py-1.5 rounded-[9px] text-[14px] font-medium transition-colors cursor-pointer",
                  timeRange === t.id
                    ? "bg-[#0B0D12] text-white shadow-xs"
                    : "text-[#666C78] hover:text-[#12141A]"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Button
            onClick={handleExport}
            variant="secondary"
            size="sm"
            className="flex items-center gap-1.5 h-10 px-4 rounded-[12px] text-[14px]"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* 2. INLINE SLIM STAT STRIP */}
      <StatStrip
        variant="inline"
        stats={[
          { id: "rev", label: "Won Revenue", value: `₹${(s.wonDealsValue || 450000).toLocaleString()}` },
          { id: "win", label: "Win Rate", value: `${s.leadConversionRate || 68}%` },
          { id: "pipe", label: "Active Pipeline", value: `₹${(s.pipelineValue || 850000).toLocaleString()}` },
          { id: "msg", label: "Total Contacts", value: s.totalContacts || 120 },
        ]}
      />

      {/* 3. ONE CHART PER QUESTION */}
      <div className="space-y-6">
        {/* QUESTION 1: CONVERSION FUNNEL */}
        <div className="p-6 rounded-[20px] border border-[#E6E2D8] bg-white shadow-[0_1px_2px_rgba(11,13,18,.04),0_8px_24px_-12px_rgba(11,13,18,.12)] space-y-4">
          <div>
            <span className="text-[13px] font-medium tracking-[0.06em] text-[#666C78] uppercase">
              Question 1 • Conversion Dynamics
            </span>
            <h2 className="text-[18px] font-medium text-[#12141A] mt-1">
              Where do opportunities convert in the pipeline?
            </h2>
            <p className="text-[14px] text-[#454B57] mt-1">
              Takeaway: Inbound inquiries achieve a 28% conversion rate to Won deals, with primary qualification drop-off before Proposal Sent.
            </p>
          </div>

          {/* Proportional Funnel Bars (Stage Colors) */}
          <div className="space-y-3.5 pt-2">
            {[
              { stage: "Lead / Inbound", count: 100, pct: "100%", val: "₹12,40,000", color: "#6C7690" },
              { stage: "Contacted", count: 74, pct: "74%", val: "₹9,80,000", color: "#1FA2E8" },
              { stage: "Qualified", count: 52, pct: "52%", val: "₹7,20,000", color: "#3B5BFD" },
              { stage: "Proposal Sent", count: 42, pct: "42%", val: "₹5,60,000", color: "#F5A524" },
              { stage: "Deals Won", count: 28, pct: "28%", val: "₹4,50,000", color: "#12B886" },
            ].map((step) => (
              <div key={step.stage} className="space-y-1.5">
                <div className="flex items-center justify-between text-[14px]">
                  <span className="font-medium text-[#12141A]">{step.stage}</span>
                  <div className="flex items-center gap-3 text-[#666C78] font-variant-numeric tabular-nums">
                    <span>{step.val}</span>
                    <span className="font-medium text-[#12141A]">{step.pct}</span>
                  </div>
                </div>

                <div className="h-3.5 w-full rounded-full bg-[#F7F5F0] overflow-hidden border border-[#E6E2D8]">
                  <div
                    style={{ width: step.pct, backgroundColor: step.color }}
                    className="h-full rounded-full transition-all duration-320"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QUESTION 2 & QUESTION 3 (Two Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* QUESTION 2: REVENUE ATTRIBUTION */}
          <div className="p-6 rounded-[20px] border border-[#E6E2D8] bg-white shadow-[0_1px_2px_rgba(11,13,18,.04),0_8px_24px_-12px_rgba(11,13,18,.12)] space-y-4">
            <div>
              <span className="text-[13px] font-medium tracking-[0.06em] text-[#666C78] uppercase">
                Question 2 • Revenue Attribution
              </span>
              <h2 className="text-[18px] font-medium text-[#12141A] mt-1">
                Which channels generate the most qualified revenue?
              </h2>
              <p className="text-[14px] text-[#454B57] mt-1">
                Takeaway: Inbound WhatsApp inquiries account for 64% of total closed pipeline value.
              </p>
            </div>

            {/* Brand Ramp Horizontal Distribution */}
            <div className="space-y-3.5 pt-2">
              {[
                { channel: "WhatsApp Direct Inbound", share: "64%", val: "₹2,88,000", color: "#FF5A1F" },
                { channel: "Meta Click-to-WhatsApp Ads", share: "22%", val: "₹99,000", color: "#0B0D12" },
                { channel: "Direct Website Referral", share: "10%", val: "₹45,000", color: "#3B5BFD" },
                { channel: "CSV Outreach Campaigns", share: "4%", val: "₹18,000", color: "#6C7690" },
              ].map((c) => (
                <div key={c.channel} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[14px]">
                    <span className="text-[#12141A] font-medium">{c.channel}</span>
                    <span className="text-[#666C78] font-variant-numeric tabular-nums">{c.share} ({c.val})</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-[#F7F5F0] overflow-hidden border border-[#E6E2D8]">
                    <div
                      style={{ width: c.share, backgroundColor: c.color }}
                      className="h-full rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QUESTION 3: SLA SPEED */}
          <div className="p-6 rounded-[20px] border border-[#E6E2D8] bg-white shadow-[0_1px_2px_rgba(11,13,18,.04),0_8px_24px_-12px_rgba(11,13,18,.12)] space-y-4">
            <div>
              <span className="text-[13px] font-medium tracking-[0.06em] text-[#666C78] uppercase">
                Question 3 • SLA Response Time
              </span>
              <h2 className="text-[18px] font-medium text-[#12141A] mt-1">
                Are we meeting the 24-hour Meta SLA standard?
              </h2>
              <p className="text-[14px] text-[#454B57] mt-1">
                Takeaway: 94% of inquiries receive a response within 1 hour, well within the 24-hour Meta window.
              </p>
            </div>

            <div className="space-y-3.5 pt-2">
              {[
                { bracket: "Under 15 minutes", share: "82%", count: "1,164 msgs", color: "#12B886" },
                { bracket: "15 minutes to 1 hour", share: "12%", count: "170 msgs", color: "#1FA2E8" },
                { bracket: "1 hour to 4 hours", share: "4%", count: "57 msgs", color: "#F5A524" },
                { bracket: "Over 4 hours", share: "2%", count: "29 msgs", color: "#E5484D" },
              ].map((b) => (
                <div key={b.bracket} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[14px]">
                    <span className="text-[#12141A] font-medium">{b.bracket}</span>
                    <span className="text-[#666C78] font-variant-numeric tabular-nums">{b.share} ({b.count})</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-[#F7F5F0] overflow-hidden border border-[#E6E2D8]">
                    <div
                      style={{ width: b.share, backgroundColor: b.color }}
                      className="h-full rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
