"use client";

import React, { useState, useMemo } from "react";
import { useTenant } from "@/lib/organizations/tenant-context";
import { templateStore } from "@/lib/campaigns/template-store";
import {
  WhatsAppTemplateRecord,
  TemplateCategory,
  TemplateStatus,
} from "@/lib/campaigns/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Sparkles,
  Smartphone,
  Eye,
  Info,
  HelpCircle,
  ShieldCheck,
  Send,
  Layers,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const CATEGORY_CONFIG: Record<
  TemplateCategory,
  { label: string; cost: string; color: string }
> = {
  marketing: { label: "Marketing", cost: "₹0.82 / conv", color: "bg-[#FFF4EC] text-[#FF7900] border-[#FF7900]/30" },
  utility: { label: "Utility", cost: "₹0.35 / conv", color: "bg-amber-50 text-amber-700 border-amber-200" },
  authentication: { label: "Authentication", cost: "₹0.12 / conv", color: "bg-purple-50 text-purple-700 border-purple-200" },
};

export default function TemplatesPage() {
  const { currentOrg, isAdmin } = useTenant();
  const orgSlug = currentOrg.slug;

  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<TemplateStatus | "all">("all");

  // Create Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [categoryInput, setCategoryInput] = useState<TemplateCategory>("marketing");
  const [bodyInput, setBodyInput] = useState("");
  const [headerInput, setHeaderInput] = useState("");
  const [footerInput, setFooterInput] = useState("");
  const [sampleValuesInput, setSampleValuesInput] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [createSuccessMsg, setCreateSuccessMsg] = useState<string | null>(null);

  // Detail Modal state
  const [inspectTemplate, setInspectTemplate] = useState<WhatsAppTemplateRecord | null>(null);

  // Fetch all templates for stats
  const allTemplates = useMemo(() => {
    return templateStore.getTemplates(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  const approvedCount = useMemo(() => allTemplates.filter((t) => t.status === "APPROVED").length, [allTemplates]);
  const pendingCount = useMemo(() => allTemplates.filter((t) => t.status === "PENDING").length, [allTemplates]);
  const rejectedCount = useMemo(() => allTemplates.filter((t) => t.status === "REJECTED").length, [allTemplates]);

  // Fetch filtered templates
  const templates = useMemo(() => {
    let list = allTemplates;

    if (categoryFilter !== "all") {
      list = list.filter((t) => t.category === categoryFilter);
    }
    if (statusFilter !== "all") {
      list = list.filter((t) => t.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.body_content.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allTemplates, categoryFilter, statusFilter, searchQuery]);

  // Live variable extraction from bodyInput
  const liveVariables = useMemo(() => {
    const variableRegex = /\{\{(\d+)\}\}/g;
    const extracted: string[] = [];
    let match;
    while ((match = variableRegex.exec(bodyInput)) !== null) {
      extracted.push(match[1]);
    }
    return Array.from(new Set(extracted)).sort((a, b) => parseInt(a) - parseInt(b));
  }, [bodyInput]);

  // Rendered Live Preview
  const livePreviewText = useMemo(() => {
    let rendered = bodyInput;
    liveVariables.forEach((v) => {
      const val = sampleValuesInput[v] || `[Sample {{${v}}}]`;
      rendered = rendered.replace(new RegExp(`\\{\\{${v}\\}\\}`, "g"), val);
    });
    return rendered;
  }, [bodyInput, liveVariables, sampleValuesInput]);

  // Handlers
  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
    setCreateSuccessMsg(null);

    const result = templateStore.createTemplateDraft(orgSlug, {
      name: nameInput.trim(),
      category: categoryInput,
      body_content: bodyInput.trim(),
      header_text: headerInput.trim() || undefined,
      footer_text: footerInput.trim() || undefined,
      sample_values: sampleValuesInput,
    });

    if (!result.success) {
      setValidationErrors(result.errors || ["Failed to create template draft."]);
      return;
    }

    setCreateSuccessMsg(
      "Template draft submitted for Meta review. In Mock Mode, you can use the simulator below to approve it for campaigns."
    );
    setNameInput("");
    setBodyInput("");
    setHeaderInput("");
    setFooterInput("");
    setSampleValuesInput({});
    setRefreshKey((k) => k + 1);
  };

  const handleSimulateApproval = (templateId: string) => {
    templateStore.simulateMetaApproval(orgSlug, templateId);
    setRefreshKey((k) => k + 1);
    if (inspectTemplate?.id === templateId) {
      setInspectTemplate(templateStore.getTemplateById(orgSlug, templateId));
    }
  };

  const handleSimulateRejection = (templateId: string) => {
    const reason =
      "Meta Policy Rejection: Promotional language requires explicit consent opt-out instructions and balanced text formatting.";
    templateStore.simulateMetaRejection(orgSlug, templateId, reason);
    setRefreshKey((k) => k + 1);
    if (inspectTemplate?.id === templateId) {
      setInspectTemplate(templateStore.getTemplateById(orgSlug, templateId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E5E7]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0D0D0E]">
              Message Templates
            </h1>
            <span className="rounded-full bg-[#FFF4EC] border border-[#FF7900]/30 font-mono text-[11px] font-bold px-2.5 py-0.5 text-[#FF7900]">
              Meta Cloud API
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8E8E93] font-medium mt-1">
            Pre-approved WhatsApp templates for broadcasts, marketing campaigns, and outbound triggers outside 24h window.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href={`/app/${orgSlug}/campaigns`}>
            <Button size="sm" variant="outline" className="rounded-xl border-[#E5E5E7] bg-white hover:bg-[#F7F7F8] text-[#0D0D0E] text-xs flex items-center gap-1.5 shadow-2xs font-bold">
              <Send className="h-3.5 w-3.5 text-[#FF7900]" />
              <span>Go to Campaigns</span>
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={() => {
              setValidationErrors([]);
              setCreateSuccessMsg(null);
              setCreateModalOpen(true);
            }}
            className="rounded-xl text-xs bg-[#FF7900] hover:bg-[#E66D00] text-white flex items-center gap-1.5 shadow-2xs font-bold cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>New Template</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E5E7] p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">Total Templates</span>
            <div className="text-2xl font-black font-mono text-[#0D0D0E] mt-1">{allTemplates.length}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#F7F7F8] border border-[#E5E5E7] flex items-center justify-center text-[#0D0D0E]">
            <FileText className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E5E7] p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Approved</span>
            <div className="text-2xl font-black font-mono text-emerald-600 mt-1">{approvedCount}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E5E7] p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Under Review</span>
            <div className="text-2xl font-black font-mono text-amber-600 mt-1">{pendingCount}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E5E7] p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">Rejected</span>
            <div className="text-2xl font-black font-mono text-rose-600 mt-1">{rejectedCount}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
            <XCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Meta Guidelines Callout */}
      <div className="bg-white rounded-2xl border border-[#E5E5E7] p-4 text-xs text-[#0D0D0E] shadow-2xs flex items-start gap-3">
        <div className="p-2 rounded-xl bg-[#FFF4EC] border border-[#FF7900]/30 text-[#FF7900] shrink-0">
          <Info className="h-4.5 w-4.5" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-[#0D0D0E] text-xs sm:text-sm">
            Official Meta WhatsApp Platform Template Policies
          </p>
          <p className="text-xs leading-relaxed text-[#8E8E93] font-medium">
            • <strong className="text-[#0D0D0E]">Pre-Approval Mandatory:</strong> Only templates with <strong className="text-emerald-700">APPROVED</strong> status can be dispatched.
            • <strong className="text-[#0D0D0E]">Variables:</strong> Must be sequentially numbered as <code className="font-mono bg-[#F7F7F8] px-1.5 py-0.5 rounded border border-[#E5E5E7] text-[#FF7900] font-bold">{"{{1}}"}</code>, <code className="font-mono bg-[#F7F7F8] px-1.5 py-0.5 rounded border border-[#E5E5E7] text-[#FF7900] font-bold">{"{{2}}"}</code>.
            • <strong className="text-[#0D0D0E]">Marketing Opt-out:</strong> Marketing templates must provide explicit opt-out wording (e.g. <em>Reply STOP to opt out</em>).
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#E5E5E7] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] text-[#0D0D0E] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#FF7900] focus:bg-white transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as TemplateCategory | "all")}
            className="rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] px-3 py-2 text-xs font-bold text-[#0D0D0E] focus:outline-none focus:border-[#FF7900] focus:bg-white shadow-2xs cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="marketing">Marketing (₹0.82)</option>
            <option value="utility">Utility (₹0.35)</option>
            <option value="authentication">Authentication (₹0.12)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TemplateStatus | "all")}
            className="rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] px-3 py-2 text-xs font-bold text-[#0D0D0E] focus:outline-none focus:border-[#FF7900] focus:bg-white shadow-2xs cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending Review</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {templates.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-[#8E8E93] bg-white rounded-2xl border border-[#E5E5E7] shadow-2xs">
            <FileText className="h-8 w-8 mx-auto mb-2 text-[#8E8E93]/60" />
            <p className="font-bold text-[#0D0D0E] text-sm">No templates found</p>
            <p className="text-xs text-[#8E8E93] mt-1">Try adjusting your search query or filters.</p>
          </div>
        ) : (
          templates.map((tpl) => {
            const catCfg = CATEGORY_CONFIG[tpl.category] || CATEGORY_CONFIG.marketing;

            return (
              <div
                key={tpl.id}
                className="bg-white rounded-2xl border border-[#E5E5E7] p-5 shadow-2xs hover:shadow-md hover:border-[#FF7900]/50 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-black text-sm text-[#0D0D0E] font-mono tracking-tight">
                        {tpl.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-[#8E8E93] font-medium uppercase font-mono">
                          {tpl.language}
                        </span>
                        <span className="text-[#E5E5E7]">•</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catCfg.color}`}>
                          {catCfg.label} ({catCfg.cost})
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        tpl.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : tpl.status === "PENDING"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {tpl.status}
                    </span>
                  </div>

                  {/* Header text if present */}
                  {tpl.header_text && (
                    <div className="text-xs font-bold text-[#0D0D0E] mb-1.5 mt-2">
                      {tpl.header_text}
                    </div>
                  )}

                  {/* Body content preview in WhatsApp bubble styling */}
                  <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-[#E5E5E7] text-xs text-[#0D0D0E] leading-relaxed my-2 shadow-2xs">
                    <p className="whitespace-pre-wrap font-medium">{tpl.body_content}</p>
                    {tpl.footer_text && (
                      <p className="text-[11px] text-[#8E8E93] mt-2 pt-1.5 border-t border-[#E5E5E7]">
                        {tpl.footer_text}
                      </p>
                    )}
                  </div>

                  {/* Rejection reason callout if rejected */}
                  {tpl.status === "REJECTED" && tpl.rejection_reason && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] space-y-0.5 my-2">
                      <span className="font-bold block">Meta Rejection Feedback:</span>
                      <p>{tpl.rejection_reason}</p>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-[#E5E5E7] flex items-center justify-between mt-3 text-xs">
                  <span className="text-[11px] font-semibold text-[#8E8E93]">
                    {tpl.variables.length} variable{tpl.variables.length === 1 ? "" : "s"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Mock review simulation utility buttons */}
                    {tpl.status === "PENDING" && (
                      <button
                        onClick={() => handleSimulateApproval(tpl.id)}
                        className="text-[11px] text-emerald-700 font-bold hover:bg-emerald-100 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                        title="Simulate Meta approval"
                      >
                        Approve (Mock)
                      </button>
                    )}
                    {tpl.status === "PENDING" && (
                      <button
                        onClick={() => handleSimulateRejection(tpl.id)}
                        className="text-[11px] text-rose-700 font-bold hover:bg-rose-100 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                        title="Simulate Meta rejection"
                      >
                        Reject (Mock)
                      </button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setInspectTemplate(tpl)}
                      className="h-7 text-xs text-[#0D0D0E] hover:text-[#FF7900] hover:bg-[#FFF4EC] rounded-xl font-bold"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1 text-[#8E8E93]" /> Inspect
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: New Template Submission Draft */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <form onSubmit={handleCreateTemplate} className="max-w-xl bg-white rounded-2xl p-2">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-[#0D0D0E]">Create WhatsApp Message Template</DialogTitle>
            <DialogDescription className="text-xs text-[#8E8E93] font-medium mt-0.5">
              Define your template draft with Meta category, variables, and sample values.
            </DialogDescription>
          </DialogHeader>

          {createSuccessMsg ? (
            <div className="my-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Template Submitted Successfully!
              </div>
              <p>{createSuccessMsg}</p>
              <Button
                size="sm"
                onClick={() => {
                  setCreateSuccessMsg(null);
                  setCreateModalOpen(false);
                }}
                className="bg-[#0D0D0E] hover:bg-[#1C1C1F] text-white font-bold rounded-xl text-xs"
              >
                Close &amp; View Templates
              </Button>
            </div>
          ) : (
            <div className="space-y-4 my-4 text-xs">
              {validationErrors.length > 0 && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                  <div className="font-bold">Meta Policy Validation Failed:</div>
                  {validationErrors.map((err, i) => (
                    <div key={i} className="text-[11px]">• {err}</div>
                  ))}
                </div>
              )}

              {/* Template Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0D0D0E] mb-1">
                    Template Name (lowercase &amp; underscores) *
                  </label>
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                    placeholder="e.g. festival_discount_offer"
                    required
                    className="font-mono text-xs bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white focus:border-[#FF7900] rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0D0D0E] mb-1">
                    Meta Category *
                  </label>
                  <select
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value as TemplateCategory)}
                    className="w-full rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] px-3 py-2 text-xs text-[#0D0D0E] font-bold focus:outline-none focus:bg-white focus:border-[#FF7900]"
                  >
                    <option value="marketing">Marketing (₹0.82 / conv)</option>
                    <option value="utility">Utility (₹0.35 / conv)</option>
                    <option value="authentication">Authentication (₹0.12 / conv)</option>
                  </select>
                </div>
              </div>

              {/* Header Text (Optional) */}
              <div>
                <label className="block font-bold text-[#0D0D0E] mb-1">
                  Header Text (Optional)
                </label>
                <Input
                  value={headerInput}
                  onChange={(e) => setHeaderInput(e.target.value)}
                  placeholder="e.g. Special Offer For You"
                  className="text-xs bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white focus:border-[#FF7900] rounded-xl"
                />
              </div>

              {/* Body Content */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-[#0D0D0E]">
                    Body Content (use {"{{1}}"}, {"{{2}}"} for variables) *
                  </label>
                  <span className="text-[10px] text-[#8E8E93] font-mono">
                    {bodyInput.length}/1024 chars
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={bodyInput}
                  onChange={(e) => setBodyInput(e.target.value)}
                  placeholder="Hello {{1}}, we are excited to announce our new catalog. Reply STOP to opt out."
                  required
                  className="w-full rounded-2xl border border-[#E5E5E7] bg-[#F7F7F8] p-2.5 text-xs text-[#0D0D0E] focus:outline-none focus:border-[#FF7900] focus:bg-white resize-none font-medium"
                />
              </div>

              {/* Footer Text (Optional) */}
              <div>
                <label className="block font-bold text-[#0D0D0E] mb-1">
                  Footer Text (Optional)
                </label>
                <Input
                  value={footerInput}
                  onChange={(e) => setFooterInput(e.target.value)}
                  placeholder="e.g. Acme Technologies Support"
                  className="text-xs bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white focus:border-[#FF7900] rounded-xl"
                />
              </div>

              {/* Sample Values for Variables */}
              {liveVariables.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-[#F7F7F8] border border-[#E5E5E7] space-y-2">
                  <label className="font-bold text-[#0D0D0E] block text-xs">
                    Sample Values for Meta Review:
                  </label>
                  <p className="text-[11px] text-[#8E8E93]">
                    Meta requires representative sample values for every variable defined.
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {liveVariables.map((v) => (
                      <div key={v}>
                        <label className="text-[10px] font-mono text-[#8E8E93] block mb-0.5">
                          Value for {"{{" + v + "}}"}
                        </label>
                        <Input
                          value={sampleValuesInput[v] || ""}
                          onChange={(e) =>
                            setSampleValuesInput({ ...sampleValuesInput, [v]: e.target.value })
                          }
                          placeholder={`Sample value for {{${v}}}`}
                          className="text-xs h-8 bg-white border-[#E5E5E7] focus:border-[#FF7900] rounded-xl"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Preview Container */}
              {bodyInput.trim() && (
                <div className="p-3.5 rounded-2xl bg-[#F7F7F8] border border-[#E5E5E7] space-y-1.5">
                  <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider block">
                    Live WhatsApp Bubble Preview:
                  </span>
                  <div className="bg-[#DCF8C6] border border-emerald-300 rounded-2xl p-3.5 shadow-2xs max-w-sm text-[#0D0D0E]">
                    {headerInput && (
                      <div className="font-bold text-xs text-[#0D0D0E] mb-1">{headerInput}</div>
                    )}
                    <p className="text-xs text-[#0D0D0E] leading-relaxed whitespace-pre-wrap font-medium">
                      {livePreviewText}
                    </p>
                    {footerInput && (
                      <div className="text-[10px] text-[#8E8E93] mt-1">{footerInput}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {!createSuccessMsg && (
            <DialogFooter className="border-t border-[#E5E5E7] pt-3">
              <Button variant="ghost" onClick={() => setCreateModalOpen(false)} className="text-[#8E8E93] hover:text-[#0D0D0E] rounded-xl text-xs font-bold">
                Cancel
              </Button>
              <Button type="submit" disabled={!nameInput.trim() || !bodyInput.trim()} className="bg-[#FF7900] hover:bg-[#E66D00] text-white font-bold rounded-xl text-xs shadow-2xs cursor-pointer">
                Submit for Meta Review
              </Button>
            </DialogFooter>
          )}
        </form>
      </Dialog>

      {/* Modal: Inspect Template */}
      {inspectTemplate && (
        <Dialog open={Boolean(inspectTemplate)} onOpenChange={() => setInspectTemplate(null)}>
          <div className="max-w-lg bg-white rounded-2xl p-2">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="font-mono text-base font-black text-[#0D0D0E]">{inspectTemplate.name}</DialogTitle>
                  <DialogDescription className="text-xs text-[#8E8E93] font-medium mt-0.5">
                    Category: {inspectTemplate.category.toUpperCase()} • Language: {inspectTemplate.language}
                  </DialogDescription>
                </div>
                <Badge
                  variant={
                    inspectTemplate.status === "APPROVED"
                      ? "success"
                      : inspectTemplate.status === "PENDING"
                      ? "warning"
                      : "danger"
                  }
                  className="uppercase font-bold text-xs"
                >
                  {inspectTemplate.status}
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-4 my-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#F7F7F8] border border-[#E5E5E7]">
                <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider block mb-2">
                  Rendered Preview:
                </span>
                <div className="bg-[#DCF8C6] border border-emerald-300 rounded-2xl p-3.5 shadow-2xs max-w-sm text-[#0D0D0E]">
                  {inspectTemplate.header_text && (
                    <div className="font-bold text-xs text-[#0D0D0E] mb-1">
                      {inspectTemplate.header_text}
                    </div>
                  )}
                  <p className="text-xs text-[#0D0D0E] leading-relaxed whitespace-pre-wrap font-medium">
                    {templateStore.renderTemplateBody(inspectTemplate, inspectTemplate.sample_values)}
                  </p>
                  {inspectTemplate.footer_text && (
                    <div className="text-[10px] text-[#8E8E93] mt-1">
                      {inspectTemplate.footer_text}
                    </div>
                  )}
                </div>
              </div>

              {inspectTemplate.rejection_reason && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                  <span className="font-bold block">Meta Rejection Feedback:</span>
                  <p>{inspectTemplate.rejection_reason}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-[#F7F7F8] border border-[#E5E5E7] text-[11px]">
                <div>
                  <span className="text-[#8E8E93] block font-medium">Meta Template ID:</span>
                  <span className="font-mono font-bold text-[#0D0D0E]">
                    {inspectTemplate.meta_template_id || "Awaiting Approval"}
                  </span>
                </div>
                <div>
                  <span className="text-[#8E8E93] block font-medium">Created:</span>
                  <span className="font-semibold text-[#0D0D0E]">
                    {formatDate(inspectTemplate.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-[#E5E5E7] pt-3">
              <Button onClick={() => setInspectTemplate(null)} className="bg-[#0D0D0E] hover:bg-[#1C1C1F] text-white font-bold rounded-xl text-xs">Close</Button>
            </DialogFooter>
          </div>
        </Dialog>
      )}
    </div>
  );
}
