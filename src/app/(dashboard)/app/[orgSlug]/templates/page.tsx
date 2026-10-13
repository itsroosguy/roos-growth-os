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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import Link from "next/link";

const CATEGORY_CONFIG: Record<
  TemplateCategory,
  { label: string; badgeVariant: "default" | "warning" | "neutral"; cost: string }
> = {
  marketing: { label: "Marketing", badgeVariant: "default", cost: "₹0.82 / conv" },
  utility: { label: "Utility", badgeVariant: "warning", cost: "₹0.35 / conv" },
  authentication: { label: "Authentication", badgeVariant: "neutral", cost: "₹0.12 / conv" },
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

  // Fetch templates
  const templates = useMemo(() => {
    let list = templateStore.getTemplates(orgSlug);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, categoryFilter, statusFilter, searchQuery, refreshKey]);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-white/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              WhatsApp Message Templates
            </h1>
            <span className="glass-pill rounded-full bg-white/80 border border-white font-mono text-[10px] px-2.5 py-0.5 text-slate-700 shadow-xs">
              Meta Cloud API
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
            Create, validate and manage pre-approved WhatsApp templates required for outbound campaigns and notifications outside the 24h customer window.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href={`/app/${orgSlug}/campaigns`}>
            <Button size="sm" variant="secondary" className="rounded-xl border-white/80 bg-white/80 hover:bg-white text-slate-700 text-xs flex items-center gap-1.5 shadow-xs">
              <Send className="h-3.5 w-3.5 text-emerald-600" />
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
            className="rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>New Template Draft</span>
          </Button>
        </div>
      </div>

      {/* Meta Guidelines Callout */}
      <div className="glass-panel rounded-2xl bg-white/70 border border-white/80 p-4 text-xs text-slate-600 shadow-glass flex items-start gap-3">
        <Info className="h-4.5 w-4.5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-900">
            Official Meta WhatsApp Platform Template Policies:
          </p>
          <p className="text-[11px] leading-relaxed text-slate-600">
            • <strong>Pre-Approval Mandatory:</strong> Only templates with <strong>APPROVED</strong> status can be dispatched to customers.
            • <strong>Variables:</strong> Variables must be formatted as <code className="font-mono bg-white px-1.5 py-0.5 rounded-md border border-white/80 text-blue-700 shadow-2xs">{"{{1}}"}</code>, <code className="font-mono bg-white px-1.5 py-0.5 rounded-md border border-white/80 text-blue-700 shadow-2xs">{"{{2}}"}</code> sequentially.
            • <strong>Marketing Opt-out:</strong> Marketing templates must provide a clear opt-out command (e.g. <em>Reply STOP to opt out</em>).
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel p-3.5 rounded-2xl border border-white/70 bg-white/75 backdrop-blur-xl shadow-glass flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-white/80 bg-white/70 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500/80 focus:bg-white backdrop-blur-sm shadow-xs transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as TemplateCategory | "all")}
            className="rounded-xl border border-white/80 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 backdrop-blur-xs focus:outline-none focus:bg-white shadow-2xs cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="marketing">Marketing (₹0.82)</option>
            <option value="utility">Utility (₹0.35)</option>
            <option value="authentication">Authentication (₹0.12)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TemplateStatus | "all")}
            className="rounded-xl border border-white/80 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 backdrop-blur-xs focus:outline-none focus:bg-white shadow-2xs cursor-pointer"
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
          <div className="col-span-full p-12 text-center text-xs text-slate-500 glass-panel rounded-3xl border border-white/70 bg-white/75 backdrop-blur-xl shadow-glass">
            <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-800">No templates found</p>
            <p className="text-[11px] mt-1">Try adjusting your category or status filters.</p>
          </div>
        ) : (
          templates.map((tpl) => {
            const catCfg = CATEGORY_CONFIG[tpl.category] || CATEGORY_CONFIG.marketing;

            return (
              <div
                key={tpl.id}
                className="glass-card rounded-[22px] border border-white/75 bg-white/80 backdrop-blur-xl p-5 shadow-glass hover:bg-white/95 hover:shadow-glass hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-xs text-slate-900 font-mono tracking-tight">
                        {tpl.name}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {tpl.language.toUpperCase()} • {catCfg.cost}
                      </span>
                    </div>

                    <Badge
                      variant={
                        tpl.status === "APPROVED"
                          ? "success"
                          : tpl.status === "PENDING"
                          ? "warning"
                          : "danger"
                      }
                      className="text-[9px] font-bold uppercase px-2 py-0.5 shadow-2xs"
                    >
                      {tpl.status}
                    </Badge>
                  </div>

                  {/* Header text if present */}
                  {tpl.header_text && (
                    <div className="text-[11px] font-bold text-slate-800 mb-1">
                      {tpl.header_text}
                    </div>
                  )}

                  {/* Body content preview in WhatsApp bubble styling */}
                  <div className="p-3.5 rounded-2xl bg-[#E7F8E8]/75 border border-emerald-500/20 text-xs text-slate-800 leading-relaxed my-2 shadow-2xs">
                    <p className="whitespace-pre-wrap">{tpl.body_content}</p>
                    {tpl.footer_text && (
                      <p className="text-[10px] text-slate-500 mt-1.5 pt-1.5 border-t border-emerald-500/15">
                        {tpl.footer_text}
                      </p>
                    )}
                  </div>

                  {/* Rejection reason callout if rejected */}
                  {tpl.status === "REJECTED" && tpl.rejection_reason && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200/60 text-rose-700 text-[10px] space-y-0.5 my-2">
                      <span className="font-semibold block">Meta Rejection Reason:</span>
                      <p>{tpl.rejection_reason}</p>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-3 text-xs">
                  <span className="text-[10px] font-medium text-slate-500">
                    {tpl.variables.length} variable{tpl.variables.length === 1 ? "" : "s"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Mock review simulation utility buttons */}
                    {tpl.status === "PENDING" && (
                      <button
                        onClick={() => handleSimulateApproval(tpl.id)}
                        className="text-[10px] text-emerald-700 font-semibold hover:underline bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 transition-colors"
                        title="Simulate Meta approval"
                      >
                        Approve (Mock)
                      </button>
                    )}
                    {tpl.status === "PENDING" && (
                      <button
                        onClick={() => handleSimulateRejection(tpl.id)}
                        className="text-[10px] text-rose-700 font-semibold hover:underline bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/60 transition-colors"
                        title="Simulate Meta rejection"
                      >
                        Reject (Mock)
                      </button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setInspectTemplate(tpl)}
                      className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-white/80 rounded-lg"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" /> Inspect
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
        <form onSubmit={handleCreateTemplate} className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create WhatsApp Message Template</DialogTitle>
            <DialogDescription>
              Define your template draft with Meta category, variables, and sample values.
            </DialogDescription>
          </DialogHeader>

          {createSuccessMsg ? (
            <div className="my-6 p-4 rounded-2xl bg-google-green-subtle/50 border border-google-green/30 text-xs text-google-green space-y-3">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <CheckCircle2 className="h-5 w-5" />
                Template Submitted Successfully!
              </div>
              <p>{createSuccessMsg}</p>
              <Button
                size="sm"
                onClick={() => {
                  setCreateSuccessMsg(null);
                  setCreateModalOpen(false);
                }}
              >
                Close & View Templates
              </Button>
            </div>
          ) : (
            <div className="space-y-4 my-4 text-xs">
              {validationErrors.length > 0 && (
                <div className="p-3 rounded-2xl bg-google-red-subtle border border-google-red/20 text-google-red space-y-1">
                  <div className="font-semibold">Meta Policy Validation Failed:</div>
                  {validationErrors.map((err, i) => (
                    <div key={i} className="text-[11px]">• {err}</div>
                  ))}
                </div>
              )}

              {/* Template Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-foreground-secondary mb-1">
                    Template Name (lowercase & underscores) *
                  </label>
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                    placeholder="e.g. festival_discount_offer"
                    required
                    className="font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-foreground-secondary mb-1">
                    Meta Category *
                  </label>
                  <select
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value as TemplateCategory)}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-foreground focus:outline-none"
                  >
                    <option value="marketing">Marketing (₹0.82 / conv)</option>
                    <option value="utility">Utility (₹0.35 / conv)</option>
                    <option value="authentication">Authentication (₹0.12 / conv)</option>
                  </select>
                </div>
              </div>

              {/* Header Text (Optional) */}
              <div>
                <label className="block font-medium text-foreground-secondary mb-1">
                  Header Text (Optional)
                </label>
                <Input
                  value={headerInput}
                  onChange={(e) => setHeaderInput(e.target.value)}
                  placeholder="e.g. Special Offer For You"
                  className="text-xs"
                />
              </div>

              {/* Body Content */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-foreground-secondary">
                    Body Content (use {"{{1}}"}, {"{{2}}"} for variables) *
                  </label>
                  <span className="text-[10px] text-foreground-secondary">
                    {bodyInput.length}/1024 chars
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={bodyInput}
                  onChange={(e) => setBodyInput(e.target.value)}
                  placeholder="Hello {{1}}, we are excited to announce our new catalog. Reply STOP to opt out."
                  required
                  className="w-full rounded-2xl border border-border p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-google-blue resize-none"
                />
              </div>

              {/* Footer Text (Optional) */}
              <div>
                <label className="block font-medium text-foreground-secondary mb-1">
                  Footer Text (Optional)
                </label>
                <Input
                  value={footerInput}
                  onChange={(e) => setFooterInput(e.target.value)}
                  placeholder="e.g. Acme Technologies Support"
                  className="text-xs"
                />
              </div>

              {/* Sample Values for Variables */}
              {liveVariables.length > 0 && (
                <div className="p-3 rounded-2xl bg-surface-subtle border border-border space-y-2">
                  <label className="font-semibold text-foreground block">
                    Sample Values for Meta Review:
                  </label>
                  <p className="text-[10px] text-foreground-secondary">
                    Meta requires representative sample values for every variable defined.
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {liveVariables.map((v) => (
                      <div key={v}>
                        <label className="text-[10px] font-mono text-foreground-secondary block mb-0.5">
                          Value for {"{{" + v + "}}"}
                        </label>
                        <Input
                          value={sampleValuesInput[v] || ""}
                          onChange={(e) =>
                            setSampleValuesInput({ ...sampleValuesInput, [v]: e.target.value })
                          }
                          placeholder={`Sample value for {{${v}}}`}
                          className="text-xs h-8"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Preview Container */}
              {bodyInput.trim() && (
                <div className="p-3.5 rounded-2xl bg-slate-100/80 border border-slate-200/80 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Live WhatsApp Bubble Preview:
                  </span>
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs max-w-sm">
                    {headerInput && (
                      <div className="font-bold text-xs text-slate-900 mb-1">{headerInput}</div>
                    )}
                    <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {livePreviewText}
                    </p>
                    {footerInput && (
                      <div className="text-[10px] text-slate-400 mt-1">{footerInput}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {!createSuccessMsg && (
            <DialogFooter>
              <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!nameInput.trim() || !bodyInput.trim()}>
                Submit for Meta Review
              </Button>
            </DialogFooter>
          )}
        </form>
      </Dialog>

      {/* Modal: Inspect Template */}
      {inspectTemplate && (
        <Dialog open={Boolean(inspectTemplate)} onOpenChange={() => setInspectTemplate(null)}>
          <div>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="font-mono text-base">{inspectTemplate.name}</DialogTitle>
                  <DialogDescription>
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
              <div className="p-3.5 rounded-2xl bg-slate-100/80 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Rendered Preview:
                </span>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs max-w-sm">
                  {inspectTemplate.header_text && (
                    <div className="font-bold text-xs text-slate-900 mb-1">
                      {inspectTemplate.header_text}
                    </div>
                  )}
                  <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {templateStore.renderTemplateBody(inspectTemplate, inspectTemplate.sample_values)}
                  </p>
                  {inspectTemplate.footer_text && (
                    <div className="text-[10px] text-slate-400 mt-1">
                      {inspectTemplate.footer_text}
                    </div>
                  )}
                </div>
              </div>

              {inspectTemplate.rejection_reason && (
                <div className="p-3 rounded-2xl bg-google-red-subtle border border-google-red/20 text-google-red space-y-1">
                  <span className="font-semibold block">Meta Rejection Feedback:</span>
                  <p>{inspectTemplate.rejection_reason}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-surface-subtle border border-border text-[11px]">
                <div>
                  <span className="text-foreground-secondary block">Meta Template ID:</span>
                  <span className="font-mono font-medium text-foreground">
                    {inspectTemplate.meta_template_id || "Awaiting Approval"}
                  </span>
                </div>
                <div>
                  <span className="text-foreground-secondary block">Created:</span>
                  <span className="font-medium text-foreground">
                    {formatDate(inspectTemplate.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setInspectTemplate(null)}>Close</Button>
            </DialogFooter>
          </div>
        </Dialog>
      )}
    </div>
  );
}
