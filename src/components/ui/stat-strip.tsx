import * as React from "react";
import { cn } from "@/lib/utils";

export interface StatItem {
  id: string;
  label: string;
  value: string | number;
  subtext?: string;
  change?: {
    value: string;
    trend: "up" | "down" | "neutral";
  };
  highlight?: boolean;
}

export interface StatStripProps {
  stats: StatItem[];
  variant?: "strip" | "inline";
  className?: string;
}

export function StatStrip({ stats, variant = "strip", className }: StatStripProps) {
  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-6 gap-y-2 py-2 text-[13px] text-[#4B515D]",
          className
        )}
      >
        {stats.map((stat, idx) => (
          <div key={stat.id} className="flex items-center gap-2">
            {idx > 0 && <span className="text-[#D2CEC2] select-none">•</span>}
            <span className="text-[#6A707C]">{stat.label}:</span>
            <span className="font-medium text-[#12141A] font-variant-numeric tabular-nums">
              {stat.value}
            </span>
            {stat.subtext && (
              <span className="text-[11px] text-[#6A707C]">({stat.subtext})</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-4 bg-white rounded-[14px] border border-[#E4E1D8] divide-y md:divide-y-0 md:divide-x divide-[#E4E1D8] shadow-hairline overflow-hidden",
        className
      )}
    >
      {stats.map((stat) => (
        <div
          key={stat.id}
          className="p-5 flex flex-col justify-between transition-colors hover:bg-[#F6F5F1]/60"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="type-eyebrow text-[#6A707C] truncate">
              {stat.label}
            </span>
            {stat.change && (
              <span
                className={cn(
                  "text-[11px] font-medium px-1.5 py-0.5 rounded-full",
                  stat.change.trend === "up" && "text-[#0F7B5A] bg-[#E6F4EE] border border-[#C7EADB]",
                  stat.change.trend === "down" && "text-[#B42318] bg-[#FDECEA] border border-[#F8D0CC]",
                  stat.change.trend === "neutral" && "text-[#4B515D] bg-[#EFEDE7] border border-[#E4E1D8]"
                )}
              >
                {stat.change.value}
              </span>
            )}
          </div>

          <div className="mt-2.5">
            <div className="text-[26px] font-medium text-[#12141A] tracking-tight font-variant-numeric tabular-nums leading-none">
              {stat.value}
            </div>
            {stat.subtext && (
              <p className="text-[12px] text-[#6A707C] font-normal mt-1.5 truncate">
                {stat.subtext}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
