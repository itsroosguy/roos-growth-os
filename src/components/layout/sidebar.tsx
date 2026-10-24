"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTenant } from "@/lib/organizations/tenant-context";
import { RoosLogo } from "@/components/ui/roos-logo";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  UserCheck,
  MessageSquare,
  Send,
  Zap,
  CheckSquare,
  BarChart3,
  Shield,
  Smartphone,
  Sparkles,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  User,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  orgSlug: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeType?: "number" | "pill";
}

export function Sidebar({ orgSlug }: SidebarProps) {
  const pathname = usePathname();
  const { currentOrg, userRole, setUserRole, isAdmin, isJuniorManager } = useTenant();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Initialize and persist collapsed state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("roos_sidebar_collapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch {
      // Ignore
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

  const navItems = useMemo<NavItem[]>(() => {
    // Exact Reference Design Sidebar items
    const allItems: NavItem[] = [
      {
        title: "Overview",
        href: `/app/${orgSlug}/overview`,
        icon: Home,
      },
      {
        title: "Leads",
        href: `/app/${orgSlug}/leads`,
        icon: Users,
      },
      {
        title: "Contacts",
        href: `/app/${orgSlug}/contacts`,
        icon: UserCheck,
      },
      {
        title: "Inbox",
        href: `/app/${orgSlug}/inbox`,
        icon: MessageSquare,
        badge: "12",
        badgeType: "number",
      },
      {
        title: "Campaigns",
        href: `/app/${orgSlug}/campaigns`,
        icon: Send,
      },
      {
        title: "Automations",
        href: `/app/${orgSlug}/automations`,
        icon: Zap,
      },
      {
        title: "Tasks",
        href: `/app/${orgSlug}/tasks`,
        icon: CheckSquare,
      },
      {
        title: "Reports",
        href: `/app/${orgSlug}/reports`,
        icon: BarChart3,
      },
      {
        title: "Team",
        href: `/app/${orgSlug}/team`,
        icon: Shield,
      },
      {
        title: "WhatsApp Settings",
        href: `/app/${orgSlug}/whatsapp`,
        icon: Smartphone,
      },
      {
        title: "AI Assistant",
        href: `/app/${orgSlug}/settings/ai`,
        icon: Sparkles,
        badge: "AI",
        badgeType: "pill",
      },
      {
        title: "Subscription",
        href: `/app/${orgSlug}/subscription`,
        icon: CreditCard,
      },
      {
        title: "Settings",
        href: `/app/${orgSlug}/settings`,
        icon: Settings,
      },
    ];

    if (isJuniorManager) {
      // Junior Manager focused execution
      return allItems.filter((item) =>
        ["Overview", "Inbox", "Contacts", "Tasks", "Reports"].includes(item.title)
      );
    }

    if (userRole === "senior_manager") {
      // Senior Manager operational (no subscription / fund transfers or master settings)
      return allItems.filter((item) => !["Subscription", "Settings"].includes(item.title));
    }

    // Admin sees all
    return allItems;
  }, [orgSlug, userRole, isJuniorManager]);

  const roleLabel =
    userRole === "owner"
      ? "Root Owner"
      : userRole === "admin"
      ? "L1 Admin"
      : userRole === "senior_manager"
      ? "L2 Sr Manager"
      : "L3 Jr Manager";

  const sidebarContent = (
    <div
      className={cn(
        "flex h-full flex-col justify-between bg-[#0D0D0E] text-white border-r border-[#1C1C1F] transition-all duration-300 ease-in-out select-none",
        collapsed ? "w-20 px-2.5 py-4" : "w-64 px-3.5 py-5"
      )}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Top Logo Header */}
        <div
          className={cn(
            "flex items-center pb-6 pt-1",
            collapsed ? "justify-center" : "justify-between px-2"
          )}
        >
          <Link
            href={`/app/${orgSlug}/overview`}
            className="flex items-center gap-2 outline-none focus-visible:ring-1 focus-visible:ring-[#FF7900] rounded-lg"
          >
            <RoosLogo variant="white" size="md" collapsed={collapsed} />
          </Link>

          {!collapsed && (
            <button
              type="button"
              onClick={toggleCollapsed}
              className="text-[#71717A] hover:text-white transition-colors p-1 rounded-md hover:bg-[#1C1C1F] cursor-pointer"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto space-y-1 pr-1 custom-dark-scroll" aria-label="Sidebar Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === `/app/${orgSlug}/overview`
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center rounded-xl text-xs sm:text-[13px] font-semibold transition-all duration-150 outline-none",
                    collapsed
                      ? "h-10 w-10 mx-auto justify-center"
                      : "h-10 px-3 w-full",
                    isActive
                      ? "bg-[#24180E] text-[#FF7900] border border-[#3D2513]/70 font-bold shadow-xs"
                      : "text-[#A1A1AA] hover:text-white hover:bg-[#18181B]"
                  )}
                  aria-label={item.title}
                >
                  <Icon
                    className={cn(
                      "h-4.5 w-4.5 shrink-0 transition-colors",
                      isActive ? "text-[#FF7900]" : "text-[#A1A1AA] group-hover:text-white",
                      !collapsed && "mr-3"
                    )}
                  />

                  {!collapsed && (
                    <span className="flex-1 truncate">{item.title}</span>
                  )}

                  {!collapsed && item.badge && (
                    <span
                      className={cn(
                        "ml-auto text-white font-bold leading-none shrink-0",
                        item.badgeType === "number"
                          ? "bg-[#FF7900] text-[11px] px-2 py-0.5 rounded-full"
                          : "bg-[#FF7900] text-[10px] px-1.5 py-0.5 rounded-md uppercase font-black"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>

                {/* Collapsed Tooltip */}
                {collapsed && (
                  <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-lg bg-[#18181B] text-white text-xs font-semibold shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 flex items-center gap-2 border border-[#27272A]">
                    <span>{item.title}</span>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#FF7900] text-white font-bold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile / Account Pill matching Reference Image */}
      <div className="pt-3 border-t border-[#1C1C1F] relative">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className={cn(
            "flex items-center rounded-xl bg-[#121214] hover:bg-[#18181B] border border-[#232326] transition-all cursor-pointer w-full text-left outline-none",
            collapsed ? "p-2 justify-center" : "p-2.5 justify-between"
          )}
          title="Account clearance and settings"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 text-white font-black text-xs border border-white/10">
              <User className="h-4 w-4 text-slate-300" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-extrabold text-white truncate leading-tight">
                  {currentOrg.name}
                </span>
                <span className="text-[10px] font-mono font-semibold text-[#A1A1AA] truncate">
                  {roleLabel}
                </span>
              </div>
            )}
          </div>

          {!collapsed && (
            <ChevronDown className="h-3.5 w-3.5 text-[#71717A] shrink-0" />
          )}
        </button>

        {/* User Dropdown Menu */}
        {userMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setUserMenuOpen(false)}
            />
            <div
              className={cn(
                "absolute z-50 rounded-2xl border border-[#27272A] bg-[#121214] p-2 shadow-2xl text-white backdrop-blur-xl animate-in fade-in zoom-in-95",
                collapsed ? "left-full bottom-2 ml-3 w-56" : "bottom-full mb-2 left-0 right-0"
              )}
            >
              <div className="px-3 py-2 border-b border-[#1F1F23] mb-1">
                <p className="text-xs font-bold text-white">{currentOrg.name}</p>
                <p className="text-[10px] text-[#A1A1AA] font-mono truncate">
                  Role: {userRole.toUpperCase()}
                </p>
              </div>

              {/* Quick RBAC role switch for testing */}
              <div className="p-1 space-y-1">
                <div className="text-[10px] uppercase font-mono text-[#71717A] px-2 py-0.5">
                  Clearance Level
                </div>
                <button
                  onClick={() => {
                    setUserRole("admin");
                    setUserMenuOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer",
                    userRole === "admin" || userRole === "owner"
                      ? "bg-[#24180E] text-[#FF7900]"
                      : "text-slate-300 hover:bg-[#1A1A1E]"
                  )}
                >
                  <span>Level 1: Admin</span>
                  {(userRole === "admin" || userRole === "owner") && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF7900]" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setUserRole("senior_manager");
                    setUserMenuOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer",
                    userRole === "senior_manager"
                      ? "bg-[#24180E] text-[#FF7900]"
                      : "text-slate-300 hover:bg-[#1A1A1E]"
                  )}
                >
                  <span>Level 2: Sr Manager</span>
                  {userRole === "senior_manager" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF7900]" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setUserRole("junior_manager");
                    setUserMenuOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer",
                    userRole === "junior_manager" || userRole === "staff"
                      ? "bg-[#24180E] text-[#FF7900]"
                      : "text-slate-300 hover:bg-[#1A1A1E]"
                  )}
                >
                  <span>Level 3: Jr Manager</span>
                  {(userRole === "junior_manager" || userRole === "staff") && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF7900]" />
                  )}
                </button>
              </div>

              <div className="my-1 border-t border-[#1F1F23]" />

              <Link
                href={`/app/${orgSlug}/settings`}
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#1A1A1E] rounded-lg transition-colors font-medium"
              >
                <Settings className="mr-2 h-3.5 w-3.5 text-[#71717A]" />
                Settings
              </Link>

              <Link
                href="/login"
                onClick={() => setUserMenuOpen(false)}
                className="w-full flex items-center px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors font-semibold cursor-pointer"
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                Sign Out
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Menu Trigger */}
      <div className="md:hidden fixed top-3 left-3 z-40">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0D0D0E] text-white border border-[#232326] shadow-sm cursor-pointer"
          aria-label="Open mobile navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-[85vw] h-full z-50 bg-[#0D0D0E] shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 h-7 w-7 flex items-center justify-center rounded-lg bg-[#18181B] text-[#A1A1AA] hover:text-white cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
