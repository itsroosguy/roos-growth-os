"use client";

import React, { useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { GoogleCalendarIcon, ZoomIcon } from "./icons";
import { calendarStore } from "@/lib/calendar/calendar-store";
import { CalendarIntegrations } from "@/lib/calendar/types";
import { useToast } from "@/components/ui/toast-context";
import { Check, RefreshCw, ExternalLink, ShieldCheck, Zap } from "lucide-react";

interface CalendarIntegrationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgSlug: string;
  onIntegrationsUpdated?: () => void;
}

export function CalendarIntegrationsModal({
  open,
  onOpenChange,
  orgSlug,
  onIntegrationsUpdated,
}: CalendarIntegrationsModalProps) {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<CalendarIntegrations>(() =>
    calendarStore.getIntegrations(orgSlug)
  );
  const [isSyncing, setIsSyncing] = useState(false);

  const handleToggleGoogle = (checked: boolean) => {
    const updated = calendarStore.updateGoogleCalendar(orgSlug, {
      connected: checked,
      account_email: checked ? "praveen@roosstudiox.com" : "",
      calendar_name: checked ? "Roos StudioX Primary Calendar" : "",
    });
    setIntegrations((prev) => ({ ...prev, google_calendar: updated }));
    toast(checked ? "Google Calendar Connected" : "Google Calendar Disconnected", {
      message: checked
        ? "Two-way synchronization is active with your Google Workspace calendar."
        : "Google Calendar synchronization has been paused.",
      type: checked ? "success" : "info",
    });
    onIntegrationsUpdated?.();
  };

  const handleToggleGoogleAutoSync = (checked: boolean) => {
    const updated = calendarStore.updateGoogleCalendar(orgSlug, {
      auto_sync_whatsapp: checked,
    });
    setIntegrations((prev) => ({ ...prev, google_calendar: updated }));
    toast("Setting Updated", {
      message: checked
        ? "WhatsApp customer appointments will automatically sync to Google Calendar."
        : "Auto-sync for WhatsApp appointments disabled.",
      type: "info",
    });
    onIntegrationsUpdated?.();
  };

  const handleToggleZoom = (checked: boolean) => {
    const updated = calendarStore.updateZoom(orgSlug, {
      connected: checked,
      account_email: checked ? "praveen@roosstudiox.com" : "",
    });
    setIntegrations((prev) => ({ ...prev, zoom: updated }));
    toast(checked ? "Zoom Connected" : "Zoom Disconnected", {
      message: checked
        ? "Zoom API connected. Meeting links will be auto-generated."
        : "Zoom integration disconnected.",
      type: checked ? "success" : "info",
    });
    onIntegrationsUpdated?.();
  };

  const handleToggleZoomAutoLinks = (checked: boolean) => {
    const updated = calendarStore.updateZoom(orgSlug, {
      auto_create_links: checked,
    });
    setIntegrations((prev) => ({ ...prev, zoom: updated }));
    toast("Setting Updated", {
      message: checked
        ? "Zoom meeting URLs will be generated automatically for new bookings."
        : "Manual link mode enabled for Zoom.",
      type: "info",
    });
    onIntegrationsUpdated?.();
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const res = calendarStore.syncNow(orgSlug);
      setIsSyncing(false);
      toast("Sync Complete", {
        message: `Successfully refreshed ${res.count} calendar meetings with Google & Zoom.`,
        type: "success",
      });
      onIntegrationsUpdated?.();
    }, 700);
  };

  const gCal = integrations.google_calendar;
  const zoom = integrations.zoom;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-4">
        <DialogHeader className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-1.5">
                <div className="h-8 w-8 rounded-full bg-white border border-[#E6E2D8] shadow-2xs flex items-center justify-center">
                  <GoogleCalendarIcon className="h-4 w-4" />
                </div>
                <div className="h-8 w-8 rounded-full bg-white border border-[#E6E2D8] shadow-2xs flex items-center justify-center">
                  <ZoomIcon className="h-4 w-4" />
                </div>
              </div>
              <DialogTitle className="text-[20px] font-medium text-[#12141A]">
                Calendar & Meeting Integrations
              </DialogTitle>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="h-8 px-3 text-[13px] gap-1.5 rounded-[10px] border-[#E6E2D8] text-[#454B57] hover:text-[#12141A] interactive-tap-spring"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-[#FF5A1F]" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync now"}</span>
            </Button>
          </div>
          <DialogDescription className="text-[14px] text-[#666C78] mt-1">
            Connect your primary scheduling tools to synchronize customer WhatsApp appointments,
            prevent double bookings, and auto-generate video conference links.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* 1. Google Calendar Integration Card */}
          <div className="rounded-[18px] border border-[#E6E2D8] bg-[#FAF8F5] p-5 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="h-11 w-11 rounded-[14px] bg-white border border-[#E6E2D8] shadow-2xs flex items-center justify-center shrink-0">
                  <GoogleCalendarIcon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-[15px] font-medium text-[#12141A]">Google Calendar</h4>
                    {gCal.connected ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-medium bg-[#E4F7EF] text-[#0A7A53] border border-[#BDECD7]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#12B886]" />
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-medium bg-[#F7F5F0] text-[#666C78] border border-[#E6E2D8]">
                        Disconnected
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-[#666C78] mt-0.5">
                    {gCal.connected
                      ? `Syncing with ${gCal.account_email || "praveen@roosstudiox.com"} (${gCal.calendar_name || "Primary"})`
                      : "Connect your Google account to auto-sync client calls and schedule appointments."}
                  </p>
                </div>
              </div>

              <Switch checked={gCal.connected} onCheckedChange={handleToggleGoogle} />
            </div>

            {gCal.connected && (
              <div className="mt-4 pt-4 border-t border-[#E6E2D8]/80 space-y-3">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#454B57]">Sync WhatsApp client appointments to Calendar</span>
                  <Switch
                    checked={gCal.auto_sync_whatsapp}
                    onCheckedChange={handleToggleGoogleAutoSync}
                  />
                </div>
                <div className="flex items-center justify-between text-[13px] pt-1">
                  <span className="text-[#666C78]">Two-way calendar busy availability sync</span>
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#0A7A53]">
                    <Check className="h-3 w-3" /> Active
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Zoom Integration Card */}
          <div className="rounded-[18px] border border-[#E6E2D8] bg-[#FAF8F5] p-5 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="h-11 w-11 rounded-[14px] bg-white border border-[#E6E2D8] shadow-2xs flex items-center justify-center shrink-0">
                  <ZoomIcon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-[15px] font-medium text-[#12141A]">Zoom Video Meetings</h4>
                    {zoom.connected ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-medium bg-[#EAEEFF] text-[#2A3DB5] border border-[#D3DCFF]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#3D5AFE]" />
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-medium bg-[#F7F5F0] text-[#666C78] border border-[#E6E2D8]">
                        Disconnected
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-[#666C78] mt-0.5">
                    {zoom.connected
                      ? `Connected to ${zoom.account_email || "praveen@roosstudiox.com"} (API Pro)`
                      : "Connect Zoom to instantly generate 1-click video links for WhatsApp demos."}
                  </p>
                </div>
              </div>

              <Switch checked={zoom.connected} onCheckedChange={handleToggleZoom} />
            </div>

            {zoom.connected && (
              <div className="mt-4 pt-4 border-t border-[#E6E2D8]/80 space-y-3">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#454B57]">Auto-generate Zoom meeting links for new bookings</span>
                  <Switch
                    checked={zoom.auto_create_links}
                    onCheckedChange={handleToggleZoomAutoLinks}
                  />
                </div>
                <div className="flex items-center justify-between text-[13px] pt-1">
                  <span className="text-[#666C78]">Default meeting duration</span>
                  <span className="text-[13px] font-medium text-[#12141A] tabular-nums">
                    30 minutes
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#E6E2D8] flex items-center justify-between text-[13px]">
          <div className="flex items-center gap-1.5 text-[#666C78]">
            <ShieldCheck className="h-4 w-4 text-[#12B886]" />
            <span>OAuth 2.0 encrypted • Verified Google & Zoom scopes</span>
          </div>

          <Button
            className="btn-primary text-[14px] font-medium"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
