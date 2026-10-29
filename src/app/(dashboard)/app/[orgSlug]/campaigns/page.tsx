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

  // Create Campaign Wizard State
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);

  // Wizard Step 1: Basics & Template
  const [campName, setCampName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // Wizard Step 2: Audience Filter
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>("none");
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterSource, setFilterSource] = useState("");
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

  // Target criteria for audience evaluation
  const currentCriteria: AudienceFilterCriteria = useMemo(() => {
    if (selectedSegmentId !== "none") {
      const seg = savedSegments.find((s) => s.id === selectedSegmentId);
      if (seg) return seg.filter_criteria;
    }
    return {
      tags: filterTags.length > 0 ? filterTags : undefined,
      source: filterSource || undefined,
    };
  }, [selectedSegmentId, savedSegments, filterTags, filterSource]);

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
    const totalSpent = all.reduce((sum, c) => sum + c.actual_cost, 0);
    const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 100;

    return {
      totalCampaigns: all.length,
      totalSent,
      deliveryRate: `${deliveryRate}%`,
      totalSpent: formatINR(totalSpent),
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E6E2D8]">
        <div>
          <h1 className="type-display text-[#12141A]">
            Broadcasts
          </h1>
          <p className="type-body text-[#454B57] mt-1">
            Meta Cloud WhatsApp broadcasts with audience segmentation, live cost estimation, and delivery metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href={`/app/${orgSlug}/templates`}>
            <Button size="sm" variant="outline" className="rounded-[12px] border-[#E6E2D8] bg-white hover:bg-[#F7F5F0] text-[#12141A] font-medium text-[14px] flex items-center gap-1.5 shadow-xs cursor-pointer h-10 px-4">
              <FileText className="h-4 w-4 text-[#666C78]" />
              <span>Manage Templates</span>
            </Button>
          </Link>

          <Button
            size="sm"
            variant="primary"
            onClick={handleOpenWizard}
            className="rounded-[12px] text-[14px] font-medium flex items-center gap-1.5 shadow-xs cursor-pointer h-10 px-4"
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
            subtext: "Network verified",
          },
          {
            id: "spend",
            label: "Total Spend",
            value: metrics.totalSpent,
            subtext: "Monthly budget ₹10,000",
          },
        ]}
      />

      {/* Horizontal Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`px-3.5 py-1.5 rounded-[10px] text-[14px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
            statusFilter === "all"
              ? "bg-[#0B0D12] text-white shadow-xs"
              : "bg-white border border-[#E6E2D8] text-[#454B57] hover:text-[#12141A] hover:bg-[#F7F5F0]"
          }`}
        >
          <span>All Campaigns</span>
          <span className="tabular-nums text-[13px] opacity-80">({allOrgCampaigns.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("draft")}
          className={`px-3.5 py-1.5 rounded-[10px] text-[14px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
            statusFilter === "draft"
              ? "bg-[#0B0D12] text-white shadow-xs"
              : "bg-white border border-[#E6E2D8] text-[#454B57] hover:text-[#12141A] hover:bg-[#F7F5F0]"
          }`}
        >
          <span>Drafts</span>
          <span className="tabular-nums text-[13px] opacity-80">({draftsCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("scheduled")}
          className={`px-3.5 py-1.5 rounded-[10px] text-[14px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
            statusFilter === "scheduled"
              ? "bg-[#8F5300] text-white shadow-xs"
              : "bg-white border border-[#E6E2D8] text-[#454B57] hover:text-[#12141A] hover:bg-[#F7F5F0]"
          }`}
        >
          <span>Scheduled</span>
          <span className="tabular-nums text-[13px] opacity-80">({scheduledCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("processing")}
          className={`px-3.5 py-1.5 rounded-[10px] text-[14px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
            statusFilter === "processing"
              ? "bg-[#0A7A53] text-white shadow-xs"
              : "bg-white border border-[#E6E2D8] text-[#454B57] hover:text-[#12141A] hover:bg-[#F7F5F0]"
          }`}
        >
          <span>Active</span>
          <span className="tabular-nums text-[13px] opacity-80">({activeCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("completed")}
          className={`px-3.5 py-1.5 rounded-[10px] text-[14px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
            statusFilter === "completed"
              ? "bg-[#0A7A53] text-white shadow-xs"
              : "bg-white border border-[#E6E2D8] text-[#454B57] hover:text-[#12141A] hover:bg-[#F7F5F0]"
          }`}
        >
          <span>Completed</span>
          <span className="tabular-nums text-[13px] opacity-80">({completedCount})</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-[20px] border border-[#E6E2D8] bg-white shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666C78]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campaigns by name..."
            className="w-full pl-10 pr-4 py-2.5 text-[14px] font-medium rounded-[12px] border border-[#E6E2D8] bg-[#F7F5F0] text-[#12141A] placeholder:text-[#666C78] focus:outline-none focus:border-[#FF5A1F] focus:bg-white shadow-xs transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CampaignStatus | "all")}
            className="rounded-[12px] border border-[#E6E2D8] bg-[#F7F5F0] px-4 py-2.5 text-[14px] font-medium text-[#12141A] focus:outline-none focus:border-[#FF5A1F] focus:bg-white shadow-xs cursor-pointer"
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
              className="text-[14px] font-medium text-[#FF5A1F] bg-[#FFF0EB] border border-[#FF5A1F]/30 px-3 py-2 rounded-[12px] hover:bg-[#FFE0D4] transition-colors cursor-pointer shadow-xs"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="rounded-[20px] border border-[#E6E2D8] bg-white overflow-hidden shadow-[0_1px_2px_rgba(11,13,18,.04),0_8px_24px_-12px_rgba(11,13,18,.12)]">
        <Table>
          <TableHeader className="bg-[#FAF9F5]">
            <TableRow className="border-b border-[#E6E2D8]">
              <TableHead className="text-[13px] font-medium uppercase tracking-wider text-[#666C78] py-4">Campaign Name</TableHead>
              <TableHead className="text-[13px] font-medium uppercase tracking-wider text-[#666C78] py-4">Template &amp; Type</TableHead>
              <TableHead className="text-[13px] font-medium uppercase tracking-wider text-[#666C78] py-4">Status</TableHead>
              <TableHead className="text-[13px] font-medium uppercase tracking-wider text-[#666C78] py-4">Audience / Progress</TableHead>
              <TableHead className="text-[13px] font-medium uppercase tracking-wider text-[#666C78] py-4">Cost</TableHead>
              <TableHead className="text-[13px] font-medium uppercase tracking-wider text-[#666C78] py-4">Created</TableHead>
              <TableHead className="text-right text-[13px] font-medium uppercase tracking-wider text-[#666C78] py-4">Actions</TableHead>
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
                  <TableRow key={camp.id} className="border-b border-[#E6E2D8]/70 hover:bg-[#F7F5F0]/70 transition-colors">
                    <TableCell>
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
                        <Badge variant="neutral" className="text-[12px] uppercase font-medium px-2 py-0.5 mt-0.5 border border-[#E6E2D8] bg-[#F7F5F0] text-[#666C78]">
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
                        <div className="h-2 w-full bg-[#E6E2D8] rounded-full overflow-hidden">
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

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Control buttons */}
                        {camp.status === "processing" && (
                          <button
                            onClick={() => handlePause(camp.id)}
                            className="p-2 rounded-[10px] text-[#8F5300] hover:bg-[#FFF3D6] cursor-pointer"
                            title="Pause sending"
                          >
                            <PauseCircle className="h-4 w-4" />
                          </button>
                        )}
                        {camp.status === "paused" && (
                          <button
                            onClick={() => handleResume(camp.id)}
                            className="p-2 rounded-[10px] text-[#0A7A53] hover:bg-[#E6FBF2] cursor-pointer"
                            title="Resume sending"
                          >
                            <PlayCircle className="h-4 w-4" />
                          </button>
                        )}
                        {(camp.status === "scheduled" || camp.status === "paused") && (
                          <button
                            onClick={() => handleCancel(camp.id)}
                            className="p-2 rounded-[10px] text-[#E5484D] hover:bg-[#FFE9EA] cursor-pointer"
                            title="Cancel campaign"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}

                        <Link href={`/app/${orgSlug}/campaigns/${camp.id}`} className="text-[14px]">
                          <Button size="sm" variant="ghost" className="h-9 text-[14px] font-medium text-[#12141A] hover:text-[#7C4DFF] hover:bg-[#F4F0FF] rounded-[10px]">
                            <Eye className="h-4 w-4 mr-1 text-[#666C78]" /> Report
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

      {/* 4-Step Create Campaign Wizard Modal */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <div className="max-w-2xl bg-white rounded-2xl p-2">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-semibold text-[#0D0D0E]">Create Controlled WhatsApp Campaign</DialogTitle>
                <DialogDescription className="text-xs text-[#8E8E93] mt-0.5 font-medium">
                  Step {wizardStep} of 4:{" "}
                  {wizardStep === 1 && "Campaign Basics & Approved Template"}
                  {wizardStep === 2 && "Audience Filtering & Consent Safeguards"}
                  {wizardStep === 3 && "Variable Mapping & Real Preview"}
                  {wizardStep === 4 && "Cost Review & Launch Confirmation"}
                </DialogDescription>
              </div>

              {/* Step indicator badges */}
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4].map((step) => (
                  <span
                    key={step}
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold tabular-nums transition-all ${
                      wizardStep === step
                        ? "bg-[#FF7A1A] text-white shadow-xs"
                        : wizardStep > step
                        ? "bg-[#24180E] text-[#FF7A1A]"
                        : "bg-[#F7F7F8] text-[#8E8E93] border border-[#E5E5E7]"
                    }`}
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>
          </DialogHeader>

          {launchError && (
            <div className="my-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
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
                <label className="block font-medium text-[#0D0D0E] mb-1">
                  Campaign Name *
                </label>
                <Input
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  placeholder="e.g. Q4 Retail Software Upgrade Announcement"
                  className="text-xs h-10 font-medium rounded-xl border-[#E5E5E7] focus:border-[#FF7A1A]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#0D0D0E] mb-1">
                  Select Approved WhatsApp Template *
                </label>
                {approvedTemplates.length === 0 ? (
                  <div className="p-3.5 rounded-2xl bg-[#FFF4EC] text-[#0D0D0E] border border-[#FF7A1A]/30 space-y-1">
                    <p className="font-semibold text-[#FF7A1A]">No APPROVED templates found in your workspace.</p>
                    <p className="text-xs font-medium text-[#8E8E93]">
                      Meta Cloud API requires approved templates for outbound messaging. Go to the{" "}
                      <Link href={`/app/${orgSlug}/templates`} className="underline font-semibold text-[#FF7A1A]">
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
                      className="w-full rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] px-3 py-2.5 text-xs font-semibold text-[#0D0D0E] focus:outline-none focus:border-[#FF7A1A]"
                    >
                      {approvedTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.category.toUpperCase()} • {t.language})
                        </option>
                      ))}
                    </select>

                    {activeTemplate && (
                      <div className="p-3.5 rounded-2xl bg-[#F7F7F8] border border-[#E5E5E7]">
                        <span className="text-[11px] text-[#8E8E93] tabular-nums font-semibold block mb-1">
                          Template Preview ({activeTemplate.category.toUpperCase()}):
                        </span>
                        <p className="text-xs text-[#0D0D0E] leading-relaxed whitespace-pre-wrap font-medium">
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
          {/* STEP 2: Audience & Consent Suppression */}
          {/* ================================================================ */}
          {wizardStep === 2 && (
            <div className="space-y-4 my-4 text-xs">
              <div>
                <label className="block font-medium text-[#0D0D0E] mb-1">
                  Saved Audience Segment
                </label>
                <select
                  value={selectedSegmentId}
                  onChange={(e) => setSelectedSegmentId(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] px-3 py-2.5 text-xs font-semibold text-[#0D0D0E] focus:outline-none focus:border-[#FF7A1A]"
                >
                  <option value="none">Custom Criteria...</option>
                  {savedSegments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.description})
                    </option>
                  ))}
                </select>
              </div>

              {selectedSegmentId === "none" && (
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#F7F7F8] border border-[#E5E5E7]">
                  <div>
                    <label className="block font-medium text-[#0D0D0E] mb-1">
                      Filter by Tag
                    </label>
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val && !filterTags.includes(val)) setFilterTags([...filterTags, val]);
                      }}
                      className="w-full rounded-xl border border-[#E5E5E7] bg-white px-2.5 py-2 text-xs font-medium text-[#0D0D0E] focus:border-[#FF7A1A]"
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
                              className="ml-1 text-[#8E8E93] hover:text-[#0D0D0E]"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-medium text-[#0D0D0E] mb-1">
                      Filter by Source
                    </label>
                    <Input
                      value={filterSource}
                      onChange={(e) => setFilterSource(e.target.value)}
                      placeholder="e.g. WhatsApp Inbound"
                      className="text-xs h-9 bg-white border-[#E5E5E7] focus:border-[#FF7A1A]"
                    />
                  </div>
                </div>
              )}

              {/* Dynamic Recipient & Compliance Breakdown Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#E5E5E7] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#0D0D0E]">Real-Time Audience Audit:</span>
                  <Badge variant="orangeSubtle" className="text-xs font-medium tabular-nums">
                    {effectiveRecipientCount} Eligible Recipients
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-[#F7F7F8] border border-[#E5E5E7]">
                    <span className="text-[#8E8E93] block font-medium text-[11px]">Total CRM Matched</span>
                    <span className="font-semibold tabular-nums text-base text-[#0D0D0E]">
                      {audienceResult.totalMatched}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                    <span className="block font-medium text-[11px]">Opted-Out</span>
                    <span className="font-semibold tabular-nums text-base">
                      {audienceResult.suppressedOptOutCount}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                    <span className="block font-medium text-[11px]">Missing Opt-In</span>
                    <span className="font-semibold tabular-nums text-base">
                      {audienceResult.suppressedConsentCount}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-[#8E8E93] font-medium">
                  * Contacts who explicitly opted out or have not granted affirmative consent are excluded automatically by Meta compliance safeguards.
                </p>
              </div>

              {/* Optional Recipient Limit */}
              <div>
                <label className="block font-medium text-[#0D0D0E] mb-1">
                  Recipient Limit Capping (Optional safety control)
                </label>
                <Input
                  type="number"
                  value={recipientLimit || ""}
                  onChange={(e) => setRecipientLimit(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g. 50 (Leave empty to message all eligible)"
                  className="text-xs h-10 tabular-nums border-[#E5E5E7] focus:border-[#FF7A1A]"
                />
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
                  <label className="font-medium text-[#0D0D0E] block">
                    Map Template Variables to CRM Contact Fields:
                  </label>

                  {activeTemplate.variables.map((v) => (
                    <div key={v} className="flex items-center gap-3 p-3 rounded-xl bg-[#F7F7F8] border border-[#E5E5E7]">
                      <span className="tabular-nums font-semibold text-[#FF7A1A] shrink-0 w-16">
                        {"{{" + v + "}}"}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-[#8E8E93] shrink-0" />
                      <select
                        value={variableMappings[v] || "first_name"}
                        onChange={(e) =>
                          setVariableMappings({ ...variableMappings, [v]: e.target.value })
                        }
                        className="flex-1 rounded-xl border border-[#E5E5E7] bg-white px-2.5 py-2 text-xs font-semibold text-[#0D0D0E] focus:outline-none focus:border-[#FF7A1A]"
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
                <p className="text-[#8E8E93] font-medium">
                  This template does not contain dynamic variables.
                </p>
              )}

              {/* Live Rendered Message Preview for Sample Contact */}
              <div className="p-4 rounded-2xl bg-[#F7F7F8] border border-[#E5E5E7] space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#8E8E93] font-medium uppercase">
                  <span>Representative Preview for:</span>
                  <span className="text-[#0D0D0E] font-semibold tabular-nums">
                    {sampleRecipient ? `${sampleRecipient.first_name} (${sampleRecipient.phone})` : "Sample Customer"}
                  </span>
                </div>

                <div className="bg-white border border-[#E5E5E7] rounded-2xl p-4 shadow-2xs max-w-md">
                  {activeTemplate?.header_text && (
                    <div className="font-semibold text-xs text-[#0D0D0E] mb-1">
                      {activeTemplate.header_text}
                    </div>
                  )}
                  <p className="text-xs text-[#0D0D0E] leading-relaxed whitespace-pre-wrap font-medium">
                    {previewBody}
                  </p>
                  {activeTemplate?.footer_text && (
                    <div className="text-[11px] text-[#8E8E93] mt-1 font-medium">
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
              <div className="p-4 rounded-2xl bg-[#121214] text-white border border-[#1F1F23] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm text-white block">
                      Meta Cloud API Cost Estimate
                    </span>
                    <span className="text-[11px] text-[#8E8E93] font-medium">
                      Based on {pricing.pricingDate} official rate card
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-semibold tabular-nums text-[#FF7A1A] block">
                      ₹{pricing.estimatedTotalCostINR}
                    </span>
                    <span className="text-[11px] text-[#8E8E93] tabular-nums font-medium">
                      ({pricing.eligibleRecipients} msgs @ ₹{pricing.unitCostINR}/msg)
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#8E8E93]">Monthly Budget Limit: ₹{pricing.monthlyBudgetLimitINR}</span>
                  <span className="text-emerald-400 font-semibold">
                    Within Safe Platform Budget
                  </span>
                </div>
              </div>

              {/* Schedule options */}
              <div className="p-3.5 rounded-2xl bg-[#F7F7F8] border border-[#E5E5E7] space-y-2">
                <label className="font-medium text-[#0D0D0E] block">
                  Delivery Timing:
                </label>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[#0D0D0E]">
                    <input
                      type="radio"
                      name="deliveryTime"
                      checked={!isScheduled}
                      onChange={() => setIsScheduled(false)}
                      className="accent-[#FF7A1A]"
                    />
                    <span>Send Immediately</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-[#0D0D0E]">
                    <input
                      type="radio"
                      name="deliveryTime"
                      checked={isScheduled}
                      onChange={() => setIsScheduled(true)}
                      className="accent-[#FF7A1A]"
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
                      className="text-xs h-10 bg-white border-[#E5E5E7] focus:border-[#FF7A1A]"
                    />
                  </div>
                )}
              </div>

              {/* Test mode toggle */}
              <label className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-[#F7F7F8] border border-[#E5E5E7] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTestMode}
                  onChange={(e) => setIsTestMode(e.target.checked)}
                  className="accent-[#FF7A1A]"
                />
                <div>
                  <span className="font-semibold text-[#0D0D0E] block">
                    Launch in Safety Test Mode
                  </span>
                  <span className="text-[11px] text-[#8E8E93] font-medium">
                    Tags campaign as test-run and clearly labels delivery as simulated.
                  </span>
                </div>
              </label>

              {/* Explicit Confirmation Checkbox */}
              <label className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#FFF4EC] border border-[#FF7A1A]/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmUnderstood}
                  onChange={(e) => setConfirmUnderstood(e.target.checked)}
                  className="mt-0.5 accent-[#FF7A1A]"
                />
                <span className="text-xs text-[#0D0D0E] font-medium leading-relaxed">
                  I confirm that all targeted recipients have granted compliant consent, that opt-out keywords (STOP) are supported, and that I approve the estimated Meta Cloud API messaging spend of ₹{pricing.estimatedTotalCostINR}.
                </span>
              </label>
            </div>
          )}

          {/* Modal Footer Controls */}
          <DialogFooter className="border-t border-[#E5E5E7] pt-3">
            {wizardStep > 1 && (
              <Button
                variant="ghost"
                onClick={() => setWizardStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)}
                className="font-semibold rounded-xl text-xs text-[#0D0D0E] hover:bg-[#F7F7F8]"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}

            {wizardStep < 4 ? (
              <Button
                onClick={() => setWizardStep((prev) => (prev + 1) as 1 | 2 | 3 | 4)}
                disabled={wizardStep === 1 && (!campName.trim() || !activeTemplate)}
                className="bg-[#FF7A1A] hover:bg-[#FF8833] text-white font-semibold rounded-xl text-xs shadow-2xs"
              >
                Continue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleLaunchCampaign}
                disabled={!confirmUnderstood}
                className="bg-[#FF7A1A] hover:bg-[#FF8833] text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs"
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
