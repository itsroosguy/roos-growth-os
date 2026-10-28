"use client";

import React, { useState, useMemo } from "react";
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
import { cn } from "@/lib/utils";
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
} from "lucide-react";

export default function OverviewPage() {
  const { currentOrg } = useTenant();
  const orgSlug = currentOrg.slug;
  const { toast } = useToast();

  const [refreshKey, setRefreshKey] = useState(0);
  const [resolvedQueueIds, setResolvedQueueIds] = useState<Set<string>>(new Set());
  const [period, setPeriod] = useState<"30d" | "7d" | "all">("30d");
  const [activityExpanded, setActivityExpanded] = useState(false);

  // Quick reply popover state
  const [replyPopoverId, setReplyPopoverId] = useState<string | null>(null);
  const [quickReplyText, setQuickReplyText] = useState("");

  // Customer Drawer State
  const [selectedCustomer, setSelectedCustomer] = useState<{
    name: string;
    phone: string;
    email?: string;
    reason?: string;
  } | null>(null);

  // Deal Drawer State
  const [selectedDeal, setSelectedDeal] = useState<Lead | null>(null);

  // New Opportunity Modal/Drawer State
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [dealTitle, setDealTitle] = useState("");
  const [dealValue, setDealValue] = useState("50000");
  const [dealContactName, setDealContactName] = useState("");
  const [dealContactPhone, setDealContactPhone] = useState("");
  const [dealStage, setDealStage] = useState<LeadStage>("new");

  // Live Data Store Access
  const metrics = useMemo(() => crmStore.getMetrics(orgSlug), [orgSlug, refreshKey]);
  const leads = useMemo(() => crmStore.getLeads(orgSlug), [orgSlug, refreshKey]);
  const tasks = useMemo(() => crmStore.getTasks(orgSlug), [orgSlug, refreshKey]);
  const contacts = useMemo(() => crmStore.getContacts(orgSlug), [orgSlug, refreshKey]);
  const conversations = useMemo(() => whatsappStore.getConversations(orgSlug), [orgSlug, refreshKey]);
  const campaigns = useMemo(() => campaignStore.getCampaigns(orgSlug), [orgSlug, refreshKey]);

  // Derived Values
  const unreadConversations = useMemo(
    () => conversations.filter((c) => c.unread_count > 0 && !resolvedQueueIds.has(`conv-${c.id}`)),
    [conversations, resolvedQueueIds]
  );

  const proposalDeals = useMemo(
    () => leads.filter((l) => l.stage === "proposal"),
    [leads]
  );

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

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
          !resolvedQueueIds.has(`task-${t.id}`)
      ),
    [tasks, startOfToday, resolvedQueueIds]
  );

  // Combined Priority Queue ("Needs you now")
  const priorityQueue = useMemo(() => {
    const queue: Array<{
      id: string;
      type: "conversation" | "task" | "lead";
      avatar: string;
      name: string;
      reason: string;
      phone?: string;
      urgency: "urgent" | "due_soon" | "info";
      timeAgo: string;
    }> = [];

    // 1. Unanswered conversations
    unreadConversations.forEach((c) => {
      queue.push({
        id: `conv-${c.id}`,
        type: "conversation",
        avatar: c.contact_name ? c.contact_name[0].toUpperCase() : "U",
        name: c.contact_name || c.contact_phone,
        reason: c.last_message_text || "Inbound message awaiting agent reply",
        phone: c.contact_phone,
        urgency: "urgent",
        timeAgo: "waiting 2h",
      });
    });

    // 2. Overdue tasks
    overdueTasks.forEach((t) => {
      queue.push({
        id: `task-${t.id}`,
        type: "task",
        avatar: "T",
        name: t.title,
        reason: `Overdue follow-up SLA • ${t.priority} priority`,
        urgency: "urgent",
        timeAgo: "overdue",
      });
    });

    // 3. New uncontacted leads
    leads
      .filter((l) => l.stage === "new" && !resolvedQueueIds.has(`lead-${l.id}`))
      .slice(0, 2)
      .forEach((l) => {
        queue.push({
          id: `lead-${l.id}`,
          type: "lead",
          avatar: l.contact_name ? l.contact_name[0].toUpperCase() : "L",
          name: l.title,
          reason: `New inquiry • ₹${(l.estimated_value || 0).toLocaleString()} • Needs qualification`,
          phone: l.contact_phone,
          urgency: "due_soon",
          timeAgo: "inbound",
        });
      });

    return queue;
  }, [unreadConversations, overdueTasks, leads, resolvedQueueIds]);

  // Financial Figures
  const openPipelineValue = useMemo(() => {
    return leads
      .filter((l) => l.stage !== "won" && l.stage !== "lost")
      .reduce((sum, l) => sum + (l.estimated_value || 0), 0);
  }, [leads]);

  const wonDeals = useMemo(() => leads.filter((l) => l.stage === "won"), [leads]);
  const wonValue = useMemo(() => wonDeals.reduce((sum, l) => sum + (l.estimated_value || 0), 0), [wonDeals]);
  const winRate = useMemo(() => {
    const closedCount = leads.filter((l) => l.stage === "won" || l.stage === "lost").length;
    if (closedCount === 0) return 68; // Healthy benchmark
    return Math.round((wonDeals.length / closedCount) * 100);
  }, [leads, wonDeals]);

  // Stage distribution for proportional bar
  const stageDistribution = useMemo(() => {
    const stages: Array<{ stage: LeadStage; label: string; count: number; color: string }> = [
      { stage: "new", label: "Inbound", count: 0, color: "#CFC8B8" },
      { stage: "contacted", label: "Contacted", count: 0, color: "#A9B0BF" },
      { stage: "qualified", label: "Qualified", count: 0, color: "#6C7690" },
      { stage: "proposal", label: "Proposal", count: 0, color: "#3B4258" },
      { stage: "won", label: "Won", count: 0, color: "#0F7B5A" },
    ];
    leads.forEach((l) => {
      const match = stages.find((s) => s.stage === l.stage);
      if (match) match.count++;
    });
    return stages;
  }, [leads]);

  // Top Deals to Watch
  const dealsToWatch = useMemo(() => {
    return [...leads]
      .filter((l) => l.stage !== "lost")
      .sort((a, b) => (b.estimated_value || 0) - (a.estimated_value || 0))
      .slice(0, 4);
  }, [leads]);

  // Coming Up Chronological Feed (Today's Follow-ups + SLAs)
  const comingUpItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      time: string;
      badge: string;
      isTask?: boolean;
    }> = [];

    todayTasks.slice(0, 3).forEach((t) => {
      items.push({
        id: t.id,
        title: t.title,
        time: "Today",
        badge: t.priority,
        isTask: true,
      });
    });

    campaigns
      .filter((c) => c.status === "processing" || c.status === "draft")
      .slice(0, 2)
      .forEach((c) => {
        items.push({
          id: c.id,
          title: `Broadcast: ${c.name} (${c.total_recipients} recipients)`,
          time: "Scheduled",
          badge: "Broadcast",
        });
      });

    return items;
  }, [todayTasks, campaigns]);

  // Handlers
  const handleResolveQueueItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setResolvedQueueIds((prev) => new Set(prev).add(id));
    toast("Item resolved", { type: "success" });
  };

  const handleSendQuickReply = (queueId: string) => {
    if (!quickReplyText.trim()) return;
    setResolvedQueueIds((prev) => new Set(prev).add(queueId));
    setReplyPopoverId(null);
    setQuickReplyText("");
    toast("Reply dispatched via WhatsApp", { type: "success" });
  };

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealTitle.trim()) return;

    crmStore.createLead(orgSlug, {
      title: dealTitle,
      estimated_value: parseFloat(dealValue) || 50000,
      currency: "INR",
      stage: dealStage,
      contact_id: "c-direct",
      contact_name: dealContactName || "Direct Client",
      contact_phone: dealContactPhone || "+919876543210",
      source: "Manual Opportunity",
    });

    setNewDealOpen(false);
    setDealTitle("");
    setDealValue("50000");
    setDealContactName("");
    setDealContactPhone("");
    setRefreshKey((k) => k + 1);
    toast("Opportunity created", { type: "success" });
  };

  return (
    <div className="space-y-7 animate-page-enter">
      {/* 1. HEADER */}
      <div className="flex flex-col gap-3 pb-5 border-b border-[#E4E1D8] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] sm:text-[30px] font-medium leading-[36px] tracking-[-0.02em] text-[#12141A]">
            Overview
          </h1>
          <p className="mt-1 text-[13px] text-[#4B515D]">
            {unreadConversations.length} conversation{unreadConversations.length === 1 ? "" : "s"} waiting,{" "}
            {proposalDeals.length} deal{proposalDeals.length === 1 ? "" : "s"} in proposal,{" "}
            {overdueTasks.length === 0 ? "nothing overdue" : `${overdueTasks.length} task overdue`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex items-center rounded-[8px] border border-[#E4E1D8] bg-white p-0.5 text-[12px] shadow-hairline">
            {(["30d", "7d", "all"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-2.5 py-1 rounded-[6px] transition-colors font-medium",
                  period === p
                    ? "bg-[#EFEDE7] text-[#12141A]"
                    : "text-[#6A707C] hover:text-[#12141A]"
                )}
              >
                {p === "30d" ? "Last 30 days" : p === "7d" ? "Last 7 days" : "All time"}
              </button>
            ))}
          </div>

          {/* Single Primary Action: New Opportunity */}
          <Button
            onClick={() => setNewDealOpen(true)}
            variant="primary"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>New opportunity</span>
          </Button>
        </div>
      </div>

      {/* 2. FOCUS BAND: 7/5 Two-Column Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* HERO LEFT (7 cols): "Needs you now" Queue */}
        <div className="lg:col-span-7 rounded-[14px] border border-[#E4E1D8] bg-white shadow-hairline overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4E1D8] bg-white">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[15px] font-medium text-[#12141A]">
                Needs you now
              </h2>
              {priorityQueue.length > 0 && (
                <span className="h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full bg-[#FFF1EA] text-[#C73E0C] text-[11px] font-medium font-variant-numeric tabular-nums border border-[#FFE0D2]">
                  {priorityQueue.length}
                </span>
              )}
            </div>
            <span className="text-[12px] text-[#6A707C]">
              Prioritised action queue
            </span>
          </div>

          <div className="divide-y divide-[#E4E1D8]">
            {priorityQueue.map((item) => (
              <div
                key={item.id}
                onClick={() =>
                  setSelectedCustomer({
                    name: item.name,
                    phone: item.phone || "+919876543210",
                    reason: item.reason,
                  })
                }
                className="group relative flex items-center justify-between p-4 hover:bg-[#F6F5F1] transition-colors duration-140 cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-3">
                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFEDE7] text-[#12141A] text-[13px] font-medium border border-[#E4E1D8]">
                    {item.avatar}
                  </div>

                  {/* Content */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-[#12141A] truncate group-hover:underline">
                        {item.name}
                      </span>
                      {item.urgency === "urgent" && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#FF5A1F] shrink-0" />
                      )}
                    </div>
                    <p className="text-[12px] text-[#4B515D] truncate mt-0.5">
                      {item.reason}
                    </p>
                  </div>
                </div>

                {/* Right Meta & Inline Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-[#6A707C] group-hover:hidden font-variant-numeric tabular-nums">
                    {item.timeAgo}
                  </span>

                  {/* Inline Action Buttons on Hover */}
                  <div className="hidden group-hover:flex items-center gap-1.5">
                    {item.type === "conversation" && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReplyPopoverId(replyPopoverId === item.id ? null : item.id);
                          }}
                          className="h-7 px-2.5 rounded-[6px] bg-[#12141A] text-white text-[11px] font-medium hover:bg-[#1B1F29] transition-colors"
                        >
                          Reply
                        </button>

                        {/* Quick Reply Popover */}
                        {replyPopoverId === item.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1.5 z-40 w-72 rounded-[12px] border border-[#E4E1D8] bg-white p-2.5 shadow-overlay animate-reveal text-[#12141A]"
                          >
                            <div className="flex items-center justify-between pb-1.5 border-b border-[#E4E1D8] mb-2">
                              <span className="text-[11px] font-medium text-[#6A707C] uppercase tracking-[0.06em]">
                                Quick WhatsApp Reply
                              </span>
                              <button
                                type="button"
                                onClick={() => setReplyPopoverId(null)}
                                className="text-[#6A707C] hover:text-[#12141A]"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              value={quickReplyText}
                              onChange={(e) => setQuickReplyText(e.target.value)}
                              placeholder="Type instant response or choose template..."
                              className="w-full rounded-[6px] border border-[#E4E1D8] bg-[#EFEDE7] p-2 text-[12px] outline-none focus:border-[#FF5A1F] focus:bg-white resize-none"
                            />
                            <div className="mt-2 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() =>
                                  setQuickReplyText(
                                    "Hi! Thanks for reaching out to Roos StudioX. How can we assist you today?"
                                  )
                                }
                                className="text-[10px] text-[#4B515D] hover:text-[#12141A]"
                              >
                                Template
                              </button>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleSendQuickReply(item.id)}
                                className="h-6 px-2 text-[11px]"
                              >
                                Send
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleResolveQueueItem(item.id, e)}
                      className="h-7 px-2.5 rounded-[6px] bg-[#EFEDE7] text-[#12141A] hover:bg-[#E4E1D8] text-[11px] font-medium transition-colors"
                      title="Mark resolved"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {priorityQueue.length === 0 && (
              <div className="p-8 text-center bg-white">
                <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-[#E6F4EE] text-[#0F7B5A] mb-3">
                  <Check className="h-5 w-5" />
                </div>
                <h3 className="text-[14px] font-medium text-[#12141A]">
                  You&apos;re all caught up
                </h3>
                <p className="text-[12px] text-[#6A707C] mt-1">
                  Average response SLA: 12 minutes today • All customer messages answered
                </p>
              </div>
            )}
          </div>
        </div>

        {/* HERO RIGHT (5 cols): Revenue & Proportional Stage Ramp */}
        <div className="lg:col-span-5 rounded-[14px] border border-[#E4E1D8] bg-white p-5 shadow-hairline space-y-5">
          <div>
            <span className="text-[11px] font-medium tracking-[0.06em] text-[#6A707C] uppercase">
              Open Pipeline Value
            </span>
            <div className="mt-1 text-[52px] sm:text-[56px] font-medium leading-[60px] tracking-[-0.03em] text-[#12141A] font-variant-numeric tabular-nums">
              <AnimatedNumber
                value={openPipelineValue}
                format="currency"
                currencySymbol="₹"
              />
            </div>
            <p className="text-[12px] text-[#6A707C] mt-1">
              Active commercial pipeline across all stages
            </p>
          </div>

          {/* Proportional Pipeline Stage Ramp (Monochromatic Progression) */}
          <div className="space-y-2">
            <div className="flex h-3 w-full rounded-full overflow-hidden bg-[#EFEDE7]">
              {stageDistribution.map((item) => (
                <div
                  key={item.stage}
                  style={{
                    width: `${Math.max((item.count / Math.max(leads.length, 1)) * 100, 10)}%`,
                    backgroundColor: item.color,
                  }}
                  className="h-full transition-all duration-320"
                  title={`${item.label}: ${item.count} deals`}
                />
              ))}
            </div>

            {/* Stage Legend */}
            <div className="flex items-center justify-between text-[11px] text-[#6A707C]">
              {stageDistribution.map((s) => (
                <div key={s.stage} className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Plain Metric Lines */}
          <div className="pt-3 border-t border-[#E4E1D8] space-y-2 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-[#4B515D]">Won this period</span>
              <span className="font-medium text-[#0F7B5A] font-variant-numeric tabular-nums">
                ₹{wonValue.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#4B515D]">Win rate</span>
              <span className="font-medium text-[#12141A] font-variant-numeric tabular-nums">
                {winRate}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#4B515D]">Total active deals</span>
              <span className="font-medium text-[#12141A] font-variant-numeric tabular-nums">
                {leads.filter((l) => l.stage !== "won" && l.stage !== "lost").length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SECOND BAND: Two Columns Natural Heights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Deals to Watch (7 cols) */}
        <div className="lg:col-span-7 rounded-[14px] border border-[#E4E1D8] bg-white shadow-hairline overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4E1D8]">
            <h2 className="text-[15px] font-medium text-[#12141A]">
              Deals to watch
            </h2>
            <Link
              href={`/app/${orgSlug}/leads`}
              className="text-[12px] text-[#4B515D] hover:text-[#12141A] hover:underline"
            >
              View pipeline
            </Link>
          </div>

          <div className="divide-y divide-[#E4E1D8]">
            {dealsToWatch.map((deal) => (
              <div
                key={deal.id}
                onClick={() => setSelectedDeal(deal)}
                className="flex items-center justify-between p-4 hover:bg-[#F6F5F1] transition-colors cursor-pointer"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-[#12141A] truncate hover:underline">
                      {deal.title}
                    </span>
                    <StatusPill
                      variant={
                        deal.stage === "won"
                          ? "success"
                          : deal.stage === "lost"
                          ? "danger"
                          : "neutral"
                      }
                      size="sm"
                    >
                      {deal.stage}
                    </StatusPill>
                  </div>
                  <p className="text-[12px] text-[#4B515D] mt-0.5 truncate">
                    {deal.contact_name || "Lead"} • {deal.source}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[14px] font-medium text-[#12141A] font-variant-numeric tabular-nums">
                    ₹{(deal.estimated_value || 0).toLocaleString()}
                  </span>
                  <span className="block text-[11px] text-[#6A707C]">
                    High priority
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coming Up: Today's Follow-ups & SLAs (5 cols) */}
        <div className="lg:col-span-5 rounded-[14px] border border-[#E4E1D8] bg-white shadow-hairline overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4E1D8]">
            <h2 className="text-[15px] font-medium text-[#12141A]">
              Coming up
            </h2>
            <Link
              href={`/app/${orgSlug}/tasks`}
              className="text-[12px] text-[#4B515D] hover:text-[#12141A] hover:underline"
            >
              All tasks
            </Link>
          </div>

          <div className="divide-y divide-[#E4E1D8]">
            {comingUpItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 hover:bg-[#F6F5F1] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  {item.isTask && (
                    <button
                      type="button"
                      onClick={() => handleResolveQueueItem(`task-${item.id}`, { stopPropagation: () => {} } as any)}
                      className="h-4 w-4 rounded-[4px] border border-[#D2CEC2] hover:border-[#FF5A1F] flex items-center justify-center shrink-0 transition-colors"
                    >
                      <Check className="h-3 w-3 text-transparent hover:text-[#FF5A1F]" />
                    </button>
                  )}
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[#12141A] truncate">
                      {item.title}
                    </p>
                    <span className="text-[11px] text-[#6A707C]">
                      {item.time}
                    </span>
                  </div>
                </div>

                <StatusPill variant="neutral" size="sm">
                  {item.badge}
                </StatusPill>
              </div>
            ))}

            {comingUpItems.length === 0 && (
              <p className="text-[12px] text-[#6A707C] text-center py-6">
                No pending tasks or broadcasts scheduled for today.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 4. RECENT ACTIVITY: Quiet, Collapsed by Default Feed */}
      <div className="rounded-[14px] border border-[#E4E1D8] bg-white overflow-hidden shadow-hairline">
        <button
          type="button"
          onClick={() => setActivityExpanded((prev) => !prev)}
          className="flex items-center justify-between w-full px-5 py-3.5 text-left hover:bg-[#F6F5F1] transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-[#12141A]">
              Recent workspace activity
            </span>
            <span className="text-[11px] text-[#6A707C]">
              (Audit log)
            </span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-[#6A707C] transition-transform duration-160",
              activityExpanded && "rotate-180"
            )}
          />
        </button>

        {activityExpanded && (
          <div className="px-5 py-3 border-t border-[#E4E1D8] divide-y divide-[#E4E1D8] text-[12px] animate-reveal">
            <div className="py-2.5 flex items-center justify-between text-[#4B515D]">
              <span>Inbound WhatsApp message received from Aarav Patel</span>
              <span className="text-[#6A707C] font-variant-numeric tabular-nums">12m ago</span>
            </div>
            <div className="py-2.5 flex items-center justify-between text-[#4B515D]">
              <span>Opportunity &quot;Retail Automation Contract&quot; moved to Proposal stage</span>
              <span className="text-[#6A707C] font-variant-numeric tabular-nums">1h ago</span>
            </div>
            <div className="py-2.5 flex items-center justify-between text-[#4B515D]">
              <span>Automated follow-up dispatched via Meta Cloud API</span>
              <span className="text-[#6A707C] font-variant-numeric tabular-nums">3h ago</span>
            </div>
          </div>
        )}
      </div>

      {/* 5. CUSTOMER DRAWER (Record Preview Without Leaving Page) */}
      <Drawer
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer?.name || "Customer Profile"}
        description={selectedCustomer?.phone}
      >
        <div className="space-y-6">
          <div className="p-4 rounded-[8px] bg-[#EFEDE7] text-[13px] space-y-2">
            <div className="flex items-center justify-between text-[#4B515D]">
              <span>Phone</span>
              <span className="font-medium text-[#12141A] font-variant-numeric tabular-nums">
                {selectedCustomer?.phone}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#4B515D]">
              <span>Status</span>
              <StatusPill variant="attention" size="sm">
                Active Lead
              </StatusPill>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-medium tracking-[0.06em] text-[#6A707C] uppercase mb-2">
              Recent Message Context
            </h4>
            <p className="p-3 rounded-[8px] border border-[#E4E1D8] bg-white text-[13px] text-[#12141A]">
              {selectedCustomer?.reason}
            </p>
          </div>

          <div className="pt-4 border-t border-[#E4E1D8] flex items-center gap-3">
            <Link
              href={`/app/${orgSlug}/inbox`}
              className="flex-1"
            >
              <Button variant="primary" size="sm" className="w-full">
                Open in Shared Inbox
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedCustomer(null)}
            >
              Close
            </Button>
          </div>
        </div>
      </Drawer>

      {/* 6. DEAL DRAWER */}
      <Drawer
        isOpen={!!selectedDeal}
        onClose={() => setSelectedDeal(null)}
        title={selectedDeal?.title || "Opportunity Details"}
        description={`Stage: ${selectedDeal?.stage}`}
      >
        <div className="space-y-6">
          <div className="p-4 rounded-[8px] bg-[#EFEDE7] space-y-3">
            <span className="text-[11px] font-medium tracking-[0.06em] text-[#6A707C] uppercase">
              Deal Value
            </span>
            <div className="text-[32px] font-medium text-[#12141A] font-variant-numeric tabular-nums">
              ₹{(selectedDeal?.estimated_value || 0).toLocaleString()}
            </div>
          </div>

          <div className="space-y-2 text-[13px]">
            <div className="flex items-center justify-between py-1.5 border-b border-[#E4E1D8]">
              <span className="text-[#4B515D]">Client Name</span>
              <span className="font-medium text-[#12141A]">
                {selectedDeal?.contact_name || "Enterprise Lead"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[#E4E1D8]">
              <span className="text-[#4B515D]">Phone</span>
              <span className="font-medium text-[#12141A] font-variant-numeric tabular-nums">
                {selectedDeal?.contact_phone || "+919876543210"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[#E4E1D8]">
              <span className="text-[#4B515D]">Source</span>
              <span className="font-medium text-[#12141A]">
                {selectedDeal?.source || "Direct"}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E4E1D8] flex items-center gap-3">
            <Link href={`/app/${orgSlug}/leads`} className="flex-1">
              <Button variant="primary" size="sm" className="w-full">
                Open in Sales Pipeline
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedDeal(null)}
            >
              Close
            </Button>
          </div>
        </div>
      </Drawer>

      {/* 7. NEW OPPORTUNITY DRAWER */}
      <Drawer
        isOpen={newDealOpen}
        onClose={() => setNewDealOpen(false)}
        title="Create New Opportunity"
        description="Add a commercial opportunity to the live sales pipeline"
      >
        <form onSubmit={handleCreateDeal} className="space-y-4">
          <Input
            label="Deal Title *"
            placeholder="e.g. Annual WhatsApp Automation Retainer"
            value={dealTitle}
            onChange={(e) => setDealTitle(e.target.value)}
            required
          />

          <Input
            label="Estimated Value (INR) *"
            type="number"
            value={dealValue}
            onChange={(e) => setDealValue(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[#4B515D]">
              Pipeline Stage
            </label>
            <select
              value={dealStage}
              onChange={(e) => setDealStage(e.target.value as LeadStage)}
              className="w-full h-9 px-3 rounded-[8px] border border-[#E4E1D8] bg-[#EFEDE7] text-[13px] text-[#12141A] outline-none focus:border-[#FF5A1F] focus:bg-white"
            >
              <option value="new">Lead / Inbound</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal Sent</option>
              <option value="won">Won</option>
            </select>
          </div>

          <Input
            label="Client Name"
            placeholder="e.g. Rahul Verma"
            value={dealContactName}
            onChange={(e) => setDealContactName(e.target.value)}
          />

          <Input
            label="WhatsApp Phone"
            placeholder="+919876543210"
            value={dealContactPhone}
            onChange={(e) => setDealContactPhone(e.target.value)}
          />

          <div className="pt-4 border-t border-[#E4E1D8] flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setNewDealOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Opportunity
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
