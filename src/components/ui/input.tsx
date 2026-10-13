import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-foreground-secondary"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            "flex h-11 w-full rounded-xl border border-white/80 bg-white/70 px-3.5 py-2 text-sm text-foreground backdrop-blur-sm transition-all placeholder:text-foreground-muted focus:border-blue-500/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:opacity-50",
            error && "border-rose-400 focus:border-rose-500 focus:ring-rose-400/20",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-xs font-medium text-google-red">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
