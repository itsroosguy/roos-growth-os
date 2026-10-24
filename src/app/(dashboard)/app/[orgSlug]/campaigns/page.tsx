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
import { formatDate, formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  const metrics = useMemo(() => {
    const all = campaignStore.getCampaigns(orgSlug);
    const totalSent = all.reduce((sum, c) => sum + c.sent_count, 0);
    const totalDelivered = all.reduce((sum, c) => sum + c.delivered_count, 0);
    const totalSpent = all.reduce((sum, c) => sum + c.actual_cost, 0);
    const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 100;

    return {
      totalCampaigns: all.length,
      totalSent,
      deliveryRate: `${deliveryRate}%`,
      totalSpent: `₹${totalSpent.toFixed(2)}`,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E5E5E7]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0D0D0E]">
              WhatsApp Campaigns &amp; Broadcasts
            </h1>
            <span className="rounded-full bg-[#FFF4EC] border border-[#FF7900]/30 text-xs font-bold px-3 py-0.5 text-[#FF7900] shadow-2xs font-mono">
              Controlled Delivery
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8E8E93] font-medium mt-1">
            Execute permission-based marketing and utility WhatsApp campaigns with automated opt-out suppression and real-time Meta conversation pricing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href={`/app/${orgSlug}/templates`}>
            <Button size="sm" variant="outline" className="rounded-xl border-[#E5E5E7] bg-white hover:bg-[#F7F7F8] text-[#0D0D0E] font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer">
              <FileText className="h-3.5 w-3.5 text-[#8E8E93]" />
              <span>Manage Templates</span>
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={handleOpenWizard}
            className="rounded-xl text-xs bg-[#FF7900] hover:bg-[#E66D00] text-white font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Create Campaign</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
        <div className="rounded-2xl border border-[#E5E5E7] shadow-xs bg-white p-5 flex flex-col justify-between space-y-3">
          <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider block">Total Campaigns</span>
          <div>
            <span
              className="text-3xl sm:text-4xl font-black font-mono text-[#0D0D0E] tracking-tight block"
              suppressHydrationWarning
            >
              {metrics.totalCampaigns}
            </span>
            <span className="text-xs font-semibold text-[#8E8E93] mt-1 block">Marketing &amp; Utility</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E5E7] shadow-xs bg-white p-5 flex flex-col justify-between space-y-3">
          <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider block">Dispatched</span>
          <div>
            <span
              className="text-3xl sm:text-4xl font-black font-mono text-emerald-600 tracking-tight block"
              suppressHydrationWarning
            >
              {metrics.totalSent}
            </span>
            <span className="text-xs font-bold text-emerald-700 mt-1 block">Meta Cloud API</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E5E7] shadow-xs bg-white p-5 flex flex-col justify-between space-y-3">
          <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider block">Delivery Rate</span>
          <div>
            <span
              className="text-3xl sm:text-4xl font-black font-mono text-[#0D0D0E] tracking-tight block"
              suppressHydrationWarning
            >
              {metrics.deliveryRate}
            </span>
            <span className="text-xs font-semibold text-[#8E8E93] mt-1 block">Network delivery</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E5E7] shadow-xs bg-white p-5 flex flex-col justify-between space-y-3">
          <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider block">Total Spend</span>
          <div>
            <span
              className="text-3xl sm:text-4xl font-black font-mono text-[#FF7900] tracking-tight block"
              suppressHydrationWarning
            >
              {metrics.totalSpent}
            </span>
            <span className="text-xs font-semibold text-[#8E8E93] mt-1 block">
              Monthly limit: ₹10,000
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3.5 rounded-2xl border border-[#E5E5E7] bg-white shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campaigns..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] text-[#0D0D0E] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#FF7900] focus:bg-white shadow-xs transition-all"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as CampaignStatus | "all")}
          className="rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] px-4 py-2 text-xs sm:text-sm font-bold text-[#0D0D0E] focus:outline-none focus:border-[#FF7900] focus:bg-white shadow-2xs cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="scheduled">Scheduled</option>
          <option value="processing">Sending</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Campaigns Table */}
      <div className="rounded-2xl border border-[#E5E5E7] bg-white overflow-hidden shadow-2xs">
        <Table>
          <TableHeader className="bg-[#F7F7F8]">
            <TableRow className="border-b border-[#E5E5E7]">
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] py-3.5">Campaign Name</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] py-3.5">Template &amp; Type</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] py-3.5">Status</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] py-3.5">Audience / Progress</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] py-3.5">Cost</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] py-3.5">Created</TableHead>
              <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] py-3.5">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-sm text-[#8E8E93] font-medium">
                  No campaigns found. Click &quot;Create Campaign&quot; to launch your first controlled broadcast.
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
                  <TableRow key={camp.id} className="border-b border-[#E5E5E7] hover:bg-[#F7F7F8]/80 transition-colors">
                    <TableCell>
                      <div className="py-1">
                        <span className="font-bold text-sm text-[#0D0D0E] block">
                          {camp.name}
                        </span>
                        <span className="text-xs text-[#8E8E93] font-medium">
                          By {camp.created_by_name}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <span className="font-mono text-xs font-bold text-[#0D0D0E] block">
                          {camp.template_name}
                        </span>
                        <Badge variant="neutral" className="text-[10px] uppercase font-bold px-2 py-0.5 mt-0.5">
                          {camp.template_category}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={statusCfg.badgeVariant} className="text-[11px] uppercase font-bold px-2.5 py-0.5">
                        {statusCfg.label}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="w-44 space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-[#0D0D0E]">
                          <span className="font-mono text-[11px] text-[#8E8E93]">{camp.sent_count} / {camp.total_recipients} sent</span>
                          <span className="font-mono font-bold text-[#0D0D0E]">{progressPercent}%</span>
                        </div>
                        <div className="h-2 w-full bg-[#E5E5E7] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#FF7900] transition-all rounded-full"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm font-black font-mono text-[#0D0D0E]">
                        ₹{camp.actual_cost > 0 ? camp.actual_cost.toFixed(2) : camp.estimated_cost.toFixed(2)}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs font-semibold text-[#8E8E93]">
                        {formatDate(camp.created_at)}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Control buttons */}
                        {camp.status === "processing" && (
                          <button
                            onClick={() => handlePause(camp.id)}
                            className="p-1.5 rounded-xl text-amber-700 hover:bg-amber-50 cursor-pointer"
                            title="Pause sending"
                          >
                            <PauseCircle className="h-4 w-4" />
                          </button>
                        )}
                        {camp.status === "paused" && (
                          <button
                            onClick={() => handleResume(camp.id)}
                            className="p-1.5 rounded-xl text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                            title="Resume sending"
                          >
                            <PlayCircle className="h-4 w-4" />
                          </button>
                        )}
                        {(camp.status === "scheduled" || camp.status === "paused") && (
                          <button
                            onClick={() => handleCancel(camp.id)}
                            className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Cancel campaign"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}

                        <Link href={`/app/${orgSlug}/campaigns/${camp.id}`}>
                          <Button size="sm" variant="ghost" className="h-7 text-xs font-bold text-[#0D0D0E] hover:text-[#FF7900] hover:bg-[#FFF4EC]">
                            <Eye className="h-3.5 w-3.5 mr-1 text-[#8E8E93]" /> Report
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
                <DialogTitle className="text-lg font-black text-[#0D0D0E]">Create Controlled WhatsApp Campaign</DialogTitle>
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
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black font-mono transition-all ${
                      wizardStep === step
                        ? "bg-[#FF7900] text-white shadow-xs"
                        : wizardStep > step
                        ? "bg-[#24180E] text-[#FF7900]"
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
                <label className="block font-bold text-[#0D0D0E] mb-1">
                  Campaign Name *
                </label>
                <Input
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  placeholder="e.g. Q4 Retail Software Upgrade Announcement"
                  className="text-xs h-10 font-medium rounded-xl border-[#E5E5E7] focus:border-[#FF7900]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0D0D0E] mb-1">
                  Select Approved WhatsApp Template *
                </label>
                {approvedTemplates.length === 0 ? (
                  <div className="p-3.5 rounded-2xl bg-[#FFF4EC] text-[#0D0D0E] border border-[#FF7900]/30 space-y-1">
                    <p className="font-bold text-[#FF7900]">No APPROVED templates found in your workspace.</p>
                    <p className="text-xs font-medium text-[#8E8E93]">
                      Meta Cloud API requires approved templates for outbound messaging. Go to the{" "}
                      <Link href={`/app/${orgSlug}/templates`} className="underline font-bold text-[#FF7900]">
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
                      className="w-full rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] px-3 py-2.5 text-xs font-bold text-[#0D0D0E] focus:outline-none focus:border-[#FF7900]"
                    >
                      {approvedTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.category.toUpperCase()} • {t.language})
                        </option>
                      ))}
                    </select>

                    {activeTemplate && (
                      <div className="p-3.5 rounded-2xl bg-[#F7F7F8] border border-[#E5E5E7]">
                        <span className="text-[11px] text-[#8E8E93] font-mono font-bold block mb-1">
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
                <label className="block font-bold text-[#0D0D0E] mb-1">
                  Saved Audience Segment
                </label>
                <select
                  value={selectedSegmentId}
                  onChange={(e) => setSelectedSegmentId(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] px-3 py-2.5 text-xs font-bold text-[#0D0D0E] focus:outline-none focus:border-[#FF7900]"
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
                    <label className="block font-bold text-[#0D0D0E] mb-1">
                      Filter by Tag
                    </label>
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val && !filterTags.includes(val)) setFilterTags([...filterTags, val]);
                      }}
                      className="w-full rounded-xl border border-[#E5E5E7] bg-white px-2.5 py-2 text-xs font-medium text-[#0D0D0E] focus:border-[#FF7900]"
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
                          <Badge key={t} variant="neutral" className="text-[10px] font-bold pr-1">
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
                    <label className="block font-bold text-[#0D0D0E] mb-1">
                      Filter by Source
                    </label>
                    <Input
                      value={filterSource}
                      onChange={(e) => setFilterSource(e.target.value)}
                      placeholder="e.g. WhatsApp Inbound"
                      className="text-xs h-9 bg-white border-[#E5E5E7] focus:border-[#FF7900]"
                    />
                  </div>
                </div>
              )}

              {/* Dynamic Recipient & Compliance Breakdown Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#E5E5E7] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0D0D0E]">Real-Time Audience Audit:</span>
                  <Badge variant="orangeSubtle" className="text-xs font-bold font-mono">
                    {effectiveRecipientCount} Eligible Recipients
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-[#F7F7F8] border border-[#E5E5E7]">
                    <span className="text-[#8E8E93] block font-medium text-[11px]">Total CRM Matched</span>
                    <span className="font-black font-mono text-base text-[#0D0D0E]">
                      {audienceResult.totalMatched}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                    <span className="block font-medium text-[11px]">Opted-Out</span>
                    <span className="font-black font-mono text-base">
                      {audienceResult.suppressedOptOutCount}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                    <span className="block font-medium text-[11px]">Missing Opt-In</span>
                    <span className="font-black font-mono text-base">
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
                <label className="block font-bold text-[#0D0D0E] mb-1">
                  Recipient Limit Capping (Optional safety control)
                </label>
                <Input
                  type="number"
                  value={recipientLimit || ""}
                  onChange={(e) => setRecipientLimit(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g. 50 (Leave empty to message all eligible)"
                  className="text-xs h-10 font-mono border-[#E5E5E7] focus:border-[#FF7900]"
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
                  <label className="font-bold text-[#0D0D0E] block">
                    Map Template Variables to CRM Contact Fields:
                  </label>

                  {activeTemplate.variables.map((v) => (
                    <div key={v} className="flex items-center gap-3 p-3 rounded-xl bg-[#F7F7F8] border border-[#E5E5E7]">
                      <span className="font-mono font-bold text-[#FF7900] shrink-0 w-16">
                        {"{{" + v + "}}"}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-[#8E8E93] shrink-0" />
                      <select
                        value={variableMappings[v] || "first_name"}
                        onChange={(e) =>
                          setVariableMappings({ ...variableMappings, [v]: e.target.value })
                        }
                        className="flex-1 rounded-xl border border-[#E5E5E7] bg-white px-2.5 py-2 text-xs font-bold text-[#0D0D0E] focus:outline-none focus:border-[#FF7900]"
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
                <div className="flex items-center justify-between text-[11px] text-[#8E8E93] font-bold uppercase">
                  <span>Representative Preview for:</span>
                  <span className="text-[#0D0D0E] font-bold font-mono">
                    {sampleRecipient ? `${sampleRecipient.first_name} (${sampleRecipient.phone})` : "Sample Customer"}
                  </span>
                </div>

                <div className="bg-white border border-[#E5E5E7] rounded-2xl p-4 shadow-2xs max-w-md">
                  {activeTemplate?.header_text && (
                    <div className="font-bold text-xs text-[#0D0D0E] mb-1">
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
                    <span className="font-bold text-sm text-white block">
                      Meta Cloud API Cost Estimate
                    </span>
                    <span className="text-[11px] text-[#8E8E93] font-medium">
                      Based on {pricing.pricingDate} official rate card
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black font-mono text-[#FF7900] block">
                      ₹{pricing.estimatedTotalCostINR}
                    </span>
                    <span className="text-[11px] text-[#8E8E93] font-mono font-medium">
                      ({pricing.eligibleRecipients} msgs @ ₹{pricing.unitCostINR}/msg)
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#8E8E93]">Monthly Budget Limit: ₹{pricing.monthlyBudgetLimitINR}</span>
                  <span className="text-emerald-400 font-bold">
                    Within Safe Platform Budget
                  </span>
                </div>
              </div>

              {/* Schedule options */}
              <div className="p-3.5 rounded-2xl bg-[#F7F7F8] border border-[#E5E5E7] space-y-2">
                <label className="font-bold text-[#0D0D0E] block">
                  Delivery Timing:
                </label>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[#0D0D0E]">
                    <input
                      type="radio"
                      name="deliveryTime"
                      checked={!isScheduled}
                      onChange={() => setIsScheduled(false)}
                      className="accent-[#FF7900]"
                    />
                    <span>Send Immediately</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-[#0D0D0E]">
                    <input
                      type="radio"
                      name="deliveryTime"
                      checked={isScheduled}
                      onChange={() => setIsScheduled(true)}
                      className="accent-[#FF7900]"
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
                      className="text-xs h-10 bg-white border-[#E5E5E7] focus:border-[#FF7900]"
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
                  className="accent-[#FF7900]"
                />
                <div>
                  <span className="font-bold text-[#0D0D0E] block">
                    Launch in Safety Test Mode
                  </span>
                  <span className="text-[11px] text-[#8E8E93] font-medium">
                    Tags campaign as test-run and clearly labels delivery as simulated.
                  </span>
                </div>
              </label>

              {/* Explicit Confirmation Checkbox */}
              <label className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#FFF4EC] border border-[#FF7900]/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmUnderstood}
                  onChange={(e) => setConfirmUnderstood(e.target.checked)}
                  className="mt-0.5 accent-[#FF7900]"
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
                className="font-bold rounded-xl text-xs text-[#0D0D0E] hover:bg-[#F7F7F8]"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}

            {wizardStep < 4 ? (
              <Button
                onClick={() => setWizardStep((prev) => (prev + 1) as 1 | 2 | 3 | 4)}
                disabled={wizardStep === 1 && (!campName.trim() || !activeTemplate)}
                className="bg-[#FF7900] hover:bg-[#E66D00] text-white font-bold rounded-xl text-xs shadow-2xs"
              >
                Continue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleLaunchCampaign}
                disabled={!confirmUnderstood}
                className="bg-[#FF7900] hover:bg-[#E66D00] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs"
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
