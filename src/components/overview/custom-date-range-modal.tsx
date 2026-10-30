"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import {
  Calendar,
  X,
  Check,
  ArrowRight,
  ArrowUpDown,
  CalendarRange,
  Sparkles,
} from "lucide-react";

export type SortCriterion = "date_desc" | "date_asc" | "value_desc" | "value_asc";

interface CustomDateRangeModalProps {
  open: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  sortBy: SortCriterion;
  onApply: (start: string, end: string, sort: SortCriterion) => void;
  dealsCount?: number;
  dealsValue?: number;
}

export function CustomDateRangeModal({
  open,
  onClose,
  startDate,
  endDate,
  sortBy,
  onApply,
  dealsCount = 0,
  dealsValue = 0,
}: CustomDateRangeModalProps) {
  const [mounted, setMounted] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const [tempSort, setTempSort] = useState<SortCriterion>(sortBy);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setTempStart(startDate);
      setTempEnd(endDate);
      setTempSort(sortBy);
    }
  }, [open, startDate, endDate, sortBy]);

  // Quick preset handlers
  const handlePreset = (type: "7d" | "14d" | "30d" | "this_month" | "last_month" | "ytd") => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (type === "7d") {
      const d = new Date(now.getTime() - 7 * 86400000);
      setTempStart(d.toISOString().slice(0, 10));
      setTempEnd(todayStr);
    } else if (type === "14d") {
      const d = new Date(now.getTime() - 14 * 86400000);
      setTempStart(d.toISOString().slice(0, 10));
      setTempEnd(todayStr);
    } else if (type === "30d") {
      const d = new Date(now.getTime() - 30 * 86400000);
      setTempStart(d.toISOString().slice(0, 10));
      setTempEnd(todayStr);
    } else if (type === "this_month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setTempStart(start.toISOString().slice(0, 10));
      setTempEnd(todayStr);
    } else if (type === "last_month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setTempStart(start.toISOString().slice(0, 10));
      setTempEnd(end.toISOString().slice(0, 10));
    } else if (type === "ytd") {
      const start = new Date(now.getFullYear(), 0, 1);
      setTempStart(start.toISOString().slice(0, 10));
      setTempEnd(todayStr);
    }
  };

  const handleApply = () => {
    if (tempStart && tempEnd) {
      onApply(tempStart, tempEnd, tempSort);
      onClose();
    }
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
      {/* Modal Dialog Content */}
      <div className="relative z-10 w-full max-w-lg rounded-[18px] border border-[#EDE8E0] bg-white p-6 shadow-2xl animate-page-enter">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full text-[#666C78] hover:text-[#12141A] hover:bg-[#F7F5F0] transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-[#F0ECE4]">
          <div className="h-10 w-10 rounded-[12px] bg-[#FFF1EA] text-[#FF5A1F] flex items-center justify-center shadow-2xs">
            <CalendarRange className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[17px] font-semibold text-[#12141A]">
              Custom Date Range &amp; Sort
            </h3>
            <p className="text-[12.5px] text-[#666C78] mt-0.5">
              Filter commercial opportunities and sort pipeline deals by your custom boundaries.
            </p>
          </div>
        </div>

        {/* Presets Strip */}
        <div className="space-y-2 mb-4">
          <label className="text-[11.5px] font-semibold text-[#666C78] uppercase tracking-wider block">
            Quick Range Presets
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "7d", label: "Last 7 Days" },
              { id: "14d", label: "Last 14 Days" },
              { id: "30d", label: "Last 30 Days" },
              { id: "this_month", label: "This Month" },
              { id: "last_month", label: "Last Month" },
              { id: "ytd", label: "Year to Date" },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePreset(preset.id as any)}
                className="px-2.5 py-1 rounded-[8px] border border-[#EDE8E0] bg-[#F7F5F0] hover:bg-white text-[12px] font-medium text-[#454B57] hover:text-[#12141A] transition-colors cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#12141A] block">
              Start Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={tempStart}
                onChange={(e) => setTempStart(e.target.value)}
                className="w-full h-10 px-3 rounded-[10px] border border-[#EDE8E0] bg-white text-[13.5px] text-[#12141A] focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/30 focus:border-[#FF5A1F] transition-all cursor-pointer font-sans"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#12141A] block">
              End Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={tempEnd}
                onChange={(e) => setTempEnd(e.target.value)}
                className="w-full h-10 px-3 rounded-[10px] border border-[#EDE8E0] bg-white text-[13.5px] text-[#12141A] focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/30 focus:border-[#FF5A1F] transition-all cursor-pointer font-sans"
              />
            </div>
          </div>
        </div>

        {/* Sort Options */}
        <div className="space-y-2 mb-6">
          <label className="text-[11.5px] font-semibold text-[#666C78] uppercase tracking-wider block">
            Sort Data By
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "date_desc", label: "Newest First", sub: "Most recent activity" },
              { id: "date_asc", label: "Oldest First", sub: "Earliest records" },
              { id: "value_desc", label: "Highest Value", sub: "Largest deal size" },
              { id: "value_asc", label: "Lowest Value", sub: "Smallest deal size" },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setTempSort(option.id as SortCriterion)}
                className={cn(
                  "p-2.5 rounded-[10px] border text-left transition-colors cursor-pointer flex flex-col justify-between",
                  tempSort === option.id
                    ? "bg-[#0B0D12] border-[#0B0D12] text-white"
                    : "bg-[#FAFAF9] border-[#EDE8E0] text-[#12141A] hover:bg-white"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[12.5px] font-semibold">
                    {option.label}
                  </span>
                  {tempSort === option.id && (
                    <Check className="h-3.5 w-3.5 text-white shrink-0" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[11px] mt-0.5",
                    tempSort === option.id ? "text-[#A3A9B6]" : "text-[#8C93A3]"
                  )}
                >
                  {option.sub}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0ECE4]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-[10px] border border-[#EDE8E0] bg-white hover:bg-[#F7F5F0] text-[#454B57] text-[13px] font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 rounded-[10px] bg-gradient-to-b from-[#FF7A3D] to-[#FF5A1F] text-white text-[13px] font-medium shadow-xs hover:opacity-95 transition-opacity cursor-pointer flex items-center gap-1.5"
          >
            <Check className="h-4 w-4" />
            <span>Apply Range &amp; Sort</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
