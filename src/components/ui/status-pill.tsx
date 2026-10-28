import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusPillVariants = cva(
  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border select-none transition-colors",
  {
    variants: {
      variant: {
        neutral: "bg-[#EFEDE7] text-[#4B515D] border-[#E4E1D8]",
        success: "bg-[#E6F4EE] text-[#0F7B5A] border-[#C7EADB]",
        warning: "bg-[#FBF0DC] text-[#A8650A] border-[#F5E0B8]",
        danger: "bg-[#FDECEA] text-[#B42318] border-[#F8D0CC]",
        attention: "bg-[#FFF1EA] text-[#C73E0C] border-[#FFE0D2]",
        info: "bg-[#E8EEFD] text-[#2F55D4] border-[#D0DCFA]",
        dark: "bg-[#1B1F29] text-[#A3A9B6] border-[#242A38]",
      },
      size: {
        default: "text-[11px] px-2 py-0.5",
        sm: "text-[10px] px-1.5 py-0.2",
        lg: "text-xs px-2.5 py-1",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "default",
    },
  }
);

export interface StatusPillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusPillVariants> {
  dot?: boolean;
  pulse?: boolean;
  dotColor?: string;
}

export function StatusPill({
  className,
  variant,
  size,
  dot = false,
  pulse = false,
  dotColor,
  children,
  ...props
}: StatusPillProps) {
  const getDotColor = () => {
    if (dotColor) return dotColor;
    switch (variant) {
      case "success":
        return "bg-[#0F7B5A]";
      case "warning":
        return "bg-[#A8650A]";
      case "danger":
        return "bg-[#B42318]";
      case "attention":
        return "bg-[#FF5A1F]";
      case "info":
        return "bg-[#2F55D4]";
      default:
        return "bg-[#6A707C]";
    }
  };

  return (
    <span className={cn(statusPillVariants({ variant, size, className }))} {...props}>
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            getDotColor(),
            pulse && "animate-pulse"
          )}
        />
      )}
      <span>{children}</span>
    </span>
  );
}
