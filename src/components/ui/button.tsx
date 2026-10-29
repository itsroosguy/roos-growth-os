import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 font-medium transition-all duration-140 ease-spring active:scale-[0.98] will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A1F]/30 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40 select-none cursor-pointer rounded-[12px]",
  {
    variants: {
      variant: {
        default:
          "btn-primary btn-flow text-white font-medium",
        primary:
          "btn-primary btn-flow text-white font-medium",
        orange:
          "btn-primary btn-flow text-white font-medium",
        orangeSubtle:
          "bg-[#FFF1EA] text-[#B93A0A] hover:bg-[#FFE2D4] border border-[#FFE2D4] font-medium",
        secondary:
          "bg-[#FFFFFF] text-[#12141A] hover:bg-[#F5F3ED] border border-[#E6E2D8] font-medium shadow-[0_1px_2px_rgba(11,13,18,0.04)]",
        outline:
          "bg-[#FFFFFF] text-[#12141A] hover:bg-[#F5F3ED] border border-[#E6E2D8] font-medium shadow-[0_1px_2px_rgba(11,13,18,0.04)]",
        ink:
          "bg-[#1B1F29] text-[#F4F5F7] hover:bg-[#12151C] border border-[#242A38] font-medium shadow-[0_1px_2px_rgba(11,13,18,0.04)]",
        dark:
          "bg-[#0B0D12] text-[#F4F5F7] hover:bg-[#1B1F29] border border-[#242A38] font-medium shadow-[0_1px_2px_rgba(11,13,18,0.04)]",
        ghost:
          "bg-transparent text-[#454B57] hover:bg-[#EFEDE7] hover:text-[#12141A] active:bg-[#E6E2D8] border border-transparent font-medium",
        danger:
          "bg-[#E5484D] text-white hover:bg-[#CF2F36] border border-transparent font-medium shadow-[0_1px_2px_rgba(11,13,18,0.04)]",
        dangerGhost:
          "bg-transparent text-[#B42336] hover:bg-[#FFE9EA] active:bg-[#FED7DA] border border-transparent font-medium",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-[12px] text-[14px] font-medium",
        sm: "h-8.5 px-3 py-1.5 rounded-[10px] text-[14px] font-medium",
        lg: "h-11 px-5 py-2.5 rounded-[14px] text-[15px] font-medium",
        icon: "h-10 w-10 rounded-[12px] p-0 flex items-center justify-center",
        iconSm: "h-8.5 w-8.5 rounded-[10px] p-0 flex items-center justify-center",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading = false, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin text-current" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
