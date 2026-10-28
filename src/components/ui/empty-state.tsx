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
        "flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-[#E4E4E7] p-8 text-center bg-white shadow-2xs select-none",
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FAF9F6] border border-[#E4E4E7] text-[#717680] mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-[#0D0D0E] mb-1">{title}</h3>
      <p className="max-w-xs text-xs text-[#717680] mb-4 font-normal leading-relaxed">
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
