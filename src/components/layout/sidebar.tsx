"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  UserCheck,
  Zap,
  CheckSquare,
  BarChart3,
  Shield,
  Smartphone,
  CreditCard,
  Settings,
  Megaphone,
  FileText,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  ExternalLink,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  orgSlug: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "danger" | "purple" | "neutral";
  section?: string;
}

export function Sidebar({ orgSlug }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Initialize and persist collapsed state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("roos_sidebar_collapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch {
      // Ignore if localStorage unavailable
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("roos_sidebar_collapsed", String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const navItems: NavItem[] = [
    // Core CRM Section
    {
      title: "Overview",
      href: `/app/${orgSlug}/overview`,
      icon: LayoutDashboard,
      section: "Workspace",
    },
    {
      title: "Inbox",
      href: `/app/${orgSlug}/inbox`,
      icon: MessageSquare,
      badge: "Live",
      badgeVariant: "success",
      section: "Workspace",
    },
    {
      title: "Sales Pipeline",
      href: `/app/${orgSlug}/leads`,
      icon: Users,
      section: "Workspace",
    },
    {
      title: "Contacts",
      href: `/app/${orgSlug}/contacts`,
      icon: UserCheck,
      section: "Workspace",
    },
    {
      title: "Tasks & Follow-ups",
      href: `/app/${orgSlug}/tasks`,
      icon: CheckSquare,
      section: "Workspace",
    },

    // Automation & Campaigns
    {
      title: "Campaigns",
      href: `/app/${orgSlug}/campaigns`,
      icon: Megaphone,
      section: "Growth & Automation",
    },
    {
      title: "Templates",
      href: `/app/${orgSlug}/templates`,
      icon: FileText,
      section: "Growth & Automation",
    },
    {
      title: "Automations",
      href: `/app/${orgSlug}/automations`,
      icon: Zap,
      section: "Growth & Automation",
    },
    {
      title: "Reports & Analytics",
      href: `/app/${orgSlug}/reports`,
      icon: BarChart3,
      section: "Growth & Automation",
    },

    // Settings
    {
      title: "Team Members",
      href: `/app/${orgSlug}/team`,
      icon: Shield,
      section: "Configuration",
    },
    {
      title: "WhatsApp API",
      href: `/app/${orgSlug}/whatsapp`,
      icon: Smartphone,
      section: "Configuration",
    },
    {
      title: "AI Co-Pilot",
      href: `/app/${orgSlug}/settings/ai`,
      icon: Sparkles,
      badge: "Beta",
      badgeVariant: "purple",
      section: "Configuration",
    },
    {
      title: "Billing & Usage",
      href: `/app/${orgSlug}/subscription`,
      icon: CreditCard,
      section: "Configuration",
    },
    {
      title: "Settings",
      href: `/app/${orgSlug}/settings`,
      icon: Settings,
      section: "Configuration",
    },
  ];

  const sidebarContent = (
    <div
      className={cn(
        "flex h-full flex-col justify-between bg-white/65 backdrop-blur-2xl border-r border-white/70 transition-all duration-300 ease-in-out shadow-[0_14px_44px_-8px_rgba(15,23,42,0.06)]",
        collapsed ? "w-20 px-2.5 py-4" : "w-64 p-4"
      )}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Header */}
        <div
          className={cn(
            "flex items-center pb-5 border-b border-white/60",
            collapsed ? "justify-center" : "justify-between px-2"
          )}
        >
          <Link
            href={`/app/${orgSlug}/overview`}
            className="flex items-center gap-3 overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl"
            title="Roos StudioX Growth OS"
          >
            {/* Iconic Studio Badge */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FF7A1A] to-[#FF944D] text-white font-extrabold shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <span className="font-extrabold text-sm tracking-tight">RX</span>
            </div>

            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                  ROOS <span className="text-[#FF7A1A]">STUDIOX</span>
                </span>
                <span className="text-[10px] font-medium text-slate-500 tracking-wide uppercase truncate">
                  Growth Operating System
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation list */}
        <nav
          className="flex-1 overflow-y-auto space-y-1.5 py-4 pr-1 -mr-1"
          aria-label="Sidebar Navigation"
        >
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive =
              item.href === `/app/${orgSlug}/overview`
                ? pathname === item.href
                : pathname.startsWith(item.href);

            const showSectionHeader =
              !collapsed &&
              (index === 0 ||
                item.section !== navItems[index - 1]?.section);

            return (
              <React.Fragment key={item.href}>
                {showSectionHeader && (
                  <div className="pt-3 pb-1 px-3">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      {item.section}
                    </span>
                  </div>
                )}

                <div className="relative group">
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center rounded-2xl font-medium text-xs sm:text-sm transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                      collapsed
                        ? "h-11 w-11 mx-auto justify-center"
                        : "h-10 px-3 py-2 w-full",
                      isActive
                        ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/30 border border-blue-500/40"
                        : "text-slate-600 hover:bg-white/80 hover:text-slate-900 hover:shadow-2xs"
                    )}
                    aria-label={item.title}
                  >
                    <Icon
                      className={cn(
                        "h-4.5 w-4.5 shrink-0 transition-colors",
                        isActive
                          ? "text-white"
                          : "text-slate-500 group-hover:text-slate-800",
                        !collapsed && "mr-3"
                      )}
                    />

                    {!collapsed && (
                      <span className="flex-1 truncate">{item.title}</span>
                    )}

                    {!collapsed && item.badge && (
                      <Badge
                        variant={item.badgeVariant || "neutral"}
                        className={cn(
                          "ml-auto text-[10px] px-2 py-0.5 h-4.5 uppercase font-bold",
                          isActive && "bg-white/20 text-white border-white/30"
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>

                  {/* Clean Tooltip for Collapsed State */}
                  {collapsed && (
                    <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md text-white text-xs font-medium shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50 flex items-center gap-1.5 border border-white/10">
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500 text-white font-bold uppercase">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Footer / Toggle & Workspace Card */}
      <div className="pt-3 border-t border-white/60 space-y-2">
        {!collapsed ? (
          <div className="p-3 rounded-2xl bg-white/70 border border-white/80 text-xs shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Workspace
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-bold">
                PROD
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              WhatsApp API Active
            </p>
          </div>
        ) : null}

        {/* Sidebar Expansion Toggle Button or Collapsed Dock Icons */}
        {!collapsed ? (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="flex items-center justify-between rounded-xl px-3 h-9 text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-white/70 transition-colors w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <span>Collapse Sidebar</span>
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2 pt-1">
            <Link
              href={`/app/${orgSlug}/tasks`}
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 hover:text-slate-800 hover:bg-white/80 transition-all shadow-2xs"
              title="Recent Activity"
            >
              <Clock className="h-4.5 w-4.5" />
            </Link>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white font-bold text-xs shadow-xs cursor-pointer ring-2 ring-white/80"
              title="Current User"
            >
              <span>RX</span>
            </div>
            <button
              type="button"
              onClick={toggleCollapsed}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-800 hover:bg-white/70 transition-colors cursor-pointer"
              title="Expand sidebar"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Open Trigger */}
      <div className="md:hidden fixed top-3 left-3 z-40">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm text-slate-700 hover:text-blue-600 transition-colors"
          aria-label="Open mobile navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-50 bg-white shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Sidebar Rail */}
      <aside
        className={cn(
          "hidden md:block shrink-0 transition-all duration-300 ease-in-out",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div className="sticky top-0 h-screen overflow-hidden">
          {sidebarContent}
        </div>
      </aside>
    </>
  );
}
