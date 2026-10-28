import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[260px] flex-col items-center justify-center rounded-[14px] border border-[#E4E1D8] p-8 text-center bg-white shadow-hairline select-none",
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EFEDE7] text-[#4B515D] mb-3.5">
        {icon}
      </div>
      <h3 className="text-[15px] font-medium text-[#12141A] mb-1">{title}</h3>
      <p className="max-w-sm text-[13px] text-[#4B515D] mb-4.5 font-normal leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
