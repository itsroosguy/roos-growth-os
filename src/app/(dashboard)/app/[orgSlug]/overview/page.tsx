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
  Send,
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

  // Mini interactive WhatsApp conversation state matching Reference Image
  const [previewChatIndex, setPreviewChatIndex] = useState(0);
  const [previewInputText, setPreviewInputText] = useState("");
  const [previewMessages, setPreviewMessages] = useState([
    { id: "m1", sender: "client", text: "Hi, we're interested in your fleet management solution.", time: "10:23 AM" },
    { id: "m2", sender: "agent", text: "Great! I can share the detailed proposal with you.", time: "10:24 AM" },
    { id: "m3", sender: "client", text: "Thanks, we will review the final proposal with our finance team and get back to you soon.", time: "10:26 AM" },
  ]);

  const handleSendPreviewMessage = (textToSend?: string) => {
    const text = (textToSend || previewInputText).trim();
    if (!text) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setPreviewMessages((prev) => [
      ...prev,
      { id: `m-${Date.now()}`, sender: "agent", text, time: timeStr },
    ]);
    setPreviewInputText("");
  };

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
      {/* SECTION 2: 4 LIGHT METRIC CARDS (EXACT REFERENCE DESIGN)              */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: New Leads */}
        <div className="bg-white rounded-2xl border border-[#EAECEF] p-5 shadow-xs hover:border-[#FF7900]/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-[#FFF4EC] flex items-center justify-center text-[#FF7900]">
                <Users className="h-4.5 w-4.5" />
              </div>
              <span className="text-xs font-medium text-[#717680]">New Leads</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ArrowUpRight className="h-3 w-3 stroke-[2]" />
              <span>+20% acquisition</span>
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="text-3xl font-semibold font-mono tracking-tight text-[#0D0D0E]">
                32
              </div>
              <p className="text-[11px] text-[#8E8E93] mt-1">+20% acquisition</p>
            </div>
            <svg className="w-20 h-9 text-[#FF7900]" viewBox="0 0 80 36" fill="none">
              <path d="M 0 30 Q 20 28, 40 18 T 80 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 2: Pipeline Value */}
        <div className="bg-white rounded-2xl border border-[#EAECEF] p-5 shadow-xs hover:border-[#FF7900]/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
              <span className="text-xs font-medium text-[#717680]">Pipeline Value</span>
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="text-3xl font-semibold font-mono tracking-tight text-[#0D0D0E]">
                ₹6,60,000
              </div>
              <p className="text-[11px] text-[#8E8E93] mt-1">from ₹5.5 lakh last period</p>
            </div>
            <svg className="w-20 h-9 text-emerald-500" viewBox="0 0 80 36" fill="none">
              <path d="M 0 32 Q 25 30, 45 15 T 80 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 3: WhatsApp Velocity */}
        <div className="bg-white rounded-2xl border border-[#EAECEF] p-5 shadow-xs hover:border-[#FF7900]/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <MessageSquare className="h-4.5 w-4.5" />
              </div>
              <span className="text-xs font-medium text-[#717680]">WhatsApp Velocity</span>
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="text-3xl font-semibold font-mono tracking-tight text-[#0D0D0E]">
                412
              </div>
              <p className="text-[11px] text-[#8E8E93] mt-1">avg 4m response</p>
            </div>
            <svg className="w-20 h-9 text-emerald-500" viewBox="0 0 80 36" fill="none">
              <path d="M 0 25 Q 30 10, 50 20 T 80 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 4: Follow-ups Due */}
        <div className="bg-white rounded-2xl border border-[#EAECEF] p-5 shadow-xs hover:border-[#FF7900]/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Clock className="h-4.5 w-4.5" />
              </div>
              <span className="text-xs font-medium text-[#717680]">Follow-ups Due</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              1 Overdue
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="text-3xl font-semibold font-mono tracking-tight text-[#0D0D0E]">
                3
              </div>
              <p className="text-[11px] text-amber-700 mt-1 font-medium flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                requires action today
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
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#EAECEF] shadow-xs overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-[#F0F1F3] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageSquare className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-[#0D0D0E] tracking-tight">
                    WhatsApp Conversations
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#25D366] animate-pulse" />
                    Live
                  </span>
                </div>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                  Real-time conversations &amp; assigned respondents
                </p>
              </div>
            </div>

            <Link
              href={`/app/${orgSlug}/inbox`}
              className="text-xs font-medium text-[#FF7900] hover:text-[#E66D00] flex items-center gap-1"
            >
              <span>Open Inbox</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* 2-Column Split: Conversation list + Live Message Preview */}
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px]">
            {/* Sub-col 1 (5 cols): Filter Tabs & Conversation List */}
            <div className="md:col-span-5 border-r border-[#F0F1F3] flex flex-col">
              {/* Filter Tabs */}
              <div className="px-3 py-2.5 border-b border-[#F0F1F3] flex items-center gap-1 bg-[#FAFAFA]">
                <button
                  type="button"
                  onClick={() => setInboxFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    inboxFilter === "all"
                      ? "bg-white text-[#0D0D0E] shadow-2xs font-semibold"
                      : "text-[#717680] hover:text-[#0D0D0E]"
                  }`}
                >
                  All (7)
                </button>
                <button
                  type="button"
                  onClick={() => setInboxFilter("unread")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    inboxFilter === "unread"
                      ? "bg-white text-[#0D0D0E] shadow-2xs font-semibold"
                      : "text-[#717680] hover:text-[#0D0D0E]"
                  }`}
                >
                  Unread (3)
                </button>
                <button
                  type="button"
                  onClick={() => setInboxFilter("mentions")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    inboxFilter === "mentions"
                      ? "bg-white text-[#0D0D0E] shadow-2xs font-semibold"
                      : "text-[#717680] hover:text-[#0D0D0E]"
                  }`}
                >
                  Assigned (4)
                </button>
              </div>

              {/* Chat rows */}
              <div className="divide-y divide-[#F0F1F3] overflow-y-auto max-h-[340px]">
                {[
                  { name: "Sneha Reddy", snippet: "Thanks, we will review the final proposal...", time: "2m", unread: true },
                  { name: "Aarav Patel", snippet: "Can you provide the quotation for the...", time: "12m", unread: false },
                  { name: "Rahul Mehta", snippet: "Do you have a time available this week?", time: "1h", unread: false },
                  { name: "Priya Sharma", snippet: "Confirmed our team demo session for...", time: "3h", unread: false },
                  { name: "Vikram Deshmukh", snippet: "Can we schedule a call this week?...", time: "1d", unread: false },
                ].map((chat, idx) => (
                  <button
                    key={chat.name}
                    type="button"
                    onClick={() => setPreviewChatIndex(idx)}
                    className={`w-full text-left p-3 flex items-start gap-2.5 transition-colors cursor-pointer ${
                      previewChatIndex === idx ? "bg-[#FFF4EC]/30" : "hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <div className="h-8 w-8 rounded-full bg-[#E5E7EB] text-[#4B5563] font-medium text-xs flex items-center justify-center shrink-0">
                      {chat.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#0D0D0E] truncate">
                          {chat.name}
                        </span>
                        <span className="text-[10px] text-[#8E8E93]">{chat.time}</span>
                      </div>
                      <p className="text-[11px] text-[#717680] truncate mt-0.5">
                        {chat.snippet}
                      </p>
                    </div>
                    {chat.unread && (
                      <span className="h-2 w-2 rounded-full bg-[#FF7900] mt-1 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-col 2 (7 cols): Mini Live Chat Thread */}
            <div className="md:col-span-7 flex flex-col justify-between bg-[#F7F8FA]">
              {/* Contact Header */}
              <div className="p-3 bg-white border-b border-[#F0F1F3] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-[#DFE5E7] text-[#54656F] flex items-center justify-center font-semibold text-xs">
                    S
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#0D0D0E] leading-tight">Sneha Reddy</p>
                    <p className="text-[10px] text-[#8E8E93]">+91 98765 43210</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#25D366]" />
                  Active now
                </span>
              </div>

              {/* Chat Messages */}
              <div className="p-3 space-y-2.5 overflow-y-auto max-h-[220px]">
                {previewMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === "agent" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-xs shadow-2xs ${
                        msg.sender === "agent"
                          ? "bg-[#DCF8C6] text-[#111B21] rounded-br-none"
                          : "bg-white text-[#111B21] border border-[#E5E5E7] rounded-bl-none"
                      }`}
                    >
                      {msg.text}
                      <span className="block text-[9px] text-[#8E8E93] text-right mt-1 font-mono">
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Reply Chips & Message Composer */}
              <div className="p-3 bg-white border-t border-[#F0F1F3] space-y-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {["Pricing", "Proposal", "Follow-up"].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleSendPreviewMessage(`I'm sharing our ${chip} details right now.`)}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F4F4F6] text-[#717680] hover:bg-[#FFF4EC] hover:text-[#FF7900] transition-colors shrink-0 cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={previewInputText}
                    onChange={(e) => setPreviewInputText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendPreviewMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-[#F4F4F6] border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-xs text-[#0D0D0E] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#FF7900]"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSendPreviewMessage()}
                    className="h-8 w-8 p-0 rounded-xl bg-[#FF7900] hover:bg-[#E66D00] text-white flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CARD (5 COLS): SALES PROGRESSION */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#EAECEF] p-5 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#F0F1F3]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-[#0D0D0E] tracking-tight">
                    Sales Progression
                  </h2>
                  <Badge variant="orangeSubtle" className="text-[10px] uppercase font-semibold">
                    Live CRM
                  </Badge>
                </div>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                  Commercial deals across stages vs 30 days performance
                </p>
              </div>

              <Link
                href={`/app/${orgSlug}/leads`}
                className="text-xs font-medium text-[#FF7900] hover:text-[#E66D00] flex items-center gap-1 shrink-0"
              >
                <span>View Pipeline</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Top Summary Figures */}
            <div className="grid grid-cols-3 gap-2 py-4 border-b border-[#F0F1F3]">
              <div>
                <span className="text-[10px] font-medium text-[#8E8E93] uppercase block truncate">
                  Commercial Pipeline
                </span>
                <div className="text-lg font-semibold font-mono text-[#0D0D0E] mt-0.5">
                  ₹8.30 <span className="text-xs text-[#8E8E93] font-normal">Lakh</span>
                </div>
                <span className="text-[10px] font-medium text-emerald-600 block mt-0.5">+3.9%</span>
              </div>

              <div>
                <span className="text-[10px] font-medium text-[#8E8E93] uppercase block truncate">
                  Proposal Sent
                </span>
                <div className="text-lg font-semibold font-mono text-[#0D0D0E] mt-0.5">
                  ₹2.30 <span className="text-xs text-[#8E8E93] font-normal">Lakh</span>
                </div>
                <span className="text-[10px] font-medium text-[#717680] block mt-0.5">1 deal</span>
              </div>

              <div>
                <span className="text-[10px] font-medium text-[#8E8E93] uppercase block truncate">
                  Deals Won
                </span>
                <div className="text-lg font-semibold font-mono text-[#0D0D0E] mt-0.5">
                  1 deal
                </div>
                <span className="text-[10px] font-medium text-emerald-600 block mt-0.5">100% close</span>
              </div>
            </div>

            {/* Curated Priority Deals matching Reference Image */}
            <div className="mt-4 space-y-2.5">
              {[
                { title: "Retail Automation Contract", contact: "Rohan Patel", value: "₹66,850", stage: "QUALIFIED", badgeVariant: "purple" },
                { title: "Multi-Store CRM Deployment", contact: "Priya Nair", value: "₹1,30,000", stage: "PROPOSAL", badgeVariant: "orangeSubtle" },
                { title: "WhatsApp API Gateway Setup", contact: "Vikram Malhotra", value: "₹95,000", stage: "ANALYSIS", badgeVariant: "default" },
              ].map((deal) => (
                <Link
                  key={deal.title}
                  href={`/app/${orgSlug}/leads`}
                  className="flex items-center justify-between p-3 rounded-xl border border-[#EAECEF] hover:border-[#FF7900] bg-white transition-all cursor-pointer hover:bg-[#FFF4EC]/20"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#0D0D0E] truncate">
                      {deal.title}
                    </p>
                    <p className="text-[10px] text-[#8E8E93] truncate mt-0.5">
                      {deal.contact}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-xs font-mono font-semibold text-[#0D0D0E]">
                      {deal.value}
                    </span>
                    <Badge variant={deal.badgeVariant as any} className="text-[9px] uppercase px-1.5 py-0.5">
                      {deal.stage}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#F0F1F3] mt-4 flex items-center justify-between text-xs text-[#8E8E93]">
            <span>{lastLeadStatus.label}</span>
            <Button
              size="sm"
              onClick={() => setNewLeadModalOpen(true)}
              className="rounded-xl bg-[#FF7900] hover:bg-[#E66D00] text-white font-medium text-xs h-7.5 px-3 cursor-pointer"
            >
              <Plus className="mr-1 h-3.5 w-3.5 stroke-[2.5]" />
              <span>Add Lead</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 4: 3-COLUMN BOTTOM ROW (EXACT REFERENCE DESIGN)               */}
      {/* 1. TODAY'S TASKS | 2. RECENT ACTIVITY | 3. CAMPAIGN PERFORMANCE       */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Today's Tasks */}
        <div className="bg-white rounded-2xl border border-[#EAECEF] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F1F3]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#0D0D0E]">Today&apos;s Tasks</h3>
                <span className="text-[10px] text-[#8E8E93] font-medium">({taskCounts.today})</span>
              </div>
              <Link
                href={`/app/${orgSlug}/tasks`}
                className="text-xs font-medium text-[#FF7900] hover:text-[#E66D00]"
              >
                View all →
              </Link>
            </div>

            <div className="mt-3 space-y-2">
              {[
                { id: "t1", title: "Follow-up with Aarav Patel", contact: "Aarav Patel", priority: "High" },
                { id: "t2", title: "Send proposal to Sneha Reddy", contact: "Sneha Reddy", priority: "Medium" },
                { id: "t3", title: "Call Vikram Deshmukh", contact: "Vikram Deshmukh", priority: "Medium" },
                { id: "t4", title: "Review automation workflow", contact: "Internal", priority: "Low" },
              ].map((task) => {
                const isDone = completedTaskIds.has(task.id);
                return (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border border-[#EAECEF] bg-[#FAFAFA] transition-all ${isDone ? "opacity-40 line-through" : ""}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleMarkTaskCompleted(task.id)}
                        className={`h-4 w-4 rounded-md border flex items-center justify-center shrink-0 cursor-pointer ${
                          isDone ? "bg-emerald-600 border-emerald-600 text-white" : "border-[#8E8E93]"
                        }`}
                      >
                        {isDone && <Check className="h-3 w-3 stroke-[2.5]" />}
                      </button>
                      <span className="text-xs font-medium text-[#0D0D0E] truncate">
                        {task.title}
                      </span>
                    </div>
                    <Badge
                      variant={
                        task.priority === "High"
                          ? "danger"
                          : task.priority === "Medium"
                          ? "warning"
                          : "secondary"
                      }
                      className="text-[9px] uppercase px-1.5 py-0.2 shrink-0"
                    >
                      {task.priority}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 2: Recent Activity */}
        <div className="bg-white rounded-2xl border border-[#EAECEF] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F1F3]">
              <h3 className="text-sm font-semibold text-[#0D0D0E]">Recent Activity</h3>
              <Link
                href={`/app/${orgSlug}/leads`}
                className="text-xs font-medium text-[#FF7900] hover:text-[#E66D00]"
              >
                View all →
              </Link>
            </div>

            <div className="mt-3 space-y-3">
              {[
                { title: "Rahul Mehta moved to Qualified", time: "2m ago", icon: Users, color: "text-purple-600 bg-purple-50" },
                { title: "New lead from Website Form", time: "15m ago", icon: Plus, color: "text-[#FF7900] bg-[#FFF4EC]" },
                { title: "Template 'Pricing 2026' sent to 120 contacts", time: "1h ago", icon: Send, color: "text-blue-600 bg-blue-50" },
                { title: "Follow-up marked as complete", time: "2h ago", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
                { title: "Rohan Mehta replied to your message", time: "3h ago", icon: MessageSquare, color: "text-emerald-600 bg-emerald-50" },
              ].map((act) => {
                const ActIcon = act.icon;
                return (
                  <div key={act.title} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`h-6 w-6 rounded-lg ${act.color} flex items-center justify-center shrink-0`}>
                        <ActIcon className="h-3 w-3" />
                      </div>
                      <span className="text-xs font-medium text-[#0D0D0E] truncate">
                        {act.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#8E8E93] shrink-0 font-mono">{act.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 3: Campaign Performance */}
        <div className="bg-white rounded-2xl border border-[#EAECEF] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F1F3]">
              <h3 className="text-sm font-semibold text-[#0D0D0E]">Campaign Performance</h3>
              <Link
                href={`/app/${orgSlug}/campaigns`}
                className="text-xs font-medium text-[#FF7900] hover:text-[#E66D00]"
              >
                View all →
              </Link>
            </div>

            <div className="mt-3">
              <div className="p-3 rounded-xl bg-[#FAFAFA] border border-[#EAECEF] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#0D0D0E] block">Product Launch Campaign</span>
                  <span className="text-[10px] text-[#8E8E93]">Audience: Customer Segment - A</span>
                </div>
                <Badge variant="success" className="text-[9px] uppercase px-1.5 py-0.2">
                  Active
                </Badge>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                <div className="p-2 rounded-xl bg-[#F7F8FA]">
                  <span className="text-base font-semibold font-mono text-[#0D0D0E] block">1,248</span>
                  <span className="text-[10px] text-[#8E8E93] uppercase">Sent</span>
                </div>
                <div className="p-2 rounded-xl bg-[#F7F8FA]">
                  <span className="text-base font-semibold font-mono text-[#0D0D0E] block">1,012</span>
                  <span className="text-[10px] text-[#8E8E93] uppercase">Delivered</span>
                </div>
                <div className="p-2 rounded-xl bg-[#F7F8FA]">
                  <span className="text-base font-semibold font-mono text-[#0D0D0E] block">312</span>
                  <span className="text-[10px] text-[#8E8E93] uppercase">Replied</span>
                </div>
                <div className="p-2 rounded-xl bg-[#F7F8FA]">
                  <span className="text-base font-semibold font-mono text-emerald-600 block">25.2%</span>
                  <span className="text-[10px] text-[#8E8E93] uppercase">Rate</span>
                </div>
              </div>
            </div>
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
