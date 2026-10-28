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
  className?: string;
}

export function StatStrip({ stats, className }: StatStripProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-4 bg-white rounded-xl border border-[#E4E4E7] divide-y md:divide-y-0 md:divide-x divide-[#E4E4E7] shadow-2xs overflow-hidden",
        className
      )}
    >
      {stats.map((stat) => (
        <div
          key={stat.id}
          className="p-5 flex flex-col justify-between transition-colors hover:bg-[#FAF9F6]/50"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="type-eyebrow text-[#717680] truncate">
              {stat.label}
            </span>
            {stat.change && (
              <span
                className={cn(
                  "text-[11px] font-medium px-1.5 py-0.2 rounded",
                  stat.change.trend === "up" && "text-emerald-700 bg-emerald-50 border border-emerald-200/60",
                  stat.change.trend === "down" && "text-rose-700 bg-rose-50 border border-rose-200/60",
                  stat.change.trend === "neutral" && "text-[#717680] bg-[#F4F4F5] border border-[#E4E4E7]"
                )}
              >
                {stat.change.value}
              </span>
            )}
          </div>

          <div className="mt-3">
            <div className="type-metric text-[#0D0D0E] tracking-tight">
              {stat.value}
            </div>
            {stat.subtext && (
              <p className="text-xs text-[#717680] font-normal mt-1 truncate">
                {stat.subtext}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
