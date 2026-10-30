"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useTenant } from "@/lib/organizations/tenant-context";
import { crmStore } from "@/lib/crm/crm-store";
import { Lead, LeadStage, Contact } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { Drawer } from "@/components/ui/drawer";
import { NewOpportunityModal } from "@/components/crm/new-opportunity-modal";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast-context";
import {
  cn,
  formatINR,
  formatDate,
  getAvatarColor,
  getInitials,
} from "@/lib/utils";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Kanban,
  Table as TableIcon,
  Phone,
  Calendar,
  Building2,
  Trash2,
  Check,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  User,
  UserPlus,
  MoreHorizontal,
  Flag,
  Link2,
  MessageSquare,
  Layers,
  AlertCircle,
  XCircle,
  Share2,
  Star,
  ExternalLink,
  ChevronDown,
  X,
  GripVertical,
} from "lucide-react";

interface StageConfig {
  id: LeadStage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  pillBg: string;
  pillBorder: string;
  pillText: string;
  countBg: string;
  countText: string;
  progressColor: string;
  count: number;
  totalValue: number;
}

export default function LeadsPage() {
  const { currentOrg } = useTenant();
  const orgSlug = currentOrg.slug;
  const { toast } = useToast();

  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<"board" | "table">("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>("all");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [activeMenuLeadId, setActiveMenuLeadId] = useState<string | null>(null);

  // Drag and drop state
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStage | null>(null);

  // Create Opportunity modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [title, setTitle] = useState("");
  const [dealValue, setDealValue] = useState("50000");
  const [initialStage, setInitialStage] = useState<LeadStage>("new");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [dealNotes, setDealNotes] = useState("");
  const [source, setSource] = useState("WhatsApp Inbound");

  const filterRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterDropdownOpen(false);
      }
      if (activeMenuLeadId && !(event.target as HTMLElement).closest(".context-menu-container")) {
        setActiveMenuLeadId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenuLeadId]);

  // Live leads & contacts from store
  const rawLeads = useMemo(() => crmStore.getLeads(orgSlug), [orgSlug, refreshKey]);

  // Filtered leads
  const leads = useMemo(() => {
    return rawLeads.filter((l) => {
      // Search matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          l.title.toLowerCase().includes(q) ||
          (l.contact_name && l.contact_name.toLowerCase().includes(q)) ||
          (l.contact_phone && l.contact_phone.includes(q)) ||
          (l.notes && l.notes.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      // Priority filter matching
      if (selectedPriorityFilter !== "all") {
        if (selectedPriorityFilter === "high" && !(l.estimated_value >= 150000 || l.stage === "proposal")) return false;
        if (selectedPriorityFilter === "medium" && !(l.estimated_value >= 75000 && l.estimated_value < 150000)) return false;
        if (selectedPriorityFilter === "low" && !(l.estimated_value < 75000 && l.stage !== "proposal")) return false;
      }

      return true;
    });
  }, [rawLeads, searchQuery, selectedPriorityFilter]);

  // Stage configuration & metrics (Matching reference image pill banner aesthetics)
  const stages: StageConfig[] = useMemo(() => {
    const stageDefs: Array<{
      id: LeadStage;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      pillBg: string;
      pillBorder: string;
      pillText: string;
      countBg: string;
      countText: string;
      progressColor: string;
    }> = [
      {
        id: "new",
        label: "Inbound",
        icon: Sparkles,
        pillBg: "bg-[#F1F5F9]",
        pillBorder: "border-[#CBD5E1]",
        pillText: "text-[#475569]",
        countBg: "bg-white",
        countText: "text-[#475569]",
        progressColor: "bg-[#94A3B8]",
      },
      {
        id: "contacted",
        label: "Contacted",
        icon: MessageSquare,
        pillBg: "bg-[#E3F3FD]",
        pillBorder: "border-[#BFE3FA]",
        pillText: "text-[#0A6AA3]",
        countBg: "bg-white",
        countText: "text-[#0A6AA3]",
        progressColor: "bg-[#1FA2E8]",
      },
      {
        id: "qualified",
        label: "Qualified",
        icon: Check,
        pillBg: "bg-[#EAEEFF]",
        pillBorder: "border-[#D3DCFF]",
        pillText: "text-[#2A3DB5]",
        countBg: "bg-white",
        countText: "text-[#2A3DB5]",
        progressColor: "bg-[#3D5AFE]",
      },
      {
        id: "proposal",
        label: "Proposal",
        icon: AlertCircle,
        pillBg: "bg-[#FFF3D6]",
        pillBorder: "border-[#FFE5A3]",
        pillText: "text-[#8F5300]",
        countBg: "bg-white",
        countText: "text-[#8F5300]",
        progressColor: "bg-[#F5A524]",
      },
      {
        id: "won",
        label: "Won",
        icon: CheckCircle2,
        pillBg: "bg-[#E4F7EF]",
        pillBorder: "border-[#BDECD7]",
        pillText: "text-[#0A7A53]",
        countBg: "bg-white",
        countText: "text-[#0A7A53]",
        progressColor: "bg-[#12B886]",
      },
      {
        id: "lost",
        label: "Lost",
        icon: XCircle,
        pillBg: "bg-[#FFE9EA]",
        pillBorder: "border-[#FDC8CA]",
        pillText: "text-[#B42336]",
        countBg: "bg-white",
        countText: "text-[#B42336]",
        progressColor: "bg-[#E5484D]",
      },
    ];

    return stageDefs.map((def) => {
      const stageLeads = leads.filter((l) => l.stage === def.id);
      const totalValue = stageLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
      return {
        ...def,
        count: stageLeads.length,
        totalValue,
      };
    });
  }, [leads]);

  const totalOpenValue = useMemo(() => {
    return leads
      .filter((l) => l.stage !== "won" && l.stage !== "lost")
      .reduce((sum, l) => sum + (l.estimated_value || 0), 0);
  }, [leads]);

  // Drag and Drop Handlers
  const handleDragStart = (leadId: string) => {
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: LeadStage) => {
    e.preventDefault();
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId);
    }
  };

  const handleDrop = (targetStage: LeadStage) => {
    if (!draggedLeadId) return;

    crmStore.updateLeadStage(orgSlug, draggedLeadId, targetStage);
    setDraggedLeadId(null);
    setDragOverStage(null);
    setRefreshKey((k) => k + 1);

    if (targetStage === "won") {
      toast("Deal marked Won! Revenue added to closed totals", { type: "success" });
    } else {
      toast(`Opportunity moved to ${targetStage}`, { type: "info" });
    }
  };

  // Quick Stage Advance
  const handleAdvanceStage = (leadId: string, currentStage: LeadStage) => {
    const stageOrder: LeadStage[] = ["new", "contacted", "qualified", "proposal", "won"];
    const currentIndex = stageOrder.indexOf(currentStage);
    if (currentIndex >= 0 && currentIndex < stageOrder.length - 1) {
      const nextStage = stageOrder[currentIndex + 1];
      crmStore.updateLeadStage(orgSlug, leadId, nextStage);
      setRefreshKey((k) => k + 1);
      toast(`Advanced deal to ${nextStage}`, { type: "info" });
    }
    setActiveMenuLeadId(null);
  };

  // Create Opportunity Handler
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    crmStore.createLead(orgSlug, {
      title,
      estimated_value: parseFloat(dealValue) || 50000,
      currency: "INR",
      stage: initialStage,
      contact_id: "c-direct",
      contact_name: contactName || "Direct Client",
      contact_phone: contactPhone || "+919876543210",
      notes: dealNotes || "Commercial requirement logged from pipeline view.",
      source,
    });

    setCreateModalOpen(false);
    setTitle("");
    setDealValue("50000");
    setContactName("");
    setContactPhone("");
    setDealNotes("");
    setRefreshKey((k) => k + 1);
    toast("Opportunity created", { type: "success" });
  };

  // Helper: Card Priority styling
  const getPriorityBadge = (lead: Lead) => {
    if (lead.estimated_value >= 150000 || lead.stage === "proposal") {
      return {
        label: "High",
        pillClass: "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]",
      };
    }
    if (lead.estimated_value >= 75000 || lead.stage === "qualified") {
      return {
        label: "Medium",
        pillClass: "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]",
      };
    }
    return {
      label: "Low",
      pillClass: "bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]",
    };
  };

  // Helper: Stage Progress & State Information (Explicit 5-step pipeline progression)
  const getStageProgressInfo = (stage: LeadStage) => {
    switch (stage) {
      case "new":
        return {
          step: 1,
          total: 5,
          stepLabel: "Step 1 of 5",
          stageName: "Inbound Discovery",
          phaseDescription: "Initial customer inquiry",
          nextStageName: "Contacted",
          color: "bg-[#64748B]",
          badgeBg: "bg-[#F1F5F9]",
          badgeText: "text-[#475569]",
          badgeBorder: "border-[#CBD5E1]",
        };
      case "contacted":
        return {
          step: 2,
          total: 5,
          stepLabel: "Step 2 of 5",
          stageName: "Contacted & Demo",
          phaseDescription: "Live demo in progress",
          nextStageName: "Qualified",
          color: "bg-[#0284C7]",
          badgeBg: "bg-[#E3F3FD]",
          badgeText: "text-[#0A6AA3]",
          badgeBorder: "border-[#BFE3FA]",
        };
      case "qualified":
        return {
          step: 3,
          total: 5,
          stepLabel: "Step 3 of 5",
          stageName: "Solution Qualified",
          phaseDescription: "Architecture fit approved",
          nextStageName: "Proposal",
          color: "bg-[#3D5AFE]",
          badgeBg: "bg-[#EAEEFF]",
          badgeText: "text-[#2A3DB5]",
          badgeBorder: "border-[#D3DCFF]",
        };
      case "proposal":
        return {
          step: 4,
          total: 5,
          stepLabel: "Step 4 of 5",
          stageName: "Proposal Review",
          phaseDescription: "Commercial sign-off pending",
          nextStageName: "Won",
          color: "bg-[#F5A524]",
          badgeBg: "bg-[#FFF3D6]",
          badgeText: "text-[#8F5300]",
          badgeBorder: "border-[#FFE5A3]",
        };
      case "won":
        return {
          step: 5,
          total: 5,
          stepLabel: "Won & Closed",
          stageName: "Closed Won",
          phaseDescription: "Contract executed & active",
          nextStageName: null,
          color: "bg-[#12B886]",
          badgeBg: "bg-[#E4F7EF]",
          badgeText: "text-[#0A7A53]",
          badgeBorder: "border-[#BDECD7]",
        };
      case "lost":
        return {
          step: 0,
          total: 5,
          stepLabel: "Closed Lost",
          stageName: "Closed Lost",
          phaseDescription: "Inactive opportunity",
          nextStageName: null,
          color: "bg-[#E5484D]",
          badgeBg: "bg-[#FFE9EA]",
          badgeText: "text-[#B42336]",
          badgeBorder: "border-[#FDC8CA]",
        };
      default:
        return {
          step: 1,
          total: 5,
          stepLabel: "Step 1 of 5",
          stageName: "Inbound",
          phaseDescription: "Discovery",
          nextStageName: "Contacted",
          color: "bg-[#64748B]",
          badgeBg: "bg-[#F1F5F9]",
          badgeText: "text-[#475569]",
          badgeBorder: "border-[#CBD5E1]",
        };
    }
  };

  const getMilestoneInfo = (stage: LeadStage) => {
    const info = getStageProgressInfo(stage);
    return {
      completed: info.step,
      total: info.total,
      label: info.stepLabel,
      color: info.color,
    };
  };

  return (
    <div className="space-y-6 animate-page-enter">
      {/* ========================================================================= */}
      {/* 1. TOP TOOLBAR & HEADER (Matching Reference Visual Controls)              */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-4 pb-5 border-b border-[#E4E1D8] lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Title & Quick Stats */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[26px] sm:text-[28px] font-medium leading-[34px] tracking-[-0.02em] text-[#12141A]">
              Sales Pipeline
            </h1>
            <div className="flex items-center rounded-[10px] border border-[#E6E2D8] bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("board")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-[7px] text-[13px] font-medium transition-colors cursor-pointer",
                  viewMode === "board"
                    ? "bg-[#0B0D12] text-white"
                    : "text-[#666C78] hover:text-[#12141A]"
                )}
                title="Kanban Board View"
              >
                <Kanban className="h-3.5 w-3.5" />
                <span>Board</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-[7px] text-[13px] font-medium transition-colors cursor-pointer",
                  viewMode === "table"
                    ? "bg-[#0B0D12] text-white"
                    : "text-[#666C78] hover:text-[#12141A]"
                )}
                title="Table View"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>Table</span>
              </button>
            </div>
          </div>
          <p className="mt-1 text-[13px] text-[#4B515D]">
            {leads.length} active opportunities • <span className="font-medium text-[#111827]">{formatINR(totalOpenValue)}</span> pipeline value
          </p>
        </div>

        {/* Right: Search, Filter, Primary CTA, Team Avatars & Invite */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Search Box with ⌘K Badge */}
          <div className="relative w-48 sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666C78]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="h-10 w-full rounded-[12px] border border-[#E6E2D8] bg-white pl-9 pr-10 text-[14px] text-[#12141A] placeholder:text-[#666C78] focus:border-[#FF5A1F] focus:outline-none shadow-2xs transition-colors"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-[5px] bg-[#F1F3F5] text-[11px] font-medium text-[#666C78] border border-[#E2E4E8] pointer-events-none">
              ⌘K
            </kbd>
          </div>

          {/* Filter Dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setFilterDropdownOpen((prev) => !prev)}
              className={cn(
                "h-10 px-3.5 rounded-[12px] border bg-white flex items-center gap-2 text-[14px] font-medium transition-colors cursor-pointer shadow-2xs",
                selectedPriorityFilter !== "all"
                  ? "border-[#FF5A1F] text-[#FF5A1F] bg-[#FFF5F0]"
                  : "border-[#E6E2D8] text-[#12141A] hover:bg-[#F9F8F6]"
              )}
            >
              <SlidersHorizontal className="h-4 w-4 text-[#666C78]" />
              <span>Filter</span>
              {selectedPriorityFilter !== "all" && (
                <span className="h-2 w-2 rounded-full bg-[#FF5A1F]" />
              )}
            </button>

            {filterDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-[14px] bg-white border border-[#E6E2D8] shadow-lg p-2 z-30 animate-reveal">
                <div className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF]">
                  Filter by Priority
                </div>
                {(["all", "high", "medium", "low"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setSelectedPriorityFilter(p);
                      setFilterDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-2.5 py-1.5 rounded-[8px] text-[13px] font-medium capitalize transition-colors flex items-center justify-between",
                      selectedPriorityFilter === p
                        ? "bg-[#F1F5F9] text-[#111827]"
                        : "text-[#666C78] hover:bg-[#F9F8F6] hover:text-[#111827]"
                    )}
                  >
                    <span>{p === "all" ? "All Priorities" : `${p} Priority`}</span>
                    {selectedPriorityFilter === p && <Check className="h-3.5 w-3.5 text-[#111827]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Primary Create Action */}
          <button
            type="button"
            onClick={() => {
              setInitialStage("new");
              setCreateModalOpen(true);
            }}
            className="btn-primary flex items-center gap-1.5 text-[14px] cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Create Deal</span>
          </button>

          {/* Team Avatar Stack & Invite Button */}
          <div className="hidden xl:flex items-center pl-2 border-l border-[#E6E2D8] gap-2">
            <div className="flex items-center -space-x-2">
              {[
                { name: "Praveen R.", bg: "bg-[#EAEEFF]", text: "text-[#2A3DB5]" },
                { name: "Rahul M.", bg: "bg-[#FFF3D6]", text: "text-[#8F5300]" },
                { name: "Neha G.", bg: "bg-[#E4F7EF]", text: "text-[#0A7A53]" },
                { name: "Sneha R.", bg: "bg-[#F0EAFF]", text: "text-[#5B34C9]" },
              ].map((member, i) => (
                <div
                  key={i}
                  title={member.name}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[11px] font-medium shadow-2xs select-none",
                    member.bg,
                    member.text
                  )}
                >
                  {getInitials(member.name)}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              className="h-8 px-2.5 rounded-[9px] border border-[#E6E2D8] bg-white text-[12px] font-medium text-[#12141A] hover:bg-[#F9F8F6] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5 text-[#666C78]" />
              <span>Invite</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. KANBAN BOARD VIEW (Elevated Alignment, Explicit State & Drag Cues)       */}
      {/* ========================================================================= */}
      {viewMode === "board" && (
        <div className="flex flex-col gap-4 select-none">
          {/* Pipeline Interactive Guidance Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-[14px] bg-[#FAF9F5] border border-[#E6E2D8] text-[13px]">
            <div className="flex items-center gap-2.5 text-[#454B57]">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#FF5A1F]/10 text-[#FF5A1F]">
                <GripVertical className="h-3.5 w-3.5" />
              </span>
              <span>
                <strong className="font-medium text-[#12141A]">Interactive Kanban:</strong> Drag cards between columns to advance stages, or use the 1-click <strong className="font-medium text-[#FF5A1F]">Advance →</strong> button on each card.
              </span>
            </div>
            <div className="flex items-center gap-3 text-[12.5px] text-[#666C78] shrink-0">
              <span>Pipeline: <strong className="font-medium text-[#12141A] tabular-nums">{formatINR(totalOpenValue)}</strong></span>
              <span>•</span>
              <span>{leads.length} total deals</span>
            </div>
          </div>

          <div className="overflow-x-auto pb-6 custom-light-scroll">
            <div className="flex gap-4.5 min-w-[1420px] items-start">
              {stages.map((stage) => {
                const stageLeads = leads.filter((l) => l.stage === stage.id);
                const isOver = dragOverStage === stage.id;
                const StageIcon = stage.icon;

                return (
                  <div
                    key={stage.id}
                    onDragOver={(e) => handleDragOver(e, stage.id)}
                    onDrop={() => handleDrop(stage.id)}
                    className="flex flex-col w-[290px] shrink-0 transition-all duration-140"
                  >
                    {/* --- Unified Column Header (Icon, Title, Count, Add Deal & Stage Total) --- */}
                    <div
                      className={cn(
                        "flex flex-col rounded-[16px] border shadow-2xs transition-all overflow-hidden bg-white",
                        stage.pillBorder
                      )}
                    >
                      {/* Top Row: Icon, Label, Count, Add Deal */}
                      <div className={cn("flex items-center justify-between px-3.5 py-2.5", stage.pillBg)}>
                        <div className="flex items-center gap-2 overflow-hidden">
                          <StageIcon className={cn("h-4 w-4 shrink-0", stage.pillText)} />
                          <span className={cn("text-[13.5px] font-medium truncate", stage.pillText)}>
                            {stage.label}
                          </span>
                          <span
                            className={cn(
                              "h-5 min-w-[20px] px-1.5 rounded-full text-[11.5px] font-medium flex items-center justify-center tabular-nums shadow-2xs border",
                              stage.countBg,
                              stage.countText,
                              stage.pillBorder
                            )}
                          >
                            {stage.count}
                          </span>
                        </div>

                        {/* Stage Add Opportunity Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setInitialStage(stage.id);
                            setCreateModalOpen(true);
                          }}
                          className={cn(
                            "h-6 w-6 rounded-[7px] flex items-center justify-center hover:bg-black/5 active:scale-95 transition-all cursor-pointer",
                            stage.pillText
                          )}
                          title={`Add deal to ${stage.label}`}
                        >
                          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                        </button>
                      </div>

                      {/* Bottom Row: Stage Value Subtotal */}
                      <div className="px-3.5 py-1.5 bg-white border-t border-[#F0ECE2] flex items-center justify-between text-[11.5px]">
                        <span className="text-[#878D96]">Stage Total</span>
                        <span className="font-medium text-[#12141A] tabular-nums">
                          {formatINR(stage.totalValue)}
                        </span>
                      </div>
                    </div>

                    {/* --- Drop Container & Cards List --- */}
                    <div
                      className={cn(
                        "mt-2.5 p-1.5 space-y-3 min-h-[580px] rounded-[18px] border transition-all duration-140 custom-light-scroll",
                        isOver
                          ? "border-[#FF5A1F] ring-2 ring-[#FF5A1F]/20 bg-[#FFF6F2]"
                          : draggedLeadId
                          ? "border-dashed border-[#CBD5E1] bg-[#FBFBFA]/60"
                          : "border-transparent bg-transparent"
                      )}
                    >
                      {isOver && (
                        <div className="py-2.5 px-3 rounded-[12px] bg-[#FF5A1F]/10 border border-[#FF5A1F]/30 text-center text-[12px] font-medium text-[#FF5A1F] animate-pulse">
                          Drop to advance to {stage.label}
                        </div>
                      )}

                      {stageLeads.map((lead) => {
                        const priority = getPriorityBadge(lead);
                        const progress = getStageProgressInfo(lead.stage);
                        const isMenuOpen = activeMenuLeadId === lead.id;
                        const dueDateText = lead.next_follow_up_at
                          ? `Due: ${formatDate(lead.next_follow_up_at)}`
                          : `Created: ${formatDate(lead.created_at)}`;

                        // Deterministic assignees
                        const primaryAssignee = lead.assigned_to_name || "Praveen";
                        const secondaryAssignee =
                          lead.stage === "proposal" || lead.stage === "won" ? "Rahul M." : "Neha G.";
                        const primaryColor = getAvatarColor(primaryAssignee);
                        const secondaryColor = getAvatarColor(secondaryAssignee);

                        // Deterministic counts
                        const attachmentCount = (lead.title.length % 3) + 2;
                        const commentCount = Math.floor((lead.estimated_value / 25000) % 6) + 2;

                        return (
                          <div
                            key={lead.id}
                            draggable
                            onDragStart={() => handleDragStart(lead.id)}
                            onDragEnd={() => {
                              setDraggedLeadId(null);
                              setDragOverStage(null);
                            }}
                            onClick={() => setActiveLead(lead)}
                            className={cn(
                              "group relative p-3.5 rounded-[16px] border bg-white transition-all duration-150 select-none cursor-grab active:cursor-grabbing",
                              draggedLeadId === lead.id
                                ? "opacity-40 scale-95 border-[#FF5A1F] shadow-none"
                                : "border-[#EAE7DF] shadow-[0_2px_6px_rgba(11,13,18,0.03)] hover:shadow-[0_8px_20px_-4px_rgba(11,13,18,0.08)] hover:border-[#D5D0C3]"
                            )}
                          >
                            {/* Row 1: Due Date / Age + Drag Grip Handle + Options Menu */}
                            <div className="flex items-center justify-between text-[11.5px] text-[#6B7280]">
                              <div className="flex items-center gap-1.5 font-normal">
                                <Clock className="h-3.5 w-3.5 text-[#9CA3AF]" />
                                <span>{dueDateText}</span>
                              </div>

                              <div className="flex items-center gap-1">
                                {/* Explicit Drag Handle Affordance */}
                                <span
                                  title="Drag card to move between stages"
                                  className="h-6 w-6 rounded-[6px] text-[#9CA3AF] hover:text-[#12141A] hover:bg-[#F3F1EC] flex items-center justify-center transition-colors cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical className="h-3.5 w-3.5" />
                                </span>

                                {/* Three-dots Context Menu Button */}
                                <div className="relative context-menu-container">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuLeadId(isMenuOpen ? null : lead.id);
                                    }}
                                    className="h-6 w-6 rounded-[6px] hover:bg-[#F3F1EC] text-[#9CA3AF] hover:text-[#111827] flex items-center justify-center transition-colors cursor-pointer"
                                    title="Deal options"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>

                                  {isMenuOpen && (
                                    <div className="absolute right-0 top-7 w-48 rounded-[12px] bg-white border border-[#E6E2D8] shadow-xl p-1.5 z-40 animate-reveal text-[13px]">
                                      {lead.stage !== "won" && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAdvanceStage(lead.id, lead.stage);
                                          }}
                                          className="w-full text-left px-2.5 py-1.5 rounded-[7px] text-[#111827] hover:bg-[#F4F5F7] flex items-center gap-2"
                                        >
                                          <ArrowRight className="h-3.5 w-3.5 text-[#FF5A1F]" />
                                          <span>Advance Stage</span>
                                        </button>
                                      )}

                                      <Link
                                        href={`/app/${orgSlug}/inbox?phone=${encodeURIComponent(lead.contact_phone || "")}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full text-left px-2.5 py-1.5 rounded-[7px] text-[#111827] hover:bg-[#F4F5F7] flex items-center gap-2"
                                      >
                                        <MessageSquare className="h-3.5 w-3.5 text-[#3D5AFE]" />
                                        <span>Open WhatsApp</span>
                                      </Link>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          crmStore.updateLeadStage(orgSlug, lead.id, "won");
                                          setActiveMenuLeadId(null);
                                          setRefreshKey((k) => k + 1);
                                          toast("Deal marked as Won!", { type: "success" });
                                        }}
                                        className="w-full text-left px-2.5 py-1.5 rounded-[7px] text-[#16A34A] hover:bg-[#E8F8F0] flex items-center gap-2"
                                      >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        <span>Mark as Won</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          crmStore.updateLeadStage(orgSlug, lead.id, "lost");
                                          setActiveMenuLeadId(null);
                                          setRefreshKey((k) => k + 1);
                                          toast("Deal marked as Closed Lost", { type: "info" });
                                        }}
                                        className="w-full text-left px-2.5 py-1.5 rounded-[7px] text-[#DC2626] hover:bg-[#FEE2E2] flex items-center gap-2"
                                      >
                                        <XCircle className="h-3.5 w-3.5" />
                                        <span>Mark as Lost</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Row 2: Explicit Project State Pill (Clear state understanding) */}
                            <div className="mt-2.5 flex items-center justify-between gap-1.5">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-[11px] font-medium border flex items-center gap-1.5 truncate",
                                  progress.badgeBg,
                                  progress.badgeText,
                                  progress.badgeBorder
                                )}
                              >
                                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", progress.color)} />
                                <span className="truncate">{progress.stageName}</span>
                              </span>
                              <span className="text-[11px] text-[#878D96] font-medium shrink-0 tabular-nums">
                                {progress.stepLabel}
                              </span>
                            </div>

                            {/* Row 3: Deal Title */}
                            <h4 className="mt-2 text-[14.5px] font-medium text-[#111827] leading-snug line-clamp-1 group-hover:text-[#FF5A1F] transition-colors">
                              {lead.title}
                            </h4>

                            {/* Row 4: Deal Description / Excerpt */}
                            <p className="mt-1 text-[12.5px] text-[#6B7280] leading-relaxed line-clamp-2">
                              {lead.notes || `${lead.source} • Contact: ${lead.contact_name}`}
                            </p>

                            {/* Row 5: Deal Value & 5-Step Segmented Bar */}
                            <div className="mt-3 pt-2.5 border-t border-[#F0ECE2] space-y-1.5">
                              <div className="flex items-center justify-between text-[12.5px]">
                                <span className="text-[#878D96]">Deal Value</span>
                                <span className="font-medium text-[#111827] tabular-nums">
                                  {formatINR(lead.estimated_value)}
                                </span>
                              </div>

                              {/* Segmented Progress Bar (5 clear stages) */}
                              <div className="flex items-center gap-1 w-full h-1.5 pt-0.5">
                                {Array.from({ length: 5 }).map((_, idx) => (
                                  <div
                                    key={idx}
                                    className={cn(
                                      "flex-1 h-full rounded-full transition-all duration-200",
                                      idx < progress.step
                                        ? progress.color
                                        : "bg-[#EAE6DD]"
                                    )}
                                    title={`Pipeline Stage ${idx + 1} of 5`}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Row 6: Assigned to Row */}
                            <div className="mt-2.5 flex items-center justify-between text-[12px]">
                              <span className="text-[#878D96]">Assigned to</span>
                              <div className="flex items-center -space-x-1.5">
                                <div
                                  title={primaryAssignee}
                                  className={cn(
                                    "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium border-2 border-white shadow-2xs select-none",
                                    primaryColor.bg,
                                    primaryColor.text
                                  )}
                                >
                                  {getInitials(primaryAssignee)}
                                </div>
                                <div
                                  title={secondaryAssignee}
                                  className={cn(
                                    "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium border-2 border-white shadow-2xs select-none",
                                    secondaryColor.bg,
                                    secondaryColor.text
                                  )}
                                >
                                  {getInitials(secondaryAssignee)}
                                </div>
                              </div>
                            </div>

                            {/* Row 7: Footer with Priority Pill & 1-Click Advance Button */}
                            <div className="mt-3 pt-2.5 border-t border-[#F0ECE2] flex items-center justify-between gap-2">
                              {/* Priority Pill with Flag */}
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border",
                                  priority.pillClass
                                )}
                              >
                                <Flag className="h-3 w-3" />
                                <span>{priority.label}</span>
                              </span>

                              {/* 1-Click Advance Button or Closed Badge */}
                              {progress.nextStageName ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAdvanceStage(lead.id, lead.stage);
                                  }}
                                  className="px-2.5 py-1 rounded-[7px] bg-[#FAF9F5] hover:bg-[#FF5A1F] text-[#454B57] hover:text-white border border-[#E6E2D8] hover:border-[#FF5A1F] text-[11.5px] font-medium flex items-center gap-1 transition-all duration-150 active:scale-95 group/adv"
                                  style={{
                                    transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
                                  }}
                                  title={`Advance deal to ${progress.nextStageName}`}
                                >
                                  <span>Advance</span>
                                  <ArrowRight className="h-3 w-3 group-hover/adv:translate-x-0.5 transition-transform" />
                                </button>
                              ) : (
                                <span className="text-[11px] text-[#12B886] font-medium flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Closed Won</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {stageLeads.length === 0 && (
                        <div className="h-36 flex flex-col items-center justify-center gap-1 rounded-[16px] border border-dashed border-[#E0DCD2] text-[13px] text-[#8C93A0] bg-white/40">
                          <GripVertical className="h-4 w-4 text-[#CBD5E1]" />
                          <span>Drop deals here</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TABLE VIEW (Dense, Clean, Structured)                                  */}
      {/* ========================================================================= */}
      {viewMode === "table" && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Opportunity</TableHead>
              <TableHead>Client Contact</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Value (INR)</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow
                key={lead.id}
                onClick={() => setActiveLead(lead)}
                className="cursor-pointer"
              >
                <TableCell className="font-medium text-[#12141A]">
                  {lead.title}
                </TableCell>
                <TableCell className="text-[#4B515D]">
                  {lead.contact_name || "Enterprise Lead"} ({lead.contact_phone || "—"})
                </TableCell>
                <TableCell>
                  <StatusPill
                    variant={
                      lead.stage === "won"
                        ? "success"
                        : lead.stage === "lost"
                        ? "danger"
                        : "neutral"
                    }
                    size="sm"
                  >
                    {lead.stage}
                  </StatusPill>
                </TableCell>
                <TableCell className="font-semibold text-[#0A7A53] font-variant-numeric tabular-nums">
                  {formatINR(lead.estimated_value || 0)}
                </TableCell>
                <TableCell className="text-[#666C78]">{lead.source}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveLead(lead);
                    }}
                    className="h-8.5 text-[13px]"
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {leads.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center text-[#6A707C]">
                  No opportunities found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* ========================================================================= */}
      {/* 4. DETAIL DRAWER (Slide-over Record View)                                 */}
      {/* ========================================================================= */}
      <Drawer
        isOpen={!!activeLead}
        onClose={() => setActiveLead(null)}
        title={activeLead?.title || "Opportunity Details"}
        description={`Pipeline Stage: ${activeLead?.stage.toUpperCase()}`}
      >
        <div className="space-y-6">
          <div className="p-4 rounded-[14px] bg-[#F1F3F5] space-y-1.5 border border-[#E2E4E8]">
            <span className="text-[11px] font-medium tracking-[0.06em] text-[#6A707C] uppercase">
              Opportunity Value
            </span>
            <div className="text-[32px] font-semibold text-[#12141A] font-variant-numeric tabular-nums">
              {formatINR(activeLead?.estimated_value || 0)}
            </div>
          </div>

          <div className="space-y-3 text-[13px]">
            <h4 className="text-[11px] font-medium tracking-[0.06em] text-[#6A707C] uppercase">
              Deal Attributes
            </h4>
            <div className="p-3.5 rounded-[12px] border border-[#E4E1D8] bg-white space-y-3">
              <div className="flex items-center justify-between text-[#4B515D]">
                <span>Client Name</span>
                <span className="font-medium text-[#12141A]">
                  {activeLead?.contact_name || "Direct Client"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#4B515D]">
                <span>WhatsApp Phone</span>
                <span className="font-medium text-[#12141A] font-variant-numeric tabular-nums">
                  {activeLead?.contact_phone || "+919876543210"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#4B515D]">
                <span>Lead Source</span>
                <span className="font-medium text-[#12141A]">{activeLead?.source}</span>
              </div>
              <div className="flex items-center justify-between text-[#4B515D]">
                <span>Assigned To</span>
                <span className="font-medium text-[#12141A]">{activeLead?.assigned_to_name || "Workspace Founder"}</span>
              </div>
            </div>
          </div>

          {/* Quick Stage Progression */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-medium tracking-[0.06em] text-[#6A707C] uppercase">
              Move to Stage
            </h4>
            <div className="grid grid-cols-3 gap-1.5">
              {(["new", "contacted", "qualified", "proposal", "won", "lost"] as const).map(
                (stage) => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => {
                      if (activeLead) {
                        crmStore.updateLeadStage(orgSlug, activeLead.id, stage);
                        setActiveLead((prev) => (prev ? { ...prev, stage } : null));
                        setRefreshKey((k) => k + 1);
                        toast(`Moved to ${stage}`, { type: "info" });
                      }
                    }}
                    className={cn(
                      "px-2 py-1.5 rounded-[8px] text-[12px] font-medium capitalize border transition-colors cursor-pointer",
                      activeLead?.stage === stage
                        ? "bg-[#0B0D12] text-white border-transparent"
                        : "bg-white text-[#12141A] border-[#E4E1D8] hover:bg-[#F9F8F6]"
                    )}
                  >
                    {stage}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E4E1D8] flex items-center justify-between">
            <Link
              href={`/app/${orgSlug}/inbox?phone=${encodeURIComponent(activeLead?.contact_phone || "")}`}
            >
              <Button variant="primary" size="sm" className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                <span>Open in WhatsApp</span>
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveLead(null)}
            >
              Close
            </Button>
          </div>
        </div>
      </Drawer>

      {/* ========================================================================= */}
      {/* 5. CREATE OPPORTUNITY MODAL DIALOG                                        */}
      {/* ========================================================================= */}
      <NewOpportunityModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        orgSlug={orgSlug}
        initialStage={initialStage}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      {/* ========================================================================= */}
      {/* 6. INVITE TEAM MEMBER DIALOG                                              */}
      {/* ========================================================================= */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Add a teammate to collaborate on pipeline deals and WhatsApp conversations.
            </DialogDescription>
          </DialogHeader>

          <Input
            label="Teammate Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@roosstudiox.com"
          />

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setInviteModalOpen(false);
                setInviteEmail("");
                toast("Invitation sent successfully!", { type: "success" });
              }}
            >
              Send Invitation
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
}
