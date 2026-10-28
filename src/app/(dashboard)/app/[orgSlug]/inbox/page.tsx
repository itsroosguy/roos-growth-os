"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTenant } from "@/lib/organizations/tenant-context";
import { whatsappStore } from "@/lib/whatsapp/whatsapp-store";
import { crmStore } from "@/lib/crm/crm-store";
import { teamStore, TeamMember } from "@/lib/team/team-store";
import {
  WhatsAppConversation,
  WhatsAppMessage,
  ConversationStatus,
} from "@/lib/whatsapp/types";
import { MOCK_TEMPLATES } from "@/lib/whatsapp/mock-provider";
import { LeadStage, TaskPriority, Task } from "@/types/crm";
import { aiService } from "@/lib/ai/ai-service";
import { ReplySuggestionResult, ConversationSummaryResult } from "@/lib/ai/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useMounted } from "@/lib/use-mounted";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
  Bot,
  FileText,
  Copy,
  Search,
  Filter,
  Lock,
  Plus,
  Calendar,
  AlertCircle,
  TrendingUp,
  Tag,
  ChevronRight,
  CheckSquare,
  PanelRightClose,
  PanelRightOpen,
  ArrowRight,
  ShieldCheck,
  Paperclip,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast-context";

function InboxContent() {
  const { currentOrg, userRole } = useTenant();
  const orgSlug = currentOrg.slug;
  const mounted = useMounted();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const contactIdParam = searchParams.get("contactId");
  const phoneParam = searchParams.get("phone");
  const convParam = searchParams.get("c");

  const [refreshKey, setRefreshKey] = useState(0);
  const [activeConversationId, setActiveConversationId] = useState<string>("conv-102");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "unread" | "mine">("all");
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // Composer mode: "message" (WhatsApp outbound) | "note" (Private internal team note)
  const [composerMode, setComposerMode] = useState<"message" | "note">("message");
  const [messageInput, setMessageInput] = useState("");
  const [internalNoteInput, setInternalNoteInput] = useState("");
  const [selectedTemplateName, setSelectedTemplateName] = useState(MOCK_TEMPLATES[0].name);
  const [isSending, setIsSending] = useState(false);

  // CRM inline action modals
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [newLeadTitle, setNewLeadTitle] = useState("");
  const [newLeadValue, setNewLeadValue] = useState("50000");
  const [newLeadStage, setNewLeadStage] = useState<LeadStage>("new");

  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [newFollowUpTitle, setNewFollowUpTitle] = useState("WhatsApp Inquiry Follow-up");
  const [newFollowUpDate, setNewFollowUpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });
  const [newFollowUpPriority, setNewFollowUpPriority] = useState<TaskPriority>("medium");

  // AI Assistant Copilot state
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<ReplySuggestionResult | null>(null);
  const [aiSummaryOpen, setAiSummaryOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState<ConversationSummaryResult | null>(null);

  // Team members list
  const teamMembers = useMemo(() => {
    return teamStore.getTeamMembers(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  // Current staff user mock identity
  const currentStaffUser = useMemo(() => {
    if (userRole === "owner") return teamMembers.find((m) => m.role === "owner") || teamMembers[0];
    if (userRole === "admin") return teamMembers.find((m) => m.role === "admin") || teamMembers[0];
    return teamMembers.find((m) => m.role === "staff") || teamMembers[0];
  }, [teamMembers, userRole]);

  // Sync URL search params
  useEffect(() => {
    if (convParam) {
      setActiveConversationId(convParam);
    } else if (contactIdParam) {
      try {
        const conv = whatsappStore.getOrCreateConversationForContact(orgSlug, contactIdParam);
        if (conv) setActiveConversationId(conv.id);
      } catch (err) {}
    } else if (phoneParam) {
      const allConvs = whatsappStore.getConversations(orgSlug);
      const match = allConvs.find((c) => c.contact_phone === phoneParam);
      if (match) setActiveConversationId(match.id);
    }
  }, [convParam, contactIdParam, phoneParam, orgSlug]);

  // All conversations from store
  const allConversations = useMemo(() => {
    return whatsappStore.getConversations(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    return allConversations.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.contact_name.toLowerCase().includes(q) ||
        c.contact_phone.includes(q) ||
        (c.last_message_text || "").toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filterTab === "unread") return c.unread_count > 0;
      if (filterTab === "mine") return c.assigned_to_user_id === currentStaffUser?.id;
      return true;
    });
  }, [allConversations, searchQuery, filterTab, currentStaffUser]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    const unread = allConversations.filter((c) => c.unread_count > 0).length;
    const mine = allConversations.filter((c) => c.assigned_to_user_id === currentStaffUser?.id).length;
    return { all: allConversations.length, unread, mine };
  }, [allConversations, currentStaffUser]);

  // Active conversation object
  const activeConversation = useMemo(() => {
    return (
      allConversations.find((c) => c.id === activeConversationId) ||
      allConversations[0] ||
      null
    );
  }, [allConversations, activeConversationId]);

  // Messages of active conversation (1 argument)
  const messages = useMemo(() => {
    if (!activeConversation) return [];
    return whatsappStore.getMessages(activeConversation.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation, refreshKey]);

  // Associated Contact & CRM Lead
  const contact = useMemo(() => {
    if (!activeConversation) return null;
    return crmStore.getContactById(orgSlug, activeConversation.contact_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation, orgSlug, refreshKey]);

  const lead = useMemo(() => {
    if (!activeConversation?.lead_id) return null;
    return crmStore.getLeadById(orgSlug, activeConversation.lead_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation, orgSlug, refreshKey]);

  const contactTasks = useMemo(() => {
    if (!contact) return [];
    return crmStore.getTasks(orgSlug).filter((t: Task) => t.contact_id === contact.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact, orgSlug, refreshKey]);

  // 24h Meta Customer Service Window Check
  const windowStatus = useMemo(() => {
    if (!activeConversation) return { allowed: true, hoursRemaining: 24 };
    return whatsappStore.isWithin24HourWindow(activeConversation);
  }, [activeConversation]);

  // Send WhatsApp Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeConversation || isSending) return;

    if (windowStatus.allowed && !messageInput.trim()) return;

    setIsSending(true);
    const staffName = currentStaffUser?.name || "Staff Member";
    const staffUserId = currentStaffUser?.id;

    const payload = windowStatus.allowed
      ? {
          toPhone: activeConversation.contact_phone,
          type: "text" as const,
          text: messageInput.trim(),
          staffName,
          staffUserId,
        }
      : {
          toPhone: activeConversation.contact_phone,
          type: "template" as const,
          templateName: selectedTemplateName,
          templateVariables: {
            "1": activeConversation.contact_name,
            "2": currentOrg.name,
          },
          staffName,
          staffUserId,
        };

    try {
      const res = await whatsappStore.sendOutboundMessage(orgSlug, activeConversation.id, payload);
      setIsSending(false);
      if (res.success) {
        setMessageInput("");
        setRefreshKey((k) => k + 1);
        toast("Message delivered via Meta API", { type: "success" });
      } else {
        toast(res.errorMessage || "Message dispatch failed", { type: "error" });
      }
    } catch (err: unknown) {
      setIsSending(false);
      toast("Could not deliver message", { type: "error" });
    }
  };

  // Send Internal Team Note
  const handleSendNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeConversation || !internalNoteInput.trim() || isSending) return;

    setIsSending(true);
    const staffName = currentStaffUser?.name || "Staff Member";
    const staffUserId = currentStaffUser?.id;

    try {
      whatsappStore.addInternalNote(
        orgSlug,
        activeConversation.id,
        internalNoteInput.trim(),
        staffName,
        staffUserId
      );
      setInternalNoteInput("");
      setRefreshKey((k) => k + 1);
      toast("Internal team note recorded", { type: "success" });
    } finally {
      setIsSending(false);
    }
  };

  // AI Reply Generation
  const handleGenerateAIReply = async () => {
    if (!activeConversation || aiGenerating) return;
    setAiGenerating(true);

    try {
      const activeMsgs = whatsappStore.getMessages(activeConversation.id);
      const lastCustMsg =
        [...activeMsgs].reverse().find((m) => m.sender_type === "customer")?.body ||
        "Hello! I am interested in your services.";

      const result = await aiService.generateReplySuggestion({
        orgSlug,
        customerName: activeConversation.contact_name,
        incomingMessage: lastCustMsg,
        recentMessages: activeMsgs.slice(-5).map((m) => ({
          sender: m.sender_type,
          text: m.body,
        })),
      });
      setAiSuggestion(result);
    } catch (err) {
      toast("Could not generate AI draft", { type: "error" });
    } finally {
      setAiGenerating(false);
    }
  };

  // AI Thread Summary
  const handleSummarize = async () => {
    if (!activeConversation || aiGenerating) return;
    setAiGenerating(true);

    try {
      const activeMsgs = whatsappStore.getMessages(activeConversation.id);
      const result = await aiService.summarizeConversation({
        orgSlug,
        customerName: activeConversation.contact_name,
        messages: activeMsgs.map((m) => ({
          sender: m.sender_type,
          text: m.body,
          timestamp: m.created_at,
        })),
      });
      setAiSummary(result);
      setAiSummaryOpen(true);
    } catch (err) {
      toast("Could not summarize thread", { type: "error" });
    } finally {
      setAiGenerating(false);
    }
  };

  // Create CRM Lead Modal Submit
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation || !newLeadTitle.trim()) return;

    const created = crmStore.createLead(orgSlug, {
      title: newLeadTitle.trim(),
      contact_id: activeConversation.contact_id,
      contact_name: activeConversation.contact_name,
      contact_phone: activeConversation.contact_phone,
      stage: newLeadStage,
      estimated_value: parseFloat(newLeadValue) || 50000,
      currency: "INR",
      source: "WhatsApp Shared Inbox",
    });

    whatsappStore.linkConversationLead(orgSlug, activeConversation.id, created.id, currentStaffUser?.name || "Staff");
    setLeadModalOpen(false);
    setNewLeadTitle("");
    setRefreshKey((k) => k + 1);
    toast("Commercial lead created and linked to conversation", { type: "success" });
  };

  // Create Follow-up Task Modal Submit
  const handleCreateFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation || !newFollowUpTitle.trim()) return;

    crmStore.createTask(orgSlug, {
      contact_id: activeConversation.contact_id,
      contact_name: activeConversation.contact_name,
      lead_id: lead?.id,
      lead_title: lead?.title,
      assigned_to_name: currentStaffUser?.name || "Staff",
      title: newFollowUpTitle.trim(),
      description: "Scheduled from WhatsApp Shared Inbox thread",
      due_date: new Date(newFollowUpDate).toISOString(),
      priority: newFollowUpPriority,
      status: "todo",
    });

    setFollowUpModalOpen(false);
    setRefreshKey((k) => k + 1);
    toast("Follow-up task scheduled", { type: "success" });
  };

  return (
    // Full-bleed viewport height frame breaking out of page padding (Defect 16 fix)
    <div className="-m-4 sm:-m-5 md:-m-6 h-[calc(100vh-52px)] flex bg-white overflow-hidden select-none">
      {/* ===================================================================== */}
      {/* PANE 1: CONVERSATION LIST (320px)                                     */}
      {/* ===================================================================== */}
      <div className="w-full sm:w-[320px] shrink-0 border-r border-[#E4E4E7] flex flex-col bg-white overflow-hidden">
        {/* Pane 1 Header: Search & Filter Tabs */}
        <div className="p-3 border-b border-[#E4E4E7] space-y-2.5 bg-white shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="type-title text-[#0D0D0E] font-medium tracking-tight">
              Inbox
            </h2>
            <StatusPill variant="neutral" size="sm">
              {tabCounts.all} active
            </StatusPill>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#717680]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full h-8 pl-8 pr-3 text-xs bg-[#FAF9F6] border border-[#E4E4E7] rounded-lg text-[#0D0D0E] placeholder:text-[#717680] outline-none focus:border-[#FF7A1A]"
            />
          </div>

          {/* Filter Tabs: All, Unread, Mine */}
          <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-[#FAF9F6] border border-[#E4E4E7] text-xs">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={`py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                filterTab === "all"
                  ? "bg-white text-[#0D0D0E] shadow-2xs border border-[#E4E4E7]"
                  : "text-[#717680] hover:text-[#0D0D0E]"
              }`}
            >
              All ({tabCounts.all})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("unread")}
              className={`py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                filterTab === "unread"
                  ? "bg-white text-[#0D0D0E] shadow-2xs border border-[#E4E4E7]"
                  : "text-[#717680] hover:text-[#0D0D0E]"
              }`}
            >
              Unread ({tabCounts.unread})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("mine")}
              className={`py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                filterTab === "mine"
                  ? "bg-white text-[#0D0D0E] shadow-2xs border border-[#E4E4E7]"
                  : "text-[#717680] hover:text-[#0D0D0E]"
              }`}
            >
              Mine ({tabCounts.mine})
            </button>
          </div>
        </div>

        {/* Conversation List (Clean 2-line cards - Defect 18 fix) */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E4E4E7] custom-light-scroll">
          {filteredConversations.map((conv) => {
            const isSelected = conv.id === activeConversation?.id;
            const isUnread = conv.unread_count > 0;

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => setActiveConversationId(conv.id)}
                className={`w-full text-left p-3 transition-colors duration-140 cursor-pointer block ${
                  isSelected
                    ? "bg-[#FFF4EC]/40 border-l-2 border-[#FF7A1A]"
                    : "hover:bg-[#FAF9F6]"
                }`}
              >
                {/* Line 1: Name + Timestamp */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs truncate ${isSelected || isUnread ? "font-medium text-[#0D0D0E]" : "text-[#525866]"}`}>
                    {conv.contact_name}
                  </span>
                  <span className="text-[10px] text-[#717680] shrink-0">
                    {conv.last_message_at ? formatDate(conv.last_message_at) : ""}
                  </span>
                </div>

                {/* Line 2: Message preview + Unread chip */}
                <div className="flex items-center justify-between gap-2 mt-1">
                  <p className="text-[11px] text-[#717680] truncate font-normal">
                    {conv.last_message_text || "No messages yet"}
                  </p>
                  {isUnread && (
                    <span className="h-4 min-w-[16px] px-1 rounded-full bg-[#FF7A1A] text-white text-[9px] font-medium flex items-center justify-center shrink-0">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {filteredConversations.length === 0 && (
            <div className="p-6 text-center text-xs text-[#717680]">
              No conversations found in this view.
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* PANE 2: ACTIVE THREAD & PINNED COMPOSER (flex-1)                      */}
      {/* ===================================================================== */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAF9F6] overflow-hidden">
        {activeConversation ? (
          <>
            {/* Thread Header */}
            <div className="h-13 px-4 bg-white border-b border-[#E4E4E7] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-7 w-7 rounded-full bg-[#FAF9F6] border border-[#E4E4E7] text-[#0D0D0E] font-medium text-xs flex items-center justify-center shrink-0">
                  {activeConversation.contact_name?.charAt(0) || "C"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#0D0D0E] truncate">
                      {activeConversation.contact_name}
                    </span>
                    <span className="text-[11px] text-[#717680] font-normal truncate hidden sm:inline">
                      {activeConversation.contact_phone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Thread Action Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Meta 24h Window Indicator (Defect 20 fix) */}
                <StatusPill
                  variant={windowStatus.allowed ? "success" : "warning"}
                  size="sm"
                  dot
                  className="hidden md:inline-flex"
                >
                  {windowStatus.allowed ? `24h Window (${windowStatus.hoursRemaining}h)` : "Template Required"}
                </StatusPill>

                {/* Create Deal Button */}
                {!lead && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setNewLeadTitle(`${activeConversation.contact_name} - Retainer`);
                      setLeadModalOpen(true);
                    }}
                    className="h-7 text-[11px] px-2.5"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    <span>Create Deal</span>
                  </Button>
                )}

                {/* Follow-up Task Button */}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setFollowUpModalOpen(true)}
                  className="h-7 text-[11px] px-2.5 hidden sm:inline-flex"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>Follow-up</span>
                </Button>

                {/* AI Summary Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSummarize}
                  disabled={aiGenerating}
                  className="h-7 text-[11px] px-2 text-[#717680] hover:text-[#0D0D0E]"
                  title="Summarize thread with AI"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#FF7A1A]" />
                </Button>

                {/* Toggle Context Drawer */}
                <button
                  type="button"
                  onClick={() => setRightPanelOpen(!rightPanelOpen)}
                  className="p-1.5 rounded-lg text-[#717680] hover:text-[#0D0D0E] hover:bg-[#FAF9F6] transition-colors cursor-pointer border border-[#E4E4E7]"
                  title={rightPanelOpen ? "Hide Contact Details" : "Show Contact Details"}
                >
                  {rightPanelOpen ? (
                    <PanelRightClose className="h-3.5 w-3.5" />
                  ) : (
                    <PanelRightOpen className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Scrollable Message Thread (Grouped bubbles - Defect 19 fix) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-light-scroll">
              {/* Meta 24h Slim Status Strip (Defect 20 fix) */}
              <div className="py-1 px-3 rounded-lg bg-white border border-[#E4E4E7] text-[11px] text-[#717680] flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Meta WhatsApp Business API session active • End-to-end encrypted
                  </span>
                </div>
                <span className="text-[10px] text-[#717680]">
                  {windowStatus.hoursRemaining}h window remaining
                </span>
              </div>

              {messages.map((msg) => {
                const isInbound = msg.sender_type === "customer";
                const isInternalNote = msg.sender_type === "internal_note" || msg.sender_type === "system";

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isInternalNote
                        ? "items-center"
                        : isInbound
                        ? "items-start"
                        : "items-end"
                    }`}
                  >
                    {isInternalNote ? (
                      /* Internal Team Note Bubble */
                      <div className="max-w-[85%] rounded-xl px-3.5 py-2 bg-[#FEF9C3]/80 border border-[#FEF08A] text-[#713F12] text-xs shadow-2xs space-y-1">
                        <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-amber-800">
                          <Lock className="h-2.5 w-2.5" />
                          <span>Internal Note ({msg.sender_name || "Team Member"})</span>
                        </div>
                        <p className="leading-relaxed font-normal">{msg.body}</p>
                        <span className="text-[10px] text-amber-700/80 block text-right">
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                    ) : (
                      /* Outbound or Inbound Chat Bubble */
                      <div
                        className={`max-w-[78%] rounded-xl px-3.5 py-2.5 text-xs shadow-2xs ${
                          isInbound
                            ? "bg-white text-[#0D0D0E] border border-[#E4E4E7] rounded-tl-xs"
                            : "bg-[#DCF8C6] text-[#0D0D0E] border border-[#C6E6B0] rounded-tr-xs"
                        }`}
                      >
                        <p className="leading-relaxed font-normal whitespace-pre-wrap">{msg.body}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#717680]">
                          <span>{formatDate(msg.created_at)}</span>
                          {!isInbound && (
                            <CheckCheck className="h-3 w-3 text-emerald-600" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {messages.length === 0 && (
                <div className="py-12 text-center text-xs text-[#717680]">
                  No messages in this conversation yet. Send the first message below.
                </div>
              )}
            </div>

            {/* AI Draft Suggestion Box (If generated) */}
            {aiSuggestion && (
              <div className="mx-4 mb-2 p-3 rounded-lg bg-[#FFF4EC] border border-[#FFD8BF] space-y-2 text-xs shadow-2xs animate-reveal">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-[#FF7A1A]" />
                    <span className="font-medium text-[#FF7A1A]">AI Draft Recommendation</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiSuggestion(null)}
                    className="text-[11px] text-[#717680] hover:text-[#0D0D0E]"
                  >
                    Dismiss
                  </button>
                </div>
                <p className="p-2 bg-white rounded border border-[#FFD8BF] text-[#0D0D0E] leading-relaxed">
                  {aiSuggestion.suggestionText}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setMessageInput(aiSuggestion.suggestionText);
                      setAiSuggestion(null);
                    }}
                    className="h-6.5 text-[11px] px-2.5"
                  >
                    Insert into Composer
                  </Button>
                </div>
              </div>
            )}

            {/* PINNED BOTTOM COMPOSER (Defect 16 & 17 fix) */}
            <div className="shrink-0 p-3 bg-white border-t border-[#E4E4E7] space-y-2">
              {/* Mode Tabs: WhatsApp Reply vs Internal Note */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setComposerMode("message")}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      composerMode === "message"
                        ? "bg-[#0D0D0E] text-white"
                        : "text-[#717680] hover:text-[#0D0D0E]"
                    }`}
                  >
                    WhatsApp Reply
                  </button>
                  <button
                    type="button"
                    onClick={() => setComposerMode("note")}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                      composerMode === "note"
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : "text-[#717680] hover:text-[#0D0D0E]"
                    }`}
                  >
                    <Lock className="h-3 w-3" />
                    <span>Internal Note</span>
                  </button>
                </div>

                {composerMode === "message" && (
                  <button
                    type="button"
                    onClick={handleGenerateAIReply}
                    disabled={aiGenerating}
                    className="text-[11px] text-[#FF7A1A] hover:text-[#FF8833] font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>{aiGenerating ? "Drafting..." : "Suggest Reply"}</span>
                  </button>
                )}
              </div>

              {/* Text Input Area */}
              {composerMode === "message" ? (
                <form onSubmit={handleSendMessage} className="space-y-2">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a WhatsApp reply... (Enter to send, Shift+Enter for new line)"
                    rows={2}
                    className="w-full p-2.5 text-xs bg-[#FAF9F6] border border-[#E4E4E7] rounded-lg text-[#0D0D0E] placeholder:text-[#717680] outline-none focus:border-[#FF7A1A] resize-none"
                  />

                  <div className="flex items-center justify-between">
                    {/* Quick Reply Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto custom-light-scroll pb-0.5">
                      {["Schedule Demo", "Pricing Retainer", "Confirm Meeting"].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setMessageInput(`Hi! Sharing details regarding our ${chip} right away.`)}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#FAF9F6] text-[#525866] border border-[#E4E4E7] hover:bg-[#FFF4EC] hover:text-[#FF7A1A] transition-colors shrink-0 cursor-pointer"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={isSending}
                      disabled={!messageInput.trim()}
                      className="h-7.5 px-3 text-xs"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      <span>Send</span>
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSendNote} className="space-y-2">
                  <textarea
                    value={internalNoteInput}
                    onChange={(e) => setInternalNoteInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendNote();
                      }
                    }}
                    placeholder="Add an internal team note... (Visible only to workspace members)"
                    rows={2}
                    className="w-full p-2.5 text-xs bg-[#FEF9C3]/40 border border-[#FEF08A] rounded-lg text-[#713F12] placeholder:text-amber-800/60 outline-none focus:border-amber-400 resize-none"
                  />

                  <div className="flex items-center justify-end">
                    <Button
                      type="submit"
                      variant="secondary"
                      size="sm"
                      isLoading={isSending}
                      disabled={!internalNoteInput.trim()}
                      className="h-7.5 px-3 text-xs bg-amber-500 hover:bg-amber-600 text-white border-transparent"
                    >
                      <Lock className="h-3 w-3 mr-1" />
                      <span>Save Note</span>
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-[#717680]">
            Select a conversation to start messaging.
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* PANE 3: CONTACT CONTEXT & CRM DRAWER (320px)                          */}
      {/* ===================================================================== */}
      {rightPanelOpen && activeConversation && (
        <div className="hidden xl:flex w-[320px] 2xl:w-[340px] shrink-0 border-l border-[#E4E4E7] flex-col bg-white overflow-y-auto custom-light-scroll select-none">
          {/* Header */}
          <div className="p-3.5 border-b border-[#E4E4E7] flex items-center justify-between shrink-0">
            <span className="type-eyebrow text-[#717680]">Contact Context</span>
            <span className="text-[10px] text-[#717680]">CRM Synced</span>
          </div>

          <div className="p-4 space-y-5">
            {/* Contact Profile Summary */}
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-[#FAF9F6] border border-[#E4E4E7] text-[#0D0D0E] font-medium text-sm flex items-center justify-center mx-auto">
                {activeConversation.contact_name?.charAt(0) || "C"}
              </div>
              <div>
                <h3 className="text-xs font-medium text-[#0D0D0E]">
                  {activeConversation.contact_name}
                </h3>
                <p className="text-[11px] text-[#717680] mt-0.5">
                  {activeConversation.contact_phone}
                </p>
                {contact?.company && (
                  <p className="text-[11px] text-[#0D0D0E] font-medium mt-0.5">
                    {contact.company}
                  </p>
                )}
              </div>
            </div>

            {/* Associated Deal Section */}
            <div className="space-y-2 pt-2 border-t border-[#E4E4E7]">
              <div className="flex items-center justify-between">
                <span className="type-eyebrow text-[#717680]">Commercial Deal</span>
                {lead && (
                  <StatusPill variant="neutral" size="sm">
                    {lead.stage.toUpperCase()}
                  </StatusPill>
                )}
              </div>

              {lead ? (
                <div className="p-2.5 rounded-lg bg-[#FAF9F6] border border-[#E4E4E7] space-y-1">
                  <p className="text-xs font-medium text-[#0D0D0E]">{lead.title}</p>
                  <p className="text-xs font-medium text-emerald-600">
                    {formatCurrency(lead.estimated_value)}
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-[#717680]">
                  No commercial deal linked to this conversation.
                </p>
              )}
            </div>

            {/* Follow-up Tasks */}
            <div className="space-y-2 pt-2 border-t border-[#E4E4E7]">
              <div className="flex items-center justify-between">
                <span className="type-eyebrow text-[#717680]">Scheduled Tasks</span>
                <span className="text-[10px] text-[#717680]">{contactTasks.length} total</span>
              </div>

              <div className="space-y-1.5">
                {contactTasks.map((t: Task) => (
                  <div
                    key={t.id}
                    className="p-2 rounded bg-[#FAF9F6] border border-[#E4E4E7] text-xs space-y-0.5"
                  >
                    <span className="font-medium text-[#0D0D0E] block truncate">{t.title}</span>
                    <span className="text-[10px] text-[#717680] block">
                      Due: {formatDate(t.due_date)}
                    </span>
                  </div>
                ))}
                {contactTasks.length === 0 && (
                  <p className="text-[11px] text-[#717680]">No tasks scheduled.</p>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2 pt-2 border-t border-[#E4E4E7]">
              <span className="type-eyebrow text-[#717680]">Tags</span>
              <div className="flex flex-wrap gap-1">
                {(contact?.tags || ["Inbound Lead", "WhatsApp"]).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF9F6] border border-[#E4E4E7] text-[#525866]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Lead Modal */}
      <Dialog open={leadModalOpen} onOpenChange={setLeadModalOpen}>
        <form onSubmit={handleCreateLead} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium text-[#0D0D0E]">
              Create Deal for {activeConversation?.contact_name}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#717680]">
              Convert this active customer discussion into a tracked sales opportunity.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 my-4 text-xs">
            <Input
              label="Deal Title *"
              value={newLeadTitle}
              onChange={(e) => setNewLeadTitle(e.target.value)}
              required
              className="bg-[#FAF9F6] border-[#E4E4E7] text-xs"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Estimated Value (INR)"
                type="number"
                value={newLeadValue}
                onChange={(e) => setNewLeadValue(e.target.value)}
                className="bg-[#FAF9F6] border-[#E4E4E7] text-xs"
              />
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#0D0D0E]">Stage</label>
                <select
                  value={newLeadStage}
                  onChange={(e) => setNewLeadStage(e.target.value as LeadStage)}
                  className="w-full h-8.5 px-2.5 rounded-lg border border-[#E4E4E7] bg-[#FAF9F6] text-xs text-[#0D0D0E]"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="won">Won</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" size="sm" onClick={() => setLeadModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Deal
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Follow-up Task Modal */}
      <Dialog open={followUpModalOpen} onOpenChange={setFollowUpModalOpen}>
        <form onSubmit={handleCreateFollowUp} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium text-[#0D0D0E]">
              Schedule Follow-up Task
            </DialogTitle>
            <DialogDescription className="text-xs text-[#717680]">
              Create an operational reminder linked to this client thread.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 my-4 text-xs">
            <Input
              label="Task Title *"
              value={newFollowUpTitle}
              onChange={(e) => setNewFollowUpTitle(e.target.value)}
              required
              className="bg-[#FAF9F6] border-[#E4E4E7] text-xs"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Due Date"
                type="date"
                value={newFollowUpDate}
                onChange={(e) => setNewFollowUpDate(e.target.value)}
                className="bg-[#FAF9F6] border-[#E4E4E7] text-xs"
              />
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#0D0D0E]">Priority</label>
                <select
                  value={newFollowUpPriority}
                  onChange={(e) => setNewFollowUpPriority(e.target.value as TaskPriority)}
                  className="w-full h-8.5 px-2.5 rounded-lg border border-[#E4E4E7] bg-[#FAF9F6] text-xs text-[#0D0D0E]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" size="sm" onClick={() => setFollowUpModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Schedule Task
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* AI Summary Modal */}
      <Dialog open={aiSummaryOpen} onOpenChange={setAiSummaryOpen}>
        <div className="max-w-md p-1 space-y-3">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium text-[#0D0D0E] flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#FF7A1A]" />
              <span>Thread Executive Summary</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#717680]">
              AI synthesized overview of discussion key points and recommended next actions.
            </DialogDescription>
          </DialogHeader>

          {aiSummary && (
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#FAF9F6] rounded-lg border border-[#E4E4E7] leading-relaxed">
                {aiSummary.summary}
              </div>
              {aiSummary.suggestedNextSteps && aiSummary.suggestedNextSteps.length > 0 && (
                <div className="space-y-1">
                  <span className="type-eyebrow text-[#717680]">Suggested Next Steps:</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-[#0D0D0E]">
                    {aiSummary.suggestedNextSteps.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setAiSummaryOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-130px)] flex items-center justify-center text-xs text-[#717680]">
          Loading Shared Inbox...
        </div>
      }
    >
      <InboxContent />
    </Suspense>
  );
}
