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
  description = "This section contains enterprise configuration and API management tools that require elevated clearance.",
  requiredRole = "Admin or Owner",
  onUpgradeOrContact,
  actionLabel = "Request Clearance",
  className,
}: RestrictedStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[340px] flex-col items-center justify-center rounded-xl border border-[#E4E4E7] bg-white p-8 text-center shadow-2xs select-none",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FAF9F6] border border-[#E4E4E7] text-[#0D0D0E] mb-3.5 shadow-2xs">
        <Lock className="h-5 w-5 text-[#717680]" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F4F4F5] text-[#525866] border border-[#E4E4E7] mb-2">
        <ShieldAlert className="h-3 w-3 text-[#FF7A1A]" />
        <span>Requires {requiredRole}</span>
      </div>

      <h3 className="text-sm font-medium text-[#0D0D0E] mb-1">{title}</h3>
      <p className="max-w-sm text-xs text-[#717680] mb-5 font-normal leading-relaxed">
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
