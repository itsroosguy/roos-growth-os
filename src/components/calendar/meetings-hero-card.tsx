"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { GoogleCalendarIcon, GoogleMeetIcon, ZoomIcon } from "./icons";
import { CalendarIntegrationsModal } from "./calendar-integrations-modal";
import { BookMeetingModal } from "./book-meeting-modal";
import { calendarStore } from "@/lib/calendar/calendar-store";
import { Meeting } from "@/lib/calendar/types";
import { useToast } from "@/components/ui/toast-context";
import {
  Calendar as CalendarIcon,
  Video,
  ExternalLink,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Clock,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";

interface MeetingsHeroCardProps {
  orgSlug: string;
}

export function MeetingsHeroCard({ orgSlug }: MeetingsHeroCardProps) {
  const { toast } = useToast();
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const [bookMeetingOpen, setBookMeetingOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const meetings = calendarStore.getTodayMeetings(orgSlug);
  const integrations = calendarStore.getIntegrations(orgSlug);

  const handleSyncNow = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsSyncing(true);
    setTimeout(() => {
      const res = calendarStore.syncNow(orgSlug);
      setIsSyncing(false);
      setRefreshKey((k) => k + 1);
      toast("Calendar Synced", {
        message: `Synced ${res.count} scheduled meetings from Google Calendar & Zoom.`,
        type: "success",
      });
    }, 600);
  };

  const handleCopyLink = (m: Meeting, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(m.meeting_url);
    setCopiedId(m.id);
    setTimeout(() => setCopiedId(null), 1500);
    toast("Link Copied", {
      message: `${m.platform === "zoom" ? "Zoom" : "Google Meet"} link copied to clipboard.`,
      type: "info",
    });
  };

  const nextMeeting = meetings.find((m) => m.status === "scheduled") || meetings[0];

  return (
    <>
      <div className="card-2027 rounded-[28px] border border-[#E6E2D8] bg-white p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden shadow-[0_2px_4px_rgba(11,13,18,0.04),0_16px_36px_-12px_rgba(11,13,18,0.12)] hover:shadow-[0_20px_48px_-12px_rgba(45,140,255,0.14)] transition-all duration-200 h-full">
        {/* Top tri-color Google/Zoom/Emerald gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#4285F4] via-[#2D8CFF] to-[#12B886]" />

        <div className="space-y-3">
          {/* Header Row: Date Squircle + Title + Quick Actions */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Live Date Squircle badge */}
              <div className="flex flex-col items-center justify-center h-10 w-10 rounded-[12px] bg-[#FAF8F5] border border-[#E6E2D8] text-center shadow-2xs shrink-0">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#FF5A1F] leading-none">
                  OCT
                </span>
                <span className="text-[15px] font-semibold text-[#12141A] leading-none mt-0.5 tabular-nums">
                  29
                </span>
              </div>

              <div className="min-w-0">
                <h3 className="text-[15px] font-medium text-[#12141A] leading-tight whitespace-nowrap">
                  Meetings & Calls
                </h3>
                <p className="text-[12px] text-[#666C78] truncate mt-0.5" suppressHydrationWarning>
                  {meetings.length} calls today • Synced
                </p>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIntegrationsOpen(true)}
                className="h-8 w-8 p-0 rounded-[9px] border-[#E6E2D8] text-[#454B57] hover:text-[#12141A] hover:bg-[#F7F5F0] shadow-2xs interactive-tap-spring"
                title="Configure Google Calendar & Zoom Integrations"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#666C78]" />
              </Button>

              <Button
                size="sm"
                onClick={() => setBookMeetingOpen(true)}
                className="btn-primary-flame h-8 px-2.5 gap-1 text-[12.5px] font-medium rounded-[9px] shadow-2xs interactive-tap-spring"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Book</span>
              </Button>
            </div>
          </div>

          {/* Integration Status Bar */}
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-[12px] bg-[#FAF8F5] border border-[#E6E2D8] text-[12px] shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              {/* Google Calendar Status */}
              <button
                type="button"
                onClick={() => setIntegrationsOpen(true)}
                className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md hover:bg-white text-[#454B57] transition-colors cursor-pointer"
              >
                <GoogleCalendarIcon className="h-3.5 w-3.5" />
                <span className="font-medium text-[#12141A]">Google</span>
                <span className="h-1 w-1 rounded-full bg-[#12B886]" />
              </button>

              <span className="text-[#D2CEC2] hidden sm:inline">•</span>

              {/* Zoom Status */}
              <button
                type="button"
                onClick={() => setIntegrationsOpen(true)}
                className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md hover:bg-white text-[#454B57] transition-colors cursor-pointer"
              >
                <ZoomIcon className="h-3.5 w-3.5" />
                <span className="font-medium text-[#12141A]">Zoom</span>
                <span className="h-1 w-1 rounded-full bg-[#3D5AFE]" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-[#666C78] hover:text-[#12141A] transition-colors px-1.5 py-0.5 rounded hover:bg-white shrink-0 cursor-pointer"
              title="Sync calendar events now"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin text-[#FF5A1F]" : ""}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          </div>

          {/* Scheduled Meetings Feed */}
          <div className="space-y-2">
            {meetings.map((m, idx) => {
              const isZoom = m.platform === "zoom";
              const isCompleted = m.status === "completed";

              return (
                <div
                  key={m.id}
                  className={`p-3 rounded-[14px] border transition-all duration-140 flex flex-col gap-1.5 ${
                    isCompleted
                      ? "bg-[#FAF8F5]/60 border-[#E6E2D8] opacity-60"
                      : idx === 0
                      ? "bg-gradient-to-r from-[#FFFFFF] via-[#F8FBFF] to-[#FAF8FF] border-[#C8DCFF] shadow-xs ring-1 ring-[#3D5AFE]/10"
                      : "bg-[#FFFFFF] border-[#E6E2D8] hover:border-[#D0E2FF]"
                  }`}
                >
                  {/* Top Line: Platform Pill + Time + Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border shrink-0 ${
                          isZoom
                            ? "bg-[#EAEEFF] text-[#2A3DB5] border-[#D3DCFF]"
                            : "bg-[#E4F7EF] text-[#0A7A53] border-[#BDECD7]"
                        }`}
                      >
                        {isZoom ? <ZoomIcon className="h-3 w-3" /> : <GoogleMeetIcon className="h-3 w-3" />}
                        <span>{isZoom ? "Zoom" : "Meet"}</span>
                      </span>

                      <span className="text-[12px] font-medium text-[#454B57] tabular-nums" suppressHydrationWarning>
                        {m.start_time}
                      </span>

                      {idx === 0 && !isCompleted && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-[#FFE2D4] text-[#B93A0A] border border-[#FFCCD0] shrink-0">
                          Next
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(m, e)}
                        className="h-6 w-6 rounded-[6px] border border-[#E6E2D8] bg-white hover:bg-[#F7F5F0] flex items-center justify-center text-[#666C78] hover:text-[#12141A] transition-colors"
                        title="Copy meeting link"
                      >
                        {copiedId === m.id ? (
                          <Check className="h-3 w-3 text-[#12B886]" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>

                      <a
                        href={m.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 h-6 px-2 rounded-[6px] text-[11.5px] font-medium transition-all shadow-2xs ${
                          isZoom
                            ? "bg-[#2D8CFF] hover:bg-[#1E78E8] text-white"
                            : "bg-[#00832D] hover:bg-[#006E25] text-white"
                        }`}
                      >
                        <span>Join</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>

                  {/* Bottom Line: Meeting Title & Attendee */}
                  <div className="min-w-0">
                    <h4 className="text-[13px] font-medium text-[#12141A] leading-snug truncate">
                      {m.title}
                    </h4>
                    <p className="text-[11.5px] text-[#666C78] mt-0.5 truncate">
                      With <span className="text-[#12141A] font-medium">{m.contact_name}</span>
                    </p>
                  </div>
                </div>
              );
            })}

            {meetings.length === 0 && (
              <div className="py-6 px-4 rounded-[14px] bg-[#FAF8F5] border border-dashed border-[#E6E2D8] text-center">
                <CalendarIcon className="h-6 w-6 text-[#8E95A3] mx-auto mb-2" />
                <p className="text-[13px] font-medium text-[#12141A]">No meetings scheduled today</p>
                <p className="text-[12px] text-[#666C78] mt-0.5">
                  Book a new client walkthrough or sync your calendar.
                </p>
                <Button
                  size="sm"
                  onClick={() => setBookMeetingOpen(true)}
                  className="mt-2.5 btn-primary-flame h-7 px-3 text-[12px]"
                >
                  Schedule call
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Ribbon: Next meeting quick status & Google Calendar link */}
        <div className="pt-2 mt-2 flex items-center justify-between text-[12px] border-t border-[#E6E2D8] text-[#666C78]">
          <div className="flex items-center gap-1.5 truncate">
            <Clock className="h-3 w-3 text-[#FF5A1F] shrink-0" />
            <span className="truncate" suppressHydrationWarning>
              {nextMeeting
                ? `Next: ${nextMeeting.title} at ${nextMeeting.start_time}`
                : "All meetings completed for today"}
            </span>
          </div>

          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-[#3D5AFE] hover:underline shrink-0"
          >
            <span>Calendar</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>

      {/* Integration Management Dialog */}
      <CalendarIntegrationsModal
        open={integrationsOpen}
        onOpenChange={setIntegrationsOpen}
        orgSlug={orgSlug}
        onIntegrationsUpdated={() => setRefreshKey((k) => k + 1)}
      />

      {/* Book Meeting Dialog */}
      <BookMeetingModal
        open={bookMeetingOpen}
        onOpenChange={setBookMeetingOpen}
        orgSlug={orgSlug}
        onMeetingCreated={() => setRefreshKey((k) => k + 1)}
      />
    </>
  );
}
