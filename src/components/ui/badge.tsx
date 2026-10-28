import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        default: "bg-[#F4F4F5] text-[#525866] border border-[#E4E4E7]",
        orange: "bg-[#FF7A1A] text-white",
        orangeSubtle: "bg-[#FFF4EC] text-[#FF7A1A] border border-[#FFD8BF]",
        dark: "bg-[#18181B] text-[#D4D4D8] border border-[#27272A]",
        success: "bg-emerald-50 text-emerald-800 border border-emerald-200",
        warning: "bg-amber-50 text-amber-800 border border-amber-200",
        danger: "bg-rose-50 text-rose-800 border border-rose-200",
        purple: "bg-purple-50 text-purple-800 border border-purple-200",
        neutral: "bg-[#F4F4F5] text-[#525866] border border-[#E4E4E7]",
        secondary: "bg-[#F4F4F5] text-[#717680] border border-[#E4E4E7]",
        outline: "border border-[#E4E4E7] text-[#525866] bg-white",
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
