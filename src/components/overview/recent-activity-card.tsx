"use client";

import React, { useState } from "react";
import {
  Activity,
  MessageSquare,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Radio,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActivityEvent {
  id: string;
  text: string;
  time: string;
  type: "conversation" | "deal" | "calendar" | "task" | "broadcast";
  dotColor?: string;
}

interface RecentActivityCardProps {
  events?: ActivityEvent[];
  className?: string;
}

const DEFAULT_EVENTS: ActivityEvent[] = [
  {
    id: "act-1",
    text: "Sneha Reddy replied to fleet proposal on WhatsApp",
    time: "25m ago",
    type: "conversation",
    dotColor: "bg-[#3D5AFE]",
  },
  {
    id: "act-2",
    text: "Rohan Mehta confirmed consultation for technical architecture",
    time: "1h ago",
    type: "calendar",
    dotColor: "bg-[#1FA2E8]",
  },
  {
    id: "act-3",
    text: "Aarav Patel deal advanced to Qualified stage",
    time: "3h ago",
    type: "deal",
    dotColor: "bg-[#12B886]",
  },
  {
    id: "act-4",
    text: "Follow-up task scheduled for Sneha Reddy proposal terms",
    time: "4h ago",
    type: "task",
    dotColor: "bg-[#F5A524]",
  },
  {
    id: "act-5",
    text: "Q4 Retail Automation Announcement broadcast delivered to 10 contacts",
    time: "Yesterday",
    type: "broadcast",
    dotColor: "bg-[#7C4DFF]",
  },
];

export function RecentActivityCard({
  events = DEFAULT_EVENTS,
  className,
}: RecentActivityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getEventMeta = (type: ActivityEvent["type"]) => {
    switch (type) {
      case "conversation":
        return {
          icon: MessageSquare,
          bg: "bg-[#EAEEFF]",
          text: "text-[#2A3DB5]",
          border: "border-[#D6E0FF]",
        };
      case "deal":
        return {
          icon: TrendingUp,
          bg: "bg-[#E4F7EF]",
          text: "text-[#0A7A53]",
          border: "border-[#C2EED9]",
        };
      case "calendar":
        return {
          icon: Calendar,
          bg: "bg-[#E3F3FD]",
          text: "text-[#0A6AA3]",
          border: "border-[#BFE5FB]",
        };
      case "task":
        return {
          icon: CheckCircle2,
          bg: "bg-[#FFF3D6]",
          text: "text-[#8F5300]",
          border: "border-[#FFE5A3]",
        };
      case "broadcast":
        return {
          icon: Radio,
          bg: "bg-[#F0EAFF]",
          text: "text-[#5B34C9]",
          border: "border-[#DDD0FF]",
        };
      default:
        return {
          icon: Activity,
          bg: "bg-[#F7F5F0]",
          text: "text-[#454B57]",
          border: "border-[#E6E2D8]",
        };
    }
  };

  const visibleEvents = isExpanded ? events : events.slice(0, 2);

  return (
    <div
      className={cn(
        "rounded-[16px] bg-white/85 backdrop-blur-xl border border-[#E6E2D8] shadow-xs px-4 py-3 flex flex-col justify-between relative transition-colors duration-140",
        isExpanded ? "min-h-[160px] h-auto" : "h-[160px]",
        className
      )}
    >
      {/* Header Row (Apple OS Style) */}
      <div className="flex items-center justify-between pb-2 border-b border-[#F0ECE1] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Apple App Icon Squircle */}
          <div className="h-6 w-6 rounded-[7px] bg-gradient-to-b from-[#1B1F29] to-[#0B0D12] text-white flex items-center justify-center shadow-2xs shrink-0">
            <Activity className="h-3.5 w-3.5 text-white/90" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-medium text-[#12141A] tracking-[-0.01em] truncate">
                Recent activity
              </h2>
              <span className="h-1.5 w-1.5 rounded-full bg-[#12B886] shrink-0" />
            </div>
            <p className="text-[11px] font-normal text-[#666C78] truncate leading-tight">
              Events logged across conversations, deals, and team tasks
            </p>
          </div>
        </div>

        {/* Expand / Collapse Pill Action */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="h-6 px-2.5 rounded-[7px] bg-black/[0.04] hover:bg-black/[0.07] text-[#454B57] hover:text-[#12141A] text-[11px] font-medium flex items-center gap-1 transition-colors active:scale-[0.98] cursor-pointer shrink-0 ml-2"
          aria-expanded={isExpanded}
        >
          <span>{isExpanded ? "Collapse" : "Expand"}</span>
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform duration-140",
              isExpanded ? "rotate-180" : ""
            )}
          />
        </button>
      </div>

      {/* Events Stack */}
      <div
        className={cn(
          isExpanded
            ? "space-y-1.5 max-h-[260px] overflow-y-auto pr-1 mt-2.5"
            : "flex flex-col justify-between gap-1.5"
        )}
      >
        {visibleEvents.map((ev) => {
          const meta = getEventMeta(ev.type);
          const Icon = meta.icon;

          return (
            <div
              key={ev.id}
              className="h-[40px] flex items-center justify-between gap-2.5 px-3 rounded-[10px] bg-[#FAF9F5]/70 hover:bg-[#F5F2EB]/90 border border-[#EBE7DF]/80 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={cn(
                    "h-6 w-6 rounded-[6px] border flex items-center justify-center shrink-0",
                    meta.bg,
                    meta.text,
                    meta.border
                  )}
                >
                  <Icon className="h-3 w-3 stroke-[2.2]" />
                </div>
                <p className="text-[12px] font-normal text-[#12141A] truncate leading-tight">
                  {ev.text}
                </p>
              </div>

              <span className="text-[11px] font-medium text-[#8C93A0] tabular-nums shrink-0 whitespace-nowrap">
                {ev.time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
