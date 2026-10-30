"use client";

import React, { useState, useMemo } from "react";
import { useTenant } from "@/lib/organizations/tenant-context";
import { campaignStore } from "@/lib/campaigns/campaign-store";
import { templateStore } from "@/lib/campaigns/template-store";
import { segmentEngine } from "@/lib/campaigns/segment-engine";
import { calculateCampaignPricing } from "@/lib/campaigns/pricing";
import { crmStore } from "@/lib/crm/crm-store";
import {
  Campaign,
  CampaignStatus,
  AudienceFilterCriteria,
} from "@/lib/campaigns/types";
import { formatDate, formatINR } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatStrip } from "@/components/ui/stat-strip";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Megaphone,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  PauseCircle,
  PlayCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Users,
  Send,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  BarChart2,
  Eye,
  FileText,
  DollarSign,
  Layers,
  Filter,
  Download,
  FileSpreadsheet,
  TrendingUp,
  UserCheck,
  Briefcase,
  PieChart,
} from "lucide-react";
import Link from "next/link";
import { useMounted } from "@/lib/use-mounted";

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

export default function CampaignsPage() {
  const { currentOrg, userRole, isAdmin } = useTenant();
  const orgSlug = currentOrg.slug;
  const mounted = useMounted();

  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");

  // Create Campaign Wizard State
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);

  // Wizard Step 1: Basics & Template
  const [campName, setCampName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // Wizard Step 2: Audience & Demographic Filters
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>("none");
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterSource, setFilterSource] = useState("");
  const [filterAge, setFilterAge] = useState<string>("all");
  const [filterGender, setFilterGender] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterClassification, setFilterClassification] = useState<string>("all");
  const [recipientLimit, setRecipientLimit] = useState<number | null>(null);

  // Wizard Step 3: Variable Mapping
  const [variableMappings, setVariableMappings] = useState<Record<string, string>>({});

  // Wizard Step 4: Schedule & Launch
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [isTestMode, setIsTestMode] = useState(false);
  const [confirmUnderstood, setConfirmUnderstood] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  // Fetch approved templates
  const approvedTemplates = useMemo(() => {
    return templateStore.getApprovedTemplates(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  // Selected template object
  const activeTemplate = useMemo(() => {
    if (!selectedTemplateId && approvedTemplates.length > 0) {
      return approvedTemplates[0];
    }
    return approvedTemplates.find((t) => t.id === selectedTemplateId) || approvedTemplates[0] || null;
  }, [approvedTemplates, selectedTemplateId]);

  // Saved Segments
  const savedSegments = useMemo(() => {
    return segmentEngine.getSavedSegments(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  // Target criteria for audience evaluation (includes age, gender, dept, classification, limit)
  const currentCriteria: AudienceFilterCriteria = useMemo(() => {
    if (selectedSegmentId !== "none") {
      const seg = savedSegments.find((s) => s.id === selectedSegmentId);
      if (seg) return seg.filter_criteria;
    }
    return {
      tags: filterTags.length > 0 ? filterTags : undefined,
      source: filterSource || undefined,
      age_range: filterAge !== "all" ? (filterAge as any) : undefined,
      gender: filterGender !== "all" ? (filterGender as any) : undefined,
      department: filterDepartment !== "all" ? (filterDepartment as any) : undefined,
      classification: filterClassification !== "all" ? (filterClassification as any) : undefined,
      recipient_limit: recipientLimit && recipientLimit > 0 ? recipientLimit : undefined,
    };
  }, [
    selectedSegmentId,
    savedSegments,
    filterTags,
    filterSource,
    filterAge,
    filterGender,
    filterDepartment,
    filterClassification,
    recipientLimit,
  ]);

  // Audience Evaluation (Consent & Opt-Out breakdown)
  const audienceResult = useMemo(() => {
    const isMarketing = activeTemplate?.category === "marketing";
    return segmentEngine.evaluateCriteria(orgSlug, currentCriteria, isMarketing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, currentCriteria, activeTemplate, refreshKey]);

  // Effective recipient count after limit capping
  const effectiveRecipientCount = useMemo(() => {
    if (recipientLimit && recipientLimit > 0) {
      return Math.min(recipientLimit, audienceResult.eligibleCount);
    }
    return audienceResult.eligibleCount;
  }, [recipientLimit, audienceResult.eligibleCount]);

  // Live Pricing Calculation
  const pricing = useMemo(() => {
    const cat = activeTemplate?.category || "marketing";
    return calculateCampaignPricing(
      cat,
      effectiveRecipientCount,
      audienceResult.totalMatched,
      audienceResult.suppressedOptOutCount,
      audienceResult.suppressedConsentCount
    );
  }, [activeTemplate, effectiveRecipientCount, audienceResult]);

  // Sample recipient for live preview
  const sampleRecipient = useMemo(() => {
    return audienceResult.eligibleContacts[0] || null;
  }, [audienceResult.eligibleContacts]);

  // Rendered Preview Message for sample recipient
  const previewBody = useMemo(() => {
    if (!activeTemplate) return "";
    const vars: Record<string, string> = {};
    activeTemplate.variables.forEach((v) => {
      const field = variableMappings[v] || "first_name";
      if (sampleRecipient) {
        vars[v] = (sampleRecipient as unknown as Record<string, string>)[field] || sampleRecipient.first_name;
      } else {
        vars[v] = activeTemplate.sample_values[v] || `[Variable {{${v}}}]`;
      }
    });
    return templateStore.renderTemplateBody(activeTemplate, vars);
  }, [activeTemplate, variableMappings, sampleRecipient]);

  // Fetch campaigns
  const campaigns = useMemo(() => {
    let list = campaignStore.getCampaigns(orgSlug);

    if (statusFilter !== "all") {
      list = list.filter((c) => c.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.template_name.toLowerCase().includes(q)
      );
    }

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, statusFilter, searchQuery, refreshKey]);

  // Dashboard Metrics
  const allOrgCampaigns = useMemo(() => {
    return campaignStore.getCampaigns(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  const draftsCount = useMemo(() => allOrgCampaigns.filter((c) => c.status === "draft").length, [allOrgCampaigns]);
  const scheduledCount = useMemo(() => allOrgCampaigns.filter((c) => c.status === "scheduled").length, [allOrgCampaigns]);
  const activeCount = useMemo(() => allOrgCampaigns.filter((c) => c.status === "processing").length, [allOrgCampaigns]);
  const completedCount = useMemo(() => allOrgCampaigns.filter((c) => c.status === "completed").length, [allOrgCampaigns]);

  const metrics = useMemo(() => {
    const all = allOrgCampaigns;
    const totalSent = all.reduce((sum, c) => sum + c.sent_count, 0);
    const totalDelivered = all.reduce((sum, c) => sum + c.delivered_count, 0);
    const totalRead = all.reduce((sum, c) => sum + c.read_count, 0);
    const totalSpent = all.reduce((sum, c) => sum + c.actual_cost, 0);
    const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 100;
    const readRate = totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 0;

    return {
      totalCampaigns: all.length,
      totalSent,
      totalDelivered,
      totalRead,
      deliveryRate: `${deliveryRate}%`,
      readRate: `${readRate}%`,
      totalSpent: formatINR(totalSpent),
    };
  }, [allOrgCampaigns]);

  // Aggregate demographics across all campaigns
  const aggregateDemographics = useMemo(() => {
    const allRecips = allOrgCampaigns.flatMap((c) => campaignStore.getCampaignRecipients(c.id));
    const total = allRecips.length || 1;

    // Age groups
    const ageGroups = {
      "18-25": { count: 0, read: 0 },
      "26-35": { count: 0, read: 0 },
      "36-50": { count: 0, read: 0 },
      "50+": { count: 0, read: 0 },
    };

    // Gender
    const genderGroups = {
      female: { count: 0, read: 0 },
      male: { count: 0, read: 0 },
      other: { count: 0, read: 0 },
    };

    // Department
    const deptGroups = {
      executive: { count: 0, read: 0 },
      finance: { count: 0, read: 0 },
      operations: { count: 0, read: 0 },
      marketing: { count: 0, read: 0 },
      technology: { count: 0, read: 0 },
    };

    // Classification
    const classGroups = {
      ongoing_client: { count: 0, read: 0 },
      new_opportunity: { count: 0, read: 0 },
    };

    allRecips.forEach((r) => {
      const isRead = r.status === "read";
      const a = r.age ?? 30;
      if (a <= 25) {
        ageGroups["18-25"].count++;
        if (isRead) ageGroups["18-25"].read++;
      } else if (a <= 35) {
        ageGroups["26-35"].count++;
        if (isRead) ageGroups["26-35"].read++;
      } else if (a <= 50) {
        ageGroups["36-50"].count++;
        if (isRead) ageGroups["36-50"].read++;
      } else {
        ageGroups["50+"].count++;
        if (isRead) ageGroups["50+"].read++;
      }

      const g = (r.gender || "male") as keyof typeof genderGroups;
      if (genderGroups[g]) {
        genderGroups[g].count++;
        if (isRead) genderGroups[g].read++;
      }

      const d = (r.department || "operations") as keyof typeof deptGroups;
      if (deptGroups[d]) {
        deptGroups[d].count++;
        if (isRead) deptGroups[d].read++;
      }

      const c = (r.classification || "new_opportunity") as keyof typeof classGroups;
      if (classGroups[c]) {
        classGroups[c].count++;
        if (isRead) classGroups[c].read++;
      }
    });

    return {
      totalRecipients: allRecips.length,
      ageGroups,
      genderGroups,
      deptGroups,
      classGroups,
    };
  }, [allOrgCampaigns]);

  // Handlers
  const handleOpenWizard = () => {
    setWizardStep(1);
    setCampName("");
    setSelectedTemplateId(approvedTemplates[0]?.id || "");
    setSelectedSegmentId("none");
    setFilterTags([]);
    setFilterSource("");
    setFilterAge("all");
    setFilterGender("all");
    setFilterDepartment("all");
    setFilterClassification("all");
    setRecipientLimit(null);
    setVariableMappings({ "1": "first_name", "2": "company" });
    setIsScheduled(false);
    setScheduleDateTime("");
    setIsTestMode(false);
    setConfirmUnderstood(false);
    setLaunchError(null);
    setWizardOpen(true);
  };

  const handleLaunchCampaign = () => {
    setLaunchError(null);
    if (!campName.trim() || !activeTemplate) return;

    const result = campaignStore.createCampaign(orgSlug, {
      name: campName.trim(),
      templateId: activeTemplate.id,
      segmentId: selectedSegmentId !== "none" ? selectedSegmentId : undefined,
      filterCriteria: currentCriteria,
      variableMappings,
      scheduledAt: isScheduled && scheduleDateTime ? new Date(scheduleDateTime).toISOString() : undefined,
      recipientLimit: recipientLimit || undefined,
      isTestMode,
      createdByName: userRole === "owner" ? "Workspace Founder" : "Staff Member",
    });

    if (!result.success) {
      setLaunchError(result.error || "Failed to launch campaign.");
      return;
    }

    setWizardOpen(false);
    setRefreshKey((k) => k + 1);
  };

  const handlePause = (campId: string) => {
    campaignStore.pauseCampaign(orgSlug, campId);
    setRefreshKey((k) => k + 1);
  };

  const handleResume = (campId: string) => {
    campaignStore.resumeCampaign(orgSlug, campId);
    setRefreshKey((k) => k + 1);
  };

  const handleCancel = (campId: string) => {
    if (confirm("Are you sure you want to cancel this campaign? Queued recipients will not be messaged.")) {
      campaignStore.cancelCampaign(orgSlug, campId);
      setRefreshKey((k) => k + 1);
    }
  };

  // CSV Exports
  const handleExportAllCSV = () => {
    const csvContent = campaignStore.exportAllCampaignsCSV(orgSlug);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${orgSlug}_all_campaigns_executive_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSingleCSV = (campId: string, campName: string) => {
    const csvContent = campaignStore.exportCampaignReportCSV(campId);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeName = campName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    link.setAttribute("download", `${safeName}_demographic_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#EDE8E0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#FFF0EB] text-[#FF5A1F] border border-[#FF5A1F]/30">
              <Megaphone className="h-3 w-3" />
              Meta Cloud Broadcasts
            </span>
            <span className="text-[12px] font-normal text-[#666C78]">
              • Full Demographic Intelligence &amp; Live Reports
            </span>
          </div>
          <h1 className="type-display text-[#12141A]">
            Broadcasts &amp; Campaign Analytics
          </h1>
          <p className="type-body text-[#454B57] mt-1">
            Manage WhatsApp campaigns, analyze age &amp; gender demographics, view funnel performance, and download comprehensive CSV reports.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <Button
            variant="outline"
            onClick={handleExportAllCSV}
            className="rounded-[12px] border-[#EDE8E0] bg-white hover:bg-[#F7F5F0] text-[#12141A] font-medium text-[14px] flex items-center gap-1.5 shadow-xs cursor-pointer h-10 px-4 transition-transform active:scale-[0.98] duration-150"
            title="Download full executive summary CSV of all campaigns"
          >
            <Download className="h-4 w-4 text-[#FF5A1F]" />
            <span>Download All (CSV)</span>
          </Button>

          <Link href={`/app/${orgSlug}/templates`}>
            <Button variant="outline" className="rounded-[12px] border-[#EDE8E0] bg-white hover:bg-[#F7F5F0] text-[#12141A] font-medium text-[14px] flex items-center gap-1.5 shadow-xs cursor-pointer h-10 px-4 transition-transform active:scale-[0.98] duration-150">
              <FileText className="h-4 w-4 text-[#666C78]" />
              <span>Templates</span>
            </Button>
          </Link>

          <Button
            variant="primary"
            onClick={handleOpenWizard}
            className="rounded-[12px] text-[14px] font-medium flex items-center gap-1.5 shadow-xs cursor-pointer h-10 px-4 bg-[#FF5A1F] hover:bg-[#E54D15] text-white transition-transform active:scale-[0.98] duration-150"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>New Campaign</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <StatStrip
        stats={[
          {
            id: "total",
            label: "Total Campaigns",
            value: metrics.totalCampaigns,
            subtext: "Marketing & Utility",
          },
          {
            id: "dispatched",
            label: "Dispatched",
            value: metrics.totalSent,
            change: { value: "Meta Cloud API", trend: "up" },
          },
          {
            id: "delivery-rate",
            label: "Delivery Rate",
            value: metrics.deliveryRate,
            subtext: `${metrics.totalDelivered} delivered`,
          },
          {
            id: "spend",
            label: "Total Spend",
            value: metrics.totalSpent,
            subtext: `Read rate ${metrics.readRate}`,
          },
        ]}
      />

      {/* Control Bar: Status Tabs + View Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
        {/* Horizontal Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3.5 py-1.5 rounded-[10px] text-[14px] font-medium transition-all duration-180 cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "all"
                ? "bg-[#0B0D12] text-white shadow-xs"
                : "bg-white border border-[#EDE8E0] text-[#454B57] hover:text-[#12141A] hover:bg-[#F7F5F0]"
            }`}
          >
            <span>All Campaigns</span>
            <span className="tabular-nums text-[13px] opacity-80">({allOrgCampaigns.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("draft")}
            className={`px-3.5 py-1.5 rounded-[10px] text-[14px] font-medium transition-all duration-180 cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "draft"
                ? "bg-[#0B0D12] text-white shadow-xs"
                : "bg-white border border-[#EDE8E0] text-[#454B57] hover:text-[#12141A] hover:bg-[#F7F5F0]"
            }`}
          >
            <span>Drafts</span>
            <span className="tabular-nums text-[13px] opacity-80">({draftsCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("scheduled")}
            className={`px-3.5 py-1.5 rounded-[10px] text-[14px] font-medium transition-all duration-180 cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "scheduled"
                ? "bg-[#8F5300] text-white shadow-xs"
                : "bg-white border border-[#EDE8E0] text-[#454B57] hover:text-[#12141A] hover:bg-[#F7F5F0]"
            }`}
          >
            <span>Scheduled</span>
            <span className="tabular-nums text-[13px] opacity-80">({scheduledCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("processing")}
            className={`px-3.5 py-1.5 rounded-[10px] text-[14px] font-medium transition-all duration-180 cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "processing"
                ? "bg-[#0A7A53] text-white shadow-xs"
                : "bg-white border border-[#EDE8E0] text-[#454B57] hover:text-[#12141A] hover:bg-[#F7F5F0]"
            }`}
          >
            <span>Active</span>
            <span className="tabular-nums text-[13px] opacity-80">({activeCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("completed")}
            className={`px-3.5 py-1.5 rounded-[10px] text-[14px] font-medium transition-all duration-180 cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "completed"
                ? "bg-[#0A7A53] text-white shadow-xs"
                : "bg-white border border-[#EDE8E0] text-[#454B57] hover:text-[#12141A] hover:bg-[#F7F5F0]"
            }`}
          >
            <span>Completed</span>
            <span className="tabular-nums text-[13px] opacity-80">({completedCount})</span>
          </button>
        </div>

        {/* View Switcher: Table View vs Chart View */}
        <div className="flex items-center gap-1 bg-[#F0ECE1] p-1 rounded-[12px] border border-[#EDE8E0]">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-[13px] font-medium transition-all duration-180 cursor-pointer ${
              viewMode === "table"
                ? "bg-white text-[#12141A] shadow-xs"
                : "text-[#666C78] hover:text-[#12141A]"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Table View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("chart")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-[13px] font-medium transition-all duration-180 cursor-pointer ${
              viewMode === "chart"
                ? "bg-white text-[#FF5A1F] shadow-xs"
                : "text-[#666C78] hover:text-[#12141A]"
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            <span>Chart View</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-[16px] border border-[#EDE8E0] bg-white shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666C78]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campaigns by name..."
            className="w-full pl-10 pr-4 py-2 text-[14px] font-medium rounded-[12px] border border-[#EDE8E0] bg-[#F7F5F0] text-[#12141A] placeholder:text-[#666C78] focus:outline-none focus:border-[#FF5A1F] focus:bg-white shadow-xs transition-all duration-180"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CampaignStatus | "all")}
            className="rounded-[12px] border border-[#EDE8E0] bg-[#F7F5F0] px-3.5 py-2 text-[14px] font-medium text-[#12141A] focus:outline-none focus:border-[#FF5A1F] focus:bg-white shadow-xs cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="scheduled">Scheduled</option>
            <option value="processing">Sending</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {statusFilter !== "all" && (
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className="text-[13px] font-medium text-[#FF5A1F] bg-[#FFF0EB] border border-[#FF5A1F]/30 px-3 py-1.5 rounded-[12px] hover:bg-[#FFE0D4] transition-colors cursor-pointer shadow-xs"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* VIEW MODE 1: TABLE VIEW */}
      {/* ==================================================================== */}
      {viewMode === "table" && (
        <div className="rounded-[16px] border border-[#EDE8E0] bg-white overflow-hidden shadow-[0_1px_2px_rgba(11,13,18,.04),0_8px_24px_-12px_rgba(11,13,18,.12)]">
          <Table>
            <TableHeader className="bg-[#FAF9F5]">
              <TableRow className="border-b border-[#EDE8E0]">
                <TableHead className="text-[13px] font-medium uppercase tracking-wider text-[#666C78] py-4 pl-6">Campaign Name</TableHead>
                <TableHead className="text-[13px] font-medium uppercase tracking-wider text-[#666C78] py-4">Template &amp; Type</TableHead>
                <TableHead className="text-[13px] font-medium uppercase tracking-wider text-[#666C78] py-4">Status</TableHead>
                <TableHead className="text-[13px] font-medium uppercase tracking-wider text-[#666C78] py-4">Audience / Progress</TableHead>
                <TableHead className="text-[13px] font-medium uppercase tracking-wider text-[#666C78] py-4">Cost</TableHead>
                <TableHead className="text-[13px] font-medium uppercase tracking-wider text-[#666C78] py-4">Created</TableHead>
                <TableHead className="text-right text-[13px] font-medium uppercase tracking-wider text-[#666C78] py-4 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-[14px] text-[#666C78] font-normal">
                    No campaigns found. Click &quot;New Campaign&quot; to launch your first controlled broadcast.
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((camp) => {
                  const statusCfg = STATUS_CONFIG[camp.status] || STATUS_CONFIG.draft;
                  const progressPercent =
                    camp.total_recipients > 0
                      ? Math.round((camp.sent_count / camp.total_recipients) * 100)
                      : 0;

                  return (
                    <TableRow key={camp.id} className="border-b border-[#EDE8E0]/70 hover:bg-[#F7F5F0]/70 transition-colors">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3 py-1">
                          <div className="h-10 w-10 rounded-[12px] bg-[#F4F0FF] text-[#7C4DFF] border border-[#E0D4FC] flex items-center justify-center shrink-0 shadow-xs">
                            <Megaphone className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="font-medium text-[15px] text-[#12141A] block">
                              {camp.name}
                            </span>
                            <span className="text-[13px] text-[#666C78] font-normal">
                              By {camp.created_by_name}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <span className="tabular-nums text-[14px] font-medium text-[#12141A] block">
                            {camp.template_name}
                          </span>
                          <Badge variant="neutral" className="text-[12px] uppercase font-medium px-2 py-0.5 mt-0.5 border border-[#EDE8E0] bg-[#F7F5F0] text-[#666C78]">
                            {camp.template_category}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant={statusCfg.badgeVariant} className="text-[12px] uppercase font-medium px-2.5 py-0.5">
                          {statusCfg.label}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="w-48 space-y-1.5">
                          <div className="flex justify-between text-[13px] font-medium text-[#12141A]">
                            <span className="tabular-nums text-[13px] text-[#666C78]">{camp.sent_count} / {camp.total_recipients} sent</span>
                            <span className="tabular-nums font-medium text-[#12141A]">{progressPercent}%</span>
                          </div>
                          <div className="h-2 w-full bg-[#EDE8E0] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#12B886] transition-all rounded-full"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-[14px] font-medium tabular-nums text-[#12141A]">
                          {formatINR(camp.actual_cost > 0 ? camp.actual_cost : camp.estimated_cost)}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="text-[13px] font-normal text-[#666C78]">
                          {formatDate(camp.created_at)}
                        </span>
                      </TableCell>

                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Control buttons */}
                          {camp.status === "processing" && (
                            <button
                              onClick={() => handlePause(camp.id)}
                              className="p-2 rounded-[10px] text-[#8F5300] hover:bg-[#FFF3D6] cursor-pointer transition-transform active:scale-95 duration-140"
                              title="Pause sending"
                            >
                              <PauseCircle className="h-4 w-4" />
                            </button>
                          )}
                          {camp.status === "paused" && (
                            <button
                              onClick={() => handleResume(camp.id)}
                              className="p-2 rounded-[10px] text-[#0A7A53] hover:bg-[#E6FBF2] cursor-pointer transition-transform active:scale-95 duration-140"
                              title="Resume sending"
                            >
                              <PlayCircle className="h-4 w-4" />
                            </button>
                          )}
                          {(camp.status === "scheduled" || camp.status === "paused") && (
                            <button
                              onClick={() => handleCancel(camp.id)}
                              className="p-2 rounded-[10px] text-[#E5484D] hover:bg-[#FFE9EA] cursor-pointer transition-transform active:scale-95 duration-140"
                              title="Cancel campaign"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}

                          {/* Quick CSV Download */}
                          <button
                            type="button"
                            onClick={() => handleExportSingleCSV(camp.id, camp.name)}
                            className="p-2 rounded-[10px] text-[#454B57] hover:text-[#FF5A1F] hover:bg-[#FFF0EB] cursor-pointer transition-all duration-140 active:scale-95"
                            title="Download campaign demographic CSV report"
                          >
                            <Download className="h-4 w-4" />
                          </button>

                          {/* Detail Report Link */}
                          <Link href={`/app/${orgSlug}/campaigns/${camp.id}`} className="text-[14px]">
                            <Button size="sm" variant="ghost" className="h-9 text-[13px] font-medium text-[#12141A] hover:text-[#7C4DFF] hover:bg-[#F4F0FF] rounded-[10px] flex items-center gap-1 transition-transform active:scale-95 duration-140">
                              <Eye className="h-4 w-4 text-[#666C78]" />
                              <span>Report</span>
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW MODE 2: CHART VIEW (Multi-dimensional Demographic & Funnel View) */}
      {/* ==================================================================== */}
      {viewMode === "chart" && (
        <div className="space-y-6">
          {/* Funnel Overview */}
          <div className="p-6 rounded-[16px] border border-[#EDE8E0] bg-white shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDE8E0]/70 pb-4">
              <div>
                <h3 className="text-[17px] font-medium text-[#12141A]">
                  Aggregate Funnel Performance
                </h3>
                <p className="text-[13px] text-[#666C78] mt-0.5">
                  End-to-end delivery and read progression across all campaigns in this organization.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="orangeSubtle" className="text-[13px] px-3 py-1 font-medium">
                  {metrics.readRate} Overall Read Rate
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportAllCSV}
                  className="rounded-[10px] text-[13px] font-medium border-[#EDE8E0] text-[#12141A] hover:bg-[#F7F5F0] flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-[#FF5A1F]" />
                  <span>Export Funnel (CSV)</span>
                </Button>
              </div>
            </div>

            {/* Funnel Bars */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-[16px] bg-[#F7F5F0] border border-[#EDE8E0] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[#666C78] uppercase tracking-wider">1. Total Audience</span>
                  <Users className="h-4 w-4 text-[#666C78]" />
                </div>
                <div className="text-[24px] font-medium text-[#12141A] tabular-nums">
                  {allOrgCampaigns.reduce((sum, c) => sum + c.total_recipients, 0)}
                </div>
                <div className="h-2 w-full bg-[#EDE8E0] rounded-full overflow-hidden">
                  <div className="h-full bg-[#12141A] rounded-full w-full" />
                </div>
                <span className="text-[11px] text-[#666C78] block">100% Target Base</span>
              </div>

              <div className="p-4 rounded-[16px] bg-[#EFF6FF] border border-[#BFDBFE] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[#1D4ED8] uppercase tracking-wider">2. Dispatched</span>
                  <Send className="h-4 w-4 text-[#1D4ED8]" />
                </div>
                <div className="text-[24px] font-medium text-[#1E40AF] tabular-nums">
                  {metrics.totalSent}
                </div>
                <div className="h-2 w-full bg-[#BFDBFE] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2563EB] rounded-full"
                    style={{
                      width: `${
                        allOrgCampaigns.reduce((sum, c) => sum + c.total_recipients, 0) > 0
                          ? Math.round((metrics.totalSent / allOrgCampaigns.reduce((sum, c) => sum + c.total_recipients, 0)) * 100)
                          : 100
                      }%`,
                    }}
                  />
                </div>
                <span className="text-[11px] text-[#1D4ED8] block">Sent via Meta Cloud</span>
              </div>

              <div className="p-4 rounded-[16px] bg-[#ECFDF5] border border-[#A7F3D0] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[#047857] uppercase tracking-wider">3. Delivered</span>
                  <CheckCircle2 className="h-4 w-4 text-[#047857]" />
                </div>
                <div className="text-[24px] font-medium text-[#065F46] tabular-nums">
                  {metrics.totalDelivered}
                </div>
                <div className="h-2 w-full bg-[#A7F3D0] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#059669] rounded-full"
                    style={{
                      width: metrics.deliveryRate,
                    }}
                  />
                </div>
                <span className="text-[11px] text-[#047857] block">{metrics.deliveryRate} delivery success</span>
              </div>

              <div className="p-4 rounded-[16px] bg-[#FFF0EB] border border-[#FFD0BD] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[#C2410C] uppercase tracking-wider">4. Read</span>
                  <Eye className="h-4 w-4 text-[#C2410C]" />
                </div>
                <div className="text-[24px] font-medium text-[#9A3412] tabular-nums">
                  {metrics.totalRead}
                </div>
                <div className="h-2 w-full bg-[#FFD0BD] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FF5A1F] rounded-full"
                    style={{
                      width: metrics.readRate,
                    }}
                  />
                </div>
                <span className="text-[11px] text-[#C2410C] block">{metrics.readRate} read conversion</span>
              </div>
            </div>
          </div>

          {/* Demographic Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Age Demographics Card */}
            <div className="p-6 rounded-[16px] border border-[#EDE8E0] bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[16px] font-medium text-[#12141A] flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#FF5A1F]" />
                    <span>Age Demographics &amp; Read Rates</span>
                  </h4>
                  <p className="text-[13px] text-[#666C78]">Audience distribution across age groups</p>
                </div>
                <span className="text-[12px] font-medium text-[#666C78] bg-[#F7F5F0] px-2.5 py-1 rounded-[8px] border border-[#EDE8E0]">
                  4 Age Brackets
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {Object.entries(aggregateDemographics.ageGroups).map(([bracket, data]) => {
                  const percentOfTotal = aggregateDemographics.totalRecipients > 0
                    ? Math.round((data.count / aggregateDemographics.totalRecipients) * 100)
                    : 0;
                  const readPercent = data.count > 0 ? Math.round((data.read / data.count) * 100) : 0;

                  return (
                    <div key={bracket} className="p-3.5 rounded-[14px] bg-[#FAF9F5] border border-[#EDE8E0]/70 space-y-2">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="font-medium text-[#12141A]">Age {bracket}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[#666C78] tabular-nums">{data.count} contacts ({percentOfTotal}%)</span>
                          <span className="font-medium text-[#0A7A53] tabular-nums">{readPercent}% read</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-[#EDE8E0] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#FF5A1F] rounded-full transition-all duration-300"
                          style={{ width: `${readPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gender Performance Card */}
            <div className="p-6 rounded-[16px] border border-[#EDE8E0] bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[16px] font-medium text-[#12141A] flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-[#7C4DFF]" />
                    <span>Gender Engagement Share</span>
                  </h4>
                  <p className="text-[13px] text-[#666C78]">Delivery &amp; read engagement by gender</p>
                </div>
                <span className="text-[12px] font-medium text-[#666C78] bg-[#F7F5F0] px-2.5 py-1 rounded-[8px] border border-[#EDE8E0]">
                  Gender Share
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {Object.entries(aggregateDemographics.genderGroups).map(([gender, data]) => {
                  const percentOfTotal = aggregateDemographics.totalRecipients > 0
                    ? Math.round((data.count / aggregateDemographics.totalRecipients) * 100)
                    : 0;
                  const readPercent = data.count > 0 ? Math.round((data.read / data.count) * 100) : 0;
                  const label = gender.charAt(0).toUpperCase() + gender.slice(1);

                  return (
                    <div key={gender} className="p-3.5 rounded-[14px] bg-[#FAF9F5] border border-[#EDE8E0]/70 space-y-2">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="font-medium text-[#12141A] capitalize">{label}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[#666C78] tabular-nums">{data.count} contacts ({percentOfTotal}%)</span>
                          <span className="font-medium text-[#7C4DFF] tabular-nums">{readPercent}% read</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-[#EDE8E0] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#7C4DFF] rounded-full transition-all duration-300"
                          style={{ width: `${readPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Department Breakdown */}
            <div className="p-6 rounded-[16px] border border-[#EDE8E0] bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[16px] font-medium text-[#12141A] flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-[#0A7A53]" />
                    <span>Department &amp; Role Performance</span>
                  </h4>
                  <p className="text-[13px] text-[#666C78]">Read rate by organizational role</p>
                </div>
                <span className="text-[12px] font-medium text-[#666C78] bg-[#F7F5F0] px-2.5 py-1 rounded-[8px] border border-[#EDE8E0]">
                  5 Departments
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {Object.entries(aggregateDemographics.deptGroups).map(([dept, data]) => {
                  const readPercent = data.count > 0 ? Math.round((data.read / data.count) * 100) : 0;
                  const label = dept.charAt(0).toUpperCase() + dept.slice(1);

                  return (
                    <div key={dept} className="p-3 rounded-[12px] bg-[#FAF9F5] border border-[#EDE8E0]/70 flex items-center justify-between">
                      <div>
                        <span className="text-[14px] font-medium text-[#12141A] block">{label}</span>
                        <span className="text-[12px] text-[#666C78] font-normal">{data.count} recipients</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[14px] font-medium text-[#0A7A53] tabular-nums block">{readPercent}%</span>
                        <span className="text-[11px] text-[#666C78] font-normal">{data.read} reads</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Client Classification Breakdown */}
            <div className="p-6 rounded-[16px] border border-[#EDE8E0] bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[16px] font-medium text-[#12141A] flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-[#FF5A1F]" />
                    <span>Client Classification</span>
                  </h4>
                  <p className="text-[13px] text-[#666C78]">Ongoing Clients vs New Opportunities</p>
                </div>
                <span className="text-[12px] font-medium text-[#666C78] bg-[#F7F5F0] px-2.5 py-1 rounded-[8px] border border-[#EDE8E0]">
                  Segmentation
                </span>
              </div>

              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-[16px] bg-[#FAF9F5] border border-[#EDE8E0] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[14px] font-medium text-[#12141A] block">Ongoing Clients</span>
                      <span className="text-[12px] text-[#666C78]">Existing business accounts</span>
                    </div>
                    <Badge variant="success" className="text-[12px] font-medium px-2.5 py-0.5">
                      {aggregateDemographics.classGroups.ongoing_client.count} recipients
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[13px] text-[#0A7A53] font-medium pt-1">
                    <span>Read Conversion</span>
                    <span className="tabular-nums">
                      {aggregateDemographics.classGroups.ongoing_client.count > 0
                        ? Math.round((aggregateDemographics.classGroups.ongoing_client.read / aggregateDemographics.classGroups.ongoing_client.count) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-[16px] bg-[#FAF9F5] border border-[#EDE8E0] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[14px] font-medium text-[#12141A] block">New Opportunities</span>
                      <span className="text-[12px] text-[#666C78]">Prospective customer contacts</span>
                    </div>
                    <Badge variant="orangeSubtle" className="text-[12px] font-medium px-2.5 py-0.5">
                      {aggregateDemographics.classGroups.new_opportunity.count} recipients
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[13px] text-[#FF5A1F] font-medium pt-1">
                    <span>Read Conversion</span>
                    <span className="tabular-nums">
                      {aggregateDemographics.classGroups.new_opportunity.count > 0
                        ? Math.round((aggregateDemographics.classGroups.new_opportunity.read / aggregateDemographics.classGroups.new_opportunity.count) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4-Step Create Campaign Wizard Modal */}
      {/* ==================================================================== */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <div className="max-w-2xl bg-white rounded-2xl p-2">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-medium text-[#12141A]">Create Controlled WhatsApp Campaign</DialogTitle>
                <DialogDescription className="text-xs text-[#666C78] mt-0.5 font-normal">
                  Step {wizardStep} of 4:{" "}
                  {wizardStep === 1 && "Campaign Basics & Approved Template"}
                  {wizardStep === 2 && "Audience Filtering, Demographics & Recipient Limit"}
                  {wizardStep === 3 && "Variable Mapping & Real Preview"}
                  {wizardStep === 4 && "Cost Review & Launch Confirmation"}
                </DialogDescription>
              </div>

              {/* Step indicator badges */}
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4].map((step) => (
                  <span
                    key={step}
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium tabular-nums transition-all duration-180 ${
                      wizardStep === step
                        ? "bg-[#FF5A1F] text-white shadow-xs"
                        : wizardStep > step
                        ? "bg-[#FFF0EB] text-[#FF5A1F] border border-[#FF5A1F]/30"
                        : "bg-[#F7F5F0] text-[#666C78] border border-[#EDE8E0]"
                    }`}
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>
          </DialogHeader>

          {launchError && (
            <div className="my-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{launchError}</span>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 1: Basics & Template */}
          {/* ================================================================ */}
          {wizardStep === 1 && (
            <div className="space-y-4 my-4 text-xs">
              <div>
                <label className="block font-medium text-[#12141A] mb-1">
                  Campaign Name *
                </label>
                <Input
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  placeholder="e.g. Q4 Retail Software Upgrade Announcement"
                  className="text-xs h-10 font-medium rounded-xl border-[#EDE8E0] focus:border-[#FF5A1F]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#12141A] mb-1">
                  Select Approved WhatsApp Template *
                </label>
                {approvedTemplates.length === 0 ? (
                  <div className="p-3.5 rounded-2xl bg-[#FFF0EB] text-[#12141A] border border-[#FF5A1F]/30 space-y-1">
                    <p className="font-medium text-[#FF5A1F]">No APPROVED templates found in your workspace.</p>
                    <p className="text-xs font-normal text-[#666C78]">
                      Meta Cloud API requires approved templates for outbound messaging. Go to the{" "}
                      <Link href={`/app/${orgSlug}/templates`} className="underline font-medium text-[#FF5A1F]">
                        Template Manager
                      </Link>{" "}
                      to create and approve a template draft first.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={activeTemplate?.id}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="w-full rounded-xl border border-[#EDE8E0] bg-[#F7F5F0] px-3 py-2.5 text-xs font-medium text-[#12141A] focus:outline-none focus:border-[#FF5A1F]"
                    >
                      {approvedTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.category.toUpperCase()} • {t.language})
                        </option>
                      ))}
                    </select>

                    {activeTemplate && (
                      <div className="p-3.5 rounded-2xl bg-[#F7F5F0] border border-[#EDE8E0]">
                        <span className="text-[11px] text-[#666C78] tabular-nums font-medium block mb-1">
                          Template Preview ({activeTemplate.category.toUpperCase()}):
                        </span>
                        <p className="text-xs text-[#12141A] leading-relaxed whitespace-pre-wrap font-normal">
                          {activeTemplate.body_content}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 2: Audience, Demographics & Recipient Limit */}
          {/* ================================================================ */}
          {wizardStep === 2 && (
            <div className="space-y-4 my-4 text-xs">
              <div>
                <label className="block font-medium text-[#12141A] mb-1">
                  Saved Audience Segment
                </label>
                <select
                  value={selectedSegmentId}
                  onChange={(e) => setSelectedSegmentId(e.target.value)}
                  className="w-full rounded-xl border border-[#EDE8E0] bg-[#F7F5F0] px-3 py-2.5 text-xs font-medium text-[#12141A] focus:outline-none focus:border-[#FF5A1F]"
                >
                  <option value="none">Custom Multidimensional Criteria...</option>
                  {savedSegments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.description})
                    </option>
                  ))}
                </select>
              </div>

              {selectedSegmentId === "none" && (
                <div className="space-y-3 p-4 rounded-2xl bg-[#F7F5F0] border border-[#EDE8E0]">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[#666C78] block">
                    Demographic &amp; Audience Targeting Filters
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Age Filter */}
                    <div>
                      <label className="block font-medium text-[#12141A] mb-1">
                        Age Range Filter
                      </label>
                      <select
                        value={filterAge}
                        onChange={(e) => setFilterAge(e.target.value)}
                        className="w-full rounded-xl border border-[#EDE8E0] bg-white px-2.5 py-2 text-xs font-medium text-[#12141A] focus:border-[#FF5A1F]"
                      >
                        <option value="all">All Ages</option>
                        <option value="18-25">18 - 25 years</option>
                        <option value="26-35">26 - 35 years</option>
                        <option value="36-50">36 - 50 years</option>
                        <option value="50+">50+ years</option>
                      </select>
                    </div>

                    {/* Gender Filter */}
                    <div>
                      <label className="block font-medium text-[#12141A] mb-1">
                        Gender Filter
                      </label>
                      <select
                        value={filterGender}
                        onChange={(e) => setFilterGender(e.target.value)}
                        className="w-full rounded-xl border border-[#EDE8E0] bg-white px-2.5 py-2 text-xs font-medium text-[#12141A] focus:border-[#FF5A1F]"
                      >
                        <option value="all">All Genders</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Department / Role Filter */}
                    <div>
                      <label className="block font-medium text-[#12141A] mb-1">
                        Department &amp; Role
                      </label>
                      <select
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                        className="w-full rounded-xl border border-[#EDE8E0] bg-white px-2.5 py-2 text-xs font-medium text-[#12141A] focus:border-[#FF5A1F]"
                      >
                        <option value="all">All Departments</option>
                        <option value="executive">Executive</option>
                        <option value="finance">Finance</option>
                        <option value="operations">Operations</option>
                        <option value="marketing">Marketing</option>
                        <option value="technology">Technology</option>
                      </select>
                    </div>

                    {/* Client Classification Filter */}
                    <div>
                      <label className="block font-medium text-[#12141A] mb-1">
                        Client Classification
                      </label>
                      <select
                        value={filterClassification}
                        onChange={(e) => setFilterClassification(e.target.value)}
                        className="w-full rounded-xl border border-[#EDE8E0] bg-white px-2.5 py-2 text-xs font-medium text-[#12141A] focus:border-[#FF5A1F]"
                      >
                        <option value="all">All Contacts</option>
                        <option value="ongoing_client">Ongoing Clients</option>
                        <option value="new_opportunity">New Opportunities</option>
                      </select>
                    </div>

                    {/* Filter by Tag */}
                    <div>
                      <label className="block font-medium text-[#12141A] mb-1">
                        Filter by Tag
                      </label>
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val && !filterTags.includes(val)) setFilterTags([...filterTags, val]);
                        }}
                        className="w-full rounded-xl border border-[#EDE8E0] bg-white px-2.5 py-2 text-xs font-medium text-[#12141A] focus:border-[#FF5A1F]"
                      >
                        <option value="">Select Tag...</option>
                        <option value="VIP">VIP</option>
                        <option value="Retail">Retail</option>
                        <option value="Wholesale">Wholesale</option>
                        <option value="Tech">Tech</option>
                        <option value="Logistics">Logistics</option>
                      </select>
                      {filterTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {filterTags.map((t) => (
                            <Badge key={t} variant="neutral" className="text-[10px] font-medium pr-1">
                              {t}
                              <button
                                type="button"
                                onClick={() => setFilterTags(filterTags.filter((x) => x !== t))}
                                className="ml-1 text-[#666C78] hover:text-[#12141A]"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Filter by Source */}
                    <div>
                      <label className="block font-medium text-[#12141A] mb-1">
                        Filter by Source
                      </label>
                      <Input
                        value={filterSource}
                        onChange={(e) => setFilterSource(e.target.value)}
                        placeholder="e.g. WhatsApp Inbound"
                        className="text-xs h-9 bg-white border-[#EDE8E0] focus:border-[#FF5A1F]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Recipient Limit Capping Options */}
              <div className="p-4 rounded-2xl bg-white border border-[#EDE8E0] space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-[#12141A] block">
                    Recipient Limit Capping
                  </label>
                  <span className="text-[11px] text-[#666C78]">
                    {recipientLimit ? `Cap: ${recipientLimit} recipients` : "No limit (All eligible)"}
                  </span>
                </div>

                {/* Preset limit pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: "All", value: null },
                    { label: "10", value: 10 },
                    { label: "25", value: 25 },
                    { label: "50", value: 50 },
                    { label: "100", value: 100 },
                    { label: "250", value: 250 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setRecipientLimit(preset.value)}
                      className={`px-3 py-1 rounded-[8px] text-[12px] font-medium transition-all duration-140 cursor-pointer ${
                        recipientLimit === preset.value
                          ? "bg-[#FF5A1F] text-white shadow-xs"
                          : "bg-[#F7F5F0] border border-[#EDE8E0] text-[#454B57] hover:bg-[#FAF9F5]"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="pt-1">
                  <Input
                    type="number"
                    value={recipientLimit ?? ""}
                    onChange={(e) => setRecipientLimit(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Or enter custom recipient limit count..."
                    className="text-xs h-9 tabular-nums border-[#EDE8E0] focus:border-[#FF5A1F]"
                  />
                </div>
              </div>

              {/* Dynamic Recipient & Compliance Breakdown Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#EDE8E0] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#12141A]">Real-Time Audience Audit:</span>
                  <Badge variant="orangeSubtle" className="text-xs font-medium tabular-nums">
                    {effectiveRecipientCount} Eligible Recipients
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-[#F7F5F0] border border-[#EDE8E0]">
                    <span className="text-[#666C78] block font-normal text-[11px]">Total Filter Matched</span>
                    <span className="font-medium tabular-nums text-base text-[#12141A]">
                      {audienceResult.totalMatched}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                    <span className="block font-normal text-[11px]">Opted-Out</span>
                    <span className="font-medium tabular-nums text-base">
                      {audienceResult.suppressedOptOutCount}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                    <span className="block font-normal text-[11px]">Missing Opt-In</span>
                    <span className="font-medium tabular-nums text-base">
                      {audienceResult.suppressedConsentCount}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-[#666C78] font-normal">
                  * Contacts who explicitly opted out or have not granted affirmative consent are excluded automatically by Meta compliance safeguards.
                </p>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 3: Variable Mapping & Live Sample Preview */}
          {/* ================================================================ */}
          {wizardStep === 3 && (
            <div className="space-y-4 my-4 text-xs">
              {activeTemplate && activeTemplate.variables.length > 0 ? (
                <div className="space-y-3">
                  <label className="font-medium text-[#12141A] block">
                    Map Template Variables to CRM Contact Fields:
                  </label>

                  {activeTemplate.variables.map((v) => (
                    <div key={v} className="flex items-center gap-3 p-3 rounded-xl bg-[#F7F5F0] border border-[#EDE8E0]">
                      <span className="tabular-nums font-medium text-[#FF5A1F] shrink-0 w-16">
                        {"{{" + v + "}}"}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-[#666C78] shrink-0" />
                      <select
                        value={variableMappings[v] || "first_name"}
                        onChange={(e) =>
                          setVariableMappings({ ...variableMappings, [v]: e.target.value })
                        }
                        className="flex-1 rounded-xl border border-[#EDE8E0] bg-white px-2.5 py-2 text-xs font-medium text-[#12141A] focus:outline-none focus:border-[#FF5A1F]"
                      >
                        <option value="first_name">Contact: First Name</option>
                        <option value="last_name">Contact: Last Name</option>
                        <option value="company">Contact: Company</option>
                        <option value="phone">Contact: Phone Number</option>
                        <option value="email">Contact: Email</option>
                      </select>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#666C78] font-normal">
                  This template does not contain dynamic variables.
                </p>
              )}

              {/* Live Rendered Message Preview for Sample Contact */}
              <div className="p-4 rounded-2xl bg-[#F7F5F0] border border-[#EDE8E0] space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#666C78] font-normal uppercase">
                  <span>Representative Preview for:</span>
                  <span className="text-[#12141A] font-medium tabular-nums">
                    {sampleRecipient ? `${sampleRecipient.first_name} (${sampleRecipient.phone})` : "Sample Customer"}
                  </span>
                </div>

                <div className="bg-white border border-[#EDE8E0] rounded-2xl p-4 shadow-2xs max-w-md">
                  {activeTemplate?.header_text && (
                    <div className="font-medium text-xs text-[#12141A] mb-1">
                      {activeTemplate.header_text}
                    </div>
                  )}
                  <p className="text-xs text-[#12141A] leading-relaxed whitespace-pre-wrap font-normal">
                    {previewBody}
                  </p>
                  {activeTemplate?.footer_text && (
                    <div className="text-[11px] text-[#666C78] mt-1 font-normal">
                      {activeTemplate.footer_text}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 4: Cost Review & Launch Confirmation */}
          {/* ================================================================ */}
          {wizardStep === 4 && (
            <div className="space-y-4 my-4 text-xs">
              {/* Cost Card */}
              <div className="p-4 rounded-2xl bg-[#12141A] text-white border border-[#242830] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm text-white block">
                      Meta Cloud API Cost Estimate
                    </span>
                    <span className="text-[11px] text-[#9EA3AE] font-normal">
                      Based on {pricing.pricingDate} official rate card
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-medium tabular-nums text-[#FF5A1F] block">
                      ₹{pricing.estimatedTotalCostINR}
                    </span>
                    <span className="text-[11px] text-[#9EA3AE] tabular-nums font-normal">
                      ({pricing.eligibleRecipients} msgs @ ₹{pricing.unitCostINR}/msg)
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-medium">
                  <span className="text-[#9EA3AE]">Monthly Budget Limit: ₹{pricing.monthlyBudgetLimitINR}</span>
                  <span className="text-emerald-400 font-medium">
                    Within Safe Platform Budget
                  </span>
                </div>
              </div>

              {/* Schedule options */}
              <div className="p-3.5 rounded-2xl bg-[#F7F5F0] border border-[#EDE8E0] space-y-2">
                <label className="font-medium text-[#12141A] block">
                  Delivery Timing:
                </label>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[#12141A]">
                    <input
                      type="radio"
                      name="deliveryTime"
                      checked={!isScheduled}
                      onChange={() => setIsScheduled(false)}
                      className="accent-[#FF5A1F]"
                    />
                    <span>Send Immediately</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-[#12141A]">
                    <input
                      type="radio"
                      name="deliveryTime"
                      checked={isScheduled}
                      onChange={() => setIsScheduled(true)}
                      className="accent-[#FF5A1F]"
                    />
                    <span>Schedule for Later</span>
                  </label>
                </div>

                {isScheduled && (
                  <div className="pt-2">
                    <Input
                      type="datetime-local"
                      value={scheduleDateTime}
                      onChange={(e) => setScheduleDateTime(e.target.value)}
                      className="text-xs h-10 bg-white border-[#EDE8E0] focus:border-[#FF5A1F]"
                    />
                  </div>
                )}
              </div>

              {/* Test mode toggle */}
              <label className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-[#F7F5F0] border border-[#EDE8E0] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTestMode}
                  onChange={(e) => setIsTestMode(e.target.checked)}
                  className="accent-[#FF5A1F]"
                />
                <div>
                  <span className="font-medium text-[#12141A] block">
                    Launch in Safety Test Mode
                  </span>
                  <span className="text-[11px] text-[#666C78] font-normal">
                    Tags campaign as test-run and clearly labels delivery as simulated.
                  </span>
                </div>
              </label>

              {/* Explicit Confirmation Checkbox */}
              <label className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#FFF0EB] border border-[#FF5A1F]/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmUnderstood}
                  onChange={(e) => setConfirmUnderstood(e.target.checked)}
                  className="mt-0.5 accent-[#FF5A1F]"
                />
                <span className="text-xs text-[#12141A] font-normal leading-relaxed">
                  I confirm that all targeted recipients have granted compliant consent, that opt-out keywords (STOP) are supported, and that I approve the estimated Meta Cloud API messaging spend of ₹{pricing.estimatedTotalCostINR}.
                </span>
              </label>
            </div>
          )}

          {/* Modal Footer Controls */}
          <DialogFooter className="border-t border-[#EDE8E0] pt-3">
            {wizardStep > 1 && (
              <Button
                variant="ghost"
                onClick={() => setWizardStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)}
                className="font-medium rounded-xl text-xs text-[#12141A] hover:bg-[#F7F5F0]"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}

            {wizardStep < 4 ? (
              <Button
                onClick={() => setWizardStep((prev) => (prev + 1) as 1 | 2 | 3 | 4)}
                disabled={wizardStep === 1 && (!campName.trim() || !activeTemplate)}
                className="bg-[#FF5A1F] hover:bg-[#E54D15] text-white font-medium rounded-xl text-xs shadow-2xs"
              >
                Continue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleLaunchCampaign}
                disabled={!confirmUnderstood}
                className="bg-[#FF5A1F] hover:bg-[#E54D15] text-white font-medium rounded-xl text-xs flex items-center gap-1.5 shadow-2xs"
              >
                <Send className="h-4 w-4" />
                <span>Launch Campaign</span>
              </Button>
            )}
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
}
