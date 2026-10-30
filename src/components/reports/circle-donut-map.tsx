"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface ChannelAttributionItem {
  channel: string;
  share: number; // e.g. 64
  shareLabel: string; // e.g. "64%"
  val: string; // e.g. "₹2,88,000"
  color: string;
  badge?: string;
  description?: string;
}

interface CircleDonutMapProps {
  id?: string;
  items: ChannelAttributionItem[];
  totalValue: string;
  viewMode: "circle" | "bars";
}

export function CircleDonutMap({
  id = "revenue-attribution-circle",
  items,
  totalValue,
  viewMode,
}: CircleDonutMapProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const radius = 68;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  // Compute cumulative start angles and stroke dash arrays
  let cumulativePct = 0;
  const segments = items.map((item, index) => {
    const pct = item.share;
    const arcLength = (pct / 100) * circumference;
    const gap = pct > 6 ? 2.5 : 1;
    const effectiveLength = Math.max(0, arcLength - gap);
    const startAngle = -90 + (cumulativePct / 100) * 360;
    cumulativePct += pct;

    return {
      ...item,
      index,
      pct,
      effectiveLength,
      startAngle,
    };
  });

  const activeItem = hoveredIndex !== null ? items[hoveredIndex] : null;

  if (viewMode === "bars") {
    return (
      <div className="space-y-3.5 pt-2 animate-fade-rise">
        {items.map((c, idx) => (
          <div
            key={c.channel}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={cn(
              "p-2.5 rounded-[12px] border transition-colors cursor-pointer",
              hoveredIndex === idx
                ? "bg-[#F7F5F0] border-[#DCD6CC]"
                : "bg-white border-[#EDE8E0]"
            )}
          >
            <div className="flex items-center justify-between text-[13.5px]">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: c.color }}
                />
                <span className="text-[#12141A] font-medium">{c.channel}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#12141A] font-semibold">{c.val}</span>
                <span className="text-[#666C78] tabular-nums font-medium text-[12.5px] px-2 py-0.5 rounded-full bg-[#F0ECE4]">
                  {c.shareLabel}
                </span>
              </div>
            </div>
            <div className="h-2.5 w-full rounded-full bg-[#F0ECE4] overflow-hidden mt-2 border border-[#E4E0D6]">
              <div
                style={{ width: `${c.share}%`, backgroundColor: c.color }}
                className="h-full rounded-full transition-all duration-300"
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="pt-2 animate-fade-rise">
      <div className="flex flex-col xl:flex-row items-center gap-5">
        {/* SVG Circle Map */}
        <div className="w-48 h-48 shrink-0 flex items-center justify-center py-1">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg
              id={id}
              className="w-full h-full transform -rotate-0"
              viewBox="0 0 200 200"
              fill="none"
              style={{ overflow: "visible" }}
            >
              {/* Subtle Ambient Drop Shadow Ring */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#F2EFE9"
                strokeWidth={strokeWidth}
              />

              {/* Segmented Slices */}
              {segments.map((seg) => {
                const isHovered = hoveredIndex === seg.index;
                const isAnyHovered = hoveredIndex !== null;
                const opacity = isHovered ? 1 : isAnyHovered ? 0.45 : 1;
                const sw = isHovered ? strokeWidth + 4 : strokeWidth;

                return (
                  <circle
                    key={seg.channel}
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={sw}
                    strokeDasharray={`${seg.effectiveLength} ${
                      circumference - seg.effectiveLength
                    }`}
                    strokeDashoffset={0}
                    transform={`rotate(${seg.startAngle} 100 100)`}
                    style={{
                      opacity,
                      transition:
                        "stroke-width 180ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 180ms ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={() => setHoveredIndex(seg.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
            </svg>

            {/* Central Information Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2 select-none">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#666C78] px-2 text-center leading-tight">
                {activeItem ? activeItem.channel : "TOTAL WON"}
              </span>
              <span className="text-[19px] font-semibold text-[#12141A] tracking-tight mt-0.5 tabular-nums">
                {activeItem ? activeItem.val : totalValue}
              </span>
              <span
                className="text-[11.5px] font-medium mt-0.5 px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: activeItem ? `${activeItem.color}15` : "#FFF1EA",
                  color: activeItem ? activeItem.color : "#FF5A1F",
                }}
              >
                {activeItem ? `${activeItem.share}% Share` : "100% Attributed"}
              </span>
            </div>
          </div>
        </div>

        {/* Channel Breakdown Cards */}
        <div className="flex-1 w-full min-w-0 space-y-2">
          {items.map((c, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <div
                key={c.channel}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={cn(
                  "p-2.5 rounded-[12px] border transition-colors cursor-pointer group flex items-center justify-between",
                  isHovered
                    ? "bg-[#F7F5F0] border-[#DCD6CC] shadow-2xs"
                    : "bg-white border-[#EDE8E0] hover:bg-[#FAFAF9]"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span
                    className="h-3 w-3 rounded-full shrink-0 transition-transform duration-180 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-125"
                    style={{ backgroundColor: c.color }}
                  />
                  <div className="truncate">
                    <span
                      className="text-[#12141A] font-medium text-[13px] block truncate"
                      title={c.channel}
                    >
                      {c.channel}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="h-1.5 w-16 rounded-full bg-[#EDE8E0] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${c.share}%`,
                            backgroundColor: c.color,
                          }}
                        />
                      </div>
                      <span className="text-[11.5px] text-[#8C93A3]">
                        {c.shareLabel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[13.5px] font-semibold text-[#12141A] tabular-nums block">
                    {c.val}
                  </span>
                  <span className="text-[10.5px] text-[#666C78]">of pipeline</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
