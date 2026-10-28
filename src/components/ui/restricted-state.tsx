import * as React from "react";
import { Lock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface RestrictedStateProps {
  title?: string;
  description?: string;
  requiredRole?: string;
  onUpgradeOrContact?: () => void;
  actionLabel?: string;
  className?: string;
}

export function RestrictedState({
  title = "Access Restricted",
  description = "This console contains internal system administration tools and webhook diagnostics that require elevated clearance.",
  requiredRole = "Enterprise Owner or Superadmin",
  onUpgradeOrContact,
  actionLabel = "Request Clearance",
  className,
}: RestrictedStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[320px] flex-col items-center justify-center rounded-[14px] border border-[#E4E1D8] bg-white p-8 text-center shadow-hairline select-none",
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EFEDE7] text-[#4B515D] mb-3.5">
        <Lock className="h-5 w-5 text-[#4B515D]" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#EFEDE7] text-[#4B515D] border border-[#E4E1D8] mb-2.5">
        <ShieldAlert className="h-3 w-3 text-[#FF5A1F]" />
        <span>Requires {requiredRole}</span>
      </div>

      <h3 className="text-[15px] font-medium text-[#12141A] mb-1">{title}</h3>
      <p className="max-w-sm text-[13px] text-[#4B515D] mb-5 font-normal leading-relaxed">
        {description}
      </p>

      {onUpgradeOrContact && (
        <Button onClick={onUpgradeOrContact} variant="secondary" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
