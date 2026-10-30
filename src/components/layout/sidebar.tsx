"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTenant } from "@/lib/organizations/tenant-context";
import { RoosLogo } from "@/components/ui/roos-logo";
import { cn, getAvatarColor, getInitials } from "@/lib/utils";
import {
  Home,
  MessageSquare,
  Filter,
  Users,
  Send,
  FileText,
  Zap,
  CheckCircle2,
  BarChart3,
  Shield,
  Smartphone,
  Sparkles,
  Sliders,
  CreditCard,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  LogOut,
  Search,
  Sparkle,
} from "lucide-react";

interface SidebarProps {
  orgSlug: string;
}

interface NavItem {
  id: string;
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeType?: "count" | "ai";
  shortcut?: string;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export function Sidebar({ orgSlug }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentOrg, userRole } = useTenant();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Tooltip state for collapsed rail
  const [hoveredTooltip, setHoveredTooltip] = useState<{
    title: string;
    shortcut?: string;
    top: number;
  } | null>(null);

  // Initialize and persist collapsed state
  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem("roos_sidebar_collapsed");
      if (savedCollapsed !== null) {
        setCollapsed(savedCollapsed === "true");
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

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Trigger global command palette via ⌘K
  const openCommandPalette = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  };

  // Nav Groups strictly matching specifications: Main, Growth Tools, Settings
  const navGroups = useMemo<NavGroup[]>(() => {
    return [
      {
        id: "main",
        label: "Main",
        items: [
          {
            id: "overview",
            title: "Overview",
            href: `/app/${orgSlug}/overview`,
            icon: Home,
            shortcut: "G O",
          },
          {
            id: "inbox",
            title: "WhatsApp inbox",
            href: `/app/${orgSlug}/inbox`,
            icon: MessageSquare,
            badge: "3",
            badgeType: "count",
            shortcut: "G I",
          },
          {
            id: "leads",
            title: "Sales Pipeline",
            href: `/app/${orgSlug}/leads`,
            icon: Filter,
            shortcut: "G P",
          },
          {
            id: "contacts",
            title: "Contacts",
            href: `/app/${orgSlug}/contacts`,
            icon: Users,
            shortcut: "G C",
          },
          {
            id: "campaigns",
            title: "Broadcasts",
            href: `/app/${orgSlug}/campaigns`,
            icon: Send,
            shortcut: "G B",
          },
          {
            id: "automations",
            title: "Automations",
            href: `/app/${orgSlug}/automations`,
            icon: Zap,
            shortcut: "G A",
          },
          {
            id: "tasks",
            title: "Tasks & SLAs",
            href: `/app/${orgSlug}/tasks`,
            icon: CheckCircle2,
            badge: "4",
            badgeType: "count",
            shortcut: "G T",
          },
          {
            id: "reports",
            title: "Analytics & Reports",
            href: `/app/${orgSlug}/reports`,
            icon: BarChart3,
            shortcut: "G R",
          },
        ],
      },
      {
        id: "growth-tools",
        label: "Growth Tools",
        items: [
          {
            id: "settings-ai",
            title: "AI Engine",
            href: `/app/${orgSlug}/settings/ai`,
            icon: Sparkles,
            badge: "AI",
            badgeType: "ai",
          },
          {
            id: "templates",
            title: "Templates",
            href: `/app/${orgSlug}/templates`,
            icon: FileText,
          },
          {
            id: "settings-admin",
            title: "Integrations",
            href: `/app/${orgSlug}/settings/admin`,
            icon: Sliders,
          },
        ],
      },
      {
        id: "settings",
        label: "Settings",
        items: [
          {
            id: "team",
            title: "Team Roster",
            href: `/app/${orgSlug}/team`,
            icon: Shield,
          },
          {
            id: "subscription",
            title: "Subscription & Limits",
            href: `/app/${orgSlug}/subscription`,
            icon: CreditCard,
          },
          {
            id: "business-profile",
            title: "Organisation Details",
            href: `/app/${orgSlug}/settings/business-profile`,
            icon: Building2,
          },
          {
            id: "whatsapp",
            title: "WhatsApp API",
            href: `/app/${orgSlug}/whatsapp`,
            icon: Smartphone,
          },
        ],
      },
    ];
  }, [orgSlug]);

  // Exact-match logic: Exactly one active item per route
  const activeHref = useMemo(() => {
    // 1. Check exact equality first
    for (const group of navGroups) {
      for (const item of group.items) {
        if (pathname === item.href) {
          return item.href;
        }
      }
    }
    // 2. Sub-route prefix match (e.g. /campaigns/camp-101 matches /campaigns)
    let bestMatch = "";
    for (const group of navGroups) {
      for (const item of group.items) {
        if (pathname.startsWith(item.href) && item.href.length > bestMatch.length) {
          bestMatch = item.href;
        }
      }
    }
    return bestMatch;
  }, [pathname, navGroups]);

  // Plan name calculation
  const planName = useMemo(() => {
    const tier = currentOrg.plan_tier || "growth";
    return tier.charAt(0).toUpperCase() + tier.slice(1) + " Plan";
  }, [currentOrg.plan_tier]);

  const isBelowTopTier = currentOrg.plan_tier !== "business";

  // Plan upgrade card dismiss state (closed by default per user request)
  const [isPlanDismissed, setIsPlanDismissed] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("roos_plan_upgrade_dismissed");
      if (stored !== null) {
        setIsPlanDismissed(stored === "true");
      }
    } catch {}
  }, []);

  const avatarColors = getAvatarColor("Praveen");

  const sidebarContent = (
    <div className="flex h-full flex-col text-[#F4F5F7] select-none bg-[#0B0D12] overflow-hidden">
      {/* 1. TOP LOGO & COLLAPSE HEADER */}
      <div className="relative flex h-[64px] shrink-0 items-center justify-between px-4 border-b border-white/[0.06]">
        <Link
          href={`/app/${orgSlug}/overview`}
          className="flex items-center overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A1F] rounded-[8px]"
          title="ROOS STUDIOX"
        >
          <RoosLogo collapsed={collapsed} size={collapsed ? "sm" : "md"} className="shrink-0" />
        </Link>

        {/* Collapse Chevron Button */}
        <button
          type="button"
          onClick={toggleCollapsed}
          className="hidden lg:flex items-center justify-center h-7 w-7 rounded-[8px] text-[#A3A9B6] hover:bg-white/[0.08] hover:text-[#F4F5F7] transition-all duration-140 cursor-pointer"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* 2. SEARCH FIELD (⌘K) INSIDE SIDEBAR */}
      <div className="px-3 pt-3 pb-1">
        <button
          type="button"
          onClick={openCommandPalette}
          className={cn(
            "group flex items-center rounded-[12px] bg-[#12151C] text-[#A3A9B6] border border-white/[0.06] hover:bg-[#1B1F29] hover:border-white/[0.12] hover:text-[#F4F5F7] transition-all duration-140 cursor-pointer",
            collapsed
              ? "h-10 w-10 mx-auto justify-center"
              : "h-[40px] w-full px-3 justify-between"
          )}
          title="Search anything (⌘K)"
        >
          <div className="flex items-center gap-2.5">
            <Search className="h-4 w-4 text-[#A3A9B6] group-hover:text-[#FF5A1F] transition-colors" />
            {!collapsed && (
              <span className="text-[14px] font-normal text-[#A3A9B6] group-hover:text-[#F4F5F7]">
                Search...
              </span>
            )}
          </div>
          {!collapsed && (
            <kbd className="inline-flex items-center rounded-[6px] border border-white/[0.1] bg-[#0B0D12] px-1.5 py-0.5 text-[11px] text-[#6B7280]">
              ⌘K
            </kbd>
          )}
        </button>
      </div>

      {/* 3. THREE NAVIGATION GROUPS (42px rows, 22px icons, 15px labels, 12px radius) */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navGroups.map((group) => {
          const isGroupCollapsed = !!collapsedGroups[group.id];

          return (
            <div key={group.id} className="space-y-1">
              {/* Group Header */}
              {!collapsed ? (
                <div className="flex items-center justify-between px-3 py-1">
                  <span className="text-[11px] font-semibold tracking-[0.06em] text-[#6B7280] uppercase">
                    {group.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="h-4 w-4 flex items-center justify-center text-[#6B7280] hover:text-[#A3A9B6] transition-colors cursor-pointer"
                    aria-label={`Toggle ${group.label} group`}
                  >
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 transition-transform duration-140",
                        isGroupCollapsed && "-rotate-90"
                      )}
                    />
                  </button>
                </div>
              ) : (
                <div className="my-2 border-t border-white/[0.06]" />
              )}

              {/* Group Items */}
              {(!isGroupCollapsed || collapsed) && (
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeHref === item.href;

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onMouseEnter={(e) => {
                          if (collapsed) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredTooltip({
                              title: item.title,
                              shortcut: item.shortcut,
                              top: rect.top,
                            });
                          }
                        }}
                        onMouseLeave={() => setHoveredTooltip(null)}
                        aria-current={isActive ? "page" : undefined}
                        data-nav-active={isActive ? "true" : undefined}
                        className={cn(
                          "group relative flex items-center h-[42px] rounded-[12px] transition-all duration-140 cursor-pointer",
                          collapsed ? "justify-center w-11 mx-auto px-0" : "px-3 gap-3",
                          isActive
                            ? "bg-gradient-to-b from-[#FF7A3D] to-[#FF5A1F] text-white shadow-[0_4px_12px_rgba(255,90,31,0.35)]"
                            : "text-[#A3A9B6] hover:bg-white/[0.06] hover:text-[#F4F5F7]"
                        )}
                      >
                        {/* 22px Icon */}
                        <Icon
                          className={cn(
                            "h-[22px] w-[22px] shrink-0 transition-colors",
                            isActive ? "text-white" : "text-[#A3A9B6] group-hover:text-white"
                          )}
                        />

                        {/* 15px Label */}
                        {!collapsed && (
                          <span
                            className={cn(
                              "text-[15px] leading-tight truncate",
                              isActive ? "font-medium text-white" : "font-normal"
                            )}
                          >
                            {item.title}
                          </span>
                        )}

                        {/* Badges: Orange rounded square */}
                        {item.badge && !collapsed && (
                          <span
                            className={cn(
                              "ml-auto text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-[6px] shrink-0",
                              item.badgeType === "ai"
                                ? "bg-[#FF5A1F] text-white shadow-xs"
                                : isActive
                                ? "bg-white/20 text-white"
                                : "bg-[#FF5A1F] text-white"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}

                        {/* Dot badge when collapsed */}
                        {item.badge && collapsed && (
                          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#FF5A1F]" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* FLOATING HOVER TOOLTIP IN COLLAPSED MODE */}
      {collapsed && hoveredTooltip && (
        <div
          className="fixed z-50 left-[84px] px-3 py-1.5 rounded-[8px] bg-[#12151C] text-[#F4F5F7] border border-white/[0.12] text-[13px] font-medium shadow-overlay pointer-events-none flex items-center gap-2"
          style={{ top: `${hoveredTooltip.top + 6}px` }}
        >
          <span>{hoveredTooltip.title}</span>
          {hoveredTooltip.shortcut && (
            <kbd className="text-[11px] text-[#A3A9B6] border border-white/[0.1] bg-[#0B0D12] px-1 py-0.5 rounded">
              {hoveredTooltip.shortcut}
            </kbd>
          )}
        </div>
      )}

      {/* 4. PINNED BOTTOM SECTION: PLAN UPGRADE CARD & ACCOUNT CARD */}
      <div className="shrink-0 p-3 border-t border-white/[0.06] space-y-2.5">
        {/* Plan Upgrade Card (rendered when below top tier and not closed) */}
        {isBelowTopTier && !collapsed && !isPlanDismissed && (
          <div className="relative rounded-[14px] bg-[#12151C] border border-white/[0.08] p-3.5 overflow-hidden shadow-xs animate-fade-rise">
            {/* Radial orange glow in corner */}
            <div
              className="absolute pointer-events-none -right-4 -bottom-4 w-28 h-28 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(255,90,31,0.38) 0%, transparent 70%)",
              }}
            />

            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-white block">
                  {planName}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full bg-[#FF5A1F]/20 text-[#FF5A1F] border border-[#FF5A1F]/30">
                    Active
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlanDismissed(true);
                      try {
                        localStorage.setItem("roos_plan_upgrade_dismissed", "true");
                      } catch {}
                    }}
                    className="p-0.5 -mr-1 text-[#6B7280] hover:text-white rounded-[4px] hover:bg-white/10 transition-colors cursor-pointer"
                    title="Close"
                    aria-label="Close"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-[12px] text-[#A3A9B6] font-normal leading-snug">
                Scale broadcasts &amp; unlock unlimited automations.
              </p>
              <Link
                href={`/app/${orgSlug}/subscription`}
                className="inline-flex items-center justify-center w-full h-8 rounded-[10px] bg-gradient-to-b from-[#FF7A3D] to-[#FF5A1F] text-white text-[12px] font-medium shadow-[0_2px_8px_rgba(255,90,31,0.3)] hover:opacity-95 transition-opacity"
              >
                Upgrade Plan
              </Link>
            </div>
          </div>
        )}

        {/* Account Card (Avatar, Name, Role, Workspace, Chevron) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className={cn(
              "flex items-center justify-between w-full h-[52px] px-2.5 rounded-[12px] bg-[#12151C] border border-white/[0.06] hover:bg-[#1B1F29] hover:border-white/[0.12] transition-all duration-140 cursor-pointer",
              collapsed && "justify-center p-0 h-10 w-10 mx-auto"
            )}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[13px] font-semibold",
                  avatarColors.bg,
                  avatarColors.text
                )}
              >
                {getInitials("Praveen")}
              </div>

              {!collapsed && (
                <div className="flex flex-col text-left min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-medium text-[#F4F5F7] truncate leading-tight">
                      Praveen
                    </span>
                    <span className="text-[10px] uppercase px-1 py-0.2 rounded bg-white/[0.08] text-[#A3A9B6]">
                      {userRole === "owner" ? "Owner" : "Admin"}
                    </span>
                  </div>
                  <span className="text-[12px] text-[#6B7280] truncate mt-0.5">
                    {currentOrg.name}
                  </span>
                </div>
              )}
            </div>

            {!collapsed && (
              <ChevronDown className="h-3.5 w-3.5 text-[#6B7280] shrink-0 ml-1" />
            )}
          </button>

          {/* User Popover Menu */}
          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <div
                className={cn(
                  "absolute z-50 rounded-[14px] border border-white/[0.12] bg-[#12151C] p-1.5 shadow-overlay text-[#F4F5F7] animate-reveal",
                  collapsed
                    ? "left-full bottom-0 ml-2 w-52"
                    : "bottom-full mb-2 left-0 right-0"
                )}
              >
                <div className="px-3 py-2 border-b border-white/[0.08] mb-1">
                  <p className="text-[13px] font-medium text-[#F4F5F7]">Praveen</p>
                  <p className="text-[11px] text-[#6B7280] truncate">praveen@roosstudiox.com</p>
                </div>

                <Link
                  href={`/app/${orgSlug}/settings/business-profile`}
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center px-3 py-2 text-[13px] text-[#A3A9B6] hover:text-[#F4F5F7] hover:bg-white/[0.06] rounded-[8px] transition-colors"
                >
                  <Building2 className="mr-2 h-4 w-4 text-[#6B7280]" />
                  Organisation Details
                </Link>

                <div className="my-1 border-t border-white/[0.08]" />

                <button
                  type="button"
                  onClick={async () => {
                    setUserMenuOpen(false);
                    try {
                      document.cookie = "roos_session=; path=/; max-age=0;";
                      document.cookie = "roos_user_role=; path=/; max-age=0;";
                      document.cookie = "roos_user_email=; path=/; max-age=0;";
                      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
                    } finally {
                      window.location.href = "/login";
                    }
                  }}
                  className="w-full flex items-center px-3 py-2 text-[13px] text-[#E5484D] hover:bg-[#FFE9EA]/10 rounded-[8px] transition-colors cursor-pointer text-left"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Full-height Dark Sidebar (>= 1024px) */}
      <aside
        className={cn(
          "hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col border-r border-white/[0.06] bg-[#0B0D12] transition-all duration-160 ease-out",
          collapsed ? "w-[76px]" : "w-[244px]"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Trigger (< 1024px) */}
      <div className="lg:hidden fixed top-3 left-3 z-40">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#0B0D12] text-white border border-white/[0.1] shadow-xs hover:bg-[#1B1F29] transition-colors cursor-pointer"
          aria-label="Open mobile navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Overlay Drawer (< 1024px) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-[244px] max-w-[85vw] h-full z-50 bg-[#0B0D12] border-r border-white/[0.08] shadow-overlay overflow-hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-[8px] bg-white/[0.08] text-[#A3A9B6] hover:text-white transition-colors z-50 cursor-pointer"
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
