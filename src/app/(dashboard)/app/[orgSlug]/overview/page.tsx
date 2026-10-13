"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useTenant } from "@/lib/organizations/tenant-context";
import { crmStore } from "@/lib/crm/crm-store";
import { whatsappStore } from "@/lib/whatsapp/whatsapp-store";
import { LeadStage, Task } from "@/types/crm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Plus,
  Award,
  AlertCircle,
  Phone,
  MessageSquare,
  ChevronRight,
  ArrowRight,
  Building2,
  Check,
  Calendar,
  AlertTriangle,
  Zap,
} from "lucide-react";

export default function OverviewPage() {
  const { currentOrg } = useTenant();
  const orgSlug = currentOrg.slug;

  const [timePeriod, setTimePeriod] = useState<"month" | "30days" | "all">("all");
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());

  // Real data queries from stores
  const metrics = useMemo(() => {
    return crmStore.getMetrics(orgSlug);
  }, [orgSlug]);

  const leads = useMemo(() => {
    return crmStore.getLeads(orgSlug);
  }, [orgSlug]);

  const tasks = useMemo(() => {
    return crmStore.getTasks(orgSlug);
  }, [orgSlug]);

  const conversations = useMemo(() => {
    return whatsappStore.getConversations(orgSlug);
  }, [orgSlug]);

  // Derived calculations
  const openConversations = useMemo(() => {
    return conversations.filter((c) => c.status === "open");
  }, [conversations]);

  const unreadConversations = useMemo(() => {
    return conversations.filter((c) => c.unread_count > 0);
  }, [conversations]);

  // Priority "Needs Attention" items
  const attentionItems = useMemo(() => {
    const list: Array<{
      id: string;
      type: "task" | "lead" | "inbox";
      title: string;
      subtitle: string;
      badgeText: string;
      badgeVariant: "danger" | "warning" | "default";
      href: string;
      actionLabel: string;
    }> = [];

    // 1. Overdue or Today tasks
    const pendingTasks = tasks.filter(
      (t) => t.status !== "completed" && !completedTaskIds.has(t.id)
    );
    pendingTasks.slice(0, 3).forEach((task) => {
      const isOverdue = new Date(task.due_date) < new Date(Date.now() - 3600000);
      list.push({
        id: task.id,
        type: "task",
        title: task.title,
        subtitle: `Follow-up with ${task.contact_name} (${task.lead_title || "Lead"})`,
        badgeText: isOverdue ? "Overdue" : "Due Today",
        badgeVariant: isOverdue ? "danger" : "warning",
        href: `/app/${orgSlug}/tasks`,
        actionLabel: "View Task",
      });
    });

    // 2. Uncontacted new leads
    const newLeads = leads.filter((l) => l.stage === "new");
    if (newLeads.length > 0) {
      const newestLead = newLeads[0];
      list.push({
        id: `lead-new-${newestLead.id}`,
        type: "lead",
        title: `New opportunity: ${newestLead.title}`,
        subtitle: `${newestLead.contact_name} • ${formatCurrency(newestLead.estimated_value)}`,
        badgeText: "Awaiting Contact",
        badgeVariant: "default",
        href: `/app/${orgSlug}/leads`,
        actionLabel: "Open Lead",
      });
    }

    // 3. Unread inbox chats
    if (unreadConversations.length > 0) {
      const chat = unreadConversations[0];
      list.push({
        id: `chat-${chat.id}`,
        type: "inbox",
        title: `WhatsApp message from ${chat.contact_name || chat.contact_phone}`,
        subtitle: chat.last_message_text || "Customer message waiting in shared inbox",
        badgeText: `${chat.unread_count} Unread`,
        badgeVariant: "default",
        href: `/app/${orgSlug}/inbox`,
        actionLabel: "Reply",
      });
    }

    return list;
  }, [tasks, leads, unreadConversations, orgSlug, completedTaskIds]);

  // Stage funnel labels and data
  const stageKeys: LeadStage[] = ["new", "contacted", "qualified", "proposal", "won", "lost"];
  const stageLabels: Record<LeadStage, string> = {
    new: "New Inquiry",
    contacted: "Contacted",
    qualified: "Qualified",
    proposal: "Proposal Sent",
    won: "Deals Won",
    lost: "Lost / Closed",
  };

  const stageColors: Record<LeadStage, { bar: string; text: string; bg: string }> = {
    new: { bar: "bg-sky-500", text: "text-sky-700", bg: "bg-sky-50" },
    contacted: { bar: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
    qualified: { bar: "bg-purple-500", text: "text-purple-700", bg: "bg-purple-50" },
    proposal: { bar: "bg-blue-600", text: "text-blue-700", bg: "bg-blue-50" },
    won: { bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
    lost: { bar: "bg-rose-400", text: "text-rose-700", bg: "bg-rose-50" },
  };

  const handleMarkTaskCompleted = (taskId: string) => {
    crmStore.updateTaskStatus(orgSlug, taskId, "completed");
    setCompletedTaskIds((prev) => new Set(prev).add(taskId));
  };

  return (
    <div className="space-y-7">
      {/* ===================================================================== */}
      {/* SECTION A: WELCOME & CONTEXTUAL WORKSPACE HEADER                      */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Workspace Overview
            </h1>
            <span className="glass-pill rounded-full bg-white/80 border border-white text-xs font-semibold px-3 py-0.5 text-slate-700 shadow-xs">
              {currentOrg.name}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-normal">
            Real-time performance metrics, pending follow-ups, and customer acquisition velocity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/app/${orgSlug}/inbox`}>
            <Button variant="outline" size="default" className="flex items-center gap-2 shadow-xs bg-white/80 hover:bg-white border-white/80 rounded-xl">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span>Shared Inbox</span>
              {unreadConversations.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                  {unreadConversations.length}
                </span>
              )}
            </Button>
          </Link>

          <Link href={`/app/${orgSlug}/leads`}>
            <Button size="default" className="flex items-center gap-2 shadow-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
              <Plus className="h-4 w-4" />
              <span>New Lead</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION B: FOUR ESSENTIAL BUSINESS INDICATORS                         */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Metric 1: Active Pipeline Value */}
        <div className="glass-card rounded-[22px] border border-white/70 shadow-glass bg-white/75 backdrop-blur-xl hover:bg-white/90 hover:shadow-glass hover:-translate-y-0.5 transition-all duration-200 p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Pipeline Value
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-indigo-500/20 text-blue-600 border border-blue-500/20 shadow-xs">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
              {formatCurrency(metrics.pipelineValue)}
            </div>
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
              <span className="text-emerald-600 font-bold">+{leads.length}</span>
              <span>opportunities in pipeline</span>
            </p>
          </div>
        </div>

        {/* Metric 2: Active Leads */}
        <div className="glass-card rounded-[22px] border border-white/70 shadow-glass bg-white/75 backdrop-blur-xl hover:bg-white/90 hover:shadow-glass hover:-translate-y-0.5 transition-all duration-200 p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Leads
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/15 to-purple-500/20 text-indigo-600 border border-indigo-500/20 shadow-xs">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
              {leads.length}
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              <span className="font-semibold text-slate-700">{metrics.leadsByStage.new.count}</span> new • <span className="font-semibold text-slate-700">{metrics.leadsByStage.qualified.count}</span> qualified
            </p>
          </div>
        </div>

        {/* Metric 3: Follow-ups Due */}
        <div className="glass-card rounded-[22px] border border-white/70 shadow-glass bg-white/75 backdrop-blur-xl hover:bg-white/90 hover:shadow-glass hover:-translate-y-0.5 transition-all duration-200 p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Follow-ups Due
            </span>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl border shadow-xs ${
                metrics.overdueFollowUps > 0
                  ? "bg-gradient-to-br from-rose-500/15 to-red-500/20 text-rose-600 border-rose-500/20"
                  : "bg-gradient-to-br from-amber-500/15 to-orange-500/20 text-amber-600 border-amber-500/20"
              }`}
            >
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
              {metrics.openFollowUps}
            </div>
            <p
              className={`text-xs mt-1.5 font-medium ${
                metrics.overdueFollowUps > 0 ? "text-rose-600 font-semibold" : "text-slate-500"
              }`}
            >
              {metrics.overdueFollowUps > 0
                ? `${metrics.overdueFollowUps} overdue actions required`
                : "All follow-ups on schedule"}
            </p>
          </div>
        </div>

        {/* Metric 4: Closed Revenue Won */}
        <div className="glass-card rounded-[22px] border border-white/70 shadow-glass bg-white/75 backdrop-blur-xl hover:bg-white/90 hover:shadow-glass hover:-translate-y-0.5 transition-all duration-200 p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Won Revenue
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/20 text-emerald-600 border border-emerald-500/20 shadow-xs">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
              {formatCurrency(metrics.wonDeals.value)}
            </div>
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
              <span className="text-emerald-600 font-bold">
                {metrics.wonDeals.count} won deals
              </span>
              <span>• {metrics.conversionRate}% win rate</span>
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION C & D: MEANINGFUL PIPELINE FUNNEL & NEEDS ATTENTION           */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SECTION C: PIPELINE PROGRESSION & DISTRIBUTION CHART */}
        <div className="lg:col-span-7 glass-panel rounded-[26px] border border-white/70 shadow-glass bg-white/75 backdrop-blur-xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/60 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Sales Pipeline Distribution
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Conversion funnel across active commercial opportunities
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/app/${orgSlug}/leads`}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/70 border border-white/80 hover:bg-white shadow-xs transition-all"
              >
                <span>Pipeline Board</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Funnel Progress Bars */}
          <div className="space-y-4">
            {stageKeys.map((stageKey) => {
              const stageData = metrics.leadsByStage[stageKey];
              const percentage =
                leads.length > 0
                  ? Math.round((stageData.count / leads.length) * 100)
                  : 0;
              const config = stageColors[stageKey];

              return (
                <div key={stageKey} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${config.bar} shadow-xs`} />
                      <span className="font-semibold text-slate-800">
                        {stageLabels[stageKey]}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        ({stageData.count})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">
                        {formatCurrency(stageData.value)}
                      </span>
                      <span className="text-slate-500 text-[11px] font-semibold w-8 text-right">
                        {percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Visual Bar Track */}
                  <div className="h-2.5 w-full rounded-full bg-slate-200/50 overflow-hidden border border-white/60">
                    <div
                      className={`h-full ${config.bar} rounded-full transition-all duration-300 shadow-xs`}
                      style={{ width: `${Math.max(percentage, stageData.count > 0 ? 5 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 rounded-2xl bg-white/60 border border-white/80 backdrop-blur-sm flex items-center justify-between text-xs shadow-xs">
            <span className="text-slate-600">
              Total Active Opportunities: <strong className="text-slate-900 font-mono font-bold">{leads.length}</strong>
            </span>
            <span className="text-slate-600">
              Overall Conversion Rate: <strong className="text-emerald-600 font-mono font-bold">{metrics.conversionRate}%</strong>
            </span>
          </div>
        </div>

        {/* SECTION D: NEEDS ATTENTION ACTIONABLE LIST */}
        <div className="lg:col-span-5 glass-panel rounded-[26px] border border-white/70 shadow-glass bg-white/75 backdrop-blur-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 border border-amber-500/20 shadow-xs">
                <AlertCircle className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Needs Attention
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500 font-bold px-2 py-0.5 rounded-full bg-white/80 border border-white/80 shadow-xs uppercase">
              {attentionItems.length} ACTION REQUIRED
            </span>
          </div>

          {attentionItems.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 border border-emerald-500/20 shadow-xs">
                <Check className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                Everything is on schedule!
              </p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                No overdue follow-up tasks or unanswered inquiries require urgent attention.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {attentionItems.map((item) => (
                <div
                  key={item.id}
                  className="glass-card rounded-2xl border border-white/80 bg-white/80 hover:bg-white/95 p-3.5 space-y-2 transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-slate-900 leading-snug">
                      {item.title}
                    </p>
                    <Badge variant={item.badgeVariant} className="text-[10px] px-2 py-0.5 shrink-0 font-semibold shadow-xs">
                      {item.badgeText}
                    </Badge>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    {item.subtitle}
                  </p>

                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100/80">
                    {item.type === "task" ? (
                      <button
                        type="button"
                        onClick={() => handleMarkTaskCompleted(item.id)}
                        className="text-[11px] text-emerald-600 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Check className="h-3 w-3" />
                        <span>Mark Completed</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">
                        Action Required
                      </span>
                    )}

                    <Link
                      href={item.href}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION E: RECENT ACTIVITY & QUICK ACTIONS                            */}
      {/* ===================================================================== */}
      <div className="glass-panel rounded-[26px] border border-white/70 shadow-glass bg-white/75 backdrop-blur-xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-500/10 text-slate-600 border border-slate-400/20 shadow-xs">
              <Clock className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Recent Workspace Activity
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Timeline of recent client engagements
          </span>
        </div>

        <div className="divide-y divide-white/60">
          {leads.slice(0, 5).map((lead) => {
            const stageConfig = stageColors[lead.stage];
            return (
              <div
                key={lead.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-white/40 px-2 rounded-xl transition-all"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${stageConfig.bg} ${stageConfig.text} shrink-0 border border-white/80 shadow-xs`}
                  >
                    <Building2 className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      {lead.title}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {lead.contact_name} • Sourced via {lead.source}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:justify-end">
                  <div className="text-right font-mono">
                    <span className="block font-bold text-slate-900">
                      {formatCurrency(lead.estimated_value)}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {formatDate(lead.updated_at)}
                    </span>
                  </div>

                  <Link href={`/app/${orgSlug}/leads`}>
                    <button
                      type="button"
                      className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-white/80 transition-all border border-transparent hover:border-white/80 shadow-2xs"
                      title="Open Lead"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
