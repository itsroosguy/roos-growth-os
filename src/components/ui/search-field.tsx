"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  shortcutHint?: string;
}

export const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ className, value, onChange, onClear, shortcutHint, placeholder = "Search...", ...props }, ref) => {
    return (
      <div className={cn("relative flex items-center w-full", className)}>
        <Search className="absolute left-3 h-4 w-4 text-[#6A707C] pointer-events-none" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="h-9 w-full rounded-[8px] border border-[#E4E1D8] bg-[#EFEDE7] pl-9 pr-9 text-[13px] text-[#12141A] placeholder:text-[#6A707C] focus:border-[#FF5A1F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF5A1F] transition-all duration-140"
          {...props}
        />
        {value && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[#6A707C] hover:text-[#12141A] transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        ) : shortcutHint ? (
          <kbd className="absolute right-2.5 hidden sm:inline-flex items-center rounded border border-[#D2CEC2] bg-white px-1.5 py-0.5 text-[10px] text-[#6A707C]">
            {shortcutHint}
          </kbd>
        ) : null}
      </div>
    );
  }
);
SearchField.displayName = "SearchField";
