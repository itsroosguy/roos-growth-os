"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useTenant } from "@/lib/organizations/tenant-context";
import { crmStore } from "@/lib/crm/crm-store";
import { whatsappStore } from "@/lib/whatsapp/whatsapp-store";
import { campaignStore } from "@/lib/campaigns/campaign-store";
import { LeadStage, Task, Lead } from "@/types/crm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { useToast } from "@/components/ui/toast-context";
import { NewOpportunityModal } from "@/components/crm/new-opportunity-modal";
import {
  cn,
  formatINR,
  formatCompactINR,
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
  List,
  LayoutGrid,
  AlertCircle,
  Phone,
  CheckCircle2,
  Users,
  MoreVertical,
  MoreHorizontal,
  GripVertical,
  DollarSign,
  Briefcase,
  Layers,
  ArrowUpRight,
  UserCheck,
  Flag,
  Paperclip,
  SlidersHorizontal,
  Building2,
  FileText,
  Globe,
} from "lucide-react";

const TIMEZONE_OPTIONS = [
  { value: "Asia/Kolkata", code: "IST", city: "Kolkata, New Delhi", offset: "+5:30" },
  { value: "Asia/Dubai", code: "GST", city: "Dubai", offset: "+4:00" },
  { value: "Asia/Singapore", code: "SGT", city: "Singapore", offset: "+8:00" },
  { value: "Europe/London", code: "BST", city: "London", offset: "+1:00" },
  { value: "America/New_York", code: "EST", city: "New York", offset: "-4:00" },
  { value: "America/Los_Angeles", code: "PST", city: "San Francisco", offset: "-7:00" },
  { value: "UTC", code: "UTC", city: "Universal", offset: "+0:00" },
];

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
  timeAgo: string;
  waitingHours: number;
  dealValue?: number;
  dealTitle?: string;
}

function getReplySuggestionForContext(
  name: string,
  inboundText?: string,
  contextTitle?: string
): ContextualSuggestion {
  const firstName = name.includes(" ") ? name.split(" ")[0] : name;
  const text = (inboundText || "").toLowerCase();
  const title = (contextTitle || "").toLowerCase();

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

  return {
    topic: "Account support & onboarding",
    intent: "Follow-up & Support",
    standard: `Hi ${firstName}! Hope you're having a productive week. Following up to see if there's anything else our automation specialists can assist you with today.`,
    shorter: `Hi ${firstName}! Just following up to see if you have any questions on our solution.`,
    direct: `Hi ${firstName}, checking in regarding your inquiry. Let me know if you are ready to proceed with onboarding.`,
  };
}

export default function OverviewPage() {
  const { currentOrg } = useTenant();
  const orgSlug = currentOrg.slug;
  const { toast } = useToast();

  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<"This Month" | "Yearly" | "All Time" | "Custom">("This Month");
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const [resolvedQueueIds, setResolvedQueueIds] = useState<Set<string>>(new Set());

  // Priority Action Card Enhanced State
  const [actionCardDismissed, setActionCardDismissed] = useState(false);
  const [composerTab, setComposerTab] = useState<"reply" | "template" | "note">("reply");
  const [replyText, setReplyText] = useState(
    "Hi Sneha, sounds great. Please take your time reviewing the fleet proposal with your finance team.\nShall I check back with you on Friday, or would you like me to clarify any unit pricing or terms before then?"
  );
  const [customiseOpen, setCustomiseOpen] = useState(false);
  const [selectedTone, setSelectedTone] = useState<"standard" | "shorter" | "direct">("standard");
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [createTaskChecked, setCreateTaskChecked] = useState(false);
  const [dueDateText, setDueDateText] = useState("Due Fri, 31 Oct");
  const [dueDateDropdownOpen, setDueDateDropdownOpen] = useState(false);
  const [sendDropdownOpen, setSendDropdownOpen] = useState(false);
  const [snoozeDropdownOpen, setSnoozeDropdownOpen] = useState(false);
  const [kebabMenuOpen, setKebabMenuOpen] = useState(false);
  const [contactTags, setContactTags] = useState<string[]>(["Enterprise", "Warm Lead"]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagText, setNewTagText] = useState("");

  const handleShortenReply = () => {
    if (replyText.includes("clarify any unit pricing")) {
      setReplyText(
        "Hi Sneha, sounds great. Please take your time reviewing with finance. Shall I check back Friday, or clarify pricing sooner?"
      );
      toast("Reply Shortened", { message: "Concise 2-sentence draft applied.", type: "info" });
    } else {
      setReplyText(
        "Hi Sneha, sounds great. Please take your time reviewing the fleet proposal with your finance team.\nShall I check back with you on Friday, or would you like me to clarify any unit pricing or terms before then?"
      );
      toast("Reply Expanded", { message: "Standard conversational draft restored.", type: "info" });
    }
  };

  const handleSaveAsTemplate = () => {
    toast("Saved as Template", { message: "Draft added to reusable WhatsApp templates.", type: "success" });
  };

  const handleAttachment = () => {
    if (attachedFiles.length > 0) {
      setAttachedFiles([]);
      toast("Attachment Removed", { message: "File detached.", type: "info" });
    } else {
      setAttachedFiles(["fleet-proposal-v2.pdf (1.4 MB)"]);
      toast("File Attached", { message: "fleet-proposal-v2.pdf attached to outgoing message.", type: "success" });
    }
  };

  const handleScheduleFollowup = () => {
    setDueDateText("Due Fri, 31 Oct, 10:00 AM");
    setCreateTaskChecked(true);
    toast("Follow-up Scheduled", { message: "Calendar reminder set for Fri, 31 Oct 10:00 AM.", type: "info" });
  };

  const handleInsertDoc = () => {
    setReplyText((prev) => `${prev.trim()}\n\n[Fleet Management Commercial Proposal v2.pdf]`);
    toast("Document Link Inserted", { message: "Commercial proposal link appended to message.", type: "info" });
  };

  const handleSendReplyAction = (mode: string = "default") => {
    toast("WhatsApp Message Sent", {
      message: "Dispatched reply to Sneha Reddy (+91 98765 43213).",
      type: "success",
    });
    setActionCardDismissed(true);
    setResolvedQueueIds((prev) => {
      const next = new Set(prev);
      next.add("priority-sr");
      return next;
    });
  };

  const handleMarkAsDone = () => {
    toast("Action Item Marked Complete", {
      message: "Sneha Reddy follow-up logged and marked complete.",
      type: "success",
    });
    setActionCardDismissed(true);
    setResolvedQueueIds((prev) => {
      const next = new Set(prev);
      next.add("priority-sr");
      return next;
    });
  };

  const handleSnoozeAction = (label: string) => {
    setSnoozeDropdownOpen(false);
    toast("Action Item Snoozed", {
      message: `Reminder scheduled: ${label}.`,
      type: "info",
    });
    setActionCardDismissed(true);
  };

  const handleDismiss = () => {
    setActionCardDismissed(true);
    toast("Action Item Dismissed", {
      message: "Sneha Reddy priority banner hidden for this session.",
      type: "info",
    });
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagText.trim() && !contactTags.includes(newTagText.trim())) {
      setContactTags([...contactTags, newTagText.trim()]);
      toast("Tag Added", { message: `Added tag "${newTagText.trim()}".`, type: "success" });
    }
    setNewTagText("");
    setIsAddingTag(false);
  };

  // New Opportunity Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Drag and drop for pipeline
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStage | null>(null);

  // Live Clock & Timezone
  const [selectedTimezone, setSelectedTimezone] = useState<string>("Asia/Kolkata");
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [tzDropdownOpen, setTzDropdownOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: selectedTimezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(currentTime);
    } catch {
      return currentTime.toLocaleTimeString();
    }
  }, [currentTime, selectedTimezone]);

  // Dynamic greeting based on current hour in selected timezone
  const greeting = useMemo(() => {
    try {
      const hourStr = new Intl.DateTimeFormat("en-US", {
        timeZone: selectedTimezone,
        hour: "numeric",
        hour12: false,
      }).format(currentTime);
      const hour = parseInt(hourStr, 10);
      if (hour >= 4 && hour < 12) {
        return "Good morning";
      } else if (hour >= 12 && hour < 17) {
        return "Good afternoon";
      } else {
        return "Good evening";
      }
    } catch {
      const hour = currentTime.getHours();
      if (hour >= 4 && hour < 12) return "Good morning";
      if (hour >= 12 && hour < 17) return "Good afternoon";
      return "Good evening";
    }
  }, [currentTime, selectedTimezone]);

  // Recent conversations lifecycle tab filter: "all" | "ongoing" | "open" | "closed"
  const [conversationFilter, setConversationFilter] = useState<"all" | "ongoing" | "open" | "closed">("all");

  // Undo task storage
  const [lastCompletedTask, setLastCompletedTask] = useState<Task | null>(null);

  // Real Queries from Data Stores
  const leads = useMemo(() => crmStore.getLeads(orgSlug), [orgSlug, refreshKey]);
  const tasks = useMemo(() => crmStore.getTasks(orgSlug), [orgSlug, refreshKey]);
  const conversations = useMemo(() => whatsappStore.getConversations(orgSlug), [orgSlug, refreshKey]);
  const campaigns = useMemo(() => campaignStore.getCampaigns(orgSlug), [orgSlug, refreshKey]);

  // Boundaries for Today / Overdue
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

  // 1. Unread conversations
  const unreadConversations = useMemo(() => {
    return conversations.filter((c) => c.unread_count > 0 && !resolvedQueueIds.has(`conv-${c.id}`));
  }, [conversations, resolvedQueueIds]);

  // Conversation classifications: "all" | "ongoing" | "open" | "closed"
  const conversationCounts = useMemo(() => {
    const ongoing = conversations.filter(
      (c) => c.status === "pending" || (c.status === "open" && c.unread_count === 0)
    );
    const open = conversations.filter(
      (c) => c.status === "open" && c.unread_count > 0
    );
    const closed = conversations.filter(
      (c) => c.status === "resolved" || c.status === "closed"
    );
    return {
      all: conversations.length,
      ongoing: ongoing.length > 0 ? ongoing.length : 3,
      open: open.length > 0 ? open.length : 2,
      closed: closed.length > 0 ? closed.length : 1,
    };
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    if (conversationFilter === "all") return conversations.slice(0, 4);
    if (conversationFilter === "ongoing") {
      const list = conversations.filter(
        (c) => c.status === "pending" || (c.status === "open" && c.unread_count === 0)
      );
      return (list.length > 0 ? list : conversations.slice(1, 4)).slice(0, 4);
    }
    if (conversationFilter === "open") {
      const list = conversations.filter((c) => c.unread_count > 0 || c.status === "open");
      return (list.length > 0 ? list : conversations.slice(0, 2)).slice(0, 4);
    }
    if (conversationFilter === "closed") {
      const list = conversations.filter((c) => c.status === "resolved" || c.status === "closed");
      return (list.length > 0 ? list : conversations.slice(4, 6)).slice(0, 4);
    }
    return conversations.slice(0, 4);
  }, [conversations, conversationFilter]);

  // 2. Tasks Due Today
  const todayTasks = useMemo(() => {
    return tasks.filter(
      (t) =>
        t.status !== "completed" &&
        new Date(t.due_date) >= startOfToday &&
        new Date(t.due_date) <= endOfToday &&
        !resolvedQueueIds.has(`task-${t.id}`)
    );
  }, [tasks, startOfToday, endOfToday, resolvedQueueIds]);

  // 3. Overdue Tasks
  const overdueTasks = useMemo(() => {
    return tasks.filter(
      (t) =>
        t.status !== "completed" &&
        new Date(t.due_date) < startOfToday &&
        !resolvedQueueIds.has(`task-${t.id}`)
    );
  }, [tasks, startOfToday, resolvedQueueIds]);

  // 4. In Proposal Deals
  const proposalLeads = useMemo(() => {
    return leads.filter((l) => l.stage === "proposal");
  }, [leads]);

  // Total Open Pipeline Value
  const activeLeads = useMemo(() => {
    return leads.filter((l) => l.stage !== "lost");
  }, [leads]);

  const pipelineValue = useMemo(() => {
    return activeLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
  }, [activeLeads]);

  const proposalValue = useMemo(() => {
    return proposalLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
  }, [proposalLeads]);

  // Priority Action Item (Default: Sneha Reddy or first unread)
  const priorityContact = useMemo(() => {
    return {
      name: "Sneha Reddy",
      company: "Fleet Management Solution",
      phone: "+91 98765 43213",
      waiting: "1h",
      inboundText: "Thanks, we will review the fleet proposal with our finance team.",
      time: "Today, 11:16 AM",
    };
  }, []);

  const suggestion = useMemo(() => {
    return getReplySuggestionForContext(
      priorityContact.name,
      priorityContact.inboundText,
      priorityContact.company
    );
  }, [priorityContact]);

  const displayedReply = useMemo(() => {
    return replyText;
  }, [replyText]);

  // Pipeline Columns
  const pipelineColumns: {
    stage: LeadStage;
    label: string;
    tint: string;
    text: string;
    border: string;
    barColor: string;
  }[] = [
    {
      stage: "new",
      label: "Inbound",
      tint: "bg-[#EAEEFF]",
      text: "text-[#2A3DB5]",
      border: "border-[#C7D2FE]",
      barColor: "bg-[#3D5AFE]",
    },
    {
      stage: "qualified",
      label: "Qualified",
      tint: "bg-[#E3F3FD]",
      text: "text-[#0A6AA3]",
      border: "border-[#BFE3FA]",
      barColor: "bg-[#1FA2E8]",
    },
    {
      stage: "proposal",
      label: "Proposal",
      tint: "bg-[#FFF3D6]",
      text: "text-[#8F5300]",
      border: "border-[#FFE5A3]",
      barColor: "bg-[#F5A524]",
    },
    {
      stage: "won",
      label: "Won",
      tint: "bg-[#E4F7EF]",
      text: "text-[#0A7A53]",
      border: "border-[#BDECD7]",
      barColor: "bg-[#12B886]",
    },
  ];

  // Drag & drop handlers
  const handleDragStart = (leadId: string) => {
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, stage: LeadStage) => {
    e.preventDefault();
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDrop = (stage: LeadStage) => {
    if (draggedLeadId) {
      crmStore.updateLeadStage(orgSlug, draggedLeadId, stage);
      setRefreshKey((k) => k + 1);
      toast("Deal Stage Updated", {
        message: `Moved opportunity to ${STAGE_CONFIG[stage]?.label || stage}.`,
        type: "success",
      });
    }
    setDraggedLeadId(null);
    setDragOverStage(null);
  };

  // Handle task complete & undo
  const handleToggleTask = (task: Task) => {
    const isCompleted = task.status === "completed";
    const nextStatus = isCompleted ? "todo" : "completed";
    crmStore.updateTaskStatus(orgSlug, task.id, nextStatus);
    setLastCompletedTask(task);
    setRefreshKey((k) => k + 1);

    toast(isCompleted ? "Task Reopened" : "Task Completed", {
      message: `"${task.title}" updated.`,
      type: "success",
    });
  };

  const handleUndoTask = () => {
    if (lastCompletedTask) {
      crmStore.updateTaskStatus(orgSlug, lastCompletedTask.id, lastCompletedTask.status);
      setLastCompletedTask(null);
      setRefreshKey((k) => k + 1);
      toast("Action Undone", {
        message: "Task reverted to previous state.",
        type: "info",
      });
    }
  };

  // Handle Send AI Reply
  const handleSendPriorityReply = () => {
    toast("WhatsApp Message Sent", {
      message: `Dispatched AI response to ${priorityContact.name} (+91 98765 43213).`,
      type: "success",
    });
    setResolvedQueueIds((prev) => {
      const next = new Set(prev);
      next.add("priority-sr");
      return next;
    });
  };

  return (
    <div className="space-y-6 animate-fade-rise">
      {/* ==================================================================== */}
      {/* 1. HEADER (Greeting, Live Clock & Timezone, Smart Briefing Sentence) */}
      {/* ==================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-[22px] sm:text-[24px] font-semibold text-[#12141A] tracking-[-0.02em] leading-tight">
              {greeting}, Praveen
            </h2>

            {/* Live Clock with Selectable Timezone Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setTzDropdownOpen(!tzDropdownOpen)}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12.5px] font-medium bg-white border border-[#EDE8E0] text-[#343A46] hover:bg-[#FAF9F5] shadow-2xs transition-colors cursor-pointer"
                title="Select timezone"
              >
                <span className="h-2 w-2 rounded-full bg-[#12B886] animate-pulse shrink-0" />
                <span className="tabular-nums font-semibold text-[#12141A]">{formattedTime}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#FAF9F5] text-[11px] font-medium text-[#666C78] border border-[#EDE8E0]">
                  {TIMEZONE_OPTIONS.find((t) => t.value === selectedTimezone)?.code || "IST"}
                </span>
                <ChevronDown className="h-3 w-3 text-[#666C78] shrink-0" />
              </button>

              {tzDropdownOpen && (
                <div className="absolute left-0 top-9 w-60 rounded-[12px] bg-white border border-[#EDE8E0] shadow-lg p-1.5 z-30 space-y-0.5 animate-fade-rise">
                  <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#8A909D] border-b border-[#EDE8E0] mb-1 flex items-center gap-1.5">
                    <Globe className="h-3 w-3 text-[#666C78]" />
                    <span>Select Timezone</span>
                  </div>
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <button
                      key={tz.value}
                      type="button"
                      onClick={() => {
                        setSelectedTimezone(tz.value);
                        setTzDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-[8px] text-[12px] transition-colors cursor-pointer flex items-center justify-between",
                        selectedTimezone === tz.value
                          ? "bg-[#0B0D12] text-white font-medium"
                          : "text-[#12141A] hover:bg-[#FAF9F5]"
                      )}
                    >
                      <div>
                        <span className="font-semibold">{tz.code}</span>
                        <span
                          className={cn(
                            "ml-1.5 text-[11.5px]",
                            selectedTimezone === tz.value ? "text-white/80" : "text-[#666C78]"
                          )}
                        >
                          {tz.city} ({tz.offset})
                        </span>
                      </div>
                      {selectedTimezone === tz.value && <Check className="h-3.5 w-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="text-[17px] sm:text-[18px] lg:text-[19px] font-normal text-[#242933] leading-normal flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-1.5">
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[13.5px] sm:text-[14px] font-medium bg-[#EAF2FF] text-[#0D62D9] border border-[#BFD7FE] shadow-2xs select-none">
              {priorityContact.name}
            </span>
            <span>has waited</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[13px] sm:text-[13.5px] font-medium bg-[#FFF6E5] text-[#995700] border border-[#FFE7B8] shadow-2xs select-none">
              {priorityContact.waiting}
            </span>
            <span>. You have</span>
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[13.5px] sm:text-[14px] font-medium bg-[#EEF2FF] text-[#3346B8] border border-[#CCD7FE] shadow-2xs select-none">
              3 calls
            </span>
            <span>today and</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[13.5px] sm:text-[14px] font-medium bg-[#E6F9F2] text-[#08774F] border border-[#B5EED8] shadow-2xs select-none">
              {formatCompactINR(proposalValue)}
            </span>
            <span>sitting in</span>
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[13.5px] sm:text-[14px] font-medium bg-[#FFF6E5] text-[#995700] border border-[#FFE7B8] shadow-2xs select-none">
              Proposal
            </span>
            <span>.</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {/* Period Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPeriodDropdownOpen(!periodDropdownOpen)}
              className="h-10 px-3.5 rounded-[12px] border border-[#EDE8E0] bg-white text-[13.5px] font-medium text-[#12141A] hover:bg-[#FAF9F5] shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>{selectedPeriod}</span>
              <ChevronDown className="h-3.5 w-3.5 text-[#666C78]" />
            </button>
            {periodDropdownOpen && (
              <div className="absolute right-0 top-11 w-36 rounded-[12px] bg-white border border-[#EDE8E0] shadow-lg p-1.5 z-20 space-y-0.5 animate-fade-rise">
                {(["This Month", "Yearly", "All Time", "Custom"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setSelectedPeriod(p);
                      setPeriodDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-2.5 py-1.5 rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer flex items-center justify-between",
                      selectedPeriod === p ? "bg-[#0B0D12] text-white" : "text-[#12141A] hover:bg-[#FAF9F5]"
                    )}
                  >
                    <span>{p}</span>
                    {selectedPeriod === p && <Check className="h-3.5 w-3.5 text-white" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Primary Orange Gradient Button */}
          <Button
            variant="primary"
            onClick={() => setCreateModalOpen(true)}
            className="rounded-[12px] text-[14px] font-medium h-10 px-4 flex items-center gap-1.5 shadow-xs cursor-pointer bg-gradient-to-b from-[#FF7A3D] to-[#FF5A1F] text-white transition-transform active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>New opportunity</span>
          </Button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. KPI ROW (4 Cards: Waiting on you, Due today, Overdue, In proposal)*/}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Waiting on you */}
        <div className="card-ref p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-[10px] bg-[#EAEEFF] text-[#2A3DB5] flex items-center justify-center">
                <MessageSquare className="h-4 w-4" />
              </div>
              <span className="text-[13px] font-medium text-[#454B57]">Waiting on you</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-medium bg-[#E4F7EF] text-[#0A7A53]">
              ↑ 1
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-[32px] font-semibold tabular-nums text-[#12141A]">
              <AnimatedNumber value={unreadConversations.length} />
            </span>
            {/* Mini bar sparkline */}
            <div className="flex items-end gap-1 h-6">
              <span className="w-1.5 h-3 bg-[#D3DCFF] rounded-t-sm" />
              <span className="w-1.5 h-4 bg-[#D3DCFF] rounded-t-sm" />
              <span className="w-1.5 h-2 bg-[#D3DCFF] rounded-t-sm" />
              <span className="w-1.5 h-6 bg-[#3D5AFE] rounded-t-sm" />
            </div>
          </div>
        </div>

        {/* Card 2: Due today */}
        <div className="card-ref p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-[10px] bg-[#FFF3D6] text-[#8F5300] flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
              <span className="text-[13px] font-medium text-[#454B57]">Due today</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-medium bg-[#FAF9F5] text-[#666C78] border border-[#EDE8E0]">
              → 0
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-[32px] font-semibold tabular-nums text-[#12141A]">
              <AnimatedNumber value={todayTasks.length} />
            </span>
            {/* Mini bar sparkline */}
            <div className="flex items-end gap-1 h-6">
              <span className="w-1.5 h-2 bg-[#FFE5A3] rounded-t-sm" />
              <span className="w-1.5 h-3 bg-[#FFE5A3] rounded-t-sm" />
              <span className="w-1.5 h-5 bg-[#F5A524] rounded-t-sm" />
              <span className="w-1.5 h-3 bg-[#FFE5A3] rounded-t-sm" />
            </div>
          </div>
        </div>

        {/* Card 3: Overdue */}
        <div className="card-ref p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-[10px] bg-[#FFE9EA] text-[#B42336] flex items-center justify-center">
                <AlertCircle className="h-4 w-4" />
              </div>
              <span className="text-[13px] font-medium text-[#454B57]">Overdue</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-medium bg-[#FFE9EA] text-[#B42336]">
              ↑ 1
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-[32px] font-semibold tabular-nums text-[#12141A]">
              <AnimatedNumber value={overdueTasks.length} />
            </span>
            {/* Mini bar sparkline */}
            <div className="flex items-end gap-1 h-6">
              <span className="w-1.5 h-1 bg-[#FFCCD0] rounded-t-sm" />
              <span className="w-1.5 h-2 bg-[#FFCCD0] rounded-t-sm" />
              <span className="w-1.5 h-4 bg-[#FFCCD0] rounded-t-sm" />
              <span className="w-1.5 h-6 bg-[#E5484D] rounded-t-sm" />
            </div>
          </div>
        </div>

        {/* Card 4: In proposal */}
        <div className="card-ref p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-[10px] bg-[#E4F7EF] text-[#0A7A53] flex items-center justify-center">
                <Briefcase className="h-4 w-4" />
              </div>
              <span className="text-[13px] font-medium text-[#454B57]">In proposal</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-medium bg-[#E4F7EF] text-[#0A7A53]">
              ↑ 1
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-[32px] font-semibold tabular-nums text-[#12141A]">
              <AnimatedNumber value={proposalLeads.length} />
            </span>
            {/* Mini bar sparkline */}
            <div className="flex items-end gap-1 h-6">
              <span className="w-1.5 h-2 bg-[#BDECD7] rounded-t-sm" />
              <span className="w-1.5 h-4 bg-[#BDECD7] rounded-t-sm" />
              <span className="w-1.5 h-3 bg-[#BDECD7] rounded-t-sm" />
              <span className="w-1.5 h-6 bg-[#12B886] rounded-t-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. MAIN 12-COLUMN GRID (Left 8 Cols / Right 4 Cols)                  */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================================================================== */}
        {/* LEFT 8 COLUMNS: Priority Action + Sales Pipeline Kanban + Recents   */}
        {/* ================================================================== */}
        <div className="lg:col-span-8 space-y-6">
          {/* Action Required Card (Pixel-perfect match to Reference) */}
          {actionCardDismissed ? (
            <div className="card-ref p-4.5 bg-[#FAF9F5] border border-[#EDE8E0] rounded-[16px] flex items-center justify-between transition-all duration-150">
              <div className="flex items-center gap-2.5 text-[14px] text-[#454B57]">
                <CheckCircle2 className="h-4.5 w-4.5 text-[#12B886]" />
                <span>Priority action for <strong>Sneha Reddy</strong> completed or dismissed.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActionCardDismissed(false);
                  setResolvedQueueIds((prev) => {
                    const next = new Set(prev);
                    next.delete("priority-sr");
                    return next;
                  });
                  toast("Action Restored", { message: "Sneha Reddy action card restored to overview.", type: "info" });
                }}
                className="text-[13px] font-medium text-[#FF5A1F] hover:underline cursor-pointer"
              >
                Restore card
              </button>
            </div>
          ) : (
            <div className="card-ref overflow-hidden !p-0 shadow-[0_1px_2px_rgba(11,13,18,0.04),0_10px_28px_-14px_rgba(11,13,18,0.14)] border border-[#EDE8E0] rounded-[16px] bg-white transition-all duration-200">
              {/* 1. TOP HEADER BANNER (Vivid Caution Amber Attention-Grabbing Style) */}
              <div className="bg-gradient-to-r from-[#FFFBEB] via-[#FEF3C7] to-[#FFFBEB] border-b border-[#FDE68A] border-l-4 border-l-[#F59E0B] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="h-11 w-11 rounded-[12px] bg-[#FEF08A] text-[#B45309] flex items-center justify-center shrink-0 border border-[#FDE047] mt-0.5 shadow-2xs">
                    <AlertCircle className="h-5.5 w-5.5 stroke-[2.2] text-[#B45309]" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#92400E] bg-[#FEF08A] border border-[#FDE047] px-2.5 py-0.5 rounded-[5px] mb-1.5 shadow-2xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#D97706] animate-pulse" />
                      PRIORITY
                    </span>
                    <h3 className="text-[21px] font-semibold text-[#1F2937] tracking-tight leading-tight">
                      Action required
                    </h3>
                    <p className="text-[14px] text-[#92400E] mt-1 font-medium leading-relaxed">
                      Sneha is reviewing the fleet proposal with finance — follow up now to maintain momentum.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-semibold bg-[#FEF08A] text-[#92400E] border border-[#FDE047] select-none shadow-2xs">
                    <span className="h-2 w-2 rounded-full bg-[#D97706] animate-pulse" />
                    <span>Due today</span>
                  </div>

                  {/* Kebab Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setKebabMenuOpen(!kebabMenuOpen)}
                      className="h-8.5 w-8.5 rounded-[10px] border border-[#EDE8E0] bg-white text-[#666C78] hover:text-[#12141A] hover:bg-[#FAF9F5] flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                      title="More actions"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {kebabMenuOpen && (
                      <div className="absolute right-0 top-10 w-48 rounded-[12px] bg-white border border-[#EDE8E0] shadow-lg p-1.5 z-20 space-y-0.5 animate-fade-rise">
                        <button
                          type="button"
                          onClick={() => {
                            setKebabMenuOpen(false);
                            toast("Action Reassigned", { message: "Transferred to Praveen R.", type: "info" });
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-[8px] text-[13px] text-[#12141A] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
                        >
                          Assign to teammate
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setKebabMenuOpen(false);
                            setIsAddingTag(true);
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-[8px] text-[13px] text-[#12141A] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
                        >
                          Add tags
                        </button>
                        <Link
                          href={`/app/${orgSlug}/leads`}
                          className="block w-full text-left px-3 py-1.5 rounded-[8px] text-[13px] text-[#12141A] hover:bg-[#FAF9F5] transition-colors"
                          onClick={() => setKebabMenuOpen(false)}
                        >
                          View deal in pipeline
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Dismiss Button */}
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="h-8.5 w-8.5 rounded-[10px] border border-[#EDE8E0] bg-white text-[#666C78] hover:text-[#12141A] hover:bg-[#FAF9F5] flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                    title="Dismiss action item"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* 2. CARD BODY */}
              <div className="p-6 space-y-5">
                {/* Contact Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-full bg-[#FFF7E8] text-[#9A6200] font-medium text-[16px] flex items-center justify-center shrink-0 border border-[#FEEAC2] shadow-2xs">
                      SR
                    </div>
                    <div>
                      <h4 className="text-[17px] font-semibold text-[#12141A] leading-tight">
                        Sneha Reddy
                      </h4>
                      <p className="text-[13.5px] text-[#666C78] mt-0.5">
                        Fleet Management Solution • +91 98765 43213
                      </p>
                      <div className="flex items-center flex-wrap gap-2 mt-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-normal text-[#454B57] bg-white border border-[#EDE8E0] shadow-2xs">
                          <Building2 className="h-3.5 w-3.5 text-[#666C78]" />
                          <span>Enterprise</span>
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium text-[#D94F1A] bg-[#FFF4ED] border border-[#FFDEC9]">
                          Warm Lead
                        </span>
                        {contactTags.filter((t) => t !== "Enterprise" && t !== "Warm Lead").map((tag) => (
                          <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium text-[#2A3DB5] bg-[#EAEEFF] border border-[#C7D2FE]">
                            {tag}
                          </span>
                        ))}
                        {isAddingTag ? (
                          <form onSubmit={handleAddTag} className="inline-flex items-center gap-1">
                            <input
                              type="text"
                              value={newTagText}
                              onChange={(e) => setNewTagText(e.target.value)}
                              placeholder="Tag name..."
                              autoFocus
                              className="h-6 px-2 rounded-full border border-[#FF5A1F] text-[12px] text-[#12141A] focus:outline-none w-24 bg-white"
                            />
                            <button type="submit" className="text-[11px] font-medium text-[#FF5A1F] hover:underline cursor-pointer">
                              Add
                            </button>
                          </form>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsAddingTag(true)}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-normal text-[#666C78] hover:text-[#12141A] border border-dashed border-[#CBD0D9] bg-transparent hover:bg-white transition-colors cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Add tag</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium bg-[#FFF9EB] text-[#A66E00] border border-[#FDE8BA]">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Waiting 1h</span>
                    </span>
                    <Link
                      href={`/app/${orgSlug}/leads`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] border border-[#EDE8E0] bg-white hover:bg-[#F9F8F6] text-[#12141A] text-[13.5px] font-medium shadow-2xs transition-colors cursor-pointer"
                    >
                      <span>View details</span>
                      <ArrowRight className="h-3.5 w-3.5 text-[#666C78]" />
                    </Link>
                  </div>
                </div>

                {/* Inbound WhatsApp Message Bubble */}
                <div className="flex items-start gap-3 pt-1">
                  <div className="h-9 w-9 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <svg className="h-4.5 w-4.5 text-white fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <div className="bg-[#F4F5F7] border border-[#E6E8ED] rounded-[16px] rounded-tl-[4px] px-4 py-3 max-w-2xl text-left shadow-2xs">
                    <p className="text-[14.5px] text-[#12141A] font-normal leading-relaxed">
                      Thanks, we will review the fleet proposal with our finance team.
                    </p>
                    <span className="text-[12px] text-[#868E96] mt-1.5 block">
                      Today, 11:16 AM
                    </span>
                  </div>
                </div>

                {/* Composer / Editor Panel */}
                <div className="rounded-[14px] border border-[#EDE8E0] bg-white shadow-2xs overflow-hidden">
                  {/* Tabs Header + Shorten / Customise Tools */}
                  <div className="border-b border-[#EDE8E0] px-4 pt-3 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1 -mb-[1px]">
                      <button
                        type="button"
                        onClick={() => setComposerTab("reply")}
                        className={cn(
                          "text-[14px] pb-2.5 px-2 transition-colors cursor-pointer",
                          composerTab === "reply"
                            ? "font-semibold text-[#12141A] border-b-2 border-[#FF5A1F]"
                            : "font-normal text-[#666C78] hover:text-[#12141A]"
                        )}
                      >
                        Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setComposerTab("template");
                          setReplyText(
                            "Hi Sneha, following up on our proposal for Fleet Management Solution. Let us know if you'd like to schedule a 10-minute briefing with our solution architect."
                          );
                          toast("Template Loaded", { message: "Standard Follow-up Template applied.", type: "info" });
                        }}
                        className={cn(
                          "text-[14px] pb-2.5 px-3 transition-colors cursor-pointer",
                          composerTab === "template"
                            ? "font-semibold text-[#12141A] border-b-2 border-[#FF5A1F]"
                            : "font-normal text-[#666C78] hover:text-[#12141A]"
                        )}
                      >
                        Use template
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setComposerTab("note");
                          toast("Internal Note Mode", { message: "Internal notes are visible only to your team.", type: "info" });
                        }}
                        className={cn(
                          "text-[14px] pb-2.5 px-3 transition-colors cursor-pointer",
                          composerTab === "note"
                            ? "font-semibold text-[#12141A] border-b-2 border-[#FF5A1F]"
                            : "font-normal text-[#666C78] hover:text-[#12141A]"
                        )}
                      >
                        Add note
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 pb-2">
                      <button
                        type="button"
                        onClick={handleShortenReply}
                        className="text-[13px] font-medium text-[#666C78] hover:text-[#12141A] hover:bg-[#F4F2EE] px-2.5 py-1 rounded-[8px] transition-colors cursor-pointer"
                      >
                        Shorten reply
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomiseOpen(!customiseOpen)}
                        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#666C78] hover:text-[#12141A] hover:bg-[#F4F2EE] px-2.5 py-1 rounded-[8px] transition-colors cursor-pointer"
                      >
                        <span>Customise</span>
                        <SlidersHorizontal className="h-3.5 w-3.5 text-[#666C78]" />
                      </button>
                    </div>
                  </div>

                  {/* Customise Tone Banner */}
                  {customiseOpen && (
                    <div className="px-4 py-2 bg-[#FBF9F5] border-b border-[#EDE8E0] flex items-center justify-between text-[12.5px] animate-fade-rise">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#12141A]">Tone:</span>
                        {(["standard", "shorter", "direct", "formal"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setSelectedTone(t === "formal" ? "standard" : t);
                              if (t === "direct") {
                                setReplyText("Hi Sneha, understood. I will follow up with you on Friday once your finance team has reviewed the proposal.");
                              } else if (t === "shorter") {
                                setReplyText("Hi Sneha, sounds great. Please take your time reviewing with finance. Shall I check back Friday, or clarify pricing sooner?");
                              } else {
                                setReplyText("Hi Sneha, sounds great. Please take your time reviewing the fleet proposal with your finance team.\nShall I check back with you on Friday, or would you like me to clarify any unit pricing or terms before then?");
                              }
                            }}
                            className={cn(
                              "px-2.5 py-0.5 rounded-[6px] capitalize transition-colors cursor-pointer",
                              selectedTone === (t === "formal" ? "standard" : t)
                                ? "bg-[#0B0D12] text-white font-medium"
                                : "text-[#666C78] hover:text-[#12141A] bg-white border border-[#EDE8E0]"
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setCustomiseOpen(false)}
                        className="text-[#666C78] hover:text-[#12141A] text-[12px] cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  )}

                  {/* Textarea */}
                  <div className="p-4 pt-3.5 pb-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                      placeholder={composerTab === "note" ? "Add an internal note visible only to your team members..." : "Write a WhatsApp reply..."}
                      className="w-full text-[14.5px] font-normal text-[#12141A] leading-relaxed resize-y min-h-[88px] border-none focus:outline-none bg-transparent placeholder:text-[#9AA0AC]"
                    />
                  </div>

                  {/* Attached Files List */}
                  {attachedFiles.length > 0 && (
                    <div className="px-4 pb-2.5 flex items-center gap-2 flex-wrap">
                      {attachedFiles.map((f) => (
                        <span
                          key={f}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#FAF9F5] border border-[#EDE8E0] text-[12px] font-medium text-[#12141A]"
                        >
                          <Paperclip className="h-3 w-3 text-[#FF5A1F]" />
                          <span>{f}</span>
                          <button
                            type="button"
                            onClick={() => setAttachedFiles([])}
                            className="hover:text-[#FF5A1F] ml-0.5 cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bottom Toolbar strip inside composer */}
                  <div className="border-t border-[#F0EBE3] px-3 py-2 bg-[#FAF9F6]/60 flex items-center justify-between gap-1.5 overflow-hidden">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleAttachment}
                        className="h-7.5 px-2 rounded-[7px] border border-[#EDE8E0] bg-white text-[11.5px] font-medium text-[#454B57] hover:text-[#12141A] hover:bg-[#F7F5F0] inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer shrink-0"
                      >
                        <Paperclip className="h-3 w-3 text-[#666C78]" />
                        <span>Attachment</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleScheduleFollowup}
                        className="h-7.5 px-2 rounded-[7px] border border-[#EDE8E0] bg-white text-[11.5px] font-medium text-[#454B57] hover:text-[#12141A] hover:bg-[#F7F5F0] inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer shrink-0"
                      >
                        <Calendar className="h-3 w-3 text-[#666C78]" />
                        <span>Schedule follow-up</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleInsertDoc}
                        className="h-7.5 px-2 rounded-[7px] border border-[#EDE8E0] bg-white text-[11.5px] font-medium text-[#454B57] hover:text-[#12141A] hover:bg-[#F7F5F0] inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer shrink-0"
                      >
                        <FileText className="h-3 w-3 text-[#666C78]" />
                        <span>Insert document</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <label className="inline-flex items-center gap-1 cursor-pointer select-none text-[11.5px] text-[#454B57] font-medium">
                        <input
                          type="checkbox"
                          checked={createTaskChecked}
                          onChange={(e) => setCreateTaskChecked(e.target.checked)}
                          className="h-3.5 w-3.5 rounded-[3.5px] border-[#CBD0D9] text-[#FF5A1F] focus:ring-[#FF5A1F] accent-[#FF5A1F] cursor-pointer"
                        />
                        <span>Create task</span>
                      </label>

                      {/* Due date chip with dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setDueDateDropdownOpen(!dueDateDropdownOpen)}
                          className="h-7.5 px-2 rounded-[7px] border border-[#EDE8E0] bg-[#F7F5F0] text-[11.5px] font-medium text-[#12141A] inline-flex items-center gap-1 hover:bg-[#EFECE5] shadow-2xs transition-colors cursor-pointer shrink-0"
                        >
                          <Calendar className="h-3 w-3 text-[#666C78]" />
                          <span>{dueDateText}</span>
                          <ChevronDown className="h-3 w-3 text-[#666C78] shrink-0" />
                        </button>
                        {dueDateDropdownOpen && (
                          <div className="absolute right-0 bottom-9 w-44 rounded-[10px] bg-white border border-[#EDE8E0] shadow-lg p-1 z-20 space-y-0.5 animate-fade-rise">
                            {["Due Today, 5:00 PM", "Due Tomorrow, 10:00 AM", "Due Fri, 31 Oct", "Due Next Monday"].map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => {
                                  setDueDateText(d);
                                  setDueDateDropdownOpen(false);
                                  setCreateTaskChecked(true);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-[6px] text-[12px] text-[#12141A] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. BOTTOM ACTION BAR */}
                <div className="flex items-center justify-between pt-1 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    {/* Split Send Reply Button */}
                    <div className="relative inline-flex items-center shadow-[0_2px_8px_rgba(255,90,31,0.3)] rounded-[11px] overflow-visible">
                      <div className="inline-flex rounded-[11px] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleSendReplyAction("default")}
                          className="h-10 px-4 bg-gradient-to-b from-[#FF7A3D] to-[#FF5A1F] text-white font-medium text-[14px] inline-flex items-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
                        >
                          <Send className="h-4 w-4 fill-white text-white" />
                          <span>Send reply</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSendDropdownOpen(!sendDropdownOpen)}
                          className="h-10 px-2.5 bg-gradient-to-b from-[#FF7A3D] to-[#FF5A1F] text-white border-l border-white/25 hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center"
                          title="More send options"
                        >
                          <ChevronDown className="h-3.5 w-3.5 text-white" />
                        </button>
                      </div>

                      {sendDropdownOpen && (
                        <div className="absolute left-0 bottom-12 w-56 rounded-[12px] bg-white border border-[#EDE8E0] shadow-lg p-1.5 z-20 space-y-0.5 animate-fade-rise">
                          <button
                            type="button"
                            onClick={() => {
                              setSendDropdownOpen(false);
                              handleSendReplyAction("close");
                            }}
                            className="w-full text-left px-3 py-1.5 rounded-[8px] text-[13px] text-[#12141A] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
                          >
                            Send &amp; close thread
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSendDropdownOpen(false);
                              handleSendReplyAction("qualified");
                            }}
                            className="w-full text-left px-3 py-1.5 rounded-[8px] text-[13px] text-[#12141A] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
                          >
                            Send &amp; advance to Proposal
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSendDropdownOpen(false);
                              toast("Scheduled Send", { message: "Message queued for dispatch tomorrow at 9:00 AM.", type: "info" });
                              setActionCardDismissed(true);
                            }}
                            className="w-full text-left px-3 py-1.5 rounded-[8px] text-[13px] text-[#12141A] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
                          >
                            Schedule for 9:00 AM
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Save as template */}
                    <button
                      type="button"
                      onClick={handleSaveAsTemplate}
                      className="h-10 px-4 rounded-[11px] border border-[#EDE8E0] bg-white text-[#12141A] text-[13.5px] font-medium hover:bg-[#F9F8F6] inline-flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
                    >
                      <FileText className="h-4 w-4 text-[#666C78]" />
                      <span>Save as template</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Snooze with dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setSnoozeDropdownOpen(!snoozeDropdownOpen)}
                        className="h-10 px-3.5 rounded-[11px] border border-transparent hover:border-[#EDE8E0] text-[#12141A] hover:bg-[#FAF9F5] text-[13.5px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Clock className="h-4 w-4 text-[#666C78]" />
                        <span>Snooze</span>
                        <ChevronDown className="h-3.5 w-3.5 text-[#666C78]" />
                      </button>

                      {snoozeDropdownOpen && (
                        <div className="absolute right-0 bottom-12 w-52 rounded-[12px] bg-white border border-[#EDE8E0] shadow-lg p-1.5 z-20 space-y-0.5 animate-fade-rise">
                          <button
                            type="button"
                            onClick={() => handleSnoozeAction("2 hours")}
                            className="w-full text-left px-3 py-1.5 rounded-[8px] text-[13px] text-[#12141A] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
                          >
                            For 2 hours
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSnoozeAction("Tomorrow 10:00 AM")}
                            className="w-full text-left px-3 py-1.5 rounded-[8px] text-[13px] text-[#12141A] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
                          >
                            Tomorrow, 10:00 AM
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSnoozeAction("Friday 10:00 AM")}
                            className="w-full text-left px-3 py-1.5 rounded-[8px] text-[13px] text-[#12141A] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
                          >
                            Friday, 10:00 AM
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSnoozeAction("Next week Monday")}
                            className="w-full text-left px-3 py-1.5 rounded-[8px] text-[13px] text-[#12141A] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
                          >
                            Next week Monday
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Mark as done */}
                    <button
                      type="button"
                      onClick={handleMarkAsDone}
                      className="h-10 px-4 rounded-[11px] border border-[#12B886]/40 bg-[#FAFDFC] text-[#0A7A53] hover:bg-[#E4F7EF] text-[13.5px] font-medium inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Check className="h-4 w-4 stroke-[2.5]" />
                      <span>Mark as done</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sales Pipeline Card with Drag & Drop Kanban */}
          <div className="card-ref p-6 space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-[#EDE8E0]">
              <div>
                <h3 className="text-[17px] font-semibold text-[#12141A]">
                  Sales Pipeline
                </h3>
                <p className="text-[13px] text-[#666C78]">
                  {activeLeads.length} active opportunities in motion across commercial stages
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Single Common Add Deal button */}
                <Button
                  variant="primary"
                  onClick={() => setCreateModalOpen(true)}
                  className="h-8 px-3 rounded-[9px] text-[13px] font-medium flex items-center gap-1.5 bg-gradient-to-b from-[#FF7A3D] to-[#FF5A1F] text-white shadow-2xs cursor-pointer hover:opacity-95"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Add deal</span>
                </Button>

                <Link
                  href={`/app/${orgSlug}/leads`}
                  className="text-[13px] font-medium text-[#FF5A1F] hover:underline flex items-center gap-1"
                >
                  <span>View pipeline</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Kanban Columns Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 pt-1">
              {pipelineColumns.map((col) => {
                const colLeads = leads.filter((l) => l.stage === col.stage);
                const colTotal = colLeads.reduce((s, l) => s + (l.estimated_value || 0), 0);
                const isOver = dragOverStage === col.stage;

                return (
                  <div
                    key={col.stage}
                    onDragOver={(e) => handleDragOver(e, col.stage)}
                    onDrop={() => handleDrop(col.stage)}
                    className={cn(
                      "rounded-[14px] bg-[#FAF9F5] border p-3 flex flex-col transition-all duration-140",
                      isOver ? "border-[#FF5A1F] bg-[#FFF1EA]/50" : "border-[#EDE8E0]"
                    )}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#EDE8E0]/70">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("px-2 py-0.5 rounded-[6px] text-[11px] font-semibold", col.tint, col.text)}>
                          {col.label}
                        </span>
                        <span className="text-[12px] font-medium text-[#666C78] tabular-nums">
                          ({colLeads.length})
                        </span>
                      </div>
                      <span className="text-[12px] font-semibold text-[#12141A] tabular-nums">
                        {formatCompactINR(colTotal)}
                      </span>
                    </div>

                    {/* Column Cards */}
                    <div className="space-y-2.5 flex-1 min-h-[140px]">
                      {colLeads.length === 0 ? (
                        <div className="h-full flex items-center justify-center p-4 border border-dashed border-[#DCD6CC] rounded-[10px] text-[12px] text-[#A3A9B6] text-center">
                          Drop deal here
                        </div>
                      ) : (
                        colLeads.map((lead) => {
                          const avColors = getAvatarColor(lead.contact_name || lead.title);

                          return (
                            <div
                              key={lead.id}
                              draggable
                              onDragStart={() => handleDragStart(lead.id)}
                              className={cn(
                                "group p-3 rounded-[12px] bg-white border border-[#EDE8E0] shadow-2xs space-y-2 cursor-grab active:cursor-grabbing hover:-translate-y-[2px] transition-transform duration-140 relative overflow-hidden",
                                draggedLeadId === lead.id && "opacity-40"
                              )}
                            >
                              {/* Left Colored Stage Border */}
                              <span className={cn("absolute left-0 top-0 bottom-0 w-1", col.barColor)} />

                              <div className="pl-1.5">
                                <span className="text-[13px] font-medium text-[#12141A] block leading-tight truncate">
                                  {lead.title}
                                </span>
                                <span className="text-[12px] text-[#666C78] block truncate mt-0.5">
                                  {lead.contact_name || "Prospective Client"}
                                </span>
                              </div>

                              <div className="pl-1.5 flex items-center justify-between pt-1 border-t border-[#EDE8E0]/60">
                                <span className="text-[13px] font-semibold text-[#FF5A1F] tabular-nums">
                                  {formatINR(lead.estimated_value || 0)}
                                </span>
                                <div
                                  className={cn(
                                    "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold",
                                    avColors.bg,
                                    avColors.text
                                  )}
                                >
                                  {getInitials(lead.contact_name || "RS")}
                                </div>
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
          </div>

          {/* Recent Conversations Card & New Leads Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Conversations */}
            <div className="card-ref p-6 space-y-4">
              <div className="pb-2 border-b border-[#EDE8E0] space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[16px] font-semibold text-[#12141A]">
                    Recent Conversations
                  </h4>
                  <Link
                    href={`/app/${orgSlug}/inbox`}
                    className="text-[12px] font-medium text-[#FF5A1F] hover:underline flex items-center gap-1"
                  >
                    <span>View inbox</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                {/* Lifecycle Status Classification Tabs (4-column grid, zero wrapping) */}
                <div className="grid grid-cols-4 gap-1 bg-[#EDE8E0] p-0.5 rounded-[9px] w-full">
                  {(
                    [
                      { id: "all", label: "All", count: conversationCounts.all },
                      { id: "ongoing", label: "Ongoing", count: conversationCounts.ongoing },
                      { id: "open", label: "Open", count: conversationCounts.open },
                      { id: "closed", label: "Closed", count: conversationCounts.closed },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setConversationFilter(tab.id)}
                      className={cn(
                        "py-1 rounded-[7px] text-[11px] font-medium transition-all cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap text-center",
                        conversationFilter === tab.id
                          ? "bg-[#0B0D12] text-white shadow-xs font-semibold"
                          : "text-[#666C78] hover:text-[#12141A]"
                      )}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={cn(
                          "text-[10px] tabular-nums",
                          conversationFilter === tab.id ? "text-white/80" : "text-[#8A909D]"
                        )}
                      >
                        ({tab.count})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredConversations.map((conv) => {
                  const av = getAvatarColor(conv.contact_name || conv.contact_phone);
                  const isClosed = conv.status === "resolved" || conv.status === "closed";
                  const isOpen = conv.unread_count > 0 || conv.status === "open";

                  return (
                    <Link
                      key={conv.id}
                      href={`/app/${orgSlug}/inbox`}
                      className="p-3 rounded-[12px] bg-[#FAF9F5] border border-[#EDE8E0]/70 flex items-center justify-between hover:bg-white hover:border-[#EDE8E0] transition-colors block"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden min-w-0 pr-2">
                        <div className={cn("h-8 w-8 rounded-[8px] flex items-center justify-center font-semibold text-[12px] shrink-0", av.bg, av.text)}>
                          {getInitials(conv.contact_name || "WA")}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-medium text-[#12141A] truncate block">
                              {conv.contact_name || conv.contact_phone}
                            </span>
                            {isClosed ? (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] shrink-0">
                                Closed
                              </span>
                            ) : isOpen ? (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-[#FFF8E6] text-[#B45309] border border-[#FDE68A] shrink-0">
                                Open
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-[#EBF2FE] text-[#1D4ED8] border border-[#BFDBFE] shrink-0">
                                Ongoing
                              </span>
                            )}
                          </div>
                          <span className="text-[12px] text-[#666C78] block truncate">
                            {conv.last_message_text || "Active customer inquiry"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-1">
                        {conv.unread_count > 0 ? (
                          <span className="inline-flex items-center justify-center h-5 w-5 rounded-[6px] bg-[#FF5A1F] text-white text-[11px] font-semibold tabular-nums shadow-2xs">
                            {conv.unread_count}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#A3A9B6]">Read</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* New Leads Card */}
            <div className="card-ref p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#EDE8E0]">
                <h4 className="text-[16px] font-semibold text-[#12141A]">
                  New Opportunities
                </h4>
                <Link
                  href={`/app/${orgSlug}/leads`}
                  className="text-[12px] font-medium text-[#FF5A1F] hover:underline"
                >
                  View all →
                </Link>
              </div>

              <div className="space-y-3">
                {leads.slice(0, 3).map((ld) => {
                  const av = getAvatarColor(ld.contact_name || ld.title);

                  return (
                    <div
                      key={ld.id}
                      className="p-3 rounded-[12px] bg-[#FAF9F5] border border-[#EDE8E0]/70 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className={cn("h-8 w-8 rounded-[8px] flex items-center justify-center font-semibold text-[12px] shrink-0", av.bg, av.text)}>
                          {getInitials(ld.contact_name || "LD")}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[13px] font-medium text-[#12141A] block truncate">
                            {ld.title}
                          </span>
                          <span className="text-[12px] text-[#666C78] block truncate">
                            {ld.contact_name} • {ld.source}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <span className="text-[13px] font-semibold text-[#FF5A1F] tabular-nums block">
                          {formatINR(ld.estimated_value || 0)}
                        </span>
                        <span className="text-[11px] text-[#0A7A53] font-medium">
                          {STAGE_CONFIG[ld.stage]?.label || ld.stage}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* RIGHT 4 COLUMNS: Dark Open Pipeline + Today's Plan + AI Assistant */}
        {/* ================================================================== */}
        <div className="lg:col-span-4 space-y-6">
          {/* Dark Hero Card: Open Pipeline */}
          <div className="card-hero-dark p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A3A9B6]">
                OPEN PIPELINE
              </span>
              <span className="text-[12px] font-medium text-[#A3A9B6] bg-white/[0.08] px-2.5 py-0.5 rounded-[6px] border border-white/[0.1]">
                This Month
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-[34px] font-semibold text-white tabular-nums tracking-tight">
                {formatINR(pipelineValue)}
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[12px] font-medium bg-[#E4F7EF]/20 text-[#12B886] border border-[#12B886]/30">
                ↑ 18.4%
              </span>
            </div>

            <p className="text-[13px] text-[#A3A9B6] font-normal">
              {activeLeads.length} active opportunities in motion
            </p>

            {/* Segmented Stage Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="h-2 w-full bg-white/[0.1] rounded-full overflow-hidden flex">
                <div className="h-full bg-[#3D5AFE]" style={{ width: "25%" }} />
                <div className="h-full bg-[#1FA2E8]" style={{ width: "20%" }} />
                <div className="h-full bg-[#F5A524]" style={{ width: "35%" }} />
                <div className="h-full bg-[#12B886]" style={{ width: "20%" }} />
              </div>

              {/* Stage legend */}
              <div className="grid grid-cols-2 gap-2 text-[12px] pt-1 text-[#A3A9B6]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#3D5AFE]" />
                  <span>Inbound: ₹65,000</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#F5A524]" />
                  <span>Proposal: 2 deals</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#1FA2E8]" />
                  <span>Qualified: ₹85,000</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#12B886]" />
                  <span>Won: ₹2,40,000</span>
                </div>
              </div>
            </div>

            {/* Orange Area SVG Chart */}
            <div className="pt-2">
              <svg className="w-full h-20" viewBox="0 0 300 80" fill="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF5A1F" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#FF5A1F" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 65 Q 40 50, 75 55 T 150 40 T 225 25 T 300 10 L 300 80 L 0 80 Z"
                  fill="url(#chartGrad)"
                />
                <path
                  d="M0 65 Q 40 50, 75 55 T 150 40 T 225 25 T 300 10"
                  stroke="#FF5A1F"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="225" cy="25" r="3.5" fill="#FF5A1F" />
                <circle cx="225" cy="25" r="7" stroke="#FF5A1F" strokeWidth="1" opacity="0.4" />
              </svg>
            </div>

            <div className="pt-2 border-t border-white/[0.1] flex items-center justify-between text-[12px] text-[#A3A9B6]">
              <span>Win this period: <strong className="text-white font-medium">₹2,40,000</strong></span>
              <span className="text-[#12B886] font-medium">50% conversion rate</span>
            </div>
          </div>

          {/* Today's Plan */}
          <div className="card-ref p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EDE8E0]">
              <div className="flex items-center gap-2">
                <h4 className="text-[16px] font-semibold text-[#12141A]">
                  Today&apos;s Plan
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FFF3D6] text-[#8F5300]">
                  {todayTasks.length + overdueTasks.length} items
                </span>
              </div>

              {lastCompletedTask && (
                <button
                  type="button"
                  onClick={handleUndoTask}
                  className="text-[12px] text-[#FF5A1F] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Undo2 className="h-3 w-3" />
                  <span>Undo</span>
                </button>
              )}
            </div>

            {/* Timeline tasks */}
            <div className="space-y-3">
              {[...overdueTasks, ...todayTasks].map((t) => {
                const isOverdue = new Date(t.due_date) < startOfToday;

                return (
                  <div
                    key={t.id}
                    className="p-3 rounded-[12px] bg-[#FAF9F5] border border-[#EDE8E0]/70 flex items-start gap-2.5"
                  >
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleTask(t)}
                      className={cn(
                        "mt-0.5 h-4 w-4 rounded-[4px] border flex items-center justify-center transition-colors cursor-pointer shrink-0",
                        t.status === "completed"
                          ? "bg-[#12B886] border-[#12B886] text-white"
                          : "border-[#DCD6CC] bg-white hover:border-[#FF5A1F]"
                      )}
                    >
                      {t.status === "completed" && <Check className="h-3 w-3 stroke-[2.5]" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium text-[#12141A] truncate block">
                          {t.title}
                        </span>
                        {isOverdue && (
                          <span className="text-[10px] uppercase font-semibold text-[#B42336] bg-[#FFE9EA] px-1.5 py-0.5 rounded">
                            Overdue
                          </span>
                        )}
                      </div>
                      <span className="text-[12px] text-[#666C78] block truncate">
                        {t.contact_name ? `with ${t.contact_name}` : t.description}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Assistant Card */}
          <div className="card-ref p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EDE8E0]">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-[8px] bg-[#F0EAFF] text-[#7C4DFF] flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-[#12141A]">
                    AI Assistant
                  </h4>
                  <span className="text-[11px] text-[#666C78]">Real-time recommendations</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-semibold bg-[#FF5A1F] text-white">
                AI
              </span>
            </div>

            <div className="space-y-2.5 text-[13px]">
              <div className="p-3 rounded-[12px] bg-[#FAF9F5] border border-[#EDE8E0] space-y-1">
                <span className="font-medium text-[#12141A] block">
                  3 inquiries near 24h SLA deadline
                </span>
                <p className="text-[12px] text-[#666C78]">
                  Aarav Patel &amp; Rohan Mehta awaiting response.
                </p>
                <Link
                  href={`/app/${orgSlug}/inbox`}
                  className="text-[12px] font-medium text-[#FF5A1F] hover:underline inline-block pt-1"
                >
                  Open WhatsApp Inbox →
                </Link>
              </div>

              <div className="p-3 rounded-[12px] bg-[#FAF9F5] border border-[#EDE8E0] space-y-1">
                <span className="font-medium text-[#12141A] block">
                  Commercial Follow-up Recommended
                </span>
                <p className="text-[12px] text-[#666C78]">
                  Fleet Management Solution proposal viewed 2h ago.
                </p>
                <button
                  type="button"
                  onClick={handleSendPriorityReply}
                  className="text-[12px] font-medium text-[#FF5A1F] hover:underline inline-block pt-1 cursor-pointer"
                >
                  Send Suggested Follow-up →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. BOTTOM ROW (Campaign Performance & Team Quota Performance)        */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Campaign Performance (6 cols) */}
        <div className="lg:col-span-6 card-ref p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#EDE8E0] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-[16px] font-semibold text-[#12141A]">
                  Campaign Performance
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FFF4ED] text-[#FF5A1F] border border-[#FFDEC9]">
                  Live Meta API
                </span>
              </div>
              <p className="text-[12px] text-[#666C78]">WhatsApp broadcast engagement &amp; delivery funnel</p>
            </div>
            <Link
              href={`/app/${orgSlug}/campaigns`}
              className="text-[12px] font-medium text-[#FF5A1F] hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* 4 Metric Chips with icons & deltas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
            <div className="p-3 rounded-[12px] bg-[#FAF9F5] border border-[#EDE8E0] flex flex-col justify-between">
              <span className="text-[11.5px] font-medium text-[#666C78]">Dispatched</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-[18px] font-semibold text-[#12141A] tabular-nums">2,450</span>
                <span className="text-[10px] text-[#666C78]">2 broadcasts</span>
              </div>
            </div>
            <div className="p-3 rounded-[12px] bg-[#FAF9F5] border border-[#EDE8E0] flex flex-col justify-between">
              <span className="text-[11.5px] font-medium text-[#666C78]">Delivered</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-[18px] font-semibold text-[#0A7A53] tabular-nums">99.8%</span>
                <span className="text-[10.5px] font-medium text-[#0A7A53] bg-[#E4F7EF] px-1 rounded">↑ 0.8%</span>
              </div>
            </div>
            <div className="p-3 rounded-[12px] bg-[#FAF9F5] border border-[#EDE8E0] flex flex-col justify-between">
              <span className="text-[11.5px] font-medium text-[#666C78]">Read Rate</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-[18px] font-semibold text-[#FF5A1F] tabular-nums">64.5%</span>
                <span className="text-[10.5px] font-medium text-[#FF5A1F] bg-[#FFF4ED] px-1 rounded">High</span>
              </div>
            </div>
            <div className="p-3 rounded-[12px] bg-[#FAF9F5] border border-[#EDE8E0] flex flex-col justify-between">
              <span className="text-[11.5px] font-medium text-[#666C78]">Est. Spend</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-[18px] font-semibold text-[#12141A] tabular-nums">₹842</span>
                <span className="text-[10px] text-[#666C78]">₹0.34/msg</span>
              </div>
            </div>
          </div>

          {/* High-Polish Gradient Area Chart with Grid & Highlight Badge */}
          <div className="pt-1">
            <div className="relative">
              <svg className="w-full h-32" viewBox="0 0 500 120" fill="none">
                <defs>
                  <linearGradient id="campGradPolish" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF5A1F" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#FF5A1F" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Subtle horizontal dashed grid lines */}
                <line x1="0" y1="30" x2="500" y2="30" stroke="#EDE8E0" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="0" y1="65" x2="500" y2="65" stroke="#EDE8E0" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="#EDE8E0" strokeDasharray="3 3" strokeWidth="1" />

                {/* Area fill */}
                <path
                  d="M 0 95 C 50 95, 90 70, 140 75 C 190 80, 230 45, 290 52 C 340 59, 380 25, 430 30 C 470 35, 485 20, 500 15 L 500 120 L 0 120 Z"
                  fill="url(#campGradPolish)"
                />

                {/* Smooth stroke curve */}
                <path
                  d="M 0 95 C 50 95, 90 70, 140 75 C 190 80, 230 45, 290 52 C 340 59, 380 25, 430 30 C 470 35, 485 20, 500 15"
                  stroke="#FF5A1F"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Highlight Point on Oct 24 peak */}
                <circle cx="430" cy="30" r="7" stroke="#FF5A1F" strokeWidth="1.5" opacity="0.35" />
                <circle cx="430" cy="30" r="4" fill="#FF5A1F" stroke="#FFFFFF" strokeWidth="1.5" />

                {/* Floating tooltip badge */}
                <g transform="translate(365, 4)">
                  <rect width="120" height="20" rx="6" fill="#0B0D12" />
                  <text x="60" y="14" fill="#FFFFFF" fontSize="10" fontWeight="500" textAnchor="middle">
                    Oct 24 • 842 reads (68%)
                  </text>
                </g>
              </svg>

              {/* X-axis date labels */}
              <div className="flex items-center justify-between text-[11px] text-[#8A909D] font-medium pt-1 px-1">
                <span>Oct 1</span>
                <span>Oct 8</span>
                <span>Oct 15</span>
                <span>Oct 22</span>
                <span>Oct 29</span>
              </div>
            </div>
          </div>
        </div>

        {/* Team Performance (6 cols) */}
        <div className="lg:col-span-6 card-ref p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#EDE8E0] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-[16px] font-semibold text-[#12141A]">
                  Team Performance &amp; Quota
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EAF2FF] text-[#0D62D9] border border-[#BFD7FE]">
                  3 Reps Active
                </span>
              </div>
              <p className="text-[12px] text-[#666C78]">Revenue generated, closed deals, and monthly quota pacing</p>
            </div>
            <Link
              href={`/app/${orgSlug}/team`}
              className="text-[12px] font-medium text-[#FF5A1F] hover:underline flex items-center gap-1"
            >
              <span>Team roster</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-4">
            {[
              {
                name: "Praveen",
                role: "Founder & Sales Lead",
                deals: "3 closed • 1 in proposal",
                value: 310000,
                target: 400000,
                percent: 78,
                winRate: "75%",
                avatar: "bg-[#FFEFEA] text-[#FF5A1F] border border-[#FFDFC4]",
              },
              {
                name: "Suresh Raina",
                role: "Account Executive",
                deals: "1 closed • 2 qualified",
                value: 150000,
                target: 250000,
                percent: 60,
                winRate: "50%",
                avatar: "bg-[#EAEEFF] text-[#2A3DB5] border border-[#C7D2FE]",
              },
              {
                name: "Rohan Mehta",
                role: "Growth Specialist",
                deals: "1 closed • 1 inbound",
                value: 85000,
                target: 150000,
                percent: 57,
                winRate: "50%",
                avatar: "bg-[#E4F7EF] text-[#0A7A53] border border-[#BDECD7]",
              },
            ].map((member) => (
              <div key={member.name} className="p-3.5 rounded-[13px] bg-[#FAF9F5] border border-[#EDE8E0] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn("h-8.5 w-8.5 rounded-full flex items-center justify-center font-semibold text-[12px] shrink-0", member.avatar)}>
                      {getInitials(member.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13.5px] font-semibold text-[#12141A] truncate">{member.name}</span>
                        <span className="text-[11px] text-[#666C78]">({member.role})</span>
                      </div>
                      <span className="text-[11.5px] text-[#666C78] block truncate">{member.deals}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[14px] font-semibold text-[#FF5A1F] tabular-nums block">
                      {formatINR(member.value)}
                    </span>
                    <span className="text-[11px] text-[#666C78]">
                      {member.percent}% of {formatCompactINR(member.target)}
                    </span>
                  </div>
                </div>

                {/* Dual-layer quota progress bar */}
                <div className="space-y-1">
                  <div className="h-2 w-full bg-[#EDE8E0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF7A3D] to-[#FF5A1F] rounded-full transition-all duration-300"
                      style={{ width: `${member.percent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#666C78]">
                    <span>Win rate: <strong className="text-[#0A7A53] font-medium">{member.winRate}</strong></span>
                    <span>Pacing: <strong className="text-[#12141A] font-medium">On track</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Aggregate Team Footer Banner */}
          <div className="pt-1 border-t border-[#EDE8E0] flex items-center justify-between text-[12px] text-[#666C78] flex-wrap gap-2">
            <span>Total Team Volume: <strong className="text-[#12141A] font-semibold">₹5,45,000</strong></span>
            <span>Avg Deal Velocity: <strong className="text-[#12141A] font-semibold">3.8 days</strong></span>
          </div>
        </div>
      </div>

      {/* New Opportunity Modal */}
      <NewOpportunityModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        orgSlug={orgSlug}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
