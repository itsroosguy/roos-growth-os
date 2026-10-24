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
  const textColor =
    variant === "white"
      ? "#FFFFFF"
      : variant === "dark"
      ? "#0F172A"
      : "#FF7900";

  const orangeColor = "#FF7900";

  if (collapsed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-10 w-10 rounded-xl bg-[#161618] border border-[#232326] text-white font-black tracking-tight",
          className
        )}
        title="ROOS STUDIOX"
      >
        <span className="text-white text-base font-extrabold font-sans">R</span>
        <span className="text-[#FF7900] text-base font-extrabold font-sans">X</span>
      </div>
    );
  }

  // Exact vector wordmark matching the reference image header
  return (
    <div className={cn("flex items-center select-none", className)}>
      <svg
        viewBox="0 0 168 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          size === "sm" ? "h-5 w-auto" : size === "lg" ? "h-8 w-auto" : "h-6.5 w-auto"
        )}
      >
        {/* R */}
        <text
          x="0"
          y="20"
          fill={textColor}
          fontFamily='"Outfit", "Plus Jakarta Sans", -apple-system, sans-serif'
          fontWeight="800"
          fontSize="17"
          letterSpacing="0.08em"
        >
          ROOS
        </text>

        {/* STUDIO */}
        <text
          x="58"
          y="20"
          fill={textColor}
          fontFamily='"Outfit", "Plus Jakarta Sans", -apple-system, sans-serif'
          fontWeight="800"
          fontSize="17"
          letterSpacing="0.08em"
        >
          STUDIO
        </text>

        {/* Stylized Signature X */}
        <g transform="translate(142, 6)">
          <path
            d="M 1.5 1.5 L 14.5 15.5 M 15 1 L 1 16"
            stroke={variant === "white" ? "#FFFFFF" : textColor}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Subtle Orange Accent on X Cross */}
          <circle cx="8" cy="8.5" r="1.6" fill={orangeColor} />
        </g>
      </svg>
    </div>
  );
}
