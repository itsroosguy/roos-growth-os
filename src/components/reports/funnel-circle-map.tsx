"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { TrendingDown, Award } from "lucide-react";

export interface PipelineStageItem {
  stage: string;
  count: number;
  pct: string; // "100%", "74%", etc.
  pctNum: number; // 100, 74, etc.
  val: string; // "₹12,40,000"
  color: string;
  dropOff?: string; // "-26% drop"
  note?: string;
}

interface FunnelCircleMapProps {
  id?: string;
  stages: PipelineStageItem[];
  overallWinRate: string; // "28%"
  wonRevenue: string; // "₹4,50,000"
  viewMode: "circle" | "bars";
}

export function FunnelCircleMap({
  id = "funnel-dynamics-circle",
  stages,
  overallWinRate = "28%",
  wonRevenue = "₹4,50,000",
  viewMode,
}: FunnelCircleMapProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 5 concentric sweeping rings
  const ringRadii = [84, 71, 58, 45, 32];
  const ringStroke = 7;

  const rings = stages.map((stage, idx) => {
    const r = ringRadii[idx] || 32;
    const circ = 2 * Math.PI * r;
    const arcLen = (stage.pctNum / 100) * circ;
    return {
      ...stage,
      index: idx,
      r,
      circ,
      arcLen,
    };
  });

  const activeStage = hoveredIndex !== null ? stages[hoveredIndex] : null;

  if (viewMode === "bars") {
    return (
      <div className="space-y-3.5 pt-2 animate-fade-rise">
        {stages.map((step, idx) => (
          <div
            key={step.stage}
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
                  style={{ backgroundColor: step.color }}
                />
                <span className="font-semibold text-[#12141A]">{step.stage}</span>
                {step.dropOff && (
                  <span className="text-[11px] font-medium text-[#E5484D] px-1.5 py-0.5 rounded-full bg-[#FFE9EA]">
                    {step.dropOff}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-[#666C78] tabular-nums">
                <span>{step.val}</span>
                <span className="font-semibold text-[#12141A]">{step.pct}</span>
              </div>
            </div>

            <div className="h-3 w-full rounded-full bg-[#F7F5F0] overflow-hidden border border-[#EDE8E0] mt-2">
              <div
                style={{ width: step.pct, backgroundColor: step.color }}
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* SVG Funnel Multi-Arc Circle Map */}
        <div className="md:col-span-5 flex justify-center py-2">
          <div className="relative w-60 h-60 flex items-center justify-center">
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
                  key={`track-${ring.stage}`}
                  cx="100"
                  cy="100"
                  r={ring.r}
                  fill="none"
                  stroke="#EDE8E0"
                  strokeWidth={ringStroke}
                  opacity="0.65"
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
                    key={`arc-${ring.stage}`}
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

            {/* Central Conversion Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2 select-none">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#666C78] px-2 text-center leading-tight">
                {activeStage ? activeStage.stage : "OVERALL WIN RATE"}
              </span>
              <span className="text-[22px] font-semibold text-[#12141A] tracking-tight mt-0.5 tabular-nums">
                {activeStage ? activeStage.pct : overallWinRate}
              </span>
              <div
                className="flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{
                  backgroundColor: activeStage
                    ? `${activeStage.color}15`
                    : "#E4F7EF",
                  color: activeStage ? activeStage.color : "#0A7A53",
                }}
              >
                <Award className="h-3 w-3 shrink-0" />
                <span>{activeStage ? activeStage.val : wonRevenue}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stage Timeline Breakdown Cards */}
        <div className="md:col-span-7 space-y-2">
          {stages.map((step, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <div
                key={step.stage}
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
                    style={{ backgroundColor: step.color }}
                  />
                  <div className="truncate">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[#12141A] font-semibold text-[13.5px] truncate">
                        {step.stage}
                      </span>
                      {step.dropOff && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#B93A0A] bg-[#FFF1EA] px-1.5 py-0.5 rounded-full shrink-0">
                          <TrendingDown className="h-2.5 w-2.5" />
                          {step.dropOff}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="h-1.5 w-20 rounded-full bg-[#EDE8E0] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: step.pct,
                            backgroundColor: step.color,
                          }}
                        />
                      </div>
                      <span className="text-[11.5px] text-[#8C93A3] font-medium">
                        {step.pct} Conversion
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[14px] font-semibold text-[#12141A] tabular-nums block">
                    {step.val}
                  </span>
                  <span className="text-[11px] text-[#666C78]">deal volume</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
