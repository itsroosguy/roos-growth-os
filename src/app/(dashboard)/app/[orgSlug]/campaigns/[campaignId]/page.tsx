"use client";

import React, { useState, useMemo } from "react";
import { useTenant } from "@/lib/organizations/tenant-context";
import { campaignStore } from "@/lib/campaigns/campaign-store";
import { CampaignStatus } from "@/lib/campaigns/types";
import { formatDate, formatINR, cn, getAvatarColor, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import {
  ArrowLeft,
  Download,
  PauseCircle,
  PlayCircle,
  XCircle,
  CheckCircle2,
  Clock,
  Search,
  CheckCheck,
  BarChart3,
  Table as TableIcon,
  Users,
  Filter,
  PieChart,
  SlidersHorizontal,
  Mail,
  Printer,
  ChevronRight,
  TrendingUp,
  Building2,
  Briefcase,
} from "lucide-react";
import Link from "next/link";

interface CampaignDetailPageProps {
  params: {
    orgSlug: string;
    campaignId: string;
  };
}

const STATUS_CONFIG: Record<
  CampaignStatus,
  { label: string; badgeVariant: "default" | "success" | "warning" | "danger" | "neutral" }
> = {
  draft: { label: "Draft", badgeVariant: "neutral" },
  scheduled: { label: "Scheduled", badgeVariant: "warning" },
  processing: { label: "Sending", badgeVariant: "default" },
  paused: { label: "Paused", badgeVariant: "warning" },
  completed: { label: "Completed", badgeVariant: "success" },
  cancelled: { label: "Cancelled", badgeVariant: "neutral" },
  failed: { label: "Failed", badgeVariant: "danger" },
};

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { orgSlug, campaignId } = params;
  const { currentOrg } = useTenant();

  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

  // Interactive Demographic & Delivery Filters
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientStatusFilter, setRecipientStatusFilter] = useState<string>("all");
  const [ageFilter, setAgeFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [limitFilter, setLimitFilter] = useState<number | null>(null);

  const campaign = useMemo(() => {
    return campaignStore.getCampaignById(orgSlug, campaignId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, campaignId, refreshKey]);

  const allRecipients = useMemo(() => {
    return campaignStore.getCampaignRecipients(campaignId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, refreshKey]);

  // Filter recipients based on Search, Status, Age, Gender, Department, and Limit
  const filteredRecipients = useMemo(() => {
    let list = allRecipients;

    // Delivery Status filter
    if (recipientStatusFilter !== "all") {
      list = list.filter((r) => r.status === recipientStatusFilter);
    }

    // Age filter
    if (ageFilter !== "all") {
      list = list.filter((r) => {
        const age = r.age ?? 30;
        if (ageFilter === "18-25") return age >= 18 && age <= 25;
        if (ageFilter === "26-35") return age >= 26 && age <= 35;
        if (ageFilter === "36-50") return age >= 36 && age <= 50;
        if (ageFilter === "50+") return age > 50;
        return true;
      });
    }

    // Gender filter
    if (genderFilter !== "all") {
      list = list.filter((r) => (r.gender || "male") === genderFilter);
    }

    // Department filter
    if (departmentFilter !== "all") {
      list = list.filter((r) => (r.department || "operations") === departmentFilter);
    }

    // Search query
    if (recipientSearch.trim()) {
      const q = recipientSearch.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.contact_name.toLowerCase().includes(q) ||
          r.phone.includes(q) ||
          (r.department && r.department.toLowerCase().includes(q))
      );
    }

    // Limit capping
    if (limitFilter && limitFilter > 0) {
      list = list.slice(0, limitFilter);
    }

    return list;
  }, [
    allRecipients,
    recipientStatusFilter,
    ageFilter,
    genderFilter,
    departmentFilter,
    recipientSearch,
    limitFilter,
  ]);

  // Action Handlers
  const handlePause = () => {
    campaignStore.pauseCampaign(orgSlug, campaignId);
    setRefreshKey((k) => k + 1);
  };

  const handleResume = () => {
    campaignStore.resumeCampaign(orgSlug, campaignId);
    setRefreshKey((k) => k + 1);
  };

  const handleCancel = () => {
    if (confirm("Cancel remaining queued sends for this campaign?")) {
      campaignStore.cancelCampaign(orgSlug, campaignId);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleExportCSV = () => {
    const csvContent = campaignStore.exportCampaignReportCSV(campaignId);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `campaign_${campaignId}_demographic_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Demographic Chart Analytics Calculations
  const analytics = useMemo(() => {
    const total = filteredRecipients.length || 1;
    const sent = filteredRecipients.filter((r) => r.status !== "queued" && r.status !== "skipped").length;
    const delivered = filteredRecipients.filter((r) => r.status === "delivered" || r.status === "read").length;
    const read = filteredRecipients.filter((r) => r.status === "read").length;
    const failed = filteredRecipients.filter((r) => r.status === "failed").length;

    // Age Groups
    const ageGroups = [
      { label: "18–25 yrs", range: "18-25" },
      { label: "26–35 yrs", range: "26-35" },
      { label: "36–50 yrs", range: "36-50" },
      { label: "50+ yrs", range: "50+" },
    ].map((g) => {
      const recips = filteredRecipients.filter((r) => {
        const a = r.age ?? 30;
        if (g.range === "18-25") return a >= 18 && a <= 25;
        if (g.range === "26-35") return a >= 26 && a <= 35;
        if (g.range === "36-50") return a >= 36 && a <= 50;
        return a > 50;
      });
      const count = recips.length;
      const readCount = recips.filter((r) => r.status === "read").length;
      const readRate = count > 0 ? Math.round((readCount / count) * 100) : 0;
      const share = Math.round((count / total) * 100);
      return { ...g, count, readCount, readRate, share };
    });

    // Gender Breakdown
    const genders = [
      { id: "male", label: "Male" },
      { id: "female", label: "Female" },
      { id: "other", label: "Other / Unspecified" },
    ].map((g) => {
      const recips = filteredRecipients.filter((r) => (r.gender || "male") === g.id);
      const count = recips.length;
      const readCount = recips.filter((r) => r.status === "read").length;
      const readRate = count > 0 ? Math.round((readCount / count) * 100) : 0;
      const share = Math.round((count / total) * 100);
      return { ...g, count, readCount, readRate, share };
    });

    // Department Breakdown
    const departments = [
      { id: "operations", label: "Operations" },
      { id: "executive", label: "Executive" },
      { id: "marketing", label: "Marketing" },
      { id: "finance", label: "Finance" },
      { id: "technology", label: "Technology" },
    ].map((d) => {
      const recips = filteredRecipients.filter((r) => (r.department || "operations") === d.id);
      const count = recips.length;
      const readCount = recips.filter((r) => r.status === "read").length;
      const readRate = count > 0 ? Math.round((readCount / count) * 100) : 0;
      const share = Math.round((count / total) * 100);
      return { ...d, count, readCount, readRate, share };
    });

    return {
      total,
      sent,
      delivered,
      read,
      failed,
      sentRate: Math.round((sent / total) * 100),
      deliveredRate: sent > 0 ? Math.round((delivered / sent) * 100) : 0,
      readRate: sent > 0 ? Math.round((read / sent) * 100) : 0,
      ageGroups,
      genders,
      departments,
    };
  }, [filteredRecipients]);

  if (!campaign) {
    return (
      <div className="p-8 text-center text-[#666C78]">
        <p className="font-semibold text-[#12141A] text-base">Campaign Not Found</p>
        <Link href={`/app/${orgSlug}/campaigns`} className="text-[#FF5A1F] hover:underline mt-2 block">
          Return to Campaigns
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;

  return (
    <div className="space-y-6 animate-page-enter">
      {/* 1. TOP HEADER & EXPORT ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-[#EDE8E0]">
        <Link
          href={`/app/${orgSlug}/campaigns`}
          className="text-[13px] font-medium text-[#666C78] hover:text-[#FF5A1F] flex items-center gap-1.5 transition-colors self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Campaigns</span>
        </Link>

        {/* View Mode & Download Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Chart View vs Table View Switcher */}
          <div className="flex items-center bg-[#F5F2EB] p-0.5 rounded-xl border border-[#EDE8E0]">
            <button
              type="button"
              onClick={() => setViewMode("chart")}
              className={cn(
                "px-3 py-1.5 text-[12.5px] font-medium rounded-lg transition-all duration-150 flex items-center gap-1.5",
                viewMode === "chart"
                  ? "bg-white text-[#12141A] shadow-xs"
                  : "text-[#666C78] hover:text-[#12141A]"
              )}
            >
              <BarChart3 className="h-3.5 w-3.5 text-[#FF5A1F]" />
              <span>Chart View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "px-3 py-1.5 text-[12.5px] font-medium rounded-lg transition-all duration-150 flex items-center gap-1.5",
                viewMode === "table"
                  ? "bg-white text-[#12141A] shadow-xs"
                  : "text-[#666C78] hover:text-[#12141A]"
              )}
            >
              <TableIcon className="h-3.5 w-3.5 text-[#2A3DB5]" />
              <span>Recipient Table</span>
            </button>
          </div>

          {/* Campaign Controls */}
          {campaign.status === "processing" && (
            <Button size="sm" variant="outline" onClick={handlePause} className="text-[13px] font-medium rounded-xl">
              <PauseCircle className="h-4 w-4 mr-1 text-amber-600" /> Pause
            </Button>
          )}
          {campaign.status === "paused" && (
            <Button size="sm" variant="outline" onClick={handleResume} className="text-[13px] font-medium rounded-xl">
              <PlayCircle className="h-4 w-4 mr-1 text-emerald-600" /> Resume
            </Button>
          )}
          {(campaign.status === "scheduled" || campaign.status === "paused") && (
            <Button size="sm" variant="outline" onClick={handleCancel} className="text-[13px] font-medium rounded-xl text-rose-600">
              <XCircle className="h-4 w-4 mr-1" /> Cancel
            </Button>
          )}

          {/* Print / PDF Option */}
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrint}
            className="text-[13px] font-medium rounded-xl border-[#EDE8E0] bg-white text-[#12141A] hover:bg-[#F7F5F0] flex items-center gap-1.5"
            title="Print or Save PDF report"
          >
            <Printer className="h-3.5 w-3.5 text-[#666C78]" />
            <span>Print Report</span>
          </Button>

          {/* Download CSV Report */}
          <Button
            size="sm"
            onClick={handleExportCSV}
            className="text-[13px] font-medium rounded-xl bg-[#0B0D12] hover:bg-[#1C1C1F] text-white flex items-center gap-1.5 shadow-xs"
            title="Download full demographic and delivery log in CSV"
          >
            <Download className="h-3.5 w-3.5 text-[#FF5A1F]" />
            <span>Download Report (CSV)</span>
          </Button>
        </div>
      </div>

      {/* 2. CAMPAIGN SUMMARY CARD */}
      <div className="p-6 rounded-[16px] bg-white border border-[#EDE8E0] space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[22px] sm:text-[24px] font-medium text-[#12141A]">{campaign.name}</h1>
              <Badge variant={statusCfg.badgeVariant} className="text-[11.5px] uppercase font-medium">
                {statusCfg.label}
              </Badge>
              {campaign.is_test_mode && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FFF0EB] text-[#FF5A1F] border border-[#FF5A1F]/30">
                  TEST RUN
                </span>
              )}
            </div>
            <p className="text-[13px] text-[#666C78] mt-1">
              Template: <code className="bg-[#FAF9F5] border border-[#EDE8E0] px-1.5 py-0.5 rounded text-[#12141A] font-medium">{campaign.template_name}</code> ({campaign.template_category.toUpperCase()}) • Launched by {campaign.created_by_name} on {formatDate(campaign.created_at)}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11.5px] font-medium uppercase tracking-wider text-[#878D96] block">Total Meta Spend</span>
            <span className="text-[24px] font-medium tabular-nums text-[#FF5A1F]">
              ₹{campaign.actual_cost > 0 ? campaign.actual_cost.toFixed(2) : campaign.estimated_cost.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Aggregate KPI Blocks */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-[#EFEDE7]">
          <div className="p-3.5 rounded-[14px] bg-[#FAF9F5] border border-[#EDE8E0] text-center">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#666C78] block">Audience</span>
            <span className="text-[20px] font-medium tabular-nums text-[#12141A]">{campaign.total_recipients}</span>
          </div>
          <div className="p-3.5 rounded-[14px] bg-[#FAF9F5] border border-[#EDE8E0] text-center">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#666C78] block">Dispatched</span>
            <span className="text-[20px] font-medium tabular-nums text-[#12141A]">{campaign.sent_count}</span>
          </div>
          <div className="p-3.5 rounded-[14px] bg-[#E4F7EF]/50 border border-[#BDECD7] text-center">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#0A7A53] block">Delivered ({analytics.deliveredRate}%)</span>
            <span className="text-[20px] font-medium tabular-nums text-[#0A7A53]">{campaign.delivered_count}</span>
          </div>
          <div className="p-3.5 rounded-[14px] bg-[#FFF8E6] border border-[#FDE68A] text-center">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#B45309] block">Read ({analytics.readRate}%)</span>
            <span className="text-[20px] font-medium tabular-nums text-[#B45309]">{campaign.read_count}</span>
          </div>
          <div className="p-3.5 rounded-[14px] bg-[#FFF0F0] border border-[#FFD6D6] text-center">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#D9383A] block">Failed</span>
            <span className="text-[20px] font-medium tabular-nums text-[#D9383A]">{campaign.failed_count}</span>
          </div>
        </div>
      </div>

      {/* 3. MULTI-DIMENSIONAL FILTERS: LIMIT, AGE, GENDER, DEPARTMENT, STATUS */}
      <div className="p-4 rounded-[16px] bg-white border border-[#EDE8E0] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-[#FF5A1F]" />
            <span className="text-[13.5px] font-medium text-[#12141A]">
              Report Segmentation &amp; Demographic Controls
            </span>
          </div>
          <span className="text-[12px] text-[#666C78]">
            Showing <strong className="font-medium text-[#12141A] tabular-nums">{filteredRecipients.length}</strong> of {allRecipients.length} recipients
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Limit Option */}
          <div>
            <label className="text-[11px] font-medium text-[#878D96] uppercase tracking-wider block mb-1">
              Limit Campaign
            </label>
            <select
              value={limitFilter === null ? "all" : String(limitFilter)}
              onChange={(e) => setLimitFilter(e.target.value === "all" ? null : parseInt(e.target.value))}
              className="w-full h-9 px-3 rounded-[10px] border border-[#EDE8E0] bg-[#FAF9F5] text-[13px] font-medium text-[#12141A] outline-none shadow-xs cursor-pointer"
            >
              <option value="all">No Limit (All {allRecipients.length})</option>
              <option value="1">Limit to 1 contact</option>
              <option value="2">Limit to 2 contacts</option>
              <option value="5">Limit to 5 contacts</option>
              <option value="10">Limit to 10 contacts</option>
              <option value="50">Limit to 50 contacts</option>
            </select>
          </div>

          {/* Age Bracket Option */}
          <div>
            <label className="text-[11px] font-medium text-[#878D96] uppercase tracking-wider block mb-1">
              Age Range
            </label>
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-[10px] border border-[#EDE8E0] bg-[#FAF9F5] text-[13px] font-medium text-[#12141A] outline-none shadow-xs cursor-pointer"
            >
              <option value="all">All Ages</option>
              <option value="18-25">18–25 yrs</option>
              <option value="26-35">26–35 yrs</option>
              <option value="36-50">36–50 yrs</option>
              <option value="50+">50+ yrs</option>
            </select>
          </div>

          {/* Gender Option */}
          <div>
            <label className="text-[11px] font-medium text-[#878D96] uppercase tracking-wider block mb-1">
              Gender
            </label>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-[10px] border border-[#EDE8E0] bg-[#FAF9F5] text-[13px] font-medium text-[#12141A] outline-none shadow-xs cursor-pointer"
            >
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other / Non-binary</option>
            </select>
          </div>

          {/* Department Option */}
          <div>
            <label className="text-[11px] font-medium text-[#878D96] uppercase tracking-wider block mb-1">
              Department &amp; Role
            </label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-[10px] border border-[#EDE8E0] bg-[#FAF9F5] text-[13px] font-medium text-[#12141A] outline-none shadow-xs cursor-pointer"
            >
              <option value="all">All Departments</option>
              <option value="operations">Operations</option>
              <option value="executive">Executive</option>
              <option value="marketing">Marketing</option>
              <option value="finance">Finance</option>
              <option value="technology">Technology</option>
            </select>
          </div>

          {/* Delivery Status Option */}
          <div>
            <label className="text-[11px] font-medium text-[#878D96] uppercase tracking-wider block mb-1">
              Delivery Status
            </label>
            <select
              value={recipientStatusFilter}
              onChange={(e) => setRecipientStatusFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-[10px] border border-[#EDE8E0] bg-[#FAF9F5] text-[13px] font-medium text-[#12141A] outline-none shadow-xs cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="read">Read</option>
              <option value="delivered">Delivered</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CHART VIEW: VISUAL FUNNEL & DEMOGRAPHIC BREAKDOWNS                      */}
      {/* ========================================================================= */}
      {viewMode === "chart" && (
        <div className="space-y-6">
          {/* Question 1: Delivery Funnel Chart */}
          <div className="p-6 rounded-[16px] border border-[#EDE8E0] bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[12px] font-medium text-[#666C78] uppercase tracking-wider">
                  Conversion &amp; Delivery Funnel
                </span>
                <h3 className="text-[18px] font-medium text-[#12141A] mt-0.5">
                  How did recipients engage through the delivery stages?
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[12px] font-medium bg-[#FAF9F5] text-[#12141A] border border-[#EDE8E0]">
                {analytics.readRate}% Read Rate
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {[
                { stage: "Total Dispatched", count: analytics.sent, pct: "100%", color: "#6C7690" },
                { stage: "Network Delivered", count: analytics.delivered, pct: `${analytics.deliveredRate}%`, color: "#12B886" },
                { stage: "Opened & Read", count: analytics.read, pct: `${analytics.readRate}%`, color: "#FF5A1F" },
              ].map((step) => (
                <div key={step.stage} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[13.5px]">
                    <span className="font-medium text-[#12141A]">{step.stage}</span>
                    <span className="text-[#666C78] tabular-nums font-medium">
                      {step.count} ({step.pct})
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-[#F5F2EB] overflow-hidden">
                    <div
                      style={{ width: step.pct, backgroundColor: step.color }}
                      className="h-full rounded-full transition-all duration-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Demographic Breakdown Grid: Age, Gender, Department */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Age Demographics Chart */}
            <div className="p-6 rounded-[16px] border border-[#EDE8E0] bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11.5px] font-medium text-[#666C78] uppercase tracking-wider">
                    Audience Demographics
                  </span>
                  <h4 className="text-[16px] font-medium text-[#12141A] mt-0.5">
                    Age Distribution &amp; Read Rate
                  </h4>
                </div>
                <Users className="h-4 w-4 text-[#878D96]" />
              </div>

              <div className="space-y-3 pt-2">
                {analytics.ageGroups.map((g) => (
                  <div key={g.label} className="space-y-1">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-[#12141A] font-medium">{g.label}</span>
                      <div className="flex items-center gap-2 text-[12px] text-[#666C78]">
                        <span>{g.count} users</span>
                        <span>•</span>
                        <span className="font-medium text-[#FF5A1F]">{g.readRate}% read</span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-[#F5F2EB] overflow-hidden">
                      <div
                        style={{ width: `${Math.max(8, g.share)}%` }}
                        className="h-full rounded-full bg-[#0284C7] transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gender Distribution Chart */}
            <div className="p-6 rounded-[16px] border border-[#EDE8E0] bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11.5px] font-medium text-[#666C78] uppercase tracking-wider">
                    Audience Demographics
                  </span>
                  <h4 className="text-[16px] font-medium text-[#12141A] mt-0.5">
                    Gender Engagement Share
                  </h4>
                </div>
                <PieChart className="h-4 w-4 text-[#878D96]" />
              </div>

              <div className="space-y-3 pt-2">
                {analytics.genders.map((g) => (
                  <div key={g.id} className="space-y-1">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-[#12141A] font-medium">{g.label}</span>
                      <div className="flex items-center gap-2 text-[12px] text-[#666C78]">
                        <span>{g.count} users</span>
                        <span>•</span>
                        <span className="font-medium text-[#10B981]">{g.readRate}% read</span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-[#F5F2EB] overflow-hidden">
                      <div
                        style={{ width: `${Math.max(8, g.share)}%` }}
                        className="h-full rounded-full bg-[#8B5CF6] transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Department / Role Performance Chart */}
            <div className="p-6 rounded-[16px] border border-[#EDE8E0] bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11.5px] font-medium text-[#666C78] uppercase tracking-wider">
                    Corporate Segmentation
                  </span>
                  <h4 className="text-[16px] font-medium text-[#12141A] mt-0.5">
                    Department &amp; Role Read Rates
                  </h4>
                </div>
                <Briefcase className="h-4 w-4 text-[#878D96]" />
              </div>

              <div className="space-y-3 pt-2">
                {analytics.departments.map((d) => (
                  <div key={d.id} className="space-y-1">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-[#12141A] font-medium">{d.label}</span>
                      <div className="flex items-center gap-2 text-[12px] text-[#666C78]">
                        <span>{d.count} users</span>
                        <span>•</span>
                        <span className="font-medium text-[#FF5A1F]">{d.readRate}% read</span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-[#F5F2EB] overflow-hidden">
                      <div
                        style={{ width: `${Math.max(8, d.share)}%` }}
                        className="h-full rounded-full bg-[#FF5A1F] transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. RECIPIENT DELIVERY LOG TABLE                                           */}
      {/* ========================================================================= */}
      {viewMode === "table" && (
        <div className="space-y-3">
          <div className="rounded-[16px] border border-[#EDE8E0] bg-white overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-[#FAF9F5]">
                <TableRow className="border-b border-[#EDE8E0]">
                  <TableHead className="text-[12px] font-medium uppercase tracking-wider text-[#666C78] py-3.5">
                    Recipient &amp; Role
                  </TableHead>
                  <TableHead className="text-[12px] font-medium uppercase tracking-wider text-[#666C78] py-3.5">
                    Demographics
                  </TableHead>
                  <TableHead className="text-[12px] font-medium uppercase tracking-wider text-[#666C78] py-3.5">
                    Department
                  </TableHead>
                  <TableHead className="text-[12px] font-medium uppercase tracking-wider text-[#666C78] py-3.5">
                    Phone Number
                  </TableHead>
                  <TableHead className="text-[12px] font-medium uppercase tracking-wider text-[#666C78] py-3.5">
                    Delivery Status
                  </TableHead>
                  <TableHead className="text-[12px] font-medium uppercase tracking-wider text-[#666C78] py-3.5">
                    Cost
                  </TableHead>
                  <TableHead className="text-right text-[12px] font-medium uppercase tracking-wider text-[#666C78] py-3.5">
                    Time &amp; Delivery ID
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecipients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-[13.5px] text-[#666C78]">
                      No recipients match your demographic and status filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecipients.map((r) => {
                    const avatarStyle = getAvatarColor(r.contact_name);
                    return (
                      <TableRow key={r.id} className="border-b border-[#EDE8E0]/70 hover:bg-[#FAF9F5] transition-colors">
                        {/* Recipient & Role */}
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium border shrink-0",
                                avatarStyle.bg,
                                avatarStyle.text,
                                avatarStyle.border
                              )}
                            >
                              {getInitials(r.contact_name)}
                            </div>
                            <div>
                              <span className="font-medium text-[13.5px] text-[#12141A] block">
                                {r.contact_name}
                              </span>
                              <span className="text-[11.5px] text-[#878D96]">
                                {r.classification === "ongoing_client" ? "Ongoing Client" : "New Opportunity"}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Demographics: Age & Gender */}
                        <TableCell>
                          <span className="text-[12.5px] text-[#454B57]">
                            {r.age ? `${r.age} yrs` : "—"}, {r.gender ? r.gender.charAt(0).toUpperCase() + r.gender.slice(1) : "—"}
                          </span>
                        </TableCell>

                        {/* Department */}
                        <TableCell>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium border bg-[#FAF9F5] text-[#454B57] border-[#EDE8E0] capitalize">
                            {r.department || "Operations"}
                          </span>
                        </TableCell>

                        {/* Phone */}
                        <TableCell className="tabular-nums text-[13px] text-[#12141A]">
                          {r.phone}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {r.status === "read" && (
                            <span className="inline-flex items-center gap-1 text-[12px] text-[#FF5A1F] font-medium">
                              <CheckCheck className="h-3.5 w-3.5" /> Read
                            </span>
                          )}
                          {r.status === "delivered" && (
                            <span className="inline-flex items-center gap-1 text-[12px] text-[#10B981] font-medium">
                              <CheckCheck className="h-3.5 w-3.5" /> Delivered
                            </span>
                          )}
                          {r.status === "sent" && (
                            <span className="inline-flex items-center gap-1 text-[12px] text-[#666C78] font-medium">
                              Sent
                            </span>
                          )}
                          {r.status === "failed" && (
                            <span className="inline-flex items-center gap-1 text-[12px] text-[#D9383A] font-medium">
                              Failed
                            </span>
                          )}
                          {r.status === "queued" && (
                            <span className="inline-flex items-center gap-1 text-[12px] text-[#B45309] font-medium">
                              Queued
                            </span>
                          )}
                        </TableCell>

                        {/* Cost */}
                        <TableCell className="tabular-nums text-[13px] font-medium text-[#12141A]">
                          ₹{r.cost.toFixed(2)}
                        </TableCell>

                        {/* Timestamp & wamid */}
                        <TableCell className="text-right">
                          <span className="text-[12px] text-[#666C78] block">
                            {r.read_at ? formatDate(r.read_at) : r.delivered_at ? formatDate(r.delivered_at) : r.sent_at ? formatDate(r.sent_at) : "—"}
                          </span>
                          <span className="text-[10.5px] text-[#878D96] font-mono truncate max-w-[140px] inline-block">
                            {r.external_message_id || "pending"}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
