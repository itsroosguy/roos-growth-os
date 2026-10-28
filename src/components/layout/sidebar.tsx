"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTenant } from "@/lib/organizations/tenant-context";
import { RoosLogo } from "@/components/ui/roos-logo";
import { cn } from "@/lib/utils";
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
  Terminal,
  Plus,
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
  isAttentionBadge?: boolean;
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
  const { currentOrg, userRole, setUserRole, isJuniorManager } = useTenant();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sandboxOpen, setSandboxOpen] = useState(false);

  // Collapsed group sections persistence
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Tooltip state for collapsed rail
  const [hoveredTooltip, setHoveredTooltip] = useState<{
    title: string;
    shortcut?: string;
    top: number;
  } | null>(null);

  // Initialize and persist collapsed state from localStorage
  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem("roos_sidebar_collapsed_v2");
      if (savedCollapsed !== null) {
        setCollapsed(savedCollapsed === "true");
      }
      const savedGroups = localStorage.getItem("roos_sidebar_groups");
      if (savedGroups) {
        setCollapsedGroups(JSON.parse(savedGroups));
      }
    } catch {
      // Ignore
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("roos_sidebar_collapsed_v2", String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem("roos_sidebar_groups", JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  // Nav Groups strictly matching Section 3 specification
  const navGroups = useMemo<NavGroup[]>(() => {
    const groups: NavGroup[] = [
      {
        id: "workspace",
        label: "Workspace",
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
            title: "Shared Inbox",
            href: `/app/${orgSlug}/inbox`,
            icon: MessageSquare,
            badge: "3",
            isAttentionBadge: true,
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
        ],
      },
      {
        id: "engagement",
        label: "Engagement",
        items: [
          {
            id: "campaigns",
            title: "Broadcasts",
            href: `/app/${orgSlug}/campaigns`,
            icon: Send,
          },
          {
            id: "templates",
            title: "Templates",
            href: `/app/${orgSlug}/templates`,
            icon: FileText,
          },
          {
            id: "automations",
            title: "Automations",
            href: `/app/${orgSlug}/automations`,
            icon: Zap,
          },
        ],
      },
      {
        id: "operations",
        label: "Operations",
        items: [
          {
            id: "tasks",
            title: "Tasks & SLAs",
            href: `/app/${orgSlug}/tasks`,
            icon: CheckCircle2,
            badge: "4",
            isAttentionBadge: true,
            shortcut: "G T",
          },
          {
            id: "reports",
            title: "Analytics & Reports",
            href: `/app/${orgSlug}/reports`,
            icon: BarChart3,
          },
          {
            id: "team",
            title: "Team Roster",
            href: `/app/${orgSlug}/team`,
            icon: Shield,
          },
        ],
      },
      {
        id: "configuration",
        label: "Configuration",
        items: [
          {
            id: "whatsapp",
            title: "WhatsApp API",
            href: `/app/${orgSlug}/whatsapp`,
            icon: Smartphone,
          },
          {
            id: "settings-ai",
            title: "AI Engine",
            href: `/app/${orgSlug}/settings/ai`,
            icon: Sparkles,
          },
          {
            id: "settings-admin",
            title: "Integrations",
            href: `/app/${orgSlug}/settings/admin`,
            icon: Sliders,
          },
          {
            id: "subscription",
            title: "Subscription & Limits",
            href: `/app/${orgSlug}/subscription`,
            icon: CreditCard,
          },
          {
            id: "settings",
            title: "Organisation Details",
            href: `/app/${orgSlug}/settings`,
            icon: Building2,
          },
        ],
      },
    ];

    if (isJuniorManager) {
      return [
        {
          id: "workspace",
          label: "Workspace",
          items: groups[0].items.filter((i) => i.id !== "leads"),
        },
        groups[1],
        {
          id: "operations",
          label: "Operations",
          items: groups[2].items.filter((i) => i.id !== "team"),
        },
      ];
    }

    return groups;
  }, [orgSlug, isJuniorManager]);

  // Exact / Longest-route active matching
  const activeHref = useMemo(() => {
    let bestMatch = "";
    for (const group of navGroups) {
      for (const item of group.items) {
        if (pathname === item.href) {
          return item.href;
        }
        if (pathname.startsWith(item.href) && item.href.length > bestMatch.length) {
          bestMatch = item.href;
        }
      }
    }
    return bestMatch;
  }, [pathname, navGroups]);

  // Global Keyboard Shortcuts (G O, G I, G P, G C, G T, C)
  useEffect(() => {
    let lastKey = "";
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is inside an input, textarea or select
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const now = Date.now();
      const key = e.key.toLowerCase();

      // Quick create shortcut
      if (key === "c" && !e.metaKey && !e.ctrlKey && now - lastKeyTime > 800) {
        e.preventDefault();
        setQuickCreateOpen((prev) => !prev);
        return;
      }

      // Two-key G sequence
      if (lastKey === "g" && now - lastKeyTime < 800) {
        if (key === "o") {
          e.preventDefault();
          router.push(`/app/${orgSlug}/overview`);
        } else if (key === "i") {
          e.preventDefault();
          router.push(`/app/${orgSlug}/inbox`);
        } else if (key === "p") {
          e.preventDefault();
          router.push(`/app/${orgSlug}/leads`);
        } else if (key === "c") {
          e.preventDefault();
          router.push(`/app/${orgSlug}/contacts`);
        } else if (key === "t") {
          e.preventDefault();
          router.push(`/app/${orgSlug}/tasks`);
        }
        lastKey = "";
        return;
      }

      if (key === "g" && !e.metaKey && !e.ctrlKey) {
        lastKey = "g";
        lastKeyTime = now;
      } else {
        lastKey = "";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [orgSlug, router]);

  const roleLabel = useMemo(() => {
    switch (userRole) {
      case "owner":
        return "Owner";
      case "admin":
        return "Admin";
      case "senior_manager":
        return "Manager";
      case "junior_manager":
        return "Staff";
      case "staff":
        return "Staff";
      default:
        return "Member";
    }
  }, [userRole]);

  const sidebarContent = (
    <div
      className={cn(
        "flex h-full flex-col bg-[#0B0D12] text-[#F4F5F7] border-r border-[#1B1F29] select-none transition-all duration-320 ease-expo-out",
        collapsed ? "w-[76px]" : "w-[272px]"
      )}
    >
      {/* 1. TOP LOGO BLOCK (72px) */}
      <div className="flex h-[72px] shrink-0 items-center justify-between px-4 border-b border-[#1B1F29]/60">
        <Link
          href={`/app/${orgSlug}/overview`}
          className="flex items-center gap-3 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A1F] rounded-[8px]"
        >
          <RoosLogo size={collapsed ? "sm" : "md"} className="shrink-0" />
          {!collapsed && (
            <div className="flex flex-col min-w-0 transition-opacity duration-200">
              <span className="text-[14px] font-medium tracking-tight text-[#F4F5F7] truncate leading-tight">
                ROOS STUDIOX
              </span>
              <span className="text-[10px] font-medium tracking-[0.06em] text-[#6B7280] uppercase truncate">
                Business OS
              </span>
            </div>
          )}
        </Link>

        {/* Collapse Toggle Button */}
        <button
          type="button"
          onClick={toggleCollapsed}
          className="hidden lg:flex h-7 w-7 items-center justify-center rounded-[6px] text-[#A3A9B6] hover:bg-[#1B1F29] hover:text-[#F4F5F7] transition-colors duration-140 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A1F]"
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

      {/* 2. QUICK CREATE BUTTON (Beneath Logo Block) */}
      <div className="px-3 pt-3 pb-2 relative">
        <button
          type="button"
          onClick={() => setQuickCreateOpen((prev) => !prev)}
          className={cn(
            "group relative flex items-center justify-center rounded-[8px] bg-[#1B1F29] text-[#F4F5F7] border border-[#242A38] hover:bg-[#12151C] hover:border-[#373E50] transition-all duration-140 ease-spring active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A1F]",
            collapsed ? "h-11 w-11 mx-auto" : "h-10 w-full px-3 justify-between"
          )}
          title="Quick create (C)"
        >
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-[#FF5A1F] transition-transform duration-140 group-hover:rotate-90" />
            {!collapsed && (
              <span className="text-[13px] font-medium text-[#F4F5F7]">
                Quick create
              </span>
            )}
          </div>
          {!collapsed && (
            <kbd className="hidden sm:inline-flex items-center rounded border border-[#242A38] bg-[#0B0D12] px-1.5 py-0.5 text-[10px] text-[#A3A9B6]">
              C
            </kbd>
          )}
        </button>

        {/* Quick Create Dropdown Menu */}
        {quickCreateOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setQuickCreateOpen(false)}
            />
            <div
              className={cn(
                "absolute z-50 rounded-[14px] border border-[#242A38] bg-[#12151C] p-1.5 shadow-overlay text-[#F4F5F7] animate-reveal",
                collapsed ? "left-full top-3 ml-2 w-48" : "left-3 right-3 top-full mt-1.5"
              )}
            >
              <Link
                href={`/app/${orgSlug}/leads?action=new`}
                onClick={() => setQuickCreateOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[13px] text-[#A3A9B6] hover:text-[#F4F5F7] hover:bg-[#1B1F29] transition-colors"
              >
                <Filter className="h-3.5 w-3.5 text-[#FF5A1F]" />
                <span>New opportunity</span>
              </Link>
              <Link
                href={`/app/${orgSlug}/contacts?action=new`}
                onClick={() => setQuickCreateOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[13px] text-[#A3A9B6] hover:text-[#F4F5F7] hover:bg-[#1B1F29] transition-colors"
              >
                <Users className="h-3.5 w-3.5 text-[#FF5A1F]" />
                <span>New contact</span>
              </Link>
              <Link
                href={`/app/${orgSlug}/tasks?action=new`}
                onClick={() => setQuickCreateOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[13px] text-[#A3A9B6] hover:text-[#F4F5F7] hover:bg-[#1B1F29] transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-[#FF5A1F]" />
                <span>New task</span>
              </Link>
              <Link
                href={`/app/${orgSlug}/campaigns?action=new`}
                onClick={() => setQuickCreateOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[13px] text-[#A3A9B6] hover:text-[#F4F5F7] hover:bg-[#1B1F29] transition-colors"
              >
                <Send className="h-3.5 w-3.5 text-[#FF5A1F]" />
                <span>New broadcast</span>
              </Link>
            </div>
          </>
        )}
      </div>

      {/* 3. NAVIGATION ITEMS SCROLL AREA */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-2 space-y-6 custom-dark-scroll"
        style={{
          maskImage: "linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)",
        }}
      >
        {navGroups.map((group) => {
          const isGroupCollapsed = !!collapsedGroups[group.id];

          return (
            <div key={group.id} className="first:mt-1">
              {/* Group Label */}
              {!collapsed ? (
                <div className="flex items-center justify-between px-3 mb-2">
                  <span className="text-[11px] font-medium tracking-[0.06em] text-[#6B7280] uppercase">
                    {group.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="h-4 w-4 flex items-center justify-center text-[#6B7280] hover:text-[#A3A9B6] transition-colors"
                    aria-label={`Toggle ${group.label} group`}
                  >
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 transition-transform duration-160",
                        isGroupCollapsed && "-rotate-90"
                      )}
                    />
                  </button>
                </div>
              ) : (
                <div className="my-2 border-t border-[#1B1F29]/60" />
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
                        className={cn(
                          "group relative flex items-center rounded-[8px] h-11 px-3 transition-all duration-140 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A1F]",
                          isActive
                            ? "bg-[#1B1F29] text-[#F4F5F7] font-medium"
                            : "text-[#A3A9B6] hover:bg-[#1B1F29]/60 hover:text-[#F4F5F7]",
                          collapsed && "justify-center px-0 w-11 mx-auto"
                        )}
                      >
                        {/* 3px Flame Active Bar on Left Edge */}
                        {isActive && (
                          <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-[#FF5A1F] transition-all duration-320" />
                        )}

                        {/* Icon with idle/active states */}
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center transition-transform duration-120 group-hover:translate-x-[1px]">
                          <Icon
                            className={cn(
                              "h-[20px] w-[20px] transition-colors duration-140",
                              isActive
                                ? "text-[#FF5A1F]"
                                : "text-[#A3A9B6] group-hover:text-[#F4F5F7]"
                            )}
                          />
                        </div>

                        {/* Title Label */}
                        {!collapsed && (
                          <span className="ml-3 truncate text-[13px] font-normal leading-none group-hover:text-[#F4F5F7]">
                            {item.title}
                          </span>
                        )}

                        {/* Badges */}
                        {item.badge && !collapsed && (
                          <span
                            className={cn(
                              "ml-auto h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full text-[11px] font-variant-numeric tabular-nums font-medium",
                              item.isAttentionBadge
                                ? "bg-[#FF5A1F] text-white"
                                : "bg-[#1B1F29] text-[#A3A9B6] border border-[#242A38]"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}

                        {/* Collapsed dot marker for attention badge */}
                        {item.badge && collapsed && item.isAttentionBadge && (
                          <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-[#FF5A1F]" />
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
          className="fixed z-50 left-[84px] px-2.5 py-1 rounded-[6px] bg-[#12151C] text-[#F4F5F7] border border-[#242A38] text-[12px] font-medium shadow-overlay pointer-events-none flex items-center gap-2 animate-reveal"
          style={{ top: `${hoveredTooltip.top + 8}px` }}
        >
          <span>{hoveredTooltip.title}</span>
          {hoveredTooltip.shortcut && (
            <kbd className="text-[10px] text-[#A3A9B6] border border-[#242A38] bg-[#0B0D12] px-1 py-0.2 rounded">
              {hoveredTooltip.shortcut}
            </kbd>
          )}
        </div>
      )}

      {/* 4. PINNED BOTTOM UTILITIES & ACCOUNT CARD */}
      <div className="shrink-0 p-3 border-t border-[#1B1F29]/80 space-y-2 bg-[#0B0D12]">
        {/* Sandbox Controls (Collapsed by default) */}
        <div>
          <button
            type="button"
            onClick={() => setSandboxOpen((prev) => !prev)}
            className={cn(
              "flex items-center justify-between w-full h-8 px-2.5 rounded-[6px] text-[11px] text-[#6B7280] hover:text-[#A3A9B6] hover:bg-[#1B1F29]/60 transition-colors",
              collapsed && "justify-center px-0"
            )}
            title="Sandbox & Mock Controls"
          >
            <div className="flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-[#6B7280]" />
              {!collapsed && <span>Sandbox Controls</span>}
            </div>
            {!collapsed && (
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform",
                  sandboxOpen && "rotate-180"
                )}
              />
            )}
          </button>

          {sandboxOpen && !collapsed && (
            <div className="mt-2 p-2.5 rounded-[8px] bg-[#12151C] border border-[#242A38] space-y-2 text-[11px] animate-reveal">
              <div className="flex items-center justify-between text-[#A3A9B6]">
                <span>Active Role:</span>
                <span className="text-[#FF5A1F] font-medium uppercase">{userRole}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {(["owner", "admin", "senior_manager", "junior_manager"] as const).map(
                  (role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setUserRole(role)}
                      className={cn(
                        "px-1.5 py-1 rounded text-[10px] transition-colors border text-center capitalize",
                        userRole === role
                          ? "bg-[#FF5A1F]/15 text-[#FF5A1F] border-[#FF5A1F]/40 font-medium"
                          : "bg-[#1B1F29] text-[#A3A9B6] border-[#242A38] hover:text-[#F4F5F7]"
                      )}
                    >
                      {role.replace("_", " ")}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* 56px Workspace & Account Card */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className={cn(
              "flex items-center justify-between w-full h-14 p-2 rounded-[8px] bg-[#12151C] border border-[#1B1F29] hover:border-[#242A38] transition-all duration-140 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A1F]",
              collapsed && "justify-center p-0 h-11 w-11 mx-auto"
            )}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-[#1B1F29] text-[#FF5A1F] border border-[#242A38] text-[13px] font-medium">
                P
              </div>

              {!collapsed && (
                <div className="flex flex-col text-left min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-[#F4F5F7] truncate leading-tight">
                      Praveen
                    </span>
                    <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-[#1B1F29] text-[#A3A9B6] border border-[#242A38]">
                      {roleLabel}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#6B7280] truncate mt-0.5">
                    {currentOrg.name}
                  </span>
                </div>
              )}
            </div>

            {!collapsed && (
              <ChevronDown className="h-3.5 w-3.5 text-[#6B7280] shrink-0 ml-1" />
            )}
          </button>

          {/* User Account Popover */}
          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <div
                className={cn(
                  "absolute z-50 rounded-[14px] border border-[#242A38] bg-[#12151C] p-2 shadow-overlay text-[#F4F5F7] animate-reveal",
                  collapsed
                    ? "left-full bottom-0 ml-2 w-56"
                    : "bottom-full mb-2 left-0 right-0"
                )}
              >
                <div className="px-2.5 py-2 border-b border-[#1B1F29] mb-1">
                  <p className="text-[13px] font-medium text-[#F4F5F7]">Praveen</p>
                  <p className="text-[11px] text-[#6B7280] truncate">praveen@roosstudiox.com</p>
                </div>

                <Link
                  href={`/app/${orgSlug}/settings`}
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center px-2.5 py-2 text-[13px] text-[#A3A9B6] hover:text-[#F4F5F7] hover:bg-[#1B1F29] rounded-[6px] transition-colors"
                >
                  <Building2 className="mr-2 h-3.5 w-3.5 text-[#6B7280]" />
                  Organisation Details
                </Link>

                <div className="my-1 border-t border-[#1B1F29]" />

                <Link
                  href="/login"
                  onClick={() => setUserMenuOpen(false)}
                  className="w-full flex items-center px-2.5 py-2 text-[13px] text-[#B42318] hover:bg-[#FDECEA]/10 rounded-[6px] transition-colors"
                >
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Sign Out
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (>= 1024px) */}
      <aside className="hidden lg:block shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile / Tablet Menu Trigger (< 1024px) */}
      <div className="lg:hidden fixed top-3 left-3 z-40">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#0B0D12] text-white border border-[#242A38] shadow-hairline hover:bg-[#1B1F29] transition-colors"
          aria-label="Open mobile navigation"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      {/* Mobile Overlay Drawer (< 1024px) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#0B0D12]/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-[272px] max-w-[85vw] h-full z-50 bg-[#0B0D12] shadow-overlay">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 h-7 w-7 flex items-center justify-center rounded-[6px] bg-[#1B1F29] text-[#A3A9B6] hover:text-white transition-colors"
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
