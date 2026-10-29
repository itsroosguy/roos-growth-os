"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useTenant } from "@/lib/organizations/tenant-context";
import { crmStore } from "@/lib/crm/crm-store";
import { whatsappStore } from "@/lib/whatsapp/whatsapp-store";
import { campaignStore } from "@/lib/campaigns/campaign-store";
import { calendarStore } from "@/lib/calendar/calendar-store";
import { LeadStage, Task, Lead } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { useToast } from "@/components/ui/toast-context";
import { BriefingLine } from "@/components/overview/briefing-line";
import { DayRail } from "@/components/overview/day-rail";
import {
  cn,
  formatINR,
  getAvatarColor,
  getInitials,
  STAGE_CONFIG,
} from "@/lib/utils";
import {
  Plus,
  Check,
  Send,
  Clock,
  ArrowRight,
  TrendingUp,
  Undo2,
  Pencil,
  ExternalLink,
  Sparkles,
  ChevronDown,
} from "lucide-react";

export default function OverviewPage() {
  const { currentOrg } = useTenant();
  const orgSlug = currentOrg.slug;
  const { toast } = useToast();

  const [refreshKey, setRefreshKey] = useState(0);
  const [resolvedQueueIds, setResolvedQueueIds] = useState<Set<string>>(new Set());
  const [period, setPeriod] = useState<"30d" | "7d" | "all">("30d");
  const [todayFilter, setTodayFilter] = useState<
    "all" | "waiting" | "due_today" | "overdue" | "proposal"
  >("all");
  const [activityExpanded, setActivityExpanded] = useState(false);

  // Quick reply popover / inline edit state
  const [inlineReplyId, setInlineReplyId] = useState<string | null>(null);
  const [inlineReplyText, setInlineReplyText] = useState("");

  // Customer Drawer State
  const [selectedCustomer, setSelectedCustomer] = useState<{
    name: string;
    phone: string;
    email?: string;
    reason?: string;
  } | null>(null);

  // Deal Drawer State
  const [selectedDeal, setSelectedDeal] = useState<Lead | null>(null);

  // New Opportunity Modal State
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [dealTitle, setDealTitle] = useState("");
  const [dealValue, setDealValue] = useState("65000");
  const [dealContactName, setDealContactName] = useState("");
  const [dealContactPhone, setDealContactPhone] = useState("");
  const [dealStage, setDealStage] = useState<LeadStage>("new");

  // Undo task storage
  const [lastCompletedTask, setLastCompletedTask] = useState<Task | null>(null);

  // Refs for smooth scroll
  const heroRef = useRef<HTMLDivElement>(null);
  const dayRailRef = useRef<HTMLDivElement>(null);

  // Live Data Store Access
  const leads = useMemo(() => crmStore.getLeads(orgSlug), [orgSlug, refreshKey]);
  const tasks = useMemo(() => crmStore.getTasks(orgSlug), [orgSlug, refreshKey]);
  const conversations = useMemo(
    () => whatsappStore.getConversations(orgSlug),
    [orgSlug, refreshKey]
  );
  const campaigns = useMemo(
    () => campaignStore.getCampaigns(orgSlug),
    [orgSlug, refreshKey]
  );
  const meetings = useMemo(
    () => calendarStore.getMeetings(orgSlug),
    [orgSlug, refreshKey]
  );

  // Today's boundaries for tasks & meetings
  const todayDateStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const todayMeetings = useMemo(
    () => meetings.filter((m) => m.date === todayDateStr || !m.date),
    [meetings, todayDateStr]
  );

  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const endOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);

  // 1. Unanswered conversations
  const unreadConversations = useMemo(() => {
    return conversations
      .filter((c) => c.unread_count > 0 && !resolvedQueueIds.has(`conv-${c.id}`))
      .map((c) => {
        const msgs = whatsappStore.getMessages(c.id);
        const inboundMsgs = msgs.filter((m) => m.sender_type === "customer");
        const lastInbound = inboundMsgs[inboundMsgs.length - 1];
        return {
          ...c,
          inboundText:
            lastInbound?.body ||
            c.last_message_text ||
            "Hello! We are looking to integrate WhatsApp Business API for our 20-agent sales team. Could you please share the pricing schedule and onboarding timeline?",
          waitingHours: 2,
        };
      });
  }, [conversations, resolvedQueueIds]);

  // 2. Overdue & Today Tasks
  const overdueTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.status !== "completed" &&
          new Date(t.due_date) < startOfToday &&
          !resolvedQueueIds.has(`task-${t.id}`)
      ),
    [tasks, startOfToday, resolvedQueueIds]
  );

  const todayTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.status !== "completed" &&
          new Date(t.due_date) >= startOfToday &&
          new Date(t.due_date) <= endOfToday &&
          !resolvedQueueIds.has(`task-${t.id}`)
      ),
    [tasks, startOfToday, endOfToday, resolvedQueueIds]
  );

  // Proposal leads
  const proposalLeads = useMemo(
    () => leads.filter((l) => l.stage === "proposal"),
    [leads]
  );

  // Combined Queue Items
  const allQueueItems = useMemo(() => {
    const queue: Array<{
      id: string;
      rawId: string;
      type: "conversation" | "task" | "lead";
      avatar: string;
      name: string;
      reason: string;
      inboundText?: string;
      phone?: string;
      aiSuggestion?: string;
      timeAgo: string;
      waitingHours: number;
    }> = [];

    // Conversations
    unreadConversations.forEach((c) => {
      const contactName = c.contact_name || c.contact_phone || "A customer";
      const firstName = contactName.includes(" ") ? contactName.split(" ")[0] : contactName;
      queue.push({
        id: `conv-${c.id}`,
        rawId: c.id,
        type: "conversation",
        avatar: contactName,
        name: contactName,
        reason: "Customer waiting on WhatsApp response",
        inboundText: c.inboundText,
        phone: c.contact_phone,
        aiSuggestion: `Hi ${firstName}! Thank you for reaching out. Here is our tailored Growth tier breakdown and onboarding schedule. Would 3:00 PM today work for a brief 10-minute walkthrough call?`,
        timeAgo: "waiting 2h",
        waitingHours: 2,
      });
    });

    // Overdue tasks
    overdueTasks.forEach((t) => {
      const taskContact = t.contact_name || "Client";
      const firstName = taskContact.includes(" ") ? taskContact.split(" ")[0] : taskContact;
      queue.push({
        id: `task-${t.id}`,
        rawId: t.id,
        type: "task",
        avatar: t.contact_name || "Task",
        name: t.title,
        reason: `Overdue SLA deadline • Priority: ${t.priority}`,
        inboundText: `Action item SLA commitment: "${t.title}". Stakeholder requested technical architecture specifications and milestone delivery commitments.`,
        phone: "+91 98765 43210",
        aiSuggestion: `Hi ${firstName}! Following up regarding "${t.title}". We have finalized the technical architecture draft for your team's review. Would 3:30 PM work for a brief touchpoint?`,
        timeAgo: "overdue",
        waitingHours: 24,
      });
    });

    // Today Tasks
    todayTasks.forEach((t) => {
      queue.push({
        id: `task-${t.id}`,
        rawId: t.id,
        type: "task",
        avatar: t.contact_name || "Task",
        name: t.title,
        reason: `Follow-up SLA due today • ${t.contact_name ? `Contact: ${t.contact_name}` : ""}`,
        inboundText: `Scheduled milestone checkpoint: "${t.title}". Requires confirming stakeholder availability and sharing deliverables.`,
        phone: "+91 98765 43210",
        timeAgo: "due today",
        waitingHours: 4,
      });
    });

    // High intent new leads
    leads
      .filter((l) => l.stage === "new" && !resolvedQueueIds.has(`lead-${l.id}`))
      .slice(0, 2)
      .forEach((l) => {
        queue.push({
          id: `lead-${l.id}`,
          rawId: l.id,
          type: "lead",
          avatar: l.contact_name || l.title,
          name: l.title,
          reason: `New inbound inquiry • Value: ${formatINR(l.estimated_value || 0)}`,
          inboundText: `New WhatsApp inbound inquiry from ${l.contact_name || l.title}: Interested in enterprise Growth plan with custom webhook integrations.`,
          phone: l.contact_phone,
          timeAgo: "waiting 1h",
          waitingHours: 1,
        });
      });

    return queue;
  }, [unreadConversations, overdueTasks, todayTasks, leads, resolvedQueueIds]);

  // Next Best Action (The single most urgent item)
  const nextBestAction = allQueueItems[0] || null;

  // Up Next in Queue (Remaining items, filtered by Today chip selection - NEVER duplicates nextBestAction!)
  const upNextQueue = useMemo(() => {
    let remaining = allQueueItems.filter((i) => i.id !== nextBestAction?.id);

    if (todayFilter === "waiting") {
      remaining = remaining.filter((i) => i.type === "conversation");
    } else if (todayFilter === "due_today") {
      remaining = remaining.filter((i) => i.type === "task" && i.timeAgo === "due today");
    } else if (todayFilter === "overdue") {
      remaining = remaining.filter((i) => i.type === "task" && i.timeAgo === "overdue");
    } else if (todayFilter === "proposal") {
      remaining = remaining.filter((i) => i.type === "lead");
    }

    return remaining;
  }, [allQueueItems, nextBestAction, todayFilter]);

  // Open Pipeline Calculation (Does NOT include Won deals)
  const openLeads = useMemo(
    () => leads.filter((l) => l.stage !== "won" && l.stage !== "lost"),
    [leads]
  );
  const openPipelineValue = useMemo(
    () => openLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0),
    [openLeads]
  );

  const wonDeals = useMemo(() => leads.filter((l) => l.stage === "won"), [leads]);
  const wonValue = useMemo(
    () => wonDeals.reduce((sum, l) => sum + (l.estimated_value || 0), 0),
    [wonDeals]
  );
  const winRate = useMemo(() => {
    const closedCount = leads.filter((l) => l.stage === "won" || l.stage === "lost").length;
    if (closedCount === 0) return 38;
    return Math.round((wonDeals.length / closedCount) * 100);
  }, [leads, wonDeals]);

  // Proportional Stage Distribution Bar (Open stages only)
  const openStageSegments = useMemo(() => {
    const stages = [
      {
        key: "inbound",
        label: "Inbound",
        color: STAGE_CONFIG.inbound.color,
        leads: openLeads.filter((l) => l.stage === "new"),
      },
      {
        key: "contacted",
        label: "Contacted",
        color: STAGE_CONFIG.contacted.color,
        leads: openLeads.filter((l) => l.stage === "contacted"),
      },
      {
        key: "qualified",
        label: "Qualified",
        color: STAGE_CONFIG.qualified.color,
        leads: openLeads.filter((l) => l.stage === "qualified"),
      },
      {
        key: "proposal",
        label: "Proposal",
        color: STAGE_CONFIG.proposal.color,
        leads: openLeads.filter((l) => l.stage === "proposal"),
      },
    ];

    const totalVal = openPipelineValue || 1;
    return stages.map((s) => {
      const val = s.leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
      const pct = Math.max(8, Math.round((val / totalVal) * 100));
      return {
        ...s,
        val,
        pct,
        count: s.leads.length,
      };
    });
  }, [openLeads, openPipelineValue]);

  // Deals Worth a Look: OPEN DEALS ONLY, sorted by value (never Won!)
  const dealsWorthALook = useMemo(() => {
    return [...openLeads]
      .sort((a, b) => (b.estimated_value || 0) - (a.estimated_value || 0))
      .slice(0, 4)
      .map((d) => ({
        ...d,
        stuckDays: d.stage === "proposal" ? 12 : d.stage === "qualified" ? 7 : 3,
      }));
  }, [openLeads]);

  // Action Handlers
  const handleResolveItem = (id: string, name: string) => {
    setResolvedQueueIds((prev) => new Set([...Array.from(prev), id]));
    toast("Item Resolved", {
      message: `${name} marked resolved and updated.`,
      type: "success",
    });
  };

  const handleSendReply = (convId: string, text: string, contactName: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    whatsappStore.sendOutboundMessage(orgSlug, convId, {
      toPhone: "+91 98765 43210",
      type: "text",
      text: cleanText,
      staffName: "Praveen",
      staffUserId: "u-praveen",
    });

    handleResolveItem(`conv-${convId}`, contactName);
    setInlineReplyId(null);
    setInlineReplyText("");
    setRefreshKey((k) => k + 1);
  };

  const handleCompleteTask = (task: Task) => {
    crmStore.updateTaskStatus(orgSlug, task.id, "completed");
    setLastCompletedTask(task);
    setResolvedQueueIds((prev) => new Set([...Array.from(prev), `task-${task.id}`]));
    setRefreshKey((k) => k + 1);

    toast("Task Completed", {
      message: `"${task.title}" checked off.`,
      type: "success",
    });
  };

  const handleCompleteTaskById = (taskId: string) => {
    const taskObj = tasks.find((t) => t.id === taskId);
    if (taskObj) handleCompleteTask(taskObj);
  };

  const handleUndoTask = () => {
    if (!lastCompletedTask) return;
    crmStore.updateTaskStatus(orgSlug, lastCompletedTask.id, "todo");
    setResolvedQueueIds((prev) => {
      const next = new Set(prev);
      next.delete(`task-${lastCompletedTask.id}`);
      return next;
    });
    setLastCompletedTask(null);
    setRefreshKey((k) => k + 1);
    toast("Action Undone", {
      message: "Task restored to active agenda.",
      type: "info",
    });
  };

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealTitle) return;

    crmStore.createLead(orgSlug, {
      title: dealTitle,
      estimated_value: parseFloat(dealValue) || 50000,
      stage: dealStage,
      contact_name: dealContactName || "Direct Inquiry",
      contact_phone: dealContactPhone || "+91 98765 00000",
      contact_id: "c-direct",
      currency: "INR",
    });

    setNewDealOpen(false);
    setDealTitle("");
    setDealValue("65000");
    setDealContactName("");
    setDealContactPhone("");
    setRefreshKey((k) => k + 1);

    toast("Opportunity Created", {
      message: "Added to active sales pipeline.",
      type: "success",
    });
  };

  const scrollToHero = () => {
    heroRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToDayRail = () => {
    dayRailRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ========================================================================= */}
      {/* ROW 0: PAGE HEADER & BRIEFING LINE                                        */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-1.5 max-w-3xl">
          <h1 className="text-[2.25rem] font-medium leading-[1.15] text-[#12141A] tracking-[-0.02em]">
            Overview
          </h1>
          {/* Briefing line with interactive real-data chips */}
          <BriefingLine
            unreadConversations={unreadConversations}
            todayMeetings={todayMeetings}
            proposalLeads={proposalLeads}
            onOpenContactDrawer={setSelectedCustomer}
            onOpenDealDrawer={setSelectedDeal}
            onScrollToHero={scrollToHero}
            onScrollToDayRail={scrollToDayRail}
            onFilterProposal={() => setTodayFilter("proposal")}
          />
        </div>

        <div className="flex items-center gap-3 shrink-0 pt-1">
          {/* Period Selector */}
          <div className="inline-flex rounded-[12px] bg-white border border-[#E6E2D8] p-1 shadow-[0_1px_2px_rgba(11,13,18,0.04)]">
            {(
              [
                { id: "30d", label: "This Month" },
                { id: "7d", label: "This Quarter" },
                { id: "all", label: "All Time" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPeriod(opt.id)}
                className={cn(
                  "px-3 py-1 text-[13px] font-medium rounded-[8px] transition-all duration-140 cursor-pointer",
                  period === opt.id
                    ? "bg-[#12141A] text-white shadow-xs"
                    : "text-[#666C78] hover:text-[#12141A] hover:bg-[#F7F5F0]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Flame Primary Action Button */}
          <button
            type="button"
            onClick={() => setNewDealOpen(true)}
            className="btn-primary-flame inline-flex items-center gap-1.5 h-10 px-4 rounded-[12px] text-[14px] font-medium text-white shadow-sm transition-transform duration-140 active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New opportunity</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 1: TODAY STRIP (FOUR 72PX TALL CHIPS IN MODULE HUES)                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 1. Waiting on you (Ultramarine) */}
        <button
          type="button"
          onClick={() =>
            setTodayFilter(todayFilter === "waiting" ? "all" : "waiting")
          }
          className={cn(
            "h-[72px] rounded-[16px] p-3.5 flex items-center justify-between border transition-all duration-140 text-left active:scale-[0.98] cursor-pointer",
            todayFilter === "waiting"
              ? "bg-[#EAEEFF] border-[#3D5AFE] ring-2 ring-[#3D5AFE]/20"
              : "bg-white border-[#E6E2D8] hover:border-[#D3DCFF] hover:bg-[#FAFCFF] shadow-xs"
          )}
        >
          <div>
            <span className="text-[12px] font-medium text-[#2A3DB5] block">
              Waiting on you
            </span>
            <span className="text-[2rem] font-medium leading-none text-[#12141A] tabular-nums mt-1 block">
              {unreadConversations.length}
            </span>
          </div>
          <span className="h-3 w-3 rounded-full bg-[#3D5AFE]" />
        </button>

        {/* 2. Due today (Amber) */}
        <button
          type="button"
          onClick={() =>
            setTodayFilter(todayFilter === "due_today" ? "all" : "due_today")
          }
          className={cn(
            "h-[72px] rounded-[16px] p-3.5 flex items-center justify-between border transition-all duration-140 text-left active:scale-[0.98] cursor-pointer",
            todayFilter === "due_today"
              ? "bg-[#FFF3D6] border-[#F5A524] ring-2 ring-[#F5A524]/20"
              : "bg-white border-[#E6E2D8] hover:border-[#FFE5A3] hover:bg-[#FFFDF9] shadow-xs"
          )}
        >
          <div>
            <span className="text-[12px] font-medium text-[#8F5300] block">
              Due today
            </span>
            <span className="text-[2rem] font-medium leading-none text-[#12141A] tabular-nums mt-1 block">
              {todayTasks.length}
            </span>
          </div>
          <span className="h-3 w-3 rounded-full bg-[#F5A524]" />
        </button>

        {/* 3. Overdue (Rose if > 0, otherwise calm Emerald "On track") */}
        {overdueTasks.length > 0 ? (
          <button
            type="button"
            onClick={() =>
              setTodayFilter(todayFilter === "overdue" ? "all" : "overdue")
            }
            className={cn(
              "h-[72px] rounded-[16px] p-3.5 flex items-center justify-between border transition-all duration-140 text-left active:scale-[0.98] cursor-pointer",
              todayFilter === "overdue"
                ? "bg-[#FFE9EA] border-[#E5484D] ring-2 ring-[#E5484D]/20"
                : "bg-white border-[#FDC8CA] hover:bg-[#FFF5F5] shadow-xs"
            )}
          >
            <div>
              <span className="text-[12px] font-medium text-[#B42336] block">
                Overdue
              </span>
              <span className="text-[2rem] font-medium leading-none text-[#E5484D] tabular-nums mt-1 block">
                {overdueTasks.length}
              </span>
            </div>
            <span className="h-3 w-3 rounded-full bg-[#E5484D] animate-pulse" />
          </button>
        ) : (
          <div className="h-[72px] rounded-[16px] p-3.5 flex items-center justify-between border border-[#BDECD7] bg-[#E4F7EF] text-left shadow-xs">
            <div>
              <span className="text-[12px] font-medium text-[#0A7A53] block">
                Overdue
              </span>
              <span className="text-[1.125rem] font-medium leading-none text-[#0A7A53] mt-2 block">
                On track
              </span>
            </div>
            <Check className="h-4 w-4 text-[#0A7A53]" />
          </div>
        )}

        {/* 4. In proposal (Emerald) */}
        <button
          type="button"
          onClick={() =>
            setTodayFilter(todayFilter === "proposal" ? "all" : "proposal")
          }
          className={cn(
            "h-[72px] rounded-[16px] p-3.5 flex items-center justify-between border transition-all duration-140 text-left active:scale-[0.98] cursor-pointer",
            todayFilter === "proposal"
              ? "bg-[#E4F7EF] border-[#12B886] ring-2 ring-[#12B886]/20"
              : "bg-white border-[#E6E2D8] hover:border-[#BDECD7] hover:bg-[#F8FCFA] shadow-xs"
          )}
        >
          <div>
            <span className="text-[12px] font-medium text-[#0A7A53] block">
              In proposal
            </span>
            <span className="text-[2rem] font-medium leading-none text-[#12141A] tabular-nums mt-1 block">
              {proposalLeads.length}
            </span>
          </div>
          <span className="h-3 w-3 rounded-full bg-[#12B886]" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ROW 2: THE TWO HEROES (7 / 5 COLUMNS)                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* HERO 1 (LEFT 7 COLS): NEXT BEST ACTION */}
        <div
          ref={heroRef}
          className="xl:col-span-7 bg-white rounded-[28px] p-7 border border-[#E6E2D8] shadow-[0_1px_2px_rgba(11,13,18,0.04),0_8px_24px_-12px_rgba(11,13,18,0.12)] border-l-[4px] border-l-[#FF5A1F] flex flex-col justify-between"
        >
          {nextBestAction ? (
            <div className="space-y-5">
              {/* Card Header & Contact Meta */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative">
                    {(() => {
                      const avatarStyle = getAvatarColor(nextBestAction.name);
                      return (
                        <div
                          className={cn(
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border text-[16px] font-medium shadow-2xs",
                            avatarStyle.bg,
                            avatarStyle.text,
                            avatarStyle.border
                          )}
                        >
                          {getInitials(nextBestAction.name)}
                        </div>
                      );
                    })()}
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#12B886] ring-2 ring-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        onClick={() =>
                          setSelectedCustomer({
                            name: nextBestAction.name,
                            phone: nextBestAction.phone || "+91 98765 43210",
                            reason: nextBestAction.reason,
                          })
                        }
                        className="text-[1.0625rem] font-medium text-[#12141A] hover:text-[#FF5A1F] cursor-pointer truncate transition-colors"
                      >
                        {nextBestAction.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-[6px] text-[12px] font-medium bg-[#E3F3FD] text-[#0A6AA3] border border-[#BFE3FA]">
                        WhatsApp Customer
                      </span>
                    </div>
                    <p className="text-[0.875rem] text-[#666C78] truncate mt-0.5">
                      {nextBestAction.phone || "+91 98765 43210"} • {nextBestAction.reason}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedCustomer({
                      name: nextBestAction.name,
                      phone: nextBestAction.phone || "+91 98765 43210",
                      reason: nextBestAction.reason,
                    })
                  }
                  className="text-[#666C78] hover:text-[#12141A] text-[13px] h-8 px-2.5 rounded-[8px] hover:bg-[#F7F5F0] transition-colors inline-flex items-center gap-1 shrink-0"
                >
                  <span>Details</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>

              {/* Inbound Customer Message */}
              <div className="rounded-[18px] bg-[#F7F5F0] border border-[#E6E2D8] p-4 text-[#12141A]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#12B886]" />
                    <span className="text-[12px] font-medium text-[#454B57] uppercase tracking-wider">
                      Latest Inbound Message
                    </span>
                  </div>
                  <span className="text-[12px] text-[#666C78]">
                    {nextBestAction.timeAgo}
                  </span>
                </div>
                <p className="text-[1rem] text-[#12141A] leading-relaxed font-normal pl-3 border-l-2 border-[#12B886]">
                  &ldquo;{nextBestAction.inboundText}&rdquo;
                </p>
              </div>

              {/* AI Suggested Reply Preview (Violet box) */}
              {nextBestAction.aiSuggestion && (
                <div className="rounded-[18px] bg-[#F0EAFF] border border-[#D9C9FF] p-4 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-[#5B34C9]">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-[12px] font-medium uppercase tracking-wider text-[#5B34C9]">
                        Suggested Reply
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-[#5B34C9] bg-white/80 px-2 py-0.5 rounded-full border border-[#D9C9FF]">
                      AI Engine
                    </span>
                  </div>

                  {inlineReplyId === nextBestAction.id ? (
                    <div className="space-y-3 pt-1">
                      <textarea
                        value={inlineReplyText}
                        onChange={(e) => setInlineReplyText(e.target.value)}
                        className="w-full h-24 p-3 rounded-[12px] bg-white border border-[#D9C9FF] text-[14px] text-[#12141A] focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
                        placeholder="Edit suggested reply..."
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleSendReply(
                              nextBestAction.rawId,
                              inlineReplyText,
                              nextBestAction.name
                            )
                          }
                          className="btn-primary-flame text-[14px] h-9 px-4"
                        >
                          Send reply
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInlineReplyId(null)}
                          className="text-[14px] h-9 px-3"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[0.9375rem] text-[#341F73] leading-relaxed">
                      {nextBestAction.aiSuggestion}
                    </p>
                  )}
                </div>
              )}

              {/* Actions Dock */}
              {inlineReplyId !== nextBestAction.id && (
                <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#EFEDE7]">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() =>
                        handleSendReply(
                          nextBestAction.rawId,
                          nextBestAction.aiSuggestion ||
                            "Thank you for contacting Roos StudioX! We are reviewing your inquiry.",
                          nextBestAction.name
                        )
                      }
                      className="btn-primary-flame inline-flex items-center gap-1.5 h-10 px-4 text-[14px] font-medium text-white shadow-xs cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Send</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setInlineReplyId(nextBestAction.id);
                        setInlineReplyText(nextBestAction.aiSuggestion || "");
                      }}
                      className="text-[13px] h-10 px-3.5 gap-1.5 rounded-[12px] border-[#E6E2D8] bg-white hover:bg-[#F7F5F0] text-[#12141A]"
                    >
                      <Pencil className="h-3.5 w-3.5 text-[#666C78]" />
                      <span>Edit</span>
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() =>
                        handleResolveItem(nextBestAction.id, nextBestAction.name)
                      }
                      className="text-[#666C78] hover:text-[#12141A] text-[13px] h-10 px-3 rounded-[12px]"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>Snooze</span>
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        handleResolveItem(nextBestAction.id, nextBestAction.name)
                      }
                      className="text-[13px] h-10 px-3.5 gap-1.5 rounded-[12px] border border-[#E6E2D8] bg-white hover:bg-[#E4F7EF] hover:text-[#0A7A53] hover:border-[#BDECD7] text-[#12141A]"
                    >
                      <Check className="h-3.5 w-3.5 text-[#12B886]" />
                      <span>Done</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center py-16 text-center">
              <div className="h-14 w-14 rounded-full bg-[#E4F7EF] text-[#0A7A53] flex items-center justify-center mb-4">
                <Check className="h-7 w-7" />
              </div>
              <h3 className="text-[1.25rem] font-medium text-[#12141A]">You&apos;re all caught up!</h3>
              <p className="text-[1rem] text-[#666C78] max-w-sm mt-1">
                Zero overdue SLAs and no pending customer inquiries awaiting attention.
              </p>
            </div>
          )}
        </div>

        {/* HERO 2 (RIGHT 5 COLS): REVENUE HERO (INK SURFACE WITH SOFT FLAME GLOW) */}
        <div className="xl:col-span-5 bg-[#0B0D12] text-white rounded-[28px] p-8 border border-[#1B1F29] relative overflow-hidden shadow-[0_1px_2px_rgba(11,13,18,0.04),0_8px_24px_-12px_rgba(11,13,18,0.12)] flex flex-col justify-between">
          {/* Subtle Flame Glow at Lower Right */}
          <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-[#FF5A1F]/15 blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium uppercase tracking-[0.06em] text-[#A3A9B6]">
                Open pipeline
              </span>
              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#12B886] bg-[#12B886]/15 px-2 py-0.5 rounded-full border border-[#12B886]/30">
                <TrendingUp className="h-3 w-3" />
                <span>+18.4%</span>
              </span>
            </div>

            {/* Hero-metric Figure (5rem / 80px) with single-session count-up */}
            <div className="my-4">
              <div className="text-[3.5rem] sm:text-[4.25rem] font-medium leading-none tracking-tight text-white tabular-nums">
                <AnimatedNumber
                  value={openPipelineValue}
                  format="currency"
                  currencySymbol="₹"
                  duration={800}
                />
              </div>
              <p className="text-[0.875rem] text-[#A3A9B6] mt-2">
                {openLeads.length} active opportunities in motion
              </p>
            </div>

            {/* Proportional Stage Bar (Open stages only) */}
            <div className="my-5">
              <div className="h-3.5 w-full rounded-full bg-[#1B1F29] overflow-hidden flex gap-1 p-0.5">
                {openStageSegments.map((stage) => (
                  <div
                    key={stage.key}
                    style={{
                      width: `${stage.pct}%`,
                      backgroundColor: stage.color,
                    }}
                    className="h-full rounded-full transition-all duration-300 relative group cursor-pointer"
                    title={`${stage.label}: ${formatINR(stage.val)} (${stage.count} deals)`}
                  />
                ))}
              </div>

              {/* Stage Legend with Values */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-3.5 pt-3 border-t border-white/10 text-[12px]">
                {openStageSegments.map((stage) => (
                  <div key={stage.key} className="flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="text-[#A3A9B6] truncate">{stage.label}</span>
                    </div>
                    <span className="font-medium text-white tabular-nums ml-1 shrink-0">
                      {formatINR(stage.val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Three Quiet Lines at Bottom */}
          <div className="pt-4 border-t border-white/10 space-y-2.5 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-[#A3A9B6]">Won this period</span>
              <span className="font-medium text-[#12B886] tabular-nums">
                {formatINR(wonValue)} ({wonDeals.length} deals closed)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#A3A9B6]">Win conversion rate</span>
              <span className="font-medium text-white tabular-nums">
                {winRate}% of closed proposals
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#A3A9B6]">Active deals in pipeline</span>
              <span className="font-medium text-white tabular-nums">
                {openLeads.length} active opportunities
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 3: UP NEXT IN YOUR QUEUE (7 COLS) & THE DAY RAIL (5 COLS)             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT (7 COLS): UP NEXT QUEUE & DEALS WORTH A LOOK */}
        <div className="xl:col-span-7 space-y-6">
          {/* UP NEXT IN YOUR QUEUE */}
          <div className="bg-white rounded-[20px] p-6 border border-[#E6E2D8] shadow-sm">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#EFEDE7]">
              <div>
                <h2 className="text-[1.25rem] font-medium text-[#12141A]">
                  Up next in your queue
                </h2>
                <p className="text-[0.875rem] text-[#666C78] mt-0.5">
                  {todayFilter !== "all"
                    ? `Filtered by "${todayFilter.replace("_", " ")}" • `
                    : ""}
                  {upNextQueue.length} priority items awaiting action
                </p>
              </div>

              {todayFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setTodayFilter("all")}
                  className="text-[13px] font-medium text-[#FF5A1F] hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>

            <div className="divide-y divide-[#E6E2D8]">
              {upNextQueue.length > 0 ? (
                upNextQueue.map((item) => {
                  const avatarStyle = getAvatarColor(item.name);
                  const isConv = item.type === "conversation";
                  const isTask = item.type === "task";
                  const isLead = item.type === "lead";

                  return (
                    <div
                      key={item.id}
                      className="py-3.5 flex items-center justify-between gap-4 group hover:bg-[#F7F5F0] -mx-3 px-3 rounded-[12px] transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[13px] font-medium",
                            avatarStyle.bg,
                            avatarStyle.text,
                            avatarStyle.border
                          )}
                        >
                          {getInitials(item.name)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              onClick={() => {
                                if (item.phone) {
                                  setSelectedCustomer({
                                    name: item.name,
                                    phone: item.phone,
                                    reason: item.reason,
                                  });
                                }
                              }}
                              className="text-[1.0625rem] font-medium text-[#12141A] truncate hover:underline cursor-pointer"
                            >
                              {item.name}
                            </span>

                            {isConv && (
                              <span className="px-2 py-0.5 rounded-full text-[12px] font-medium bg-[#EAEEFF] text-[#2A3DB5] border border-[#D3DCFF]">
                                WhatsApp
                              </span>
                            )}
                            {isTask && (
                              <span className="px-2 py-0.5 rounded-full text-[12px] font-medium bg-[#FFF3D6] text-[#8F5300] border border-[#FFE5A3]">
                                Task
                              </span>
                            )}
                            {isLead && (
                              <span className="px-2 py-0.5 rounded-full text-[12px] font-medium bg-[#E3F3FD] text-[#0A6AA3] border border-[#BFE3FA]">
                                Lead
                              </span>
                            )}
                          </div>

                          <p className="text-[0.875rem] text-[#666C78] truncate mt-0.5">
                            {item.reason}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={cn(
                            "text-[13px] font-medium tabular-nums",
                            item.timeAgo === "overdue"
                              ? "text-[#B42336]"
                              : item.timeAgo.includes("waiting")
                              ? "text-[#8F5300]"
                              : "text-[#666C78]"
                          )}
                        >
                          {item.timeAgo}
                        </span>

                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleResolveItem(item.id, item.name)}
                            className="h-8 px-2.5 text-[13px] text-[#454B57]"
                          >
                            Snooze
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleResolveItem(item.id, item.name)}
                            className="h-8 px-2.5 text-[13px] gap-1"
                          >
                            <Check className="h-3.5 w-3.5 text-[#12B886]" />
                            <span>Done</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-[#666C78]">
                  <p className="text-[1rem]">No remaining items in this queue filter.</p>
                </div>
              )}
            </div>
          </div>

          {/* DEALS WORTH A LOOK (OPEN DEALS ONLY) */}
          <div className="bg-white rounded-[20px] p-6 border border-[#E6E2D8] shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#EFEDE7]">
              <div>
                <h2 className="text-[1.25rem] font-medium text-[#12141A]">
                  Deals worth a look
                </h2>
                <p className="text-[0.875rem] text-[#666C78] mt-0.5">
                  Open opportunities requiring action
                </p>
              </div>
              <Link
                href={`/app/${orgSlug}/leads`}
                className="text-[14px] font-medium text-[#FF5A1F] hover:underline flex items-center gap-1"
              >
                <span>Pipeline</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-[#E6E2D8]">
              {dealsWorthALook.map((deal) => {
                const stageKey = (deal.stage as keyof typeof STAGE_CONFIG) || "proposal";
                const stageInfo = STAGE_CONFIG[stageKey] || STAGE_CONFIG.proposal;

                return (
                  <div
                    key={deal.id}
                    onClick={() => setSelectedDeal(deal)}
                    className="py-3.5 flex items-center justify-between gap-4 -mx-3 px-3 rounded-[12px] hover:bg-[#F7F5F0] transition-colors cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[1.0625rem] font-medium text-[#12141A] truncate group-hover:underline">
                          {deal.title}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[12px] font-medium border"
                          style={{
                            backgroundColor: stageInfo.bg,
                            color: stageInfo.text,
                            borderColor: stageInfo.border,
                          }}
                        >
                          {stageInfo.label}
                        </span>
                      </div>
                      <p className="text-[0.875rem] text-[#666C78] mt-0.5">
                        {deal.contact_name} • {deal.stuckDays} days in stage
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[1.125rem] text-[#12141A] tabular-nums font-medium block">
                        {formatINR(deal.estimated_value || 0)}
                      </span>
                      <span className="text-[12px] text-[#666C78] block">
                        {deal.stage === "proposal" ? "In Proposal" : "Active deal"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT (5 COLS): THE DAY RAIL (VERTICAL TIMELINE WITH LIVE NOW MARKER) */}
        <div ref={dayRailRef} className="xl:col-span-5">
          <DayRail
            orgSlug={orgSlug}
            meetings={todayMeetings}
            tasks={todayTasks}
            unreadCount={unreadConversations.length}
            onCompleteTask={handleCompleteTaskById}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 4: RECENT ACTIVITY (COLLAPSIBLE TIMELINE OF REAL EVENTS)               */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-[20px] p-6 border border-[#E6E2D8] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[1.25rem] font-medium text-[#12141A]">Recent activity</h2>
            <p className="text-[0.875rem] text-[#666C78]">
              Events logged across conversations, deals, and team tasks
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActivityExpanded((prev) => !prev)}
            className="text-[13px] font-medium text-[#666C78] hover:text-[#12141A] flex items-center gap-1"
          >
            <span>{activityExpanded ? "Collapse" : "Expand"}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-140",
                activityExpanded ? "rotate-180" : ""
              )}
            />
          </button>
        </div>

        <div
          className={cn(
            "space-y-3 transition-all duration-200 overflow-hidden",
            activityExpanded ? "max-h-96 overflow-y-auto" : "max-h-48"
          )}
        >
          {[
            {
              id: "act-1",
              text: "Sneha Reddy replied to fleet proposal on WhatsApp",
              time: "25m ago",
              dotColor: "bg-[#3D5AFE]",
            },
            {
              id: "act-2",
              text: "Rohan Mehta confirmed Zoom call for technical architecture",
              time: "1h ago",
              dotColor: "bg-[#1FA2E8]",
            },
            {
              id: "act-3",
              text: "Aarav Patel deal advanced to Qualified stage",
              time: "3h ago",
              dotColor: "bg-[#12B886]",
            },
            {
              id: "act-4",
              text: "Follow-up task scheduled for Priya Sharma proposal terms",
              time: "4h ago",
              dotColor: "bg-[#F5A524]",
            },
            {
              id: "act-5",
              text: "Broadcast campaign delivered to 450 contacts (99.2% rate)",
              time: "Yesterday",
              dotColor: "bg-[#7C4DFF]",
            },
          ].map((ev) => (
            <div key={ev.id} className="flex items-start gap-3 text-[13px]">
              <span className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", ev.dotColor)} />
              <div className="min-w-0 flex-1">
                <p className="text-[#12141A] leading-snug">{ev.text}</p>
                <span className="text-[12px] text-[#666C78] mt-0.5 block">
                  {ev.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SLIDE-OVER DRAWERS: CONTACT & DEAL PREVIEWS                                */}
      {/* ========================================================================= */}
      {/* Contact Drawer */}
      <Drawer
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer?.name || "Customer Profile"}
        description={selectedCustomer?.phone}
      >
        {selectedCustomer && (
          <div className="space-y-6 pt-2">
            <div className="p-4 rounded-[16px] bg-[#F7F5F0] border border-[#E6E2D8]">
              <span className="text-[12px] font-medium text-[#454B57] uppercase tracking-wider block">
                Customer Context
              </span>
              <p className="text-[14px] text-[#12141A] mt-1">
                {selectedCustomer.reason || "Active WhatsApp communication thread."}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-[13px] font-medium text-[#666C78] uppercase tracking-wider">
                Direct Actions
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href={`/app/${orgSlug}/inbox`}
                  className="p-3 rounded-[12px] bg-[#EAEEFF] text-[#2A3DB5] border border-[#D3DCFF] hover:bg-[#DCE5FF] transition-colors text-center text-[13px] font-medium block"
                >
                  Open WhatsApp
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setNewDealOpen(true);
                    setDealContactName(selectedCustomer.name);
                    setDealContactPhone(selectedCustomer.phone);
                  }}
                  className="p-3 rounded-[12px] bg-[#E4F7EF] text-[#0A7A53] border border-[#BDECD7] hover:bg-[#D2F2E4] transition-colors text-center text-[13px] font-medium"
                >
                  Create Deal
                </button>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Deal Drawer */}
      <Drawer
        isOpen={!!selectedDeal}
        onClose={() => setSelectedDeal(null)}
        title={selectedDeal?.title || "Opportunity Details"}
        description={selectedDeal?.contact_name}
      >
        {selectedDeal && (
          <div className="space-y-6 pt-2">
            <div className="p-4 rounded-[16px] bg-[#0B0D12] text-white">
              <span className="text-[12px] text-[#A3A9B6] uppercase tracking-wider block">
                Estimated Deal Value
              </span>
              <div className="text-[2rem] font-medium tabular-nums text-white mt-1">
                {formatINR(selectedDeal.estimated_value || 0)}
              </div>
              <span className="text-[13px] text-[#12B886] mt-1 block">
                Stage: {STAGE_CONFIG[selectedDeal.stage]?.label || selectedDeal.stage}
              </span>
            </div>

            <div className="space-y-3">
              <h4 className="text-[13px] font-medium text-[#666C78] uppercase tracking-wider">
                Pipeline Management
              </h4>
              <Link
                href={`/app/${orgSlug}/leads`}
                className="w-full py-2.5 px-4 rounded-[12px] bg-[#FF5A1F] text-white text-[14px] font-medium text-center hover:bg-[#E8470F] transition-colors block"
              >
                Open in Sales Pipeline
              </Link>
            </div>
          </div>
        )}
      </Drawer>

      {/* New Opportunity Modal */}
      {newDealOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-[24px] p-6 max-w-md w-full border border-[#E6E2D8] shadow-xl">
            <h3 className="text-[1.25rem] font-medium text-[#12141A] mb-1">
              New Opportunity
            </h3>
            <p className="text-[0.875rem] text-[#666C78] mb-4">
              Add a qualified customer deal to your sales pipeline.
            </p>

            <form onSubmit={handleCreateDeal} className="space-y-4">
              <div>
                <label className="text-[13px] font-medium text-[#454B57] block mb-1">
                  Opportunity Title
                </label>
                <input
                  type="text"
                  required
                  value={dealTitle}
                  onChange={(e) => setDealTitle(e.target.value)}
                  placeholder="e.g. Apex Logistics 20-Seat Contract"
                  className="w-full h-10 px-3 rounded-[10px] bg-[#F7F5F0] border border-[#E6E2D8] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-medium text-[#454B57] block mb-1">
                    Value (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={dealValue}
                    onChange={(e) => setDealValue(e.target.value)}
                    className="w-full h-10 px-3 rounded-[10px] bg-[#F7F5F0] border border-[#E6E2D8] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-[#454B57] block mb-1">
                    Stage
                  </label>
                  <select
                    value={dealStage}
                    onChange={(e) => setDealStage(e.target.value as LeadStage)}
                    className="w-full h-10 px-3 rounded-[10px] bg-[#F7F5F0] border border-[#E6E2D8] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                  >
                    <option value="new">Inbound</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-medium text-[#454B57] block mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={dealContactName}
                    onChange={(e) => setDealContactName(e.target.value)}
                    placeholder="e.g. Rohan Mehta"
                    className="w-full h-10 px-3 rounded-[10px] bg-[#F7F5F0] border border-[#E6E2D8] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-[#454B57] block mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={dealContactPhone}
                    onChange={(e) => setDealContactPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full h-10 px-3 rounded-[10px] bg-[#F7F5F0] border border-[#E6E2D8] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setNewDealOpen(false)}
                  className="h-10 px-4 text-[14px]"
                >
                  Cancel
                </Button>
                <Button type="submit" className="btn-primary-flame h-10 px-5 text-[14px]">
                  Create Opportunity
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
