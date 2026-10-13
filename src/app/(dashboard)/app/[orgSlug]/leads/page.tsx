"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useTenant } from "@/lib/organizations/tenant-context";
import { crmStore } from "@/lib/crm/crm-store";
import { Lead, LeadStage, Contact } from "@/types/crm";
import { leadQualificationStore } from "@/lib/ai/lead-qualification-store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Users,
  Plus,
  Search,
  Kanban,
  Table as TableIcon,
  Phone,
  Calendar,
  Building2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  X,
  ExternalLink,
  ChevronRight,
  Filter,
  ArrowRight,
  Sparkles,
  UserCheck,
  Check,
  Briefcase,
} from "lucide-react";

// ============================================================================
// STAGE DEFINITIONS & COLOR SYSTEM
// ============================================================================

interface StageConfig {
  id: LeadStage;
  title: string;
  dotColor: string;
  pillColor: string;
  badgeVariant: "default" | "success" | "warning" | "danger" | "purple" | "neutral";
}

const STAGES: StageConfig[] = [
  {
    id: "new",
    title: "New",
    dotColor: "bg-sky-500",
    pillColor: "bg-sky-50 text-sky-700 border-sky-200",
    badgeVariant: "default",
  },
  {
    id: "contacted",
    title: "Contacted",
    dotColor: "bg-amber-500",
    pillColor: "bg-amber-50 text-amber-700 border-amber-200",
    badgeVariant: "warning",
  },
  {
    id: "qualified",
    title: "Qualified",
    dotColor: "bg-purple-500",
    pillColor: "bg-purple-50 text-purple-700 border-purple-200",
    badgeVariant: "purple",
  },
  {
    id: "proposal",
    title: "Proposal",
    dotColor: "bg-blue-600",
    pillColor: "bg-blue-50 text-blue-700 border-blue-200",
    badgeVariant: "default",
  },
  {
    id: "won",
    title: "Won",
    dotColor: "bg-emerald-500",
    pillColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeVariant: "success",
  },
  {
    id: "lost",
    title: "Lost",
    dotColor: "bg-rose-500",
    pillColor: "bg-rose-50 text-rose-700 border-rose-200",
    badgeVariant: "danger",
  },
];

export default function LeadsPage() {
  const { currentOrg, isAdmin } = useTenant();
  const orgSlug = currentOrg.slug;

  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<"board" | "table">("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");

  // Create lead modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [dealValue, setDealValue] = useState("50000");
  const [initialStage, setInitialStage] = useState<LeadStage>("new");
  const [source, setSource] = useState("WhatsApp Inbound");
  const [nextFollowUp, setNextFollowUp] = useState("");
  const [notes, setNotes] = useState("");

  // Lead Detail Drawer State
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "timeline" | "ai">("details");

  // Lost Reason Modal State
  const [lostReasonModalOpen, setLostReasonModalOpen] = useState(false);
  const [leadToLose, setLeadToLose] = useState<Lead | null>(null);
  const [lostReasonText, setLostReasonText] = useState("Price too high");

  // AI assessment state
  const [assessingLead, setAssessingLead] = useState(false);
  const [assessmentFeedback, setAssessmentFeedback] = useState<string | null>(null);

  // Data queries
  const leads = useMemo(() => {
    return crmStore.getLeads(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  const contacts = useMemo(() => {
    return crmStore.getContacts(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  // Extract unique owners
  const uniqueOwners = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.assigned_to_name) set.add(l.assigned_to_name);
    });
    return Array.from(set);
  }, [leads]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        l.title.toLowerCase().includes(q) ||
        l.contact_name.toLowerCase().includes(q) ||
        l.contact_phone.includes(q);

      const matchesStage = stageFilter === "all" || l.stage === stageFilter;
      const matchesOwner = ownerFilter === "all" || l.assigned_to_name === ownerFilter;

      return matchesQuery && matchesStage && matchesOwner;
    });
  }, [leads, searchQuery, stageFilter, ownerFilter]);

  // Handlers
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedContactId) return;

    const contact = contacts.find((c) => c.id === selectedContactId);
    if (!contact) return;

    crmStore.createLead(orgSlug, {
      contact_id: contact.id,
      contact_name: `${contact.first_name} ${contact.last_name || ""}`.trim(),
      contact_phone: contact.phone,
      title,
      stage: initialStage,
      source,
      estimated_value: parseFloat(dealValue) || 0,
      currency: "INR",
      next_follow_up_at: nextFollowUp ? new Date(nextFollowUp).toISOString() : null,
      notes: notes || undefined,
    });

    // Reset & close
    setTitle("");
    setSelectedContactId("");
    setDealValue("50000");
    setNotes("");
    setCreateModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  const handleStageChange = (lead: Lead, newStage: LeadStage) => {
    if (newStage === "lost") {
      setLeadToLose(lead);
      setLostReasonModalOpen(true);
      return;
    }

    crmStore.updateLeadStage(orgSlug, lead.id, newStage);
    setRefreshKey((k) => k + 1);

    // If drawer is currently open on this lead, update it
    if (activeLead && activeLead.id === lead.id) {
      setActiveLead({ ...activeLead, stage: newStage });
    }
  };

  const handleConfirmLost = () => {
    if (!leadToLose) return;
    crmStore.updateLeadStage(orgSlug, leadToLose.id, "lost", lostReasonText);
    setLostReasonModalOpen(false);
    setLeadToLose(null);
    setRefreshKey((k) => k + 1);

    if (activeLead && activeLead.id === leadToLose.id) {
      setActiveLead({ ...activeLead, stage: "lost", lost_reason: lostReasonText });
    }
  };

  const handleDeleteLead = (leadId: string) => {
    if (!isAdmin) {
      alert("Only Admins and Owners can delete lead records.");
      return;
    }
    crmStore.deleteLead(orgSlug, leadId);
    if (activeLead?.id === leadId) {
      setActiveLead(null);
    }
    setRefreshKey((k) => k + 1);
  };

  const handleAssessLead = async (leadId: string) => {
    setAssessingLead(true);
    setAssessmentFeedback(null);
    try {
      await leadQualificationStore.assessLead(orgSlug, leadId);
      setRefreshKey((k) => k + 1);
      setAssessmentFeedback("Lead assessment updated with qualification recommendations.");
    } catch (err: any) {
      setAssessmentFeedback(err?.message || "Assessment failed");
    } finally {
      setAssessingLead(false);
    }
  };

  const activeQualification = activeLead
    ? leadQualificationStore.getQualificationForLead(orgSlug, activeLead.id)
    : null;

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* COMPACT PAGE HEADER                                                   */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Sales Pipeline
            </h1>
            <span className="glass-pill rounded-full bg-white/80 border border-white text-xs font-semibold px-3 py-0.5 text-slate-700 shadow-xs">
              {filteredLeads.length} {filteredLeads.length === 1 ? "lead" : "leads"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-normal">
            Track and advance commercial opportunities through active conversion stages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Board / Table View Toggle */}
          <div className="flex items-center rounded-xl bg-white/70 backdrop-blur-sm p-1 border border-white/80 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "board"
                  ? "bg-white text-slate-900 shadow-xs border border-white/90"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Kanban Board View"
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-xs border border-white/90"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="List Table View"
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>

          {/* New Lead Action Button */}
          <Button
            onClick={() => setCreateModalOpen(true)}
            size="default"
            className="shadow-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>New Lead</span>
          </Button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* COMPACT TOOLBAR (SEARCH & STAGE / OWNER FILTERS)                       */}
      {/* ===================================================================== */}
      <div className="glass-panel flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-white/70 bg-white/75 backdrop-blur-xl shadow-glass">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[240px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by lead title, contact name, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-white/80 bg-white/70 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500/80 focus:bg-white backdrop-blur-sm shadow-xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Stage Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium hidden sm:inline">Stage:</span>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-white/80 bg-white/70 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500/80 focus:bg-white backdrop-blur-sm shadow-xs cursor-pointer"
            >
              <option value="all">All Stages ({leads.length})</option>
              {STAGES.map((s) => {
                const count = leads.filter((l) => l.stage === s.id).length;
                return (
                  <option key={s.id} value={s.id}>
                    {s.title} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Owner Filter */}
          {uniqueOwners.length > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 font-medium hidden sm:inline">Owner:</span>
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="px-2.5 py-2 rounded-xl border border-white/80 bg-white/70 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500/80 focus:bg-white backdrop-blur-sm shadow-xs cursor-pointer"
              >
                <option value="all">All Owners</option>
                {uniqueOwners.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Clear Filters Indicator */}
        {(searchQuery || stageFilter !== "all" || ownerFilter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setStageFilter("all");
              setOwnerFilter("all");
            }}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer px-3 py-1.5 rounded-xl bg-white/80 border border-white shadow-xs"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* ===================================================================== */}
      {/* KANBAN BOARD VIEW                                                     */}
      {/* ===================================================================== */}
      {viewMode === "board" ? (
        <div className="flex gap-4 overflow-x-auto pb-6 items-start min-h-[580px]">
          {STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.stage === stage.id);
            const stageValue = stageLeads.reduce((acc, curr) => acc + curr.estimated_value, 0);

            return (
              <div
                key={stage.id}
                className="w-80 shrink-0 rounded-[22px] bg-white/45 backdrop-blur-md border border-white/60 p-3.5 flex flex-col space-y-3 shadow-xs"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-white/60">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${stage.dotColor} shadow-xs`} />
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      {stage.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/80 border border-white text-[10px] font-mono font-bold text-slate-700 shadow-2xs">
                      {stageLeads.length}
                    </span>
                  </div>

                  {stageValue > 0 && (
                    <span className="text-[11px] font-mono font-bold text-slate-700">
                      {formatCurrency(stageValue)}
                    </span>
                  )}
                </div>

                {/* Cards List in Stage */}
                <div className="space-y-2.5 min-h-[120px]">
                  {stageLeads.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl border border-dashed border-white/80 bg-white/30 text-xs text-slate-400">
                      No leads in {stage.title}
                    </div>
                  ) : (
                    stageLeads.map((lead) => {
                      const hasFollowUp = !!lead.next_follow_up_at;
                      const isFollowUpOverdue =
                        hasFollowUp &&
                        new Date(lead.next_follow_up_at!) < new Date(Date.now() - 3600000);

                      return (
                        <div
                          key={lead.id}
                          onClick={() => setActiveLead(lead)}
                          className="glass-card group relative rounded-2xl border border-white/85 bg-white/85 backdrop-blur-md p-4 shadow-xs hover:shadow-glass hover:bg-white hover:border-white transition-all duration-200 cursor-pointer text-left space-y-3"
                        >
                          {/* Card Top: Title & Source */}
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                              {lead.title}
                            </h4>
                            <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/90 text-slate-600 border border-white shadow-2xs font-semibold">
                              {lead.source}
                            </span>
                          </div>

                          {/* Contact & Company */}
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate font-medium">{lead.contact_name}</span>
                          </div>

                          {/* Card Bottom: Deal Value & Follow-up */}
                          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100/80 text-xs">
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              {formatCurrency(lead.estimated_value)}
                            </span>

                            {hasFollowUp ? (
                              <div
                                className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                  isFollowUpOverdue
                                    ? "bg-rose-500/10 text-rose-700 border border-rose-500/20 font-bold"
                                    : "bg-amber-500/10 text-amber-700 border border-amber-500/20 font-medium"
                                }`}
                                title={formatDate(lead.next_follow_up_at!)}
                              >
                                <Clock className="h-3 w-3" />
                                <span>{isFollowUpOverdue ? "Overdue" : "Due Soon"}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">
                                {lead.assigned_to_name ? lead.assigned_to_name.split(" ")[0] : "Unassigned"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ===================================================================== */
        /* TABLE LIST VIEW                                                       */
        /* ===================================================================== */
        <div className="glass-panel rounded-[22px] border border-white/70 bg-white/75 backdrop-blur-xl overflow-hidden shadow-glass">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-white/40 border-b border-white/60 text-slate-500 uppercase font-mono text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-bold">Deal / Lead</th>
                  <th className="py-3 px-4 font-bold">Contact</th>
                  <th className="py-3 px-4 font-bold">Stage</th>
                  <th className="py-3 px-4 font-bold text-right">Value</th>
                  <th className="py-3 px-4 font-bold">Owner</th>
                  <th className="py-3 px-4 font-bold">Follow-Up</th>
                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/60">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No matching leads found
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const stageConfig = STAGES.find((s) => s.id === lead.stage)!;
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => setActiveLead(lead)}
                        className="hover:bg-white/70 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {lead.title}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <div>{lead.contact_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {lead.contact_phone}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${stageConfig.pillColor}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${stageConfig.dotColor}`} />
                            {stageConfig.title}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 text-right">
                          {formatCurrency(lead.estimated_value)}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {lead.assigned_to_name || "Unassigned"}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-xs">
                          {lead.next_follow_up_at
                            ? formatDate(lead.next_follow_up_at)
                            : "—"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveLead(lead);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-blue-600 transition-colors"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* LEAD DETAIL SLIDE-OVER DRAWER (PROGRESSIVE DISCLOSURE)                 */}
      {/* ===================================================================== */}
      {activeLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm transition-opacity"
            onClick={() => setActiveLead(null)}
          />

          {/* Drawer Sheet */}
          <div className="relative z-50 w-full max-w-md h-full bg-white/92 backdrop-blur-2xl border-l border-white/70 shadow-glass-dock flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-white/60 flex items-start justify-between gap-4 bg-white/40">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  OPPORTUNITY DETAILS
                </span>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {activeLead.title}
                </h3>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-slate-500 font-medium">Stage:</span>
                  <select
                    value={activeLead.stage}
                    onChange={(e) => handleStageChange(activeLead, e.target.value as LeadStage)}
                    className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-white/80 border border-white/80 text-slate-800 shadow-2xs focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveLead(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Tabs */}
            <div className="flex border-b border-white/60 px-5 bg-white/40 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === "details"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("timeline")}
                className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === "timeline"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                Activity Timeline
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ai")}
                className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1 ${
                  activeTab === "ai"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <Sparkles className="h-3 w-3 text-purple-500" />
                <span>Qualification</span>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {activeTab === "details" && (
                <div className="space-y-5">
                  {/* Deal Value Card */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                        ESTIMATED DEAL VALUE
                      </span>
                      <span className="text-xl font-mono font-black text-slate-900 block mt-0.5">
                        {formatCurrency(activeLead.estimated_value)}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-600">
                      {activeLead.currency}
                    </span>
                  </div>

                  {/* Contact Summary */}
                  <div className="space-y-3">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      ASSOCIATED CONTACT
                    </span>
                    <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">
                          {activeLead.contact_name}
                        </span>
                        <Link
                          href={`/app/${orgSlug}/inbox`}
                          className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Chat</span>
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-mono">{activeLead.contact_phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Key Metadata Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 block font-mono text-[10px] uppercase">
                        Lead Source
                      </span>
                      <span className="font-semibold text-slate-800 mt-0.5 block">
                        {activeLead.source}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 block font-mono text-[10px] uppercase">
                        Assigned Owner
                      </span>
                      <span className="font-semibold text-slate-800 mt-0.5 block">
                        {activeLead.assigned_to_name || "Unassigned"}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 block font-mono text-[10px] uppercase">
                        Next Follow-Up
                      </span>
                      <span className="font-semibold text-slate-800 mt-0.5 block">
                        {activeLead.next_follow_up_at
                          ? formatDate(activeLead.next_follow_up_at)
                          : "Not Scheduled"}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 block font-mono text-[10px] uppercase">
                        Created
                      </span>
                      <span className="font-semibold text-slate-800 mt-0.5 block">
                        {formatDate(activeLead.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      NOTES &amp; BRIEF
                    </span>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed min-h-[60px]">
                      {activeLead.notes || "No additional notes recorded for this lead."}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "timeline" && (
                <div className="space-y-4">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    EVENT TIMELINE
                  </span>
                  <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200">
                    <div className="flex items-start gap-3 relative">
                      <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 z-10">
                        <Check className="h-3 w-3" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          Lead in stage &ldquo;{activeLead.stage}&rdquo;
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Last updated: {formatDate(activeLead.updated_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 relative">
                      <div className="h-6 w-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 z-10">
                        <Briefcase className="h-3 w-3" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          Opportunity initialized via {activeLead.source}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {formatDate(activeLead.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "ai" && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-900 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                        AI Lead Qualification
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAssessLead(activeLead.id)}
                        disabled={assessingLead}
                        className="h-7 text-xs bg-white text-purple-700 hover:bg-purple-100 border-purple-200"
                      >
                        {assessingLead ? "Analyzing..." : "Re-assess"}
                      </Button>
                    </div>
                    <p className="text-purple-700 text-[11px] leading-relaxed">
                      Evaluates purchase intent, deal value alignment, and suggested next steps based
                      on conversation history and CRM notes.
                    </p>
                  </div>

                  {activeQualification ? (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          Classification &amp; Category
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900">
                            {activeQualification.leadCategory}
                          </span>
                          <Badge variant="purple" className="text-xs uppercase">
                            {activeQualification.suggestedPriority} priority
                          </Badge>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          Suggested Action
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {activeQualification.suggestedNextAction}
                        </p>
                      </div>

                      {activeQualification.explanation && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            Evaluation Context
                          </span>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {activeQualification.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400">
                      No automated qualification record yet. Click &ldquo;Re-assess&rdquo; above.
                    </div>
                  )}

                  {assessmentFeedback && (
                    <p className="text-xs text-emerald-600 font-medium">
                      {assessmentFeedback}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleDeleteLead(activeLead.id)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                {activeLead.stage !== "won" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleStageChange(activeLead, "won")}
                    className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                  >
                    Mark as Won
                  </Button>
                )}
                {activeLead.stage !== "lost" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStageChange(activeLead, "lost")}
                    className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
                  >
                    Mark as Lost
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* CREATE NEW LEAD MODAL DIALOG                                          */}
      {/* ===================================================================== */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogHeader>
          <DialogTitle>Create New Opportunity</DialogTitle>
          <DialogDescription>
            Add a new prospective deal to your sales pipeline and assign follow-up targets.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateLead} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Opportunity Title *
            </label>
            <Input
              required
              placeholder="e.g. Enterprise WhatsApp CRM Package"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Associated Contact *
              </label>
              <select
                required
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select a contact...</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name || ""} ({c.company || c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Initial Pipeline Stage
              </label>
              <select
                value={initialStage}
                onChange={(e) => setInitialStage(e.target.value as LeadStage)}
                className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Estimated Deal Value (INR)
              </label>
              <Input
                type="number"
                min="0"
                step="1000"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Next Follow-Up Date
              </label>
              <Input
                type="date"
                value={nextFollowUp}
                onChange={(e) => setNextFollowUp(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Lead Notes &amp; Scope
            </label>
            <textarea
              rows={3}
              placeholder="Key client requirements, budget range, or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create Lead
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* ===================================================================== */}
      {/* LOST REASON MODAL DIALOG                                              */}
      {/* ===================================================================== */}
      <Dialog open={lostReasonModalOpen} onOpenChange={setLostReasonModalOpen}>
        <DialogHeader>
          <DialogTitle>Record Lost Reason</DialogTitle>
          <DialogDescription>
            Specify the primary reason why this lead did not convert for analytical reporting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <label className="text-xs font-semibold text-slate-700">
            Primary Cause:
          </label>
          <select
            value={lostReasonText}
            onChange={(e) => setLostReasonText(e.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
          >
            <option>Price too high</option>
            <option>Competitor chosen</option>
            <option>Features missing</option>
            <option>Budget canceled</option>
            <option>No response / Stalled</option>
          </select>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setLostReasonModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirmLost}
          >
            Confirm Lost
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
