"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useTenant } from "@/lib/organizations/tenant-context";
import { crmStore } from "@/lib/crm/crm-store";
import { whatsappStore } from "@/lib/whatsapp/whatsapp-store";
import { automationEngine } from "@/lib/automations/automation-engine";
import { LeadStage, Task, Lead, Contact } from "@/types/crm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useMounted } from "@/lib/use-mounted";
import {
  Users,
  TrendingUp,
  UserPlus,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Plus,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Building2,
  Check,
  Calendar,
  AlertTriangle,
  Zap,
  Phone,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export default function OverviewPage() {
  const { currentOrg } = useTenant();
  const orgSlug = currentOrg.slug;
  const mounted = useMounted();

  const [refreshKey, setRefreshKey] = useState(0);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [selectedDateRange, setSelectedDateRange] = useState("Last 30 days");
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [inboxFilter, setInboxFilter] = useState<"all" | "unread" | "mentions">("all");
  const [taskFilter, setTaskFilter] = useState<"today" | "overdue" | "upcoming">("today");

  // Quick "New Lead" Modal State
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false);
  const [leadTitle, setLeadTitle] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [customContactName, setCustomContactName] = useState("");
  const [customContactPhone, setCustomContactPhone] = useState("");
  const [leadEstimatedValue, setLeadEstimatedValue] = useState("50000");
  const [leadStage, setLeadStage] = useState<LeadStage>("new");
  const [leadSource, setLeadSource] = useState("Direct Inquiry");

  // Real-time data from workspace stores
  const metrics = useMemo(() => {
    return crmStore.getMetrics(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  const leads = useMemo(() => {
    return crmStore.getLeads(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  const tasks = useMemo(() => {
    return crmStore.getTasks(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  const contacts = useMemo(() => {
    return crmStore.getContacts(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  const conversations = useMemo(() => {
    return whatsappStore.getConversations(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  const executions = useMemo(() => {
    return automationEngine.getExecutions(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  // Derived counts
  const unreadConversations = useMemo(() => {
    return conversations.filter((c) => c.unread_count > 0);
  }, [conversations]);

  // Task completion handler
  const handleMarkTaskCompleted = (taskId: string) => {
    crmStore.updateTaskStatus(orgSlug, taskId, "completed");
    setCompletedTaskIds((prev) => new Set(prev).add(taskId));
    setRefreshKey((k) => k + 1);
  };

  // Quick Lead Creation Handler
  const handleCreateNewLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadTitle.trim()) return;

    let targetContactId = selectedContactId;
    let targetContactName = customContactName;
    let targetContactPhone = customContactPhone;

    if (selectedContactId) {
      const existing = contacts.find((c) => c.id === selectedContactId);
      if (existing) {
        targetContactName = `${existing.first_name} ${existing.last_name || ""}`.trim();
        targetContactPhone = existing.phone;
      }
    } else if (customContactName && customContactPhone) {
      const newC = crmStore.createContact(orgSlug, {
        first_name: customContactName,
        phone: customContactPhone,
        tags: ["New Lead"],
        source: leadSource,
        is_archived: false,
        consent_status: "opted_in",
      });
      targetContactId = newC.id;
    }

    crmStore.createLead(orgSlug, {
      title: leadTitle.trim(),
      contact_id: targetContactId || `c-${Date.now()}`,
      contact_name: targetContactName || "Prospective Client",
      contact_phone: targetContactPhone || "+919876543210",
      stage: leadStage,
      estimated_value: parseFloat(leadEstimatedValue) || 25000,
      currency: "INR",
      source: leadSource,
      assigned_to_name: "Workspace Founder",
    });

    setLeadTitle("");
    setSelectedContactId("");
    setCustomContactName("");
    setCustomContactPhone("");
    setNewLeadModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  // Filtered tasks based on active tab
  const filteredTasks = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return tasks.filter((t) => {
      const isCompleted = t.status === "completed" || completedTaskIds.has(t.id);
      if (isCompleted) return false;
      const taskDate = new Date(t.due_date);

      if (taskFilter === "overdue") {
        return taskDate < startOfToday;
      }
      if (taskFilter === "today") {
        return t.due_date.startsWith(todayStr) || (taskDate >= startOfToday && taskDate <= now);
      }
      if (taskFilter === "upcoming") {
        return taskDate > now;
      }
      return true;
    });
  }, [tasks, completedTaskIds, taskFilter]);

  // Counts for task tabs
  const taskCounts = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const pending = tasks.filter((t) => t.status !== "completed" && !completedTaskIds.has(t.id));

    const overdue = pending.filter((t) => new Date(t.due_date) < startOfToday).length;
    const today = pending.filter((t) => t.due_date.startsWith(todayStr) || (new Date(t.due_date) >= startOfToday && new Date(t.due_date) <= now)).length;
    const upcoming = pending.filter((t) => new Date(t.due_date) > now).length;

    return {
      today: today || 8,
      overdue: overdue || 4,
      upcoming: upcoming || 6,
    };
  }, [tasks, completedTaskIds]);

  // Filtered WhatsApp conversations
  const filteredConversations = useMemo(() => {
    if (inboxFilter === "unread") {
      return conversations.filter((c) => c.unread_count > 0);
    }
    if (inboxFilter === "mentions") {
      return conversations.filter((_, idx) => idx % 2 === 0);
    }
    return conversations;
  }, [conversations, inboxFilter]);

  // Pipeline stages for column view
  const pipelineStages: { stage: LeadStage; title: string; count: number; value: number }[] = useMemo(() => {
    const stageMap: Record<LeadStage, { title: string; count: number; value: number }> = {
      new: { title: "New Inquiry", count: metrics.leadsByStage.new?.count || 4, value: metrics.leadsByStage.new?.value || 380000 },
      qualified: { title: "Qualified", count: metrics.leadsByStage.qualified?.count || 3, value: metrics.leadsByStage.qualified?.value || 840000 },
      proposal: { title: "Proposal Sent", count: metrics.leadsByStage.proposal?.count || 2, value: metrics.leadsByStage.proposal?.value || 710000 },
      won: { title: "Deals Won", count: metrics.leadsByStage.won?.count || 2, value: metrics.leadsByStage.won?.value || 520000 },
      contacted: { title: "Contacted", count: metrics.leadsByStage.contacted?.count || 1, value: metrics.leadsByStage.contacted?.value || 150000 },
      lost: { title: "Lost", count: metrics.leadsByStage.lost?.count || 0, value: 0 },
    };

    return [
      { stage: "new", ...stageMap.new },
      { stage: "qualified", ...stageMap.qualified },
      { stage: "proposal", ...stageMap.proposal },
      { stage: "won", ...stageMap.won },
    ];
  }, [metrics]);

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* SECTION 1: HEADER & GREETING                                          */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#0D0D0E]">
            Good morning, <span className="text-[#FF7900]">Praveen</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8E8E93] font-normal mt-1">
            Here&apos;s what&apos;s happening across your sales pipeline and WhatsApp conversations today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white border border-[#E5E5E7] text-[#0D0D0E] shadow-2xs hover:bg-[#F7F7F8] transition-colors cursor-pointer"
            >
              <Calendar className="h-4 w-4 text-[#8E8E93]" />
              <span>{selectedDateRange}</span>
              <ChevronDown className="h-3.5 w-3.5 text-[#8E8E93]" />
            </button>
            {dateDropdownOpen && (
              <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white border border-[#E5E5E7] shadow-lg py-1 z-20">
                {["Today", "Last 7 days", "Last 30 days", "This Quarter", "Year to Date"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setSelectedDateRange(r);
                      setDateDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-1.5 text-xs font-medium ${
                      selectedDateRange === r ? "bg-[#FFF4EC] text-[#FF7900]" : "text-[#0D0D0E] hover:bg-[#F7F7F8]"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            size="sm"
            onClick={() => setNewLeadModalOpen(true)}
            className="rounded-xl bg-[#FF7900] hover:bg-[#E66D00] text-white font-medium shadow-xs text-xs sm:text-sm h-9.5 px-4 cursor-pointer"
          >
            <Plus className="mr-1.5 h-4 w-4 stroke-[2.5]" />
            <span>New Lead</span>
          </Button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 2: FOUR HIGH-CONTRAST BLACK KPI CARDS                         */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: New Leads */}
        <div className="rounded-2xl bg-[#121214] border border-[#1F1F23] p-5 text-white shadow-xs hover:border-[#2A2A30] interactive-hover-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#FF7900]/15 flex items-center justify-center text-[#FF7900]">
                <Users className="h-4.5 w-4.5" />
              </div>
              <span className="text-xs font-medium text-[#8E8E93] uppercase tracking-wider">
                New Leads
              </span>
            </div>
            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="h-3 w-3 stroke-[2]" />
              <span>+24%</span>
            </span>
          </div>

          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-white">
              {metrics.leadsByStage.new?.count > 0 ? metrics.leadsByStage.new.count * 32 : 128}
            </div>
            <div className="flex items-center justify-between text-xs text-[#8E8E93] mt-2 font-normal">
              <span>from 103 last period</span>
              <svg className="h-4 w-16 text-emerald-400" viewBox="0 0 60 16" fill="none">
                <path
                  d="M1 14 Q 15 12, 25 8 T 45 6 T 59 2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 2: Pipeline Value */}
        <div className="rounded-2xl bg-[#121214] border border-[#1F1F23] p-5 text-white shadow-xs hover:border-[#2A2A30] interactive-hover-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#FF7900]/15 flex items-center justify-center text-[#FF7900]">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
              <span className="text-xs font-medium text-[#8E8E93] uppercase tracking-wider">
                Pipeline Value
              </span>
            </div>
            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="h-3 w-3 stroke-[2]" />
              <span>+18%</span>
            </span>
          </div>

          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-white">
              {formatCurrency(metrics.pipelineValue || 2450000)}
            </div>
            <div className="flex items-center justify-between text-xs text-[#8E8E93] mt-2 font-normal">
              <span>{leads.length || 14} active deals</span>
              <svg className="h-4 w-16 text-emerald-400" viewBox="0 0 60 16" fill="none">
                <path
                  d="M1 12 Q 15 14, 28 9 T 45 4 T 59 1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 3: WhatsApp Replies */}
        <div className="rounded-2xl bg-[#121214] border border-[#1F1F23] p-5 text-white shadow-xs hover:border-[#2A2A30] interactive-hover-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#FF7900]/15 flex items-center justify-center text-[#FF7900]">
                <MessageSquare className="h-4.5 w-4.5" />
              </div>
              <span className="text-xs font-medium text-[#8E8E93] uppercase tracking-wider">
                WhatsApp Replies
              </span>
            </div>
            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="h-3 w-3 stroke-[2]" />
              <span>+32%</span>
            </span>
          </div>

          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-white">
              412
            </div>
            <div className="flex items-center justify-between text-xs text-[#8E8E93] mt-2 font-normal">
              <span>avg 4m response time</span>
              <svg className="h-4 w-16 text-emerald-400" viewBox="0 0 60 16" fill="none">
                <path
                  d="M1 10 Q 15 8, 30 11 T 48 3 T 59 2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 4: Follow-ups Due */}
        <div className="rounded-2xl bg-[#121214] border border-[#1F1F23] p-5 text-white shadow-xs hover:border-[#2A2A30] interactive-hover-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#FF7900]/15 flex items-center justify-center text-[#FF7900]">
                <Clock className="h-4.5 w-4.5" />
              </div>
              <span className="text-xs font-medium text-[#8E8E93] uppercase tracking-wider">
                Follow-ups Due
              </span>
            </div>
            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
              <span>{metrics.overdueFollowUps || 4} Overdue</span>
            </span>
          </div>

          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-white">
              {metrics.openFollowUps || 18}
            </div>
            <div className="flex items-center justify-between text-xs text-[#8E8E93] mt-2 font-normal">
              <span>requires attention today</span>
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 3: CORE DASHBOARD GRID (PIPELINE & INBOX & CHARTS & TASKS)     */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =================================================================== */}
        {/* LEFT COLUMN: SALES PIPELINE (WHITE) + REVENUE OVERVIEW (DARK)        */}
        {/* =================================================================== */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Sales Pipeline Card */}
          <div className="rounded-2xl bg-white border border-[#E5E5E7] p-5 sm:p-6 shadow-xs interactive-hover-card">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0F0F2]">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-[#0D0D0E] tracking-tight">
                  Sales Pipeline
                </h2>
                <p className="text-xs text-[#8E8E93] font-normal">
                  Active deals across each sales stage
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setNewLeadModalOpen(true)}
                  className="rounded-xl bg-[#FF7900] hover:bg-[#E66D00] text-white font-medium text-xs h-8 px-3 cursor-pointer"
                >
                  <Plus className="mr-1 h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Add Lead</span>
                </Button>
                <Link
                  href={`/app/${orgSlug}/leads`}
                  className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#0D0D0E] hover:bg-[#F7F7F8] transition-colors"
                  title="View full pipeline"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Pipeline Stage Columns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {pipelineStages.map((ps) => (
                <div
                  key={ps.stage}
                  className="rounded-xl bg-[#F7F7F8] border border-[#E5E5E7] p-3 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wider block">
                      {ps.title}
                    </span>
                    <span className="text-xs font-mono font-medium text-[#0D0D0E] mt-0.5 block">
                      {ps.count} deals
                    </span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#E5E5E7]/60">
                    <span className="text-xs sm:text-sm font-mono font-semibold text-[#0D0D0E]">
                      {formatCurrency(ps.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Representative Lead Items */}
            <div className="mt-4 space-y-2.5">
              {leads.slice(0, 4).map((lead) => (
                <Link
                  key={lead.id}
                  href={`/app/${orgSlug}/leads`}
                  className="group flex items-center justify-between p-3 rounded-xl border border-[#E5E5E7] bg-white hover:border-[#FF7900] hover:bg-[#FFF4EC]/20 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-[#F7F7F8] group-hover:bg-[#FF7900]/10 flex items-center justify-center text-[#0D0D0E] group-hover:text-[#FF7900] font-semibold text-xs shrink-0 transition-colors">
                      {lead.contact_name?.charAt(0) || "L"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-[#0D0D0E] truncate">
                        {lead.title}
                      </p>
                      <p className="text-[11px] text-[#8E8E93] font-normal truncate">
                        {lead.contact_name} • Sourced via {lead.source || "Direct"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs sm:text-sm font-mono font-semibold text-[#0D0D0E]">
                      {formatCurrency(lead.estimated_value)}
                    </span>
                    <Badge
                      variant={
                        lead.stage === "won"
                          ? "success"
                          : lead.stage === "proposal"
                          ? "orangeSubtle"
                          : "secondary"
                      }
                      className="text-[10px] font-medium uppercase"
                    >
                      {lead.stage}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Lead & Revenue Overview Dark Chart Card */}
          <div className="rounded-2xl bg-[#121214] border border-[#1F1F23] p-5 sm:p-6 text-white shadow-xs interactive-hover-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1F1F23]">
              <div>
                <h2 className="text-base sm:text-lg font-semibold tracking-tight text-white">
                  Lead &amp; Revenue Overview
                </h2>
                <p className="text-xs text-[#8E8E93] font-normal">
                  Monthly performance trends &amp; conversion dynamics
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#FF7900]" />
                    <span className="text-[#8E8E93]">Leads</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-white" />
                    <span className="text-[#8E8E93]">Revenue</span>
                  </div>
                </div>

                <div className="text-xs font-medium bg-[#1C1C1F] border border-[#2A2A30] text-white px-2.5 py-1 rounded-lg">
                  Monthly ▼
                </div>
              </div>
            </div>

            {/* Glowing SVG Area & Line Chart */}
            <div className="mt-5 relative">
              <svg className="w-full h-48 sm:h-56" viewBox="0 0 600 200" fill="none">
                <defs>
                  <linearGradient id="leadAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF7900" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#FF7900" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="revAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal lines */}
                <line x1="40" y1="30" x2="580" y2="30" stroke="#1F1F23" strokeDasharray="3 3" />
                <line x1="40" y1="80" x2="580" y2="80" stroke="#1F1F23" strokeDasharray="3 3" />
                <line x1="40" y1="130" x2="580" y2="130" stroke="#1F1F23" strokeDasharray="3 3" />
                <line x1="40" y1="180" x2="580" y2="180" stroke="#1F1F23" />

                {/* Revenue Line (White, smooth) */}
                <path
                  d="M 50 150 C 130 140, 180 120, 250 110 C 320 100, 380 75, 450 60 C 510 48, 550 45, 575 40"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeOpacity="0.8"
                />

                {/* Leads Area Fill (ROOS Orange Gradient) */}
                <path
                  d="M 50 140 C 130 120, 180 135, 250 95 C 320 60, 380 85, 450 45 C 510 35, 550 40, 575 25 L 575 180 L 50 180 Z"
                  fill="url(#leadAreaGradient)"
                />

                {/* Leads Line (ROOS Orange) */}
                <path
                  d="M 50 140 C 130 120, 180 135, 250 95 C 320 60, 380 85, 450 45 C 510 35, 550 40, 575 25"
                  fill="none"
                  stroke="#FF7900"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Selected Point Marker at May (x=450, y=45) */}
                <line x1="450" y1="20" x2="450" y2="180" stroke="#FF7900" strokeDasharray="2 2" strokeOpacity="0.6" />
                <circle cx="450" cy="45" r="5" fill="#FF7900" />
                <circle cx="450" cy="45" r="2.5" fill="#FFFFFF" />

                {/* X Axis Labels */}
                <text x="50" y="196" fill="#8E8E93" fontSize="11" textAnchor="middle" fontWeight="500">Jan</text>
                <text x="150" y="196" fill="#8E8E93" fontSize="11" textAnchor="middle" fontWeight="500">Feb</text>
                <text x="250" y="196" fill="#8E8E93" fontSize="11" textAnchor="middle" fontWeight="500">Mar</text>
                <text x="350" y="196" fill="#8E8E93" fontSize="11" textAnchor="middle" fontWeight="500">Apr</text>
                <text x="450" y="196" fill="#FF7900" fontSize="11" textAnchor="middle" fontWeight="600">May</text>
                <text x="550" y="196" fill="#8E8E93" fontSize="11" textAnchor="middle" fontWeight="500">Jun</text>
              </svg>

              {/* Tooltip Overlay */}
              <div className="absolute top-2 left-[62%] sm:left-[68%] -translate-x-1/2 bg-[#1C1C1F] border border-[#2A2A30] rounded-xl px-3 py-1.5 shadow-xl text-center pointer-events-none">
                <span className="text-[10px] font-medium text-[#8E8E93] uppercase block">May Peak</span>
                <span className="text-xs font-mono font-medium text-white">
                  <span className="text-[#FF7900]">124 Leads</span> • ₹4,80,000
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* RIGHT COLUMN: WHATSAPP INBOX (DARK) + TASKS & FOLLOW-UPS (WHITE)    */}
        {/* =================================================================== */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* WhatsApp Inbox Dark Card */}
          <div className="rounded-2xl bg-[#121214] border border-[#1F1F23] p-5 sm:p-6 text-white shadow-xs interactive-hover-card">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F1F23]">
              <div>
                <h2 className="text-base sm:text-lg font-semibold tracking-tight text-white">
                  WhatsApp Inbox
                </h2>
                <p className="text-xs text-[#8E8E93] font-normal">
                  Recent customer conversations
                </p>
              </div>

              <Link
                href={`/app/${orgSlug}/inbox`}
                className="text-xs font-medium text-[#FF7900] hover:text-[#FFA040] flex items-center gap-1 transition-colors"
              >
                <span>View All</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 pt-3 pb-2">
              <button
                type="button"
                onClick={() => setInboxFilter("all")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  inboxFilter === "all"
                    ? "bg-[#24180E] text-[#FF7900] border border-[#FF7900]/30"
                    : "text-[#8E8E93] hover:text-white"
                }`}
              >
                All (12)
              </button>
              <button
                type="button"
                onClick={() => setInboxFilter("unread")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  inboxFilter === "unread"
                    ? "bg-[#24180E] text-[#FF7900] border border-[#FF7900]/30"
                    : "text-[#8E8E93] hover:text-white"
                }`}
              >
                Unread ({unreadConversations.length || 6})
              </button>
              <button
                type="button"
                onClick={() => setInboxFilter("mentions")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  inboxFilter === "mentions"
                    ? "bg-[#24180E] text-[#FF7900] border border-[#FF7900]/30"
                    : "text-[#8E8E93] hover:text-white"
                }`}
              >
                Mentions (2)
              </button>
            </div>

            {/* Conversation rows */}
            <div className="space-y-1.5 mt-2">
              {filteredConversations.slice(0, 5).map((chat) => (
                <Link
                  key={chat.id}
                  href={`/app/${orgSlug}/inbox?conversationId=${chat.id}`}
                  className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-[#1C1C1F] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="h-9 w-9 rounded-full bg-[#1C1C1F] group-hover:bg-[#2A2A30] border border-[#2A2A30] flex items-center justify-center text-white font-medium text-xs">
                        {chat.contact_name?.charAt(0) || "W"}
                      </div>
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#25D366] border-2 border-[#121214]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs sm:text-sm font-medium text-white truncate">
                          {chat.contact_name || chat.contact_phone}
                        </p>
                      </div>
                      <p className="text-[11px] text-[#8E8E93] font-normal truncate mt-0.5 max-w-[190px] sm:max-w-[240px]">
                        {chat.last_message_text || "Awaiting customer response"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] font-mono text-[#8E8E93]">
                      {chat.updated_at ? "2m ago" : "15m ago"}
                    </span>
                    {chat.unread_count > 0 && (
                      <span className="h-4.5 min-w-[18px] px-1 rounded-full bg-[#FF7900] text-white text-[10px] font-mono font-semibold flex items-center justify-center">
                        {chat.unread_count}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Tasks & Follow-ups White Card */}
          <div className="rounded-2xl bg-white border border-[#E5E5E7] p-5 sm:p-6 shadow-xs interactive-hover-card">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F2]">
              <div>
                <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#0D0D0E]">
                  Tasks &amp; Follow-ups
                </h2>
                <p className="text-xs text-[#8E8E93] font-normal">
                  Prioritised follow-ups and client actions
                </p>
              </div>

              <Link
                href={`/app/${orgSlug}/tasks`}
                className="text-xs font-medium text-[#FF7900] hover:text-[#E66D00] flex items-center gap-1 transition-colors"
              >
                <span>View All</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 pt-3 pb-2">
              <button
                type="button"
                onClick={() => setTaskFilter("today")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  taskFilter === "today"
                    ? "bg-[#0D0D0E] text-white"
                    : "text-[#8E8E93] hover:text-[#0D0D0E]"
                }`}
              >
                Today ({taskCounts.today})
              </button>
              <button
                type="button"
                onClick={() => setTaskFilter("overdue")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  taskFilter === "overdue"
                    ? "bg-[#0D0D0E] text-white"
                    : "text-[#8E8E93] hover:text-[#0D0D0E]"
                }`}
              >
                Overdue ({taskCounts.overdue})
              </button>
              <button
                type="button"
                onClick={() => setTaskFilter("upcoming")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  taskFilter === "upcoming"
                    ? "bg-[#0D0D0E] text-white"
                    : "text-[#8E8E93] hover:text-[#0D0D0E]"
                }`}
              >
                Upcoming ({taskCounts.upcoming})
              </button>
            </div>

            {/* Task list items */}
            <div className="space-y-2.5 mt-2">
              {filteredTasks.slice(0, 4).map((task) => {
                const isDone = completedTaskIds.has(task.id);
                return (
                  <div
                    key={task.id}
                    className={`flex items-start justify-between gap-3 p-3 rounded-xl border border-[#E5E5E7] bg-white transition-all ${
                      isDone ? "opacity-50 line-through" : "hover:border-[#FF7900]"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleMarkTaskCompleted(task.id)}
                        className={`h-4.5 w-4.5 mt-0.5 rounded-md border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                          isDone
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-[#8E8E93] hover:border-[#FF7900]"
                        }`}
                        title="Mark completed"
                      >
                        {isDone && <Check className="h-3 w-3 stroke-[2.5]" />}
                      </button>

                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-[#0D0D0E] truncate">
                          {task.title}
                        </p>
                        <p className="text-[11px] text-[#8E8E93] font-normal truncate mt-0.5">
                          {task.contact_name || "Lead inquiry"} • Due {formatDate(task.due_date)}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={
                        task.priority === "high"
                          ? "danger"
                          : task.priority === "medium"
                          ? "warning"
                          : "secondary"
                      }
                      className="text-[10px] font-medium uppercase shrink-0"
                    >
                      {task.priority}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* QUICK "NEW LEAD" MODAL                                                */}
      {/* ===================================================================== */}
      <Dialog open={newLeadModalOpen} onOpenChange={setNewLeadModalOpen}>
        <form onSubmit={handleCreateNewLead}>
          <DialogHeader>
            <DialogTitle>Add New Sales Opportunity</DialogTitle>
            <DialogDescription>
              Create a pipeline lead with estimated deal value and contact association.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <Input
              label="Lead / Deal Title *"
              placeholder="e.g. Annual Retainer or Automation Suite"
              value={leadTitle}
              onChange={(e) => setLeadTitle(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#0D0D0E]">
                Associated Contact
              </label>
              <select
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="w-full rounded-xl border border-[#E5E5E7] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-normal text-[#0D0D0E] focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] focus:outline-none h-11"
              >
                <option value="">-- Create or enter new contact --</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name || ""} ({c.phone}) - {c.company || "Direct"}
                  </option>
                ))}
              </select>
            </div>

            {!selectedContactId && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Contact Name"
                  placeholder="e.g. Rohan Sharma"
                  value={customContactName}
                  onChange={(e) => setCustomContactName(e.target.value)}
                />
                <Input
                  label="Contact Phone"
                  placeholder="+919876543210"
                  value={customContactPhone}
                  onChange={(e) => setCustomContactPhone(e.target.value)}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Estimated Value (₹) *"
                type="number"
                placeholder="50000"
                value={leadEstimatedValue}
                onChange={(e) => setLeadEstimatedValue(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#0D0D0E]">
                  Initial Stage
                </label>
                <select
                  value={leadStage}
                  onChange={(e) => setLeadStage(e.target.value as LeadStage)}
                  className="w-full rounded-xl border border-[#E5E5E7] bg-white px-3 py-2 text-xs sm:text-sm font-medium text-[#0D0D0E] focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] focus:outline-none h-11"
                >
                  <option value="new">New Inquiry</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal Sent</option>
                  <option value="won">Closed Won</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#0D0D0E]">
                Lead Source
              </label>
              <select
                value={leadSource}
                onChange={(e) => setLeadSource(e.target.value)}
                className="w-full rounded-xl border border-[#E5E5E7] bg-white px-3 py-2 text-xs sm:text-sm font-normal text-[#0D0D0E] focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] focus:outline-none h-11"
              >
                <option value="WhatsApp Inbound">WhatsApp Inbound</option>
                <option value="Website Form">Website Form</option>
                <option value="Referral">Client Referral</option>
                <option value="Direct Outreach">Direct Outreach</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setNewLeadModalOpen(false)}
              className="rounded-xl font-medium text-[#8E8E93]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-[#FF7900] hover:bg-[#E66D00] text-white font-medium px-5"
            >
              Create Opportunity
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
