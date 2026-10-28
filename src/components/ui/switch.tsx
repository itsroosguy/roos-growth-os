"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  className,
  id,
}: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-140 ease-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A1F]/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40",
        checked ? "bg-[#FF5A1F]" : "bg-[#D2CEC2]",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-hairline ring-0 transition duration-140 ease-spring",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}
