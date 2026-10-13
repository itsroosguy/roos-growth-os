"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTenant } from "@/lib/organizations/tenant-context";
import { whatsappStore, ConversationFilters } from "@/lib/whatsapp/whatsapp-store";
import { crmStore } from "@/lib/crm/crm-store";
import { teamStore, TeamMember } from "@/lib/team/team-store";
import {
  WhatsAppConversation,
  WhatsAppMessage,
  ConversationStatus,
  ConversationActivity,
} from "@/lib/whatsapp/types";
import { MOCK_TEMPLATES } from "@/lib/whatsapp/mock-provider";
import { LeadStage, TaskPriority } from "@/types/crm";
import { aiService } from "@/lib/ai/ai-service";
import { ReplySuggestionResult, ConversationSummaryResult } from "@/lib/ai/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  MessageSquare,
  Send,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  User,
  Phone,
  Building2,
  Sparkles,
  Bot,
  FileText,
  Wand2,
  Copy,
  Search,
  Filter,
  UserCheck,
  UserX,
  Lock,
  ArrowRight,
  Plus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Tag,
  Mail,
  RefreshCw,
  ExternalLink,
  Star,
  MoreVertical,
  Paperclip,
  Smile,
  ChevronDown,
  CheckSquare,
  Activity as ActivityIcon,
  PhoneCall,
} from "lucide-react";
import Link from "next/link";

const STATUS_CONFIG: Record<
  ConversationStatus,
  { label: string; badgeVariant: "default" | "success" | "warning" | "danger" | "neutral"; colorClass: string }
> = {
  open: { label: "Open", badgeVariant: "success", colorClass: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  pending: { label: "Pending", badgeVariant: "warning", colorClass: "text-amber-700 bg-amber-50 border-amber-200" },
  resolved: { label: "Resolved", badgeVariant: "neutral", colorClass: "text-slate-600 bg-slate-50 border-slate-200" },
  closed: { label: "Closed", badgeVariant: "neutral", colorClass: "text-slate-600 bg-slate-50 border-slate-200" },
  snoozed: { label: "Snoozed", badgeVariant: "warning", colorClass: "text-amber-700 bg-amber-50 border-amber-200" },
};

const LEAD_STAGES: Array<{ id: LeadStage; title: string }> = [
  { id: "new", title: "New" },
  { id: "contacted", title: "Contacted" },
  { id: "qualified", title: "Qualified" },
  { id: "proposal", title: "Proposal" },
  { id: "won", title: "Won" },
  { id: "lost", title: "Lost" },
];

function InboxContent() {
  const { currentOrg, userRole, isAdmin } = useTenant();
  const orgSlug = currentOrg.slug;
  const searchParams = useSearchParams();
  const contactIdParam = searchParams.get("contactId");
  const phoneParam = searchParams.get("phone");

  const [refreshKey, setRefreshKey] = useState(0);
  const [activeConversationId, setActiveConversationId] = useState<string>("conv-102");

  // Filters state
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Mobile layout tab switcher: "list" | "chat" | "details"
  const [mobileTab, setMobileTab] = useState<"list" | "chat" | "details">("list");

  // Right panel context tab switcher: "contact" | "deal" | "tasks" | "activity"
  const [contextTab, setContextTab] = useState<"contact" | "deal" | "tasks" | "activity">("contact");

  // Composer mode: "message" (WhatsApp outbound) | "note" (Private internal team note)
  const [composerMode, setComposerMode] = useState<"message" | "note">("message");
  const [messageInput, setMessageInput] = useState("");
  const [internalNoteInput, setInternalNoteInput] = useState("");
  const [selectedTemplateName, setSelectedTemplateName] = useState(MOCK_TEMPLATES[0].name);
  const [isSending, setIsSending] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  // Mock Inbound Simulator state
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simInboundPhone, setSimInboundPhone] = useState("+919876543210");
  const [simInboundName, setSimInboundName] = useState("Aarav Patel");
  const [simInboundText, setSimInboundText] = useState("Hi! What are your pricing plans for WhatsApp CRM?");

  // AI Assistant Copilot state
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<ReplySuggestionResult | null>(null);
  const [aiSummaryOpen, setAiSummaryOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState<ConversationSummaryResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Team members list
  const teamMembers = useMemo(() => {
    return teamStore.getTeamMembers(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  // Current staff user mock identity (for attribution)
  const currentStaffUser = useMemo(() => {
    if (userRole === "owner") return teamMembers.find((m) => m.role === "owner") || teamMembers[0];
    if (userRole === "admin") return teamMembers.find((m) => m.role === "admin") || teamMembers[0];
    return teamMembers.find((m) => m.role === "staff") || teamMembers[0];
  }, [teamMembers, userRole]);

  // Sync URL search params to select or create conversation for targeted contact
  useEffect(() => {
    if (contactIdParam) {
      try {
        const conv = whatsappStore.getOrCreateConversationForContact(orgSlug, contactIdParam);
        if (conv) {
          setActiveConversationId(conv.id);
          setMobileTab("chat");
        }
      } catch (err) {
        console.error("Could not find or create conversation for contact:", err);
      }
    } else if (phoneParam) {
      const allConvs = whatsappStore.getConversations(orgSlug);
      const match = allConvs.find((c) => c.contact_phone === phoneParam);
      if (match) {
        setActiveConversationId(match.id);
        setMobileTab("chat");
      }
    }
  }, [contactIdParam, phoneParam, orgSlug]);

  // Filtered conversations
  const conversations = useMemo(() => {
    return whatsappStore.getFilteredConversations(orgSlug, {
      status: statusFilter,
      assigneeId: assigneeFilter,
      currentUserId: currentStaffUser?.id,
      unreadOnly,
      search: searchQuery,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, statusFilter, assigneeFilter, currentStaffUser?.id, unreadOnly, searchQuery, refreshKey]);

  // Active conversation
  const activeConversation = useMemo(() => {
    if (!activeConversationId && conversations.length > 0) {
      return conversations[0];
    }
    const found = conversations.find((c) => c.id === activeConversationId);
    if (found) return found;
    // Fall back to looking in all conversations
    const anyInOrg = whatsappStore.getConversationById(orgSlug, activeConversationId);
    return anyInOrg || conversations[0] || null;
  }, [conversations, activeConversationId, orgSlug]);

  // Messages in active conversation
  const messages = useMemo(() => {
    if (!activeConversation) return [];
    return whatsappStore.getMessages(activeConversation.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation, refreshKey]);

  // Activities for active conversation
  const activities = useMemo(() => {
    if (!activeConversation) return [];
    return whatsappStore.getConversationActivities(activeConversation.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation, refreshKey]);

  // 24-hour customer window calculation
  const windowStatus = useMemo(() => {
    if (!activeConversation) return { allowed: false, hoursRemaining: 0 };
    return whatsappStore.isWithin24HourWindow(activeConversation);
  }, [activeConversation]);

  // Associated contact details
  const contact = useMemo(() => {
    if (!activeConversation) return null;
    return crmStore.getContactById(orgSlug, activeConversation.contact_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation, orgSlug, refreshKey]);

  // Associated lead details
  const lead = useMemo(() => {
    if (!activeConversation) return null;
    if (activeConversation.lead_id) {
      return crmStore.getLeadById(orgSlug, activeConversation.lead_id);
    }
    // Check if there is any lead associated with this contact
    const contactLeads = crmStore.getLeads(orgSlug).filter((l) => l.contact_id === activeConversation.contact_id);
    return contactLeads[0] || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation, orgSlug, refreshKey]);

  // All org leads for linking dropdown
  const orgLeads = useMemo(() => {
    return crmStore.getLeads(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  // Tasks for this contact/lead
  const contactTasks = useMemo(() => {
    if (!activeConversation) return [];
    return crmStore.getTasks(orgSlug).filter((t) => t.contact_id === activeConversation.contact_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation, orgSlug, refreshKey]);

  // Status counts for header chips
  const counts = useMemo(() => {
    const all = whatsappStore.getConversations(orgSlug);
    return {
      all: all.length,
      open: all.filter((c) => c.status === "open").length,
      pending: all.filter((c) => c.status === "pending").length,
      resolved: all.filter((c) => c.status === "resolved").length,
      unassigned: all.filter((c) => !c.assigned_to_user_id && !c.assigned_to_name).length,
      unread: all.filter((c) => c.unread_count > 0).length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  // Handlers
  const handleSelectConversation = (conv: WhatsAppConversation) => {
    setActiveConversationId(conv.id);
    setMobileTab("chat");
    setFeedbackMessage(null);
    // Auto mark as read when opened
    if (conv.unread_count > 0) {
      whatsappStore.markConversationRead(orgSlug, conv.id);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleStatusChange = (newStatus: ConversationStatus) => {
    if (!activeConversation) return;
    const staffName = currentStaffUser?.name || "Staff Member";
    whatsappStore.updateConversationStatus(orgSlug, activeConversation.id, newStatus, staffName);
    setFeedbackMessage({ type: "success", text: `Conversation status updated to ${newStatus.toUpperCase()}` });
    setRefreshKey((k) => k + 1);
  };

  const handleAssigneeChange = (memberId: string) => {
    if (!activeConversation) return;
    const staffName = currentStaffUser?.name || "Staff Member";
    if (memberId === "unassigned") {
      whatsappStore.assignConversation(orgSlug, activeConversation.id, { userId: null, name: null }, staffName);
      setFeedbackMessage({ type: "success", text: "Conversation left unassigned" });
    } else {
      const targetMember = teamMembers.find((m) => m.id === memberId);
      if (targetMember) {
        whatsappStore.assignConversation(
          orgSlug,
          activeConversation.id,
          { userId: targetMember.id, name: targetMember.name },
          staffName
        );
        setFeedbackMessage({ type: "success", text: `Assigned conversation to ${targetMember.name}` });
      }
    }
    setRefreshKey((k) => k + 1);
  };

  const handleToggleRead = () => {
    if (!activeConversation) return;
    if (activeConversation.unread_count > 0) {
      whatsappStore.markConversationRead(orgSlug, activeConversation.id);
    } else {
      whatsappStore.markConversationUnread(orgSlug, activeConversation.id);
    }
    setRefreshKey((k) => k + 1);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation) return;
    setFeedbackMessage(null);

    if (composerMode === "note") {
      // Internal Note dispatch (Strictly local, NEVER sent to customer)
      if (!internalNoteInput.trim()) return;
      whatsappStore.addInternalNote(
        orgSlug,
        activeConversation.id,
        internalNoteInput.trim(),
        currentStaffUser?.name || "Staff Member",
        currentStaffUser?.id
      );
      setInternalNoteInput("");
      setFeedbackMessage({ type: "success", text: "Internal team note posted (hidden from customer)" });
      setRefreshKey((k) => k + 1);
      return;
    }

    // Outbound WhatsApp dispatch
    if (windowStatus.allowed && !messageInput.trim()) return;

    setIsSending(true);

    const payload = windowStatus.allowed
      ? {
          toPhone: activeConversation.contact_phone,
          type: "text" as const,
          text: messageInput.trim(),
          staffName: currentStaffUser?.name || "Staff Member",
          staffUserId: currentStaffUser?.id,
        }
      : {
          toPhone: activeConversation.contact_phone,
          type: "template" as const,
          templateName: selectedTemplateName,
          templateVariables: {
            "1": activeConversation.contact_name,
            "2": currentOrg.name,
          },
          staffName: currentStaffUser?.name || "Staff Member",
          staffUserId: currentStaffUser?.id,
        };

    const result = await whatsappStore.sendOutboundMessage(orgSlug, activeConversation.id, payload);
    setIsSending(false);

    if (!result.success) {
      setFeedbackMessage({ type: "error", text: result.errorMessage || "Message dispatch failed." });
    } else {
      setMessageInput("");
      setFeedbackMessage({
        type: "success",
        text: result.isSimulated
          ? "Simulated message dispatched [MOCK MODE]"
          : "Message sent via official Meta Cloud API",
      });
      setRefreshKey((k) => k + 1);
    }
  };

  const handleGenerateAIReply = async () => {
    if (!activeConversation) return;
    setAiGenerating(true);
    setAiError(null);
    try {
      const activeMsgs = whatsappStore.getMessages(activeConversation.id);
      const lastCustMsg =
        [...activeMsgs].reverse().find((m) => m.sender_type === "customer")?.body ||
        "Hello! I am interested in your services.";

      const res = await aiService.generateReplySuggestion({
        orgSlug,
        customerName: activeConversation.contact_name,
        incomingMessage: lastCustMsg,
        recentMessages: activeMsgs.slice(-5).map((m) => ({
          sender: m.sender_type,
          text: m.body,
        })),
      });
      setAiSuggestion(res);
    } catch (err: any) {
      setAiError(err?.message || "Failed to generate AI suggestion");
      setTimeout(() => setAiError(null), 4000);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleRewrite = async (style: "shorter" | "friendlier" | "more_professional") => {
    if (!messageInput.trim()) return;
    setAiGenerating(true);
    try {
      const res = await aiService.rewriteDraft({
        orgSlug,
        draftText: messageInput,
        targetStyle: style,
      });
      setMessageInput(res.rewrittenText);
    } catch (err: any) {
      setAiError(err?.message || "Draft rewrite failed");
      setTimeout(() => setAiError(null), 4000);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSummarize = async () => {
    if (!activeConversation) return;
    setAiGenerating(true);
    try {
      const activeMsgs = whatsappStore.getMessages(activeConversation.id);
      const res = await aiService.summarizeConversation({
        orgSlug,
        customerName: activeConversation.contact_name,
        messages: activeMsgs.map((m) => ({
          sender: m.sender_type,
          text: m.body,
          timestamp: m.created_at,
        })),
      });
      setAiSummary(res);
      setAiSummaryOpen(true);
    } catch (err: any) {
      setAiError(err?.message || "Summary generation failed");
      setTimeout(() => setAiError(null), 4000);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleInsertAISuggestion = () => {
    if (!aiSuggestion) return;
    setMessageInput(aiSuggestion.suggestionText);
    setAiSuggestion(null);
  };

  const handleSimulateInbound = () => {
    if (!simInboundText.trim()) return;

    const mockId = `mock_wamid_sim_${Date.now()}`;
    const result = whatsappStore.processInboundMessage(orgSlug, {
      externalMessageId: mockId,
      fromPhone: simInboundPhone,
      senderName: simInboundName,
      body: simInboundText.trim(),
      isSimulated: true,
    });

    if (result.duplicate) {
      alert("Simulated duplicate detected: rejected by idempotency filter.");
    } else {
      setFeedbackMessage({ type: "success", text: `Inbound inquiry simulated from ${simInboundName}` });
      setRefreshKey((k) => k + 1);
    }
  };

  const handleLinkLead = (leadId: string) => {
    if (!activeConversation) return;
    const staffName = currentStaffUser?.name || "Staff Member";
    whatsappStore.linkConversationLead(orgSlug, activeConversation.id, leadId === "none" ? null : leadId, staffName);
    setFeedbackMessage({ type: "success", text: "Conversation lead association updated" });
    setRefreshKey((k) => k + 1);
  };

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation || !contact || !newLeadTitle.trim()) return;

    const created = crmStore.createLead(orgSlug, {
      contact_id: contact.id,
      contact_name: `${contact.first_name} ${contact.last_name || ""}`.trim(),
      contact_phone: contact.phone,
      title: newLeadTitle.trim(),
      stage: newLeadStage,
      estimated_value: parseFloat(newLeadValue) || 0,
      currency: "INR",
      source: "WhatsApp Shared Inbox",
    });

    const staffName = currentStaffUser?.name || "Staff Member";
    whatsappStore.linkConversationLead(orgSlug, activeConversation.id, created.id, staffName);
    setLeadModalOpen(false);
    setNewLeadTitle("");
    setFeedbackMessage({ type: "success", text: `New deal "${created.title}" created & linked` });
    setRefreshKey((k) => k + 1);
  };

  const handleUpdateLeadStage = (newStage: LeadStage) => {
    if (!lead) return;
    crmStore.updateLeadStage(orgSlug, lead.id, newStage);
    setFeedbackMessage({ type: "success", text: `Deal stage updated to ${newStage.toUpperCase()}` });
    setRefreshKey((k) => k + 1);
  };

  const handleCreateFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation || !contact || !newFollowUpTitle.trim()) return;

    crmStore.createTask(orgSlug, {
      contact_id: contact.id,
      contact_name: `${contact.first_name} ${contact.last_name || ""}`.trim(),
      lead_id: lead?.id,
      lead_title: lead?.title,
      assigned_to_name: currentStaffUser?.name || "Staff Member",
      title: newFollowUpTitle.trim(),
      description: "Scheduled via WhatsApp Shared Inbox",
      due_date: new Date(newFollowUpDate).toISOString(),
      priority: newFollowUpPriority,
      status: "todo",
    });

    setFollowUpModalOpen(false);
    setFeedbackMessage({ type: "success", text: `Follow-up scheduled for ${newFollowUpDate}` });
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              WhatsApp Shared Inbox
            </h1>
            <span className="glass-pill px-2.5 py-0.5 text-[10px] font-semibold text-blue-700 bg-blue-50/80 border-blue-200/60 shadow-xs">
              Live Team Collaboration
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-agent customer communication, shared WhatsApp inbox, private notes & CRM sync.
          </p>
        </div>

        {/* Quick Actions & Status */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setSimulatorOpen(!simulatorOpen)}
            className="glass-pill h-8 text-xs text-blue-700 border-white/80 hover:bg-white/80 transition-all shadow-xs flex items-center gap-1.5"
          >
            <Bot className="h-3.5 w-3.5 text-blue-600" />
            <span>{simulatorOpen ? "Hide Simulator" : "Mock Webhook Simulator"}</span>
          </Button>

          <Link href={`/app/${orgSlug}/whatsapp`}>
            <Button size="sm" variant="ghost" className="glass-pill h-8 text-xs text-slate-600 hover:text-slate-900 hover:bg-white/70 transition-all flex items-center gap-1.5 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>WhatsApp Settings</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Simulator Tray (Collapsible) */}
      {simulatorOpen && (
        <div className="glass-card p-4 bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-blue-600" />
              <h3 className="text-xs font-semibold text-blue-700">
                Interactive Mock Inbound Message Simulator
              </h3>
            </div>
            <span className="text-[11px] text-slate-500">
              Zero-cost testing • Simulates incoming customer webhooks without Meta credentials
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">
                From Phone (E.164)
              </label>
              <Input
                value={simInboundPhone}
                onChange={(e) => setSimInboundPhone(e.target.value)}
                placeholder="+919876543210"
                className="h-8 text-xs font-mono glass-input bg-white/80"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">
                Sender Name
              </label>
              <Input
                value={simInboundName}
                onChange={(e) => setSimInboundName(e.target.value)}
                placeholder="Aarav Patel"
                className="h-8 text-xs glass-input bg-white/80"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">
                Message Text
              </label>
              <div className="flex gap-2">
                <Input
                  value={simInboundText}
                  onChange={(e) => setSimInboundText(e.target.value)}
                  placeholder="Inquiry text..."
                  className="h-8 text-xs flex-1 glass-input bg-white/80"
                />
                <Button
                  size="sm"
                  onClick={handleSimulateInbound}
                  className="h-8 text-xs bg-blue-600 text-white hover:bg-blue-700 shrink-0 shadow-xs"
                >
                  Fire Webhook
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile View Switcher Tabs */}
      <div className="flex md:hidden rounded-2xl bg-white/60 backdrop-blur-md p-1 border border-white/70 shadow-xs">
        <button
          onClick={() => setMobileTab("list")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-xl transition-all ${
            mobileTab === "list" ? "bg-white text-blue-600 shadow-sm font-semibold" : "text-slate-600"
          }`}
        >
          Conversations ({conversations.length})
        </button>
        <button
          onClick={() => setMobileTab("chat")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-xl transition-all ${
            mobileTab === "chat" ? "bg-white text-blue-600 shadow-sm font-semibold" : "text-slate-600"
          }`}
        >
          Active Chat
        </button>
        <button
          onClick={() => setMobileTab("details")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-xl transition-all ${
            mobileTab === "details" ? "bg-white text-blue-600 shadow-sm font-semibold" : "text-slate-600"
          }`}
        >
          CRM Context
        </button>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-3 rounded-2xl text-xs flex items-center justify-between border ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50/80 border-emerald-200 text-emerald-800"
              : "bg-rose-50/80 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-[11px] underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main 3-Column Responsive Inbox Grid */}
      <div className="glass-panel rounded-[26px] border border-white/70 shadow-glass overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[760px] max-h-[calc(100vh-140px)]">
        {/* ==================================================================== */}
        {/* LEFT PANEL: Conversation List (3 Cols) */}
        {/* ==================================================================== */}
        <div
          className={`md:col-span-3 lg:col-span-3 border-r border-white/60 flex flex-col bg-white/40 backdrop-blur-xl overflow-hidden ${
            mobileTab !== "list" ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Search & Filter Header */}
          <div className="p-3.5 border-b border-white/60 space-y-2.5 bg-white/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Inbox</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100/80 text-blue-700 border border-blue-200/50">
                  {counts.all}
                </span>
              </div>
              <button
                onClick={() => { setStatusFilter("all"); setAssigneeFilter("all"); setUnreadOnly(false); setSearchQuery(""); }}
                className="p-1.5 rounded-xl hover:bg-white/80 text-slate-400 hover:text-slate-700 transition-colors"
                title="Reset filters"
              >
                <Filter className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Row 1 Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              <button
                onClick={() => { setStatusFilter("all"); setAssigneeFilter("all"); setUnreadOnly(false); }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                  statusFilter === "all" && assigneeFilter === "all" && !unreadOnly
                    ? "bg-blue-600 text-white shadow-xs font-semibold"
                    : "bg-white/70 hover:bg-white text-slate-600 border border-white/80"
                }`}
              >
                All {counts.all}
              </button>
              <button
                onClick={() => { setAssigneeFilter("unassigned"); setStatusFilter("all"); setUnreadOnly(false); }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                  assigneeFilter === "unassigned"
                    ? "bg-blue-600 text-white shadow-xs font-semibold"
                    : "bg-white/70 hover:bg-white text-slate-600 border border-white/80"
                }`}
              >
                Unassigned {counts.unassigned}
              </button>
              <button
                onClick={() => { setAssigneeFilter(currentStaffUser?.id || "me"); setStatusFilter("all"); setUnreadOnly(false); }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                  assigneeFilter === currentStaffUser?.id || assigneeFilter === "me"
                    ? "bg-blue-600 text-white shadow-xs font-semibold"
                    : "bg-white/70 hover:bg-white text-slate-600 border border-white/80"
                }`}
              >
                Mine {Math.max(0, counts.all - counts.unassigned)}
              </button>
              <button
                onClick={() => setUnreadOnly(!unreadOnly)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                  unreadOnly
                    ? "bg-blue-600 text-white shadow-xs font-semibold"
                    : "bg-white/70 hover:bg-white text-slate-600 border border-white/80"
                }`}
              >
                Unread {counts.unread}
              </button>
            </div>

            {/* Row 2 Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => { setStatusFilter("open"); setAssigneeFilter("all"); setUnreadOnly(false); }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                  statusFilter === "open"
                    ? "bg-emerald-600 text-white shadow-xs font-semibold"
                    : "bg-white/70 hover:bg-white text-slate-600 border border-white/80"
                }`}
              >
                Open {counts.open}
              </button>
              <button
                onClick={() => { setStatusFilter("pending"); setAssigneeFilter("all"); setUnreadOnly(false); }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                  statusFilter === "pending"
                    ? "bg-amber-600 text-white shadow-xs font-semibold"
                    : "bg-white/70 hover:bg-white text-slate-600 border border-white/80"
                }`}
              >
                Pending {counts.pending}
              </button>
              <button
                onClick={() => { setStatusFilter("resolved"); setAssigneeFilter("all"); setUnreadOnly(false); }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                  statusFilter === "resolved"
                    ? "bg-slate-700 text-white shadow-xs font-semibold"
                    : "bg-white/70 hover:bg-white text-slate-600 border border-white/80"
                }`}
              >
                Resolved {counts.resolved}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative pt-0.5">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, phone, message..."
                className="pl-8.5 h-8 text-xs bg-white/70 backdrop-blur-sm border-white/80 focus:bg-white rounded-xl shadow-xs"
              />
            </div>
          </div>

          {/* Conversation Cards Scroll List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 divide-none">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-700">No conversations match</p>
                <p className="text-[11px] mt-1 text-slate-400">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              conversations.map((c) => {
                const isActive = activeConversation?.id === c.id;
                const statusCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.open;
                const initials = c.contact_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectConversation(c)}
                    className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                      isActive
                        ? "bg-white/95 border-blue-400/60 shadow-sm ring-1 ring-blue-400/20"
                        : "bg-white/50 hover:bg-white/85 border-white/60 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 font-bold flex items-center justify-center text-xs shadow-xs border border-white">
                            {initials}
                          </div>
                          {c.unread_count > 0 && (
                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow-xs ring-2 ring-white">
                              {c.unread_count}
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-slate-900 leading-tight">
                            {c.contact_name}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {c.contact_phone}
                          </span>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {formatDate(c.last_message_at)}
                        </span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold border ${statusCfg.colorClass}`}
                        >
                          {statusCfg.label}
                        </span>
                      </div>
                    </div>

                    <p className="mt-2 text-[11px] text-slate-600 line-clamp-1 leading-snug">
                      {c.last_message_text}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100/80">
                      <div className="flex items-center gap-1">
                        {c.assigned_to_name ? (
                          <span className="inline-flex items-center gap-1 text-blue-700 font-medium">
                            <UserCheck className="h-3 w-3" />
                            {c.assigned_to_name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                            <UserX className="h-3 w-3" />
                            Unassigned
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[9px]">WhatsApp</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ==================================================================== */}
        {/* CENTER PANEL: Active Conversation & Smart Composer (6 Cols) */}
        {/* ==================================================================== */}
        <div
          className={`md:col-span-6 lg:col-span-6 flex flex-col bg-white/35 backdrop-blur-xl border-r border-white/60 overflow-hidden ${
            mobileTab !== "chat" ? "hidden md:flex" : "flex"
          }`}
        >
          {activeConversation ? (
            <>
              {/* Conversation Header */}
              <div className="p-3.5 border-b border-white/60 bg-white/50 backdrop-blur-md space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-200 text-blue-800 font-bold flex items-center justify-center text-sm shadow-xs border border-white">
                        {activeConversation.contact_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-500/20" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-sm font-bold text-slate-900">
                          {activeConversation.contact_name}
                        </h2>
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {contact?.company ? `${contact.company} • ` : ""}{activeConversation.contact_phone}
                      </span>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-1.5">
                    {/* Status Dropdown Pill */}
                    <div className="relative">
                      <select
                        value={activeConversation.status}
                        onChange={(e) => handleStatusChange(e.target.value as ConversationStatus)}
                        className="appearance-none glass-pill bg-white/80 border-white/80 px-2.5 py-1 pr-6 rounded-full text-xs font-semibold text-slate-800 shadow-xs focus:outline-none cursor-pointer"
                      >
                        <option value="open">Open</option>
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-2 h-3 w-3 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Assignee Dropdown Pill */}
                    <div className="relative">
                      <select
                        value={activeConversation.assigned_to_name || "unassigned"}
                        onChange={(e) => handleAssigneeChange(e.target.value)}
                        className="appearance-none glass-pill bg-white/80 border-white/80 px-2.5 py-1 pr-6 rounded-full text-xs text-slate-700 shadow-xs focus:outline-none cursor-pointer"
                      >
                        <option value="unassigned">Assign</option>
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-2 h-3 w-3 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Phone Call Button */}
                    <button
                      onClick={() => setFeedbackMessage({ type: "success", text: `Calling ${activeConversation.contact_phone}...` })}
                      className="p-1.5 rounded-xl bg-white/70 hover:bg-white text-slate-600 hover:text-slate-900 border border-white/80 shadow-xs transition-colors"
                      title="Call Contact"
                    >
                      <PhoneCall className="h-3.5 w-3.5 text-blue-600" />
                    </button>

                    {/* Toggle Read */}
                    <button
                      onClick={handleToggleRead}
                      className="p-1.5 rounded-xl bg-white/70 hover:bg-white text-slate-600 hover:text-slate-900 border border-white/80 shadow-xs transition-colors"
                      title={activeConversation.unread_count > 0 ? "Mark as Read" : "Mark as Unread"}
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setMobileTab("details")}
                      className="md:hidden text-xs text-blue-600"
                    >
                      Context &gt;
                    </Button>
                  </div>
                </div>
              </div>

              {/* 24-Hour Policy Notice */}
              {windowStatus.allowed ? (
                <div className="bg-emerald-50/70 px-4 py-1.5 border-b border-emerald-100 text-[11px] text-emerald-800 flex items-center justify-between backdrop-blur-sm">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Inside 24-Hour Customer Service Window ({windowStatus.hoursRemaining} hours remaining)
                  </span>
                  <span className="text-[10px] text-emerald-700/80">Free-text replies allowed</span>
                </div>
              ) : (
                <div className="bg-amber-50/80 p-2 px-4 border-b border-amber-200/60 text-[11px] text-amber-800 flex items-center justify-between backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>
                      Meta 24h Customer Window Expired: Free-text blocked. Select an approved template to re-engage.
                    </span>
                  </div>
                </div>
              )}

              {/* Chronological Message History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white/20 backdrop-blur-sm">
                {/* Centered Date Separator */}
                <div className="flex justify-center my-2">
                  <span className="glass-pill px-3 py-1 rounded-full text-[11px] font-medium text-slate-600 bg-white/80 border-white/90 shadow-xs">
                    Today, 11 Oct 2026
                  </span>
                </div>

                {messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No messages yet in this conversation.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isStaff = m.sender_type === "staff";
                    const isInternal = m.is_internal || m.sender_type === "internal_note";

                    // 1. Internal Note rendering
                    if (isInternal) {
                      return (
                        <div
                          key={m.id}
                          className="my-3 p-3.5 rounded-2xl bg-[#FFF7ED]/95 backdrop-blur-md border border-amber-300/70 text-xs shadow-xs"
                        >
                          <div className="flex items-center justify-between text-[11px] text-amber-900 font-bold mb-1">
                            <span className="flex items-center gap-1.5">
                              <Lock className="h-3 w-3 text-amber-600" />
                              Private Team Note • {m.sender_name || "Operations Lead"}
                            </span>
                            <span className="text-amber-700 font-normal">{formatDate(m.created_at)}</span>
                          </div>
                          <p className="text-amber-950 leading-relaxed whitespace-pre-wrap">
                            {m.body}
                          </p>
                          <span className="text-[9px] text-amber-700/80 block mt-1.5 font-medium">
                            Visible only to workspace team members • Never sent to WhatsApp customer
                          </span>
                        </div>
                      );
                    }

                    // 2. Outbound Staff WhatsApp Message
                    if (isStaff) {
                      return (
                        <div key={m.id} className="flex flex-col items-end">
                          <div className="max-w-[82%] rounded-2xl rounded-tr-xs bg-[#DCF8C6]/95 backdrop-blur-md text-slate-900 border border-emerald-200/60 p-3.5 text-xs shadow-xs">
                            <div className="flex items-center justify-between gap-3 text-[10px] text-emerald-900 mb-1 font-semibold">
                              <span>{m.sender_name || "Staff"}</span>
                              {m.is_simulated && (
                                <span className="bg-emerald-200/70 px-1.5 py-0.2 rounded text-[9px] font-mono text-emerald-900 border border-emerald-300/50">
                                  [SIMULATED]
                                </span>
                              )}
                            </div>
                            <p className="leading-relaxed whitespace-pre-wrap text-slate-900">{m.body}</p>
                            <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-emerald-800">
                              <span>{formatDate(m.created_at)}</span>
                              <CheckCheck className="h-3.5 w-3.5 text-blue-600" />
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // 3. Inbound Customer Message
                    return (
                      <div key={m.id} className="flex flex-col items-start">
                        <div className="max-w-[82%] rounded-2xl rounded-tl-xs bg-white/95 backdrop-blur-md border border-white/90 p-3.5 text-xs text-slate-900 shadow-xs">
                          <div className="flex items-center justify-between gap-3 text-[10px] text-slate-500 mb-1">
                            <span className="font-semibold text-slate-900">
                              {m.sender_name || activeConversation.contact_name}
                            </span>
                            <span>{formatDate(m.created_at)}</span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap text-slate-900">{m.body}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Smart Dual-Mode Composer */}
              <div className="p-3 border-t border-white/60 bg-white/60 backdrop-blur-md space-y-2">
                {/* Mode Selector Tabs */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-white/70 p-0.5 rounded-xl border border-white/80 shadow-xs">
                    <button
                      type="button"
                      onClick={() => setComposerMode("message")}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        composerMode === "message"
                          ? "bg-white text-emerald-700 font-bold shadow-xs border border-white"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      WhatsApp Message
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposerMode("note")}
                      className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                        composerMode === "note"
                          ? "bg-white text-amber-800 font-bold shadow-xs border border-white"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Lock className="h-3 w-3" />
                      Internal Note
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-500">
                    Posting as <strong>{currentStaffUser?.name || "Staff"}</strong>
                  </span>
                </div>

                {/* AI Copilot Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl bg-white/70 border border-white/80 shadow-xs text-xs">
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateAIReply}
                      disabled={aiGenerating}
                      className="h-7 text-xs bg-white text-blue-700 border-white/90 hover:bg-blue-50 shadow-xs"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1 text-blue-600" />
                      {aiGenerating ? "Generating..." : "Suggest Reply"}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSummarize}
                      disabled={aiGenerating}
                      className="h-7 text-xs text-slate-600 hover:text-slate-900"
                    >
                      <FileText className="h-3.5 w-3.5 mr-1" />
                      Summarise
                    </Button>

                    {messageInput.trim() && (
                      <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-slate-200">
                        <span className="text-[10px] text-slate-400">Tone:</span>
                        <button
                          type="button"
                          onClick={() => handleRewrite("shorter")}
                          disabled={aiGenerating}
                          className="px-2 py-0.5 rounded-lg text-[11px] bg-white border border-white/80 hover:bg-slate-50 text-slate-600 shadow-xs"
                        >
                          Shorter
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRewrite("friendlier")}
                          disabled={aiGenerating}
                          className="px-2 py-0.5 rounded-lg text-[11px] bg-white border border-white/80 hover:bg-slate-50 text-slate-600 shadow-xs"
                        >
                          Friendlier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRewrite("more_professional")}
                          disabled={aiGenerating}
                          className="px-2 py-0.5 rounded-lg text-[11px] bg-white border border-white/80 hover:bg-slate-50 text-slate-600 shadow-xs"
                        >
                          Professional
                        </button>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 font-medium">
                    Grounded AI Copilot
                  </span>
                </div>

                {aiError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    {aiError}
                  </div>
                )}

                {/* AI Suggestion Review Card */}
                {aiSuggestion && (
                  <div className="p-3.5 rounded-2xl bg-blue-50/80 backdrop-blur-md border border-blue-200 space-y-2.5 text-xs animate-in fade-in shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px] font-semibold bg-blue-600 text-white">
                          AI Draft Suggestion
                        </Badge>
                        <span className="text-[10px] font-medium text-blue-700 font-mono">
                          {aiSuggestion.detectedIntent}
                        </span>
                      </div>
                      <Badge variant="neutral" className="text-[10px]">
                        Review before sending
                      </Badge>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-white/80 text-slate-900 text-xs leading-relaxed shadow-xs">
                      {aiSuggestion.suggestionText}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          onClick={handleInsertAISuggestion}
                          className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Insert into Composer
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(aiSuggestion.suggestionText)}
                          className="h-7 text-xs bg-white"
                        >
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          Copy
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleGenerateAIReply}
                          className="h-7 text-xs text-slate-600"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Regenerate
                        </Button>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAiSuggestion(null)}
                        className="h-7 text-xs text-slate-500 hover:text-slate-800"
                      >
                        Discard
                      </Button>
                    </div>
                  </div>
                )}

                {/* WhatsApp Outbound Form */}
                {composerMode === "message" ? (
                  contact?.consent_status === "opted_out" ? (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                      Customer has opted out of WhatsApp communication. Messaging is disabled by Meta policy.
                    </div>
                  ) : windowStatus.allowed ? (
                    <form onSubmit={handleSendMessage} className="space-y-2">
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder="Type reply to customer on WhatsApp..."
                          className="w-full rounded-2xl border border-white/80 bg-white/80 backdrop-blur-sm p-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-xs resize-none"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          Enter to send • Shift+Enter for newline
                        </span>
                        <Button
                          size="sm"
                          disabled={isSending || !messageInput.trim()}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5 px-4 rounded-xl shadow-xs"
                        >
                          <Send className="h-3 w-3" />
                          <span>{isSending ? "Sending..." : "Send Message"}</span>
                        </Button>
                      </div>
                    </form>
                  ) : (
                    /* Outside 24h window: Template Selector */
                    <form onSubmit={handleSendMessage} className="space-y-2">
                      <div className="p-3 rounded-2xl bg-white/70 border border-white/80 space-y-2 shadow-xs">
                        <label className="text-[11px] font-semibold text-slate-800 block">
                          Select Pre-Approved Meta WhatsApp Template:
                        </label>
                        <select
                          value={selectedTemplateName}
                          onChange={(e) => setSelectedTemplateName(e.target.value)}
                          className="w-full rounded-xl border border-white/80 bg-white p-2 text-xs text-slate-800 focus:outline-none shadow-xs"
                        >
                          {MOCK_TEMPLATES.map((t) => (
                            <option key={t.id} value={t.name}>
                              {t.name} ({t.category.toUpperCase()})
                            </option>
                          ))}
                        </select>
                        <div className="p-2.5 rounded-xl bg-white/90 border border-white/80 text-[11px] text-slate-600">
                          {MOCK_TEMPLATES.find((t) => t.name === selectedTemplateName)?.body_content
                            .replace("{{1}}", activeConversation.contact_name)
                            .replace("{{2}}", currentOrg.name)}
                        </div>
                      </div>

                      <div className="flex items-center justify-end">
                        <Button
                          size="sm"
                          disabled={isSending}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5 px-4 rounded-xl shadow-xs"
                        >
                          <Send className="h-3 w-3" />
                          <span>{isSending ? "Sending..." : "Send Approved Template"}</span>
                        </Button>
                      </div>
                    </form>
                  )
                ) : (
                  /* Internal Team Note Form */
                  <form onSubmit={handleSendMessage} className="space-y-2">
                    <textarea
                      rows={2}
                      value={internalNoteInput}
                      onChange={(e) => setInternalNoteInput(e.target.value)}
                      placeholder="Write a private note for your workspace team (never sent to customer)..."
                      className="w-full rounded-2xl border border-amber-300/60 bg-[#FFF7ED]/80 backdrop-blur-sm p-3 text-xs text-amber-950 focus:outline-none focus:ring-1 focus:ring-amber-400 shadow-xs resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-amber-800 font-medium flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Private note • Stored only in workspace
                      </span>
                      <Button
                        size="sm"
                        disabled={!internalNoteInput.trim()}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs flex items-center gap-1.5 px-4 rounded-xl shadow-xs"
                      >
                        <Lock className="h-3 w-3" />
                        <span>Post Internal Note</span>
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-slate-400">
              Select a conversation to start messaging.
            </div>
          )}
        </div>

        {/* ==================================================================== */}
        {/* RIGHT PANEL: Contact Context & CRM Synchronization (3 Cols) */}
        {/* ==================================================================== */}
        <div
          className={`md:col-span-3 lg:col-span-3 flex flex-col bg-white/45 backdrop-blur-xl overflow-y-auto p-4 space-y-3.5 ${
            mobileTab !== "details" ? "hidden md:flex" : "flex"
          }`}
        >
          {activeConversation && contact ? (
            <>
              {/* Segmented Top Tabs */}
              <div className="flex items-center rounded-2xl bg-white/60 backdrop-blur-sm p-1 border border-white/80 shadow-xs text-xs">
                {(["contact", "deal", "tasks", "activity"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setContextTab(tab)}
                    className={`flex-1 py-1.5 text-center font-medium rounded-xl capitalize transition-all ${
                      contextTab === tab
                        ? "bg-white text-blue-700 shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* View 1: Contact (Default) */}
              {contextTab === "contact" && (
                <>
                  {/* Customer Profile Card */}
                  <div className="p-4 rounded-3xl bg-white/70 border border-white/80 shadow-xs space-y-3 text-center">
                    <div className="relative inline-block mx-auto">
                      <div className="h-16 w-16 rounded-3xl bg-gradient-to-tr from-blue-100 via-indigo-100 to-purple-100 text-blue-800 font-bold flex items-center justify-center text-xl shadow-xs border-2 border-white">
                        {contact.first_name.charAt(0)}{contact.last_name?.charAt(0) || ""}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {contact.first_name} {contact.last_name || ""}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {contact.company || "Enterprise Customer"}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {contact.phone}
                      </p>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        onClick={() => setComposerMode("message")}
                        className="h-8 w-8 rounded-xl bg-white/90 hover:bg-white text-blue-600 border border-white flex items-center justify-center shadow-xs transition-colors"
                        title="Chat"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setFeedbackMessage({ type: "success", text: `Calling ${contact.phone}...` })}
                        className="h-8 w-8 rounded-xl bg-white/90 hover:bg-white text-emerald-600 border border-white flex items-center justify-center shadow-xs transition-colors"
                        title="Call"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => { if (contact.email) window.open(`mailto:${contact.email}`); }}
                        className="h-8 w-8 rounded-xl bg-white/90 hover:bg-white text-indigo-600 border border-white flex items-center justify-center shadow-xs transition-colors"
                        title="Email"
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </button>
                      <Link
                        href={`/app/${orgSlug}/contacts`}
                        className="h-8 w-8 rounded-xl bg-white/90 hover:bg-white text-slate-600 border border-white flex items-center justify-center shadow-xs transition-colors"
                        title="View in CRM"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                    {/* Tag Chips */}
                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 border-t border-slate-100">
                      {(contact.tags && contact.tags.length > 0 ? contact.tags : ["Fleet", "Enterprise", "Hot Lead"]).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 shadow-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Marketing Consent */}
                    <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Consent:</span>
                      <span className="glass-pill px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-700 bg-emerald-50 border-emerald-200 uppercase">
                        {contact.consent_status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  {/* Opportunity Deal Card */}
                  <div className="p-3.5 rounded-3xl bg-white/70 border border-white/80 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Sales Opportunity</span>
                      {lead ? (
                        <Link href={`/app/${orgSlug}/leads`} className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5 font-medium">
                          Pipeline <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : null}
                    </div>

                    {lead ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-800">{lead.title}</span>
                          <span className="text-sm font-bold text-emerald-600">
                            {formatCurrency(lead.estimated_value)}
                          </span>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Current Deal Stage:</label>
                          <select
                            value={lead.stage}
                            onChange={(e) => handleUpdateLeadStage(e.target.value as LeadStage)}
                            className="w-full rounded-xl border border-white/90 bg-white/90 px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none shadow-xs"
                          >
                            {LEAD_STAGES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2 space-y-2">
                        <p className="text-[11px] text-slate-400">No deal linked yet.</p>
                        <Button size="sm" variant="secondary" onClick={() => setLeadModalOpen(true)} className="w-full text-xs text-blue-600">
                          <Plus className="h-3 w-3 mr-1" /> Create Deal
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Next Follow-up Card */}
                  <div className="p-3.5 rounded-3xl bg-white/70 border border-white/80 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Next Follow-up</span>
                      <button
                        onClick={() => setFollowUpModalOpen(true)}
                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5 font-medium"
                      >
                        <Plus className="h-3 w-3" /> Add Task
                      </button>
                    </div>

                    {contactTasks.length > 0 ? (
                      <div className="space-y-1.5">
                        {contactTasks.slice(0, 2).map((t) => (
                          <div key={t.id} className="p-2.5 rounded-2xl bg-white/85 border border-white/80 flex items-center justify-between shadow-xs">
                            <div>
                              <span className="text-xs font-medium text-slate-900 block">{t.title}</span>
                              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Clock className="h-3 w-3 text-slate-400" />
                                {formatDate(t.due_date)}
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase ${
                              t.priority === "high" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}>
                              {t.priority}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 text-center py-1">No scheduled follow-ups.</p>
                    )}
                  </div>
                </>
              )}

              {/* View 2: Deal Tab */}
              {contextTab === "deal" && (
                <div className="p-4 rounded-3xl bg-white/70 border border-white/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Pipeline Deal Details</span>
                    <Button size="sm" variant="ghost" onClick={() => setLeadModalOpen(true)} className="h-6 text-xs text-blue-600">
                      <Plus className="h-3 w-3 mr-1" /> New Deal
                    </Button>
                  </div>

                  {lead ? (
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px]">Title</span>
                        <p className="font-semibold text-slate-900">{lead.title}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Estimated Value</span>
                        <p className="text-base font-bold text-emerald-600">{formatCurrency(lead.estimated_value)}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Stage</span>
                        <select
                          value={lead.stage}
                          onChange={(e) => handleUpdateLeadStage(e.target.value as LeadStage)}
                          className="w-full mt-1 rounded-xl border border-white/90 bg-white/90 px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none shadow-xs"
                        >
                          {LEAD_STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Assigned To:</span>
                        <span className="font-medium text-slate-700">{lead.assigned_to_name || "Unassigned"}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400">
                      No deal linked to this conversation yet.
                    </div>
                  )}
                </div>
              )}

              {/* View 3: Tasks Tab */}
              {contextTab === "tasks" && (
                <div className="p-4 rounded-3xl bg-white/70 border border-white/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Customer Follow-ups</span>
                    <button onClick={() => setFollowUpModalOpen(true)} className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1">
                      <Plus className="h-3 w-3" /> Add Task
                    </button>
                  </div>

                  {contactTasks.length > 0 ? (
                    <div className="space-y-2">
                      {contactTasks.map((t) => (
                        <div key={t.id} className="p-3 rounded-2xl bg-white/85 border border-white/80 shadow-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-900">{t.title}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase ${
                              t.priority === "high" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}>
                              {t.priority}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Due {formatDate(t.due_date)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400">
                      No tasks scheduled for this customer.
                    </div>
                  )}
                </div>
              )}

              {/* View 4: Activity Tab */}
              {contextTab === "activity" && (
                <div className="p-4 rounded-3xl bg-white/70 border border-white/80 shadow-xs space-y-3">
                  <span className="text-xs font-bold text-slate-900 block">Activity Audit Trail</span>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {activities.length === 0 ? (
                      <span className="text-[11px] text-slate-400 block text-center py-4">No activities recorded yet.</span>
                    ) : (
                      activities.map((a) => (
                        <div key={a.id} className="p-2.5 rounded-xl bg-white/80 border border-white/70 text-[11px] space-y-0.5 shadow-xs">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-semibold text-slate-800">{a.actor_name}</span>
                            <span>{formatDate(a.created_at)}</span>
                          </div>
                          <p className="text-slate-600 leading-snug">{a.description}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              Select a conversation to inspect CRM context.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Lead from Inbox */}
      <Dialog open={leadModalOpen} onOpenChange={setLeadModalOpen}>
        <form onSubmit={handleCreateLead}>
          <DialogHeader>
            <DialogTitle>Create Deal from Conversation</DialogTitle>
            <DialogDescription>
              Link a new sales deal for {activeConversation?.contact_name} directly to your pipeline.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-4 text-xs">
            <div>
              <label className="block font-medium text-foreground-secondary mb-1">
                Deal Title *
              </label>
              <Input
                value={newLeadTitle}
                onChange={(e) => setNewLeadTitle(e.target.value)}
                placeholder="e.g. Retail POS WhatsApp Integration"
                required
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-foreground-secondary mb-1">
                  Estimated Value (₹)
                </label>
                <Input
                  type="number"
                  value={newLeadValue}
                  onChange={(e) => setNewLeadValue(e.target.value)}
                  placeholder="50000"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground-secondary mb-1">
                  Initial Stage
                </label>
                <select
                  value={newLeadStage}
                  onChange={(e) => setNewLeadStage(e.target.value as LeadStage)}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-foreground"
                >
                  {LEAD_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setLeadModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!newLeadTitle.trim()}>
              Create & Link Deal
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Modal: Schedule Follow-up Task */}
      <Dialog open={followUpModalOpen} onOpenChange={setFollowUpModalOpen}>
        <form onSubmit={handleCreateFollowUp}>
          <DialogHeader>
            <DialogTitle>Schedule Customer Follow-up</DialogTitle>
            <DialogDescription>
              Create a follow-up task for {activeConversation?.contact_name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-4 text-xs">
            <div>
              <label className="block font-medium text-foreground-secondary mb-1">
                Task Title *
              </label>
              <Input
                value={newFollowUpTitle}
                onChange={(e) => setNewFollowUpTitle(e.target.value)}
                placeholder="Follow up on pricing proposal"
                required
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-foreground-secondary mb-1">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={newFollowUpDate}
                  onChange={(e) => setNewFollowUpDate(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground-secondary mb-1">
                  Priority
                </label>
                <select
                  value={newFollowUpPriority}
                  onChange={(e) => setNewFollowUpPriority(e.target.value as TaskPriority)}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-foreground"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setFollowUpModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!newFollowUpTitle.trim()}>
              Schedule Task
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* AI Conversation Summary Dialog */}
      <Dialog open={aiSummaryOpen} onOpenChange={setAiSummaryOpen}>
        <div className="space-y-4">
          <DialogHeader>
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-google-blue" />
              <DialogTitle>AI Conversation Summary</DialogTitle>
            </div>
            <DialogDescription>
              Structured highlights and detected intent for {activeConversation?.contact_name}.
            </DialogDescription>
          </DialogHeader>

          {aiSummary && (
            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-surface-subtle border border-border">
                <span className="font-semibold text-foreground block mb-1">
                  Executive Summary
                </span>
                <p className="text-foreground-secondary leading-relaxed">
                  {aiSummary.summary}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-surface-blue/30 border border-google-blue/20">
                <span className="font-semibold text-google-blue block mb-1">
                  Primary Customer Intent
                </span>
                <p className="text-foreground font-medium">
                  {aiSummary.mainIntent}
                </p>
              </div>

              {aiSummary.unansweredQuestions.length > 0 && (
                <div className="p-3 rounded-xl bg-google-yellow-subtle border border-google-yellow/20">
                  <span className="font-semibold text-google-yellow-hover block mb-1">
                    Unanswered Customer Questions:
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5 text-foreground">
                    {aiSummary.unansweredQuestions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <span className="font-semibold text-foreground block mb-1">
                  Recommended Next Steps:
                </span>
                <ul className="list-disc pl-4 space-y-1 text-foreground-secondary">
                  {aiSummary.suggestedNextSteps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="default" size="sm" onClick={() => setAiSummaryOpen(false)}>
              Done
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
        <div className="flex h-64 items-center justify-center text-xs text-foreground-secondary">
          Loading shared WhatsApp inbox...
        </div>
      }
    >
      <InboxContent />
    </Suspense>
  );
}
