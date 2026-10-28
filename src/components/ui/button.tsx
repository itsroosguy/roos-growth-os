import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-all duration-140 ease-spring active:scale-[0.97] will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7900]/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#FF7900] text-white shadow-xs hover:bg-[#E66D00] font-medium",
        orange:
          "bg-[#FF7900] text-white shadow-xs hover:bg-[#E66D00] font-medium",
        orangeSubtle:
          "bg-[rgba(255,121,0,0.12)] text-[#FF7900] hover:bg-[rgba(255,121,0,0.2)] border border-[rgba(255,121,0,0.25)] font-medium",
        dark:
          "bg-[#121214] text-white hover:bg-[#1A1A1E] border border-[#232326] font-medium shadow-xs",
        secondary:
          "bg-slate-100 text-slate-800 hover:bg-slate-200 hover:text-slate-950 border border-slate-200/80 font-medium",
        outline:
          "border border-[#E5E7EB] bg-white text-slate-800 hover:bg-[#F8F9FA] hover:border-slate-300 hover:text-slate-950 shadow-2xs font-medium",
        ghost:
          "text-slate-600 hover:bg-slate-100 hover:text-slate-950 active:bg-slate-200 font-medium",
        danger:
          "bg-rose-600 text-white hover:bg-rose-700 shadow-xs font-medium",
        dangerGhost:
          "text-rose-600 hover:bg-rose-50 active:bg-rose-100 font-medium",
      },
      size: {
        default: "h-9 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium",
        sm: "h-8 px-2.5 py-1 rounded-md text-xs font-medium",
        lg: "h-10 px-5 py-2 rounded-lg text-sm font-medium",
        icon: "h-8.5 w-8.5 rounded-lg p-0 flex items-center justify-center",
        iconSm: "h-7 w-7 rounded-md p-0 flex items-center justify-center",
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
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-current" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
