"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { cn, getAvatarColor, getInitials } from "@/lib/utils";
import { TeamMember, DepartmentType } from "@/lib/team/team-store";
import {
  ArrowRightLeft,
  X,
  Check,
  CreditCard,
  Briefcase,
  Headphones,
  Settings,
  ShieldAlert,
  User,
  Sparkles,
  MessageSquare,
  Lock,
} from "lucide-react";

interface ForwardConversationModalProps {
  open: boolean;
  onClose: () => void;
  customerName: string;
  customerPhone: string;
  currentAssigneeName?: string | null;
  currentDepartment?: string | null;
  teamMembers: TeamMember[];
  onForward: (assignee: {
    userId: string | null;
    name: string | null;
    department?: string | null;
  }, handoffNote: string) => void;
}

const DEPARTMENTS: { id: "all" | DepartmentType; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All Departments", icon: User },
  { id: "billing", label: "Billing & Accounts", icon: CreditCard },
  { id: "sales", label: "Sales & Deals", icon: Briefcase },
  { id: "support", label: "Customer Support", icon: Headphones },
  { id: "ops", label: "Technical & Ops", icon: Settings },
];

const QUICK_NOTES = [
  "Needs billing & invoice assistance",
  "Requested GST tax invoice and payment link",
  "Pricing clarification & commercial review",
  "Payment gateway / transaction issue",
  "Technical integration & API support",
  "Ready to close • Requires finance approval",
];

export function ForwardConversationModal({
  open,
  onClose,
  customerName,
  customerPhone,
  currentAssigneeName,
  currentDepartment,
  teamMembers,
  onForward,
}: ForwardConversationModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedDept, setSelectedDept] = useState<"all" | DepartmentType>("billing");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("user-102"); // Default to Rohan Mehta (Billing)
  const [handoffNote, setHandoffNote] = useState(
    "Customer requested GST tax invoice and bank payment details for the fleet proposal."
  );
  const [postAsNote, setPostAsNote] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter members by selected department
  const filteredMembers = useMemo(() => {
    if (selectedDept === "all") return teamMembers;
    return teamMembers.filter((m) => m.department === selectedDept);
  }, [teamMembers, selectedDept]);

  // Selected member object
  const selectedMember = useMemo(() => {
    return teamMembers.find((m) => m.id === selectedMemberId) || null;
  }, [teamMembers, selectedMemberId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      // Unassigned case
      onForward({ userId: null, name: null, department: null }, handoffNote);
      onClose();
      return;
    }

    onForward(
      {
        userId: selectedMember.id,
        name: selectedMember.name,
        department: selectedMember.department || null,
      },
      postAsNote ? handoffNote : ""
    );
    onClose();
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0B0D12]/45 backdrop-blur-[6px] transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        id="forward-conversation-dialog"
        className="relative z-10 w-full max-w-lg rounded-[18px] border border-[#EDE8E0] bg-white p-5 shadow-2xl animate-page-enter max-h-[88vh] overflow-y-auto custom-light-scroll"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full text-[#666C78] hover:text-[#12141A] hover:bg-[#F7F5F0] transition-colors cursor-pointer"
          aria-label="Close forward dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#F0ECE4]">
          <div className="h-10 w-10 rounded-[12px] bg-[#EEF2FF] text-[#3D5AFE] flex items-center justify-center shadow-2xs">
            <ArrowRightLeft className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[17px] font-semibold text-[#12141A]">
              Forward Conversation &amp; Assign Handoff
            </h3>
            <p className="text-[12.5px] text-[#666C78] mt-0.5">
              Transfer this customer thread to another specialist or department (e.g. Sales to Billing).
            </p>
          </div>
        </div>

        {/* Current State Context Banner */}
        <div className="p-3 rounded-[12px] bg-[#FAF9F5] border border-[#EDE8E0] mb-4 flex items-center justify-between text-[12.5px]">
          <div>
            <span className="text-[#666C78]">Customer:</span>{" "}
            <span className="font-semibold text-[#12141A]">{customerName}</span>{" "}
            <span className="text-[#666C78] tabular-nums">({customerPhone})</span>
          </div>
          <div className="text-right">
            <span className="text-[#666C78]">Current:</span>{" "}
            <span className="font-medium text-[#454B57]">
              {currentAssigneeName || "Unassigned"}
              {currentDepartment ? ` (${currentDepartment})` : ""}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Department Filter Tabs */}
          <div>
            <label className="text-[11.5px] font-semibold text-[#666C78] uppercase tracking-wider block mb-2">
              Select Target Department
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {DEPARTMENTS.map((dept) => {
                const Icon = dept.icon;
                const isSelected = selectedDept === dept.id;
                const count =
                  dept.id === "all"
                    ? teamMembers.length
                    : teamMembers.filter((m) => m.department === dept.id).length;

                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => {
                      setSelectedDept(dept.id);
                      // If current selected member is not in this department, pick first from department
                      const inDept =
                        dept.id === "all"
                          ? teamMembers
                          : teamMembers.filter((m) => m.department === dept.id);
                      if (inDept.length > 0 && !inDept.some((m) => m.id === selectedMemberId)) {
                        setSelectedMemberId(inDept[0].id);
                      }
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-[10px] text-[12.5px] font-medium transition-all duration-140 flex items-center gap-1.5 cursor-pointer border",
                      isSelected
                        ? "bg-[#3D5AFE] text-white border-[#3D5AFE] shadow-2xs"
                        : "bg-white text-[#454B57] border-[#EDE8E0] hover:bg-[#FAF9F5]"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{dept.label}</span>
                    <span
                      className={cn(
                        "text-[11px] px-1.5 py-0.2 rounded-full",
                        isSelected ? "bg-white/20 text-white" : "bg-[#F0EDE6] text-[#666C78]"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Team Members List */}
          <div>
            <label className="text-[11.5px] font-semibold text-[#666C78] uppercase tracking-wider block mb-2">
              Assign To Team Specialist
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[190px] overflow-y-auto custom-light-scroll p-0.5">
              {filteredMembers.map((member) => {
                const isSelected = selectedMemberId === member.id;
                const av = getAvatarColor(member.name);

                return (
                  <div
                    key={member.id}
                    onClick={() => setSelectedMemberId(member.id)}
                    className={cn(
                      "p-3 rounded-[12px] border text-left cursor-pointer transition-all duration-140 flex items-center justify-between",
                      isSelected
                        ? "border-[#3D5AFE] bg-[#F4F6FF] shadow-2xs ring-1 ring-[#3D5AFE]/30"
                        : "border-[#EDE8E0] bg-white hover:bg-[#FAF9F5]"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-semibold border shrink-0",
                          av.bg,
                          av.text,
                          av.border
                        )}
                      >
                        {getInitials(member.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-[#12141A] truncate leading-tight">
                          {member.name}
                        </div>
                        <div className="text-[11.5px] text-[#666C78] truncate mt-0.5">
                          {member.title || member.role}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="h-5 w-5 rounded-full bg-[#3D5AFE] text-white flex items-center justify-center shrink-0 ml-2">
                        <Check className="h-3 w-3 stroke-[2.5]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Handoff Reason Chips */}
          <div>
            <label className="text-[11.5px] font-semibold text-[#666C78] uppercase tracking-wider block mb-1.5">
              Quick Reason / Context
            </label>
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              {QUICK_NOTES.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setHandoffNote(preset)}
                  className={cn(
                    "px-2.5 py-1 rounded-[8px] text-[12px] font-medium transition-colors border cursor-pointer",
                    handoffNote === preset
                      ? "bg-[#FFF6E5] text-[#995700] border-[#FFE7B8]"
                      : "bg-[#FAF9F5] text-[#555A66] border-[#EDE8E0] hover:bg-white"
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Note Textarea */}
            <div className="relative">
              <textarea
                rows={2}
                value={handoffNote}
                onChange={(e) => setHandoffNote(e.target.value)}
                placeholder="Add internal context for the next person (e.g., customer needs GST invoice copy or payment gateway help)..."
                className="w-full resize-none rounded-[12px] border border-[#EDE8E0] bg-[#FAF9F5] p-3 text-[13px] text-[#12141A] placeholder:text-[#8A909D] focus:bg-white focus:border-[#3D5AFE] focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Post as Internal Note Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-[10px] bg-[#FFFBEB] border border-[#FEF3C7] text-[12.5px]">
            <div className="flex items-center gap-2 text-[#92400E]">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              <span>Record as private internal team note in chat thread</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={postAsNote}
                onChange={(e) => setPostAsNote(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#D1D5DB] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#F59E0B]" />
            </label>
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0ECE4]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[10px] border border-[#EDE8E0] bg-white hover:bg-[#F7F5F0] text-[#454B57] text-[13px] font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-forward-btn"
              type="submit"
              className="px-4 py-2 rounded-[10px] bg-gradient-to-b from-[#4F6BFF] to-[#3D5AFE] text-white text-[13px] font-medium shadow-xs hover:opacity-95 transition-opacity cursor-pointer flex items-center gap-2"
            >
              <ArrowRightLeft className="h-4 w-4" />
              <span>
                Forward to {selectedMember ? selectedMember.name.split(" ")[0] : "Queue"}
                {selectedMember?.department ? ` (${selectedMember.department})` : ""}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
