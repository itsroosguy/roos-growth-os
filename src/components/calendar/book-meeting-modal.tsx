"use client";

import React, { useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleMeetIcon, ZoomIcon } from "./icons";
import { calendarStore } from "@/lib/calendar/calendar-store";
import { crmStore } from "@/lib/crm/crm-store";
import { MeetingPlatform } from "@/lib/calendar/types";
import { useToast } from "@/components/ui/toast-context";
import { Calendar as CalendarIcon, Clock, User, Video, Sparkles } from "lucide-react";

interface BookMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgSlug: string;
  onMeetingCreated?: () => void;
}

export function BookMeetingModal({
  open,
  onOpenChange,
  orgSlug,
  onMeetingCreated,
}: BookMeetingModalProps) {
  const { toast } = useToast();
  const contacts = crmStore.getContacts(orgSlug);

  const getContactFullName = (c: { first_name: string; last_name?: string | null }) =>
    `${c.first_name}${c.last_name ? ` ${c.last_name}` : ""}`;

  const [title, setTitle] = useState("Discovery & Demo Call");
  const [selectedContact, setSelectedContact] = useState(
    contacts[0] ? getContactFullName(contacts[0]) : "Sneha Reddy"
  );
  const [platform, setPlatform] = useState<MeetingPlatform>("zoom");
  const [startTime, setStartTime] = useState("3:30 PM");
  const [endTime, setEndTime] = useState("4:15 PM");
  const [notes, setNotes] = useState("Walkthrough of WhatsApp CRM automation workflows and pricing.");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedContact.trim()) return;

    const matchedContact = contacts.find((c) => getContactFullName(c) === selectedContact);

    const newMeet = calendarStore.createMeeting(orgSlug, {
      title: title.trim(),
      contact_name: selectedContact,
      contact_phone: matchedContact?.phone || "+91 98765 43210",
      contact_email: matchedContact?.email || undefined,
      contact_id: matchedContact?.id,
      start_time: startTime,
      end_time: endTime,
      platform,
      notes: notes.trim(),
    });

    toast("Meeting Scheduled", {
      message: `${title} scheduled with ${selectedContact} via ${
        platform === "zoom" ? "Zoom" : "Google Meet"
      }. Meeting link generated.`,
      type: "success",
    });

    onMeetingCreated?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-4">
        <DialogHeader className="mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-[12px] bg-[#FFF0EB] border border-[#FFD9CC] flex items-center justify-center text-[#FF5A1F]">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-[20px] font-medium text-[#12141A]">
                Schedule Client Meeting
              </DialogTitle>
              <DialogDescription className="text-[14px] text-[#666C78]">
                Syncs directly to Google Calendar and generates a conference link.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Meeting Title */}
          <div>
            <label className="block text-[13px] font-medium text-[#454B57] mb-1.5">
              Meeting Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Solution Walkthrough"
              required
              className="h-10 rounded-[12px] border-[#E6E2D8] text-[14px] text-[#12141A] focus:border-[#FF5A1F]"
            />
          </div>

          {/* Contact Selector */}
          <div>
            <label className="block text-[13px] font-medium text-[#454B57] mb-1.5">
              Client / Attendee
            </label>
            <select
              value={selectedContact}
              onChange={(e) => setSelectedContact(e.target.value)}
              className="w-full h-10 px-3 rounded-[12px] border border-[#E6E2D8] bg-white text-[14px] text-[#12141A] focus:outline-none focus:ring-1 focus:ring-[#FF5A1F]"
            >
              {contacts.map((c) => {
                const fullName = getContactFullName(c);
                return (
                  <option key={c.id} value={fullName}>
                    {fullName} {c.phone ? `(${c.phone})` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Platform Selector (Zoom vs Google Meet) */}
          <div>
            <label className="block text-[13px] font-medium text-[#454B57] mb-1.5">
              Video Platform
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPlatform("zoom")}
                className={`flex items-center justify-center gap-2.5 h-11 rounded-[14px] border text-[14px] font-medium transition-all ${
                  platform === "zoom"
                    ? "bg-[#EAEEFF] text-[#2A3DB5] border-[#3D5AFE] ring-1 ring-[#3D5AFE] shadow-2xs"
                    : "bg-white text-[#454B57] border-[#E6E2D8] hover:bg-[#F7F5F0]"
                }`}
              >
                <ZoomIcon className="h-4 w-4" />
                <span>Zoom Meeting</span>
              </button>

              <button
                type="button"
                onClick={() => setPlatform("google_meet")}
                className={`flex items-center justify-center gap-2.5 h-11 rounded-[14px] border text-[14px] font-medium transition-all ${
                  platform === "google_meet"
                    ? "bg-[#E4F7EF] text-[#0A7A53] border-[#12B886] ring-1 ring-[#12B886] shadow-2xs"
                    : "bg-white text-[#454B57] border-[#E6E2D8] hover:bg-[#F7F5F0]"
                }`}
              >
                <GoogleMeetIcon className="h-4 w-4" />
                <span>Google Meet</span>
              </button>
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-[#454B57] mb-1.5">
                Start Time
              </label>
              <Input
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="3:30 PM"
                required
                className="h-10 rounded-[12px] border-[#E6E2D8] text-[14px] text-[#12141A] tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#454B57] mb-1.5">
                End Time
              </label>
              <Input
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="4:15 PM"
                required
                className="h-10 rounded-[12px] border-[#E6E2D8] text-[14px] text-[#12141A] tabular-nums"
              />
            </div>
          </div>

          {/* Agenda / Notes */}
          <div>
            <label className="block text-[13px] font-medium text-[#454B57] mb-1.5">
              Agenda & Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full p-3 rounded-[12px] border border-[#E6E2D8] text-[14px] text-[#12141A] focus:outline-none focus:ring-1 focus:ring-[#FF5A1F]"
              placeholder="Key discussion topics..."
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#E6E2D8]">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-10 px-4 text-[14px] text-[#666C78]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="btn-primary text-[14px] font-medium"
            >
              Schedule Meeting
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
