import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusPillVariants = cva(
  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border select-none transition-colors",
  {
    variants: {
      variant: {
        neutral: "bg-[#F4F4F5] text-[#525866] border-[#E4E4E7]",
        success: "bg-emerald-50 text-emerald-800 border-emerald-200",
        warning: "bg-amber-50 text-amber-800 border-amber-200",
        danger: "bg-rose-50 text-rose-800 border-rose-200",
        attention: "bg-[#FFF4EC] text-[#FF7A1A] border-[#FFD8BF]",
        info: "bg-sky-50 text-sky-800 border-sky-200",
        dark: "bg-[#18181B] text-[#D4D4D8] border-[#27272A]",
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
        return "bg-emerald-500";
      case "warning":
        return "bg-amber-500";
      case "danger":
        return "bg-rose-500";
      case "attention":
        return "bg-[#FF7A1A]";
      case "info":
        return "bg-sky-500";
      default:
        return "bg-[#717680]";
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
