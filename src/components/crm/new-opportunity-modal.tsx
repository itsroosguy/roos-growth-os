"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { crmStore } from "@/lib/crm/crm-store";
import { LeadStage, Lead } from "@/types/crm";
import { formatINR, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast-context";
import {
  X,
  TrendingUp,
  User,
  Phone,
  FileText,
  Check,
  Plus,
} from "lucide-react";

interface NewOpportunityModalProps {
  open: boolean;
  onClose: () => void;
  orgSlug: string;
  onSuccess?: (lead: Lead) => void;
  initialStage?: LeadStage;
  initialContactName?: string;
  initialContactPhone?: string;
}

const STAGES: Array<{
  id: LeadStage;
  label: string;
  color: string;
  bgActive: string;
  borderActive: string;
  textColor: string;
}> = [
  {
    id: "new",
    label: "Inbound",
    color: "#1FA2E8",
    bgActive: "bg-[#E3F3FD]",
    borderActive: "border-[#1FA2E8]",
    textColor: "text-[#0A6AA3]",
  },
  {
    id: "contacted",
    label: "Contacted",
    color: "#3D5AFE",
    bgActive: "bg-[#EAEEFF]",
    borderActive: "border-[#3D5AFE]",
    textColor: "text-[#2A3DB5]",
  },
  {
    id: "qualified",
    label: "Qualified",
    color: "#F5A524",
    bgActive: "bg-[#FFF3D6]",
    borderActive: "border-[#F5A524]",
    textColor: "text-[#8F5300]",
  },
  {
    id: "proposal",
    label: "Proposal",
    color: "#FF5A1F",
    bgActive: "bg-[#FFF1EA]",
    borderActive: "border-[#FF5A1F]",
    textColor: "text-[#B93A0A]",
  },
];

const PRESETS = [
  { label: "₹50K", value: 50000 },
  { label: "₹1.5L", value: 150000 },
  { label: "₹3L", value: 300000 },
  { label: "₹5L", value: 500000 },
  { label: "₹10L", value: 1000000 },
];

export function NewOpportunityModal({
  open,
  onClose,
  orgSlug,
  onSuccess,
  initialStage = "new",
  initialContactName = "",
  initialContactPhone = "",
}: NewOpportunityModalProps) {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState("");
  const [dealValue, setDealValue] = useState("150000");
  const [stage, setStage] = useState<LeadStage>(initialStage);
  const [contactName, setContactName] = useState(initialContactName);
  const [contactPhone, setContactPhone] = useState(initialContactPhone);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync initial props when opened
  useEffect(() => {
    if (open) {
      setStage(initialStage);
      if (initialContactName) setContactName(initialContactName);
      if (initialContactPhone) setContactPhone(initialContactPhone);
    }
  }, [open, initialStage, initialContactName, initialContactPhone]);

  // Lock body scroll & close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const numValue = parseFloat(dealValue) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const createdLead = crmStore.createLead(orgSlug, {
        title: title.trim(),
        estimated_value: numValue,
        stage,
        contact_name: contactName.trim() || "Direct Inquiry",
        contact_phone: contactPhone.trim() || "+91 98765 00000",
        contact_id: `c-${Date.now()}`,
        currency: "INR",
        notes: notes.trim() || undefined,
      });

      toast("Opportunity Created", {
        message: `"${title.trim()}" added to ${stage} stage (${formatINR(numValue)}).`,
        type: "success",
      });

      // Reset fields
      setTitle("");
      setDealValue("150000");
      setContactName("");
      setContactPhone("");
      setNotes("");

      onSuccess?.(createdLead);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0B0D12]/45 backdrop-blur-[8px] animate-page-enter transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
        className="relative w-full max-w-[540px] max-h-[min(90vh,680px)] flex flex-col rounded-[24px] bg-white border border-[#E6E2D8] shadow-[0_24px_56px_-12px_rgba(11,13,18,0.28)] overflow-hidden will-change-[transform,opacity] animate-reveal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed top */}
        <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-4 border-b border-[#EFEDE7] bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[12px] bg-[#FFF1EA] border border-[#FFE2D4] text-[#FF5A1F] flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <h2
                id="modal-headline"
                className="text-[1.1875rem] font-medium text-[#12141A] tracking-[-0.015em] leading-tight"
              >
                New Opportunity
              </h2>
              <p className="text-[0.8125rem] text-[#666C78] mt-0.5">
                Add a qualified customer deal to your sales pipeline
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="h-8 w-8 rounded-[10px] text-[#666C78] hover:text-[#12141A] hover:bg-[#F7F5F0] active:scale-[0.95] transition-all duration-140 flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body - Scrollable if viewport is tiny */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          <div className="p-6 space-y-4 flex-1">
            {/* 1. Opportunity Title */}
            <div>
              <label className="text-[13px] font-medium text-[#12141A] block mb-1.5">
                Opportunity title <span className="text-[#E5484D]">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Acme Fleet Expansion Retainer"
                className="w-full h-10 px-3.5 rounded-[12px] bg-[#FAFAF8] focus:bg-white border border-[#E6E2D8] text-[14px] text-[#12141A] placeholder:text-[#A3A9B6] focus:border-[#FF5A1F] focus:ring-3 focus:ring-[#FF5A1F]/15 focus:outline-none transition-all duration-140"
              />
            </div>

            {/* 2. Deal Value + Live Format + Quick Presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-medium text-[#12141A]">
                  Estimated deal value <span className="text-[#E5484D]">*</span>
                </label>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-[#E4F7EF] text-[12px] font-medium text-[#0A7A53] tabular-nums">
                  {formatINR(numValue)}
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-medium text-[#666C78] pointer-events-none">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={dealValue}
                  onChange={(e) => setDealValue(e.target.value)}
                  className="w-full h-10 pl-8 pr-3.5 rounded-[12px] bg-[#FAFAF8] focus:bg-white border border-[#E6E2D8] text-[14px] font-medium tabular-nums text-[#12141A] focus:border-[#FF5A1F] focus:ring-3 focus:ring-[#FF5A1F]/15 focus:outline-none transition-all duration-140"
                />
              </div>

              {/* Quick preset chips */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[11px] font-medium text-[#666C78] mr-1">
                  Presets:
                </span>
                {PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setDealValue(p.value.toString())}
                    className={cn(
                      "px-2.5 py-1 text-[11.5px] font-medium rounded-[8px] border transition-all duration-140 cursor-pointer tabular-nums active:scale-[0.96]",
                      numValue === p.value
                        ? "bg-[#12141A] text-white border-[#12141A] shadow-xs"
                        : "bg-[#FAFAF8] text-[#454B57] border-[#E6E2D8] hover:bg-[#EFEDE7] hover:text-[#12141A]"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Visual Stage Selector */}
            <div>
              <label className="text-[13px] font-medium text-[#12141A] block mb-1.5">
                Pipeline stage <span className="text-[#E5484D]">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STAGES.map((s) => {
                  const isSelected = stage === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStage(s.id)}
                      className={cn(
                        "h-9.5 px-2.5 rounded-[12px] border text-[12.5px] font-medium transition-all duration-140 flex items-center justify-center gap-1.5 cursor-pointer select-none active:scale-[0.97]",
                        isSelected
                          ? cn(s.bgActive, s.borderActive, s.textColor, "shadow-xs ring-1", s.borderActive)
                          : "bg-[#FAFAF8] border-[#E6E2D8] text-[#454B57] hover:bg-[#F2EFE9] hover:text-[#12141A]"
                      )}
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      <span>{s.label}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Contact Details (2 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-medium text-[#12141A] block mb-1.5">
                  Contact name
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A9B6]">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full h-10 pl-9 pr-3 rounded-[12px] bg-[#FAFAF8] focus:bg-white border border-[#E6E2D8] text-[13.5px] text-[#12141A] placeholder:text-[#A3A9B6] focus:border-[#FF5A1F] focus:ring-3 focus:ring-[#FF5A1F]/15 focus:outline-none transition-all duration-140"
                  />
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium text-[#12141A] block mb-1.5">
                  Phone / WhatsApp
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A9B6]">
                    <Phone className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full h-10 pl-9 pr-3 rounded-[12px] bg-[#FAFAF8] focus:bg-white border border-[#E6E2D8] text-[13.5px] text-[#12141A] placeholder:text-[#A3A9B6] focus:border-[#FF5A1F] focus:ring-3 focus:ring-[#FF5A1F]/15 focus:outline-none transition-all duration-140"
                  />
                </div>
              </div>
            </div>

            {/* 5. Notes / Requirements */}
            <div>
              <label className="text-[13px] font-medium text-[#12141A] block mb-1.5">
                Deal requirements & notes
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-[#A3A9B6]">
                  <FileText className="h-4 w-4" />
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Key requirements, fleet size, or decision makers..."
                  className="w-full pl-9 pr-3 py-2 rounded-[12px] bg-[#FAFAF8] focus:bg-white border border-[#E6E2D8] text-[13.5px] text-[#12141A] placeholder:text-[#A3A9B6] focus:border-[#FF5A1F] focus:ring-3 focus:ring-[#FF5A1F]/15 focus:outline-none transition-all duration-140 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions - Fixed bottom */}
          <div className="px-6 py-3.5 bg-[#FAF9F5] border-t border-[#EFEDE7] flex items-center justify-between gap-3 shrink-0">
            <span className="text-[12px] text-[#666C78]">
              Press <kbd className="px-1.5 py-0.5 rounded-[4px] bg-white border border-[#E6E2D8] text-[11px] font-medium text-[#454B57]">Esc</kbd> to dismiss
            </span>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="h-9.5 px-4 rounded-[12px] border border-[#E6E2D8] bg-white text-[#454B57] hover:text-[#12141A] hover:bg-[#F2EFE9] text-[13.5px] font-medium active:scale-[0.97] transition-all duration-140 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary h-9.5 px-4.5 gap-2 text-[13.5px] font-medium active:scale-[0.97] transition-transform duration-140 flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>Create Opportunity</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
