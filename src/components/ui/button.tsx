import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-all duration-140 ease-spring active:scale-[0.98] will-change-transform focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF7A1A]/40 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#FF7A1A] text-white hover:bg-[#FF8833] font-medium shadow-xs border border-transparent",
        primary:
          "bg-[#FF7A1A] text-white hover:bg-[#FF8833] font-medium shadow-xs border border-transparent",
        orange:
          "bg-[#FF7A1A] text-white hover:bg-[#FF8833] font-medium shadow-xs border border-transparent",
        orangeSubtle:
          "bg-[#FFF4EC] text-[#FF7A1A] hover:bg-[#FFE8D6] border border-[#FFD8BF] font-medium",
        secondary:
          "bg-white text-[#0D0D0E] hover:bg-[#F4F4F5] border border-[#E4E4E7] font-medium shadow-2xs",
        outline:
          "bg-white text-[#0D0D0E] hover:bg-[#F4F4F5] border border-[#E4E4E7] font-medium shadow-2xs",
        dark:
          "bg-[#0D0D0E] text-white hover:bg-[#18181B] border border-[#27272A] font-medium shadow-xs",
        ghost:
          "text-[#525866] hover:bg-[#F4F4F5] hover:text-[#0D0D0E] active:bg-[#ECECEE] font-medium border border-transparent",
        danger:
          "bg-rose-600 text-white hover:bg-rose-700 font-medium shadow-xs border border-transparent",
        dangerGhost:
          "text-rose-600 hover:bg-rose-50 active:bg-rose-100 font-medium border border-transparent",
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
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin text-current" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
