"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  MessageSquare,
  Filter,
  CheckSquare,
  Menu,
} from "lucide-react";
import { whatsappStore } from "@/lib/whatsapp/whatsapp-store";

interface MobileBottomNavProps {
  orgSlug: string;
}

export function MobileBottomNav({ orgSlug }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    try {
      const convos = whatsappStore.getConversations(orgSlug);
      const unread = convos.reduce((acc, c) => acc + (c.unread_count || 0), 0);
      setUnreadCount(unread);
    } catch {
      // Ignore
    }
  }, [orgSlug, pathname]);

  const navItems = [
    {
      title: "Overview",
      href: `/app/${orgSlug}/overview`,
      icon: LayoutGrid,
    },
    {
      title: "Inbox",
      href: `/app/${orgSlug}/inbox`,
      icon: MessageSquare,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      title: "Pipeline",
      href: `/app/${orgSlug}/leads`,
      icon: Filter,
    },
    {
      title: "Tasks",
      href: `/app/${orgSlug}/tasks`,
      icon: CheckSquare,
    },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-[60px] bg-[#F7F3EE]/95 backdrop-blur-md border-t border-[#EDE8E0] px-3 flex items-center justify-around shadow-[0_-2px_10px_rgba(11,13,18,0.04)] select-none pb-[env(safe-area-inset-bottom)]"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== `/app/${orgSlug}` && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full py-1 min-w-[56px] text-center transition-colors duration-140 relative",
              isActive
                ? "text-[#FF5A1F]"
                : "text-[#666C78] hover:text-[#12141A]"
            )}
          >
            <div className="relative">
              <Icon className="h-5 w-5" />
              {item.badge !== undefined && (
                <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#FF5A1F] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums shadow-2xs">
                  {item.badge}
                </span>
              )}
            </div>
            <span
              className={cn(
                "text-[10.5px] mt-0.5 tracking-tight font-medium",
                isActive ? "text-[#FF5A1F] font-semibold" : "text-[#666C78]"
              )}
            >
              {item.title}
            </span>
          </Link>
        );
      })}

      {/* Menu / Drawer Toggle */}
      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("roos_toggle_mobile_nav"));
          }
        }}
        className="flex flex-col items-center justify-center flex-1 h-full py-1 min-w-[56px] text-center text-[#666C78] hover:text-[#12141A] transition-colors duration-140 cursor-pointer"
        aria-label="Open full menu"
      >
        <Menu className="h-5 w-5" />
        <span className="text-[10.5px] mt-0.5 tracking-tight font-medium text-[#666C78]">
          Menu
        </span>
      </button>
    </nav>
  );
}
