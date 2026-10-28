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
            "flex h-10 w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-[#FF7A1A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF7A1A]/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-50 shadow-2xs",
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
