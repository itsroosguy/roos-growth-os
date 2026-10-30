"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export interface SlaTierItem {
  bracket: string;
  share: number; // e.g. 82
  shareLabel: string; // "82%"
  count: string; // "1,164 msgs"
  color: string;
  isWithinSla: boolean;
}

interface ConcentricRadialMapProps {
  id?: string;
  tiers: SlaTierItem[];
  overallSlaRate: string; // "94%"
  viewMode: "circle" | "bars";
}

export function ConcentricRadialMap({
  id = "sla-speed-circle",
  tiers,
  overallSlaRate = "94%",
  viewMode,
}: ConcentricRadialMapProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Concentric circle rings definitions
  const ringRadii = [78, 64, 50, 36];
  const ringStroke = 7.5;

  const rings = tiers.map((tier, idx) => {
    const r = ringRadii[idx] || 36;
    const circ = 2 * Math.PI * r;
    const arcLen = (tier.share / 100) * circ;
    return {
      ...tier,
      index: idx,
      r,
      circ,
      arcLen,
    };
  });

  const activeTier = hoveredIndex !== null ? tiers[hoveredIndex] : null;

  if (viewMode === "bars") {
    return (
      <div className="space-y-3.5 pt-2 animate-fade-rise">
        {tiers.map((b, idx) => (
          <div
            key={b.bracket}
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
                  style={{ backgroundColor: b.color }}
                />
                <span className="text-[#12141A] font-medium">{b.bracket}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#12141A] font-semibold">{b.count}</span>
                <span className="text-[#666C78] tabular-nums font-medium text-[12.5px] px-2 py-0.5 rounded-full bg-[#F0ECE4]">
                  {b.shareLabel}
                </span>
              </div>
            </div>
            <div className="h-2.5 w-full rounded-full bg-[#F0ECE4] overflow-hidden mt-2 border border-[#E4E0D6]">
              <div
                style={{ width: `${b.share}%`, backgroundColor: b.color }}
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
        {/* SVG Concentric Rings */}
        <div className="w-48 h-48 shrink-0 flex items-center justify-center py-1">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg
              id={id}
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 200 200"
              fill="none"
              style={{ overflow: "visible" }}
            >
              {/* Background Circular Tracks */}
              {rings.map((ring) => (
                <circle
                  key={`track-${ring.bracket}`}
                  cx="100"
                  cy="100"
                  r={ring.r}
                  fill="none"
                  stroke="#EDE8E0"
                  strokeWidth={ringStroke}
                  opacity="0.75"
                />
              ))}

              {/* Progress Radial Arcs */}
              {rings.map((ring) => {
                const isHovered = hoveredIndex === ring.index;
                const isAnyHovered = hoveredIndex !== null;
                const opacity = isHovered ? 1 : isAnyHovered ? 0.35 : 1;
                const sw = isHovered ? ringStroke + 3 : ringStroke;

                return (
                  <circle
                    key={`arc-${ring.bracket}`}
                    cx="100"
                    cy="100"
                    r={ring.r}
                    fill="none"
                    stroke={ring.color}
                    strokeWidth={sw}
                    strokeDasharray={`${ring.arcLen} ${ring.circ - ring.arcLen}`}
                    strokeDashoffset={0}
                    strokeLinecap="round"
                    style={{
                      opacity,
                      transition:
                        "stroke-width 180ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 180ms ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={() => setHoveredIndex(ring.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
            </svg>

            {/* Center Speedometer Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2 select-none">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#666C78]">
                {activeTier ? activeTier.bracket : "MET WITHIN 1 HR"}
              </span>
              <span className="text-[20px] font-semibold text-[#12141A] tracking-tight mt-0.5 tabular-nums">
                {activeTier ? activeTier.shareLabel : overallSlaRate}
              </span>
              <div
                className="flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{
                  backgroundColor: activeTier
                    ? `${activeTier.color}15`
                    : "#E4F7EF",
                  color: activeTier ? activeTier.color : "#0A7A53",
                }}
              >
                <CheckCircle2 className="h-3 w-3 shrink-0" />
                <span>{activeTier ? activeTier.count : "Meta SLA Met"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tier Cards Breakdown */}
        <div className="flex-1 w-full min-w-0 space-y-2">
          {tiers.map((b, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <div
                key={b.bracket}
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
                    style={{ backgroundColor: b.color }}
                  />
                  <div className="truncate">
                    <span className="text-[#12141A] font-medium text-[13px] block truncate">
                      {b.bracket}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="h-1.5 w-16 rounded-full bg-[#EDE8E0] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${b.share}%`,
                            backgroundColor: b.color,
                          }}
                        />
                      </div>
                      <span className="text-[11.5px] text-[#8C93A3]">
                        {b.shareLabel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[13.5px] font-semibold text-[#12141A] tabular-nums block">
                    {b.count}
                  </span>
                  <span
                    className={cn(
                      "text-[10.5px] font-medium",
                      b.isWithinSla ? "text-[#12B886]" : "text-[#E5484D]"
                    )}
                  >
                    {b.isWithinSla ? "Within SLA" : "Exceeds SLA"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
