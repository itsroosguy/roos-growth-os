import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-google-blue text-white shadow-xs hover:bg-google-blue-hover active:scale-[0.98] font-semibold",
        secondary:
          "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/80 active:scale-[0.98] font-medium",
        outline:
          "border border-border bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 active:scale-[0.98] shadow-2xs",
        ghost:
          "text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200",
        danger:
          "bg-google-red text-white hover:bg-google-red-hover active:scale-[0.98] shadow-xs",
        dangerGhost:
          "text-google-red hover:bg-red-50 active:bg-red-100",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-xl text-sm font-medium",
        sm: "h-8 px-3 py-1 rounded-lg text-xs font-medium",
        lg: "h-12 px-6 py-2.5 rounded-xl text-base font-semibold",
        icon: "h-10 w-10 rounded-xl p-0 flex items-center justify-center",
        iconSm: "h-8 w-8 rounded-lg p-0 flex items-center justify-center",
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
