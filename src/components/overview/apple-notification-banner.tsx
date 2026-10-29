"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MessageSquare, X, ArrowUpRight, Send, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversationNotification {
  id: string;
  contact_name?: string | null;
  contact_phone?: string | null;
  inboundText?: string;
  waitLabel?: string;
  unread_count?: number;
}

interface AppleNotificationBannerProps {
  orgSlug: string;
  notifications: ConversationNotification[];
  onReply?: (conversationId: string, replyText: string) => void;
  onDismiss?: (conversationId: string) => void;
}

export function AppleNotificationBanner({
  orgSlug,
  notifications,
  onReply,
  onDismiss,
}: AppleNotificationBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isDismissed, setIsDismissed] = useState(false);

  // If dismissed or no notifications, render caught-up calm state
  const activeItems = notifications.filter((_, idx) => !isDismissed || idx !== currentIndex);
  const activeItem = activeItems[currentIndex] || activeItems[0] || null;

  const handleNext = () => {
    if (activeItems.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % activeItems.length);
      setIsReplying(false);
      setReplyText("");
    }
  };

  const handlePrev = () => {
    if (activeItems.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + activeItems.length) % activeItems.length);
      setIsReplying(false);
      setReplyText("");
    }
  };

  const handleSend = () => {
    if (!activeItem || !replyText.trim()) return;
    if (onReply) {
      onReply(activeItem.id, replyText);
    }
    setReplyText("");
    setIsReplying(false);
  };

  const handleDismiss = () => {
    if (!activeItem) return;
    if (onDismiss) {
      onDismiss(activeItem.id);
    }
    if (activeItems.length <= 1) {
      setIsDismissed(true);
    } else {
      setCurrentIndex((prev) => prev % (activeItems.length - 1));
    }
  };

  // State 1: All caught up (Apple Calm State)
  if (!activeItem || isDismissed || activeItems.length === 0) {
    return (
      <div className="h-full min-h-[160px] rounded-[20px] bg-white/80 backdrop-blur-xl border border-white/80 shadow-[0_8px_24px_-6px_rgba(11,13,18,0.06),0_1px_2px_rgba(11,13,18,0.04),inset_0_1px_0_rgba(255,255,255,0.95)] p-4 sm:p-5 flex flex-col justify-between transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-[6px] bg-[#12B886]/15 text-[#0A7A53] flex items-center justify-center">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
            <span className="text-[11px] font-medium tracking-[0.04em] text-[#666C78] uppercase">
              LIVE ACTIVITY
            </span>
          </div>
          <span className="text-[11.5px] text-[#8C93A0]">All caught up</span>
        </div>

        <div className="my-auto py-1">
          <p className="text-[14px] font-medium text-[#12141A]">
            Zero pending customer inquiries
          </p>
          <p className="text-[13px] text-[#666C78] mt-0.5">
            Avg. first response time is under 2 minutes today.
          </p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[12px] text-[#0A7A53] font-medium flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#12B886]" />
            WhatsApp Gateway Active
          </span>
          <Link
            href={`/app/${orgSlug}/inbox`}
            className="text-[12px] text-[#12141A] hover:text-[#FF5A1F] font-medium flex items-center gap-1 transition-colors"
          >
            <span>View Inbox</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // State 2: Active Apple OS Notification Card
  const senderName = activeItem.contact_name || activeItem.contact_phone || "Inbound Lead";
  const waitTime = activeItem.waitLabel || "now";
  const messageBody = activeItem.inboundText || "Hello! We would like to learn more about your services.";

  return (
    <div className="h-full min-h-[160px] rounded-[20px] bg-white/85 backdrop-blur-xl border border-white/80 shadow-[0_8px_24px_-6px_rgba(11,13,18,0.06),0_1px_2px_rgba(11,13,18,0.04),inset_0_1px_0_rgba(255,255,255,0.95)] p-4 sm:p-4.5 flex flex-col justify-between transition-all duration-200 relative group overflow-hidden">
      {/* Top Header Row (Apple Style) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Apple App Icon Squircle */}
          <div className="h-5.5 w-5.5 rounded-[7px] bg-gradient-to-b from-[#2DD765] to-[#20BA56] text-white flex items-center justify-center shadow-2xs shrink-0">
            <MessageSquare className="h-3.5 w-3.5 fill-white stroke-none" />
          </div>

          <span className="text-[11px] font-semibold tracking-wider text-[#666C78] uppercase">
            WHATSAPP
          </span>

          <span className="text-[#D2CEC2] text-[10px]">•</span>

          {/* Pulse Live Badge */}
          <div className="flex items-center gap-1 text-[11px] font-medium text-[#0A7A53] bg-[#E4F7EF] px-1.5 py-0.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-[#12B886] animate-pulse" />
            <span>Incoming</span>
          </div>
        </div>

        {/* Right Timestamp & Dismiss */}
        <div className="flex items-center gap-2">
          <span className="text-[11.5px] text-[#8C93A0] font-normal tabular-nums">
            {waitTime}
          </span>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss notification"
            className="h-5 w-5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#8C93A0] hover:text-[#12141A] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Middle Content */}
      <div className="my-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-medium text-[#12141A] truncate">
            {senderName}
          </p>
          {activeItems.length > 1 && (
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[11px] text-[#8C93A0] tabular-nums mr-0.5">
                {currentIndex + 1} of {activeItems.length}
              </span>
              <button
                type="button"
                onClick={handlePrev}
                className="h-5 w-5 rounded-full hover:bg-black/[0.06] text-[#666C78] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Previous notification"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="h-5 w-5 rounded-full hover:bg-black/[0.06] text-[#666C78] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Next notification"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        <p className="text-[13px] text-[#454B57] line-clamp-2 mt-0.5 leading-snug">
          “{messageBody}”
        </p>
      </div>

      {/* Bottom Action Strip (Apple OS Style) */}
      {isReplying ? (
        <div className="flex items-center gap-2 pt-1 animate-emil-entrance">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type quick reply..."
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
              if (e.key === "Escape") setIsReplying(false);
            }}
            autoFocus
            className="flex-1 h-8 px-3 rounded-[10px] bg-white border border-[#E6E2D8] text-[13px] text-[#12141A] focus:outline-none focus:ring-2 focus:ring-[#3D5AFE]/20 focus:border-[#3D5AFE] placeholder:text-[#A3A9B6]"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!replyText.trim()}
            className="h-8 px-3 rounded-[10px] bg-[#12141A] hover:bg-[#1B1F29] text-white text-[12px] font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer shrink-0"
          >
            <Send className="h-3 w-3" />
            <span>Send</span>
          </button>
          <button
            type="button"
            onClick={() => setIsReplying(false)}
            className="h-8 px-2.5 rounded-[10px] bg-black/[0.04] hover:bg-black/[0.08] text-[#666C78] text-[12px] font-medium transition-colors cursor-pointer shrink-0"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            {/* Apple Primary Quick Action */}
            <button
              type="button"
              onClick={() => setIsReplying(true)}
              className="h-7.5 px-3 rounded-[9px] bg-[#12141A] hover:bg-[#1B1F29] text-white text-[12px] font-medium flex items-center gap-1.5 shadow-2xs active:scale-[0.98] transition-transform duration-140 cursor-pointer"
            >
              <Send className="h-3 w-3 text-white/90" />
              <span>Reply</span>
            </button>

            {/* Apple Secondary Glass Action */}
            <Link
              href={`/app/${orgSlug}/inbox?conversationId=${activeItem.id}`}
              className="h-7.5 px-3 rounded-[9px] bg-black/[0.04] hover:bg-black/[0.07] text-[#12141A] border border-black/[0.05] text-[12px] font-medium flex items-center gap-1 active:scale-[0.98] transition-transform duration-140"
            >
              <span>Open Chat</span>
              <ArrowUpRight className="h-3 w-3 text-[#666C78]" />
            </Link>
          </div>

          <span className="text-[11.5px] text-[#8C93A0] hidden sm:inline-block">
            Press Reply or Open Chat
          </span>
        </div>
      )}
    </div>
  );
}
