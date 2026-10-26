import React from "react";
import { cn } from "@/lib/utils";

interface RoosLogoProps {
  className?: string;
  variant?: "white" | "dark" | "orange";
  size?: "sm" | "md" | "lg";
  collapsed?: boolean;
}

export function RoosLogo({
  className,
  variant = "white",
  size = "md",
  collapsed = false,
}: RoosLogoProps) {
  if (collapsed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-10 w-10 rounded-xl bg-[#161618] border border-[#232326] text-white font-semibold tracking-tight select-none",
          className
        )}
        title="ROOS STUDIOX"
      >
        <span className="text-white text-base font-semibold font-sans">R</span>
        <span className="text-[#FF7900] text-base font-semibold font-sans">X</span>
      </div>
    );
  }

  // Exact logo dimensions (1024x123 aspect ratio ~ 8.32:1)
  // Base website size was ~28px height, 1.3x is ~36px-40px height
  const heightClass =
    size === "sm"
      ? "h-6 sm:h-7"
      : size === "lg"
      ? "h-9 sm:h-10" // ~36-40px (1.3x website scale)
      : "h-7 sm:h-8";

  const filterStyle =
    variant === "white"
      ? "brightness(0) invert(1)"
      : variant === "orange"
      ? "invert(54%) sepia(91%) saturate(2333%) hue-rotate(360deg) brightness(101%) contrast(106%)"
      : "brightness(0)"; // Dark overlay

  return (
    <div className={cn("relative inline-flex items-center select-none", className)}>
      <img
        src="/logo.png"
        alt="ROOS STUDIOX"
        className={cn("w-auto object-contain transition-all duration-200", heightClass)}
        style={{ filter: filterStyle }}
      />
    </div>
  );
}
