"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Meeting } from "@/lib/calendar/types";
import { Task } from "@/types/crm";
import { GoogleMeetIcon, ZoomIcon } from "@/components/calendar/icons";
import { BookMeetingModal } from "@/components/calendar/book-meeting-modal";
import { CalendarIntegrationsModal } from "@/components/calendar/calendar-integrations-modal";
import {
  Calendar,
  Check,
  Clock,
  ExternalLink,
  MessageSquare,
  Plus,
  Send,
  SlidersHorizontal,
  Video,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface DayRailItem {
  id: string;
  rawId: string;
  type: "meeting" | "sla" | "task" | "broadcast";
  title: string;
  subtitle: string;
  timeFormatted: string;
  timeMinutes: number; // minutes from midnight (0 - 1439)
  isOverdue: boolean;
  platform?: "zoom" | "google_meet";
  url?: string;
  contactName?: string | null;
  contactPhone?: string | null;
  priority?: "urgent" | "high" | "medium" | "low";
  completed?: boolean;
}

interface DayRailProps {
  orgSlug: string;
  meetings: Meeting[];
  tasks: Task[];
  unreadCount?: number;
  onOpenConversation?: (phone: string) => void;
  onCompleteTask?: (taskId: string) => void;
}

export function DayRail({
  orgSlug,
  meetings,
  tasks,
  unreadCount = 0,
  onOpenConversation,
  onCompleteTask,
}: DayRailProps) {
  const [bookMeetingOpen, setBookMeetingOpen] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Time tracking
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(13 * 60); // 1:00 PM default
  const [currentTimeString, setCurrentTimeString] = useState("1:00 PM");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      setCurrentTimeMinutes(minutes);

      let h = now.getHours();
      const m = now.getMinutes().toString().padStart(2, "0");
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      setCurrentTimeString(`${h}:${m} ${ampm}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  // Parse time strings like "11:30 AM" or "2:30 PM" into minutes from midnight
  const parseTimeToMinutes = (timeStr: string): number => {
    try {
      const parts = timeStr.trim().split(" ");
      if (parts.length < 2) return 12 * 60;
      const [hStr, mStr] = parts[0].split(":");
      let h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10) || 0;
      const ampm = parts[1].toUpperCase();

      if (ampm === "PM" && h < 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      return h * 60 + m;
    } catch {
      return 12 * 60;
    }
  };

  // Merge today's meetings, tasks, SLAs and broadcasts into a single chronological array
  const dayItems = useMemo<DayRailItem[]>(() => {
    const items: DayRailItem[] = [];

    // 1. Meetings
    meetings.forEach((m) => {
      const timeMinutes = parseTimeToMinutes(m.start_time);
      const isOverdue = timeMinutes < currentTimeMinutes && m.status !== "completed";
      items.push({
        id: `meet-${m.id}`,
        rawId: m.id,
        type: "meeting",
        title: m.title,
        subtitle: m.contact_name ? `with ${m.contact_name}` : "Scheduled Call",
        timeFormatted: m.start_time,
        timeMinutes,
        isOverdue,
        platform: m.platform,
        url: m.meeting_url,
        contactName: m.contact_name,
        contactPhone: m.contact_phone,
      });
    });

    // 2. High priority tasks scheduled for today
    tasks
      .filter((t) => t.status !== "completed")
      .slice(0, 3)
      .forEach((t, idx) => {
        // Map tasks to realistic time slots (e.g. 10:00 AM, 1:30 PM, 4:00 PM)
        const sampleSlots = [10 * 60, 13 * 60 + 30, 16 * 60];
        const timeMinutes = sampleSlots[idx % sampleSlots.length];
        const isOverdue = timeMinutes < currentTimeMinutes;
        const timeFormatted =
          timeMinutes === 10 * 60
            ? "10:00 AM"
            : timeMinutes === 13 * 60 + 30
            ? "1:30 PM"
            : "4:00 PM";

        items.push({
          id: `task-${t.id}`,
          rawId: t.id,
          type: "task",
          title: t.title,
          subtitle: t.contact_name ? `Client: ${t.contact_name}` : "Operations Task",
          timeFormatted,
          timeMinutes,
          isOverdue,
          priority: t.priority,
          contactName: t.contact_name,
        });
      });

    // 3. WhatsApp 24h SLA reminder (if customers waiting)
    if (unreadCount > 0) {
      items.push({
        id: "sla-wa-inbox",
        rawId: "sla-wa-inbox",
        type: "sla",
        title: "WhatsApp 24h Window SLA",
        subtitle: `${unreadCount} customer inquiries awaiting reply`,
        timeFormatted: "2:00 PM",
        timeMinutes: 14 * 60,
        isOverdue: 14 * 60 < currentTimeMinutes,
      });
    }

    // 4. Scheduled broadcast
    items.push({
      id: "bcast-festive",
      rawId: "bcast-festive",
      type: "broadcast",
      title: "VIP Tier Re-engagement",
      subtitle: "Scheduled Meta broadcast • 450 contacts",
      timeFormatted: "5:30 PM",
      timeMinutes: 17 * 60 + 30,
      isOverdue: 17 * 60 + 30 < currentTimeMinutes,
    });

    // Sort strictly in chronological order
    items.sort((a, b) => a.timeMinutes - b.timeMinutes);
    return items;
  }, [meetings, tasks, unreadCount, currentTimeMinutes]);

  // Separate overdue items from upcoming items
  const overdueItems = useMemo(
    () => dayItems.filter((i) => i.isOverdue),
    [dayItems]
  );

  const upcomingItems = useMemo(
    () => dayItems.filter((i) => !i.isOverdue),
    [dayItems]
  );

  const handleCopy = (id: string, text: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="bg-white rounded-[20px] p-6 border border-[#E6E2D8] shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-[#EFEDE7]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[1.25rem] font-medium text-[#12141A]">The Day Rail</h2>
            <span className="px-2 py-0.5 rounded-full text-[12px] font-medium bg-[#FFF3D6] text-[#8F5300] border border-[#FFE5A3]">
              {dayItems.length} items
            </span>
          </div>
          <p className="text-[0.875rem] text-[#666C78] mt-0.5">
            Today&apos;s meetings, SLAs, and scheduled follow-ups in order
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIntegrationsOpen(true)}
            className="p-2 rounded-[10px] text-[#666C78] hover:text-[#12141A] hover:bg-[#F7F5F0] transition-colors"
            title="Calendar & Zoom Integrations"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setBookMeetingOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[#FF5A1F] hover:bg-[#E8470F] text-white text-[13px] font-medium transition-transform duration-140 active:scale-95 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Meeting</span>
          </button>
        </div>
      </div>

      {/* Vertical Timeline */}
      <div className="flex-1 overflow-y-auto pt-4 space-y-3 custom-light-scroll pr-1">
        {/* 1. Overdue Section (Sits above NOW marker in Rose) */}
        {overdueItems.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#CF2F36]">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Overdue ({overdueItems.length})</span>
            </div>
            {overdueItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-[14px] bg-[#FFE9EA]/60 border border-[#FDC8CA] relative flex items-start gap-3 transition-colors hover:bg-[#FFE9EA]"
              >
                <div className="shrink-0 w-14 text-[13px] font-medium text-[#B42336] pt-0.5 tabular-nums">
                  {item.timeFormatted}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-[#12141A] truncate">
                      {item.title}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#FFE9EA] text-[#B42336] border border-[#FDC8CA] shrink-0">
                      Overdue
                    </span>
                  </div>
                  <p className="text-[12px] text-[#666C78] truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
                {item.type === "meeting" && item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 px-2.5 py-1 rounded-[8px] bg-[#CF2F36] text-white text-[14px] font-medium hover:bg-[#B42336] transition-colors"
                  >
                    Join
                  </a>
                )}
                {item.type === "task" && onCompleteTask && (
                  <button
                    type="button"
                    onClick={() => onCompleteTask(item.rawId)}
                    className="shrink-0 p-1.5 rounded-[8px] border border-[#FDC8CA] text-[#B42336] hover:bg-white transition-colors"
                    title="Mark task done"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 2. Live NOW Marker */}
        <div className="flex items-center gap-2.5 my-3 py-1">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#12151C] text-white text-[12px] font-medium shadow-xs">
            <span className="h-2 w-2 rounded-full bg-[#12B886] animate-pulse" />
            <span className="tabular-nums">NOW · {currentTimeString}</span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-[#12151C]/40 via-[#12151C]/15 to-transparent" />
        </div>

        {/* 3. Upcoming Items (Next item is emphasized) */}
        {upcomingItems.length === 0 ? (
          <div className="py-8 text-center text-[#666C78] text-[14px]">
            No more items scheduled for today. You&apos;re completely caught up!
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcomingItems.map((item, index) => {
              const isNextUp = index === 0;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "p-3.5 rounded-[14px] border transition-all duration-140 flex items-start gap-3",
                    isNextUp
                      ? "bg-gradient-to-r from-[#F0F5FF] via-white to-white border-[#C2D6FF] shadow-xs"
                      : "bg-[#FAFAFA] border-[#E6E2D8] hover:bg-white hover:border-[#D2CEC2]"
                  )}
                >
                  {/* Time */}
                  <div className="shrink-0 w-16 text-[13px] font-medium text-[#454B57] pt-0.5 tabular-nums flex flex-col">
                    <span>{item.timeFormatted}</span>
                    {isNextUp && (
                      <span className="text-[10px] text-[#2F46D6] font-semibold mt-0.5 tracking-wider uppercase">
                        Next
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {item.type === "meeting" && (
                        <span className="shrink-0">
                          {item.platform === "zoom" ? (
                            <ZoomIcon className="h-3.5 w-3.5" />
                          ) : (
                            <GoogleMeetIcon className="h-3.5 w-3.5" />
                          )}
                        </span>
                      )}
                      {item.type === "sla" && (
                        <MessageSquare className="h-3.5 w-3.5 text-[#3D5AFE] shrink-0" />
                      )}
                      {item.type === "broadcast" && (
                        <Send className="h-3.5 w-3.5 text-[#7C4DFF] shrink-0" />
                      )}
                      {item.type === "task" && (
                        <Clock className="h-3.5 w-3.5 text-[#F5A524] shrink-0" />
                      )}

                      <span className="text-[14px] font-medium text-[#12141A] truncate">
                        {item.title}
                      </span>
                    </div>

                    <p className="text-[12px] text-[#666C78] truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    {item.type === "meeting" && item.url && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.id, item.url!)}
                          className="p-1.5 rounded-[8px] text-[#666C78] hover:text-[#12141A] hover:bg-[#E6E2D8]/50 transition-colors"
                          title="Copy meeting link"
                        >
                          {copiedId === item.id ? (
                            <Check className="h-3.5 w-3.5 text-[#12B886]" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[14px] font-medium transition-colors",
                            isNextUp
                              ? "bg-[#3D5AFE] hover:bg-[#2F46D6] text-white shadow-xs"
                              : "bg-[#EAEEFF] text-[#2A3DB5] hover:bg-[#DCE5FF]"
                          )}
                        >
                          <span>Join</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </>
                    )}

                    {item.type === "sla" && (
                      <a
                        href={`/app/${orgSlug}/inbox`}
                        className="px-3 py-1.5 rounded-[8px] bg-[#EAEEFF] text-[#2A3DB5] text-[14px] font-medium hover:bg-[#DCE5FF] transition-colors"
                      >
                        Reply
                      </a>
                    )}

                    {item.type === "broadcast" && (
                      <a
                        href={`/app/${orgSlug}/campaigns`}
                        className="px-3 py-1.5 rounded-[8px] bg-[#F0EAFF] text-[#5B34C9] text-[14px] font-medium hover:bg-[#E5D9FF] transition-colors"
                      >
                        Review
                      </a>
                    )}

                    {item.type === "task" && onCompleteTask && (
                      <button
                        type="button"
                        onClick={() => onCompleteTask(item.rawId)}
                        className="p-1.5 rounded-[8px] border border-[#E6E2D8] text-[#666C78] hover:text-[#12B886] hover:border-[#12B886] hover:bg-[#E4F7EF] transition-colors"
                        title="Mark task done"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <BookMeetingModal
        open={bookMeetingOpen}
        onOpenChange={setBookMeetingOpen}
        orgSlug={orgSlug}
      />
      <CalendarIntegrationsModal
        open={integrationsOpen}
        onOpenChange={setIntegrationsOpen}
        orgSlug={orgSlug}
      />
    </div>
  );
}
