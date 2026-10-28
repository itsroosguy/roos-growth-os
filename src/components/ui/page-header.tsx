import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  contextLine?: string | React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  contextLine,
  action,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 pb-6 sm:flex-row sm:items-center sm:justify-between border-b border-[#E4E1D8] mb-6",
        className
      )}
    >
      <div>
        <h1 className="text-[28px] sm:text-[30px] font-medium leading-[34px] tracking-[-0.02em] text-[#12141A]">
          {title}
        </h1>
        {contextLine && (
          <p className="mt-1 text-[13px] font-normal leading-[18px] text-[#4B515D]">
            {contextLine}
          </p>
        )}
      </div>

      {(action || children) && (
        <div className="flex items-center gap-2.5 shrink-0">
          {children}
          {action}
        </div>
      )}
    </div>
  );
}
