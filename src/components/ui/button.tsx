import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-all duration-140 ease-spring active:scale-[0.98] will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A1F]/30 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#FF5A1F] text-white hover:bg-[#FF6D38] border border-transparent font-medium shadow-hairline",
        primary:
          "bg-[#FF5A1F] text-white hover:bg-[#FF6D38] border border-transparent font-medium shadow-hairline",
        orange:
          "bg-[#FF5A1F] text-white hover:bg-[#FF6D38] border border-transparent font-medium shadow-hairline",
        orangeSubtle:
          "bg-[#FFF1EA] text-[#C73E0C] hover:bg-[#FFE0D2] border border-[#FFE0D2] font-medium",
        secondary:
          "bg-[#FFFFFF] text-[#12141A] hover:bg-[#EFEDE7] border border-[#E4E1D8] font-medium shadow-hairline",
        outline:
          "bg-[#FFFFFF] text-[#12141A] hover:bg-[#EFEDE7] border border-[#E4E1D8] font-medium shadow-hairline",
        ink:
          "bg-[#1B1F29] text-[#F4F5F7] hover:bg-[#12151C] border border-[#242A38] font-medium shadow-hairline",
        dark:
          "bg-[#0B0D12] text-[#F4F5F7] hover:bg-[#1B1F29] border border-[#242A38] font-medium shadow-hairline",
        ghost:
          "bg-transparent text-[#4B515D] hover:bg-[#EFEDE7] hover:text-[#12141A] active:bg-[#E4E1D8] border border-transparent font-medium",
        danger:
          "bg-[#B42318] text-white hover:bg-[#912018] border border-transparent font-medium shadow-hairline",
        dangerGhost:
          "bg-transparent text-[#B42318] hover:bg-[#FDECEA] active:bg-[#FCD8D4] border border-transparent font-medium",
      },
      size: {
        default: "h-9 px-3.5 py-1.5 rounded-[8px] text-[13px] font-medium",
        sm: "h-7.5 px-2.5 py-1 rounded-[6px] text-[12px] font-medium",
        lg: "h-10 px-4 py-2 rounded-[8px] text-[14px] font-medium",
        icon: "h-9 w-9 rounded-[8px] p-0 flex items-center justify-center",
        iconSm: "h-7.5 w-7.5 rounded-[6px] p-0 flex items-center justify-center",
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
