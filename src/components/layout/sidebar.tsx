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
  Layers,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  LogOut,
  Terminal,
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

interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

export function Sidebar({ orgSlug }: SidebarProps) {
  const pathname = usePathname();
  const { currentOrg, userRole, setUserRole, isJuniorManager } = useTenant();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [devSandboxOpen, setDevSandboxOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<{ title: string; badge?: string; top: number } | null>(null);

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

  // Structured, logical categories matching Executive Directive
  const navSections = useMemo<NavSection[]>(() => {
    const sections: NavSection[] = [
      {
        id: "workspace",
        label: "Workspace",
        items: [
          {
            title: "Overview",
            href: `/app/${orgSlug}/overview`,
            icon: Home,
          },
          {
            title: "Shared Inbox",
            href: `/app/${orgSlug}/inbox`,
            icon: MessageSquare,
            badge: "3",
            badgeType: "number",
          },
          {
            title: "Sales Pipeline",
            href: `/app/${orgSlug}/leads`,
            icon: Users,
          },
          {
            title: "Contacts",
            href: `/app/${orgSlug}/contacts`,
            icon: UserCheck,
          },
        ],
      },
      {
        id: "engagement",
        label: "Engagement",
        items: [
          {
            title: "Broadcasts",
            href: `/app/${orgSlug}/campaigns`,
            icon: Send,
          },
          {
            title: "Templates",
            href: `/app/${orgSlug}/templates`,
            icon: Sparkles,
          },
          {
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
            title: "Tasks & SLAs",
            href: `/app/${orgSlug}/tasks`,
            icon: CheckSquare,
            badge: "4",
            badgeType: "number",
          },
          {
            title: "Analytics & Reports",
            href: `/app/${orgSlug}/reports`,
            icon: BarChart3,
          },
          {
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
            icon: Settings,
          },
        ],
      },
    ];

    // Role-based restrictions
    if (isJuniorManager) {
      return [
        {
          id: "workspace",
          label: "Workspace",
          items: [
            { title: "Overview", href: `/app/${orgSlug}/overview`, icon: Home },
            { title: "Shared Inbox", href: `/app/${orgSlug}/inbox`, icon: MessageSquare, badge: "3", badgeType: "number" },
            { title: "Contacts", href: `/app/${orgSlug}/contacts`, icon: UserCheck },
          ],
        },
        {
          id: "operations",
          label: "Operations",
          items: [
            { title: "Tasks & SLAs", href: `/app/${orgSlug}/tasks`, icon: CheckSquare },
            { title: "Analytics & Reports", href: `/app/${orgSlug}/reports`, icon: BarChart3 },
          ],
        },
      ];
    }

    if (userRole === "senior_manager") {
      return sections.map((sec) => {
        if (sec.id === "configuration") {
          return {
            ...sec,
            items: sec.items.filter(
              (item) => !["Subscription & Limits", "Organisation Details"].includes(item.title)
            ),
          };
        }
        return sec;
      });
    }

    return sections;
  }, [orgSlug, isJuniorManager, userRole]);

  // All valid item hrefs for longest-prefix / exact matching (Defect 10 fix)
  const allHrefs = useMemo(() => {
    return navSections.flatMap((s) => s.items.map((i) => i.href));
  }, [navSections]);

  const checkIsActive = (href: string) => {
    if (pathname === href) return true;
    // Check if there is a more specific href that matches pathname
    const hasMoreSpecific = allHrefs.some(
      (h) => h !== href && h.startsWith(href) && pathname.startsWith(h)
    );
    if (hasMoreSpecific) return false;
    return pathname.startsWith(href);
  };

  const roleLabel =
    userRole === "owner"
      ? "Owner"
      : userRole === "admin"
      ? "Admin"
      : userRole === "senior_manager"
      ? "Manager"
      : "Staff";

  const handleMouseEnterItem = (e: React.MouseEvent<HTMLAnchorElement>, item: NavItem) => {
    if (!collapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredItem({
      title: item.title,
      badge: item.badge,
      top: rect.top + rect.height / 2,
    });
  };

  const handleMouseLeaveItem = () => {
    if (collapsed) {
      setHoveredItem(null);
    }
  };

  const sidebarContent = (
    <div
      className={cn(
        "flex h-full flex-col justify-between bg-[#0D0D0E] text-white border-r border-[#1C1C1F] select-none transition-[width] duration-180 ease-expo-out will-change-[width]",
        collapsed ? "w-[64px] px-2 py-3.5" : "w-[248px] px-3.5 py-3.5"
      )}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Top Header - Brand Logo & Collapse Toggle */}
        <div
          className={cn(
            "flex items-center pb-3 pt-0.5 transition-all duration-180 ease-expo-out border-b border-[#18181C] mb-3 shrink-0",
            collapsed ? "flex-col gap-2 items-center justify-center" : "justify-between px-1"
          )}
        >
          <Link
            href={`/app/${orgSlug}/overview`}
            className="flex items-center outline-none focus-visible:ring-1 focus-visible:ring-[#FF7A1A] rounded-lg shrink-0 transition-transform duration-140 ease-spring active:scale-95 will-change-transform"
            title="Roos StudioX"
          >
            <RoosLogo variant="white" size="md" collapsed={collapsed} />
          </Link>

          <button
            type="button"
            onClick={toggleCollapsed}
            className="text-[#717680] hover:text-white transition-all duration-140 ease-spring active:scale-90 will-change-transform p-1 rounded-md hover:bg-[#18181C] cursor-pointer shrink-0"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Sections */}
        <nav
          className="flex-1 overflow-y-auto space-y-5 pr-0.5 custom-dark-scroll"
          aria-label="Sidebar Navigation"
        >
          {navSections.map((section, sIdx) => (
            <div key={section.id} className="space-y-0.5">
              {/* Category Header or Divider */}
              {!collapsed ? (
                <div className="px-2 pb-1 type-eyebrow text-[#717680]">
                  {section.label}
                </div>
              ) : sIdx > 0 ? (
                <div className="my-1.5 border-t border-[#1C1C20] mx-1" />
              ) : null}

              {/* Items in this category */}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = checkIsActive(item.href);

                  return (
                    <div key={item.href} className="relative">
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        onMouseEnter={(e) => handleMouseEnterItem(e, item)}
                        onMouseLeave={handleMouseLeaveItem}
                        className={cn(
                          "group relative flex items-center rounded-lg text-xs font-medium transition-all duration-140 ease-expo-out active:scale-[0.985] will-change-transform outline-none select-none",
                          collapsed
                            ? "h-9 w-9 mx-auto justify-center"
                            : "h-8.5 px-2.5 w-full",
                          isActive
                            ? "bg-[#18181C] text-white border border-[#27272F]"
                            : "text-[#9CA3AF] hover:text-white hover:bg-[#141417] border border-transparent"
                        )}
                        aria-label={item.title}
                      >
                        {/* Active Accent Hairline Strip */}
                        {isActive && (
                          <span
                            className={cn(
                              "absolute rounded-full bg-[#FF7A1A] transition-all",
                              collapsed
                                ? "-left-1 top-1/2 -translate-y-1/2 h-3.5 w-1"
                                : "left-0 top-1/2 -translate-y-1/2 h-3.5 w-0.5"
                            )}
                          />
                        )}

                        {/* Icon - Always 17px on single vertical axis */}
                        <Icon
                          className={cn(
                            "h-[17px] w-[17px] shrink-0 transition-colors duration-120",
                            isActive ? "text-[#FF7A1A]" : "text-[#717680] group-hover:text-white",
                            !collapsed && "mr-2.5"
                          )}
                        />

                        {/* Label (Expanded mode) */}
                        {!collapsed && (
                          <span
                            className={cn(
                              "flex-1 truncate tracking-tight transition-colors text-xs",
                              isActive ? "text-white font-medium" : "text-[#D1D5DB] font-normal group-hover:text-white"
                            )}
                          >
                            {item.title}
                          </span>
                        )}

                        {/* Badge (Expanded mode) */}
                        {!collapsed && item.badge && (
                          <span className="ml-auto text-white leading-none shrink-0 font-medium bg-[#FF7A1A] text-[10px] px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}

                        {/* Unread dot (Collapsed mode) */}
                        {collapsed && item.badge && (
                          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#FF7A1A] ring-2 ring-[#0D0D0E]" />
                        )}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Floating Tooltip in Collapsed Mode */}
      {collapsed && hoveredItem && (
        <div
          className="pointer-events-none fixed left-[70px] z-50 flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#141417] text-white border border-[#27272E] shadow-xl text-xs font-medium whitespace-nowrap will-change-transform animate-reveal"
          style={{ top: `${hoveredItem.top}px`, transform: "translate3d(0, -50%, 0)" }}
        >
          <span>{hoveredItem.title}</span>
          {hoveredItem.badge && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#FF7A1A] text-white font-medium">
              {hoveredItem.badge}
            </span>
          )}
        </div>
      )}

      {/* Bottom Pinned Section: Developer Sandbox (Defect 6) + Account Bar */}
      <div className="pt-2.5 border-t border-[#1C1C1F] relative mt-2 shrink-0 space-y-1.5">
        {/* Collapsible Developer / Sandbox Drawer */}
        {!collapsed && (
          <div className="rounded-lg border border-[#1F1F24] bg-[#121215] overflow-hidden">
            <button
              type="button"
              onClick={() => setDevSandboxOpen(!devSandboxOpen)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] text-[#717680] hover:text-[#D1D5DB] transition-colors cursor-pointer select-none"
            >
              <div className="flex items-center gap-1.5">
                <Terminal className="h-3 w-3 text-[#FF7A1A]" />
                <span className="font-medium">Sandbox Controls</span>
              </div>
              <ChevronDown
                className={cn("h-3 w-3 transition-transform duration-140", devSandboxOpen && "rotate-180")}
              />
            </button>

            {devSandboxOpen && (
              <div className="px-2.5 pb-2 pt-1 border-t border-[#1C1C20] space-y-1.5 text-[11px]">
                <div className="text-[10px] text-[#717680] uppercase tracking-wider">
                  Active Role
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {(["admin", "senior_manager", "junior_manager"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setUserRole(r)}
                      className={cn(
                        "py-1 px-1.5 rounded text-[10px] font-medium transition-colors cursor-pointer text-center truncate",
                        userRole === r
                          ? "bg-[#FF7A1A] text-white"
                          : "bg-[#18181C] text-[#9CA3AF] hover:text-white"
                      )}
                    >
                      {r === "admin" ? "Admin" : r === "senior_manager" ? "Manager" : "Staff"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Account Bar */}
        <button
          type="button"
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className={cn(
            "flex items-center rounded-lg bg-[#121215] hover:bg-[#18181C] border border-[#232326] hover:border-[#2E2E33] transition-all cursor-pointer w-full text-left outline-none p-1.5",
            collapsed ? "justify-center" : "justify-between"
          )}
          title="Account profile & workspace settings"
        >
          <div className="flex items-center gap-2 min-w-0">
            {/* User Avatar Circle */}
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#1C1C20] text-[#FF7A1A] border border-[#2B2B33] font-medium text-xs">
              P
            </div>

            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-white truncate leading-tight">
                    Praveen
                  </span>
                  <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-[#1C1C20] text-[#A1A1AA] border border-[#2A2A30]">
                    {roleLabel}
                  </span>
                </div>
                <span className="text-[11px] text-[#717680] truncate mt-0.5">
                  {currentOrg.name}
                </span>
              </div>
            )}
          </div>

          {!collapsed && (
            <ChevronDown className="h-3.5 w-3.5 text-[#717680] shrink-0 ml-1" />
          )}
        </button>

        {/* User Menu Dropdown */}
        {userMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setUserMenuOpen(false)}
            />
            <div
              className={cn(
                "absolute z-50 rounded-xl border border-[#27272A] bg-[#121215] p-2 shadow-2xl text-white",
                collapsed ? "left-full bottom-0 ml-2 w-56" : "bottom-full mb-2 left-0 right-0"
              )}
            >
              <div className="px-2.5 py-2 border-b border-[#1F1F23] mb-1">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-[#FF7A1A]/10 text-[#FF7A1A] flex items-center justify-center text-xs font-medium">
                    P
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">Praveen</p>
                    <p className="text-[10px] text-[#8E8E93] truncate">praveen@roosstudiox.com</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-[#A1A1AA]">
                  <span>Workspace:</span>
                  <span className="text-white font-medium">{currentOrg.name}</span>
                </div>
              </div>

              <Link
                href={`/app/${orgSlug}/settings`}
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center px-2 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#18181C] rounded-md transition-colors font-medium"
              >
                <Settings className="mr-2 h-3.5 w-3.5 text-[#717680]" />
                Workspace Settings
              </Link>

              <div className="my-1 border-t border-[#1F1F23]" />

              <Link
                href="/login"
                onClick={() => setUserMenuOpen(false)}
                className="w-full flex items-center px-2 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors font-medium cursor-pointer"
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
      {/* Desktop Persistent Sidebar (>= 1024px) */}
      <aside className="hidden lg:block shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile / Tablet Menu Trigger (< 1024px) */}
      <div className="lg:hidden fixed top-3 left-3 z-40">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-[#0D0D0E] text-white border border-[#232326] shadow-xs cursor-pointer hover:bg-[#18181C] transition-colors"
          aria-label="Open mobile navigation"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      {/* Overlay Drawer (< 1024px) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-[248px] max-w-[85vw] h-full z-50 bg-[#0D0D0E] shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-3.5 right-3 h-7 w-7 flex items-center justify-center rounded-md bg-[#18181C] text-[#A1A1AA] hover:text-white cursor-pointer"
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
