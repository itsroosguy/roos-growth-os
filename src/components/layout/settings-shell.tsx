"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Smartphone,
  Sparkles,
  Layers,
  CreditCard,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SettingsShellProps {
  orgSlug: string;
  title: string;
  description: string;
  children: React.ReactNode;
  showSaveBar?: boolean;
  isSaving?: boolean;
  onSave?: () => void;
  onReset?: () => void;
  badge?: React.ReactNode;
}

export function SettingsShell({
  orgSlug,
  title,
  description,
  children,
  showSaveBar = false,
  isSaving = false,
  onSave,
  onReset,
  badge,
}: SettingsShellProps) {
  const pathname = usePathname();

  const navItems = [
    {
      title: "WhatsApp API",
      href: `/app/${orgSlug}/whatsapp`,
      icon: Smartphone,
    },
    {
      title: "AI Engine",
      href: `/app/${orgSlug}/settings/ai`,
      icon: Sparkles,
    },
    {
      title: "Integrations",
      href: `/app/${orgSlug}/settings/admin`,
      icon: Layers,
    },
    {
      title: "Subscription & Limits",
      href: `/app/${orgSlug}/subscription`,
      icon: CreditCard,
    },
    {
      title: "Organisation Details",
      href: `/app/${orgSlug}/settings`,
      icon: Building2,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#E6E2D8]">
        <div className="flex items-center gap-3">
          <h1 className="type-display text-[#12141A]">
            {title}
          </h1>
          {badge}
        </div>
        <p className="type-body text-[#454B57] mt-1 font-normal">
          {description}
        </p>
      </div>

      {/* Main 2-Column Grid: Sub-nav (left 220px) + Form column (max 760px) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sub-nav */}
        <aside className="lg:col-span-3 space-y-1">
          <div className="type-eyebrow text-[#666C78] px-3 py-1 mb-1">
            Configuration
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            // Exact route match
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3.5 py-2.5 rounded-[12px] text-[14px] transition-colors duration-140 select-none",
                  isActive
                    ? "bg-[#0B0D12] text-white font-medium shadow-xs"
                    : "text-[#454B57] hover:text-[#12141A] hover:bg-[#F7F5F0]"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-[#FF5A1F]" : "text-[#666C78]"
                  )}
                />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}
        </aside>

        {/* Right Form Column (max-w-[760px]) */}
        <main className="lg:col-span-9 max-w-[760px] space-y-6">
          {children}

          {/* Sticky Save Bar */}
          {showSaveBar && (
            <div className="sticky bottom-4 z-20 flex items-center justify-between p-4 rounded-[20px] bg-[#0B0D12] text-white border border-[#242A38] shadow-[0_12px_36px_-8px_rgba(11,13,18,0.35)] animate-reveal">
              <span className="text-[14px] text-[#A3A9B6]">
                You have unsaved changes in this configuration.
              </span>
              <div className="flex items-center gap-2.5">
                {onReset && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    className="text-[#A3A9B6] hover:text-white hover:bg-[#1B1F29] rounded-[10px] text-[14px] h-9 px-3.5"
                  >
                    Reset
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={onSave}
                  isLoading={isSaving}
                  variant="primary"
                  className="rounded-[10px] text-[14px] h-9 px-4"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
