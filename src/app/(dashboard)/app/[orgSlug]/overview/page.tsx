"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useTenant } from "@/lib/organizations/tenant-context";
import { crmStore } from "@/lib/crm/crm-store";
import { whatsappStore } from "@/lib/whatsapp/whatsapp-store";
import { automationEngine } from "@/lib/automations/automation-engine";
import { LeadStage, Task, Lead, Contact } from "@/types/crm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useMounted } from "@/lib/use-mounted";
import {
  Users,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Plus,
  Award,
  AlertCircle,
  Phone,
  MessageSquare,
  ChevronRight,
  ArrowRight,
  Building2,
  Check,
  Calendar,
  AlertTriangle,
  Zap,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

// Stage palette consistent with specification:
// New: blue (#2563EB), Contacted: amber (#D97706), Qualified: violet (#7C3AED),
// Proposal: indigo (#4F46E5), Won: green (#059669), Lost: coral (#DC2626)
const STAGE_CONFIG: Record<
  LeadStage,
  { label: string; hex: string; bar: string; text: string; bg: string; border: string }
> = {
  new: {
    label: "New Inquiry",
    hex: "#2563EB",
    bar: "bg-[#2563EB]",
    text: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  contacted: {
    label: "Contacted",
    hex: "#D97706",
    bar: "bg-[#D97706]",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  qualified: {
    label: "Qualified",
    hex: "#7C3AED",
    bar: "bg-[#7C3AED]",
    text: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  proposal: {
    label: "Proposal Sent",
    hex: "#4F46E5",
    bar: "bg-[#4F46E5]",
    text: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
  },
  won: {
    label: "Deals Won",
    hex: "#059669",
    bar: "bg-[#059669]",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  lost: {
    label: "Closed / Lost",
    hex: "#DC2626",
    bar: "bg-[#DC2626]",
    text: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
};

export default function OverviewPage() {
  const { currentOrg } = useTenant();
  const orgSlug = currentOrg.slug;
  const mounted = useMounted();

  const [refreshKey, setRefreshKey] = useState(0);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());

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

  // Task completion handler (Instant in-place resolution)
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
    } else {
      // Create new contact first if specified
      if (customContactName && customContactPhone) {
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

    // Reset & Close
    setLeadTitle("");
    setSelectedContactId("");
    setCustomContactName("");
    setCustomContactPhone("");
    setNewLeadModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  // =========================================================================
  // 1. URGENT ACTIONS REQUIRING ATTENTION (PRIORITY-ORDERED ACTION CENTRE)
  // Categories:
  // - Overdue tasks: coral/red (#DC2626)
  // - Due today: amber (#D97706)
  // - Unread customer messages: blue (#2563EB)
  // - Failed automations: red (#DC2626)
  // - Unassigned leads/conversations: violet (#7C3AED)
  // =========================================================================
  const attentionItems = useMemo(() => {
    const list: Array<{
      id: string;
      type: "task" | "inbox" | "automation" | "lead";
      severity: 1 | 2 | 3; // 1 = Critical, 2 = Caution/Urgent, 3 = Pending
      title: string;
      subtitle: string;
      badgeText: string;
      badgeVariant: "danger" | "warning" | "default" | "purple";
      leftBorderColor: string;
      iconType: "clock-red" | "clock-amber" | "chat" | "zap" | "user";
      href: string;
      actionLabel: string;
      taskId?: string;
    }> = [];

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Category 1: Overdue tasks (Severity 1 - Coral/Red)
    const pendingTasks = tasks.filter(
      (t) => t.status !== "completed" && !completedTaskIds.has(t.id)
    );

    pendingTasks.forEach((task) => {
      const taskDate = new Date(task.due_date);
      if (taskDate < startOfToday) {
        list.push({
          id: `task-overdue-${task.id}`,
          type: "task",
          severity: 1,
          title: `Overdue follow-up: ${task.title}`,
          subtitle: `With ${task.contact_name || "Lead"} • Due ${formatDate(task.due_date)}`,
          badgeText: "Overdue",
          badgeVariant: "danger",
          leftBorderColor: "border-l-[#DC2626]",
          iconType: "clock-red",
          href: `/app/${orgSlug}/tasks`,
          actionLabel: "View Task",
          taskId: task.id,
        });
      }
    });

    // Category 2: Failed Automations (Severity 1 - Red)
    const failedExecutions = executions.filter((e) => e.status === "failed");
    failedExecutions.slice(0, 1).forEach((exec) => {
      list.push({
        id: `exec-failed-${exec.id}`,
        type: "automation",
        severity: 1,
        title: `Workflow execution failed: ${exec.rule_name}`,
        subtitle: `Trigger: ${exec.trigger_event} • Retried ${exec.retry_count}/${exec.max_retries}`,
        badgeText: "Failed Automation",
        badgeVariant: "danger",
        leftBorderColor: "border-l-[#DC2626]",
        iconType: "zap",
        href: `/app/${orgSlug}/automations`,
        actionLabel: "Inspect Workflow",
      });
    });

    // Category 3: Tasks Due Today (Severity 2 - Amber)
    pendingTasks.forEach((task) => {
      const isToday = task.due_date.startsWith(todayStr);
      const isOverdue = new Date(task.due_date) < startOfToday;
      if (isToday && !isOverdue) {
        list.push({
          id: `task-today-${task.id}`,
          type: "task",
          severity: 2,
          title: `Scheduled today: ${task.title}`,
          subtitle: `With ${task.contact_name || "Lead"} • Scheduled priority: ${task.priority.toUpperCase()}`,
          badgeText: "Due Today",
          badgeVariant: "warning",
          leftBorderColor: "border-l-[#D97706]",
          iconType: "clock-amber",
          href: `/app/${orgSlug}/tasks`,
          actionLabel: "View Task",
          taskId: task.id,
        });
      }
    });

    // Category 4: Unread WhatsApp customer messages (Severity 2 - Blue)
    unreadConversations.forEach((chat) => {
      list.push({
        id: `chat-unread-${chat.id}`,
        type: "inbox",
        severity: 2,
        title: `Unread message from ${chat.contact_name || chat.contact_phone}`,
        subtitle: chat.last_message_text || "Customer awaiting response in shared WhatsApp inbox",
        badgeText: `${chat.unread_count} Unread`,
        badgeVariant: "default",
        leftBorderColor: "border-l-[#2563EB]",
        iconType: "chat",
        href: `/app/${orgSlug}/inbox?conversationId=${chat.id}`,
        actionLabel: "Reply in Inbox",
      });
    });

    // Category 5: Unassigned New Inquiries (Severity 3 - Violet)
    const unassignedLeads = leads.filter(
      (l) => l.stage === "new" && (!l.assigned_to_name || l.assigned_to_name === "Unassigned")
    );
    unassignedLeads.slice(0, 2).forEach((lead) => {
      list.push({
        id: `lead-unassigned-${lead.id}`,
        type: "lead",
        severity: 3,
        title: `Unassigned lead enquiry: ${lead.title}`,
        subtitle: `${lead.contact_name} (${formatCurrency(lead.estimated_value)}) • Sourced via ${lead.source || "Web"}`,
        badgeText: "Unassigned",
        badgeVariant: "purple",
        leftBorderColor: "border-l-[#7C3AED]",
        iconType: "user",
        href: `/app/${orgSlug}/leads`,
        actionLabel: "Assign Lead",
      });
    });

    // Order strictly by Severity (1 first, then 2, then 3)
    return list.sort((a, b) => a.severity - b.severity);
  }, [tasks, executions, unreadConversations, leads, completedTaskIds, orgSlug]);

  // Stage distribution calculations
  const stageKeys: LeadStage[] = ["new", "contacted", "qualified", "proposal", "won", "lost"];
  const totalPipelineDeals = leads.length;

  // =========================================================================
  // 4. RECENT WORKSPACE ACTIVITY (AUDITED CHRONOLOGICAL LOG)
  // Meaningful events that avoid duplicating the items in Needs Attention
  // =========================================================================
  const recentActivities = useMemo(() => {
    const events: Array<{
      id: string;
      title: string;
      subtitle: string;
      timestamp: string;
      entityLabel: string;
      href: string;
      iconType: "won" | "proposal" | "task-done" | "lead";
    }> = [];

    // Won deals
    leads
      .filter((l) => l.stage === "won")
      .slice(0, 2)
      .forEach((lead) => {
        events.push({
          id: `recent-won-${lead.id}`,
          title: `Deal Won: ${lead.title}`,
          subtitle: `${lead.contact_name} • ${formatCurrency(lead.estimated_value)} revenue secured`,
          timestamp: lead.updated_at,
          entityLabel: "Closed Won",
          href: `/app/${orgSlug}/leads`,
          iconType: "won",
        });
      });

    // Proposal sent deals
    leads
      .filter((l) => l.stage === "proposal")
      .slice(0, 2)
      .forEach((lead) => {
        events.push({
          id: `recent-proposal-${lead.id}`,
          title: `Proposal Sent: ${lead.title}`,
          subtitle: `${lead.contact_name} • Evaluating quotation`,
          timestamp: lead.updated_at,
          entityLabel: "Proposal",
          href: `/app/${orgSlug}/leads`,
          iconType: "proposal",
        });
      });

    // Completed follow-ups
    tasks
      .filter((t) => t.status === "completed" || completedTaskIds.has(t.id))
      .slice(0, 2)
      .forEach((t) => {
        events.push({
          id: `recent-task-${t.id}`,
          title: `Completed Follow-up: ${t.title}`,
          subtitle: `With ${t.contact_name || "Client"}`,
          timestamp: t.completed_at || t.updated_at,
          entityLabel: "Task Completed",
          href: `/app/${orgSlug}/tasks`,
          iconType: "task-done",
        });
      });

    return events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 4);
  }, [leads, tasks, completedTaskIds, orgSlug]);

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* SECTION A: COMPACT HEADER                                             */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/60">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
              Workspace Overview
            </h1>
            <span className="rounded-full bg-white/90 border border-slate-200/80 text-xs font-bold px-3 py-1 text-slate-700 shadow-2xs">
              {currentOrg.name}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            Real-time business command centre • Operational performance &amp; attention triage
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/app/${orgSlug}/inbox`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white/90 hover:bg-white text-slate-800 border border-slate-200/80 shadow-2xs transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <span>Shared Inbox</span>
            {mounted && unreadConversations.length > 0 && (
              <span
                suppressHydrationWarning
                className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-mono font-black shadow-2xs"
              >
                {unreadConversations.length}
              </span>
            )}
          </Link>

          <Button
            size="sm"
            onClick={() => setNewLeadModalOpen(true)}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs text-xs sm:text-sm h-9.5 px-4 cursor-pointer"
          >
            <Plus className="mr-1.5 h-4 w-4 stroke-[3]" />
            <span>New Lead</span>
          </Button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* RESPONSIVE LAYOUT ENGINE                                              */}
      {/* Mobile: 1. Urgent Attention -> 2. KPIs -> 3. Pipeline -> 4. Activity  */}
      {/* Desktop: 1. KPIs -> 2. Side-by-side [ Attention | Pipeline ] -> 3. Log */}
      {/* ===================================================================== */}
      <div className="flex flex-col gap-6">
        {/* =================================================================== */}
        {/* SECTION B: FOUR ESSENTIAL BUSINESS KPI CARDS                        */}
        {/* Mobile order-2, Desktop order-1                                     */}
        {/* =================================================================== */}
        <div className="order-2 lg:order-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Active Pipeline Value (Blue Accent) */}
          <Link
            href={`/app/${orgSlug}/leads`}
            className="group rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-xs hover:border-blue-400 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between space-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="View Sales Pipeline"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Pipeline Value
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:scale-105 transition-transform">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
            </div>
            <div>
              <div
                suppressHydrationWarning
                className="text-3xl sm:text-4xl font-black font-mono text-slate-950 tracking-tight"
              >
                {formatCurrency(metrics.pipelineValue)}
              </div>
              <p className="text-xs text-slate-600 font-semibold mt-1.5 flex items-center gap-1.5">
                <span>Across</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded">
                  {leads.length}
                </span>
                <span>active opportunities</span>
              </p>
            </div>
          </Link>

          {/* Card 2: Active Leads (Violet Accent) */}
          <Link
            href={`/app/${orgSlug}/leads`}
            className="group rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-xs hover:border-violet-400 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between space-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            title="View Active Leads"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Leads
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-100 group-hover:scale-105 transition-transform">
                <Users className="h-4.5 w-4.5" />
              </div>
            </div>
            <div>
              <div
                suppressHydrationWarning
                className="text-3xl sm:text-4xl font-black font-mono text-slate-950 tracking-tight"
              >
                {leads.length}
              </div>
              <p className="text-xs text-slate-600 font-semibold mt-1.5">
                <span className="font-bold text-slate-900">{metrics.leadsByStage.new.count}</span> new • <span className="font-bold text-slate-900">{metrics.leadsByStage.qualified.count}</span> qualified
              </p>
            </div>
          </Link>

          {/* Card 3: Follow-ups Due (Amber or Coral if Overdue) */}
          <Link
            href={`/app/${orgSlug}/tasks`}
            className={`group rounded-2xl border p-5 shadow-xs hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between space-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              metrics.overdueFollowUps > 0
                ? "border-rose-300 bg-rose-50/20 hover:border-rose-400"
                : "border-slate-200/80 bg-white/95 hover:border-amber-400"
            }`}
            title="View Follow-ups & Reminders"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Follow-ups Due
              </span>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl border group-hover:scale-105 transition-transform ${
                  metrics.overdueFollowUps > 0
                    ? "bg-rose-50 text-rose-600 border-rose-200"
                    : "bg-amber-50 text-amber-600 border-amber-200"
                }`}
              >
                <Clock className="h-4.5 w-4.5" />
              </div>
            </div>
            <div>
              <div
                suppressHydrationWarning
                className="text-3xl sm:text-4xl font-black font-mono text-slate-950 tracking-tight"
              >
                {metrics.openFollowUps}
              </div>
              <div className="text-xs font-semibold mt-1.5">
                {metrics.overdueFollowUps > 0 ? (
                  <span className="text-rose-700 font-bold flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 inline shrink-0" />
                    <span>{metrics.overdueFollowUps} overdue action{metrics.overdueFollowUps > 1 ? "s" : ""}</span>
                  </span>
                ) : (
                  <span className="text-slate-600">All follow-ups on schedule</span>
                )}
              </div>
            </div>
          </Link>

          {/* Card 4: Won Revenue (Green Accent) */}
          <Link
            href={`/app/${orgSlug}/reports`}
            className="group rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-xs hover:border-emerald-400 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between space-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            title="View Revenue Reports"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Won Revenue
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="h-4.5 w-4.5" />
              </div>
            </div>
            <div>
              <div
                suppressHydrationWarning
                className="text-3xl sm:text-4xl font-black font-mono text-slate-950 tracking-tight"
              >
                {formatCurrency(metrics.wonDeals.value)}
              </div>
              <p className="text-xs text-slate-600 font-semibold mt-1.5 flex items-center gap-1.5">
                <span className="text-emerald-700 font-bold">{metrics.wonDeals.count} closed won</span>
                <span>•</span>
                <span className="text-slate-900 font-bold">{metrics.conversionRate}% win rate</span>
              </p>
            </div>
          </Link>
        </div>

        {/* =================================================================== */}
        {/* CORE WORKSPACE PANELS: SIDE-BY-SIDE ON DESKTOP                      */}
        {/* Left: Needs Attention Command Centre (Top Priority)                 */}
        {/* Right: Sales Pipeline Distribution (Proportional Visualisation)     */}
        {/* Mobile order-1 (Attention) and order-3 (Pipeline)                   */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================================================================= */}
          {/* SECTION C: PROMINENT NEEDS ATTENTION SECTION                      */}
          {/* Mobile: order-1 (Top priority), Desktop: lg:order-none col-span-6 */}
          {/* ================================================================= */}
          <div className="order-1 lg:order-none lg:col-span-6 rounded-2xl border border-slate-200/80 bg-white/95 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
                    attentionItems.length > 0 && attentionItems[0].severity === 1
                      ? "bg-rose-50 text-rose-600 border-rose-200"
                      : "bg-amber-50 text-amber-600 border-amber-200"
                  }`}
                >
                  <AlertCircle className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-950 tracking-tight">
                    Needs Attention
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Prioritised actions ordered by urgency and due time
                  </p>
                </div>
              </div>

              {attentionItems.length > 0 && (
                <span
                  suppressHydrationWarning
                  className={`text-xs font-mono font-extrabold px-2.5 py-1 rounded-full border shadow-2xs ${
                    attentionItems[0].severity === 1
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {attentionItems.length} ACTIONABLE
                </span>
              )}
            </div>

            {/* List of Actionable Urgent Items */}
            {attentionItems.length === 0 ? (
              <div className="py-10 text-center rounded-xl bg-slate-50/60 border border-slate-100 p-6 space-y-2.5">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-2xs">
                  <Check className="h-5 w-5 stroke-[2.5]" />
                </div>
                <p className="text-sm font-bold text-slate-900">
                  All caught up! No urgent actions pending
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Follow-ups are on schedule, customer inquiries answered, and automations running smoothly.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {attentionItems.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border border-slate-200/80 bg-white p-3.5 border-l-4 ${item.leftBorderColor} hover:border-slate-300 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={item.badgeVariant}
                          className="text-[10px] uppercase font-extrabold px-2 py-0.2"
                        >
                          {item.badgeText}
                        </Badge>
                        <p className="text-xs sm:text-sm font-bold text-slate-950 truncate">
                          {item.title}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 font-medium line-clamp-1">
                        {item.subtitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.type === "task" && item.taskId && (
                        <button
                          type="button"
                          onClick={() => handleMarkTaskCompleted(item.taskId!)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                          title="Mark follow-up task completed"
                        >
                          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                          <span>Complete</span>
                        </button>
                      )}

                      <Link
                        href={item.href}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          item.type === "inbox"
                            ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                            : item.type === "automation"
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                            : item.type === "lead"
                            ? "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        <span>{item.actionLabel}</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}

                {attentionItems.length > 4 && (
                  <div className="pt-1 text-center">
                    <Link
                      href={`/app/${orgSlug}/tasks`}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 transition-colors"
                    >
                      <span>+{attentionItems.length - 4} more items requiring attention</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* SECTION D: SALES PIPELINE DISTRIBUTION                            */}
          {/* Mobile: order-3, Desktop: lg:order-none col-span-6                */}
          {/* Consistent Stage Palette:                                         */}
          {/* New (blue), Contacted (amber), Qualified (violet),                */}
          {/* Proposal (indigo), Won (green), Lost (coral)                      */}
          {/* ================================================================= */}
          <div className="order-3 lg:order-none lg:col-span-6 rounded-2xl border border-slate-200/80 bg-white/95 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-950 tracking-tight">
                  Sales Pipeline Health
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Opportunity distribution and proportional conversion
                </p>
              </div>

              <Link
                href={`/app/${orgSlug}/leads`}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <span>View Pipeline</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Combined Segment Strip (Proportional Overview) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Funnel Proportions</span>
                <span>{totalPipelineDeals} Total Deals</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 flex overflow-hidden gap-0.5 p-0.5 border border-slate-200/60">
                {stageKeys.map((k) => {
                  const stage = metrics.leadsByStage[k];
                  const widthPct = totalPipelineDeals > 0 ? (stage.count / totalPipelineDeals) * 100 : 0;
                  if (widthPct === 0) return null;
                  return (
                    <div
                      key={k}
                      title={`${STAGE_CONFIG[k].label}: ${stage.count} deals (${Math.round(widthPct)}%)`}
                      style={{ width: `${widthPct}%` }}
                      className={`h-full ${STAGE_CONFIG[k].bar} rounded-sm transition-all`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Compact Breakdown by Stage */}
            <div className="space-y-2.5 pt-1">
              {stageKeys.map((stageKey) => {
                const stageData = metrics.leadsByStage[stageKey];
                const percentage =
                  totalPipelineDeals > 0
                    ? Math.round((stageData.count / totalPipelineDeals) * 100)
                    : 0;
                const config = STAGE_CONFIG[stageKey];

                return (
                  <div key={stageKey} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: config.hex }}
                        />
                        <span className="font-bold text-slate-900">
                          {config.label}
                        </span>
                        <span
                          suppressHydrationWarning
                          className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded"
                        >
                          {stageData.count} deals
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span
                          suppressHydrationWarning
                          className="font-mono font-bold text-slate-950 text-xs sm:text-sm"
                        >
                          {formatCurrency(stageData.value)}
                        </span>
                        <span
                          suppressHydrationWarning
                          className="text-slate-500 font-mono font-bold text-xs w-8 text-right"
                        >
                          {percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Proportional track */}
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: config.hex,
                          width: `${Math.max(percentage, stageData.count > 0 ? 5 : 0)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pipeline Summary Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>
                Active Pipeline:{" "}
                <strong
                  suppressHydrationWarning
                  className="font-mono font-black text-slate-950 text-xs sm:text-sm"
                >
                  {formatCurrency(metrics.pipelineValue)}
                </strong>
              </span>
              <span>
                Conversion Rate:{" "}
                <strong
                  suppressHydrationWarning
                  className="font-mono font-black text-emerald-700 text-xs sm:text-sm"
                >
                  {metrics.conversionRate}%
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* SECTION E: RECENT WORKSPACE ACTIVITY (SECONDARY SECTION)            */}
        {/* Mobile order-4, Desktop order-3                                     */}
        {/* =================================================================== */}
        <div className="order-4 lg:order-3 rounded-2xl border border-slate-200/80 bg-white/95 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-950 tracking-tight">
                Recent Workspace Activity
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Audited timeline of latest client and opportunity updates
              </p>
            </div>

            <Link
              href={`/app/${orgSlug}/leads`}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              <span>View History</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentActivities.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500 font-medium">
                No recent activity recorded yet in this workspace.
              </p>
            ) : (
              recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm hover:bg-slate-50/70 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl border shrink-0 ${
                        act.iconType === "won"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : act.iconType === "proposal"
                          ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                          : act.iconType === "task-done"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-blue-50 text-blue-600 border-blue-200"
                      }`}
                    >
                      {act.iconType === "won" && <Award className="h-4 w-4" />}
                      {act.iconType === "proposal" && <Building2 className="h-4 w-4" />}
                      {act.iconType === "task-done" && <CheckCircle2 className="h-4 w-4" />}
                      {act.iconType === "lead" && <Users className="h-4 w-4" />}
                    </div>

                    <div>
                      <p className="font-bold text-slate-950">{act.title}</p>
                      <p className="text-xs text-slate-500 font-medium">{act.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:justify-end">
                    <span
                      suppressHydrationWarning
                      className="text-xs font-mono text-slate-400 font-medium"
                    >
                      {formatDate(act.timestamp)}
                    </span>
                    <Link
                      href={act.href}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      title="Open Record"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
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
              <label className="block text-xs font-bold text-slate-700">
                Associated Contact
              </label>
              <select
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-none h-11"
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
                <label className="block text-xs font-bold text-slate-700">
                  Initial Stage
                </label>
                <select
                  value={leadStage}
                  onChange={(e) => setLeadStage(e.target.value as LeadStage)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-bold text-slate-800 focus:border-blue-500 focus:outline-none h-11"
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
              <label className="block text-xs font-bold text-slate-700">
                Lead Source
              </label>
              <select
                value={leadSource}
                onChange={(e) => setLeadSource(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none h-11"
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
              className="rounded-xl font-bold text-slate-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-5"
            >
              Create Opportunity
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
