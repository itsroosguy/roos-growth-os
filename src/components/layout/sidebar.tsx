"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  FileText,
  Layers,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  User,
  LogOut,
  ExternalLink,
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
  const { currentOrg, userRole, setUserRole, isAdmin, isJuniorManager } = useTenant();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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

  // Structured, logical categories for navigation items matching Executive Directive
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
            title: "Inbox",
            href: `/app/${orgSlug}/inbox`,
            icon: MessageSquare,
            badge: "3",
            badgeType: "number",
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
        ],
      },
      {
        id: "growth",
        label: "Growth",
        items: [
          {
            title: "Campaigns",
            href: `/app/${orgSlug}/campaigns`,
            icon: Send,
          },
          {
            title: "Templates",
            href: `/app/${orgSlug}/templates`,
            icon: FileText,
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
            title: "Tasks & Follow-ups",
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
        ],
      },
      {
        id: "configuration",
        label: "Configuration",
        items: [
          {
            title: "WhatsApp Settings",
            href: `/app/${orgSlug}/whatsapp`,
            icon: Smartphone,
          },
          {
            title: "AI Assistant",
            href: `/app/${orgSlug}/settings/ai`,
            icon: Sparkles,
          },
          {
            title: "Integrations",
            href: `/app/${orgSlug}/settings/admin`,
            icon: Layers,
          },
          {
            title: "Subscription & Usage",
            href: `/app/${orgSlug}/subscription`,
            icon: CreditCard,
          },
          {
            title: "Organisation Settings",
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
            { title: "Inbox", href: `/app/${orgSlug}/inbox`, icon: MessageSquare, badge: "3", badgeType: "number" },
            { title: "Contacts", href: `/app/${orgSlug}/contacts`, icon: UserCheck },
          ],
        },
        {
          id: "operations",
          label: "Operations",
          items: [
            { title: "Tasks & Follow-ups", href: `/app/${orgSlug}/tasks`, icon: CheckSquare },
            { title: "Reports", href: `/app/${orgSlug}/reports`, icon: BarChart3 },
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
              (item) => !["Subscription & Usage", "Organisation Settings"].includes(item.title)
            ),
          };
        }
        return sec;
      });
    }

    return sections;
  }, [orgSlug, userRole, isJuniorManager]);

  const roleLabel =
    userRole === "owner"
      ? "Owner"
      : userRole === "admin"
      ? "Admin"
      : userRole === "senior_manager"
      ? "Sr Manager"
      : "Jr Manager";

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
        "flex h-full flex-col justify-between bg-[#0D0D0E] text-white border-r border-[#1C1C1F] select-none transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        collapsed ? "w-20 px-2.5 py-4" : "w-[272px] px-3.5 py-5"
      )}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Top Header - Logo & Collapse Button */}
        <div
          className={cn(
            "flex items-center pb-5 pt-0.5 transition-all duration-300",
            collapsed ? "flex-col gap-3 items-center justify-center" : "justify-between px-1.5"
          )}
        >
          <Link
            href={`/app/${orgSlug}/overview`}
            className="flex items-center outline-none focus-visible:ring-1 focus-visible:ring-[#FF7900] rounded-lg shrink-0"
            title="Roos StudioX"
          >
            <RoosLogo variant="white" size="md" collapsed={collapsed} />
          </Link>

          <button
            type="button"
            onClick={toggleCollapsed}
            className="text-[#71717A] hover:text-white transition-colors p-1.5 rounded-lg hover:bg-[#1A1A1E] cursor-pointer shrink-0"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Sections */}
        <nav
          className="flex-1 overflow-y-auto space-y-4 pr-0.5 custom-dark-scroll"
          aria-label="Sidebar Navigation"
        >
          {navSections.map((section, sIdx) => (
            <div key={section.id} className="space-y-1">
              {/* Category Header or Divider */}
              {!collapsed ? (
                <div className="px-2.5 pt-2 pb-1 text-[10px] tracking-wider uppercase font-medium text-[#71717A]">
                  {section.label}
                </div>
              ) : sIdx > 0 ? (
                <div className="my-2 border-t border-[#1C1C20] mx-1.5" />
              ) : null}

              {/* Items in this category */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === `/app/${orgSlug}/overview`
                      ? pathname === item.href
                      : pathname.startsWith(item.href);

                  return (
                    <div key={item.href} className="relative">
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        onMouseEnter={(e) => handleMouseEnterItem(e, item)}
                        onMouseLeave={handleMouseLeaveItem}
                        className={cn(
                          "group relative flex items-center rounded-xl text-[13px] font-medium transition-all duration-200 outline-none",
                          collapsed
                            ? "h-10 w-10 mx-auto justify-center"
                            : "h-9.5 px-3 w-full",
                          isActive
                            ? "bg-[#18181C] text-white border border-[#27272F] shadow-2xs font-semibold"
                            : "text-[#9CA3AF] hover:text-white hover:bg-[#141417] border border-transparent"
                        )}
                        aria-label={item.title}
                      >
                        {/* Active Accent Pill */}
                        {isActive && (
                          <span
                            className={cn(
                              "absolute rounded-full bg-[#FF7900] shadow-[0_0_8px_rgba(255,121,0,0.5)] transition-all",
                              collapsed
                                ? "-left-1 top-1/2 -translate-y-1/2 h-4 w-1"
                                : "left-0 top-1/2 -translate-y-1/2 h-5 w-1"
                            )}
                          />
                        )}

                        {/* Icon */}
                        <Icon
                          className={cn(
                            "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
                            isActive ? "text-[#FF7900]" : "text-[#71717A] group-hover:text-white",
                            !collapsed && "mr-3"
                          )}
                        />

                        {/* Label (Expanded mode) */}
                        {!collapsed && (
                          <span
                            className={cn(
                              "flex-1 truncate tracking-tight transition-colors",
                              isActive ? "text-white" : "text-[#D1D5DB] group-hover:text-white"
                            )}
                          >
                            {item.title}
                          </span>
                        )}

                        {/* Badge (Expanded mode) */}
                        {!collapsed && item.badge && (
                          <span className="ml-auto text-white leading-none shrink-0 font-medium bg-[#FF7900] text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                            {item.badge}
                          </span>
                        )}

                        {/* Unread indicator dot (Collapsed mode) */}
                        {collapsed && item.badge && (
                          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#FF7900] ring-2 ring-[#0D0D0E]" />
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
          className="pointer-events-none fixed left-[84px] z-50 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141417] text-white border border-[#27272E] shadow-2xl text-xs font-medium whitespace-nowrap animate-in fade-in zoom-in-95 duration-150"
          style={{ top: `${hoveredItem.top}px`, transform: "translateY(-50%)" }}
        >
          <span>{hoveredItem.title}</span>
          {hoveredItem.badge && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#FF7900] text-white font-medium">
              {hoveredItem.badge}
            </span>
          )}
        </div>
      )}

      {/* Bottom Organization Profile & Account Section */}
      <div className="pt-3 border-t border-[#1C1C1F] relative mt-2">
        <button
          type="button"
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className={cn(
            "flex items-center rounded-xl bg-[#121214] hover:bg-[#18181B] border border-[#232326] hover:border-[#2E2E33] transition-all cursor-pointer w-full text-left outline-none p-2",
            collapsed ? "justify-center" : "justify-between"
          )}
          title="Account profile & workspace settings"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* User Avatar Circle */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1C1C20] text-[#FF7900] border border-[#2B2B33] font-medium text-xs shadow-2xs">
              P
            </div>

            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-white truncate leading-tight">
                    Praveen
                  </span>
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#1C1C20] text-[#A1A1AA] border border-[#2A2A30]">
                    {roleLabel}
                  </span>
                </div>
                <span className="text-[11px] text-[#71717A] truncate mt-0.5">
                  {currentOrg.name}
                </span>
              </div>
            )}
          </div>

          {!collapsed && (
            <ChevronDown className="h-3.5 w-3.5 text-[#71717A] shrink-0 ml-1" />
          )}
        </button>

        {/* User / Workspace Dropdown Menu */}
        {userMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setUserMenuOpen(false)}
            />
            <div
              className={cn(
                "absolute z-50 rounded-2xl border border-[#27272A] bg-[#121214] p-2 shadow-2xl text-white backdrop-blur-xl animate-in fade-in zoom-in-95",
                collapsed ? "left-full bottom-0 ml-3 w-60" : "bottom-full mb-2 left-0 right-0"
              )}
            >
              <div className="px-3 py-2 border-b border-[#1F1F23] mb-1">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-[#FF7900]/10 text-[#FF7900] flex items-center justify-center text-xs font-semibold">
                    P
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Praveen</p>
                    <p className="text-[10px] text-[#8E8E93] truncate">praveen@roosstudiox.com</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-[#A1A1AA] font-mono">
                  <span>Workspace:</span>
                  <span className="text-white font-medium">{currentOrg.name}</span>
                </div>
              </div>

              {/* Clearance Level Switcher */}
              <div className="p-1 space-y-1">
                <div className="text-[10px] uppercase font-mono text-[#71717A] px-2 py-0.5">
                  Clearance Level
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUserRole("admin");
                    setUserMenuOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer",
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
                  type="button"
                  onClick={() => {
                    setUserRole("senior_manager");
                    setUserMenuOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer",
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
                  type="button"
                  onClick={() => {
                    setUserRole("junior_manager");
                    setUserMenuOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer",
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
                Workspace Settings
              </Link>

              <Link
                href="/login"
                onClick={() => setUserMenuOpen(false)}
                className="w-full flex items-center px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors font-medium cursor-pointer"
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
          type="button"
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
          <div className="relative w-68 max-w-[85vw] h-full z-50 bg-[#0D0D0E] shadow-2xl">
            <button
              type="button"
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
