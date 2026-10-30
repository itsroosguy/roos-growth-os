"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, Award, ArrowUpRight, Zap, AlertCircle } from "lucide-react";
import { PipelineStageItem } from "./funnel-circle-map";

interface GrowingGraphProps {
  id?: string;
  stages: PipelineStageItem[];
  overallWinRate: string; // "28%"
  wonRevenue: string; // "₹4,50,000"
  timeRangeLabel?: string;
}

export function GrowingGraph({
  id = "growing-graph-chart",
  stages,
  overallWinRate = "28%",
  wonRevenue = "₹4,50,000",
  timeRangeLabel = "30 days",
}: GrowingGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  // Trajectory points for the growth curve across stages:
  // SVG ViewBox: 0 0 640 240
  // Left padding: 48, Right padding: 48, Top: 36, Bottom: 48
  // Plotting width = 640 - 96 = 544. Step = 544 / 4 = 136.
  // Values:
  // Lead: 100% (₹12,40,000)
  // Contacted: 74% (₹9,80,000)
  // Qualified: 52% (₹7,20,000)
  // Proposal: 42% (₹5,60,000)
  // Won: 28% (₹4,50,000)
  //
  // For an upward GROWING graph (accumulating won conversion momentum & deal progression):
  // Let's plot the upward growth progression of closed deals & pipeline maturity!
  // Normalized Y (0 = top / ₹14L, 200 = bottom / ₹0)
  const chartHeight = 170;
  const chartTop = 32;
  const chartBottom = chartTop + chartHeight; // 202
  const leftX = 54;
  const plotWidth = 532;
  const stepX = plotWidth / (stages.length - 1);

  // Map each stage to an upward climbing growth curve of realized value & pipeline maturity:
  // We plot two curves:
  // 1. Upward Growth Trajectory (realized won revenue & closed deals curve: ₹0 -> ₹1.1L -> ₹2.3L -> ₹3.5L -> ₹4.5L Won)
  // 2. Stage Volume Points: each stage positioned with its proportional height and conversion efficiency
  const points = stages.map((st, i) => {
    const x = leftX + i * stepX;
    // Realized cumulative growth curve climbing upward to won revenue
    // Index 0 (Inbound baseline): 180 (low)
    // Index 1 (Contacted): 148
    // Index 2 (Qualified): 112
    // Index 3 (Proposal): 76
    // Index 4 (Deals Won): 44 (peak growth!)
    const growthYValues = [182, 146, 110, 74, 42];
    const y = growthYValues[i] || 100;

    return {
      ...st,
      index: i,
      x,
      y,
    };
  });

  // Construct smooth cubic bezier SVG path string
  // d="M x0 y0 C cp1x cp1y, cp2x cp2y, x1 y1 ..."
  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp1y = p0.y;
    const cp2x = p0.x + (p1.x - p0.x) / 2;
    const cp2y = p1.y;
    linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }

  // Area fill path closing to bottom axis
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartBottom} L ${points[0].x} ${chartBottom} Z`;

  const activeStage = hoveredNode !== null ? points[hoveredNode] : points[points.length - 1];

  return (
    <div className="pt-2 animate-fade-rise space-y-4">
      {/* 1. GROWTH PERFORMANCE STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-[14px] bg-[#F7F5F0] border border-[#EDE8E0]">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#666C78] uppercase tracking-wider">
            <Award className="h-3 w-3 text-[#12B886]" />
            <span>Won Deals Growth</span>
          </div>
          <div className="text-[18px] font-semibold text-[#12141A] tracking-tight tabular-nums">
            {wonRevenue}
          </div>
          <div className="flex items-center gap-1 text-[11.5px] font-medium text-[#0A7A53]">
            <TrendingUp className="h-3 w-3" />
            <span>+{overallWinRate} Conversion</span>
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#666C78] uppercase tracking-wider">
            <Zap className="h-3 w-3 text-[#FF5A1F]" />
            <span>Pipeline Velocity</span>
          </div>
          <div className="text-[18px] font-semibold text-[#12141A] tracking-tight tabular-nums">
            ₹12,40,000
          </div>
          <div className="text-[11.5px] font-medium text-[#666C78]">
            Total generated
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#666C78] uppercase tracking-wider">
            <ArrowUpRight className="h-3 w-3 text-[#3D5AFE]" />
            <span>Active Momentum</span>
          </div>
          <div className="text-[18px] font-semibold text-[#12141A] tracking-tight tabular-nums">
            ₹7,90,000
          </div>
          <div className="text-[11.5px] font-medium text-[#3D5AFE]">
            Contacted &amp; Qualified
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#666C78] uppercase tracking-wider">
            <AlertCircle className="h-3 w-3 text-[#F5A524]" />
            <span>Primary Drop-off</span>
          </div>
          <div className="text-[18px] font-semibold text-[#B93A0A] tracking-tight tabular-nums">
            -22% Qualification
          </div>
          <div className="text-[11.5px] font-medium text-[#8C93A3]">
            Before Proposal Sent
          </div>
        </div>
      </div>

      {/* 2. UPWARD GROWING GRAPH SVG CHART */}
      <div className="p-4 rounded-[16px] bg-white border border-[#EDE8E0] shadow-2xs relative">
        {/* Top Graph Header: Active Milestone Readout */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE4] text-[13px]">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: activeStage.color }}
            />
            <span className="font-semibold text-[#12141A]">
              {activeStage.stage}
            </span>
            <span className="text-[11.5px] text-[#666C78] font-normal">
              Stage Milestone {activeStage.index + 1} of 5
            </span>
          </div>

          <div className="flex items-center gap-3 tabular-nums">
            <span className="font-semibold text-[#12141A] text-[14px]">
              {activeStage.val}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#F0ECE4] text-[#12141A] font-semibold text-[11.5px]">
              {activeStage.pct} Conversion
            </span>
            {activeStage.dropOff && (
              <span className="px-2 py-0.5 rounded-full bg-[#FFE9EA] text-[#B93A0A] font-medium text-[11.5px]">
                {activeStage.dropOff} drop
              </span>
            )}
          </div>
        </div>

        {/* SVG Growing Curve */}
        <div className="pt-2">
          <svg
            id={id}
            className="w-full h-56 sm:h-64"
            viewBox="0 0 640 240"
            fill="none"
            style={{ overflow: "visible" }}
          >
            <defs>
              {/* Roos Flame Growth Gradient */}
              <linearGradient id="growthGradArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#12B886" stopOpacity="0.32" />
                <stop offset="45%" stopColor="#3D5AFE" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#FF5A1F" stopOpacity="0.02" />
              </linearGradient>

              {/* Glowing Line Stroke Gradient */}
              <linearGradient id="growthLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6C7690" />
                <stop offset="25%" stopColor="#3D5AFE" />
                <stop offset="50%" stopColor="#4F46E5" />
                <stop offset="75%" stopColor="#F5A524" />
                <stop offset="100%" stopColor="#12B886" />
              </linearGradient>

              <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Horizontal Grid Lines */}
            {[
              { val: "₹12L", y: 42 },
              { val: "₹8L", y: 95 },
              { val: "₹4L", y: 148 },
              { val: "₹0", y: 202 },
            ].map((grid) => (
              <g key={grid.val}>
                <line
                  x1={leftX - 10}
                  y1={grid.y}
                  x2={leftX + plotWidth + 10}
                  y2={grid.y}
                  stroke="#F0ECE4"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={leftX - 16}
                  y={grid.y + 3.5}
                  textAnchor="end"
                  fill="#8C93A3"
                  fontSize="10"
                  fontFamily="Google Sans"
                  fontWeight="500"
                >
                  {grid.val}
                </text>
              </g>
            ))}

            {/* Area Fill */}
            <path
              d={areaPath}
              fill="url(#growthGradArea)"
              className="animate-fade-rise"
            />

            {/* Upward Growing Spline Line */}
            <path
              d={linePath}
              stroke="url(#growthLineGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              filter="url(#glowFilter)"
              className="transition-all duration-300"
            />

            {/* Stage Milestone Vertical Guide on Hover */}
            {hoveredNode !== null && (
              <line
                x1={points[hoveredNode].x}
                y1={chartTop}
                x2={points[hoveredNode].x}
                y2={chartBottom}
                stroke="#666C78"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.6"
              />
            )}

            {/* Interactive Milestone Nodes */}
            {points.map((pt) => {
              const isHovered = hoveredNode === pt.index;

              return (
                <g
                  key={pt.stage}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredNode(pt.index)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Outer Pulsing Glow on Hover */}
                  {isHovered && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="14"
                      fill={pt.color}
                      opacity="0.22"
                      className="animate-ping"
                      style={{ animationDuration: "1.6s" }}
                    />
                  )}

                  {/* Node Outer Ring */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? "8" : "6"}
                    fill="#FFFFFF"
                    stroke={pt.color}
                    strokeWidth={isHovered ? "3.5" : "2.5"}
                    style={{
                      transition:
                        "r 180ms cubic-bezier(0.34, 1.56, 0.64, 1), stroke-width 180ms ease",
                    }}
                  />

                  {/* Inner Center Dot */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? "3.5" : "2"}
                    fill={pt.color}
                  />

                  {/* Bottom Stage Label */}
                  <text
                    x={pt.x}
                    y={chartBottom + 20}
                    textAnchor="middle"
                    fill={isHovered ? "#12141A" : "#666C78"}
                    fontSize="11"
                    fontFamily="Google Sans"
                    fontWeight={isHovered ? "600" : "500"}
                  >
                    {pt.stage}
                  </text>

                  {/* Conversion Pct Label */}
                  <text
                    x={pt.x}
                    y={chartBottom + 34}
                    textAnchor="middle"
                    fill={pt.color}
                    fontSize="10"
                    fontFamily="Google Sans"
                    fontWeight="600"
                  >
                    {pt.pct}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Footer Subtext */}
        <div className="pt-3 border-t border-[#F0ECE4] flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11.5px] text-[#8C93A3] gap-1">
          <span>
            Upward conversion trajectory • Realized deals progress from ₹1.24M inquiry baseline to ₹450K closed won
          </span>
          <span className="font-medium text-[#12B886]">
            +28% Net Win Rate ({timeRangeLabel})
          </span>
        </div>
      </div>
    </div>
  );
}
