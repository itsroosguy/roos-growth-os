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
import { useMounted } from "@/lib/use-mounted";
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
  const mounted = useMounted();

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
    <div className="space-y-8">
      {/* ===================================================================== */}
      {/* SECTION A: WELCOME & CONTEXTUAL WORKSPACE HEADER                      */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/60">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
              Workspace Overview
            </h1>
            <span className="glass-pill rounded-full bg-white/90 border border-white text-xs sm:text-sm font-bold px-3.5 py-1 text-slate-800 shadow-xs">
              {currentOrg.name}
            </span>
          </div>
          <p className="text-sm text-slate-600 font-medium">
            Real-time performance metrics, pending follow-ups, and customer acquisition velocity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/app/${orgSlug}/inbox`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-xs bg-white/85 hover:bg-white text-slate-800 border border-white/80 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <MessageSquare className="h-4.5 w-4.5 text-blue-600" />
            <span>Shared Inbox</span>
            {mounted && unreadConversations.length > 0 && (
              <span
                suppressHydrationWarning
                className="ml-1 px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-black shadow-xs"
              >
                {unreadConversations.length}
              </span>
            )}
          </Link>

          <Link
            href={`/app/${orgSlug}/leads`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-xs bg-blue-600 hover:bg-blue-700 text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>New Lead</span>
          </Link>
        </div>
      </div>


      {/* ===================================================================== */}
      {/* SECTION B: FOUR ESSENTIAL BUSINESS INDICATORS                         */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Metric 1: Active Pipeline Value */}
        <div className="glass-card rounded-[24px] border border-white/80 shadow-glass bg-white/85 backdrop-blur-xl hover:bg-white/95 hover:shadow-glass hover:-translate-y-0.5 transition-all duration-200 p-6 flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
              Active Pipeline Value
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/25 text-blue-700 border border-blue-500/30 shadow-xs">
              <TrendingUp className="h-5.5 w-5.5" />
            </div>
          </div>
          <div>
            <div
              suppressHydrationWarning
              className="text-3xl sm:text-4xl font-black font-mono text-slate-950 tracking-tight"
            >
              {formatCurrency(metrics.pipelineValue)}
            </div>
            <p className="text-sm text-slate-600 mt-2 flex items-center gap-2 font-medium">
              <span className="text-emerald-700 font-extrabold bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300">
                +{leads.length}
              </span>
              <span>opportunities in pipeline</span>
            </p>
          </div>
        </div>

        {/* Metric 2: Active Leads */}
        <div className="glass-card rounded-[24px] border border-white/80 shadow-glass bg-white/85 backdrop-blur-xl hover:bg-white/95 hover:shadow-glass hover:-translate-y-0.5 transition-all duration-200 p-6 flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
              Active Leads
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/25 text-indigo-700 border border-indigo-500/30 shadow-xs">
              <Users className="h-5.5 w-5.5" />
            </div>
          </div>
          <div>
            <div
              suppressHydrationWarning
              className="text-3xl sm:text-4xl font-black font-mono text-slate-950 tracking-tight"
            >
              {leads.length}
            </div>
            <p className="text-sm text-slate-600 mt-2 font-medium">
              <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{metrics.leadsByStage.new.count}</span> new • <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{metrics.leadsByStage.qualified.count}</span> qualified
            </p>
          </div>
        </div>

        {/* Metric 3: Follow-ups Due */}
        <div className="glass-card rounded-[24px] border border-white/80 shadow-glass bg-white/85 backdrop-blur-xl hover:bg-white/95 hover:shadow-glass hover:-translate-y-0.5 transition-all duration-200 p-6 flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
              Follow-ups Due
            </span>
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl border shadow-xs ${
                metrics.overdueFollowUps > 0
                  ? "bg-gradient-to-br from-rose-500/20 to-red-500/25 text-rose-700 border-rose-500/30"
                  : "bg-gradient-to-br from-amber-500/20 to-orange-500/25 text-amber-700 border-amber-500/30"
              }`}
            >
              <Clock className="h-5.5 w-5.5" />
            </div>
          </div>
          <div>
            <div
              suppressHydrationWarning
              className="text-3xl sm:text-4xl font-black font-mono text-slate-950 tracking-tight"
            >
              {metrics.openFollowUps}
            </div>
            <p
              className={`text-sm mt-2 font-medium ${
                metrics.overdueFollowUps > 0 ? "text-rose-700 font-bold" : "text-slate-600"
              }`}
            >
              {metrics.overdueFollowUps > 0 ? (
                <span className="bg-rose-100/90 text-rose-800 px-2 py-0.5 rounded-md border border-rose-300 font-bold inline-block">
                  {metrics.overdueFollowUps} overdue actions required
                </span>
              ) : (
                "All follow-ups on schedule"
              )}
            </p>
          </div>
        </div>

        {/* Metric 4: Closed Revenue Won */}
        <div className="glass-card rounded-[24px] border border-white/80 shadow-glass bg-white/85 backdrop-blur-xl hover:bg-white/95 hover:shadow-glass hover:-translate-y-0.5 transition-all duration-200 p-6 flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
              Won Revenue
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/25 text-emerald-700 border border-emerald-500/30 shadow-xs">
              <CheckCircle2 className="h-5.5 w-5.5" />
            </div>
          </div>
          <div>
            <div
              suppressHydrationWarning
              className="text-3xl sm:text-4xl font-black font-mono text-slate-950 tracking-tight"
            >
              {formatCurrency(metrics.wonDeals.value)}
            </div>
            <p className="text-sm text-slate-600 mt-2 flex items-center gap-2 font-medium">
              <span className="text-emerald-800 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300">
                {metrics.wonDeals.count} won
              </span>
              <span>• <strong className="text-slate-900 font-extrabold">{metrics.conversionRate}%</strong> win rate</span>
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION C & D: MEANINGFUL PIPELINE FUNNEL & NEEDS ATTENTION           */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SECTION C: PIPELINE PROGRESSION & DISTRIBUTION CHART */}
        <div className="lg:col-span-7 glass-panel rounded-[26px] border border-white/80 shadow-glass bg-white/85 backdrop-blur-xl p-6 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/60 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-950 tracking-tight">
                Sales Pipeline Distribution
              </h3>
              <p className="text-sm text-slate-600 mt-0.5 font-medium">
                Conversion funnel across active commercial opportunities
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/app/${orgSlug}/leads`}
                className="text-xs sm:text-sm font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/85 border border-white/90 hover:bg-white shadow-xs transition-all"
              >
                <span>Pipeline Board</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Funnel Progress Bars */}
          <div className="space-y-5">
            {stageKeys.map((stageKey) => {
              const stageData = metrics.leadsByStage[stageKey];
              const percentage =
                leads.length > 0
                  ? Math.round((stageData.count / leads.length) * 100)
                  : 0;
              const config = stageColors[stageKey];

              return (
                <div key={stageKey} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className={`h-3 w-3 rounded-full ${config.bar} shadow-xs`} />
                      <span className="font-bold text-slate-900">
                        {stageLabels[stageKey]}
                      </span>
                      <span
                        suppressHydrationWarning
                        className="text-slate-700 font-mono font-bold text-xs bg-slate-100/90 border border-slate-200 px-2 py-0.5 rounded-md"
                      >
                        {stageData.count} deals
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        suppressHydrationWarning
                        className="font-mono font-black text-slate-950 text-sm sm:text-base"
                      >
                        {formatCurrency(stageData.value)}
                      </span>
                      <span
                        suppressHydrationWarning
                        className="text-slate-700 text-xs sm:text-sm font-extrabold w-10 text-right font-mono"
                      >
                        {percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Visual Bar Track */}
                  <div className="h-3 w-full rounded-full bg-slate-200/60 overflow-hidden border border-white/70">
                    <div
                      className={`h-full ${config.bar} rounded-full transition-all duration-300 shadow-xs`}
                      style={{ width: `${Math.max(percentage, stageData.count > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-white/70 border border-white/90 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between text-sm shadow-xs gap-2">
            <span className="text-slate-700 font-medium">
              Total Active Opportunities:{" "}
              <strong
                suppressHydrationWarning
                className="text-slate-950 font-mono font-black text-base"
              >
                {leads.length}
              </strong>
            </span>
            <span className="text-slate-700 font-medium">
              Overall Conversion Rate:{" "}
              <strong
                suppressHydrationWarning
                className="text-emerald-700 font-mono font-black text-base"
              >
                {metrics.conversionRate}%
              </strong>
            </span>
          </div>
        </div>

        {/* SECTION D: NEEDS ATTENTION ACTIONABLE LIST */}
        <div className="lg:col-span-5 glass-panel rounded-[26px] border border-white/80 shadow-glass bg-white/85 backdrop-blur-xl p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between border-b border-white/60 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700 border border-amber-500/30 shadow-xs">
                <AlertCircle className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-lg font-bold text-slate-950 tracking-tight">
                Needs Attention
              </h3>
            </div>
            <span
              suppressHydrationWarning
              className="text-xs font-mono text-slate-700 font-extrabold px-2.5 py-1 rounded-full bg-white/90 border border-slate-200 shadow-xs uppercase"
            >
              {attentionItems.length} ACTION REQUIRED
            </span>
          </div>

          {attentionItems.length === 0 ? (
            <div className="py-12 text-center space-y-2.5">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-700 border border-emerald-500/30 shadow-xs">
                <Check className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-slate-900">
                Everything is on schedule!
              </p>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                No overdue follow-up tasks or unanswered inquiries require urgent attention.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {attentionItems.map((item) => (
                <div
                  key={item.id}
                  className="glass-card rounded-2xl border border-white/90 bg-white/90 hover:bg-white p-4 space-y-2.5 transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <p className="text-sm font-bold text-slate-950 leading-snug">
                      {item.title}
                    </p>
                    <Badge variant={item.badgeVariant} className="text-xs px-2.5 py-0.5 shrink-0 font-bold shadow-xs">
                      {item.badgeText}
                    </Badge>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 font-medium line-clamp-1">
                    {item.subtitle}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    {item.type === "task" ? (
                      <button
                        type="button"
                        onClick={() => handleMarkTaskCompleted(item.id)}
                        className="text-xs sm:text-sm text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Mark Completed</span>
                      </button>
                    ) : (
                      <span className="text-xs font-mono text-slate-500 font-bold uppercase">
                        Action Required
                      </span>
                    )}

                    <Link
                      href={item.href}
                      className="text-xs sm:text-sm font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 transition-colors"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
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
      <div className="glass-panel rounded-[26px] border border-white/80 shadow-glass bg-white/85 backdrop-blur-xl p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between border-b border-white/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-500/15 text-slate-700 border border-slate-400/30 shadow-xs">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-lg font-bold text-slate-950 tracking-tight">
              Recent Workspace Activity
            </h3>
          </div>
          <span className="text-xs sm:text-sm text-slate-600 font-medium">
            Timeline of recent client engagements
          </span>
        </div>

        <div className="divide-y divide-white/60">
          {leads.slice(0, 5).map((lead) => {
            const stageConfig = stageColors[lead.stage];
            return (
              <div
                key={lead.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm hover:bg-white/50 px-3 rounded-2xl transition-all"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${stageConfig.bg} ${stageConfig.text} shrink-0 border border-white/90 shadow-xs`}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-950 text-sm sm:text-base">
                      {lead.title}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium">
                      {lead.contact_name} • Sourced via {lead.source}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:justify-end">
                  <div className="text-right font-mono">
                    <span
                      suppressHydrationWarning
                      className="block font-black text-slate-950 text-sm sm:text-base"
                    >
                      {formatCurrency(lead.estimated_value)}
                    </span>
                    <span className="block text-xs text-slate-500 font-medium">
                      {formatDate(lead.updated_at)}
                    </span>
                  </div>

                  <Link
                    href={`/app/${orgSlug}/leads`}
                    className="p-2 rounded-xl text-slate-500 hover:text-blue-700 hover:bg-white transition-all border border-transparent hover:border-white shadow-2xs cursor-pointer"
                    title="Open Lead"
                  >
                    <ChevronRight className="h-4.5 w-4.5" />
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
