import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusPillVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[13px] font-medium border select-none transition-colors",
  {
    variants: {
      variant: {
        neutral: "bg-[#EFEDE7] text-[#454B57] border-[#E6E2D8]",
        slate: "bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]",
        success: "bg-[#E4F7EF] text-[#0A7A53] border-[#BDECD7]",
        emerald: "bg-[#E4F7EF] text-[#0A7A53] border-[#BDECD7]",
        warning: "bg-[#FFF3D6] text-[#8F5300] border-[#FFE5A3]",
        amber: "bg-[#FFF3D6] text-[#8F5300] border-[#FFE5A3]",
        danger: "bg-[#FFE9EA] text-[#B42336] border-[#FFCCD0]",
        rose: "bg-[#FFE9EA] text-[#B42336] border-[#FFCCD0]",
        attention: "bg-[#FFF1EA] text-[#B93A0A] border-[#FFE2D4]",
        flame: "bg-[#FFF1EA] text-[#B93A0A] border-[#FFE2D4]",
        ultramarine: "bg-[#EAEEFF] text-[#2A3DB5] border-[#D3DCFF]",
        info: "bg-[#EAEEFF] text-[#2A3DB5] border-[#D3DCFF]",
        sky: "bg-[#E3F3FD] text-[#0A6AA3] border-[#BFE3FA]",
        violet: "bg-[#F0EAFF] text-[#5B34C9] border-[#D9C9FF]",
        dark: "bg-[#1B1F29] text-[#F4F5F7] border-[#242A38]",
      },
      size: {
        default: "text-[13px] px-2.5 py-0.5",
        sm: "text-[13px] px-2 py-0.5",
        lg: "text-[14px] px-3 py-1",
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
