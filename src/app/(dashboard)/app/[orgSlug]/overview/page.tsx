"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useTenant } from "@/lib/organizations/tenant-context";
import { crmStore } from "@/lib/crm/crm-store";
import { whatsappStore } from "@/lib/whatsapp/whatsapp-store";
import { campaignStore } from "@/lib/campaigns/campaign-store";
import { LeadStage, Task, Lead, Contact } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { Input } from "@/components/ui/input";
import { Drawer } from "@/components/ui/drawer";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { useToast } from "@/components/ui/toast-context";
import {
  cn,
  formatINR,
  getAvatarColor,
  getInitials,
  formatRelativeTime,
  STAGE_CONFIG,
} from "@/lib/utils";
import {
  Plus,
  MessageSquare,
  CheckCircle2,
  Filter,
  Check,
  ChevronDown,
  ChevronRight,
  Send,
  Clock,
  User,
  ArrowRight,
  X,
  Phone,
  Building2,
  Calendar,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Undo2,
  Zap,
  Pencil,
  ExternalLink,
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
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  // Customer Drawer State
  const [selectedCustomer, setSelectedCustomer] = useState<{
    name: string;
    phone: string;
    email?: string;
    reason?: string;
  } | null>(null);

  // Deal Drawer State
  const [selectedDeal, setSelectedDeal] = useState<Lead | null>(null);

  // Client mounted state to guard hydration
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // New Opportunity Modal/Drawer State
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [dealTitle, setDealTitle] = useState("");
  const [dealValue, setDealValue] = useState("65000");
  const [dealContactName, setDealContactName] = useState("");
  const [dealContactPhone, setDealContactPhone] = useState("");
  const [dealStage, setDealStage] = useState<LeadStage>("new");

  // Undo task storage
  const [lastCompletedTask, setLastCompletedTask] = useState<Task | null>(null);

  // Live Data Store Access
  const metrics = useMemo(() => crmStore.getMetrics(orgSlug), [orgSlug, refreshKey]);
  const leads = useMemo(() => crmStore.getLeads(orgSlug), [orgSlug, refreshKey]);
  const tasks = useMemo(() => crmStore.getTasks(orgSlug), [orgSlug, refreshKey]);
  const contacts = useMemo(() => crmStore.getContacts(orgSlug), [orgSlug, refreshKey]);
  const conversations = useMemo(
    () => whatsappStore.getConversations(orgSlug),
    [orgSlug, refreshKey]
  );
  const campaigns = useMemo(
    () => campaignStore.getCampaigns(orgSlug),
    [orgSlug, refreshKey]
  );

  // 1. Unanswered conversations that have legitimate customer inbound messages
  const unreadConversations = useMemo(() => {
    return conversations
      .filter((c) => c.unread_count > 0 && !resolvedQueueIds.has(`conv-${c.id}`))
      .map((c) => {
        const msgs = whatsappStore.getMessages(c.id);
        const inboundMsgs = msgs.filter((m) => m.sender_type === "customer");
        const lastInbound = inboundMsgs[inboundMsgs.length - 1];
        return {
          ...c,
          // True inbound message content (never outbound automated template)
          inboundText:
            lastInbound?.body ||
            (c.last_message_text && !c.last_message_text.startsWith("Hello")
              ? c.last_message_text
              : "Inquiring about package customization and enterprise team onboarding terms."),
        };
      });
  }, [conversations, resolvedQueueIds]);

  const proposalDeals = useMemo(
    () => leads.filter((l) => l.stage === "proposal"),
    [leads]
  );

  // Stable start/end of today
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

  // Time-aware greeting line
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    let salutation = "Good morning";
    if (hour >= 12 && hour < 17) salutation = "Good afternoon";
    if (hour >= 17) salutation = "Good evening";

    const topWaiting = unreadConversations[0];
    if (topWaiting) {
      return `${salutation}, Praveen. ${topWaiting.contact_name || "A customer"} has been waiting 2 hours.`;
    }
    if (todayTasks.length > 0) {
      return `${salutation}, Praveen. You have ${todayTasks.length} priority follow-ups due today.`;
    }
    return `${salutation}, Praveen. All customer queues and SLAs are currently on track.`;
  }, [unreadConversations, todayTasks]);

  // Combined Queue Items
  const allQueueItems = useMemo(() => {
    const queue: Array<{
      id: string;
      rawId: string;
      type: "conversation" | "task" | "lead" | "automation";
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
    unreadConversations.forEach((c, idx) => {
      queue.push({
        id: `conv-${c.id}`,
        rawId: c.id,
        type: "conversation",
        avatar: c.contact_name || c.contact_phone,
        name: c.contact_name || c.contact_phone,
        reason: "Customer waiting on WhatsApp response",
        inboundText:
          c.inboundText ||
          "Hello! We are looking to integrate WhatsApp Business API for our 20-agent sales team. Could you please share the pricing schedule and onboarding timeline?",
        phone: c.contact_phone,
        aiSuggestion:
          idx === 0
            ? "Hi Rahul! Absolutely, here is the updated quotation for the 5-seat Growth bundle with Meta verification setup included. Let me know if you would like a quick walkthrough call!"
            : "Hello! We would be glad to share the pricing schedule. Let me know your preferred call time.",
        timeAgo: "waiting 2h",
        waitingHours: 2,
      });
    });

    // Overdue tasks
    overdueTasks.forEach((t) => {
      queue.push({
        id: `task-${t.id}`,
        rawId: t.id,
        type: "task",
        avatar: t.contact_name || "Task",
        name: t.title,
        reason: `Overdue SLA deadline • Priority: ${t.priority}`,
        inboundText: `Action item SLA commitment: "${t.title}". Stakeholder requested technical architecture specifications and milestone delivery commitments.`,
        phone: "+91 98765 43210",
        aiSuggestion: `Hi! Following up regarding "${t.title}". We have finalized the technical architecture draft and milestone schedule for your team's review. Would 3:30 PM today work for a brief 10-minute touchpoint?`,
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
        inboundText: `Scheduled milestone checkpoint: "${t.title}". Requires confirming stakeholder availability and sharing sprint deliverables.`,
        phone: "+91 98765 43210",
        aiSuggestion: `Hi! Touching base as agreed regarding "${t.title}". Everything is on track from our end, and I have shared the review notes. Let me know if any adjustments are needed.`,
        timeAgo: "due today",
        waitingHours: 4,
      });
    });

    // High intent leads
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
          aiSuggestion: `Hello ${l.contact_name || "there"}! Welcome to Roos StudioX. We received your inquiry and would be delighted to set up a personalized demonstration for your team. What day this week suits you best?`,
          timeAgo: "waiting 1h",
          waitingHours: 1,
        });
      });

    return queue;
  }, [unreadConversations, overdueTasks, todayTasks, leads, resolvedQueueIds]);

  // Next Best Action (The single most urgent item)
  const nextBestAction = allQueueItems[0] || null;

  // Up Next in Queue (Remaining items, filtered by Today chip selection)
  const upNextQueue = useMemo(() => {
    // Exclude the nextBestAction so it never duplicates!
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

  // Proportional Stage Distribution (Open stages only with meaningful colors)
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

  // Deals Worth a Look: OPEN DEALS ONLY, sorted by value & stuck time (never Won!)
  const dealsWorthALook = useMemo(() => {
    return [...openLeads]
      .sort((a, b) => (b.estimated_value || 0) - (a.estimated_value || 0))
      .slice(0, 4)
      .map((d) => ({
        ...d,
        stuckDays: d.stage === "proposal" ? 12 : d.stage === "qualified" ? 7 : 3,
      }));
  }, [openLeads]);

  // Coming Up Feed (Chronological follow-ups & SLAs)
  const comingUpItems = useMemo(() => {
    const items: Array<{
      id: string;
      rawId: string;
      title: string;
      time: string;
      badge: string;
      isTask: boolean;
    }> = [];

    todayTasks.forEach((t) => {
      items.push({
        id: `coming-task-${t.id}`,
        rawId: t.id,
        title: t.title,
        time: "Today, 4:00 PM",
        badge: t.priority === "high" ? "Urgent SLA" : "Follow-up",
        isTask: true,
      });
    });

    // Scheduled Broadcast Campaign
    campaigns
      .filter((c) => c.status === "processing" || c.status === "draft")
      .slice(0, 1)
      .forEach((c) => {
        items.push({
          id: `coming-camp-${c.id}`,
          rawId: c.id,
          title: `Broadcast: ${c.name}`,
          time: "Today, 6:30 PM",
          badge: "Scheduled",
          isTask: false,
        });
      });

    return items;
  }, [todayTasks, campaigns]);

  // Action Handlers
  const handleResolveItem = (id: string, name: string) => {
    setResolvedQueueIds((prev) => new Set([...Array.from(prev), id]));
    toast("Item Resolved", {
      message: `${name} has been marked completed and updated.`,
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

  return (
    <div className="space-y-8 pb-16">
      {/* ========================================================================= */}
      {/* ROW 0: PAGE HEADER & TIME-AWARE GREETING                                  */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="type-display text-[#12141A]">Overview</h1>
          <p className="type-body text-[#454B57] mt-1" suppressHydrationWarning>
            {timeGreeting}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="inline-flex rounded-[12px] bg-white border border-[#E6E2D8] p-1 shadow-[0_1px_2px_rgba(11,13,18,0.04)]">
            {(
              [
                { id: "30d", label: "This Month" },
                { id: "7d", label: "This Quarter" },
                { id: "all", label: "All Time" },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-[10px] text-[14px] font-medium transition-all duration-140",
                  period === p.id
                    ? "bg-[#12141A] text-white shadow-sm"
                    : "text-[#666C78] hover:text-[#12141A]"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Single Primary Action Button: Flame CTA */}
          <Button
            onClick={() => setNewDealOpen(true)}
            className="btn-primary-flame gap-2 h-10 px-4"
          >
            <Plus className="h-4 w-4" />
            <span>New opportunity</span>
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 1: TODAY STRIP (BLACK BACKGROUND, RED NEGATIVE, GREEN POSITIVE, ORANGE OTHERS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Chip 1: Waiting on you (Orange) */}
        <button
          type="button"
          onClick={() => setTodayFilter((f) => (f === "waiting" ? "all" : "waiting"))}
          className={cn(
            "flex items-center justify-between h-[72px] px-5 rounded-[20px] border transition-all duration-140 text-left cursor-pointer bg-[#0B0D12] hover:scale-[1.01] active:scale-[0.99]",
            todayFilter === "waiting"
              ? "border-[#FF7A1A] ring-1 ring-[#FF7A1A]/40 shadow-[0_4px_20px_rgba(255,122,26,0.22)]"
              : "border-white/10 hover:border-[#FF7A1A]/50 shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
          )}
        >
          <div className="min-w-0">
            <span className="type-eyebrow text-[#FF7A1A]">Waiting on you</span>
            <p className="type-small text-[#8E95A3] truncate mt-0.5">
              Unanswered conversations
            </p>
          </div>
          <span className="type-metric text-[#FF7A1A] ml-3 shrink-0" suppressHydrationWarning>
            {unreadConversations.length}
          </span>
        </button>

        {/* Chip 2: Due today (Orange) */}
        <button
          type="button"
          onClick={() => setTodayFilter((f) => (f === "due_today" ? "all" : "due_today"))}
          className={cn(
            "flex items-center justify-between h-[72px] px-5 rounded-[20px] border transition-all duration-140 text-left cursor-pointer bg-[#0B0D12] hover:scale-[1.01] active:scale-[0.99]",
            todayFilter === "due_today"
              ? "border-[#FF7A1A] ring-1 ring-[#FF7A1A]/40 shadow-[0_4px_20px_rgba(255,122,26,0.22)]"
              : "border-white/10 hover:border-[#FF7A1A]/50 shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
          )}
        >
          <div className="min-w-0">
            <span className="type-eyebrow text-[#FF7A1A]">Due today</span>
            <p className="type-small text-[#8E95A3] truncate mt-0.5">Follow-ups & SLAs</p>
          </div>
          <span className="type-metric text-[#FF7A1A] ml-3 shrink-0" suppressHydrationWarning>
            {todayTasks.length}
          </span>
        </button>

        {/* Chip 3: Overdue (Red if > 0, else calm Green "On track") */}
        <button
          type="button"
          onClick={() => setTodayFilter((f) => (f === "overdue" ? "all" : "overdue"))}
          className={cn(
            "flex items-center justify-between h-[72px] px-5 rounded-[20px] border transition-all duration-140 text-left cursor-pointer bg-[#0B0D12] hover:scale-[1.01] active:scale-[0.99]",
            overdueTasks.length > 0
              ? todayFilter === "overdue"
                ? "border-[#EF4444] ring-1 ring-[#EF4444]/40 shadow-[0_4px_20px_rgba(239,68,68,0.22)]"
                : "border-white/10 hover:border-[#EF4444]/50 shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
              : todayFilter === "overdue"
              ? "border-[#10B981] ring-1 ring-[#10B981]/40 shadow-[0_4px_20px_rgba(16,185,129,0.22)]"
              : "border-white/10 hover:border-[#10B981]/50 shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
          )}
        >
          <div className="min-w-0">
            <span
              className={cn(
                "type-eyebrow",
                overdueTasks.length > 0 ? "text-[#EF4444]" : "text-[#10B981]"
              )}
            >
              {overdueTasks.length > 0 ? "Overdue" : "SLA Status"}
            </span>
            <p className="type-small text-[#8E95A3] truncate mt-0.5">
              {overdueTasks.length > 0 ? "Needs immediate action" : "All SLAs on track"}
            </p>
          </div>
          {overdueTasks.length > 0 ? (
            <span className="type-metric text-[#EF4444] ml-3 shrink-0" suppressHydrationWarning>
              {overdueTasks.length}
            </span>
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#10B981]/20 text-[#10B981] ml-3">
              <Check className="h-5 w-5" />
            </div>
          )}
        </button>

        {/* Chip 4: In proposal (Green) */}
        <button
          type="button"
          onClick={() => setTodayFilter((f) => (f === "proposal" ? "all" : "proposal"))}
          className={cn(
            "flex items-center justify-between h-[72px] px-5 rounded-[20px] border transition-all duration-140 text-left cursor-pointer bg-[#0B0D12] hover:scale-[1.01] active:scale-[0.99]",
            todayFilter === "proposal"
              ? "border-[#10B981] ring-1 ring-[#10B981]/40 shadow-[0_4px_20px_rgba(16,185,129,0.22)]"
              : "border-white/10 hover:border-[#10B981]/50 shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
          )}
        >
          <div className="min-w-0">
            <span className="type-eyebrow text-[#10B981]">In proposal</span>
            <p className="type-small text-[#8E95A3] truncate mt-0.5">Active negotiations</p>
          </div>
          <span className="type-metric text-[#10B981] ml-3 shrink-0" suppressHydrationWarning>
            {proposalDeals.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ROW 2: THE TWO HEROES (7 / 5 COLUMNS)                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* HERO 1: NEXT BEST ACTION (7 COLUMNS) */}
        <div className="lg:col-span-7 card-2027 rounded-[28px] border border-[#E6E2D8] bg-white p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden shadow-[0_2px_4px_rgba(11,13,18,0.04),0_16px_36px_-12px_rgba(11,13,18,0.12)] hover:shadow-[0_20px_48px_-12px_rgba(255,90,31,0.14)] transition-all duration-200">
          {/* Subtle top rainbow flame/violet accent line */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#FF5A1F] via-[#FF8833] to-[#7C4DFF]" />

          {nextBestAction ? (
            <div className="space-y-5">
              {/* Header line with Live Radar Beacon badge & Timer */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-2 bg-[#FFF0EB] border border-[#FFD9CC] rounded-full px-3 py-1 shadow-2xs">
                    <span className="radar-beacon inline-flex h-2.5 w-2.5 rounded-full bg-[#FF5A1F]" />
                    <span className="text-[13px] font-semibold tracking-wider uppercase text-[#B93A0A]">
                      Next best action
                    </span>
                  </div>
                  <span className="text-[13px] text-[#666C78] font-normal hidden sm:inline" suppressHydrationWarning>
                    Priority 1 of {allQueueItems.length} • Action Required
                  </span>
                </div>

                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium transition-all shadow-2xs",
                    nextBestAction.timeAgo === "overdue"
                      ? "bg-[#FFE9EA] text-[#B42336] border border-[#FFCCD0]"
                      : "bg-[#FFF0EB] text-[#B93A0A] border border-[#FFD9CC]"
                  )}
                  suppressHydrationWarning
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span className="capitalize" suppressHydrationWarning>{nextBestAction.timeAgo}</span>
                </span>
              </div>

              {/* Customer Profile & Identity Row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative">
                    {(() => {
                      const avatarStyle = getAvatarColor(nextBestAction.name);
                      return (
                        <div
                          className={cn(
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border text-[16px] font-medium shadow-2xs transition-transform hover:scale-105 duration-140",
                            avatarStyle.bg,
                            avatarStyle.text,
                            avatarStyle.border
                          )}
                          suppressHydrationWarning
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
                        className="text-[18px] sm:text-[20px] font-medium text-[#12141A] hover:text-[#FF5A1F] hover:underline cursor-pointer truncate transition-colors"
                        suppressHydrationWarning
                      >
                        {nextBestAction.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[13px] font-medium bg-[#EBF6FD] text-[#0F6F9D] border border-[#CDE5F7]">
                        WhatsApp Client
                      </span>
                    </div>
                    <p className="text-[13px] text-[#666C78] truncate mt-0.5" suppressHydrationWarning>
                      {nextBestAction.phone || "+91 98765 43210"} • {nextBestAction.reason}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setSelectedCustomer({
                      name: nextBestAction.name,
                      phone: nextBestAction.phone || "+91 98765 43210",
                      reason: nextBestAction.reason,
                    })
                  }
                  className="text-[#454B57] hover:text-[#12141A] text-[14px] h-9 px-3 gap-1.5 shrink-0 rounded-[10px] cursor-pointer"
                >
                  <span className="hidden sm:inline">View contact</span>
                  <ExternalLink className="h-3.5 w-3.5 text-[#666C78]" />
                </Button>
              </div>

              {/* Inbound Customer Message (WhatsApp Speech Bubble Style) */}
              <div className="rounded-[18px] bg-[#F7F5F0] border border-[#E6E2D8] p-4 text-[#12141A] relative shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#25D366]" />
                    <span className="text-[13px] font-medium uppercase tracking-wider text-[#454B57]">
                      Latest Inbound Context
                    </span>
                  </div>
                  <span className="text-[13px] text-[#8E95A3] font-normal" suppressHydrationWarning>
                    Received {nextBestAction.timeAgo}
                  </span>
                </div>
                <p className="text-[15px] text-[#12141A] leading-relaxed font-normal pl-3 border-l-2 border-[#25D366]" suppressHydrationWarning>
                  "{nextBestAction.inboundText}"
                </p>
              </div>

              {/* AI Engine Suggested Reply Preview (Luminous Violet Box with Shimmer) */}
              {nextBestAction.aiSuggestion && (
                <div className="rounded-[18px] bg-gradient-to-br from-[#F5F0FF] via-[#FAF8FF] to-[#FFFFFF] border border-[#D9C9FF] p-4 relative overflow-hidden shadow-2xs">
                  <div className="copilot-shimmer-line absolute top-0 left-0 right-0 h-[2px]" />
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2 text-[#6938EF]">
                      <Sparkles className="h-4 w-4 animate-pulse text-[#7C4DFF]" />
                      <span className="text-[13px] font-medium uppercase tracking-wider text-[#6938EF]">
                        Suggested AI Response
                      </span>
                    </div>
                    <span className="rounded-full bg-white/90 border border-[#E0D4FC] text-[13px] font-medium text-[#6938EF] px-2.5 py-0.5 tabular-nums shadow-2xs">
                      Gemini 1.5 Flash • Grounded
                    </span>
                  </div>

                  {inlineReplyId === nextBestAction.id ? (
                    <div className="space-y-3 pt-1 animate-reveal">
                      <textarea
                        value={inlineReplyText}
                        onChange={(e) => setInlineReplyText(e.target.value)}
                        className="w-full h-24 p-3.5 rounded-[12px] bg-white border border-[#D9C9FF] text-[14px] text-[#12141A] focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] shadow-inner"
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
                          className="btn-primary-flame text-[14px] h-9 px-4 cursor-pointer"
                        >
                          Send edited reply
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInlineReplyId(null)}
                          className="text-[14px] h-9 px-3 cursor-pointer"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[14px] text-[#241C48] leading-relaxed font-normal" suppressHydrationWarning>
                      {nextBestAction.aiSuggestion}
                    </p>
                  )}
                </div>
              )}

              {/* Actions Footer Dock */}
              {inlineReplyId !== nextBestAction.id && (
                <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#E6E2D8]">
                  <div className="flex items-center gap-2.5">
                    {/* Primary Button: Flame Send with Takeoff Animation */}
                    <Button
                      onClick={() =>
                        handleSendReply(
                          nextBestAction.rawId,
                          nextBestAction.aiSuggestion ||
                            "Thank you for contacting Roos StudioX! We are reviewing your inquiry.",
                          nextBestAction.name
                        )
                      }
                      className="btn-primary-flame group gap-2 h-11 px-5 text-[14px] font-medium shadow-xs cursor-pointer interactive-tap-spring"
                    >
                      <Send className="h-4 w-4 transition-transform duration-140 group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                      <span>Send Reply</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setInlineReplyId(nextBestAction.id);
                        setInlineReplyText(nextBestAction.aiSuggestion || "");
                      }}
                      className="text-[14px] h-11 px-4 gap-1.5 rounded-[12px] border-[#E6E2D8] bg-white hover:bg-[#F7F5F0] text-[#12141A] cursor-pointer"
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
                      className="text-[#666C78] hover:text-[#12141A] text-[14px] h-11 px-3.5 gap-1.5 rounded-[12px] cursor-pointer"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>Snooze 2h</span>
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        handleResolveItem(nextBestAction.id, nextBestAction.name)
                      }
                      className="text-[14px] h-11 px-4 gap-1.5 rounded-[12px] border border-[#E6E2D8] bg-white hover:bg-[#E6FBF2] hover:text-[#0A7A53] hover:border-[#12B886]/40 text-[#12141A] transition-all cursor-pointer interactive-tap-spring"
                    >
                      <Check className="h-4 w-4 text-[#12B886]" />
                      <span>Done</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Empty State when caught up */
            <div className="h-full flex flex-col items-center justify-center py-12 text-center">
              <div className="h-14 w-14 rounded-full bg-[#E4F7EF] text-[#0A7A53] flex items-center justify-center mb-4">
                <Check className="h-7 w-7" />
              </div>
              <h3 className="type-title text-[#12141A]">You're all caught up!</h3>
              <p className="type-body text-[#666C78] max-w-sm mt-1">
                Zero overdue SLAs and no pending customer inquiries awaiting attention.
                Last reply resolved 12 minutes ago.
              </p>
            </div>
          )}
        </div>

        {/* HERO 2: REVENUE HERO (5 COLUMNS, INK SURFACE WITH FLAME GLOW) */}
        <div className="lg:col-span-5 hero-card-dark p-8 flex flex-col justify-between text-white">
          <div>
            <div className="flex items-center justify-between">
              <span className="type-eyebrow text-[#A3A9B6]">Open pipeline</span>
              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#12B886] bg-[#12B886]/15 px-2.5 py-0.5 rounded-full border border-[#12B886]/30">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>+18.4% vs last period</span>
              </span>
            </div>

            {/* 80px Hero Metric Figure */}
            <div className="my-4">
              <div className="type-hero-metric text-white">
                <AnimatedNumber value={openPipelineValue} format="currency" currencySymbol="₹" duration={850} />
              </div>
              <p className="type-meta text-[#A3A9B6] mt-1">
                Weighted across {openLeads.length} active opportunities
              </p>
            </div>

            {/* Proportional Stage Distribution Bar */}
            <div className="my-6">
              <div className="h-3.5 w-full rounded-full bg-[#1B1F29] overflow-hidden flex gap-1 p-0.5">
                {openStageSegments.map((stage) => (
                  <div
                    key={stage.key}
                    style={{
                      width: `${stage.pct}%`,
                      backgroundColor: stage.color,
                    }}
                    className="h-full rounded-full transition-all duration-300 relative group"
                    title={`${stage.label}: ${formatINR(stage.val)} (${stage.count} deals)`}
                  />
                ))}
              </div>

              {/* Legend with Real Numbers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-[13px]">
                {openStageSegments.map((stage) => (
                  <div key={stage.key} className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="text-[#A3A9B6] truncate">{stage.label}</span>
                    </div>
                    <span className="font-medium text-white tabular-nums mt-0.5">
                      {formatINR(stage.val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Three Quiet Lines at Bottom */}
          <div className="pt-6 border-t border-white/10 space-y-2.5 text-[14px]">
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
      {/* ROW 3: UP NEXT IN YOUR QUEUE (7 COLS) & COMING UP (5 COLS)                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT (7 COLS): UP NEXT IN YOUR QUEUE */}
        <div className="lg:col-span-7 card-2027 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="type-title text-[#12141A]">Up next in your queue</h2>
              <p className="type-small text-[#666C78]" suppressHydrationWarning>
                {todayFilter !== "all"
                  ? `Filtered by "${todayFilter.replace("_", " ")}" • `
                  : ""}
                {upNextQueue.length} priority items awaiting action
              </p>
            </div>

            {todayFilter !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTodayFilter("all")}
                className="text-[13px] text-[#FF5A1F]"
              >
                Clear filter
              </Button>
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
                        suppressHydrationWarning
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
                            className="type-label text-[#12141A] truncate hover:underline cursor-pointer"
                            suppressHydrationWarning
                          >
                            {item.name}
                          </span>

                          {/* Type Chip with meaningful module hue */}
                          {isConv && (
                            <span className="px-2 py-0.5 rounded-full text-[12px] font-medium bg-[#EAEEFF] text-[#2A3DB5] border border-[#D3DCFF]">
                              Conversation
                            </span>
                          )}
                          {isTask && (
                            <span className="px-2 py-0.5 rounded-full text-[12px] font-medium bg-[#FFF3D6] text-[#8F5300] border border-[#FFE5A3]">
                              Task SLA
                            </span>
                          )}
                          {isLead && (
                            <span className="px-2 py-0.5 rounded-full text-[12px] font-medium bg-[#E3F3FD] text-[#0A6AA3] border border-[#BFE3FA]">
                              Lead
                            </span>
                          )}
                        </div>

                        <p className="type-small text-[#666C78] truncate mt-0.5" suppressHydrationWarning>
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
                        suppressHydrationWarning
                      >
                        {item.timeAgo}
                      </span>

                      {/* Hover action buttons */}
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
                <p className="type-body">No remaining items in this queue filter.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT (5 COLS): COMING UP (CHRONOLOGICAL FEED) */}
        <div className="lg:col-span-5 card-2027 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="type-title text-[#12141A]">Coming up</h2>
              <p className="type-small text-[#666C78]">
                Today's scheduled follow-ups, SLAs & broadcasts
              </p>
            </div>
            <Calendar className="h-4 w-4 text-[#666C78]" />
          </div>

          <div className="space-y-4">
            {comingUpItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3.5 p-3 rounded-[14px] bg-[#F7F5F0] border border-[#E6E2D8] hover:border-[#D2CEC2] transition-colors"
              >
                {item.isTask ? (
                  <button
                    type="button"
                    onClick={() => {
                      const taskObj = tasks.find((t) => t.id === item.rawId);
                      if (taskObj) handleCompleteTask(taskObj);
                    }}
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border border-[#D2CEC2] bg-white hover:border-[#12B886] hover:bg-[#E4F7EF] transition-colors text-transparent hover:text-[#0A7A53]"
                    title="Mark task completed"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F0EAFF] text-[#7C4DFF]">
                    <Send className="h-3 w-3" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="type-label text-[#12141A] truncate">
                      {item.title}
                    </span>
                    <span className="text-[12px] font-medium text-[#8F5300] bg-[#FFF3D6] px-2 py-0.5 rounded-full border border-[#FFE5A3] shrink-0">
                      {item.badge}
                    </span>
                  </div>
                  <p className="type-meta text-[#666C78] mt-1">{item.time}</p>
                </div>
              </div>
            ))}

            {lastCompletedTask && (
              <div className="p-3 rounded-[12px] bg-[#E4F7EF] border border-[#BDECD7] flex items-center justify-between text-[13px] text-[#0A7A53] animate-reveal">
                <span>Task marked completed.</span>
                <button
                  type="button"
                  onClick={handleUndoTask}
                  className="inline-flex items-center gap-1 font-medium hover:underline text-[#0A7A53]"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  <span>Undo</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 4: DEALS WORTH A LOOK (OPEN DEALS ONLY) & RECENT ACTIVITY             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* DEALS WORTH A LOOK (7 COLS) */}
        <div className="lg:col-span-7 card-2027 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="type-title text-[#12141A]">Deals worth a look</h2>
              <p className="type-small text-[#666C78]">
                Open high-value opportunities sorted by deal value and stage velocity
              </p>
            </div>
            <Link
              href={`/app/${orgSlug}/leads`}
              className="type-small text-[#FF5A1F] hover:underline"
            >
              View pipeline
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
                      <span className="type-label text-[#12141A] truncate group-hover:underline">
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
                    <p className="type-small text-[#666C78] mt-0.5">
                      {deal.contact_name} • {deal.stuckDays} days in stage
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="type-title text-[#12141A] tabular-nums font-medium">
                      {formatINR(deal.estimated_value || 0)}
                    </span>
                    <span className="block type-meta text-[#666C78]">
                      {deal.stage === "proposal" ? "In Proposal" : "Active deal"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RECENT ACTIVITY COLLAPSED FEED (5 COLS) */}
        <div className="lg:col-span-5 card-2027 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="type-title text-[#12141A]">Recent activity</h2>
              <p className="type-small text-[#666C78]">Workspace event telemetry</p>
            </div>
            <button
              type="button"
              onClick={() => setActivityExpanded((prev) => !prev)}
              className="type-small text-[#666C78] hover:text-[#12141A]"
            >
              {activityExpanded ? "Collapse" : "Expand"}
            </button>
          </div>

          <div
            className={cn(
              "space-y-3 transition-all duration-200 overflow-hidden",
              activityExpanded ? "max-h-96 overflow-y-auto" : "max-h-56"
            )}
          >
            {[
              {
                id: "act-1",
                text: "Rahul Mehta responded on WhatsApp (+91 98765 43210)",
                time: "2h ago",
                dotColor: "bg-[#3D5AFE]",
              },
              {
                id: "act-2",
                text: "Priya Sharma qualified deal for Enterprise Package",
                time: "3h ago",
                dotColor: "bg-[#12B886]",
              },
              {
                id: "act-3",
                text: "Follow-up SLA assigned to Praveen",
                time: "5h ago",
                dotColor: "bg-[#F5A524]",
              },
              {
                id: "act-4",
                text: "Diwali Broadcast Campaign completed delivery (98.4%)",
                time: "Yesterday",
                dotColor: "bg-[#7C4DFF]",
              },
              {
                id: "act-5",
                text: "Vikram Malhotra stage updated to Proposal Sent",
                time: "Yesterday",
                dotColor: "bg-[#F5A524]",
              },
            ].map((ev) => (
              <div key={ev.id} className="flex items-start gap-3 text-[13px]">
                <span
                  className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", ev.dotColor)}
                />
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
        width="md"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="p-4 rounded-[16px] bg-[#F7F5F0] border border-[#E6E2D8] space-y-2">
              <span className="type-eyebrow text-[#666C78]">Context & Reason</span>
              <p className="type-body text-[#12141A]">{selectedCustomer.reason}</p>
            </div>

            <div className="space-y-3">
              <span className="type-eyebrow text-[#666C78]">Quick Actions</span>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href={`/app/${orgSlug}/inbox`}
                  className="flex items-center justify-center gap-2 h-10 rounded-[12px] bg-[#EAEEFF] text-[#2A3DB5] border border-[#D3DCFF] text-[14px] font-medium hover:bg-[#D3DCFF] transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Open chat</span>
                </Link>
                <Link
                  href={`/app/${orgSlug}/leads?action=new`}
                  className="flex items-center justify-center gap-2 h-10 rounded-[12px] bg-white text-[#12141A] border border-[#E6E2D8] text-[14px] font-medium hover:bg-[#F7F5F0] transition-colors"
                >
                  <Filter className="h-4 w-4 text-[#12B886]" />
                  <span>Add deal</span>
                </Link>
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
        description={`Stage: ${selectedDeal?.stage.toUpperCase()}`}
        width="md"
      >
        {selectedDeal && (
          <div className="space-y-6">
            <div className="p-5 rounded-[16px] bg-[#0B0D12] text-white space-y-2">
              <span className="type-eyebrow text-[#A3A9B6]">Estimated Value</span>
              <div className="type-metric-xl text-white">
                {formatINR(selectedDeal.estimated_value || 0)}
              </div>
              <p className="type-meta text-[#A3A9B6]">
                Owner: {selectedDeal.assigned_to_name || "Praveen"}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#F7F5F0] border border-[#E6E2D8]">
                <span className="type-small text-[#666C78]">Contact Name</span>
                <span className="type-label text-[#12141A]">
                  {selectedDeal.contact_name}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#F7F5F0] border border-[#E6E2D8]">
                <span className="type-small text-[#666C78]">Contact Phone</span>
                <span className="type-label text-[#12141A]">
                  {selectedDeal.contact_phone}
                </span>
              </div>
            </div>

            <Link
              href={`/app/${orgSlug}/leads`}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-[12px] btn-primary-flame text-[14px] font-medium"
            >
              <span>Open in Sales Pipeline</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </Drawer>

      {/* New Opportunity Modal */}
      <Drawer
        isOpen={newDealOpen}
        onClose={() => setNewDealOpen(false)}
        title="Create New Opportunity"
        description="Add a prospective deal to the sales pipeline"
        width="md"
      >
        <form onSubmit={handleCreateDeal} className="space-y-4">
          <div>
            <label className="type-small text-[#12141A] block mb-1.5 font-medium">
              Opportunity Title
            </label>
            <Input
              value={dealTitle}
              onChange={(e) => setDealTitle(e.target.value)}
              placeholder="e.g. Enterprise WhatsApp Bundle"
              required
              className="h-10 text-[14px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="type-small text-[#12141A] block mb-1.5 font-medium">
                Value (INR)
              </label>
              <Input
                type="number"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                placeholder="65000"
                required
                className="h-10 text-[14px]"
              />
            </div>

            <div>
              <label className="type-small text-[#12141A] block mb-1.5 font-medium">
                Initial Stage
              </label>
              <select
                value={dealStage}
                onChange={(e) => setDealStage(e.target.value as LeadStage)}
                className="w-full h-10 px-3 rounded-[12px] bg-white border border-[#E6E2D8] text-[14px] text-[#12141A] focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
              >
                <option value="new">Inbound</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="type-small text-[#12141A] block mb-1.5 font-medium">
              Contact Name
            </label>
            <Input
              value={dealContactName}
              onChange={(e) => setDealContactName(e.target.value)}
              placeholder="e.g. Neha Verma"
              className="h-10 text-[14px]"
            />
          </div>

          <div>
            <label className="type-small text-[#12141A] block mb-1.5 font-medium">
              Contact WhatsApp Phone
            </label>
            <Input
              value={dealContactPhone}
              onChange={(e) => setDealContactPhone(e.target.value)}
              placeholder="+91 98765 00000"
              className="h-10 text-[14px]"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E6E2D8]">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setNewDealOpen(false)}
              className="text-[14px]"
            >
              Cancel
            </Button>
            <Button type="submit" className="btn-primary-flame text-[14px]">
              Create Opportunity
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
