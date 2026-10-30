"use client";

import React, { useState, useMemo, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useTenant } from "@/lib/organizations/tenant-context";
import { whatsappStore } from "@/lib/whatsapp/whatsapp-store";
import { crmStore } from "@/lib/crm/crm-store";
import { teamStore } from "@/lib/team/team-store";
import {
  WhatsAppConversation,
  WhatsAppMessage,
  ConversationStatus,
} from "@/lib/whatsapp/types";
import { MOCK_TEMPLATES } from "@/lib/whatsapp/mock-provider";
import { LeadStage, TaskPriority, Task } from "@/types/crm";
import { aiService } from "@/lib/ai/ai-service";
import { ReplySuggestionResult } from "@/lib/ai/types";
import { ForwardConversationModal } from "@/components/inbox/forward-conversation-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { Drawer } from "@/components/ui/drawer";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useMounted } from "@/lib/use-mounted";
import { useToast } from "@/components/ui/toast-context";
import { cn, formatINR, getAvatarColor, getInitials } from "@/lib/utils";
import {
  MessageSquare,
  Send,
  Check,
  CheckCheck,
  Clock,
  User,
  Phone,
  Building2,
  Sparkles,
  Search,
  Filter,
  Plus,
  Calendar,
  AlertCircle,
  Tag,
  ChevronRight,
  CheckSquare,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
  X,
  FileText,
  Lock,
  ArrowRightLeft,
} from "lucide-react";
import Link from "next/link";

function InboxContent() {
  const { currentOrg, userRole } = useTenant();
  const orgSlug = currentOrg.slug;
  const mounted = useMounted();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const convParam = searchParams.get("c");

  const [refreshKey, setRefreshKey] = useState(0);
  const [activeConversationId, setActiveConversationId] = useState<string>("conv-102");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "mine" | "billing" | "unassigned" | "unread" | "closed">("all");
  const [contextPaneOpen, setContextPaneOpen] = useState(true);

  // Forward / Reassignment Modal
  const [forwardModalOpen, setForwardModalOpen] = useState(false);

  // Composer mode: "whatsapp" (Client outbound) | "note" (Internal team note)
  const [composerMode, setComposerMode] = useState<"whatsapp" | "note">("whatsapp");
  const [messageInput, setMessageInput] = useState("");
  const [internalNoteInput, setInternalNoteInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);

  // CRM Modals
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [newLeadTitle, setNewLeadTitle] = useState("");
  const [newLeadValue, setNewLeadValue] = useState("60000");
  const [newLeadStage, setNewLeadStage] = useState<LeadStage>("new");

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("WhatsApp Customer Follow-up");
  const [newTaskDate, setNewTaskDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("medium");

  // AI Copilot state
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<ReplySuggestionResult | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Team members list
  const teamMembers = useMemo(() => {
    return teamStore.getTeamMembers(orgSlug);
  }, [orgSlug, refreshKey]);

  // Load conversations from store
  const conversations = useMemo(() => {
    return whatsappStore.getConversations(orgSlug);
  }, [orgSlug, refreshKey]);

  // Active Conversation
  const activeConversation = useMemo(() => {
    return (
      conversations.find((c) => c.id === activeConversationId) ||
      conversations[0] ||
      null
    );
  }, [conversations, activeConversationId]);

  // Messages in active conversation
  const messages = useMemo(() => {
    if (!activeConversation) return [];
    return whatsappStore.getMessages(activeConversation.id);
  }, [activeConversation, refreshKey]);

  // Linked CRM Data for active contact
  const linkedContact = useMemo(() => {
    if (!activeConversation) return null;
    return crmStore.getContactById(orgSlug, activeConversation.contact_id);
  }, [orgSlug, activeConversation, refreshKey]);

  const linkedLead = useMemo(() => {
    if (!activeConversation) return null;
    const leads = crmStore.getLeads(orgSlug);
    return (
      leads.find((l) => l.contact_id === activeConversation.contact_id) ||
      leads.find((l) => l.id === activeConversation.lead_id) ||
      null
    );
  }, [orgSlug, activeConversation, refreshKey]);

  const linkedTasks = useMemo(() => {
    if (!activeConversation) return [];
    return crmStore
      .getTasks(orgSlug)
      .filter((t) => t.contact_id === activeConversation.contact_id);
  }, [orgSlug, activeConversation, refreshKey]);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sync convParam from URL
  useEffect(() => {
    if (convParam) {
      setActiveConversationId(convParam);
    }
  }, [convParam]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      // Tab filter
      if (filterTab === "unread" && c.unread_count === 0) return false;
      if (filterTab === "unassigned" && c.assigned_to_user_id) return false;
      if (filterTab === "closed" && c.status !== "resolved" && c.status !== "closed") return false;
      if (filterTab === "mine" && userRole === "staff" && c.assigned_to_user_id !== "user-staff") return false;
      if (
        filterTab === "billing" &&
        c.assigned_department !== "billing" &&
        !c.assigned_to_name?.toLowerCase().includes("billing") &&
        c.assigned_to_user_id !== "user-102"
      ) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = c.contact_name?.toLowerCase().includes(q);
        const phoneMatch = c.contact_phone?.includes(q);
        const msgMatch = c.last_message_text?.toLowerCase().includes(q);
        return nameMatch || phoneMatch || msgMatch;
      }

      return true;
    });
  }, [conversations, filterTab, searchQuery, userRole]);

  // Group messages by day with accurate date separator
  const messageGroups = useMemo(() => {
    const groups: { dateLabel: string; msgs: WhatsAppMessage[] }[] = [];
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    messages.forEach((msg) => {
      const msgDate = new Date(msg.created_at);
      const dateString = msgDate.toDateString();

      let dateLabel = msgDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      if (dateString === today) dateLabel = "Today";
      else if (dateString === yesterday) dateLabel = "Yesterday";

      const existingGroup = groups.find((g) => g.dateLabel === dateLabel);
      if (existingGroup) {
        existingGroup.msgs.push(msg);
      } else {
        groups.push({ dateLabel, msgs: [msg] });
      }
    });

    return groups;
  }, [messages]);

  // Handler: Send Outbound Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !activeConversation || isSending) return;

    setIsSending(true);
    try {
      const res = await whatsappStore.sendOutboundMessage(orgSlug, activeConversation.id, {
        toPhone: activeConversation.contact_phone,
        type: "text",
        text: messageInput.trim(),
        staffName: "Praveen",
        staffUserId: "user-current",
      });

      if (res.success) {
        setMessageInput("");
        setRefreshKey((k) => k + 1);
        toast("Message sent via Meta Cloud API", { type: "success" });
      } else {
        toast("Failed to deliver message", { type: "error" });
      }
    } catch {
      toast("Failed to deliver message", { type: "error" });
    } finally {
      setIsSending(false);
    }
  };

  // Handler: Send Internal Team Note
  const handleSendInternalNote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!internalNoteInput.trim() || !activeConversation || isSending) return;

    setIsSending(true);
    try {
      whatsappStore.addInternalNote(
        orgSlug,
        activeConversation.id,
        internalNoteInput.trim(),
        "Praveen",
        "user-current"
      );

      setInternalNoteInput("");
      setRefreshKey((k) => k + 1);
      toast("Internal note saved", { type: "success" });
    } catch {
      toast("Failed to record note", { type: "error" });
    } finally {
      setIsSending(false);
    }
  };

  // Handler: Generate AI Grounded Suggestion
  const handleGenerateAiReply = async () => {
    if (!activeConversation) return;
    setAiGenerating(true);
    try {
      const activeMsgs = whatsappStore.getMessages(activeConversation.id);
      const lastCustMsg =
        [...activeMsgs].reverse().find((m) => m.sender_type === "customer")?.body ||
        activeConversation.last_message_text ||
        "Inquiry";

      const res = await aiService.generateReplySuggestion({
        orgSlug,
        customerName: activeConversation.contact_name,
        incomingMessage: lastCustMsg,
        recentMessages: activeMsgs.slice(-4).map((m) => ({
          sender: m.sender_type,
          text: m.body,
        })),
      });

      if (res && res.suggestionText) {
        setAiSuggestion(res);
        setMessageInput(res.suggestionText);
        toast("AI draft inserted into composer", { type: "info" });
      }
    } catch {
      toast("AI suggestion unavailable in offline preview", { type: "info" });
    } finally {
      setAiGenerating(false);
    }
  };

  // Handler: Create Opportunity from Thread
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation || !newLeadTitle.trim()) return;

    crmStore.createLead(orgSlug, {
      title: newLeadTitle,
      estimated_value: parseFloat(newLeadValue) || 50000,
      currency: "INR",
      stage: newLeadStage,
      contact_id: activeConversation.contact_id,
      contact_name: activeConversation.contact_name,
      contact_phone: activeConversation.contact_phone,
      source: "WhatsApp Shared Inbox",
    });

    setLeadModalOpen(false);
    setRefreshKey((k) => k + 1);
    toast("Sales deal linked to customer", { type: "success" });
  };

  // Handler: Create Task from Thread
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation || !newTaskTitle.trim()) return;

    crmStore.createTask(orgSlug, {
      title: newTaskTitle,
      contact_id: activeConversation.contact_id,
      contact_name: activeConversation.contact_name,
      due_date: newTaskDate,
      priority: newTaskPriority,
      status: "todo",
    });

    setTaskModalOpen(false);
    setRefreshKey((k) => k + 1);
    toast("Follow-up task created", { type: "success" });
  };

  // Handler: Forward Conversation & Department Handoff
  const handleForwardConversation = (
    assignee: { userId: string | null; name: string | null; department?: string | null },
    note: string
  ) => {
    if (!activeConversation) return;

    whatsappStore.assignConversation(
      orgSlug,
      activeConversation.id,
      assignee,
      "Praveen (Sales Lead)",
      note
    );

    setRefreshKey((k) => k + 1);
    const deptLabel = assignee.department
      ? ` (${assignee.department.charAt(0).toUpperCase() + assignee.department.slice(1)})`
      : "";
    toast(
      assignee.name
        ? `Forwarded to ${assignee.name}${deptLabel}`
        : "Conversation unassigned",
      {
        type: "success",
        message: note ? "Handoff note posted in chat thread." : undefined,
      }
    );
  };

  return (
    <div className="flex h-[calc(100vh-100px)] -m-4 sm:-m-6 md:-m-10 overflow-hidden bg-[#F7F5F0] select-none animate-page-enter">
      {/* ========================================================================= */}
      {/* 1. LEFT PANE: CONVERSATION LIST (ON CANVAS, NO WHITE CONTAINER)            */}
      {/* ========================================================================= */}
      <div className="w-[340px] shrink-0 border-r border-[#EDE8E0] flex flex-col bg-transparent">
        {/* Search Header */}
        <div className="p-3.5 border-b border-[#EDE8E0]">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-[#666C78]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="h-9 w-full rounded-[12px] border border-[#EDE8E0] bg-white pl-9 pr-3 text-[13px] text-[#12141A] placeholder:text-[#666C78] focus:border-[#3D5AFE] focus:outline-none shadow-[0_1px_2px_rgba(11,13,18,0.03)]"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center justify-between pt-3 text-[12.5px] font-medium text-[#666C78] overflow-x-auto gap-1">
            {(["all", "mine", "billing", "unassigned", "unread", "closed"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterTab(tab)}
                className={cn(
                  "px-2 py-1 rounded-[8px] capitalize transition-colors shrink-0",
                  filterTab === tab
                    ? "bg-white text-[#12141A] font-semibold shadow-[0_1px_2px_rgba(11,13,18,0.04)] border border-[#EDE8E0]"
                    : "hover:text-[#12141A]"
                )}
              >
                {tab === "billing" ? "💳 Billing" : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List Rows */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-light-scroll">
          {filteredConversations.map((c) => {
            const isSelected = c.id === activeConversationId;
            const timeDisplay = new Date(c.last_message_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={c.id}
                onClick={() => setActiveConversationId(c.id)}
                className={cn(
                  "p-3 rounded-[16px] transition-all duration-140 cursor-pointer text-left relative",
                  isSelected
                    ? "bg-white text-[#12141A] shadow-[0_1px_2px_rgba(11,13,18,0.04),0_8px_20px_-10px_rgba(11,13,18,0.12)] border border-[#EDE8E0]"
                    : "hover:bg-white/60 text-[#12141A] border border-transparent"
                )}
              >
                {/* 3px Active Indicator Bar (Ultramarine) */}
                {isSelected && (
                  <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r bg-[#3D5AFE]" />
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium text-[#12141A] truncate">
                    {c.contact_name || c.contact_phone}
                  </span>
                  <span suppressHydrationWarning className="text-[13px] text-[#666C78] font-variant-numeric tabular-nums shrink-0">
                    {mounted ? timeDisplay : "--:--"}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-1 gap-2">
                  <p className="text-[13px] text-[#454B57] truncate leading-tight">
                    {c.last_message_text || "No message preview"}
                  </p>
                  {c.unread_count > 0 && (
                    <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-[#FF5A1F] text-white text-[12px] font-medium flex items-center justify-center shrink-0">
                      {c.unread_count}
                    </span>
                  )}
                </div>

                {/* Assignee & Department Pill Strip */}
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#F0ECE4]/60 text-[11.5px]">
                  <span className="text-[#666C78] flex items-center gap-1 truncate max-w-[170px]">
                    <User className="h-3 w-3 text-[#8A909D] shrink-0" />
                    <span className="truncate">
                      {c.assigned_to_name ? c.assigned_to_name.split(" ")[0] : "Unassigned"}
                    </span>
                  </span>
                  {c.assigned_department === "billing" ? (
                    <span className="px-1.5 py-0.2 rounded text-[10.5px] font-medium bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] shrink-0">
                      💳 Billing
                    </span>
                  ) : c.assigned_department === "sales" ? (
                    <span className="px-1.5 py-0.2 rounded text-[10.5px] font-medium bg-[#FFF1EA] text-[#B93A0A] border border-[#FFE2D4] shrink-0">
                      💼 Sales
                    </span>
                  ) : c.assigned_department === "support" ? (
                    <span className="px-1.5 py-0.2 rounded text-[10.5px] font-medium bg-[#F0EAFF] text-[#6538E8] border border-[#D9C9FF] shrink-0">
                      🎧 Support
                    </span>
                  ) : c.assigned_to_name ? (
                    <span className="px-1.5 py-0.2 rounded text-[10.5px] font-medium bg-[#F5F3ED] text-[#666C78] border border-[#EDE8E0] shrink-0">
                      Team
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}

          {filteredConversations.length === 0 && (
            <div className="p-8 text-center text-[13px] text-[#666C78]">
              No conversations in this view.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CENTER PANE: ACTIVE THREAD ON WHITE RAISED PANEL                       */}
      {/* ========================================================================= */}
      <div className="flex flex-1 flex-col min-w-0 bg-white rounded-[24px] border border-[#EDE8E0] shadow-[0_1px_2px_rgba(11,13,18,.04),0_8px_24px_-12px_rgba(11,13,18,.12)] overflow-hidden m-2.5">
        {activeConversation ? (
          <>
            {/* Thread Header */}
            <div className="flex h-[56px] shrink-0 items-center justify-between px-6 border-b border-[#EDE8E0] bg-white">
              <div className="flex items-center gap-3">
                {(() => {
                  const avatarColor = getAvatarColor(activeConversation.contact_name || "Contact");
                  return (
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full border text-[14px] font-medium shadow-xs",
                        avatarColor.bg,
                        avatarColor.text,
                        avatarColor.border
                      )}
                    >
                      {getInitials(activeConversation.contact_name || "Contact")}
                    </div>
                  );
                })()}
                <div>
                  <h3 className="text-[15px] font-medium text-[#12141A] leading-tight">
                    {activeConversation.contact_name || activeConversation.contact_phone}
                  </h3>
                  <span className="text-[13px] text-[#666C78] font-variant-numeric tabular-nums">
                    {activeConversation.contact_phone}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Active Assignee Pill (Clickable) */}
                <button
                  type="button"
                  onClick={() => setForwardModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium bg-[#FAF9F5] border border-[#EDE8E0] text-[#343A46] hover:bg-[#F0ECE4] transition-colors cursor-pointer shadow-2xs"
                  title="Assigned team member • Click to forward or reassign"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#3D5AFE]" />
                  <span className="font-semibold text-[#12141A]">
                    {activeConversation.assigned_to_name || "Unassigned"}
                  </span>
                  {activeConversation.assigned_department && (
                    <span className="text-[10.5px] uppercase tracking-wider font-semibold px-1.5 py-0.2 rounded bg-white border border-[#EDE8E0] text-[#3D5AFE]">
                      {activeConversation.assigned_department}
                    </span>
                  )}
                </button>

                {/* Forward to Next Person Action Button */}
                <button
                  type="button"
                  onClick={() => setForwardModalOpen(true)}
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[9px] border border-[#D3DCFF] bg-[#F0F3FF] hover:bg-[#E5EAFF] text-[#2C48E8] text-[12.5px] font-medium shadow-2xs transition-colors cursor-pointer"
                  title="Forward conversation to next person (e.g. Sales to Billing)"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5 text-[#3D5AFE]" />
                  <span>Forward</span>
                </button>

                <StatusPill
                  variant={activeConversation.status === "open" ? "success" : "neutral"}
                  dot
                  size="sm"
                >
                  {activeConversation.status === "open" ? "Open Thread" : "Resolved"}
                </StatusPill>

                {/* Context Pane Toggle */}
                <button
                  type="button"
                  onClick={() => setContextPaneOpen((prev) => !prev)}
                  className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#E4E1D8] text-[#4B515D] hover:text-[#12141A] hover:bg-[#EFEDE7] transition-colors"
                  title={contextPaneOpen ? "Hide customer context" : "Show customer context"}
                >
                  {contextPaneOpen ? (
                    <PanelRightClose className="h-4 w-4" />
                  ) : (
                    <PanelRightOpen className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* 24-Hour Meta SLA Status Line */}
            <div className="flex h-8 shrink-0 items-center justify-between px-6 bg-[#F7F5F0] border-b border-[#EDE8E0] text-[13px] text-[#454B57]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#12B886]" />
                <span className="font-medium">Meta Customer Service Window: Active</span>
              </div>
              <span className="text-[#666C78]">18h remaining to reply freely</span>
            </div>

            {/* Message Thread Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-light-scroll bg-[#FAF9F5]">
              {messageGroups.map((group) => (
                <div key={group.dateLabel} className="space-y-3">
                  {/* Accurate Date Separator */}
                  <div className="flex items-center justify-center my-3">
                    <span className="px-3 py-1 rounded-full border border-[#EDE8E0] bg-white text-[13px] text-[#666C78] shadow-xs">
                      {group.dateLabel}
                    </span>
                  </div>

                  {group.msgs.map((msg) => {
                    const isClient = msg.sender_type === "customer";
                    const isNote = msg.sender_type === "internal_note" || msg.is_internal;
                    const timeOnly = new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    if (isNote) {
                      return (
                        <div key={msg.id} className="flex justify-center my-2">
                          <div className="max-w-lg p-4 rounded-[16px] bg-[#FFF3D6] border border-[#FFE5A3] text-[14px] text-[#8F5300] shadow-xs">
                            <div className="flex items-center gap-1.5 font-medium mb-1">
                              <Lock className="h-3.5 w-3.5" />
                              <span>Internal Staff Note • {msg.sender_name || "Staff"}</span>
                            </div>
                            <p className="text-[14px] text-[#12141A] leading-relaxed">
                              {msg.body}
                            </p>
                            <span suppressHydrationWarning className="text-[12px] text-[#8F5300] block mt-1.5 text-right font-variant-numeric tabular-nums">
                              {mounted ? timeOnly : "--:--"}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={cn("flex flex-col", isClient ? "items-start" : "items-end")}
                      >
                        <div
                          className={cn(
                            "max-w-lg rounded-[16px] p-4 text-[15px] leading-relaxed border transition-all",
                            isClient
                              ? "bg-white text-[#12141A] border-[#EDE8E0] rounded-bl-[4px] shadow-[0_1px_2px_rgba(11,13,18,0.04)]"
                              : "bg-[#EAEEFF] text-[#12141A] border-[#D3DCFF] rounded-br-[4px]"
                          )}
                        >
                          <p>{msg.body}</p>
                          <div
                            className={cn(
                              "flex items-center gap-1.5 mt-1.5 text-[12px] text-[#666C78] font-variant-numeric tabular-nums",
                              isClient ? "justify-start" : "justify-end"
                            )}
                          >
                            <span suppressHydrationWarning>{mounted ? timeOnly : "--:--"}</span>
                            {!isClient && <CheckCheck className="h-3.5 w-3.5 text-[#3D5AFE]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Pinned Composer at Bottom */}
            <div className="shrink-0 border-t border-[#EDE8E0] bg-white p-4 space-y-3">
              {/* Mode Tabs */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 rounded-[10px] bg-[#EFEDE7] p-1 text-[13px] font-medium">
                  <button
                    type="button"
                    onClick={() => setComposerMode("whatsapp")}
                    className={cn(
                      "px-3 py-1 rounded-[8px] transition-colors",
                      composerMode === "whatsapp"
                        ? "bg-white text-[#12141A] shadow-sm font-medium"
                        : "text-[#666C78] hover:text-[#12141A]"
                    )}
                  >
                    WhatsApp Message
                  </button>
                  <button
                    type="button"
                    onClick={() => setComposerMode("note")}
                    className={cn(
                      "px-3 py-1 rounded-[8px] transition-colors",
                      composerMode === "note"
                        ? "bg-white text-[#12141A] shadow-sm font-medium"
                        : "text-[#666C78] hover:text-[#12141A]"
                    )}
                  >
                    Internal Note
                  </button>
                </div>

                {/* AI Assist Trigger */}
                {composerMode === "whatsapp" && (
                  <button
                    type="button"
                    onClick={handleGenerateAiReply}
                    disabled={aiGenerating}
                    className="flex items-center gap-1.5 text-[13px] font-medium text-[#7C4DFF] hover:text-[#6538E8] transition-colors bg-[#F0EAFF] px-2.5 py-1 rounded-[8px] border border-[#D9C9FF]"
                  >
                    <Sparkles className="h-4 w-4 text-[#7C4DFF]" />
                    <span>{aiGenerating ? "Drafting..." : "AI Assist"}</span>
                  </button>
                )}
              </div>

              {/* Textarea */}
              {composerMode === "whatsapp" ? (
                <textarea
                  rows={2}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Reply to ${activeConversation.contact_name || activeConversation.contact_phone} (Enter to send, Shift+Enter for new line)...`}
                  className="w-full resize-none rounded-[12px] border border-[#EDE8E0] bg-[#F7F5F0] p-3 text-[14px] text-[#12141A] placeholder:text-[#666C78] focus:bg-white focus:border-[#3D5AFE] focus:outline-none transition-colors"
                />
              ) : (
                <textarea
                  rows={2}
                  value={internalNoteInput}
                  onChange={(e) => setInternalNoteInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendInternalNote();
                    }
                  }}
                  placeholder="Record private internal note for team members (visible only to staff)..."
                  className="w-full resize-none rounded-[12px] border border-[#FFE5A3] bg-[#FFF3D6] p-3 text-[14px] text-[#12141A] placeholder:text-[#8F5300] focus:bg-white focus:border-[#F5A524] focus:outline-none transition-colors"
                />
              )}

              {/* Toolbar */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-[#6A707C]">
                  <button
                    type="button"
                    onClick={() => setTemplateDrawerOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] hover:bg-[#F7F5F0] hover:text-[#12141A] text-[14px] font-medium transition-colors cursor-pointer"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Templates</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toast("Attachments available via Meta Media API", { type: "info" })}
                    className="p-1 rounded-[6px] hover:bg-[#EFEDE7] hover:text-[#12141A] transition-colors"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                </div>

                <Button
                  onClick={composerMode === "whatsapp" ? () => handleSendMessage() : () => handleSendInternalNote()}
                  isLoading={isSending}
                  className="btn-primary flex items-center gap-2 text-[14px]"
                >
                  <Send className="h-4 w-4" />
                  <span>Send</span>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-[#666C78]">
            Select a conversation to start messaging.
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. RIGHT PANE: QUIET CUSTOMER & DEAL CONTEXT (340px Collapsible)           */}
      {/* ========================================================================= */}
      {contextPaneOpen && activeConversation && (
        <div className="w-[340px] shrink-0 border-l border-[#EDE8E0] bg-[#FAF9F5] flex flex-col overflow-y-auto p-5 space-y-6 custom-light-scroll">
          {/* Contact Details Section */}
          <div className="space-y-3">
            <h4 className="type-eyebrow text-[#666C78]">
              Customer Information
            </h4>
            <div className="p-4 rounded-[16px] bg-white border border-[#EDE8E0] space-y-2.5 text-[13px] shadow-[0_1px_2px_rgba(11,13,18,0.04)]">
              <div className="flex items-center justify-between text-[#454B57]">
                <span>Contact Name</span>
                <span className="font-medium text-[#12141A]">
                  {activeConversation.contact_name || "Enterprise Client"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#454B57]">
                <span>WhatsApp</span>
                <span className="font-medium text-[#12141A] font-variant-numeric tabular-nums">
                  {activeConversation.contact_phone}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#4B515D]">
                <span>Status</span>
                <StatusPill variant="success" size="sm">
                  Opted In
                </StatusPill>
              </div>
            </div>
          </div>

          {/* Assignment & Department Handoff Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="type-eyebrow text-[#666C78]">
                Assigned Specialist
              </h4>
              <button
                type="button"
                onClick={() => setForwardModalOpen(true)}
                className="text-[12.5px] text-[#3D5AFE] hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <ArrowRightLeft className="h-3 w-3" />
                <span>Forward / Assign</span>
              </button>
            </div>
            <div className="p-4 rounded-[16px] bg-white border border-[#EDE8E0] space-y-2.5 text-[13px] shadow-[0_1px_2px_rgba(11,13,18,0.04)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-full bg-[#EEF2FF] text-[#3D5AFE] flex items-center justify-center font-medium text-[12px] border border-[#D3DCFF] shrink-0">
                    {getInitials(activeConversation.assigned_to_name || "Unassigned")}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-[#12141A] leading-tight truncate">
                      {activeConversation.assigned_to_name || "Unassigned"}
                    </div>
                    <div className="text-[11.5px] text-[#666C78] truncate">
                      {activeConversation.assigned_department
                        ? `${activeConversation.assigned_department.toUpperCase()} TEAM`
                        : "General Inbound Queue"}
                    </div>
                  </div>
                </div>
                {activeConversation.assigned_department === "billing" ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] shrink-0">
                    💳 Billing
                  </span>
                ) : activeConversation.assigned_department === "sales" ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF1EA] text-[#B93A0A] border border-[#FFE2D4] shrink-0">
                    💼 Sales
                  </span>
                ) : activeConversation.assigned_department === "support" ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F0EAFF] text-[#6538E8] border border-[#D9C9FF] shrink-0">
                    🎧 Support
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF9F5] text-[#666C78] border border-[#EDE8E0] shrink-0">
                    General
                  </span>
                )}
              </div>
              {activeConversation.assigned_at && (
                <div className="text-[11.5px] text-[#666C78] border-t border-[#F0ECE4] pt-2 flex items-center justify-between">
                  <span>Assigned by {activeConversation.assigned_by_name || "Staff"}</span>
                  <span suppressHydrationWarning className="tabular-nums">
                    {mounted
                      ? new Date(activeConversation.assigned_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })
                      : "--"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Linked Deal Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="type-eyebrow text-[#666C78]">
                Linked Opportunity
              </h4>
              <button
                type="button"
                onClick={() => setLeadModalOpen(true)}
                className="text-[13px] text-[#FF5A1F] hover:underline flex items-center gap-1 font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Deal</span>
              </button>
            </div>

            {linkedLead ? (
              <div className="p-4 rounded-[16px] bg-white border border-[#EDE8E0] space-y-2 text-[13px] shadow-[0_1px_2px_rgba(11,13,18,0.04)]">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#12141A] truncate">
                    {linkedLead.title}
                  </span>
                  <StatusPill variant="emerald" size="sm">
                    {linkedLead.stage}
                  </StatusPill>
                </div>
                <div className="type-metric text-[#0A7A53] font-variant-numeric tabular-nums">
                  {formatINR(linkedLead.estimated_value || 0)}
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-[#666C78]">
                No opportunity linked yet.
              </p>
            )}
          </div>

          {/* Linked Tasks Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="type-eyebrow text-[#666C78]">
                Action Tasks
              </h4>
              <button
                type="button"
                onClick={() => setTaskModalOpen(true)}
                className="text-[13px] text-[#FF5A1F] hover:underline flex items-center gap-1 font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Task</span>
              </button>
            </div>

            <div className="space-y-2">
              {linkedTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-[14px] bg-white border border-[#EDE8E0] flex items-center justify-between text-[13px] shadow-xs"
                >
                  <span className="font-medium text-[#12141A] truncate">{t.title}</span>
                  <span className="text-[12px] text-[#8F5300] bg-[#FFF3D6] px-2 py-0.5 rounded-full border border-[#FFE5A3] shrink-0">
                    {t.priority}
                  </span>
                </div>
              ))}
              {linkedTasks.length === 0 && (
                <p className="text-[13px] text-[#666C78]">Zero open tasks.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Templates Drawer */}
      <Drawer
        isOpen={templateDrawerOpen}
        onClose={() => setTemplateDrawerOpen(false)}
        title="WhatsApp Message Templates"
        description="Select pre-approved Meta template for instant dispatch"
      >
        <div className="space-y-3">
          {MOCK_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => {
                setMessageInput(tmpl.body_content);
                setTemplateDrawerOpen(false);
                toast("Template inserted", { type: "info" });
              }}
              className="p-3.5 rounded-[8px] border border-[#E4E1D8] hover:bg-[#F6F5F1] transition-colors cursor-pointer text-left space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-[#12141A]">
                  {tmpl.name}
                </span>
                <StatusPill variant="success" size="sm">
                  Approved
                </StatusPill>
              </div>
              <p className="text-[12px] text-[#4B515D]">{tmpl.body_content}</p>
            </div>
          ))}
        </div>
      </Drawer>

      {/* Add Deal Modal */}
      <Dialog open={leadModalOpen} onOpenChange={setLeadModalOpen}>
        <form onSubmit={handleCreateLead} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create Opportunity for Contact</DialogTitle>
            <DialogDescription>
              Link a new sales deal to {activeConversation?.contact_name || "this contact"}.
            </DialogDescription>
          </DialogHeader>

          <Input
            label="Deal Title *"
            value={newLeadTitle}
            onChange={(e) => setNewLeadTitle(e.target.value)}
            required
            placeholder="e.g. Enterprise WhatsApp Pilot"
          />

          <Input
            label="Estimated Value (INR) *"
            type="number"
            value={newLeadValue}
            onChange={(e) => setNewLeadValue(e.target.value)}
            required
          />

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setLeadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Opportunity
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Add Task Modal */}
      <Dialog open={taskModalOpen} onOpenChange={setTaskModalOpen}>
        <form onSubmit={handleCreateTask} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Schedule Follow-up Task</DialogTitle>
            <DialogDescription>
              Add a chronological SLA reminder for this client thread.
            </DialogDescription>
          </DialogHeader>

          <Input
            label="Task Title *"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            required
          />

          <Input
            label="Due Date"
            type="date"
            value={newTaskDate}
            onChange={(e) => setNewTaskDate(e.target.value)}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setTaskModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Forward Conversation & Handoff Modal */}
      {activeConversation && (
        <ForwardConversationModal
          open={forwardModalOpen}
          onClose={() => setForwardModalOpen(false)}
          customerName={activeConversation.contact_name || activeConversation.contact_phone}
          customerPhone={activeConversation.contact_phone}
          currentAssigneeName={activeConversation.assigned_to_name}
          currentDepartment={activeConversation.assigned_department}
          teamMembers={teamMembers}
          onForward={handleForwardConversation}
        />
      )}
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-130px)] flex items-center justify-center text-[13px] text-[#6A707C]">
          Loading WhatsApp...
        </div>
      }
    >
      <InboxContent />
    </Suspense>
  );
}
