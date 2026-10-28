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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { Drawer } from "@/components/ui/drawer";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useMounted } from "@/lib/use-mounted";
import { useToast } from "@/components/ui/toast-context";
import { cn } from "@/lib/utils";
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
  const [filterTab, setFilterTab] = useState<"all" | "mine" | "unassigned" | "unread" | "closed">("all");
  const [contextPaneOpen, setContextPaneOpen] = useState(true);

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

  return (
    <div className="flex h-[calc(100vh-100px)] rounded-[14px] border border-[#E4E1D8] bg-white shadow-hairline overflow-hidden select-none animate-page-enter">
      {/* ========================================================================= */}
      {/* 1. LEFT PANE: CONVERSATION LIST (340px)                                    */}
      {/* ========================================================================= */}
      <div className="w-[340px] shrink-0 border-r border-[#E4E1D8] flex flex-col bg-[#FFFFFF]">
        {/* Search Header */}
        <div className="p-3 border-b border-[#E4E1D8]">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-[#6A707C]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="h-8 w-full rounded-[6px] border border-[#E4E1D8] bg-[#EFEDE7] pl-8 pr-3 text-[12px] text-[#12141A] placeholder:text-[#6A707C] focus:bg-white focus:border-[#FF5A1F] focus:outline-none"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center justify-between pt-2.5 text-[11px] font-medium text-[#6A707C]">
            {(["all", "mine", "unassigned", "unread", "closed"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterTab(tab)}
                className={cn(
                  "px-2 py-0.5 rounded-[4px] capitalize transition-colors",
                  filterTab === tab
                    ? "bg-[#EFEDE7] text-[#12141A] font-medium"
                    : "hover:text-[#12141A]"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List Rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E4E1D8] custom-light-scroll">
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
                  "p-3.5 transition-colors duration-140 cursor-pointer text-left relative",
                  isSelected
                    ? "bg-[#F6F5F1] text-[#12141A]"
                    : "hover:bg-[#F6F5F1]/60 text-[#12141A]"
                )}
              >
                {/* 3px Active Indicator Bar */}
                {isSelected && (
                  <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#FF5A1F]" />
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-[#12141A] truncate">
                    {c.contact_name || c.contact_phone}
                  </span>
                  <span className="text-[11px] text-[#6A707C] font-variant-numeric tabular-nums shrink-0">
                    {timeDisplay}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-1 gap-2">
                  <p className="text-[12px] text-[#4B515D] truncate leading-tight">
                    {c.last_message_text || "No message preview"}
                  </p>
                  {c.unread_count > 0 && (
                    <span className="h-4 min-w-[16px] px-1 rounded-full bg-[#FF5A1F] text-white text-[10px] font-medium flex items-center justify-center shrink-0">
                      {c.unread_count}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredConversations.length === 0 && (
            <div className="p-8 text-center text-[12px] text-[#6A707C]">
              No conversations in this view.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CENTER PANE: ACTIVE THREAD & PINNED COMPOSER                           */}
      {/* ========================================================================= */}
      <div className="flex flex-1 flex-col min-w-0 bg-[#F6F5F1]">
        {activeConversation ? (
          <>
            {/* Thread Header */}
            <div className="flex h-[52px] shrink-0 items-center justify-between px-5 border-b border-[#E4E1D8] bg-white">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFEDE7] text-[#12141A] text-[13px] font-medium border border-[#E4E1D8]">
                  {activeConversation.contact_name ? activeConversation.contact_name[0] : "C"}
                </div>
                <div>
                  <h3 className="text-[14px] font-medium text-[#12141A] leading-tight">
                    {activeConversation.contact_name || activeConversation.contact_phone}
                  </h3>
                  <span className="text-[11px] text-[#6A707C] font-variant-numeric tabular-nums">
                    {activeConversation.contact_phone}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
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
            <div className="flex h-7 shrink-0 items-center justify-between px-5 bg-[#EFEDE7] border-b border-[#E4E1D8] text-[11px] text-[#4B515D]">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0F7B5A]" />
                <span>Meta Customer Service Window: Active</span>
              </div>
              <span className="text-[#6A707C]">18h remaining to reply freely</span>
            </div>

            {/* Message Thread Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-light-scroll">
              {messageGroups.map((group) => (
                <div key={group.dateLabel} className="space-y-3">
                  {/* Accurate Date Separator */}
                  <div className="flex items-center justify-center my-3">
                    <span className="px-2.5 py-0.5 rounded-full border border-[#E4E1D8] bg-white text-[11px] text-[#6A707C]">
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
                          <div className="max-w-md p-3 rounded-[8px] bg-[#FFF1EA] border border-[#FFE0D2] text-[12px] text-[#C73E0C]">
                            <div className="flex items-center gap-1.5 font-medium mb-1">
                              <Lock className="h-3 w-3" />
                              <span>Internal Staff Note • {msg.sender_name || "Staff"}</span>
                            </div>
                            <p className="text-[12px] text-[#12141A]">
                              {msg.body}
                            </p>
                            <span className="text-[10px] text-[#6A707C] block mt-1 text-right">
                              {timeOnly}
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
                            "max-w-md rounded-[12px] p-3 text-[13px] leading-relaxed shadow-hairline border",
                            isClient
                              ? "bg-white text-[#12141A] border-[#E4E1D8] rounded-bl-[2px]"
                              : "bg-[#EFEDE7] text-[#12141A] border-[#D2CEC2] rounded-br-[2px]"
                          )}
                        >
                          <p>{msg.body}</p>
                          <div
                            className={cn(
                              "flex items-center gap-1 mt-1 text-[10px] text-[#6A707C]",
                              isClient ? "justify-start" : "justify-end"
                            )}
                          >
                            <span>{timeOnly}</span>
                            {!isClient && <CheckCheck className="h-3 w-3 text-[#0F7B5A]" />}
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
            <div className="shrink-0 border-t border-[#E4E1D8] bg-white p-3 space-y-2">
              {/* Mode Tabs */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 rounded-[6px] bg-[#EFEDE7] p-0.5 text-[11px] font-medium">
                  <button
                    type="button"
                    onClick={() => setComposerMode("whatsapp")}
                    className={cn(
                      "px-2.5 py-1 rounded-[4px] transition-colors",
                      composerMode === "whatsapp"
                        ? "bg-white text-[#12141A] shadow-hairline"
                        : "text-[#6A707C] hover:text-[#12141A]"
                    )}
                  >
                    WhatsApp Message
                  </button>
                  <button
                    type="button"
                    onClick={() => setComposerMode("note")}
                    className={cn(
                      "px-2.5 py-1 rounded-[4px] transition-colors",
                      composerMode === "note"
                        ? "bg-white text-[#12141A] shadow-hairline"
                        : "text-[#6A707C] hover:text-[#12141A]"
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
                    className="flex items-center gap-1.5 text-[11px] font-medium text-[#4B515D] hover:text-[#12141A] transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#FF5A1F]" />
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
                  className="w-full resize-none rounded-[8px] border border-[#E4E1D8] bg-[#EFEDE7] p-2.5 text-[13px] text-[#12141A] placeholder:text-[#6A707C] focus:bg-white focus:border-[#FF5A1F] focus:outline-none transition-colors"
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
                  className="w-full resize-none rounded-[8px] border border-[#FFE0D2] bg-[#FFF1EA] p-2.5 text-[13px] text-[#12141A] placeholder:text-[#C73E0C] focus:bg-white focus:border-[#FF5A1F] focus:outline-none transition-colors"
                />
              )}

              {/* Toolbar */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-[#6A707C]">
                  <button
                    type="button"
                    onClick={() => setTemplateDrawerOpen(true)}
                    className="flex items-center gap-1 px-2 py-1 rounded-[6px] hover:bg-[#EFEDE7] hover:text-[#12141A] text-[11px] font-medium transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5" />
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
                  variant="primary"
                  size="sm"
                  isLoading={isSending}
                  className="flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send</span>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-[#6A707C]">
            Select a conversation to start messaging.
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. RIGHT PANE: CUSTOMER & DEAL CONTEXT (340px Collapsible)                 */}
      {/* ========================================================================= */}
      {contextPaneOpen && activeConversation && (
        <div className="w-[340px] shrink-0 border-l border-[#E4E1D8] bg-white flex flex-col overflow-y-auto p-4 space-y-6 custom-light-scroll">
          {/* Contact Details Section */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-medium tracking-[0.06em] text-[#6A707C] uppercase">
              Customer Information
            </h4>
            <div className="p-3 rounded-[8px] bg-[#EFEDE7] space-y-2 text-[12px]">
              <div className="flex items-center justify-between text-[#4B515D]">
                <span>Contact Name</span>
                <span className="font-medium text-[#12141A]">
                  {activeConversation.contact_name || "Enterprise Client"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#4B515D]">
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

          {/* Linked Deal Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-medium tracking-[0.06em] text-[#6A707C] uppercase">
                Linked Opportunity
              </h4>
              <button
                type="button"
                onClick={() => setLeadModalOpen(true)}
                className="text-[11px] text-[#FF5A1F] hover:underline flex items-center gap-1 font-medium"
              >
                <Plus className="h-3 w-3" />
                <span>Add Deal</span>
              </button>
            </div>

            {linkedLead ? (
              <div className="p-3 rounded-[8px] border border-[#E4E1D8] space-y-2 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#12141A] truncate">
                    {linkedLead.title}
                  </span>
                  <StatusPill variant="neutral" size="sm">
                    {linkedLead.stage}
                  </StatusPill>
                </div>
                <div className="text-[16px] font-medium text-[#0F7B5A] font-variant-numeric tabular-nums">
                  ₹{(linkedLead.estimated_value || 0).toLocaleString()}
                </div>
              </div>
            ) : (
              <p className="text-[12px] text-[#6A707C]">
                No opportunity linked yet.
              </p>
            )}
          </div>

          {/* Linked Tasks Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-medium tracking-[0.06em] text-[#6A707C] uppercase">
                Action Tasks
              </h4>
              <button
                type="button"
                onClick={() => setTaskModalOpen(true)}
                className="text-[11px] text-[#FF5A1F] hover:underline flex items-center gap-1 font-medium"
              >
                <Plus className="h-3 w-3" />
                <span>Add Task</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {linkedTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 rounded-[8px] border border-[#E4E1D8] flex items-center justify-between text-[12px]"
                >
                  <span className="truncate text-[#12141A] font-medium">{t.title}</span>
                  <span className="text-[11px] text-[#6A707C] shrink-0">{t.priority}</span>
                </div>
              ))}
              {linkedTasks.length === 0 && (
                <p className="text-[12px] text-[#6A707C]">
                  No pending follow-up tasks.
                </p>
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
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-130px)] flex items-center justify-center text-[13px] text-[#6A707C]">
          Loading Shared Inbox...
        </div>
      }
    >
      <InboxContent />
    </Suspense>
  );
}
