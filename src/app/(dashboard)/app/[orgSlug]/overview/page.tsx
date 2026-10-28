"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useTenant } from "@/lib/organizations/tenant-context";
import { crmStore } from "@/lib/crm/crm-store";
import { whatsappStore } from "@/lib/whatsapp/whatsapp-store";
import { campaignStore } from "@/lib/campaigns/campaign-store";
import { Campaign } from "@/lib/campaigns/types";
import { LeadStage, Task, Lead } from "@/types/crm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { StatStrip, StatItem } from "@/components/ui/stat-strip";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useMounted } from "@/lib/use-mounted";
import { useToast } from "@/components/ui/toast-context";
import {
  Users,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Plus,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  Check,
  Calendar,
  Zap,
  Phone,
  ArrowRight,
  CheckCheck,
  Send,
  Sparkles,
} from "lucide-react";

export default function OverviewPage() {
  const { currentOrg } = useTenant();
  const orgSlug = currentOrg.slug;
  const mounted = useMounted();
  const { toast } = useToast();

  const [refreshKey, setRefreshKey] = useState(0);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());

  // Quick "New Lead" Modal State
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false);
  const [leadTitle, setLeadTitle] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [customContactName, setCustomContactName] = useState("");
  const [customContactPhone, setCustomContactPhone] = useState("");
  const [leadEstimatedValue, setLeadEstimatedValue] = useState("75000");
  const [leadStage, setLeadStage] = useState<LeadStage>("new");
  const [leadSource, setLeadSource] = useState("Direct Inquiry");

  // 100% Backed by workspace stores (Defect 13 fix)
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

  const campaigns = useMemo<Campaign[]>(() => {
    return campaignStore.getCampaigns(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  // Derived calculations
  const unreadConversations = useMemo(() => {
    return conversations.filter((c) => c.unread_count > 0);
  }, [conversations]);

  const pendingTasks = useMemo(() => {
    return tasks.filter((t) => t.status !== "completed" && !completedTaskIds.has(t.id));
  }, [tasks, completedTaskIds]);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const overdueTasks = useMemo(() => {
    return pendingTasks.filter((t) => new Date(t.due_date) < startOfToday);
  }, [pendingTasks, startOfToday]);

  const topOpportunities = useMemo(() => {
    return [...leads]
      .filter((l) => l.stage !== "lost")
      .sort((a, b) => b.estimated_value - a.estimated_value)
      .slice(0, 4);
  }, [leads]);

  // Task completion handler
  const handleMarkTaskCompleted = (taskId: string) => {
    crmStore.updateTaskStatus(orgSlug, taskId, "completed");
    setCompletedTaskIds((prev) => new Set(prev).add(taskId));
    setRefreshKey((k) => k + 1);
    toast("Task marked complete", { type: "success" });
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
        tags: ["Inbound Lead"],
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
      estimated_value: parseFloat(leadEstimatedValue) || 50000,
      currency: "INR",
      source: leadSource,
      assigned_to_name: "Praveen",
    });

    setLeadTitle("");
    setSelectedContactId("");
    setCustomContactName("");
    setCustomContactPhone("");
    setNewLeadModalOpen(false);
    setRefreshKey((k) => k + 1);
    toast("Sales opportunity created", { type: "success" });
  };

  // Canonical StatStrip items (Defect 15 fix)
  const statStripItems: StatItem[] = useMemo(() => {
    return [
      {
        id: "pipeline-value",
        label: "Commercial Pipeline",
        value: formatCurrency(metrics.pipelineValue),
        subtext: `${leads.length} active opportunities`,
        change: { value: "+18%", trend: "up" },
      },
      {
        id: "deals-won",
        label: "Won Revenue",
        value: formatCurrency(metrics.wonDeals.value),
        subtext: `${metrics.wonDeals.count} closed (${metrics.conversionRate}% win rate)`,
        change: { value: "+100%", trend: "up" },
      },
      {
        id: "whatsapp-inbox",
        label: "WhatsApp Threads",
        value: conversations.length,
        subtext: `${unreadConversations.length} awaiting response`,
        change: unreadConversations.length > 0 ? { value: `${unreadConversations.length} unread`, trend: "down" } : undefined,
      },
      {
        id: "tasks-due",
        label: "Pending Follow-ups",
        value: pendingTasks.length,
        subtext: `${overdueTasks.length} overdue SLA`,
        change: overdueTasks.length > 0 ? { value: `${overdueTasks.length} overdue`, trend: "down" } : { value: "On track", trend: "neutral" },
      },
    ];
  }, [metrics, leads, conversations, unreadConversations, pendingTasks, overdueTasks]);

  // Dynamic greeting
  const greeting = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. Header & Workspace Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4E4E7]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="type-title text-[#0D0D0E] font-medium tracking-tight">
              {greeting}, Praveen
            </h1>
            <StatusPill variant="success" dot pulse>
              Workspace Active
            </StatusPill>
          </div>
          <p className="text-xs text-[#717680] mt-0.5 font-normal">
            Operational command center for {currentOrg.name} across revenue pipeline and customer messaging.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/app/${orgSlug}/inbox`}
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E4E4E7] bg-white text-xs font-medium text-[#0D0D0E] hover:bg-[#FAF9F6] shadow-2xs transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5 text-[#717680]" />
            <span>Open Inbox</span>
            {unreadConversations.length > 0 && (
              <span className="text-[10px] bg-[#FF7A1A] text-white px-1.5 py-0.2 rounded-full font-medium">
                {unreadConversations.length}
              </span>
            )}
          </Link>

          <Button
            size="sm"
            onClick={() => setNewLeadModalOpen(true)}
            variant="primary"
            className="h-8 px-3 text-xs"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5 stroke-[2.5]" />
            <span>New Opportunity</span>
          </Button>
        </div>
      </div>

      {/* 2. Open Stat Strip (Replacing 4 boxed cards - Defect 15 fix) */}
      <StatStrip stats={statStripItems} />

      {/* 3. High-Priority "Needs Attention" Strip (If any overdue tasks or unread messages) */}
      {(unreadConversations.length > 0 || overdueTasks.length > 0) && (
        <div className="rounded-xl border border-[#FFD8BF] bg-[#FFF9F5] p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs animate-reveal">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#FFF4EC] border border-[#FFD8BF] text-[#FF7A1A] flex items-center justify-center shrink-0">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#0D0D0E]">
                Attention required across your active operations
              </p>
              <p className="text-[11px] text-[#717680] mt-0.5">
                {unreadConversations.length} unanswered WhatsApp client inquiries • {overdueTasks.length} tasks past scheduled SLA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadConversations.length > 0 && (
              <Link
                href={`/app/${orgSlug}/inbox`}
                className="h-7 px-2.5 rounded-lg bg-white border border-[#E4E4E7] text-[11px] font-medium text-[#0D0D0E] hover:bg-[#FAF9F6] flex items-center gap-1 transition-colors"
              >
                <span>Respond to Messages ({unreadConversations.length})</span>
                <ChevronRight className="h-3 w-3 text-[#717680]" />
              </Link>
            )}
            {overdueTasks.length > 0 && (
              <Link
                href={`/app/${orgSlug}/tasks`}
                className="h-7 px-2.5 rounded-lg bg-white border border-[#E4E4E7] text-[11px] font-medium text-[#0D0D0E] hover:bg-[#FAF9F6] flex items-center gap-1 transition-colors"
              >
                <span>Resolve Overdue ({overdueTasks.length})</span>
                <ChevronRight className="h-3 w-3 text-[#717680]" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 4. Core Operational 2-Wing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Wing (7 Cols): WhatsApp Live Activity Stream (Defect 14 fix) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#E4E4E7] shadow-2xs overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-[#E4E4E7] flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-medium text-[#0D0D0E]">
                    WhatsApp Client Activity
                  </h2>
                  <StatusPill variant="success" size="sm" dot pulse>
                    Live Sync
                  </StatusPill>
                </div>
                <p className="text-[11px] text-[#717680] mt-0.5">
                  Direct routing into your Shared Inbox threads
                </p>
              </div>
            </div>

            <Link
              href={`/app/${orgSlug}/inbox`}
              className="text-xs font-medium text-[#FF7A1A] hover:text-[#FF8833] flex items-center gap-1 group"
            >
              <span>Inbox View</span>
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Conversation Activity List */}
          <div className="divide-y divide-[#E4E4E7] overflow-y-auto max-h-[380px] custom-light-scroll">
            {conversations.slice(0, 5).map((conv) => {
              const isUnread = conv.unread_count > 0;
              return (
                <Link
                  key={conv.id}
                  href={`/app/${orgSlug}/inbox?c=${conv.id}`}
                  className="p-3.5 flex items-start justify-between gap-3 transition-colors duration-140 hover:bg-[#FAF9F6] group select-none block"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-[#FAF9F6] border border-[#E4E4E7] text-[#0D0D0E] font-medium text-xs flex items-center justify-center shrink-0">
                      {conv.contact_name?.charAt(0) || "C"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#0D0D0E] truncate">
                          {conv.contact_name}
                        </span>
                        <span className="text-[11px] text-[#717680] font-normal truncate">
                          {conv.contact_phone}
                        </span>
                      </div>
                      <p className="text-xs text-[#525866] truncate mt-0.5 font-normal">
                        {conv.last_message_text || "No message history"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    {isUnread && (
                      <span className="text-[10px] font-medium bg-[#FF7A1A] text-white px-1.5 py-0.2 rounded-full">
                        {conv.unread_count} new
                      </span>
                    )}
                    <span className="text-[11px] text-[#717680]">
                      {conv.last_message_at ? formatDate(conv.last_message_at) : "Recent"}
                    </span>
                    <ChevronRight className="h-3 w-3 text-[#D4D4D8] group-hover:text-[#717680] transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="p-2.5 bg-[#FAF9F6] border-t border-[#E4E4E7] text-center">
            <Link
              href={`/app/${orgSlug}/inbox`}
              className="text-xs text-[#717680] hover:text-[#0D0D0E] font-medium transition-colors"
            >
              View all {conversations.length} active WhatsApp conversations →
            </Link>
          </div>
        </div>

        {/* Right Wing (5 Cols): Pipeline Progression & Priority Deals */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#E4E4E7] shadow-2xs overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-[#E4E4E7] flex items-center justify-between bg-white shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-medium text-[#0D0D0E]">
                  Top Revenue Opportunities
                </h2>
                <span className="text-[10px] text-[#717680] px-1.5 py-0.2 rounded bg-[#FAF9F6] border border-[#E4E4E7]">
                  {leads.length} in pipeline
                </span>
              </div>
              <p className="text-[11px] text-[#717680] mt-0.5">
                Highest value active deals ranked by closing value
              </p>
            </div>

            <Link
              href={`/app/${orgSlug}/leads`}
              className="text-xs font-medium text-[#FF7A1A] hover:text-[#FF8833] flex items-center gap-1 group"
            >
              <span>Pipeline</span>
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Top Opportunities List */}
          <div className="divide-y divide-[#E4E4E7] overflow-y-auto max-h-[380px] custom-light-scroll">
            {topOpportunities.map((lead) => (
              <Link
                key={lead.id}
                href={`/app/${orgSlug}/leads`}
                className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#FAF9F6] transition-colors group select-none block"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#0D0D0E] truncate">
                    {lead.title}
                  </p>
                  <p className="text-[11px] text-[#717680] truncate mt-0.5">
                    {lead.contact_name} • {lead.source || "Direct"}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-xs font-medium text-[#0D0D0E]">
                    {formatCurrency(lead.estimated_value)}
                  </span>
                  <StatusPill
                    variant={
                      lead.stage === "won"
                        ? "success"
                        : lead.stage === "proposal"
                        ? "attention"
                        : "neutral"
                    }
                    size="sm"
                  >
                    {lead.stage.toUpperCase()}
                  </StatusPill>
                </div>
              </Link>
            ))}
          </div>

          <div className="p-2.5 bg-[#FAF9F6] border-t border-[#E4E4E7] text-center">
            <Link
              href={`/app/${orgSlug}/leads`}
              className="text-xs text-[#717680] hover:text-[#0D0D0E] font-medium transition-colors"
            >
              View full sales pipeline ({formatCurrency(metrics.pipelineValue)}) →
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Bottom 2-Column Row: Today's Tasks & Broadcast Campaign Pulse */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Today's Tasks & SLAs */}
        <div className="bg-white rounded-xl border border-[#E4E4E7] shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#E4E4E7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-medium text-[#0D0D0E]">Today&apos;s Follow-ups &amp; Tasks</h3>
              <span className="text-[10px] text-[#717680] px-1.5 py-0.2 rounded-full bg-[#FAF9F6] border border-[#E4E4E7]">
                {pendingTasks.length} pending
              </span>
            </div>
            <Link
              href={`/app/${orgSlug}/tasks`}
              className="text-xs font-medium text-[#FF7A1A] hover:text-[#FF8833] flex items-center gap-1 group"
            >
              <span>View all</span>
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="p-2 space-y-1.5 max-h-[260px] overflow-y-auto custom-light-scroll">
            {pendingTasks.slice(0, 4).map((task) => {
              const isDone = completedTaskIds.has(task.id);
              const isOverdue = new Date(task.due_date) < startOfToday;

              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg border border-[#E4E4E7] bg-[#FAF9F6] transition-all hover:bg-white hover:border-[#D4D4D8] ${
                    isDone ? "opacity-40 line-through" : ""
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleMarkTaskCompleted(task.id)}
                      className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                        isDone
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-[#D4D4D8] hover:border-[#FF7A1A] bg-white"
                      }`}
                    >
                      {isDone && <Check className="h-3 w-3 stroke-[2.5]" />}
                    </button>
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-[#0D0D0E] truncate block">
                        {task.title}
                      </span>
                      <span className="text-[11px] text-[#717680] truncate block">
                        {task.contact_name} • Due {formatDate(task.due_date)}
                      </span>
                    </div>
                  </div>

                  <StatusPill
                    variant={isOverdue ? "danger" : task.priority === "high" ? "warning" : "neutral"}
                    size="sm"
                  >
                    {isOverdue ? "Overdue" : task.priority.toUpperCase()}
                  </StatusPill>
                </div>
              );
            })}

            {pendingTasks.length === 0 && (
              <p className="text-xs text-[#717680] text-center py-6">
                No pending tasks for today. You&apos;re completely up to date.
              </p>
            )}
          </div>
        </div>

        {/* Broadcast Campaigns & Delivery Pulse */}
        <div className="bg-white rounded-xl border border-[#E4E4E7] shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#E4E4E7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-medium text-[#0D0D0E]">Broadcast Campaigns Pulse</h3>
              <span className="text-[10px] text-[#717680] px-1.5 py-0.2 rounded-full bg-[#FAF9F6] border border-[#E4E4E7]">
                {campaigns.length} campaigns
              </span>
            </div>
            <Link
              href={`/app/${orgSlug}/campaigns`}
              className="text-xs font-medium text-[#FF7A1A] hover:text-[#FF8833] flex items-center gap-1 group"
            >
              <span>View all</span>
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="p-3.5 space-y-3 max-h-[260px] overflow-y-auto custom-light-scroll">
            {campaigns.slice(0, 2).map((camp) => (
              <div
                key={camp.id}
                className="p-3 rounded-lg border border-[#E4E4E7] bg-[#FAF9F6] space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#0D0D0E] truncate">
                    {camp.name}
                  </span>
                  <StatusPill variant={camp.status === "completed" ? "success" : "attention"} size="sm">
                    {camp.status.toUpperCase()}
                  </StatusPill>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-1.5 rounded bg-white border border-[#E4E4E7]">
                    <span className="text-xs font-medium text-[#0D0D0E] block">{camp.total_recipients}</span>
                    <span className="text-[10px] text-[#717680]">Total</span>
                  </div>
                  <div className="p-1.5 rounded bg-white border border-[#E4E4E7]">
                    <span className="text-xs font-medium text-[#0D0D0E] block">{camp.sent_count}</span>
                    <span className="text-[10px] text-[#717680]">Sent</span>
                  </div>
                  <div className="p-1.5 rounded bg-white border border-[#E4E4E7]">
                    <span className="text-xs font-medium text-[#0D0D0E] block">{camp.delivered_count}</span>
                    <span className="text-[10px] text-[#717680]">Delivered</span>
                  </div>
                  <div className="p-1.5 rounded bg-white border border-[#E4E4E7]">
                    <span className="text-xs font-medium text-emerald-600 block">{camp.read_count}</span>
                    <span className="text-[10px] text-[#717680]">Read</span>
                  </div>
                </div>
              </div>
            ))}

            {campaigns.length === 0 && (
              <p className="text-xs text-[#717680] text-center py-6">
                No active broadcast campaigns.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 6. Quick "New Lead" Modal */}
      <Dialog open={newLeadModalOpen} onOpenChange={setNewLeadModalOpen}>
        <form onSubmit={handleCreateNewLead} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium text-[#0D0D0E]">Create Sales Opportunity</DialogTitle>
            <DialogDescription className="text-xs text-[#717680]">
              Add a commercial deal to your pipeline and associate it with customer contact.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 my-4 text-xs">
            <Input
              label="Deal Title *"
              placeholder="e.g. Annual WhatsApp Automation Retainer"
              value={leadTitle}
              onChange={(e) => setLeadTitle(e.target.value)}
              required
              className="bg-[#FAF9F6] border-[#E4E4E7] focus:bg-white text-xs"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Estimated Value (INR) *"
                type="number"
                value={leadEstimatedValue}
                onChange={(e) => setLeadEstimatedValue(e.target.value)}
                required
                className="bg-[#FAF9F6] border-[#E4E4E7] focus:bg-white text-xs"
              />

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#0D0D0E]">Pipeline Stage</label>
                <select
                  value={leadStage}
                  onChange={(e) => setLeadStage(e.target.value as LeadStage)}
                  className="w-full h-8.5 px-2.5 rounded-lg border border-[#E4E4E7] bg-[#FAF9F6] text-xs text-[#0D0D0E] outline-none"
                >
                  <option value="new">New Inquiry</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal Sent</option>
                  <option value="won">Deals Won</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Contact Name"
                placeholder="Rohan Sharma"
                value={customContactName}
                onChange={(e) => setCustomContactName(e.target.value)}
                className="bg-[#FAF9F6] border-[#E4E4E7] focus:bg-white text-xs"
              />
              <Input
                label="Phone Number"
                placeholder="+919876543210"
                value={customContactPhone}
                onChange={(e) => setCustomContactPhone(e.target.value)}
                className="bg-[#FAF9F6] border-[#E4E4E7] focus:bg-white text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setNewLeadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Opportunity
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
