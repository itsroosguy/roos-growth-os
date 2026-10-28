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
          "flex items-center justify-center h-10 w-10 rounded-xl bg-[#161618] border border-[#232326] shadow-xs select-none p-2 group hover:border-[#FF7A1A]/40 transition-all",
          className
        )}
        title="ROOS STUDIOX"
      >
        <img
          src="/mark.png"
          alt="ROOS STUDIOX"
          className="h-full w-full object-contain drop-shadow-[0_0_8px_rgba(255,121,0,0.3)] transition-transform duration-200 group-hover:scale-105"
          style={{
            filter:
              variant === "orange"
                ? "invert(54%) sepia(91%) saturate(2333%) hue-rotate(360deg) brightness(101%) contrast(106%)"
                : "brightness(0) invert(1)",
          }}
        />
      </div>
    );
  }

  // Exact logo dimensions (1024x123 aspect ratio ~ 8.32:1)
  // Adjusted for sleek horizontal alignment alongside sidebar chevron
  const heightClass =
    size === "sm"
      ? "h-5 sm:h-5.5"
      : size === "lg"
      ? "h-8 sm:h-9"
      : "h-6 sm:h-6.5";

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
