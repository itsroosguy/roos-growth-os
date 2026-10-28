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
            className="block text-[13px] font-medium text-[#4B515D]"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            "flex h-9 w-full rounded-[8px] border border-[#E4E1D8] bg-[#EFEDE7] px-3 py-1.5 text-[13px] text-[#12141A] transition-all duration-140 placeholder:text-[#6A707C] focus:border-[#FF5A1F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF5A1F] disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[#B42318] focus:border-[#B42318] focus:ring-[#B42318]",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-[12px] font-normal text-[#B42318]">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
