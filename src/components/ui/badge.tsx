import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors select-none",
  {
    variants: {
      variant: {
        default: "bg-blue-50 text-blue-700 border border-blue-200/80 font-bold",
        orange: "bg-[#FF7900] text-white font-bold",
        orangeSubtle: "bg-[rgba(255,121,0,0.12)] text-[#FF7900] border border-[rgba(255,121,0,0.25)] font-bold",
        dark: "bg-[#1A1A1E] text-slate-200 border border-[#27272A] font-semibold",
        success: "bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold",
        warning: "bg-amber-50 text-amber-700 border border-amber-200/80 font-bold",
        danger: "bg-rose-50 text-rose-700 border border-rose-200/80 font-bold",
        purple: "bg-purple-50 text-purple-700 border border-purple-200/80 font-bold",
        neutral: "bg-slate-100 text-slate-700 border border-slate-200 font-semibold",
        secondary: "bg-[#F7F7F8] text-[#8E8E93] border border-[#E5E5E7] font-medium",
        outline: "border border-slate-200 text-slate-700 bg-white font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
