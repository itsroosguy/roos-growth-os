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
  Settings,
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
      title: "WhatsApp Configuration",
      href: `/app/${orgSlug}/whatsapp`,
      icon: Smartphone,
    },
    {
      title: "AI Assistant",
      href: `/app/${orgSlug}/settings/ai`,
      icon: Sparkles,
    },
    {
      title: "Integrations & API",
      href: `/app/${orgSlug}/settings/admin`,
      icon: Layers,
    },
    {
      title: "Subscription & Usage",
      href: `/app/${orgSlug}/subscription`,
      icon: CreditCard,
    },
    {
      title: "Organisation Details",
      href: `/app/${orgSlug}/settings`,
      icon: Settings,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#E4E4E7]">
        <div className="flex items-center gap-3">
          <h1 className="type-title text-[#0D0D0E] font-medium tracking-tight">
            {title}
          </h1>
          {badge}
        </div>
        <p className="text-xs text-[#717680] mt-1 font-normal">
          {description}
        </p>
      </div>

      {/* Main 2-Column Grid: Sub-nav (left 220px) + Form column (max 760px) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sub-nav */}
        <aside className="lg:col-span-3 space-y-1">
          <div className="type-eyebrow text-[#717680] px-2 py-1 mb-1">
            Settings Menu
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
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors duration-140 select-none",
                  isActive
                    ? "bg-[#0D0D0E] text-white font-medium shadow-2xs"
                    : "text-[#525866] hover:text-[#0D0D0E] hover:bg-white"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-[#FF7A1A]" : "text-[#717680]"
                  )}
                />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}
        </aside>

        {/* Right Form Column */}
        <main className="lg:col-span-9 max-w-[760px] space-y-6">
          {children}

          {/* Sticky Save Bar */}
          {showSaveBar && (
            <div className="sticky bottom-4 z-20 flex items-center justify-between p-3.5 rounded-xl bg-[#0D0D0E] text-white border border-[#27272A] shadow-dropdown animate-reveal">
              <span className="text-xs text-[#D4D4D8]">
                You have unsaved changes in this configuration.
              </span>
              <div className="flex items-center gap-2">
                {onReset && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    className="text-[#D4D4D8] hover:text-white hover:bg-[#18181B]"
                  >
                    Reset
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={onSave}
                  isLoading={isSaving}
                  className="bg-[#FF7A1A] hover:bg-[#FF8833] text-white"
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
