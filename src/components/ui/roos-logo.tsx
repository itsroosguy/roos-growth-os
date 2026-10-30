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
        key="roos-logo-mark"
        className={cn(
          "flex items-center justify-center h-10 w-10 rounded-[14px] bg-[#121214] border border-[#27272A] shadow-[0_2px_8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] select-none p-2 group hover:border-[#FF5A1F]/50 transition-colors cursor-pointer shrink-0 will-change-transform",
          className
        )}
        title="ROOS STUDIOX"
      >
        <img
          src="/mark.png"
          alt="ROOS STUDIOX"
          className="h-full w-full object-contain drop-shadow-[0_0_8px_rgba(255,90,31,0.35)] transition-transform duration-160 group-hover:scale-105"
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
  // Adjusted for sleek horizontal alignment with generous breathing room alongside sidebar chevron
  const heightClass =
    size === "sm"
      ? "h-4"
      : size === "lg"
      ? "h-7 sm:h-8"
      : "h-[18px] sm:h-[19px]";

  const filterStyle =
    variant === "white"
      ? "brightness(0) invert(1)"
      : variant === "orange"
      ? "invert(54%) sepia(91%) saturate(2333%) hue-rotate(360deg) brightness(101%) contrast(106%)"
      : "brightness(0)"; // Dark overlay

  return (
    <div key="roos-logo-expanded" className={cn("relative inline-flex items-center select-none shrink-0", className)}>
      <img
        src="/logo.png"
        alt="ROOS STUDIOX"
        className={cn("w-auto object-contain shrink-0", heightClass)}
        style={{ filter: filterStyle, maxWidth: "158px", maxHeight: "20px" }}
      />
    </div>
  );
}
