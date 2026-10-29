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
import { RecentActivityCard } from "@/components/overview/recent-activity-card";
import { NewOpportunityModal } from "@/components/crm/new-opportunity-modal";
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
  Calendar,
  X,
  Zap,
  MessageSquare,
} from "lucide-react";

interface ContextualSuggestion {
  standard: string;
  shorter: string;
  direct: string;
  intent: string;
  topic: string;
}

interface QueueItem {
  id: string;
  rawId: string;
  type: "conversation" | "task" | "lead";
  avatar: string;
  name: string;
  subContext?: string;
  reason: string;
  inboundText?: string;
  phone?: string;
  suggestion?: ContextualSuggestion;
  aiSuggestion?: string;
  timeAgo: string;
  waitingHours: number;
  dealValue?: number;
  dealTitle?: string;
}

function getReplySuggestionForContext(
  name: string,
  inboundText?: string,
  contextTitle?: string,
  type: "conversation" | "task" | "lead" = "conversation"
): ContextualSuggestion {
  const firstName = name.includes(" ") ? name.split(" ")[0] : name;
  const text = (inboundText || "").toLowerCase();
  const title = (contextTitle || "").toLowerCase();

  // 1. Fleet / Proposal / Finance review
  if (
    text.includes("fleet") ||
    text.includes("proposal") ||
    text.includes("finance") ||
    title.includes("fleet") ||
    title.includes("proposal")
  ) {
    return {
      topic: "Fleet proposal review",
      intent: "Proposal Review Follow-up",
      standard: `Hi ${firstName}! Sounds great, take your time reviewing the fleet proposal with your finance team. Should I check back with you on Friday, or would you like me to clarify any unit pricing or terms before then?`,
      shorter: `Hi ${firstName}! Sounds good. Take your time with the finance team—feel free to reach out if any questions come up.`,
      direct: `Hi ${firstName}, understood. I will follow up with you on Friday once your finance team has reviewed the proposal.`,
    };
  }

  // 2. Retail automation / Quotation
  if (
    text.includes("quotation") ||
    text.includes("quote") ||
    text.includes("retail") ||
    text.includes("hardware") ||
    title.includes("retail")
  ) {
    return {
      topic: "Retail automation quote",
      intent: "Quotation & Scope Delivery",
      standard: `Hi ${firstName}! I've prepared the commercial quotation and hardware spec sheet for your retail automation setup. Would you prefer I share the PDF directly here on WhatsApp, or hop on a brief 10-minute walkthrough call?`,
      shorter: `Hi ${firstName}! The quotation is ready. Should I send the PDF over WhatsApp or email it to you?`,
      direct: `Hi ${firstName}, the retail automation quotation is ready. I can send the PDF right away or schedule a 10-minute walkthrough.`,
    };
  }

  // 3. Demo / Trial availability
  if (
    text.includes("demo") ||
    text.includes("trial") ||
    text.includes("available this week") ||
    title.includes("demo")
  ) {
    return {
      topic: "Live demo scheduling",
      intent: "Live Demo Scheduling",
      standard: `Hi ${firstName}! Yes, we have demo slots open tomorrow at 11:30 AM and Thursday at 3:00 PM IST. Which of those times works best for you and your team?`,
      shorter: `Hi ${firstName}! We have slots open tomorrow at 11:30 AM or Thursday at 3:00 PM IST. Would either work for you?`,
      direct: `Hi ${firstName}, yes. I have openings tomorrow at 11:30 AM or Thursday at 3:00 PM IST for a live walkthrough.`,
    };
  }

  // 4. Pricing / Cost / Plans
  if (
    text.includes("price") ||
    text.includes("pricing") ||
    text.includes("cost") ||
    text.includes("rate") ||
    text.includes("plan")
  ) {
    return {
      topic: "Pricing tiers breakdown",
      intent: "Pricing & Plans Breakdown",
      standard: `Hi ${firstName}! Here is our pricing breakdown: Starter Plan is ₹299/mo and Growth Plan is ₹799/mo with full WhatsApp API automation. Would you like me to share the complete comparison sheet?`,
      shorter: `Hi ${firstName}! Our plans start at ₹299/mo (Starter) and ₹799/mo (Growth). Would you like the full feature comparison?`,
      direct: `Hi ${firstName}, pricing is ₹299/mo for Starter and ₹799/mo for Growth. I can send the comparison sheet or set up a test account.`,
    };
  }

  // 5. Broadcasts / Campaigns
  if (
    text.includes("broadcast") ||
    text.includes("campaign") ||
    text.includes("template")
  ) {
    return {
      topic: "Meta-approved broadcast templates",
      intent: "Broadcasts & Templates Inquiry",
      standard: `Hi ${firstName}! We support broadcast campaigns with Meta-approved templates, scheduled delivery, and automatic opt-out handling. Would you like to review sample templates?`,
      shorter: `Hi ${firstName}! Yes, broadcasts are supported with Meta templates and full analytics. Would you like a sample?`,
      direct: `Hi ${firstName}, yes. We support Meta-approved broadcasts. I can share sample templates or enable them on your workspace.`,
    };
  }

  // 6. Tasks
  if (type === "task") {
    return {
      topic: contextTitle || "Milestone check-in",
      intent: "Action Item Checkpoint",
      standard: `Hi ${firstName}! Following up regarding "${contextTitle || "our discussion"}". We've finalized the latest updates and deliverables. Would 3:30 PM today work for a brief alignment?`,
      shorter: `Hi ${firstName}! Quick checkpoint on "${contextTitle || "deliverables"}". Let me know when you're free for a 5-minute sync.`,
      direct: `Hi ${firstName}, milestone checkpoint for "${contextTitle || "deliverables"}". Ready for your review.`,
    };
  }

  // 7. General Inquiry / Fallback
  return {
    topic: "Customer inquiry response",
    intent: "Inquiry Follow-up",
    standard: `Hi ${firstName}! Thank you for reaching out to Roos StudioX. I would be happy to help with this. Would you like to hop on a quick 10-minute call, or shall I share details right here?`,
    shorter: `Hi ${firstName}! Thanks for reaching out. How can I best assist you today?`,
    direct: `Hi ${firstName}, I can help you with this right away. What are your specific requirements?`,
  };
}

function getActionContextMeta(item: QueueItem): {
  eyebrow: string;
  badge: string;
  subtitle: string;
  impactTag: string;
} {
  const name = item.name.includes(" ") ? item.name.split(" ")[0] : item.name;
  const topic = item.suggestion?.topic?.toLowerCase() || "";
  const inbound = (item.inboundText || "").toLowerCase();

  if (topic.includes("proposal") || inbound.includes("proposal") || inbound.includes("finance")) {
    return {
      eyebrow: "Priority Action Required",
      badge: "AI Copilot Primed",
      subtitle: `${name} is reviewing the fleet proposal with finance — follow up now to maintain momentum and close the deal.`,
      impactTag: "Fast reply = 4.2x close rate",
    };
  }
  if (topic.includes("quote") || topic.includes("quotation") || inbound.includes("quote") || inbound.includes("quotation")) {
    return {
      eyebrow: "Commercial Quote Delivery",
      badge: "High Buyer Intent",
      subtitle: `${name} requested a solution quotation — send specs promptly to lock in customer interest.`,
      impactTag: "High conversion impact",
    };
  }
  if (topic.includes("demo") || inbound.includes("demo") || inbound.includes("trial")) {
    return {
      eyebrow: "Live Demo Scheduling",
      badge: "Time-Sensitive SLA",
      subtitle: `${name} requested a live walkthrough — confirm a slot while buyer enthusiasm is peak.`,
      impactTag: "Replies < 1h convert 3.8x faster",
    };
  }
  if (item.type === "task") {
    return {
      eyebrow: "Milestone SLA Checkpoint",
      badge: "Commitment Due",
      subtitle: `Action item SLA commitment for ${name} — confirm deliverables to uphold client trust.`,
      impactTag: "Protects SLA delivery",
    };
  }
  if (item.type === "lead") {
    return {
      eyebrow: "New Inbound Opportunity",
      badge: "Ready for Qualification",
      subtitle: `New WhatsApp lead inquiry from ${name} — engage immediately to establish first-responder advantage.`,
      impactTag: "First responders win 78% of deals",
    };
  }
  return {
    eyebrow: "Priority Customer Follow-up",
    badge: "AI Copilot Primed",
    subtitle: `Active WhatsApp customer awaiting response — 1-click contextual AI draft ready to send.`,
    impactTag: "Fast reply = 4.2x close rate",
  };
}

export default function OverviewPage() {
  const { currentOrg } = useTenant();
  const orgSlug = currentOrg.slug;
  const { toast } = useToast();

  const [refreshKey, setRefreshKey] = useState(0);
  const [resolvedQueueIds, setResolvedQueueIds] = useState<Set<string>>(new Set());
  const [period, setPeriod] = useState<"month" | "yearly" | "all" | "custom">("month");
  const [customPickerOpen, setCustomPickerOpen] = useState(false);
  const [customRange, setCustomRange] = useState({
    start: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [todayFilter, setTodayFilter] = useState<
    "all" | "waiting" | "due_today" | "overdue" | "proposal"
  >("all");

  // Quick reply popover / inline edit state
  const [inlineReplyId, setInlineReplyId] = useState<string | null>(null);
  const [inlineReplyText, setInlineReplyText] = useState("");
  const [selectedTone, setSelectedTone] = useState<"standard" | "shorter" | "direct">("standard");

  // Queue channel filter & inline quick reply state
  const [queueChannelFilter, setQueueChannelFilter] = useState<"all" | "whatsapp" | "task" | "lead">("all");
  const [expandedQueueItemId, setExpandedQueueItemId] = useState<string | null>(null);
  const [queueRowTone, setQueueRowTone] = useState<Record<string, "standard" | "shorter" | "direct">>({});

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
  const [newDealContact, setNewDealContact] = useState<{ name: string; phone: string } | null>(null);

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

        // Real timestamp computation (differs per conversation)
        const msgTimeStr = lastInbound?.created_at || c.last_customer_message_at || c.last_message_at || new Date().toISOString();
        const diffMs = Math.max(60000, Date.now() - new Date(msgTimeStr).getTime());
        const waitHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
        const waitMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
        const waitLabel = waitMinutes < 60 ? `${waitMinutes}m` : `${waitHours}h`;

        return {
          ...c,
          inboundText:
            lastInbound?.body ||
            c.last_message_text ||
            "Hello! We are looking to integrate WhatsApp Business API for our sales team. Could you please share the pricing schedule and onboarding timeline?",
          waitingHours: waitHours,
          waitLabel,
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
    const queue: QueueItem[] = [];

    // Conversations
    unreadConversations.forEach((c) => {
      const contactName = c.contact_name || c.contact_phone || "A customer";
      const suggestion = getReplySuggestionForContext(
        contactName,
        c.inboundText,
        c.lead_title || undefined,
        "conversation"
      );
      const matchingLead = leads.find(
        (l) => l.id === c.lead_id || (l.contact_phone && l.contact_phone === c.contact_phone)
      );

      queue.push({
        id: `conv-${c.id}`,
        rawId: c.id,
        type: "conversation",
        avatar: contactName,
        name: contactName,
        subContext: c.lead_title ? `${c.lead_title} • ${c.contact_phone || ""}` : c.contact_phone,
        reason: matchingLead ? `${matchingLead.title} • ${suggestion.topic}` : suggestion.topic,
        inboundText: c.inboundText,
        phone: c.contact_phone,
        suggestion,
        aiSuggestion: suggestion.standard,
        timeAgo: `waiting ${c.waitLabel}`,
        waitingHours: c.waitingHours,
        dealValue: matchingLead?.estimated_value,
        dealTitle: matchingLead?.title || c.lead_title || undefined,
      });
    });

    // Overdue tasks
    overdueTasks.forEach((t) => {
      const taskContact = t.contact_name || "Client";
      const suggestion = getReplySuggestionForContext(
        taskContact,
        t.title,
        t.title,
        "task"
      );
      const matchingLead = leads.find((l) => l.id === t.lead_id);

      queue.push({
        id: `task-${t.id}`,
        rawId: t.id,
        type: "task",
        avatar: t.contact_name || "Task",
        name: t.title,
        subContext: t.contact_name ? `Contact: ${t.contact_name} • Priority: ${t.priority}` : `Priority: ${t.priority}`,
        reason: `Overdue SLA deadline • Priority: ${t.priority}`,
        inboundText: `Action item SLA commitment: "${t.title}". Confirming deliverables with stakeholders.`,
        phone: "+91 98765 43210",
        suggestion,
        aiSuggestion: suggestion.standard,
        timeAgo: "overdue",
        waitingHours: 24,
        dealValue: matchingLead?.estimated_value,
        dealTitle: matchingLead?.title,
      });
    });

    // Today Tasks
    todayTasks.forEach((t) => {
      const taskContact = t.contact_name || "Client";
      const suggestion = getReplySuggestionForContext(
        taskContact,
        t.title,
        t.title,
        "task"
      );
      const matchingLead = leads.find((l) => l.id === t.lead_id);

      queue.push({
        id: `task-${t.id}`,
        rawId: t.id,
        type: "task",
        avatar: t.contact_name || "Task",
        name: t.title,
        subContext: t.contact_name ? `Contact: ${t.contact_name}` : "Due today",
        reason: `Follow-up SLA due today • ${t.contact_name ? `Contact: ${t.contact_name}` : ""}`,
        inboundText: `Scheduled milestone checkpoint: "${t.title}". Requires confirming stakeholder next steps.`,
        phone: "+91 98765 43210",
        suggestion,
        aiSuggestion: suggestion.standard,
        timeAgo: "due today",
        waitingHours: 4,
        dealValue: matchingLead?.estimated_value,
        dealTitle: matchingLead?.title,
      });
    });

    // High intent new leads
    leads
      .filter((l) => l.stage === "new" && !resolvedQueueIds.has(`lead-${l.id}`))
      .slice(0, 2)
      .forEach((l) => {
        const leadContact = l.contact_name || l.title;
        const suggestion = getReplySuggestionForContext(
          leadContact,
          l.title,
          l.title,
          "lead"
        );
        queue.push({
          id: `lead-${l.id}`,
          rawId: l.id,
          type: "lead",
          avatar: leadContact,
          name: l.title,
          subContext: `Inbound inquiry • Value: ${formatINR(l.estimated_value || 0)}`,
          reason: `New inbound inquiry • Value: ${formatINR(l.estimated_value || 0)}`,
          inboundText: `New WhatsApp inbound inquiry from ${leadContact}: Interested in retail automation solutions.`,
          phone: l.contact_phone,
          suggestion,
          aiSuggestion: suggestion.standard,
          timeAgo: "waiting 1h",
          waitingHours: 1,
          dealValue: l.estimated_value,
          dealTitle: l.title,
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

  // Filtered queue items based on the channel tabs
  const displayedQueue = useMemo(() => {
    let list = upNextQueue;
    if (queueChannelFilter === "whatsapp") {
      list = list.filter((i) => i.type === "conversation");
    } else if (queueChannelFilter === "task") {
      list = list.filter((i) => i.type === "task");
    } else if (queueChannelFilter === "lead") {
      list = list.filter((i) => i.type === "lead");
    }
    return list;
  }, [upNextQueue, queueChannelFilter]);

  const queuePipelineValue = useMemo(() => {
    return upNextQueue.reduce((sum, item) => sum + (item.dealValue || 0), 0);
  }, [upNextQueue]);

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
          <div className="relative inline-flex rounded-[12px] bg-white border border-[#E6E2D8] p-1 shadow-[0_1px_2px_rgba(11,13,18,0.04)]">
            {(
              [
                { id: "month", label: "This Month" },
                { id: "yearly", label: "Yearly" },
                { id: "all", label: "All Time" },
                { id: "custom", label: "Custom" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setPeriod(opt.id);
                  if (opt.id === "custom") {
                    setCustomPickerOpen((prev) => !prev);
                  } else {
                    setCustomPickerOpen(false);
                  }
                }}
                className={cn(
                  "px-3 py-1 text-[13px] font-medium rounded-[8px] transition-all duration-140 cursor-pointer flex items-center gap-1.5",
                  period === opt.id
                    ? "bg-[#12141A] text-white shadow-xs"
                    : "text-[#666C78] hover:text-[#12141A] hover:bg-[#F7F5F0]"
                )}
              >
                <span>{opt.label}</span>
                {opt.id === "custom" && (
                  <Calendar className="h-3 w-3 opacity-70" />
                )}
              </button>
            ))}

            {/* Custom Date Range Popover */}
            {customPickerOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setCustomPickerOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 z-50 w-[290px] p-4 rounded-[16px] bg-white border border-[#E6E2D8] shadow-[0_12px_32px_-8px_rgba(11,13,18,0.14),0_1px_2px_rgba(11,13,18,0.04)] animate-emil-reveal">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F0ECE1]">
                    <span className="text-[13px] font-medium text-[#12141A]">
                      Custom Date Range
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomPickerOpen(false)}
                      className="h-5 w-5 rounded-full hover:bg-black/[0.06] text-[#8C93A0] hover:text-[#12141A] flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-medium text-[#666C78] block mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={customRange.start}
                        onChange={(e) =>
                          setCustomRange((prev) => ({ ...prev, start: e.target.value }))
                        }
                        className="w-full h-8 px-2.5 rounded-[8px] bg-[#F7F5F0] border border-[#E6E2D8] text-[12px] text-[#12141A] focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/20 focus:border-[#FF5A1F]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-[#666C78] block mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={customRange.end}
                        onChange={(e) =>
                          setCustomRange((prev) => ({ ...prev, end: e.target.value }))
                        }
                        className="w-full h-8 px-2.5 rounded-[8px] bg-[#F7F5F0] border border-[#E6E2D8] text-[12px] text-[#12141A] focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/20 focus:border-[#FF5A1F]"
                      />
                    </div>

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {[
                        { label: "Last 7d", days: 7 },
                        { label: "Last 30d", days: 30 },
                        { label: "Last 90d", days: 90 },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            const end = new Date().toISOString().split("T")[0];
                            const start = new Date(Date.now() - preset.days * 86400000)
                              .toISOString()
                              .split("T")[0];
                            setCustomRange({ start, end });
                          }}
                          className="flex-1 py-1 text-[11px] font-medium rounded-[6px] bg-[#F7F5F0] hover:bg-[#EAE6DC] text-[#454B57] hover:text-[#12141A] transition-colors cursor-pointer text-center"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setCustomPickerOpen(false)}
                        className="h-7 px-3 text-[12px] font-medium text-[#666C78] hover:text-[#12141A] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPeriod("custom");
                          setCustomPickerOpen(false);
                          toast("Custom range applied", {
                            message: `${customRange.start} to ${customRange.end}`,
                            type: "info",
                          });
                        }}
                        className="h-7 px-3 rounded-[8px] bg-[#12141A] hover:bg-[#1B1F29] text-white text-[12px] font-medium transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Flame Primary Action Button */}
          <button
            type="button"
            onClick={() => setNewDealOpen(true)}
            className="btn-primary gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>New opportunity</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 1: TODAY STRIP (LEFT) + APPLE OS NOTIFICATION (RIGHT)                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: 2x2 Today Strip (5 cols on xl, 6 cols on lg) */}
        <div className="lg:col-span-6 xl:col-span-5 w-full grid grid-cols-2 grid-rows-[74px_74px] gap-3 content-start self-start">
          {/* 1. Waiting on you (Ultramarine) */}
          <button
            type="button"
            onClick={() =>
              setTodayFilter(todayFilter === "waiting" ? "all" : "waiting")
            }
            className={cn(
              "h-[74px] rounded-[16px] px-4 py-3 flex items-center justify-between border transition-colors duration-140 text-left active:scale-[0.98] cursor-pointer",
              todayFilter === "waiting"
                ? "bg-[#EAEEFF] border-[#3D5AFE] ring-2 ring-[#3D5AFE]/20 shadow-xs"
                : "bg-white border-[#E6E2D8] hover:border-[#3D5AFE]/40 hover:bg-[#FAFCFF] shadow-xs"
            )}
          >
            <div>
              <span className="text-[12px] font-medium text-[#2A3DB5] block">
                Waiting on you
              </span>
              <span className="text-[1.875rem] font-medium leading-none text-[#12141A] tabular-nums mt-1 block">
                {unreadConversations.length}
              </span>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-[#3D5AFE] ring-4 ring-[#3D5AFE]/15 shrink-0" />
          </button>

          {/* 2. Due today (Amber) */}
          <button
            type="button"
            onClick={() =>
              setTodayFilter(todayFilter === "due_today" ? "all" : "due_today")
            }
            className={cn(
              "h-[74px] rounded-[16px] px-4 py-3 flex items-center justify-between border transition-colors duration-140 text-left active:scale-[0.98] cursor-pointer",
              todayFilter === "due_today"
                ? "bg-[#FFF3D6] border-[#F5A524] ring-2 ring-[#F5A524]/20 shadow-xs"
                : "bg-white border-[#E6E2D8] hover:border-[#F5A524]/40 hover:bg-[#FFFDF9] shadow-xs"
            )}
          >
            <div>
              <span className="text-[12px] font-medium text-[#8F5300] block">
                Due today
              </span>
              <span className="text-[1.875rem] font-medium leading-none text-[#12141A] tabular-nums mt-1 block">
                {todayTasks.length}
              </span>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-[#F5A524] ring-4 ring-[#F5A524]/15 shrink-0" />
          </button>

          {/* 3. Overdue (Rose if > 0, otherwise calm Emerald "On track") */}
          {overdueTasks.length > 0 ? (
            <button
              type="button"
              onClick={() =>
                setTodayFilter(todayFilter === "overdue" ? "all" : "overdue")
              }
              className={cn(
                "h-[74px] rounded-[16px] px-4 py-3 flex items-center justify-between border transition-colors duration-140 text-left active:scale-[0.98] cursor-pointer",
                todayFilter === "overdue"
                  ? "bg-[#FFE9EA] border-[#E5484D] ring-2 ring-[#E5484D]/20 shadow-xs"
                  : "bg-white border-[#FDC8CA] hover:bg-[#FFF5F5] shadow-xs"
              )}
            >
              <div>
                <span className="text-[12px] font-medium text-[#B42336] block">
                  Overdue
                </span>
                <span className="text-[1.875rem] font-medium leading-none text-[#E5484D] tabular-nums mt-1 block">
                  {overdueTasks.length}
                </span>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-[#E5484D] ring-4 ring-[#E5484D]/20 animate-pulse shrink-0" />
            </button>
          ) : (
            <div className="h-[74px] rounded-[16px] px-4 py-3 flex items-center justify-between border border-[#BDECD7] bg-[#E4F7EF] text-left shadow-xs">
              <div>
                <span className="text-[12px] font-medium text-[#0A7A53] block">
                  Overdue
                </span>
                <span className="text-[1.125rem] font-medium leading-none text-[#0A7A53] mt-2 block">
                  On track
                </span>
              </div>
              <Check className="h-4 w-4 text-[#0A7A53] shrink-0" />
            </div>
          )}

          {/* 4. In proposal (Emerald) */}
          <button
            type="button"
            onClick={() =>
              setTodayFilter(todayFilter === "proposal" ? "all" : "proposal")
            }
            className={cn(
              "h-[74px] rounded-[16px] px-4 py-3 flex items-center justify-between border transition-colors duration-140 text-left active:scale-[0.98] cursor-pointer",
              todayFilter === "proposal"
                ? "bg-[#E4F7EF] border-[#12B886] ring-2 ring-[#12B886]/20 shadow-xs"
                : "bg-white border-[#E6E2D8] hover:border-[#12B886]/40 hover:bg-[#F8FCFA] shadow-xs"
            )}
          >
            <div>
              <span className="text-[12px] font-medium text-[#0A7A53] block">
                In proposal
              </span>
              <span className="text-[1.875rem] font-medium leading-none text-[#12141A] tabular-nums mt-1 block">
                {proposalLeads.length}
              </span>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-[#12B886] ring-4 ring-[#12B886]/15 shrink-0" />
          </button>
        </div>

        {/* Right: Apple OS Recent Activity Banner */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col self-start">
          <RecentActivityCard className="w-full" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 2: THE TWO HEROES (7 / 5 COLUMNS)                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* HERO 1 (LEFT 7 COLS): NEXT BEST ACTION */}
        <div
          ref={heroRef}
          className="card xl:col-span-7 flex flex-col justify-between"
        >
          {nextBestAction ? (
            <div className="space-y-6">
              {/* Card Top Intelligence Header (Apple OS / Linear style) */}
              {(() => {
                const meta = getActionContextMeta(nextBestAction);
                return (
                  <div className="flex items-center justify-between pb-4.5 border-b border-[#F0ECE1]">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Apple-style squircle with warm flame glow */}
                      <div className="h-8 w-8 rounded-[9px] bg-gradient-to-br from-[#FF5A1F] to-[#E5484D] text-white flex items-center justify-center shadow-xs shrink-0">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-[15px] font-semibold text-[#12141A] tracking-[-0.015em]">
                            {meta.eyebrow}
                          </h2>
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#FF5A1F] bg-[#FFF0EB] border border-[#FFD8CC] px-2.5 py-0.5 rounded-full">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#FF5A1F] animate-pulse" />
                            {meta.badge}
                          </span>
                        </div>
                        <p className="text-[12px] font-normal text-[#666C78] mt-0.5 truncate leading-tight">
                          {meta.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-[11.5px] font-medium text-[#0A7A53] bg-[#E4F7EF] border border-[#BDECD7] px-3 py-1 rounded-[8px] inline-flex items-center gap-1.5 shadow-2xs">
                        <Zap className="h-3.5 w-3.5 text-[#12B886]" />
                        <span>{meta.impactTag}</span>
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Contact Meta Row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  {(() => {
                    const avatarStyle = getAvatarColor(nextBestAction.name);
                    return (
                      <div
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border text-[15px] font-medium shadow-2xs select-none",
                          avatarStyle.bg,
                          avatarStyle.text,
                          avatarStyle.border
                        )}
                      >
                        {getInitials(nextBestAction.name)}
                      </div>
                    );
                  })()}
                  <div className="min-w-0">
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
                    <p className="text-[0.875rem] text-[#666C78] truncate mt-0.5">
                      {nextBestAction.subContext || nextBestAction.phone || nextBestAction.reason}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-[12px] font-medium border tabular-nums",
                      nextBestAction.timeAgo === "overdue"
                        ? "bg-[#FFE9EA] text-[#B42336] border-[#FCD0D3]"
                        : "bg-[#FFF3D6] text-[#8F5300] border-[#FDE5A3]"
                    )}
                  >
                    {nextBestAction.timeAgo}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCustomer({
                        name: nextBestAction.name,
                        phone: nextBestAction.phone || "+91 98765 43210",
                        reason: nextBestAction.reason,
                      })
                    }
                    className="text-[#666C78] hover:text-[#12141A] text-[13px] h-8 px-2 rounded-[8px] hover:bg-[#F7F5F0] transition-colors inline-flex items-center gap-1"
                  >
                    <span>Details</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Inbound Customer Message (Direct, commanding, with channel context) */}
              <div className="pt-1 pb-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11.5px] font-medium uppercase tracking-[0.05em] text-[#666C78] flex items-center gap-1.5">
                    <MessageSquare className="h-3 w-3 text-[#3D5AFE]" />
                    Customer message
                  </span>
                  <span className="h-1 w-1 rounded-full bg-[#8C93A0]" />
                  <span className="text-[11px] font-normal text-[#8C93A0]">via WhatsApp</span>
                </div>
                <p className="text-[22px] md:text-[24px] text-[#12141A] font-normal leading-[1.35] tracking-[-0.015em]">
                  &ldquo;{nextBestAction.inboundText}&rdquo;
                </p>
              </div>

              {/* AI Suggested Reply Preview (Refined quiet dock with tone controls) */}
              {nextBestAction.suggestion && (
                <div className="rounded-[16px] bg-[#FAF8FE] border border-[#E9E4F7] p-4.5 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#5B34C9]">
                        <Sparkles className="h-3.5 w-3.5 text-[#7C4DFF]" />
                        <span>Suggested reply</span>
                      </div>
                      <span className="text-[11px] text-[#7C4DFF] bg-[#F0EAFF] px-2 py-0.5 rounded-full font-medium">
                        {nextBestAction.suggestion.topic}
                      </span>
                    </div>

                    {/* Tone selector pills */}
                    <div className="inline-flex items-center gap-1 p-0.5 rounded-[10px] bg-white/80 border border-[#E9E4F7]">
                      {(
                        [
                          { id: "standard", label: "Standard" },
                          { id: "shorter", label: "Shorter" },
                          { id: "direct", label: "Direct" },
                        ] as const
                      ).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedTone(t.id);
                            if (inlineReplyId === nextBestAction.id && nextBestAction.suggestion) {
                              setInlineReplyText(nextBestAction.suggestion[t.id]);
                            }
                          }}
                          className={cn(
                            "px-2.5 py-0.5 text-[12px] font-medium rounded-[7px] transition-all cursor-pointer",
                            selectedTone === t.id
                              ? "bg-[#7C4DFF] text-white shadow-2xs"
                              : "text-[#666C78] hover:text-[#12141A] hover:bg-[#F0EAFF]"
                          )}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {inlineReplyId === nextBestAction.id ? (
                    <div className="space-y-3 pt-1">
                      <textarea
                        value={inlineReplyText}
                        onChange={(e) => setInlineReplyText(e.target.value)}
                        className="w-full h-24 p-3 rounded-[12px] bg-white border border-[#D9C9FF] text-[14px] text-[#12141A] focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
                        placeholder="Edit message..."
                      />
                    </div>
                  ) : (
                    <p className="text-[15px] text-[#2D2254] leading-relaxed">
                      {nextBestAction.suggestion[selectedTone]}
                    </p>
                  )}
                </div>
              )}

              {/* Actions Dock */}
              <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#EFEDE7]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const textToSend =
                        inlineReplyId === nextBestAction.id
                          ? inlineReplyText
                          : nextBestAction.suggestion
                          ? nextBestAction.suggestion[selectedTone]
                          : nextBestAction.aiSuggestion || "";
                      handleSendReply(nextBestAction.rawId, textToSend, nextBestAction.name);
                    }}
                    className="btn-primary gap-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send reply</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (inlineReplyId === nextBestAction.id) {
                        setInlineReplyId(null);
                      } else {
                        setInlineReplyId(nextBestAction.id);
                        setInlineReplyText(
                          nextBestAction.suggestion
                            ? nextBestAction.suggestion[selectedTone]
                            : nextBestAction.aiSuggestion || ""
                        );
                      }
                    }}
                    className="h-10 px-4 rounded-[12px] border border-[#E6E2D8] bg-white hover:bg-[#F7F5F0] text-[#12141A] text-[14px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Pencil className="h-3.5 w-3.5 text-[#666C78]" />
                    <span>{inlineReplyId === nextBestAction.id ? "Cancel" : "Edit"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleResolveItem(nextBestAction.id, nextBestAction.name)}
                    className="h-10 px-3.5 rounded-[12px] text-[#666C78] hover:text-[#12141A] hover:bg-[#F7F5F0] text-[13px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Snooze</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolveItem(nextBestAction.id, nextBestAction.name)}
                    className="h-10 px-4 rounded-[12px] border border-[#E6E2D8] bg-white hover:bg-[#E4F7EF] hover:text-[#0A7A53] hover:border-[#BDECD7] text-[#12141A] text-[14px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5 text-[#12B886]" />
                    <span>Done</span>
                  </button>
                </div>
              </div>
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

        {/* HERO 2 (RIGHT 5 COLS): REVENUE HERO (.hero-ink SURFACE WITH 80PX METRIC) */}
        <div className="hero-ink xl:col-span-5 relative overflow-hidden flex flex-col justify-between">
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
              <div className="metric-hero text-white tabular-nums">
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

            {/* Proportional Stage Bar (12px tall, open stages only) */}
            <div className="my-5">
              <div className="h-3 w-full rounded-full bg-[#1B1F29] overflow-hidden flex gap-1 p-0.5">
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

          {/* Quiet Metric Summary Lines at Bottom */}
          <div className="pt-4 border-t border-white/10 space-y-2.5 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-[#A3A9B6]">Won this period</span>
              <span className="font-medium text-[#12B886] tabular-nums">
                {formatINR(wonValue)} ({wonDeals.length} {wonDeals.length === 1 ? "deal" : "deals"} closed)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#A3A9B6]">Win conversion rate</span>
              <span className="font-medium text-white tabular-nums">
                {winRate}% of closed proposals
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
          <div className="card">
            {/* Header with channel tabs & pipeline value */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 mb-5 pb-4 border-b border-[#EFEDE7]">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-[1.25rem] font-medium text-[#12141A] tracking-[-0.01em]">
                    Up next in your queue
                  </h2>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#FF5A1F] bg-[#FFF0EB] border border-[#FFD8CC] px-2.5 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF5A1F] animate-pulse" />
                    {upNextQueue.length} priority items
                  </span>
                  {queuePipelineValue > 0 && (
                    <span className="text-[11px] font-medium text-[#0A7A53] bg-[#E4F7EF] border border-[#BDECD7] px-2.5 py-0.5 rounded-full">
                      {formatINR(queuePipelineValue)} pipeline at stake
                    </span>
                  )}
                </div>
                <p className="text-[0.875rem] text-[#666C78] mt-1">
                  {todayFilter !== "all"
                    ? `Filtered by "${todayFilter.replace("_", " ")}" • `
                    : ""}
                  Real customer messages and SLAs with instant 1-click AI replies
                </p>
              </div>

              {/* Channel filter tabs */}
              <div className="inline-flex items-center gap-1 p-1 rounded-[10px] bg-[#F7F5F0] border border-[#E6E2D8] self-start sm:self-auto">
                {(
                  [
                    { id: "all", label: "All", count: upNextQueue.length },
                    { id: "whatsapp", label: "WhatsApp", count: upNextQueue.filter((i) => i.type === "conversation").length },
                    { id: "task", label: "Tasks", count: upNextQueue.filter((i) => i.type === "task").length },
                    { id: "lead", label: "Leads", count: upNextQueue.filter((i) => i.type === "lead").length },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setQueueChannelFilter(tab.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-[7px] text-[12px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer",
                      queueChannelFilter === tab.id
                        ? "bg-white text-[#12141A] shadow-2xs font-semibold"
                        : "text-[#666C78] hover:text-[#12141A]"
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.2 rounded-full font-medium tabular-nums",
                        queueChannelFilter === tab.id
                          ? "bg-[#12141A] text-white"
                          : "bg-black/5 text-[#666C78]"
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-[#E6E2D8]">
              {displayedQueue.length > 0 ? (
                displayedQueue.map((item) => {
                  const avatarStyle = getAvatarColor(item.name);
                  const isConv = item.type === "conversation";
                  const isTask = item.type === "task";
                  const isLead = item.type === "lead";

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "py-3.5 px-3.5 -mx-3.5 rounded-[14px] transition-colors",
                        expandedQueueItemId === item.id
                          ? "bg-[#FAF8FE]/80 border border-[#E9E4F7] shadow-xs"
                          : "hover:bg-[#FAF9F5] border border-transparent"
                      )}
                    >
                      {/* Main Item Row */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5 min-w-0">
                          {/* Avatar */}
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border text-[14px] font-medium shadow-2xs mt-0.5 select-none",
                              avatarStyle.bg,
                              avatarStyle.text,
                              avatarStyle.border
                            )}
                          >
                            {getInitials(item.name)}
                          </div>

                          <div className="min-w-0 flex-1">
                            {/* Line 1: Name + Badges */}
                            <div className="flex items-center gap-2 flex-wrap">
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
                                className="text-[15px] font-semibold text-[#12141A] truncate hover:text-[#FF5A1F] cursor-pointer transition-colors"
                              >
                                {item.name}
                              </span>

                              {/* Channel Badge */}
                              {isConv && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EAEEFF] text-[#2A3DB5] border border-[#D3DCFF]">
                                  <MessageSquare className="h-2.5 w-2.5 text-[#2A3DB5]" />
                                  <span>WhatsApp</span>
                                </span>
                              )}
                              {isTask && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FFF3D6] text-[#8F5300] border border-[#FFE5A3]">
                                  <Clock className="h-2.5 w-2.5 text-[#8F5300]" />
                                  <span>Task</span>
                                </span>
                              )}
                              {isLead && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#E3F3FD] text-[#0A6AA3] border border-[#BFE3FA]">
                                  <Sparkles className="h-2.5 w-2.5 text-[#0A6AA3]" />
                                  <span>Lead</span>
                                </span>
                              )}

                              {/* Deal Title / Subcontext Badge */}
                              {item.dealTitle && (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-normal bg-black/[0.04] text-[#454B57] truncate max-w-[200px]">
                                  {item.dealTitle}
                                </span>
                              )}

                              {/* Deal Value Pill */}
                              {item.dealValue && (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#E4F7EF] text-[#0A7A53] border border-[#BDECD7] tabular-nums">
                                  {formatINR(item.dealValue)}
                                </span>
                              )}
                            </div>

                            {/* Line 2: Real Message / Goal Snippet */}
                            {item.inboundText && (
                              <p className="text-[13px] text-[#454B57] font-normal leading-snug line-clamp-2 mt-1">
                                <span className="text-[#666C78] font-medium mr-1.5">
                                  {isConv ? "Incoming message:" : isTask ? "Milestone:" : "Inquiry:"}
                                </span>
                                &ldquo;{item.inboundText}&rdquo;
                              </p>
                            )}

                            {/* Line 3: AI Intent / Topic Pill */}
                            {item.suggestion?.topic && (
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#7C4DFF] bg-[#F5F0FF] border border-[#E9E4F7] px-2 py-0.5 rounded-full">
                                  <Sparkles className="h-3 w-3 text-[#7C4DFF]" />
                                  <span>{item.suggestion.topic}</span>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: SLA Time + Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-start mt-1">
                          {/* SLA Badge */}
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[11.5px] font-medium tabular-nums border",
                              item.timeAgo === "overdue"
                                ? "bg-[#FFE9EA] text-[#B42336] border-[#FCD0D3]"
                                : item.timeAgo.includes("waiting")
                                ? "bg-[#FFF3D6] text-[#8F5300] border-[#FDE5A3]"
                                : "bg-[#F7F5F0] text-[#666C78] border-[#E6E2D8]"
                            )}
                          >
                            {item.timeAgo}
                          </span>

                          {/* Quick Actions */}
                          {item.suggestion && (
                            <button
                              type="button"
                              onClick={() => setExpandedQueueItemId(expandedQueueItemId === item.id ? null : item.id)}
                              className="h-8 px-2.5 rounded-[8px] bg-[#12141A] hover:bg-[#2A2E39] text-white text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer active:scale-[0.98] shadow-2xs"
                            >
                              <Send className="h-3 w-3" />
                              <span>{expandedQueueItemId === item.id ? "Hide" : "Reply"}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleResolveItem(item.id, item.name)}
                            className="h-8 px-2.5 rounded-[8px] hover:bg-black/5 text-[#666C78] hover:text-[#12141A] text-[12px] font-medium transition-colors cursor-pointer"
                          >
                            Snooze
                          </button>

                          <button
                            type="button"
                            onClick={() => handleResolveItem(item.id, item.name)}
                            className="h-8 px-2.5 rounded-[8px] border border-[#E6E2D8] bg-white hover:bg-[#E4F7EF] hover:border-[#BDECD7] hover:text-[#0A7A53] text-[#12141A] text-[12px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Check className="h-3 w-3 text-[#12B886]" />
                            <span>Done</span>
                          </button>
                        </div>
                      </div>

                      {/* Inline AI Quick Reply Dock */}
                      {expandedQueueItemId === item.id && item.suggestion && (
                        <div className="mt-3.5 pt-3 border-t border-[#EBE7DF] space-y-2.5">
                          <div className="p-3.5 rounded-[12px] bg-[#FAF8FE] border border-[#E9E4F7] space-y-2.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#5B34C9]">
                                <Sparkles className="h-3.5 w-3.5 text-[#7C4DFF]" />
                                <span>AI Recommended Response</span>
                                <span className="text-[11px] text-[#7C4DFF] bg-[#F0EAFF] px-2 py-0.5 rounded-full font-medium ml-1">
                                  {item.suggestion.topic}
                                </span>
                              </div>

                              {/* Tone Selector */}
                              <div className="inline-flex items-center gap-1 p-0.5 rounded-[8px] bg-white border border-[#E9E4F7]">
                                {(["standard", "shorter", "direct"] as const).map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => setQueueRowTone((prev) => ({ ...prev, [item.id]: t }))}
                                    className={cn(
                                      "px-2 py-0.5 rounded-[6px] text-[11px] font-medium capitalize transition-colors cursor-pointer",
                                      (queueRowTone[item.id] || "standard") === t
                                        ? "bg-[#7C4DFF] text-white shadow-2xs"
                                        : "text-[#666C78] hover:text-[#12141A]"
                                    )}
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Reply Text Preview */}
                            <p className="text-[13px] text-[#12141A] leading-relaxed font-normal bg-white p-3 rounded-[9px] border border-[#E9E4F7]">
                              {item.suggestion[queueRowTone[item.id] || "standard"]}
                            </p>

                            {/* Send Reply Button */}
                            <div className="flex items-center justify-between gap-2 pt-1">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (item.type === "conversation") {
                                      handleSendReply(
                                        item.rawId,
                                        item.suggestion![queueRowTone[item.id] || "standard"],
                                        item.name
                                      );
                                    } else {
                                      handleResolveItem(item.id, item.name);
                                    }
                                    setExpandedQueueItemId(null);
                                  }}
                                  className="btn-primary gap-1.5 text-[12.5px] h-8 px-3.5"
                                >
                                  <Send className="h-3 w-3" />
                                  <span>Send on WhatsApp</span>
                                </button>

                                {item.phone && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCustomer({
                                        name: item.name,
                                        phone: item.phone!,
                                        reason: item.reason,
                                      });
                                    }}
                                    className="h-8 px-3 rounded-[8px] border border-[#E6E2D8] bg-white hover:bg-[#F7F5F0] text-[#12141A] text-[12px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <ExternalLink className="h-3 w-3 text-[#666C78]" />
                                    <span>Open chat</span>
                                  </button>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => setExpandedQueueItemId(null)}
                                className="text-[12px] text-[#666C78] hover:text-[#12141A] font-medium cursor-pointer"
                              >
                                Collapse
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
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
          <div className="card">
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
                    setNewDealContact({
                      name: selectedCustomer.name,
                      phone: selectedCustomer.phone,
                    });
                    setSelectedCustomer(null);
                    setNewDealOpen(true);
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
      <NewOpportunityModal
        open={newDealOpen}
        onClose={() => {
          setNewDealOpen(false);
          setNewDealContact(null);
        }}
        orgSlug={orgSlug}
        initialContactName={newDealContact?.name}
        initialContactPhone={newDealContact?.phone}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
