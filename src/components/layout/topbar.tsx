"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTenant } from "@/lib/organizations/tenant-context";
import { crmStore } from "@/lib/crm/crm-store";
import {
  Building2,
  ChevronDown,
  LogOut,
  PlusCircle,
  Check,
  User,
  Search,
  Bell,
  X,
  MessageSquare,
  Users,
  CheckSquare,
  Sparkles,
  ArrowRight,
  Command,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  read: boolean;
  type: "inbox" | "task" | "lead" | "system";
  href: string;
}

export function Topbar() {
  const pathname = usePathname();
  const { currentOrg, userRole, organizations } = useTenant();
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Derive route title and breadcrumb from pathname
  const currentBreadcrumb = useMemo(() => {
    if (pathname.includes("/overview")) return { section: "Workspace", page: "Overview" };
    if (pathname.includes("/inbox")) return { section: "Workspace", page: "Shared Inbox" };
    if (pathname.includes("/leads")) return { section: "Workspace", page: "Sales Pipeline" };
    if (pathname.includes("/contacts")) return { section: "Workspace", page: "Contacts Directory" };
    if (pathname.includes("/campaigns")) return { section: "Engagement", page: "Broadcast Campaigns" };
    if (pathname.includes("/templates")) return { section: "Engagement", page: "Message Templates" };
    if (pathname.includes("/automations")) return { section: "Engagement", page: "Automations Engine" };
    if (pathname.includes("/tasks")) return { section: "Operations", page: "Tasks & SLAs" };
    if (pathname.includes("/reports")) return { section: "Operations", page: "Analytics & Reports" };
    if (pathname.includes("/team")) return { section: "Operations", page: "Team Roster" };
    if (pathname.includes("/whatsapp")) return { section: "Configuration", page: "WhatsApp Cloud API" };
    if (pathname.includes("/settings/ai")) return { section: "Configuration", page: "AI Engine" };
    if (pathname.includes("/settings/admin")) return { section: "Configuration", page: "Integrations & API" };
    if (pathname.includes("/subscription")) return { section: "Configuration", page: "Subscription & Limits" };
    if (pathname.includes("/settings")) return { section: "Configuration", page: "Organisation Details" };
    return { section: "Roos StudioX", page: "Business OS" };
  }, [pathname]);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "n-1",
      title: "New WhatsApp Inquiry",
      subtitle: "Aarav Patel: 'Interested in the enterprise growth package...'",
      time: "2m ago",
      read: false,
      type: "inbox",
      href: `/app/${currentOrg.slug}/inbox`,
    },
    {
      id: "n-2",
      title: "Follow-up Task Due Today",
      subtitle: "Call Priya Sharma to review tailored proposal quotation",
      time: "1h ago",
      read: false,
      type: "task",
      href: `/app/${currentOrg.slug}/tasks`,
    },
    {
      id: "n-3",
      title: "AI Lead Qualified",
      subtitle: "Vikram Malhotra scored 94/100 (High Commercial Intent)",
      time: "3h ago",
      read: false,
      type: "lead",
      href: `/app/${currentOrg.slug}/leads`,
    },
    {
      id: "n-4",
      title: "Meta Cloud API Connected",
      subtitle: "Webhook ping 100% operational in Mock Sandbox mode",
      time: "1d ago",
      read: true,
      type: "system",
      href: `/app/${currentOrg.slug}/whatsapp`,
    },
  ]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setCommandSearch("");
    }
  }, [commandPaletteOpen]);

  // Search Results
  const searchResults = useMemo(() => {
    if (!commandSearch.trim()) return { leads: [], contacts: [], pages: [] };
    const q = commandSearch.toLowerCase();
    const leads = crmStore.getLeads(currentOrg.slug).filter((l) =>
      l.title.toLowerCase().includes(q) || l.contact_name?.toLowerCase().includes(q)
    ).slice(0, 4);

    const contacts = crmStore.getContacts(currentOrg.slug).filter((c) =>
      c.first_name.toLowerCase().includes(q) || (c.last_name && c.last_name.toLowerCase().includes(q))
    ).slice(0, 4);

    const pages = [
      { name: "Overview Dashboard", href: `/app/${currentOrg.slug}/overview`, category: "Navigation" },
      { name: "Sales Pipeline", href: `/app/${currentOrg.slug}/leads`, category: "Navigation" },
      { name: "WhatsApp Shared Inbox", href: `/app/${currentOrg.slug}/inbox`, category: "Navigation" },
      { name: "Contacts Directory", href: `/app/${currentOrg.slug}/contacts`, category: "Navigation" },
      { name: "Tasks & SLAs", href: `/app/${currentOrg.slug}/tasks`, category: "Navigation" },
      { name: "Broadcast Campaigns", href: `/app/${currentOrg.slug}/campaigns`, category: "Navigation" },
      { name: "Message Templates", href: `/app/${currentOrg.slug}/templates`, category: "Navigation" },
      { name: "Automations Engine", href: `/app/${currentOrg.slug}/automations`, category: "Navigation" },
      { name: "Analytics & Reports", href: `/app/${currentOrg.slug}/reports`, category: "Navigation" },
      { name: "Team Roster", href: `/app/${currentOrg.slug}/team`, category: "Navigation" },
      { name: "WhatsApp Cloud API", href: `/app/${currentOrg.slug}/whatsapp`, category: "Navigation" },
      { name: "Subscription & Limits", href: `/app/${currentOrg.slug}/subscription`, category: "Navigation" },
      { name: "Organisation Details", href: `/app/${currentOrg.slug}/settings`, category: "Navigation" },
    ].filter((p) => p.name.toLowerCase().includes(q));

    return { leads, contacts, pages };
  }, [commandSearch, currentOrg.slug]);

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {}

    document.cookie = "roos_session=; path=/; max-age=0";
    document.cookie = "roos_user_role=; path=/; max-age=0";
    document.cookie = "roos_user_email=; path=/; max-age=0";

    const supabase = createClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }
    window.location.href = "/login?logout=1";
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-13 w-full items-center justify-between border-b border-[#E4E4E7] bg-white px-4 sm:px-6 select-none">
        {/* Left: Breadcrumbs + Contextual Page Title */}
        <div className="flex items-center gap-2 pl-10 lg:pl-0 min-w-0">
          <span className="text-xs text-[#717680] font-normal hidden sm:inline truncate">
            {currentBreadcrumb.section}
          </span>
          <span className="text-xs text-[#D4D4D8] hidden sm:inline">/</span>
          <span className="text-xs font-medium text-[#0D0D0E] truncate">
            {currentBreadcrumb.page}
          </span>
        </div>

        {/* Right: Compact Command Trigger + Workspace Switcher + Alerts + Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Compact Command Trigger (Defect 8 fix) */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-2 h-8 px-2.5 rounded-lg border border-[#E4E4E7] bg-[#FAF9F6] text-xs text-[#717680] hover:text-[#0D0D0E] hover:border-[#D4D4D8] hover:bg-white transition-all duration-140 ease-spring active:scale-95 will-change-transform shadow-2xs cursor-pointer"
            title="Search workspace (⌘K)"
          >
            <Search className="h-3.5 w-3.5 text-[#717680] shrink-0" />
            <span className="hidden md:inline font-normal text-xs text-[#717680]">Search...</span>
            <kbd className="inline-flex items-center gap-0.5 rounded bg-white border border-[#E4E4E7] px-1 py-0.2 text-[10px] text-[#717680]">
              <Command className="h-2.5 w-2.5" />
              <span>K</span>
            </kbd>
          </button>

          {/* Workspace Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setOrgDropdownOpen(!orgDropdownOpen);
                setNotificationsOpen(false);
                setUserMenuOpen(false);
              }}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-[#E4E4E7] bg-white text-xs font-medium text-[#0D0D0E] transition-all duration-140 ease-spring active:scale-95 will-change-transform hover:bg-[#FAF9F6] hover:border-[#D4D4D8] shadow-2xs cursor-pointer"
            >
              <Building2 className="h-3.5 w-3.5 text-[#717680]" />
              <span className="font-medium text-[#0D0D0E] truncate max-w-[120px] sm:max-w-none">
                {currentOrg.name}
              </span>
              <ChevronDown className="h-3 w-3 text-[#717680]" />
            </button>

            {orgDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOrgDropdownOpen(false)} />
                <div className="absolute right-0 mt-1.5 z-50 w-56 rounded-xl border border-[#E4E4E7] bg-white p-1.5 shadow-dropdown animate-page-enter">
                  <div className="px-2.5 py-1 type-eyebrow text-[#717680]">
                    Workspaces
                  </div>
                  <div className="space-y-0.5">
                    {organizations.map((org) => {
                      const isCurrent = org.id === currentOrg.id;
                      return (
                        <Link
                          key={org.id}
                          href={`/app/${org.slug}/overview`}
                          onClick={() => setOrgDropdownOpen(false)}
                          className={cn(
                            "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors duration-140",
                            isCurrent
                              ? "bg-[#FFF4EC] text-[#FF7A1A] border border-[#FFD8BF]"
                              : "text-[#525866] hover:bg-[#FAF9F6] hover:text-[#0D0D0E]"
                          )}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{org.name}</span>
                          </div>
                          {isCurrent && <Check className="h-3.5 w-3.5 text-[#FF7A1A] shrink-0" />}
                        </Link>
                      );
                    })}
                  </div>

                  <div className="my-1 border-t border-[#E4E4E7]" />

                  <Link
                    href="/select-org"
                    onClick={() => setOrgDropdownOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#FF7A1A] hover:bg-[#FFF4EC] transition-colors"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>Create workspace</span>
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setOrgDropdownOpen(false);
                setUserMenuOpen(false);
              }}
              className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4E4E7] bg-white text-[#717680] hover:bg-[#FAF9F6] hover:text-[#0D0D0E] transition-all duration-140 ease-spring active:scale-95 will-change-transform cursor-pointer shadow-2xs"
              aria-label="Notifications"
            >
              <Bell className="h-3.5 w-3.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#FF7A1A] ring-2 ring-white" />
              )}
            </button>

            {notificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                <div className="absolute right-0 mt-1.5 z-50 w-80 sm:w-88 rounded-xl border border-[#E4E4E7] bg-white p-2.5 shadow-dropdown animate-page-enter space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#E4E4E7] px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#0D0D0E]">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-[#FF7A1A] text-white text-[10px] font-medium px-1.5 py-0.2">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-[11px] font-medium text-[#FF7A1A] hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-1 pr-1 custom-light-scroll">
                    {notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.href}
                        onClick={() => setNotificationsOpen(false)}
                        className={cn(
                          "flex items-start gap-2.5 rounded-lg p-2 transition-colors border text-xs",
                          n.read
                            ? "bg-white border-transparent hover:bg-[#FAF9F6]"
                            : "bg-[#FFF4EC]/30 border-[#FFD8BF] hover:bg-[#FFF4EC]/60"
                        )}
                      >
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white border border-[#E4E4E7]">
                          {n.type === "inbox" && <MessageSquare className="h-3 w-3 text-emerald-600" />}
                          {n.type === "task" && <CheckSquare className="h-3 w-3 text-amber-600" />}
                          {n.type === "lead" && <Users className="h-3 w-3 text-blue-600" />}
                          {n.type === "system" && <Sparkles className="h-3 w-3 text-purple-600" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-[#0D0D0E] truncate">{n.title}</span>
                            <span className="text-[10px] text-[#717680]">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-[#525866] mt-0.5 line-clamp-1 leading-snug font-normal">
                            {n.subtitle}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="pt-1.5 border-t border-[#E4E4E7] text-center">
                    <Link
                      href={`/app/${currentOrg.slug}/tasks`}
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs font-medium text-[#FF7A1A] hover:underline transition-colors"
                    >
                      View all tasks & updates →
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile Avatar */}
          <div className="relative">
            <button
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                setOrgDropdownOpen(false);
                setNotificationsOpen(false);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E4E4E7] bg-[#0D0D0E] text-white font-medium text-xs shadow-2xs cursor-pointer transition-all duration-140 ease-spring active:scale-95 will-change-transform hover:ring-1 hover:ring-[#FF7A1A]/40 overflow-hidden"
              title="User Account"
            >
              <User className="h-3.5 w-3.5 text-white" />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 mt-1.5 z-50 w-48 rounded-xl border border-[#E4E4E7] bg-white p-1.5 shadow-dropdown animate-page-enter">
                  <div className="px-2.5 py-1.5 border-b border-[#E4E4E7] mb-1">
                    <p className="text-xs font-medium text-[#0D0D0E]">Praveen</p>
                    <p className="text-[11px] text-[#717680] truncate font-normal">{currentOrg.name}</p>
                    <span className="inline-block mt-1 text-[10px] uppercase font-medium text-[#FF7A1A] bg-[#FFF4EC] px-1.5 py-0.2 rounded border border-[#FFD8BF]">
                      {userRole.replace("_", " ")}
                    </span>
                  </div>

                  <Link
                    href={`/app/${currentOrg.slug}/settings`}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center px-2.5 py-1.5 text-xs text-[#525866] hover:bg-[#FAF9F6] hover:text-[#0D0D0E] rounded-lg transition-colors font-medium"
                  >
                    <User className="mr-2 h-3.5 w-3.5 text-[#717680]" />
                    Settings
                  </Link>

                  <div className="my-1 border-t border-[#E4E4E7]" />

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium cursor-pointer"
                  >
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Interactive Command Palette Modal (Cmd+K / Ctrl+K) */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-120">
          <div className="fixed inset-0" onClick={() => setCommandPaletteOpen(false)} />

          <div className="relative w-full max-w-lg bg-white rounded-xl border border-[#E4E4E7] shadow-dropdown overflow-hidden z-10 animate-page-enter">
            {/* Search Input Bar */}
            <div className="flex items-center px-3.5 py-2.5 border-b border-[#E4E4E7]">
              <Search className="h-4 w-4 text-[#FF7A1A] mr-2.5 shrink-0" />
              <input
                ref={searchInputRef}
                value={commandSearch}
                onChange={(e) => setCommandSearch(e.target.value)}
                placeholder="Search leads, contacts, pages..."
                className="w-full text-xs font-medium text-[#0D0D0E] placeholder:text-[#717680] outline-none bg-transparent"
              />
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(false)}
                className="p-1 rounded-md text-[#717680] hover:text-[#0D0D0E] hover:bg-[#FAF9F6] cursor-pointer"
                aria-label="Close command palette"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Results Area */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-2 custom-light-scroll">
              {!commandSearch.trim() && (
                <div className="space-y-0.5">
                  <div className="px-2.5 py-1 type-eyebrow text-[#717680]">
                    Quick Jumps
                  </div>
                  {[
                    { name: "Overview Dashboard", href: `/app/${currentOrg.slug}/overview`, icon: Building2 },
                    { name: "WhatsApp Shared Inbox", href: `/app/${currentOrg.slug}/inbox`, icon: MessageSquare },
                    { name: "Sales Pipeline", href: `/app/${currentOrg.slug}/leads`, icon: Users },
                    { name: "Tasks & SLAs", href: `/app/${currentOrg.slug}/tasks`, icon: CheckSquare },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setCommandPaletteOpen(false)}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#525866] hover:bg-[#FAF9F6] hover:text-[#0D0D0E] transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-[#717680] group-hover:text-[#FF7A1A]" />
                          <span>{item.name}</span>
                        </div>
                        <ArrowRight className="h-3 w-3 text-[#D4D4D8] group-hover:text-[#717680]" />
                      </Link>
                    );
                  })}
                </div>
              )}

              {searchResults.leads.length > 0 && (
                <div className="space-y-0.5">
                  <div className="px-2.5 py-1 type-eyebrow text-[#717680]">
                    Leads ({searchResults.leads.length})
                  </div>
                  {searchResults.leads.map((l) => (
                    <Link
                      key={l.id}
                      href={`/app/${currentOrg.slug}/leads?leadId=${l.id}`}
                      onClick={() => setCommandPaletteOpen(false)}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#525866] hover:bg-[#FAF9F6] hover:text-[#0D0D0E] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Users className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span className="font-medium text-[#0D0D0E] truncate">{l.title}</span>
                        {l.contact_name && (
                          <span className="text-[11px] text-[#717680] truncate">({l.contact_name})</span>
                        )}
                      </div>
                      <span className="text-[11px] text-emerald-600 font-medium shrink-0">
                        ₹{(l.estimated_value || 0).toLocaleString()}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {searchResults.contacts.length > 0 && (
                <div className="space-y-0.5">
                  <div className="px-2.5 py-1 type-eyebrow text-[#717680]">
                    Contacts ({searchResults.contacts.length})
                  </div>
                  {searchResults.contacts.map((c) => (
                    <Link
                      key={c.id}
                      href={`/app/${currentOrg.slug}/contacts?contactId=${c.id}`}
                      onClick={() => setCommandPaletteOpen(false)}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#525866] hover:bg-[#FAF9F6] hover:text-[#0D0D0E] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="h-5 w-5 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center text-[10px] font-medium shrink-0">
                          {c.first_name[0]}
                        </div>
                        <span className="font-medium text-[#0D0D0E] truncate">
                          {c.first_name} {c.last_name || ""}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#717680] font-normal">
                        {c.phone}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {searchResults.pages.length > 0 && (
                <div className="space-y-0.5">
                  <div className="px-2.5 py-1 type-eyebrow text-[#717680]">
                    Pages ({searchResults.pages.length})
                  </div>
                  {searchResults.pages.map((p) => (
                    <Link
                      key={p.href}
                      href={p.href}
                      onClick={() => setCommandPaletteOpen(false)}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#525866] hover:bg-[#FAF9F6] hover:text-[#0D0D0E] transition-colors cursor-pointer"
                    >
                      <span className="font-medium text-[#0D0D0E]">{p.name}</span>
                      <span className="text-[10px] text-[#717680]">Jump</span>
                    </Link>
                  ))}
                </div>
              )}

              {commandSearch.trim() &&
                searchResults.leads.length === 0 &&
                searchResults.contacts.length === 0 &&
                searchResults.pages.length === 0 && (
                  <div className="p-6 text-center text-xs text-[#717680] font-medium">
                    No results found for &quot;{commandSearch}&quot;
                  </div>
                )}
            </div>

            {/* Footer Hints */}
            <div className="bg-[#FAF9F6] px-3.5 py-2 border-t border-[#E4E4E7] flex items-center justify-between text-[11px] text-[#717680]">
              <span>Navigate with arrow keys</span>
              <span>ESC to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
