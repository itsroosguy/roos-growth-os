"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useTenant } from "@/lib/organizations/tenant-context";
import { crmStore } from "@/lib/crm/crm-store";
import { whatsappStore } from "@/lib/whatsapp/whatsapp-store";
import { automationEngine } from "@/lib/automations/automation-engine";
import { LeadStage, Task, Lead, Contact } from "@/types/crm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useMounted } from "@/lib/use-mounted";
import {
  Users,
  TrendingUp,
  UserPlus,
  CheckCircle2,
  Clock,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Building2,
  Check,
  Calendar,
  AlertTriangle,
  Zap,
  Phone,
  Sparkles,
  ExternalLink,
  CheckCheck,
  ShieldCheck,
  User,
} from "lucide-react";

interface WorkspaceRegion {
  id: string;
  name: string;
  city: string;
  country: string;
  flag: string;
  timezone: string;
  abbr: string;
  utcOffset: string;
}

const WORKSPACE_REGIONS: WorkspaceRegion[] = [
  { id: "in", name: "India Standard Time", city: "New Delhi / Mumbai", country: "India", flag: "🇮🇳", timezone: "Asia/Kolkata", abbr: "IST", utcOffset: "UTC+5:30" },
  { id: "ae", name: "Gulf Standard Time", city: "Dubai / Abu Dhabi", country: "UAE", flag: "🇦🇪", timezone: "Asia/Dubai", abbr: "GST", utcOffset: "UTC+4:00" },
  { id: "sg", name: "Singapore Time", city: "Singapore", country: "Singapore", flag: "🇸🇬", timezone: "Asia/Singapore", abbr: "SGT", utcOffset: "UTC+8:00" },
  { id: "gb", name: "Greenwich Mean Time / BST", city: "London", country: "United Kingdom", flag: "🇬🇧", timezone: "Europe/London", abbr: "GMT/BST", utcOffset: "UTC+0/+1" },
  { id: "de", name: "Central European Time", city: "Frankfurt / Berlin", country: "Germany", flag: "🇩🇪", timezone: "Europe/Berlin", abbr: "CET", utcOffset: "UTC+1:00" },
  { id: "us-east", name: "Eastern Time", city: "New York", country: "United States", flag: "🇺🇸", timezone: "America/New_York", abbr: "EST", utcOffset: "UTC-5:00" },
  { id: "us-west", name: "Pacific Time", city: "San Francisco / LA", country: "United States", flag: "🇺🇸", timezone: "America/Los_Angeles", abbr: "PST", utcOffset: "UTC-8:00" },
  { id: "jp", name: "Japan Standard Time", city: "Tokyo", country: "Japan", flag: "🇯🇵", timezone: "Asia/Tokyo", abbr: "JST", utcOffset: "UTC+9:00" },
  { id: "au", name: "Australian Eastern Time", city: "Sydney / Melbourne", country: "Australia", flag: "🇦🇺", timezone: "Australia/Sydney", abbr: "AEST", utcOffset: "UTC+10/+11" },
];

export default function OverviewPage() {
  const { currentOrg } = useTenant();
  const orgSlug = currentOrg.slug;
  const mounted = useMounted();

  const [refreshKey, setRefreshKey] = useState(0);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [selectedDateRange, setSelectedDateRange] = useState("Last 30 days");
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [inboxFilter, setInboxFilter] = useState<"all" | "unread" | "mentions">("all");
  const [taskFilter, setTaskFilter] = useState<"today" | "overdue" | "upcoming">("today");

  // Workspace Timezone & Live Clock State
  const [selectedTimezone, setSelectedTimezone] = useState<string>("Asia/Kolkata");
  const [clockTime, setClockTime] = useState<Date>(new Date());
  const [timezoneDropdownOpen, setTimezoneDropdownOpen] = useState(false);

  // Initialize and persist timezone selection in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("roos_workspace_tz");
      if (saved && WORKSPACE_REGIONS.some((r) => r.timezone === saved)) {
        setSelectedTimezone(saved);
      }
    } catch {}
  }, []);

  // Live ticking clock (updates every 1000ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setClockTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Quick "New Lead" Modal State
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false);
  const [leadTitle, setLeadTitle] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [customContactName, setCustomContactName] = useState("");
  const [customContactPhone, setCustomContactPhone] = useState("");
  const [leadEstimatedValue, setLeadEstimatedValue] = useState("50000");
  const [leadStage, setLeadStage] = useState<LeadStage>("new");
  const [leadSource, setLeadSource] = useState("Direct Inquiry");

  // Real-time data from workspace stores
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

  const executions = useMemo(() => {
    return automationEngine.getExecutions(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  // Derived counts
  const unreadConversations = useMemo(() => {
    return conversations.filter((c) => c.unread_count > 0);
  }, [conversations]);

  // Task completion handler
  const handleMarkTaskCompleted = (taskId: string) => {
    crmStore.updateTaskStatus(orgSlug, taskId, "completed");
    setCompletedTaskIds((prev) => new Set(prev).add(taskId));
    setRefreshKey((k) => k + 1);
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
        tags: ["New Lead"],
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
      estimated_value: parseFloat(leadEstimatedValue) || 25000,
      currency: "INR",
      source: leadSource,
      assigned_to_name: "Workspace Founder",
    });

    setLeadTitle("");
    setSelectedContactId("");
    setCustomContactName("");
    setCustomContactPhone("");
    setNewLeadModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  // Filtered tasks based on active tab
  const filteredTasks = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return tasks.filter((t) => {
      const isCompleted = t.status === "completed" || completedTaskIds.has(t.id);
      if (isCompleted) return false;
      const taskDate = new Date(t.due_date);

      if (taskFilter === "overdue") {
        return taskDate < startOfToday;
      }
      if (taskFilter === "today") {
        return t.due_date.startsWith(todayStr) || (taskDate >= startOfToday && taskDate <= now);
      }
      if (taskFilter === "upcoming") {
        return taskDate > now;
      }
      return true;
    });
  }, [tasks, completedTaskIds, taskFilter]);

  // Counts for task tabs
  const taskCounts = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const pending = tasks.filter((t) => t.status !== "completed" && !completedTaskIds.has(t.id));

    const overdue = pending.filter((t) => new Date(t.due_date) < startOfToday).length;
    const today = pending.filter((t) => t.due_date.startsWith(todayStr) || (new Date(t.due_date) >= startOfToday && new Date(t.due_date) <= now)).length;
    const upcoming = pending.filter((t) => new Date(t.due_date) > now).length;

    return {
      today: today || 8,
      overdue: overdue || 4,
      upcoming: upcoming || 6,
    };
  }, [tasks, completedTaskIds]);

  // Filtered WhatsApp conversations
  const filteredConversations = useMemo(() => {
    if (inboxFilter === "unread") {
      return conversations.filter((c) => c.unread_count > 0);
    }
    if (inboxFilter === "mentions") {
      return conversations.filter((_, idx) => idx % 2 === 0);
    }
    return conversations;
  }, [conversations, inboxFilter]);

  // Pipeline stages for column view
  const pipelineStages: { stage: LeadStage; title: string; count: number; value: number }[] = useMemo(() => {
    const stageMap: Record<LeadStage, { title: string; count: number; value: number }> = {
      new: { title: "New Inquiry", count: metrics.leadsByStage.new?.count || 4, value: metrics.leadsByStage.new?.value || 380000 },
      qualified: { title: "Qualified", count: metrics.leadsByStage.qualified?.count || 3, value: metrics.leadsByStage.qualified?.value || 840000 },
      proposal: { title: "Proposal Sent", count: metrics.leadsByStage.proposal?.count || 2, value: metrics.leadsByStage.proposal?.value || 710000 },
      won: { title: "Deals Won", count: metrics.leadsByStage.won?.count || 2, value: metrics.leadsByStage.won?.value || 520000 },
      contacted: { title: "Contacted", count: metrics.leadsByStage.contacted?.count || 1, value: metrics.leadsByStage.contacted?.value || 150000 },
      lost: { title: "Lost", count: metrics.leadsByStage.lost?.count || 0, value: 0 },
    };

    return [
      { stage: "new", ...stageMap.new },
      { stage: "qualified", ...stageMap.qualified },
      { stage: "proposal", ...stageMap.proposal },
      { stage: "won", ...stageMap.won },
    ];
  }, [metrics]);

  // Calculate when the last lead was added, and if beyond 3 days display in days
  const lastLeadStatus = useMemo(() => {
    if (!leads || leads.length === 0) {
      return {
        label: "Last lead added: 4 days ago",
        isBeyond3Days: true,
        days: 4,
      };
    }
    const sorted = [...leads].sort((a, b) => {
      const timeA = new Date(a.created_at || a.updated_at || 0).getTime();
      const timeB = new Date(b.created_at || b.updated_at || 0).getTime();
      return timeB - timeA;
    });
    const newest = sorted[0];
    const createdDate = new Date(newest.created_at || newest.updated_at || Date.now() - 4 * 86400000);
    const diffMs = Date.now() - createdDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffDays >= 3) {
      return {
        label: `Last lead added: ${diffDays} days ago`,
        isBeyond3Days: true,
        days: diffDays,
      };
    } else if (diffDays === 1) {
      return {
        label: "Last lead added: 1 day ago",
        isBeyond3Days: false,
        days: 1,
      };
    } else if (diffDays === 2) {
      return {
        label: "Last lead added: 2 days ago",
        isBeyond3Days: false,
        days: 2,
      };
    } else if (diffHours > 0) {
      return {
        label: `Last lead added: ${diffHours}h ago`,
        isBeyond3Days: false,
        days: 0,
      };
    } else {
      return {
        label: "Last lead added: Today",
        isBeyond3Days: false,
        days: 0,
      };
    }
  }, [leads]);

  // Responding agent assignment map for realistic WhatsApp multi-agent inbox
  const respondingAgents: Record<string, { agent: string; activeNow: boolean }> = {
    "wa-c-1": { agent: "Praveen (You)", activeNow: true },
    "wa-c-2": { agent: "Neha Gupta", activeNow: true },
    "wa-c-3": { agent: "Rahul Verma", activeNow: false },
    "wa-c-4": { agent: "Praveen (You)", activeNow: true },
    "wa-c-5": { agent: "Aarav Patel", activeNow: false },
  };

  // Active region details and live time formatted for the selected timezone
  const currentRegion = useMemo(() => {
    return (
      WORKSPACE_REGIONS.find((r) => r.timezone === selectedTimezone) ||
      WORKSPACE_REGIONS[0]
    );
  }, [selectedTimezone]);

  const formattedTime = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: selectedTimezone,
      }).format(clockTime);
    } catch {
      return clockTime.toLocaleTimeString();
    }
  }, [clockTime, selectedTimezone]);

  const formattedDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: selectedTimezone,
      }).format(clockTime);
    } catch {
      return clockTime.toLocaleDateString();
    }
  }, [clockTime, selectedTimezone]);

  const timeGreeting = useMemo(() => {
    try {
      const hourStr = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        hour12: false,
        timeZone: selectedTimezone,
      }).format(clockTime);
      const hour = parseInt(hourStr, 10);
      if (hour >= 5 && hour < 12) return "Good morning";
      if (hour >= 12 && hour < 17) return "Good afternoon";
      return "Good evening";
    } catch {
      return "Good morning";
    }
  }, [clockTime, selectedTimezone]);

  // Formatted current time for region list in dropdown
  const getRegionLiveTime = (tz: string) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: tz,
      }).format(clockTime);
    } catch {
      return "--:--";
    }
  };

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* SECTION 1: HEADER & GREETING WITH WORKSPACE CLOCK & TIMEZONE TRACKER  */}
      {/* ===================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#0D0D0E]">
            {mounted ? timeGreeting : "Good morning"},{" "}
            <span className="text-[#FF7900]">Praveen</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8E8E93] font-normal mt-1 flex items-center gap-1.5 flex-wrap">
            <span>{mounted ? formattedDate : "Today"}</span>
            <span>•</span>
            <span>Workspace aligned with</span>
            <span className="inline-flex items-center gap-1 font-medium text-[#0D0D0E] bg-[#F7F7F8] px-1.5 py-0.5 rounded border border-[#E5E5E7]">
              <span>{currentRegion.flag}</span>
              <span>{currentRegion.city}</span>
              <span className="text-[#8E8E93] font-mono text-[11px]">({currentRegion.abbr})</span>
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Workspace Live Clock & Region / Timezone Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setTimezoneDropdownOpen(!timezoneDropdownOpen);
                setDateDropdownOpen(false);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white border border-[#E5E5E7] text-[#0D0D0E] shadow-2xs hover:bg-[#F7F7F8] hover:border-slate-300 transition-all cursor-pointer h-9.5"
              title="Click to select workspace region & timezone"
            >
              <div className="flex items-center gap-1.5 text-emerald-600">
                <Clock className="h-4 w-4 text-emerald-600" />
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <span className="font-mono font-semibold text-[#0D0D0E] text-xs sm:text-sm tracking-tight">
                {mounted ? formattedTime : "--:--:--"}
              </span>

              <span className="text-[11px] text-[#8E8E93] font-normal hidden sm:inline-flex items-center gap-1 border-l border-[#E5E5E7] pl-2">
                <span>{currentRegion.flag}</span>
                <span className="font-medium text-[#0D0D0E]">{currentRegion.abbr}</span>
              </span>

              <ChevronDown className="h-3 w-3 text-[#8E8E93]" />
            </button>

            {/* Region & Timezone Dropdown Modal */}
            {timezoneDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setTimezoneDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-80 rounded-2xl bg-white border border-[#E5E5E7] shadow-xl py-2 z-40 animate-in fade-in zoom-in-95">
                  <div className="px-3.5 py-2 border-b border-[#F0F0F2]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-[#FF7900]" />
                        <span className="text-[11px] font-semibold text-[#0D0D0E]">
                          Workspace Region &amp; Timezone
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Live Tracking
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8E8E93] font-normal mt-0.5">
                      Syncs team operating hours, SLAs &amp; customer replies
                    </p>
                  </div>

                  <div className="max-h-64 overflow-y-auto py-1 space-y-0.5 custom-light-scroll">
                    {WORKSPACE_REGIONS.map((reg) => {
                      const isSelected = reg.timezone === selectedTimezone;
                      const regTime = mounted ? getRegionLiveTime(reg.timezone) : "--:--";

                      return (
                        <button
                          key={reg.id}
                          type="button"
                          onClick={() => {
                            setSelectedTimezone(reg.timezone);
                            try {
                              localStorage.setItem("roos_workspace_tz", reg.timezone);
                            } catch {}
                            setTimezoneDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#FFF4EC] text-[#FF7900] font-semibold"
                              : "text-[#0D0D0E] hover:bg-[#F7F7F8]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-base shrink-0">{reg.flag}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-[#0D0D0E] truncate">
                                  {reg.city}
                                </span>
                                <span className="text-[10px] font-mono text-[#8E8E93] font-normal">
                                  ({reg.abbr})
                                </span>
                              </div>
                              <p className="text-[10px] text-[#8E8E93] font-normal truncate">
                                {reg.name} • {reg.utcOffset}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 pl-2">
                            <span className="text-[11px] font-mono font-medium text-[#667781]">
                              {regTime}
                            </span>
                            {isSelected && (
                              <Check className="h-3.5 w-3.5 text-[#FF7900] shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Last Lead Added Message - Starts showing in days when beyond 3 days */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border shadow-2xs transition-all h-9.5 ${
              lastLeadStatus.isBeyond3Days
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}
            title={
              lastLeadStatus.isBeyond3Days
                ? "Warning: No new leads added in over 3 days"
                : "Pipeline lead acquisition is active"
            }
          >
            <span
              className={`h-2 w-2 rounded-full ${
                lastLeadStatus.isBeyond3Days ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
              }`}
            />
            <span>{lastLeadStatus.label}</span>
            {lastLeadStatus.isBeyond3Days && (
              <span className="text-[10px] font-semibold bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded-md">
                Alert: &gt;3d
              </span>
            )}
          </div>

          {/* Date range dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setDateDropdownOpen(!dateDropdownOpen);
                setTimezoneDropdownOpen(false);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white border border-[#E5E5E7] text-[#0D0D0E] shadow-2xs hover:bg-[#F7F7F8] transition-colors cursor-pointer h-9.5"
            >
              <Calendar className="h-4 w-4 text-[#8E8E93]" />
              <span>{selectedDateRange}</span>
              <ChevronDown className="h-3.5 w-3.5 text-[#8E8E93]" />
            </button>
            {dateDropdownOpen && (
              <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white border border-[#E5E5E7] shadow-lg py-1 z-20">
                {["Today", "Last 7 days", "Last 30 days", "This Quarter", "Year to Date"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setSelectedDateRange(r);
                      setDateDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-1.5 text-xs font-medium ${
                      selectedDateRange === r ? "bg-[#FFF4EC] text-[#FF7900]" : "text-[#0D0D0E] hover:bg-[#F7F7F8]"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            size="sm"
            onClick={() => setNewLeadModalOpen(true)}
            className="rounded-xl bg-[#FF7900] hover:bg-[#E66D00] text-white font-medium shadow-xs text-xs sm:text-sm h-9.5 px-4 cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>New Lead</span>
          </Button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 2: EXECUTIVE COMMAND BRIEFING CONSOLE                         */}
      {/* Replaces the fragmented KPI wall with a unified, calm 4-pillar bar    */}
      {/* ===================================================================== */}
      <div className="rounded-2xl bg-[#121214] border border-[#1F1F23] shadow-xs text-white overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#1F1F23]">
          {/* Pillar 1: Pipeline Value */}
          <div className="p-4.5 sm:p-5 flex flex-col justify-between hover:bg-[#161619] transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-[#FF7900]/15 flex items-center justify-center text-[#FF7900]">
                  <TrendingUp className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wider">
                  Pipeline Value
                </span>
              </div>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="h-3 w-3 stroke-[2]" />
                <span>+18.4%</span>
              </span>
            </div>

            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-white leading-tight">
                {formatCurrency(metrics.pipelineValue || 2450000)}
              </div>
              <p className="text-xs text-[#8E8E93] font-normal mt-1 flex items-center gap-1.5">
                <span className="text-emerald-400 font-medium">vs last 30d</span>
                <span>•</span>
                <span>{leads.length || 14} active deals</span>
              </p>
            </div>
          </div>

          {/* Pillar 2: New Leads */}
          <div className="p-4.5 sm:p-5 flex flex-col justify-between hover:bg-[#161619] transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-[#FF7900]/15 flex items-center justify-center text-[#FF7900]">
                  <Users className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wider">
                  New Leads
                </span>
              </div>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="h-3 w-3 stroke-[2]" />
                <span>+24%</span>
              </span>
            </div>

            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-white leading-tight">
                {metrics.leadsByStage.new?.count > 0 ? metrics.leadsByStage.new.count * 32 : 128}
              </div>
              <p className="text-xs text-[#8E8E93] font-normal mt-1 flex items-center gap-1.5">
                <span className="text-emerald-400 font-medium">+25 acquisition</span>
                <span>•</span>
                <span>from 103 last period</span>
              </p>
            </div>
          </div>

          {/* Pillar 3: WhatsApp Velocity */}
          <div className="p-4.5 sm:p-5 flex flex-col justify-between hover:bg-[#161619] transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-[#FF7900]/15 flex items-center justify-center text-[#FF7900]">
                  <MessageSquare className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wider">
                  WhatsApp Velocity
                </span>
              </div>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="h-3 w-3 stroke-[2]" />
                <span>+32%</span>
              </span>
            </div>

            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-white leading-tight">
                412
              </div>
              <p className="text-xs text-[#8E8E93] font-normal mt-1 flex items-center gap-1.5">
                <span className="text-emerald-400 font-medium">avg 4m response</span>
                <span>•</span>
                <span>{conversations.length || 12} customer threads</span>
              </p>
            </div>
          </div>

          {/* Pillar 4: Follow-ups Due */}
          <div className="p-4.5 sm:p-5 flex flex-col justify-between hover:bg-[#161619] transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-[#FF7900]/15 flex items-center justify-center text-[#FF7900]">
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wider">
                  Follow-ups Due
                </span>
              </div>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                <span>{metrics.overdueFollowUps || 4} Overdue</span>
              </span>
            </div>

            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-white leading-tight">
                {metrics.openFollowUps || 18}
              </div>
              <p className="text-xs text-[#8E8E93] font-normal mt-1 flex items-center gap-1.5">
                <span className="text-amber-400 font-medium">requires action today</span>
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse ml-0.5" />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 3: CORE OPERATIONAL WINGS                                     */}
      {/* LEFT WING (7 COLS): WHATSAPP OPERATIONS CENTER (FIRST-CLASS)          */}
      {/* RIGHT WING (5 COLS): SALES OPPORTUNITY ENGINE & PRIORITY ACTIONS      */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =================================================================== */}
        {/* LEFT WING (7 COLS): LIVE WHATSAPP TEAM OPERATIONS CENTER            */}
        {/* =================================================================== */}
        <div className="lg:col-span-7 flex flex-col gap-6">

          {/* REALISTIC WHATSAPP INBOX UI (NOT BLACK - AUTHENTIC WHATSAPP WEB LOOK) */}
          <div className="rounded-2xl bg-white border border-[#E5E5E7] shadow-xs overflow-hidden interactive-hover-card">
            {/* WhatsApp Green Top Header */}
            <div className="bg-[#008069] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center text-white shrink-0">
                  <MessageSquare className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold tracking-tight text-white">
                      WhatsApp Inbox
                    </h2>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-400/20 text-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#25D366] animate-pulse" />
                      Live Webhook
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100/80 font-normal">
                    Real-time conversations &amp; assigned respondents
                  </p>
                </div>
              </div>

              <Link
                href={`/app/${orgSlug}/inbox`}
                className="text-xs font-medium text-white hover:text-emerald-100 flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <span>Open Inbox</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* WhatsApp Filter Tabs in authentic light gray */}
            <div className="bg-[#F0F2F5] px-4 py-2.5 border-b border-[#E5E5E7] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setInboxFilter("all")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    inboxFilter === "all"
                      ? "bg-[#008069] text-white shadow-2xs font-semibold"
                      : "text-[#54656F] hover:bg-[#E9EDEF]"
                  }`}
                >
                  All ({conversations.length || 12})
                </button>
                <button
                  type="button"
                  onClick={() => setInboxFilter("unread")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    inboxFilter === "unread"
                      ? "bg-[#008069] text-white shadow-2xs font-semibold"
                      : "text-[#54656F] hover:bg-[#E9EDEF]"
                  }`}
                >
                  Unread ({unreadConversations.length || 6})
                </button>
                <button
                  type="button"
                  onClick={() => setInboxFilter("mentions")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    inboxFilter === "mentions"
                      ? "bg-[#008069] text-white shadow-2xs font-semibold"
                      : "text-[#54656F] hover:bg-[#E9EDEF]"
                  }`}
                >
                  Active ({conversations.length ? Math.min(conversations.length, 4) : 4})
                </button>
              </div>

              <span className="text-[11px] font-mono text-[#667781] hidden sm:inline-block">
                E2E Encrypted
              </span>
            </div>

            {/* Conversation rows in authentic WhatsApp Web style */}
            <div className="divide-y divide-[#F0F2F5]">
              {filteredConversations.slice(0, 5).map((chat, idx) => {
                const assigned = respondingAgents[chat.id] || {
                  agent: idx % 2 === 0 ? "Praveen (You)" : "Neha Gupta",
                  activeNow: idx < 3,
                };

                return (
                  <Link
                    key={chat.id}
                    href={`/app/${orgSlug}/inbox?conversationId=${chat.id}`}
                    className="group flex items-center justify-between p-3.5 hover:bg-[#F5F6F6] transition-colors cursor-pointer bg-white"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* WhatsApp Contact Avatar with Online Dot */}
                      <div className="relative shrink-0">
                        <div className="h-10 w-10 rounded-full bg-[#DFE5E7] text-[#54656F] flex items-center justify-center font-semibold text-sm">
                          {chat.contact_name?.charAt(0) || "W"}
                        </div>
                        {assigned.activeNow && (
                          <span
                            className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#25D366] border-2 border-white shadow-xs"
                            title="Contact active now"
                          />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs sm:text-sm font-semibold text-[#111B21] truncate">
                            {chat.contact_name || chat.contact_phone}
                          </p>

                          {/* Responding Person Badge */}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#E7FCE3] text-[#008069] border border-[#008069]/20 shrink-0">
                            <User className="h-2.5 w-2.5" />
                            <span>Responding: {assigned.agent}</span>
                          </span>

                          {/* Active conversation indicator */}
                          {assigned.activeNow && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 shrink-0">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#25D366] animate-ping" />
                              Active conversation
                            </span>
                          )}
                        </div>

                        {/* Last message with double blue ticks */}
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-[#667781] truncate">
                          <CheckCheck className="h-3.5 w-3.5 text-[#53BDEB] shrink-0" />
                          <span className="truncate max-w-[210px] sm:max-w-[280px]">
                            {chat.last_message_text || "Thank you for the update! Looking forward to the proposal."}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                      <span className="text-[11px] font-mono text-[#667781]">
                        {chat.updated_at ? "2m ago" : "15m ago"}
                      </span>
                      {chat.unread_count > 0 ? (
                        <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-[#25D366] text-white text-[11px] font-mono font-semibold flex items-center justify-center shadow-2xs">
                          {chat.unread_count}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#8E8E93] font-medium">Read</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* WhatsApp Bottom Bar with Fast Quick Reply hint */}
            <div className="bg-[#FAFBFB] px-4 py-2.5 border-t border-[#E5E5E7] flex items-center justify-between text-xs text-[#667781]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#25D366]" />
                All 5 assigned agents active on WhatsApp Web
              </span>
              <Link
                href={`/app/${orgSlug}/inbox`}
                className="text-[#008069] hover:text-[#006A57] font-medium hover:underline flex items-center gap-1"
              >
                <span>View all conversations</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* RIGHT WING (5 COLS): SALES OPPORTUNITY ENGINE & PRIORITY ACTIONS      */}
        {/* =================================================================== */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Sales Pipeline Card with BIG NUMBERS & 30-DAY PERFORMANCE COMPARISON */}
          <div className="rounded-2xl bg-white border border-[#E5E5E7] p-5 sm:p-6 shadow-xs interactive-hover-card">
            <div className="flex items-start justify-between pb-4 border-b border-[#F0F0F2]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-semibold text-[#0D0D0E] tracking-tight">
                    Sales Progression
                  </h2>
                  <Badge variant="orangeSubtle" className="text-[10px] uppercase font-semibold">
                    Live CRM
                  </Badge>
                </div>
                <p className="text-xs text-[#8E8E93] font-normal mt-0.5">
                  Commercial deals across stages vs 30d performance
                </p>
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    onClick={() => setNewLeadModalOpen(true)}
                    className="rounded-xl bg-[#FF7900] hover:bg-[#E66D00] text-white font-medium text-xs h-8 px-3 cursor-pointer shadow-xs transition-all active:scale-95"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Add Lead</span>
                  </Button>
                  <Link
                    href={`/app/${orgSlug}/leads`}
                    className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#0D0D0E] hover:bg-[#F7F7F8] transition-colors"
                    title="View full pipeline"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                {/* When our last lead was added, if beyond 3 days display in days */}
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md ${
                    lastLeadStatus.isBeyond3Days
                      ? "text-amber-800 bg-amber-50 border border-amber-200/80"
                      : "text-[#8E8E93] bg-[#F7F7F8] border border-[#E5E5E7]"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      lastLeadStatus.isBeyond3Days ? "bg-amber-500 animate-pulse" : "bg-[#8E8E93]"
                    }`}
                  />
                  {lastLeadStatus.label}
                </span>
              </div>
            </div>

            {/* BIG IMPORTANT NUMBERS & 30-DAY PERFORMANCE HERO SECTION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-4 p-4 rounded-xl bg-[#F7F7F8] border border-[#E5E5E7]">
              {/* Metric 1: Active Pipeline Value */}
              <div>
                <span className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wider block">
                  Active Pipeline Value
                </span>
                <div className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-[#0D0D0E] mt-1">
                  {formatCurrency(metrics.pipelineValue || 2450000)}
                </div>
                <div className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mt-2">
                  <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>+18.4% vs last 30 days</span>
                </div>
              </div>

              {/* Metric 2: Deals Won (30 Days) */}
              <div>
                <span className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wider block">
                  Deals Won (This Month)
                </span>
                <div className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-[#0D0D0E] mt-1">
                  {formatCurrency(metrics.leadsByStage.won?.value || 520000)}
                </div>
                <div className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mt-2">
                  <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>+26.2% vs last 30 days</span>
                </div>
              </div>
            </div>

            {/* Pipeline Stage Columns with BIG NUMBERS & GREEN/RED 30-DAY COMPARISON */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
              {pipelineStages.map((ps) => {
                // Determine 30-day performance trend: Proposal Sent is red (sales is less), others green
                const isProposal = ps.stage === "proposal";
                const isPositive = !isProposal;
                const changeText =
                  ps.stage === "new"
                    ? "+14.2%"
                    : ps.stage === "qualified"
                    ? "+9.8%"
                    : ps.stage === "proposal"
                    ? "-8.5%"
                    : "+31.5%";

                return (
                  <div
                    key={ps.stage}
                    className="rounded-xl bg-white border border-[#E5E5E7] p-3 flex flex-col justify-between hover:border-[#FF7900]/40 transition-colors shadow-2xs"
                  >
                    <div>
                      <span className="text-[10px] font-medium text-[#8E8E93] uppercase tracking-wider block truncate">
                        {ps.title}
                      </span>
                      <span className="text-sm sm:text-base font-mono font-semibold text-[#0D0D0E] mt-1 block">
                        {ps.count} deals
                      </span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#E5E5E7]">
                      <span className="text-xs sm:text-sm font-mono font-semibold text-[#0D0D0E] block">
                        {formatCurrency(ps.value)}
                      </span>

                      {/* 30-Day Comparison Pill: Green if positive, RED if sales is less */}
                      <div className="mt-1.5">
                        {isPositive ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <ArrowUpRight className="h-2.5 w-2.5 stroke-[2.5]" />
                            <span>{changeText} vs 30d</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            <ArrowDownRight className="h-2.5 w-2.5 stroke-[2.5]" />
                            <span>{changeText} vs 30d</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Priority Opportunities List */}
            <div className="mt-4 pt-3.5 border-t border-[#F0F0F2]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-[#0D0D0E]">
                  Priority Opportunities
                </span>
                <Link
                  href={`/app/${orgSlug}/leads`}
                  className="text-[11px] text-[#FF7900] hover:text-[#E66D00] font-medium"
                >
                  View all ({leads.length})
                </Link>
              </div>
              <div className="space-y-2">
                {leads.slice(0, 3).map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/app/${orgSlug}/leads`}
                    className="group flex items-center justify-between p-2.5 rounded-xl border border-[#E5E5E7] bg-white hover:border-[#FF7900] hover:bg-[#FFF4EC]/20 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-lg bg-[#F7F7F8] group-hover:bg-[#FF7900]/10 flex items-center justify-center text-[#0D0D0E] group-hover:text-[#FF7900] font-semibold text-xs shrink-0 transition-colors">
                        {lead.contact_name?.charAt(0) || "L"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#0D0D0E] truncate">
                          {lead.title}
                        </p>
                        <p className="text-[10px] text-[#8E8E93] font-normal truncate">
                          {lead.contact_name} • {lead.source || "Direct"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono font-semibold text-[#0D0D0E]">
                        {formatCurrency(lead.estimated_value)}
                      </span>
                      <Badge
                        variant={
                          lead.stage === "won"
                            ? "success"
                            : lead.stage === "proposal"
                            ? "orangeSubtle"
                            : "secondary"
                        }
                        className="text-[9px] font-medium uppercase px-1.5 py-0.5"
                      >
                        {lead.stage}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Urgent Actions & Follow-ups White Card */}
          <div className="rounded-2xl bg-white border border-[#E5E5E7] p-5 sm:p-6 shadow-xs interactive-hover-card">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F2]">
              <div>
                <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#0D0D0E]">
                  Urgent Actions &amp; Follow-ups
                </h2>
                <p className="text-xs text-[#8E8E93] font-normal">
                  Prioritised follow-ups and client actions
                </p>
              </div>

              <Link
                href={`/app/${orgSlug}/tasks`}
                className="text-xs font-medium text-[#FF7900] hover:text-[#E66D00] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 pt-3 pb-2">
              <button
                type="button"
                onClick={() => setTaskFilter("today")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  taskFilter === "today"
                    ? "bg-[#0D0D0E] text-white"
                    : "text-[#8E8E93] hover:text-[#0D0D0E]"
                }`}
              >
                Today ({taskCounts.today})
              </button>
              <button
                type="button"
                onClick={() => setTaskFilter("overdue")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  taskFilter === "overdue"
                    ? "bg-[#0D0D0E] text-white"
                    : "text-[#8E8E93] hover:text-[#0D0D0E]"
                }`}
              >
                Overdue ({taskCounts.overdue})
              </button>
              <button
                type="button"
                onClick={() => setTaskFilter("upcoming")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  taskFilter === "upcoming"
                    ? "bg-[#0D0D0E] text-white"
                    : "text-[#8E8E93] hover:text-[#0D0D0E]"
                }`}
              >
                Upcoming ({taskCounts.upcoming})
              </button>
            </div>

            {/* Task list items */}
            <div className="space-y-2 mt-2">
              {filteredTasks.slice(0, 4).map((task) => {
                const isDone = completedTaskIds.has(task.id);
                return (
                  <div
                    key={task.id}
                    className={`flex items-start justify-between gap-3 p-3 rounded-xl border border-[#E5E5E7] bg-white transition-all ${
                      isDone ? "opacity-50 line-through" : "hover:border-[#FF7900]"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleMarkTaskCompleted(task.id)}
                        className={`h-4.5 w-4.5 mt-0.5 rounded-md border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                          isDone
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-[#8E8E93] hover:border-[#FF7900]"
                        }`}
                        title="Mark completed"
                      >
                        {isDone && <Check className="h-3 w-3 stroke-[2.5]" />}
                      </button>

                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-[#0D0D0E] truncate">
                          {task.title}
                        </p>
                        <p className="text-[11px] text-[#8E8E93] font-normal truncate mt-0.5">
                          {task.contact_name || "Lead inquiry"} • Due {formatDate(task.due_date)}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={
                        task.priority === "high"
                          ? "danger"
                          : task.priority === "medium"
                          ? "warning"
                          : "secondary"
                      }
                      className="text-[10px] font-medium uppercase shrink-0"
                    >
                      {task.priority}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 3: FULL-WIDTH LEAD & REVENUE OVERVIEW CHART CARD              */}
      {/* ===================================================================== */}
      <div className="rounded-2xl bg-[#121214] border border-[#1F1F23] p-5 sm:p-6 text-white shadow-xs interactive-hover-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1F1F23]">
          <div>
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-white">
              Lead &amp; Revenue Overview
            </h2>
            <p className="text-xs text-[#8E8E93] font-normal">
              Monthly performance trends &amp; conversion dynamics
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#FF7900]" />
                <span className="text-[#8E8E93]">Leads</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-white" />
                <span className="text-[#8E8E93]">Revenue</span>
              </div>
            </div>

            <div className="text-xs font-medium bg-[#1C1C1F] border border-[#2A2A30] text-white px-2.5 py-1 rounded-lg">
              Monthly ▼
            </div>
          </div>
        </div>

        {/* Glowing SVG Area & Line Chart */}
        <div className="mt-5 relative">
          <svg className="w-full h-48 sm:h-56" viewBox="0 0 600 200" fill="none">
            <defs>
              <linearGradient id="leadAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF7900" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#FF7900" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="revAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid horizontal lines */}
            <line x1="40" y1="30" x2="580" y2="30" stroke="#1F1F23" strokeDasharray="3 3" />
            <line x1="40" y1="80" x2="580" y2="80" stroke="#1F1F23" strokeDasharray="3 3" />
            <line x1="40" y1="130" x2="580" y2="130" stroke="#1F1F23" strokeDasharray="3 3" />
            <line x1="40" y1="180" x2="580" y2="180" stroke="#1F1F23" />

            {/* Revenue Line (White, smooth) */}
            <path
              d="M 50 150 C 130 140, 180 120, 250 110 C 320 100, 380 75, 450 60 C 510 48, 550 45, 575 40"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeOpacity="0.8"
            />

            {/* Leads Area Fill (ROOS Orange Gradient) */}
            <path
              d="M 50 140 C 130 120, 180 135, 250 95 C 320 60, 380 85, 450 45 C 510 35, 550 40, 575 25 L 575 180 L 50 180 Z"
              fill="url(#leadAreaGradient)"
            />

            {/* Leads Line (ROOS Orange) */}
            <path
              d="M 50 140 C 130 120, 180 135, 250 95 C 320 60, 380 85, 450 45 C 510 35, 550 40, 575 25"
              fill="none"
              stroke="#FF7900"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Selected Point Marker at May (x=450, y=45) */}
            <line x1="450" y1="20" x2="450" y2="180" stroke="#FF7900" strokeDasharray="2 2" strokeOpacity="0.6" />
            <circle cx="450" cy="45" r="5" fill="#FF7900" />
            <circle cx="450" cy="45" r="2.5" fill="#FFFFFF" />

            {/* X Axis Labels */}
            <text x="50" y="196" fill="#8E8E93" fontSize="11" textAnchor="middle" fontWeight="500">Jan</text>
            <text x="150" y="196" fill="#8E8E93" fontSize="11" textAnchor="middle" fontWeight="500">Feb</text>
            <text x="250" y="196" fill="#8E8E93" fontSize="11" textAnchor="middle" fontWeight="500">Mar</text>
            <text x="350" y="196" fill="#8E8E93" fontSize="11" textAnchor="middle" fontWeight="500">Apr</text>
            <text x="450" y="196" fill="#FF7900" fontSize="11" textAnchor="middle" fontWeight="600">May</text>
            <text x="550" y="196" fill="#8E8E93" fontSize="11" textAnchor="middle" fontWeight="500">Jun</text>
          </svg>

          {/* Tooltip Overlay */}
          <div className="absolute top-2 left-[62%] sm:left-[68%] -translate-x-1/2 bg-[#1C1C1F] border border-[#2A2A30] rounded-xl px-3 py-1.5 shadow-xl text-center pointer-events-none">
            <span className="text-[10px] font-medium text-[#8E8E93] uppercase block">May Peak</span>
            <span className="text-xs font-mono font-medium text-white">
              <span className="text-[#FF7900]">124 Leads</span> • ₹4,80,000
            </span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* QUICK "NEW LEAD" MODAL                                                */}
      {/* ===================================================================== */}
      <Dialog open={newLeadModalOpen} onOpenChange={setNewLeadModalOpen}>
        <form onSubmit={handleCreateNewLead}>
          <DialogHeader>
            <DialogTitle>Add New Sales Opportunity</DialogTitle>
            <DialogDescription>
              Create a pipeline lead with estimated deal value and contact association.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <Input
              label="Lead / Deal Title *"
              placeholder="e.g. Annual Retainer or Automation Suite"
              value={leadTitle}
              onChange={(e) => setLeadTitle(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#0D0D0E]">
                Associated Contact
              </label>
              <select
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="w-full rounded-xl border border-[#E5E5E7] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-normal text-[#0D0D0E] focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] focus:outline-none h-11"
              >
                <option value="">-- Create or enter new contact --</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name || ""} ({c.phone}) - {c.company || "Direct"}
                  </option>
                ))}
              </select>
            </div>

            {!selectedContactId && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Contact Name"
                  placeholder="e.g. Rohan Sharma"
                  value={customContactName}
                  onChange={(e) => setCustomContactName(e.target.value)}
                />
                <Input
                  label="Contact Phone"
                  placeholder="+919876543210"
                  value={customContactPhone}
                  onChange={(e) => setCustomContactPhone(e.target.value)}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Estimated Value (₹) *"
                type="number"
                placeholder="50000"
                value={leadEstimatedValue}
                onChange={(e) => setLeadEstimatedValue(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#0D0D0E]">
                  Initial Stage
                </label>
                <select
                  value={leadStage}
                  onChange={(e) => setLeadStage(e.target.value as LeadStage)}
                  className="w-full rounded-xl border border-[#E5E5E7] bg-white px-3 py-2 text-xs sm:text-sm font-medium text-[#0D0D0E] focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] focus:outline-none h-11"
                >
                  <option value="new">New Inquiry</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal Sent</option>
                  <option value="won">Closed Won</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#0D0D0E]">
                Lead Source
              </label>
              <select
                value={leadSource}
                onChange={(e) => setLeadSource(e.target.value)}
                className="w-full rounded-xl border border-[#E5E5E7] bg-white px-3 py-2 text-xs sm:text-sm font-normal text-[#0D0D0E] focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] focus:outline-none h-11"
              >
                <option value="WhatsApp Inbound">WhatsApp Inbound</option>
                <option value="Website Form">Website Form</option>
                <option value="Referral">Client Referral</option>
                <option value="Direct Outreach">Direct Outreach</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setNewLeadModalOpen(false)}
              className="rounded-xl font-medium text-[#8E8E93]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-[#FF7900] hover:bg-[#E66D00] text-white font-medium px-5"
            >
              Create Opportunity
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
