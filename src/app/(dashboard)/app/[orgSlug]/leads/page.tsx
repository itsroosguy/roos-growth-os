"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useTenant } from "@/lib/organizations/tenant-context";
import { crmStore } from "@/lib/crm/crm-store";
import { teamStore } from "@/lib/team/team-store";
import { Lead, LeadStage, Contact, Task, TaskPriority } from "@/types/crm";
import { leadQualificationStore } from "@/lib/ai/lead-qualification-store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useMounted } from "@/lib/use-mounted";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
  TrendingUp,
  DollarSign,
  Award,
  Copy,
  PhoneCall,
  CheckSquare,
  Star,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-context";

// ============================================================================
// STAGE DEFINITIONS & ROOS STUDIOX GROWTH OS COLOR SYSTEM
// ============================================================================

interface StageConfig {
  id: LeadStage;
  title: string;
  dotColor: string;
  barColor: string;
  pillColor: string;
  badgeVariant: "orange" | "orangeSubtle" | "dark" | "success" | "warning" | "danger" | "purple" | "default" | "secondary";
}

const STAGES: StageConfig[] = [
  {
    id: "new",
    title: "New Inquiry",
    dotColor: "bg-[#FF7900]",
    barColor: "bg-[#FF7900]",
    pillColor: "bg-[#FFF4EC] text-[#FF7900] border-[#FF7900]/30",
    badgeVariant: "orangeSubtle",
  },
  {
    id: "contacted",
    title: "Contacted",
    dotColor: "bg-amber-500",
    barColor: "bg-amber-500",
    pillColor: "bg-amber-50 text-amber-800 border-amber-200",
    badgeVariant: "warning",
  },
  {
    id: "qualified",
    title: "Qualified",
    dotColor: "bg-purple-600",
    barColor: "bg-purple-600",
    pillColor: "bg-purple-50 text-purple-800 border-purple-200",
    badgeVariant: "purple",
  },
  {
    id: "proposal",
    title: "Proposal Sent",
    dotColor: "bg-[#FF7900]",
    barColor: "bg-[#FF7900]",
    pillColor: "bg-[#FFF4EC] text-[#FF7900] border-[#FF7900]/30",
    badgeVariant: "orangeSubtle",
  },
  {
    id: "won",
    title: "Deals Won",
    dotColor: "bg-emerald-500",
    barColor: "bg-emerald-500",
    pillColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    badgeVariant: "success",
  },
  {
    id: "lost",
    title: "Closed Lost",
    dotColor: "bg-rose-500",
    barColor: "bg-rose-500",
    pillColor: "bg-rose-50 text-rose-800 border-rose-200",
    badgeVariant: "danger",
  },
];

export default function LeadsPage() {
  const { currentOrg, isAdmin } = useTenant();
  const orgSlug = currentOrg.slug;
  const mounted = useMounted();
  const { toast } = useToast();

  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<"board" | "table">("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [quickFilter, setQuickFilter] = useState<"all" | "starred" | "high_value" | "needs_action" | "won">("all");

  // Multi-select state for bulk actions
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());

  // In-drawer edit state
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [editValueInput, setEditValueInput] = useState("");

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
  const [activeTab, setActiveTab] = useState<"details" | "tasks" | "timeline" | "ai">("details");

  // Quick Task Creation inside Drawer State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("medium");
  const [taskFormOpen, setTaskFormOpen] = useState(false);

  // Lost Reason Modal State
  const [lostReasonModalOpen, setLostReasonModalOpen] = useState(false);
  const [leadToLose, setLeadToLose] = useState<Lead | null>(null);
  const [lostReasonText, setLostReasonText] = useState("Price too high");

  // AI assessment state
  const [assessingLead, setAssessingLead] = useState(false);
  const [assessmentFeedback, setAssessmentFeedback] = useState<string | null>(null);

  // Copy feedback state
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Data queries
  const leads = useMemo(() => {
    return crmStore.getLeads(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  const contacts = useMemo(() => {
    return crmStore.getContacts(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  const tasks = useMemo(() => {
    return crmStore.getTasks(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  const teamMembers = useMemo(() => {
    return teamStore.getTeamMembers(orgSlug);
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

  // Extract unique sources
  const uniqueSources = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.source) set.add(l.source);
    });
    return Array.from(set);
  }, [leads]);

  // High-level pipeline metrics for summary bar
  const pipelineMetrics = useMemo(() => {
    let totalVal = 0;
    let wonVal = 0;
    let wonCount = 0;
    let closedCount = 0;

    leads.forEach((l) => {
      if (l.stage !== "lost") {
        totalVal += l.estimated_value;
      }
      if (l.stage === "won") {
        wonVal += l.estimated_value;
        wonCount++;
        closedCount++;
      } else if (l.stage === "lost") {
        closedCount++;
      }
    });

    const winRate =
      closedCount > 0
        ? Math.round((wonCount / closedCount) * 100)
        : leads.length > 0
        ? Math.round((wonCount / leads.length) * 100)
        : 0;

    return {
      totalLeads: leads.length,
      activeValue: totalVal,
      wonValue: wonVal,
      winRate,
    };
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
      const matchesSource = sourceFilter === "all" || l.source === sourceFilter;
      const matchesOwner = ownerFilter === "all" || l.assigned_to_name === ownerFilter;

      let matchesQuick = true;
      if (quickFilter === "starred") {
        matchesQuick = starredIds.has(l.id);
      } else if (quickFilter === "high_value") {
        matchesQuick = l.estimated_value >= 100000;
      } else if (quickFilter === "needs_action") {
        matchesQuick = !!l.next_follow_up_at;
      } else if (quickFilter === "won") {
        matchesQuick = l.stage === "won";
      }

      return matchesQuery && matchesStage && matchesSource && matchesOwner && matchesQuick;
    });
  }, [leads, searchQuery, stageFilter, ownerFilter, quickFilter, starredIds]);

  // Tasks associated with active lead
  const activeLeadTasks = useMemo(() => {
    if (!activeLead) return [];
    return tasks.filter((t) => t.lead_id === activeLead.id || t.contact_id === activeLead.contact_id);
  }, [tasks, activeLead]);

  // Handlers
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedContactId) return;

    const contact = contacts.find((c) => c.id === selectedContactId);
    if (!contact) return;

    const newLead = crmStore.createLead(orgSlug, {
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

    setTitle("");
    setSelectedContactId("");
    setDealValue("50000");
    setNotes("");
    setCreateModalOpen(false);
    setRefreshKey((k) => k + 1);
    setActiveLead(newLead);
    toast("Opportunity created!", {
      message: `${newLead.title} added to pipeline`,
      type: "success",
    });
  };

  const toggleStar = (lead: Lead, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setStarredIds((prev) => {
      const next = new Set(prev);
      const wasStarred = next.has(lead.id);
      if (wasStarred) {
        next.delete(lead.id);
        toast("Removed from Starred", { message: lead.title, type: "info" });
      } else {
        next.add(lead.id);
        toast("Starred deal ⭐", { message: lead.title, type: "success" });
      }
      return next;
    });
  };

  const handleAdvanceStage = (lead: Lead, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const stageOrder: LeadStage[] = ["new", "contacted", "qualified", "proposal", "won"];
    const idx = stageOrder.indexOf(lead.stage);
    if (idx < 0 || idx >= stageOrder.length - 1) {
      toast("Already at final stage", { message: lead.title, type: "info" });
      return;
    }
    const nextStage = stageOrder[idx + 1];
    handleStageChange(lead, nextStage);
    toast(`Advanced to ${STAGES.find((s) => s.id === nextStage)?.title}!`, {
      message: `${lead.title} moved forward`,
      type: "success",
    });
  };

  const handleBulkWon = () => {
    if (selectedLeadIds.size === 0) return;
    selectedLeadIds.forEach((id) => {
      crmStore.updateLeadStage(orgSlug, id, "won");
    });
    setRefreshKey((k) => k + 1);
    toast(`Marked ${selectedLeadIds.size} deals as Won! 🏆`, {
      message: "Revenue pipeline updated",
      type: "success",
    });
    setSelectedLeadIds(new Set());
  };

  const handleBulkAdvance = () => {
    if (selectedLeadIds.size === 0) return;
    const stageOrder: LeadStage[] = ["new", "contacted", "qualified", "proposal", "won"];
    let moved = 0;
    selectedLeadIds.forEach((id) => {
      const lead = leads.find((l) => l.id === id);
      if (lead) {
        const idx = stageOrder.indexOf(lead.stage);
        if (idx >= 0 && idx < stageOrder.length - 1) {
          crmStore.updateLeadStage(orgSlug, id, stageOrder[idx + 1]);
          moved++;
        }
      }
    });
    setRefreshKey((k) => k + 1);
    toast(`Advanced ${moved} deals forward! 🚀`, {
      type: "success",
    });
    setSelectedLeadIds(new Set());
  };

  const handleQuickUpdateValue = () => {
    if (!activeLead) return;
    const newVal = parseFloat(editValueInput);
    if (isNaN(newVal) || newVal < 0) return;
    const updated = crmStore.updateLead(orgSlug, activeLead.id, {
      estimated_value: newVal,
    });
    setIsEditingValue(false);
    setRefreshKey((k) => k + 1);
    if (updated) {
      setActiveLead(updated);
      toast("Deal value updated", {
        message: `${updated.title}: ${formatCurrency(updated.estimated_value)}`,
        type: "success",
      });
    }
  };

  const handleStageChange = (lead: Lead, newStage: LeadStage) => {
    if (newStage === "lost") {
      setLeadToLose(lead);
      setLostReasonModalOpen(true);
      return;
    }

    const updated = crmStore.updateLeadStage(orgSlug, lead.id, newStage);
    setRefreshKey((k) => k + 1);

    if (activeLead && activeLead.id === lead.id && updated) {
      setActiveLead(updated);
    }
    toast(`Stage changed to ${STAGES.find((s) => s.id === newStage)?.title}`, {
      message: lead.title,
      type: "success",
    });
  };

  const handleConfirmLost = () => {
    if (!leadToLose) return;
    const updated = crmStore.updateLeadStage(orgSlug, leadToLose.id, "lost", lostReasonText);
    setLostReasonModalOpen(false);
    setLeadToLose(null);
    setRefreshKey((k) => k + 1);

    if (activeLead && activeLead.id === leadToLose.id && updated) {
      setActiveLead(updated);
    }
  };

  const handleOwnerChange = (newOwnerName: string) => {
    if (!activeLead) return;
    const updated = crmStore.updateLead(orgSlug, activeLead.id, {
      assigned_to_name: newOwnerName === "unassigned" ? undefined : newOwnerName,
    });
    setRefreshKey((k) => k + 1);
    if (updated) setActiveLead(updated);
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Assessment failed";
      setAssessmentFeedback(msg);
    } finally {
      setAssessingLead(false);
    }
  };

  const handleCreateTaskForLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead || !newTaskTitle.trim()) return;

    crmStore.createTask(orgSlug, {
      contact_id: activeLead.contact_id,
      contact_name: activeLead.contact_name,
      lead_id: activeLead.id,
      lead_title: activeLead.title,
      assigned_to_name: activeLead.assigned_to_name || "Workspace Founder",
      title: newTaskTitle.trim(),
      description: `Follow-up for opportunity: ${activeLead.title}`,
      due_date: new Date(newTaskDueDate).toISOString(),
      priority: newTaskPriority,
      status: "todo",
    });

    setNewTaskTitle("");
    setTaskFormOpen(false);
    setRefreshKey((k) => k + 1);
  };

  const handleToggleTaskStatus = (task: Task) => {
    const nextStatus = task.status === "completed" ? "todo" : "completed";
    crmStore.updateTaskStatus(orgSlug, task.id, nextStatus);
    setRefreshKey((k) => k + 1);
  };

  const copyPhoneNumber = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const activeQualification = activeLead
    ? leadQualificationStore.getQualificationForLead(orgSlug, activeLead.id)
    : null;

  const isAllSelected =
    filteredLeads.length > 0 && filteredLeads.every((l) => selectedLeadIds.has(l.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filteredLeads.map((l) => l.id)));
    }
  };

  const toggleSelectLead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* PAGE HEADER & TOP CONTROLS                                            */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0D0D0E]">
              Leads &amp; Opportunities
            </h1>
            <span
              suppressHydrationWarning
              className="rounded-full bg-[#FFF4EC] border border-[#FF7900]/30 text-xs sm:text-sm font-semibold px-3.5 py-1 text-[#FF7900] shadow-2xs font-mono"
            >
              {filteredLeads.length} {filteredLeads.length === 1 ? "deal" : "deals"}
            </span>
          </div>
          <p className="text-sm text-[#525866] font-normal">
            Commercial pipeline management, deal progression, and conversion tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Board / Table View Toggle */}
          <div className="flex items-center rounded-xl bg-[#F7F7F8] p-1 border border-[#E5E7EB] shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                viewMode === "board"
                  ? "bg-[#0D0D0E] text-white shadow-xs font-semibold"
                  : "text-[#525866] hover:text-[#0D0D0E]"
              }`}
              title="Kanban Board View"
            >
              <Kanban className="h-4 w-4" />
              <span>Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-[#0D0D0E] text-white shadow-xs font-semibold"
                  : "text-[#525866] hover:text-[#0D0D0E]"
              }`}
              title="List Table View"
            >
              <TableIcon className="h-4 w-4" />
              <span>Table</span>
            </button>
          </div>

          {/* New Lead Action Button */}
          <Button
            onClick={() => setCreateModalOpen(true)}
            size="default"
            className="shadow-xs bg-[#FF7900] hover:bg-[#E66D00] text-white font-medium rounded-xl flex items-center gap-2 h-10 px-4 cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>New Lead</span>
          </Button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MINI COMMAND STATS BANNER                                             */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex items-center justify-between interactive-hover-card">
          <div>
            <span className="text-[11px] font-semibold text-[#525866] uppercase tracking-wider block">
              Active Pipeline
            </span>
            <span
              suppressHydrationWarning
              className="text-2xl font-semibold font-mono tracking-tight text-[#0D0D0E] mt-1 block"
            >
              {mounted ? formatCurrency(pipelineMetrics.activeValue) : "₹0"}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#FFF4EC] text-[#FF7900] flex items-center justify-center shrink-0 border border-[#FFE1CC]">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex items-center justify-between interactive-hover-card">
          <div>
            <span className="text-[11px] font-semibold text-[#525866] uppercase tracking-wider block">
              Total Opportunities
            </span>
            <span
              suppressHydrationWarning
              className="text-2xl font-semibold font-mono tracking-tight text-[#0D0D0E] mt-1 block"
            >
              {mounted ? pipelineMetrics.totalLeads : 0}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex items-center justify-between interactive-hover-card">
          <div>
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
              Deals Won
            </span>
            <span
              suppressHydrationWarning
              className="text-2xl font-semibold font-mono tracking-tight text-emerald-600 mt-1 block"
            >
              {mounted ? formatCurrency(pipelineMetrics.wonValue) : "₹0"}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <Award className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex items-center justify-between interactive-hover-card">
          <div>
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
              Win Rate
            </span>
            <span
              suppressHydrationWarning
              className="text-2xl font-semibold font-mono tracking-tight text-amber-600 mt-1 block"
            >
              {mounted ? `${pipelineMetrics.winRate}%` : "0%"}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* INTERACTIVE QUICK FILTER PILLS                                        */}
      {/* ===================================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setQuickFilter("all")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 ${
            quickFilter === "all"
              ? "bg-[#0D0D0E] text-white shadow-xs"
              : "bg-white border border-[#E5E5E7] text-[#0D0D0E] hover:bg-[#F7F7F8]"
          }`}
        >
          <span>All Deals</span>
          <span className="font-mono text-[11px] opacity-80">({leads.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setQuickFilter("starred")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 ${
            quickFilter === "starred"
              ? "bg-[#24180E] text-[#FF7900] border border-[#FF7900]/40 shadow-xs"
              : "bg-white border border-[#E5E5E7] text-[#0D0D0E] hover:bg-[#F7F7F8]"
          }`}
        >
          <Star className="h-3.5 w-3.5 fill-current text-amber-400" />
          <span>Starred</span>
          <span className="font-mono text-[11px] opacity-80">({starredIds.size})</span>
        </button>
        <button
          type="button"
          onClick={() => setQuickFilter("high_value")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 ${
            quickFilter === "high_value"
              ? "bg-[#24180E] text-[#FF7900] border border-[#FF7900]/40 shadow-xs"
              : "bg-white border border-[#E5E5E7] text-[#0D0D0E] hover:bg-[#F7F7F8]"
          }`}
        >
          <span>🔥 High Value (≥ ₹1L)</span>
          <span className="font-mono text-[11px] opacity-80">
            ({leads.filter((l) => l.estimated_value >= 100000).length})
          </span>
        </button>
        <button
          type="button"
          onClick={() => setQuickFilter("needs_action")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 ${
            quickFilter === "needs_action"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-white border border-[#E5E5E7] text-[#0D0D0E] hover:bg-[#F7F7F8]"
          }`}
        >
          <span>⏰ Needs Action</span>
          <span className="font-mono text-[11px] opacity-80">
            ({leads.filter((l) => !!l.next_follow_up_at).length})
          </span>
        </button>
        <button
          type="button"
          onClick={() => setQuickFilter("won")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 ${
            quickFilter === "won"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white border border-[#E5E5E7] text-[#0D0D0E] hover:bg-[#F7F7F8]"
          }`}
        >
          <span>🏆 Closed Won</span>
          <span className="font-mono text-[11px] opacity-80">
            ({leads.filter((l) => l.stage === "won").length})
          </span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* FILTER TOOLBAR                                                        */}
      {/* ===================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-[#E5E5E7] bg-white shadow-2xs">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[240px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93]" />
            <input
              type="text"
              placeholder="Search by deal title, customer, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] text-[#0D0D0E] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] focus:bg-white shadow-xs transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#0D0D0E] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm">
            <span className="text-[#8E8E93] font-semibold hidden sm:inline">Source:</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] text-xs sm:text-sm font-semibold text-[#0D0D0E] focus:outline-none focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] focus:bg-white shadow-xs cursor-pointer"
            >
              <option value="all">All Sources</option>
              {uniqueSources.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>

          {/* Stage Filter */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm">
            <span className="text-[#8E8E93] font-semibold hidden sm:inline">Stage:</span>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] text-xs sm:text-sm font-semibold text-[#0D0D0E] focus:outline-none focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] focus:bg-white shadow-xs cursor-pointer"
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
            <div className="flex items-center gap-1.5 text-xs sm:text-sm">
              <span className="text-[#8E8E93] font-semibold hidden sm:inline">Owner:</span>
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] text-xs sm:text-sm font-semibold text-[#0D0D0E] focus:outline-none focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] focus:bg-white shadow-xs cursor-pointer"
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
        {(searchQuery || stageFilter !== "all" || sourceFilter !== "all" || ownerFilter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setStageFilter("all");
              setSourceFilter("all");
              setOwnerFilter("all");
            }}
            className="text-xs sm:text-sm font-semibold text-[#FF7900] hover:text-[#E66D00] transition-colors cursor-pointer px-3.5 py-2 rounded-xl bg-[#FFF4EC] border border-[#FF7900]/30 shadow-2xs"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* ===================================================================== */}
      {/* KANBAN BOARD VIEW                                                     */}
      {/* ===================================================================== */}
      {viewMode === "board" ? (
        <div className="flex gap-4.5 overflow-x-auto pb-6 items-start min-h-[580px]">
          {STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.stage === stage.id);
            const stageValue = stageLeads.reduce((acc, curr) => acc + curr.estimated_value, 0);

            return (
              <div
                key={stage.id}
                className="w-80 shrink-0 rounded-2xl bg-[#F7F7F8] border border-[#E5E5E7] p-3.5 flex flex-col space-y-3 shadow-2xs"
              >
                {/* Stage Header */}
                <div className="space-y-2">
                  <div className={`h-1.5 w-full rounded-full ${stage.barColor}`} />
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${stage.dotColor}`} />
                      <span className="font-semibold text-xs sm:text-sm uppercase tracking-wider text-[#0D0D0E]">
                        {stage.title}
                      </span>
                      <span
                        suppressHydrationWarning
                        className="px-2 py-0.5 rounded-full bg-white border border-[#E5E5E7] text-xs font-mono font-semibold text-[#0D0D0E] shadow-2xs"
                      >
                        {stageLeads.length}
                      </span>
                    </div>

                    {stageValue > 0 && (
                      <span
                        suppressHydrationWarning
                        className="text-xs font-mono font-semibold text-[#0D0D0E]"
                      >
                        {formatCurrency(stageValue)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Cards List in Stage */}
                <div className="space-y-3 min-h-[140px]">
                  {stageLeads.length === 0 ? (
                    <div className="p-8 text-center rounded-xl border border-dashed border-[#E5E5E7] bg-white/50 text-xs sm:text-sm text-[#8E8E93] font-medium">
                      No deals in {stage.title}
                    </div>
                  ) : (
                    stageLeads.map((lead) => {
                      const hasFollowUp = !!lead.next_follow_up_at;
                      const isFollowUpOverdue =
                        hasFollowUp &&
                        new Date(lead.next_follow_up_at!) < new Date(Date.now() - 3600000);
                      const isStarred = starredIds.has(lead.id);

                      return (
                        <div
                          key={lead.id}
                          onClick={() => setActiveLead(lead)}
                          className="group relative rounded-xl border border-[#E5E5E7] bg-white p-4 shadow-xs hover:border-[#FF7900] hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-left space-y-3"
                        >
                          {/* Card Top: Star, Title & Source */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-1.5 flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={(e) => toggleStar(lead, e)}
                                className="p-0.5 -ml-0.5 text-[#8E8E93] hover:text-amber-500 transition-colors cursor-pointer shrink-0 mt-0.5"
                                title={isStarred ? "Remove Star" : "Star deal"}
                              >
                                <Star
                                  className={`h-4 w-4 transition-transform active:scale-125 ${
                                    isStarred
                                      ? "fill-amber-400 text-amber-500"
                                      : "text-[#8E8E93] hover:text-amber-400"
                                  }`}
                                />
                              </button>
                              <h4 className="text-sm font-semibold text-[#0D0D0E] group-hover:text-[#FF7900] transition-colors line-clamp-2 leading-snug">
                                {lead.title}
                              </h4>
                            </div>
                            <span className="shrink-0 text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#F7F7F8] text-[#8E8E93] border border-[#E5E5E7] shadow-2xs font-semibold">
                              {lead.source}
                            </span>
                          </div>

                          {/* Contact & Company */}
                          <div className="flex items-center justify-between text-xs text-[#0D0D0E] pt-0.5">
                            <div className="flex items-center gap-2 truncate">
                              <div className="h-5 w-5 rounded-full bg-[#FFF4EC] text-[#FF7900] border border-[#FF7900]/30 font-semibold text-[10px] flex items-center justify-center shrink-0">
                                {lead.contact_name ? lead.contact_name[0] : "L"}
                              </div>
                              <span className="truncate font-semibold text-[#0D0D0E]">{lead.contact_name}</span>
                            </div>

                            {/* Direct WhatsApp Jump Link */}
                            <Link
                              href={`/app/${orgSlug}/inbox?phone=${lead.contact_phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors shadow-2xs shrink-0 flex items-center gap-1 text-[11px] font-medium px-2"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="h-3 w-3" />
                              <span>Chat</span>
                            </Link>
                          </div>

                          {/* Card Bottom: Deal Value, Follow-up & Quick Advance */}
                          <div className="flex items-center justify-between pt-3 border-t border-[#F0F0F2] text-xs">
                            <div className="space-y-0.5">
                              <span
                                suppressHydrationWarning
                                className="font-mono font-semibold text-[#0D0D0E] text-base block"
                              >
                                {formatCurrency(lead.estimated_value)}
                              </span>

                              {hasFollowUp ? (
                                <div
                                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md ${
                                    isFollowUpOverdue
                                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                                      : "bg-amber-100 text-amber-800 border border-amber-300"
                                  }`}
                                  title={formatDate(lead.next_follow_up_at!)}
                                >
                                  <Clock className="h-3 w-3" />
                                  <span>{isFollowUpOverdue ? "Overdue" : "Due Soon"}</span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-[#8E8E93] font-semibold block">
                                  {lead.assigned_to_name ? lead.assigned_to_name.split(" ")[0] : "Unassigned"}
                                </span>
                              )}
                            </div>

                            {lead.stage !== "won" && lead.stage !== "lost" && (
                              <button
                                type="button"
                                onClick={(e) => handleAdvanceStage(lead, e)}
                                className="p-1.5 px-2.5 rounded-xl bg-[#FFF4EC] hover:bg-[#FF7900] text-[#FF7900] hover:text-white border border-[#FF7900]/30 transition-all font-semibold text-xs flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                                title="Advance to next stage"
                              >
                                <span>Next</span>
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Column bottom dashed + Add Lead button */}
                <button
                  type="button"
                  onClick={() => {
                    setInitialStage(stage.id);
                    setCreateModalOpen(true);
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-dashed border-[#D1D5DB] hover:border-[#FF7900] bg-white/60 hover:bg-white text-xs font-semibold text-[#8E8E93] hover:text-[#FF7900] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs group mt-1"
                >
                  <Plus className="h-3.5 w-3.5 group-hover:scale-110 transition-transform text-[#FF7900]" />
                  <span>Add Lead</span>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* ===================================================================== */
        /* TABLE LIST VIEW                                                       */
        /* ===================================================================== */
        <div className="rounded-2xl border border-[#E5E5E7] bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F7F7F8] border-b border-[#E5E5E7] text-[#8E8E93] uppercase font-mono text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="rounded border-[#E5E5E7] text-[#FF7900] focus:ring-[#FF7900] cursor-pointer h-4 w-4"
                      aria-label="Select all deals"
                    />
                  </th>
                  <th className="py-3.5 px-4 font-semibold">Deal / Opportunity</th>
                  <th className="py-3.5 px-4 font-semibold">Contact</th>
                  <th className="py-3.5 px-4 font-semibold">Stage</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Value</th>
                  <th className="py-3.5 px-4 font-semibold">Assigned Owner</th>
                  <th className="py-3.5 px-4 font-semibold">Follow-Up</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F2]">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#8E8E93] font-medium">
                      No matching sales leads found.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const stageConfig = STAGES.find((s) => s.id === lead.stage)!;
                    const isStarred = starredIds.has(lead.id);
                    const isSelected = selectedLeadIds.has(lead.id);

                    return (
                      <tr
                        key={lead.id}
                        onClick={() => setActiveLead(lead)}
                        className={`hover:bg-[#FFF4EC]/20 transition-colors cursor-pointer group ${
                          isSelected ? "bg-[#FFF4EC]/40" : ""
                        }`}
                      >
                        <td
                          className="py-3.5 px-4 text-center"
                          onClick={(e) => toggleSelectLead(lead.id, e)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-[#E5E5E7] text-[#FF7900] focus:ring-[#FF7900] cursor-pointer h-4 w-4"
                            aria-label={`Select ${lead.title}`}
                          />
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#0D0D0E]">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => toggleStar(lead, e)}
                              className="text-[#8E8E93] hover:text-amber-500 transition-colors cursor-pointer shrink-0"
                              title={isStarred ? "Remove Star" : "Star deal"}
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  isStarred
                                    ? "fill-amber-400 text-amber-500"
                                    : "text-[#8E8E93] hover:text-amber-400"
                                }`}
                              />
                            </button>
                            <div>
                              <div className="group-hover:text-[#FF7900] transition-colors">
                                {lead.title}
                              </div>
                              <span className="text-[11px] font-mono text-[#8E8E93] font-normal">
                                {lead.source}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#0D0D0E]">
                          <div className="font-semibold text-[#0D0D0E]">{lead.contact_name}</div>
                          <div className="text-[11px] text-[#8E8E93] font-mono font-medium">
                            {lead.contact_phone}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${stageConfig.pillColor}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${stageConfig.dotColor}`} />
                            {stageConfig.title}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-[#0D0D0E] text-right text-sm">
                          {formatCurrency(lead.estimated_value)}
                        </td>
                        <td className="py-3.5 px-4 text-[#0D0D0E] font-semibold">
                          {lead.assigned_to_name || (
                            <span className="text-[#8E8E93] font-normal">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-[#8E8E93] text-xs font-medium">
                          {lead.next_follow_up_at ? formatDate(lead.next_follow_up_at) : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {lead.stage !== "won" && lead.stage !== "lost" && (
                              <button
                                type="button"
                                onClick={(e) => handleAdvanceStage(lead, e)}
                                className="p-1.5 px-2 rounded-xl bg-[#FFF4EC] hover:bg-[#FF7900] text-[#FF7900] hover:text-white border border-[#FF7900]/30 transition-all font-semibold text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                                title="Advance Stage"
                              >
                                <span>Next</span>
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                            <Link
                              href={`/app/${orgSlug}/inbox?phone=${lead.contact_phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors shadow-2xs"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveLead(lead);
                              }}
                              className="p-1.5 rounded-xl text-[#8E8E93] hover:text-[#FF7900] hover:bg-[#FFF4EC] transition-colors cursor-pointer"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
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
      {/* FLOATING BULK ACTIONS TOOLBAR                                         */}
      {/* ===================================================================== */}
      {selectedLeadIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#121214] text-white px-5 py-3 rounded-2xl shadow-2xl border border-[#1F1F23] flex items-center gap-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF7900] animate-pulse" />
            <span className="font-semibold text-sm font-mono text-white">
              {selectedLeadIds.size} {selectedLeadIds.size === 1 ? "deal" : "deals"} selected
            </span>
          </div>
          <div className="h-4 w-px bg-[#2A2A30]" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkAdvance}
              className="px-3.5 py-1.5 rounded-xl bg-[#FF7900] hover:bg-[#E66D00] text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
            >
              <span>Advance Stage</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleBulkWon}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
            >
              <Award className="h-3.5 w-3.5" />
              <span>Mark Won</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedLeadIds(new Set())}
              className="px-2.5 py-1.5 rounded-xl bg-[#1C1C1F] hover:bg-[#2A2A30] text-[#8E8E93] hover:text-white font-medium text-xs cursor-pointer ml-1"
            >
              Clear
            </button>
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
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setActiveLead(null)}
          />

          {/* Drawer Sheet */}
          <div className="relative z-50 w-full max-w-lg h-full bg-white border-l border-[#E5E5E7] shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#E5E5E7] flex items-start justify-between gap-4 bg-[#F7F7F8]">
              <div className="space-y-1.5 flex-1 min-w-0">
                <span className="text-[11px] font-mono font-medium text-[#8E8E93] uppercase tracking-wider block">
                  OPPORTUNITY OVERVIEW
                </span>
                <h3 className="text-xl font-semibold text-[#0D0D0E] leading-snug truncate">
                  {activeLead.title}
                </h3>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-[#8E8E93] font-semibold">Stage:</span>
                  <select
                    value={activeLead.stage}
                    onChange={(e) => handleStageChange(activeLead, e.target.value as LeadStage)}
                    className="px-3 py-1 rounded-xl text-xs font-semibold bg-white border border-[#E5E5E7] text-[#0D0D0E] shadow-2xs focus:outline-none focus:border-[#FF7900] cursor-pointer"
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
                className="p-2 rounded-xl text-[#8E8E93] hover:text-[#0D0D0E] hover:bg-[#E5E5E7]/50 transition-colors cursor-pointer shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Tabs */}
            <div className="flex border-b border-[#E5E5E7] px-5 bg-white">
              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === "details"
                    ? "border-[#FF7900] text-[#FF7900]"
                    : "border-transparent text-[#8E8E93] hover:text-[#0D0D0E]"
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("tasks")}
                className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "tasks"
                    ? "border-[#FF7900] text-[#FF7900]"
                    : "border-transparent text-[#8E8E93] hover:text-[#0D0D0E]"
                }`}
              >
                <span>Follow-ups</span>
                <span className="px-1.5 py-0.2 rounded-full text-[11px] font-mono font-semibold bg-[#F7F7F8] text-[#0D0D0E]">
                  {activeLeadTasks.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("timeline")}
                className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === "timeline"
                    ? "border-[#FF7900] text-[#FF7900]"
                    : "border-transparent text-[#8E8E93] hover:text-[#0D0D0E]"
                }`}
              >
                Timeline
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ai")}
                className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "ai"
                    ? "border-[#FF7900] text-[#FF7900]"
                    : "border-transparent text-[#8E8E93] hover:text-[#0D0D0E]"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-[#FF7900]" />
                <span>Qualification</span>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-[#F7F7F8]/50">
              {/* TAB 1: OVERVIEW */}
              {activeTab === "details" && (
                <div className="space-y-5">
                  {/* Deal Value Card */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E5E5E7] shadow-xs flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between pr-2">
                        <span className="text-[11px] font-mono text-[#8E8E93] uppercase tracking-wider block font-medium">
                          ESTIMATED DEAL VALUE
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (!isEditingValue) {
                              setEditValueInput(activeLead.estimated_value.toString());
                              setIsEditingValue(true);
                            } else {
                              setIsEditingValue(false);
                            }
                          }}
                          className="text-xs font-semibold text-[#FF7900] hover:text-[#E66D00] cursor-pointer"
                        >
                          {isEditingValue ? "Cancel" : "Edit Value"}
                        </button>
                      </div>
                      {isEditingValue ? (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="number"
                            value={editValueInput}
                            onChange={(e) => setEditValueInput(e.target.value)}
                            className="w-36 px-2.5 py-1 rounded-lg border border-[#FF7900] bg-white font-mono font-semibold text-[#0D0D0E] text-sm focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleQuickUpdateValue}
                            className="px-3 py-1 bg-[#FF7900] hover:bg-[#E66D00] text-white text-xs font-semibold rounded-lg cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <span className="text-2xl font-mono font-semibold text-[#0D0D0E] block mt-0.5">
                          {formatCurrency(activeLead.estimated_value)}
                        </span>
                      )}
                    </div>
                    {!isEditingValue && (
                      <span className="px-3 py-1 rounded-xl bg-[#F7F7F8] border border-[#E5E5E7] text-xs font-semibold font-mono text-[#0D0D0E]">
                        {activeLead.currency}
                      </span>
                    )}
                  </div>

                  {/* Associated Contact */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-mono font-medium text-[#8E8E93] uppercase tracking-wider block">
                      ASSOCIATED CUSTOMER
                    </span>
                    <div className="p-4 rounded-2xl bg-white border border-[#E5E5E7] shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-base text-[#0D0D0E] block">
                            {activeLead.contact_name}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-[#8E8E93] mt-0.5">
                            <span className="font-mono font-semibold text-[#0D0D0E]">{activeLead.contact_phone}</span>
                            <button
                              type="button"
                              onClick={() => copyPhoneNumber(activeLead.contact_phone)}
                              className="text-[#8E8E93] hover:text-[#0D0D0E] transition-colors"
                              title="Copy Phone"
                            >
                              {copiedPhone ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* WhatsApp Inbox Jump Action */}
                        <Link
                          href={`/app/${orgSlug}/inbox?phone=${activeLead.contact_phone}`}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-all"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Open Chat</span>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Key Metadata Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-white border border-[#E5E5E7] shadow-xs">
                      <span className="text-[#8E8E93] block font-mono text-[10px] uppercase font-medium">
                        Lead Source
                      </span>
                      <span className="font-semibold text-[#0D0D0E] mt-1 block">
                        {activeLead.source}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-[#E5E5E7] shadow-xs">
                      <span className="text-[#8E8E93] block font-mono text-[10px] uppercase font-medium">
                        Assigned Owner
                      </span>
                      <select
                        value={activeLead.assigned_to_name || "unassigned"}
                        onChange={(e) => handleOwnerChange(e.target.value)}
                        className="w-full mt-1 px-2 py-1 rounded-lg text-xs font-semibold bg-[#F7F7F8] border border-[#E5E5E7] text-[#0D0D0E] focus:outline-none focus:border-[#FF7900]"
                      >
                        <option value="unassigned">Unassigned</option>
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-[#E5E5E7] shadow-xs">
                      <span className="text-[#8E8E93] block font-mono text-[10px] uppercase font-medium">
                        Next Follow-Up
                      </span>
                      <span className="font-semibold text-[#0D0D0E] mt-1 block">
                        {activeLead.next_follow_up_at
                          ? formatDate(activeLead.next_follow_up_at)
                          : "Not Scheduled"}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-[#E5E5E7] shadow-xs">
                      <span className="text-[#8E8E93] block font-mono text-[10px] uppercase font-medium">
                        Created
                      </span>
                      <span className="font-semibold text-[#0D0D0E] mt-1 block">
                        {formatDate(activeLead.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-mono font-medium text-[#8E8E93] uppercase tracking-wider block">
                      DEAL NOTES &amp; CLIENT BRIEF
                    </span>
                    <div className="p-4 rounded-2xl bg-white border border-[#E5E5E7] text-xs sm:text-sm text-[#0D0D0E] leading-relaxed min-h-[80px] shadow-xs">
                      {activeLead.notes || "No additional notes recorded for this lead yet."}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TASKS & FOLLOW-UPS */}
              {activeTab === "tasks" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-[#8E8E93] uppercase tracking-wider block">
                      LINKED FOLLOW-UPS
                    </span>
                    <Button
                      size="sm"
                      onClick={() => setTaskFormOpen(!taskFormOpen)}
                      className="h-8 text-xs font-semibold bg-[#FF7900] hover:bg-[#E66D00] text-white rounded-xl"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      <span>{taskFormOpen ? "Cancel" : "Add Task"}</span>
                    </Button>
                  </div>

                  {/* Inline Task Form */}
                  {taskFormOpen && (
                    <form
                      onSubmit={handleCreateTaskForLead}
                      className="p-4 rounded-2xl bg-white border border-[#FF7900]/40 space-y-3 shadow-xs animate-in fade-in"
                    >
                      <h4 className="text-xs font-medium text-[#0D0D0E] uppercase">
                        Schedule Follow-Up Task
                      </h4>
                      <Input
                        required
                        placeholder="Task title, e.g. Call client for contract review"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="text-xs h-9 bg-[#F7F7F8]"
                      />
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[11px] text-[#8E8E93] font-medium block mb-1">
                            Due Date
                          </label>
                          <Input
                            type="date"
                            value={newTaskDueDate}
                            onChange={(e) => setNewTaskDueDate(e.target.value)}
                            className="text-xs h-9 bg-[#F7F7F8]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-[#8E8E93] font-medium block mb-1">
                            Priority
                          </label>
                          <select
                            value={newTaskPriority}
                            onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                            className="w-full h-9 px-2 rounded-xl bg-[#F7F7F8] border border-[#E5E5E7] text-xs font-semibold text-[#0D0D0E]"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end pt-1">
                        <Button
                          type="submit"
                          size="sm"
                          className="h-8 text-xs bg-[#FF7900] hover:bg-[#E66D00] text-white font-semibold rounded-xl"
                        >
                          Save Task
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Tasks List */}
                  {activeLeadTasks.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-[#E5E5E7] bg-white text-xs text-[#8E8E93] font-medium">
                      No follow-up tasks scheduled for this lead.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {activeLeadTasks.map((t) => (
                        <div
                          key={t.id}
                          className="p-3.5 rounded-2xl bg-white border border-[#E5E5E7] shadow-xs flex items-start justify-between gap-3"
                        >
                          <div className="flex items-start gap-2.5">
                            <button
                              type="button"
                              onClick={() => handleToggleTaskStatus(t)}
                              className={`mt-0.5 h-4 w-4 rounded-md border flex items-center justify-center cursor-pointer transition-colors ${
                                t.status === "completed"
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "border-[#8E8E93] hover:border-[#FF7900] bg-white"
                              }`}
                            >
                              {t.status === "completed" && <Check className="h-3 w-3" />}
                            </button>
                            <div>
                              <span
                                className={`text-xs font-semibold block ${
                                  t.status === "completed"
                                    ? "line-through text-[#8E8E93]"
                                    : "text-[#0D0D0E]"
                                }`}
                              >
                                {t.title}
                              </span>
                              <span className="text-[11px] text-[#8E8E93] font-medium flex items-center gap-1 mt-0.5">
                                <Clock className="h-3 w-3 text-[#8E8E93]" />
                                Due {formatDate(t.due_date)}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase shrink-0 ${
                              t.priority === "high"
                                ? "bg-rose-50 text-rose-800 border border-rose-200"
                                : "bg-[#FFF4EC] text-[#FF7900] border border-[#FF7900]/30"
                            }`}
                          >
                            {t.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ACTIVITY TIMELINE */}
              {activeTab === "timeline" && (
                <div className="space-y-4">
                  <span className="text-xs font-mono font-medium text-[#8E8E93] uppercase tracking-wider block">
                    EVENT TIMELINE
                  </span>
                  <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-[#E5E5E7]">
                    <div className="flex items-start gap-3 relative">
                      <div className="h-6 w-6 rounded-full bg-[#FFF4EC] text-[#FF7900] flex items-center justify-center shrink-0 z-10">
                        <Check className="h-3 w-3" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#0D0D0E]">
                          Lead in stage &ldquo;{activeLead.stage.toUpperCase()}&rdquo;
                        </p>
                        <p className="text-[11px] text-[#8E8E93] font-mono">
                          Last updated: {formatDate(activeLead.updated_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 relative">
                      <div className="h-6 w-6 rounded-full bg-[#F7F7F8] text-[#8E8E93] flex items-center justify-center shrink-0 z-10 border border-[#E5E5E7]">
                        <Briefcase className="h-3 w-3" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#0D0D0E]">
                          Opportunity initialized via {activeLead.source}
                        </p>
                        <p className="text-[11px] text-[#8E8E93] font-mono">
                          {formatDate(activeLead.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: AI QUALIFICATION */}
              {activeTab === "ai" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#FFF4EC]/60 border border-[#FF7900]/30 text-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0D0D0E] flex items-center gap-1.5 text-sm">
                        <Sparkles className="h-4 w-4 text-[#FF7900]" />
                        AI Lead Qualification
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAssessLead(activeLead.id)}
                        disabled={assessingLead}
                        className="h-7 text-xs bg-white text-[#FF7900] hover:bg-[#FFF4EC] border-[#FF7900]/30 font-semibold"
                      >
                        {assessingLead ? "Analyzing..." : "Re-assess"}
                      </Button>
                    </div>
                    <p className="text-[#0D0D0E] text-xs leading-relaxed font-medium">
                      Evaluates purchase intent, deal value alignment, and suggested next steps based
                      on conversation history and CRM notes.
                    </p>
                  </div>

                  {activeQualification ? (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-2xl bg-white border border-[#E5E5E7] space-y-1 shadow-xs">
                        <span className="text-[10px] font-mono text-[#8E8E93] uppercase font-medium">
                          Classification &amp; Priority
                        </span>
                        <div className="flex items-center justify-between pt-0.5">
                          <span className="font-semibold text-sm text-[#0D0D0E]">
                            {activeQualification.leadCategory}
                          </span>
                          <Badge variant="purple" className="text-xs uppercase font-medium">
                            {activeQualification.suggestedPriority} priority
                          </Badge>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white border border-[#E5E5E7] space-y-1 shadow-xs">
                        <span className="text-[10px] font-mono text-[#8E8E93] uppercase font-medium">
                          Suggested Action
                        </span>
                        <p className="text-xs text-[#0D0D0E] leading-relaxed font-semibold pt-0.5">
                          {activeQualification.suggestedNextAction}
                        </p>
                      </div>

                      {activeQualification.explanation && (
                        <div className="p-3.5 rounded-2xl bg-[#F7F7F8] border border-[#E5E5E7] space-y-1">
                          <span className="text-[10px] font-mono text-[#8E8E93] uppercase font-medium">
                            Evaluation Context
                          </span>
                          <p className="text-xs text-[#8E8E93] leading-relaxed font-medium">
                            {activeQualification.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-[#8E8E93] font-medium">
                      No automated qualification record yet. Click &ldquo;Re-assess&rdquo; above.
                    </div>
                  )}

                  {assessmentFeedback && (
                    <p className="text-xs text-emerald-700 font-semibold">
                      {assessmentFeedback}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-[#E5E5E7] bg-white flex items-center justify-between gap-3">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleDeleteLead(activeLead.id)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                {activeLead.stage !== "won" && (
                  <Button
                    size="sm"
                    onClick={() => handleStageChange(activeLead, "won")}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
                  >
                    Mark Won
                  </Button>
                )}
                {activeLead.stage !== "lost" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStageChange(activeLead, "lost")}
                    className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200 font-semibold rounded-xl"
                  >
                    Mark Lost
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
            <label className="text-xs font-medium text-[#0D0D0E]">
              Opportunity Title *
            </label>
            <Input
              required
              placeholder="e.g. Enterprise WhatsApp CRM Package"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#0D0D0E]">
                Associated Contact *
              </label>
              <select
                required
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-[#F7F7F8] border border-[#E5E5E7] text-xs font-semibold text-[#0D0D0E] focus:outline-none focus:border-[#FF7900]"
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
              <label className="text-xs font-medium text-[#0D0D0E]">
                Initial Pipeline Stage
              </label>
              <select
                value={initialStage}
                onChange={(e) => setInitialStage(e.target.value as LeadStage)}
                className="w-full h-11 px-3 rounded-xl bg-[#F7F7F8] border border-[#E5E5E7] text-xs font-semibold text-[#0D0D0E] focus:outline-none focus:border-[#FF7900]"
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
              <label className="text-xs font-medium text-[#0D0D0E]">
                Estimated Deal Value (INR)
              </label>
              <Input
                type="number"
                min="0"
                step="1000"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                className="font-mono font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#0D0D0E]">
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
            <label className="text-xs font-medium text-[#0D0D0E]">
              Lead Notes &amp; Scope
            </label>
            <textarea
              rows={3}
              placeholder="Key client requirements, budget range, or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F7F7F8] border border-[#E5E5E7] text-[#0D0D0E] focus:outline-none focus:border-[#FF7900] resize-none font-medium"
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
            <Button type="submit" className="bg-[#FF7900] hover:bg-[#E66D00] text-white font-semibold">
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
          <label className="text-xs font-medium text-[#0D0D0E]">
            Primary Cause:
          </label>
          <select
            value={lostReasonText}
            onChange={(e) => setLostReasonText(e.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-[#F7F7F8] border border-[#E5E5E7] text-xs font-semibold text-[#0D0D0E] focus:outline-none focus:border-[#FF7900]"
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
            className="font-semibold"
          >
            Confirm Lost
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
