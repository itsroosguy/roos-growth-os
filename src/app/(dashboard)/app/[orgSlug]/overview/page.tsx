"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useTenant } from "@/lib/organizations/tenant-context";
import { crmStore } from "@/lib/crm/crm-store";
import { whatsappStore } from "@/lib/whatsapp/whatsapp-store";
import { LeadStage, Task, Lead } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { useToast } from "@/components/ui/toast-context";
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
  Clock,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Users,
  Briefcase,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

export default function OverviewPage() {
  const { currentOrg } = useTenant();
  const orgSlug = currentOrg.slug;
  const { toast } = useToast();

  const [refreshKey, setRefreshKey] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [dismissedItemIds, setDismissedItemIds] = useState<Set<string>>(new Set());

  // Real store data
  const leads = useMemo(() => {
    return crmStore.getLeads(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  const tasks = useMemo(() => {
    return crmStore.getTasks(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  const conversations = useMemo(() => {
    return whatsappStore.getConversations(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  // 1. Metric: Active Leads (Excluding lost)
  const activeLeads = useMemo(() => {
    return leads.filter((l) => l.stage !== "lost");
  }, [leads]);

  // 2. Metric: Follow-ups Due (Tasks due today or overdue with status === 'todo')
  const dueTasks = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return tasks.filter((t) => t.status === "todo" && t.due_date <= today);
  }, [tasks]);

  const overdueTasksCount = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return tasks.filter((t) => t.status === "todo" && t.due_date < today).length;
  }, [tasks]);

  // 3. Metric: Open Conversations (Unread or open status)
  const openConversations = useMemo(() => {
    return conversations.filter(
      (c) => c.unread_count > 0 || c.status === "open"
    );
  }, [conversations]);

  const unreadConversationsCount = useMemo(() => {
    return conversations.filter((c) => c.unread_count > 0).length;
  }, [conversations]);

  // 4. Metric: Pipeline Value (Active pipeline deals)
  const totalPipelineValue = useMemo(() => {
    return leads
      .filter((l) => l.stage !== "won" && l.stage !== "lost")
      .reduce((sum, l) => sum + (l.estimated_value || 0), 0);
  }, [leads]);

  // Pipeline Stage Distribution
  const pipelineStages = useMemo(() => {
    const stages: { stage: LeadStage; label: string; count: number; value: number; color: string }[] = [
      { stage: "new", label: "New Lead", count: 0, value: 0, color: "bg-[#64748B]" },
      { stage: "contacted", label: "Contacted", count: 0, value: 0, color: "bg-[#0284C7]" },
      { stage: "qualified", label: "Qualified", count: 0, value: 0, color: "bg-[#3D5AFE]" },
      { stage: "proposal", label: "Proposal", count: 0, value: 0, color: "bg-[#F5A524]" },
      { stage: "won", label: "Won", count: 0, value: 0, color: "bg-[#12B886]" },
    ];

    leads.forEach((l) => {
      const target = stages.find((s) => s.stage === l.stage);
      if (target) {
        target.count += 1;
        target.value += l.estimated_value || 0;
      }
    });

    return stages;
  }, [leads]);

  // Items Requiring Attention: Urgent follow-ups + unanswered conversations
  const attentionItems = useMemo(() => {
    const items: Array<{
      id: string;
      type: "task" | "conversation";
      title: string;
      subtitle: string;
      tag: string;
      tagVariant: "warning" | "danger" | "info";
      timeLabel: string;
      actionLabel: string;
      actionHref?: string;
      taskId?: string;
    }> = [];

    // Due / Overdue Tasks
    dueTasks.forEach((t) => {
      const isOverdue = t.due_date < new Date().toISOString().split("T")[0];
      items.push({
        id: `task-${t.id}`,
        type: "task",
        title: t.title,
        subtitle: t.contact_name ? `Contact: ${t.contact_name}` : "Follow-up SLA",
        tag: isOverdue ? "Overdue" : "Due Today",
        tagVariant: isOverdue ? "danger" : "warning",
        timeLabel: t.due_date,
        actionLabel: "Mark Done",
        taskId: t.id,
      });
    });

    // Unread Inbound WhatsApp Conversations
    conversations
      .filter((c) => c.unread_count > 0)
      .slice(0, 3)
      .forEach((c) => {
        items.push({
          id: `conv-${c.id}`,
          type: "conversation",
          title: c.contact_name,
          subtitle: c.last_message_text || "New inbound message waiting",
          tag: "Unanswered",
          tagVariant: "info",
          timeLabel: c.last_message_at ? "Recent" : "Pending",
          actionLabel: "Reply",
          actionHref: `/app/${orgSlug}/inbox`,
        });
      });

    return items.filter((item) => !dismissedItemIds.has(item.id)).slice(0, 5);
  }, [dueTasks, conversations, dismissedItemIds, orgSlug]);

  // Recent Activity Feed
  const recentActivities = useMemo(() => {
    return [
      {
        id: "act-1",
        actor: "Aarav Patel",
        action: "sent a WhatsApp inquiry regarding the Enterprise Growth Plan",
        time: "10m ago",
        type: "whatsapp",
      },
      {
        id: "act-2",
        actor: "Sneha Reddy",
        action: "advanced to Proposal Review (Estimated value: ₹4,50,000)",
        time: "45m ago",
        type: "lead",
      },
      {
        id: "act-3",
        actor: "Vikram Malhotra",
        action: "completed technical qualification call",
        time: "2h ago",
        type: "task",
      },
      {
        id: "act-4",
        actor: "Meera Nair",
        action: "broadcast delivered via Meta Cloud API with 99.8% reach",
        time: "4h ago",
        type: "broadcast",
      },
      {
        id: "act-5",
        actor: "Praveen",
        action: "closed won deal with Apex Logistics (₹3,10,000)",
        time: "Yesterday",
        type: "won",
      },
    ];
  }, []);

  const handleCompleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    crmStore.updateTaskStatus(orgSlug, taskId, "completed");
    setDismissedItemIds((prev) => new Set(prev).add(`task-${taskId}`));
    setRefreshKey((k) => k + 1);
    toast("Task marked completed", { type: "success" });
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. PAGE HEADER                                                       */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-[#EDE8E0]">
        <div>
          <h1 className="text-[26px] sm:text-[28px] font-semibold text-[#12141A] tracking-[-0.02em] leading-tight">
            Overview
          </h1>
          <p className="mt-1 text-[13.5px] text-[#666C78] font-normal">
            {currentOrg.name} &bull; Workspace summary and operational priorities
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <Link href={`/app/${orgSlug}/inbox`}>
            <Button
              variant="outline"
              className="rounded-[12px] border-[#EDE8E0] bg-white hover:bg-[#F7F5F0] text-[#12141A] font-medium text-[13.5px] h-10 px-3.5 shadow-2xs transition-transform active:scale-[0.98] cursor-pointer flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4 text-[#FF5A1F]" />
              <span>WhatsApp Inbox</span>
            </Button>
          </Link>

          <Button
            variant="primary"
            onClick={() => setCreateModalOpen(true)}
            className="rounded-[12px] bg-gradient-to-b from-[#FF7A3D] to-[#FF5A1F] text-white font-medium text-[13.5px] h-10 px-4 shadow-[0_2px_8px_rgba(255,90,31,0.3)] hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>New Opportunity</span>
          </Button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. ESSENTIAL METRICS (Exactly 4 High-Value Real Business Indicators)  */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Active Leads */}
        <Link
          href={`/app/${orgSlug}/leads`}
          className="rounded-[16px] border border-[#EDE8E0] bg-white p-4 sm:p-5 flex flex-col justify-between hover:border-[#DCD6CC] hover:shadow-xs transition-all duration-140 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#454B57]">Active Leads</span>
            <div className="h-8 w-8 rounded-[10px] bg-[#EAEEFF] text-[#2A3DB5] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[26px] sm:text-[30px] font-semibold text-[#12141A] tabular-nums tracking-tight">
              <AnimatedNumber value={activeLeads.length} />
            </div>
            <p className="mt-0.5 text-[12px] text-[#666C78]">
              {leads.filter((l) => l.stage === "won").length} closed won deals
            </p>
          </div>
        </Link>

        {/* Metric 2: Follow-ups Due */}
        <Link
          href={`/app/${orgSlug}/tasks`}
          className="rounded-[16px] border border-[#EDE8E0] bg-white p-4 sm:p-5 flex flex-col justify-between hover:border-[#DCD6CC] hover:shadow-xs transition-all duration-140 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#454B57]">Follow-ups Due</span>
            <div className="h-8 w-8 rounded-[10px] bg-[#FFF3D6] text-[#8F5300] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[26px] sm:text-[30px] font-semibold text-[#12141A] tabular-nums tracking-tight">
              <AnimatedNumber value={dueTasks.length} />
            </div>
            <p className="mt-0.5 text-[12px] text-[#666C78]">
              {overdueTasksCount > 0 ? (
                <span className="text-[#B42336] font-medium">
                  {overdueTasksCount} overdue SLA
                </span>
              ) : (
                "All tasks on track"
              )}
            </p>
          </div>
        </Link>

        {/* Metric 3: Open Conversations */}
        <Link
          href={`/app/${orgSlug}/inbox`}
          className="rounded-[16px] border border-[#EDE8E0] bg-white p-4 sm:p-5 flex flex-col justify-between hover:border-[#DCD6CC] hover:shadow-xs transition-all duration-140 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#454B57]">Open Conversations</span>
            <div className="h-8 w-8 rounded-[10px] bg-[#E4F7EF] text-[#0A7A53] flex items-center justify-center group-hover:scale-105 transition-transform">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[26px] sm:text-[30px] font-semibold text-[#12141A] tabular-nums tracking-tight">
              <AnimatedNumber value={openConversations.length} />
            </div>
            <p className="mt-0.5 text-[12px] text-[#666C78]">
              {unreadConversationsCount > 0 ? (
                <span className="text-[#0A7A53] font-medium">
                  {unreadConversationsCount} unread inquiry
                </span>
              ) : (
                "Zero pending replies"
              )}
            </p>
          </div>
        </Link>

        {/* Metric 4: Pipeline Value */}
        <Link
          href={`/app/${orgSlug}/leads`}
          className="rounded-[16px] border border-[#EDE8E0] bg-white p-4 sm:p-5 flex flex-col justify-between hover:border-[#DCD6CC] hover:shadow-xs transition-all duration-140 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#454B57]">Pipeline Value</span>
            <div className="h-8 w-8 rounded-[10px] bg-[#FFF0EB] text-[#FF5A1F] flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[24px] sm:text-[28px] font-semibold text-[#12141A] tabular-nums tracking-tight truncate">
              {formatINR(totalPipelineValue)}
            </div>
            <p className="mt-0.5 text-[12px] text-[#666C78]">
              Active commercial pipeline
            </p>
          </div>
        </Link>
      </div>

      {/* ==================================================================== */}
      {/* 3. PRIMARY WORK AREA: Priorities Queue & Sales Pipeline Overview     */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Items Requiring Attention */}
        <div className="lg:col-span-7 rounded-[18px] border border-[#EDE8E0] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EDE8E0]">
            <div>
              <h2 className="text-[16px] font-semibold text-[#12141A] leading-tight">
                Items Requiring Attention
              </h2>
              <p className="text-[12.5px] text-[#666C78] mt-0.5">
                Prioritised follow-ups and unanswered inquiries
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[11.5px] font-medium bg-[#FAF9F5] text-[#454B57] border border-[#EDE8E0]">
              {attentionItems.length} pending
            </span>
          </div>

          {attentionItems.length === 0 ? (
            <div className="py-10 text-center text-[#666C78]">
              <CheckCircle2 className="h-8 w-8 mx-auto text-[#12B886] mb-2" />
              <p className="text-[14px] font-medium text-[#12141A]">You&apos;re completely caught up</p>
              <p className="text-[12.5px] mt-0.5">No overdue SLAs or unanswered conversations.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#EDE8E0]/70">
              {attentionItems.map((item) => (
                <div
                  key={item.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-[#12141A] truncate">
                        {item.title}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.2 rounded-full text-[10.5px] font-semibold tracking-wide shrink-0",
                          item.tagVariant === "danger"
                            ? "bg-[#FFE9EA] text-[#B42336] border border-[#FFCCD0]"
                            : item.tagVariant === "warning"
                            ? "bg-[#FFF3D6] text-[#8F5300] border border-[#FFE5A3]"
                            : "bg-[#EAF2FF] text-[#0D62D9] border border-[#BFD7FE]"
                        )}
                      >
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-[#666C78] truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>

                  {/* Direct Action */}
                  <div className="shrink-0">
                    {item.type === "task" && item.taskId ? (
                      <button
                        type="button"
                        onClick={(e) => handleCompleteTask(item.taskId!, e)}
                        className="h-8 px-3 rounded-[8px] border border-[#EDE8E0] bg-white text-[12.5px] font-medium text-[#12141A] hover:bg-[#F7F5F0] hover:border-[#DCD6CC] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="h-3.5 w-3.5 text-[#12B886]" />
                        <span>Complete</span>
                      </button>
                    ) : (
                      <Link
                        href={item.actionHref || `/app/${orgSlug}/inbox`}
                        className="h-8 px-3 rounded-[8px] bg-[#FF5A1F] text-white text-[12.5px] font-medium hover:bg-[#E54D15] active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>{item.actionLabel}</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-[#EDE8E0]">
            <Link
              href={`/app/${orgSlug}/tasks`}
              className="text-[12.5px] font-medium text-[#FF5A1F] hover:underline flex items-center gap-1"
            >
              <span>View all tasks and scheduled follow-ups</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Right Column (5 cols): Compact Sales Pipeline Overview */}
        <div className="lg:col-span-5 rounded-[18px] border border-[#EDE8E0] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EDE8E0]">
            <div>
              <h2 className="text-[16px] font-semibold text-[#12141A] leading-tight">
                Pipeline Stages
              </h2>
              <p className="text-[12.5px] text-[#666C78] mt-0.5">
                Distribution of opportunities in progress
              </p>
            </div>
            <Link
              href={`/app/${orgSlug}/leads`}
              className="text-[12.5px] font-medium text-[#FF5A1F] hover:underline flex items-center gap-1"
            >
              <span>Pipeline</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {pipelineStages.map((stage) => {
              const maxLeads = Math.max(...pipelineStages.map((s) => s.count), 1);
              const percent = Math.round((stage.count / maxLeads) * 100);

              return (
                <div key={stage.stage} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium text-[#12141A]">{stage.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11.5px] font-semibold text-[#666C78] bg-[#FAF9F5] px-1.5 py-0.2 rounded border border-[#EDE8E0]">
                        {stage.count} {stage.count === 1 ? "deal" : "deals"}
                      </span>
                      <span className="text-[12.5px] font-medium text-[#12141A] tabular-nums">
                        {stage.value > 0 ? formatINR(stage.value) : "—"}
                      </span>
                    </div>
                  </div>
                  {/* Visual Stage Progress Bar */}
                  <div className="h-2 w-full rounded-full bg-[#F3F4F6] overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-300", stage.color)}
                      style={{ width: `${Math.max(percent, stage.count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#EDE8E0]">
            <Link
              href={`/app/${orgSlug}/leads`}
              className="w-full h-9 rounded-[10px] border border-[#EDE8E0] bg-[#FAF9F5] hover:bg-[#F0EDE6] text-[13px] font-medium text-[#12141A] flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Manage Deals in Kanban Board</span>
              <ExternalLink className="h-3.5 w-3.5 text-[#666C78]" />
            </Link>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. SECONDARY CONTENT: Recent Activity Feed                            */}
      {/* ==================================================================== */}
      <div className="rounded-[18px] border border-[#EDE8E0] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#EDE8E0]">
          <div>
            <h2 className="text-[16px] font-semibold text-[#12141A] leading-tight">
              Recent Activity
            </h2>
            <p className="text-[12.5px] text-[#666C78] mt-0.5">
              Live updates across conversations, deals, and assignments
            </p>
          </div>
          <span className="text-[12px] text-[#666C78]">Real-time audit log</span>
        </div>

        <div className="space-y-3">
          {recentActivities.map((act) => {
            const avatarColor = getAvatarColor(act.actor);

            return (
              <div
                key={act.id}
                className="flex items-start justify-between gap-3 text-[13.5px] py-1.5"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={cn(
                      "h-7 w-7 rounded-[8px] text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5",
                      avatarColor.bg,
                      avatarColor.text
                    )}
                  >
                    {getInitials(act.actor)}
                  </div>
                  <p className="text-[#343A46] leading-snug">
                    <strong className="font-semibold text-[#12141A]">{act.actor}</strong>{" "}
                    {act.action}
                  </p>
                </div>
                <span className="text-[12px] text-[#8A909D] tabular-nums shrink-0 whitespace-nowrap">
                  {act.time}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. MODALS & DRAWERS                                                  */}
      {/* ==================================================================== */}
      <NewOpportunityModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        orgSlug={orgSlug}
        onSuccess={() => {
          setRefreshKey((k) => k + 1);
          toast("New opportunity created", { type: "success" });
        }}
      />

      {selectedLead && (
        <Drawer
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          title={selectedLead.title}
        >
          <div className="space-y-4 p-4 text-[13.5px]">
            <div>
              <span className="text-[#666C78] block text-[12px]">Contact</span>
              <span className="font-medium text-[#12141A]">{selectedLead.contact_name || "—"}</span>
            </div>
            <div>
              <span className="text-[#666C78] block text-[12px]">Stage</span>
              <span className="font-medium text-[#12141A] capitalize">{selectedLead.stage}</span>
            </div>
            <div>
              <span className="text-[#666C78] block text-[12px]">Estimated Value</span>
              <span className="font-medium text-[#12141A]">
                {formatINR(selectedLead.estimated_value || 0)}
              </span>
            </div>
            <div className="pt-4 border-t border-[#EDE8E0]">
              <Link
                href={`/app/${orgSlug}/leads`}
                className="w-full h-10 rounded-[10px] bg-[#FF5A1F] text-white flex items-center justify-center font-medium"
              >
                Open in Pipeline
              </Link>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
