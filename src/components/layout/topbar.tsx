"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTenant } from "@/lib/organizations/tenant-context";
import { crmStore } from "@/lib/crm/crm-store";
import {
  Building2,
  ChevronDown,
  Check,
  Search,
  Bell,
  X,
  MessageSquare,
  Users,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Send,
  Filter,
  FileText,
  Zap,
  BarChart3,
  Shield,
  Smartphone,
  Sliders,
  CreditCard,
} from "lucide-react";
import { cn, formatINR } from "@/lib/utils";

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
  const router = useRouter();
  const { currentOrg, organizations } = useTenant();

  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Derive route title and breadcrumb from pathname
  const currentBreadcrumb = useMemo(() => {
    if (pathname.includes("/overview")) return { section: "Workspace", page: "Overview" };
    if (pathname.includes("/inbox")) return { section: "Workspace", page: "WhatsApp" };
    if (pathname.includes("/leads")) return { section: "Workspace", page: "Sales Pipeline" };
    if (pathname.includes("/contacts")) return { section: "Workspace", page: "Contacts" };
    if (pathname.includes("/campaigns")) return { section: "Engagement", page: "Broadcasts" };
    if (pathname.includes("/templates")) return { section: "Engagement", page: "Templates" };
    if (pathname.includes("/automations")) return { section: "Engagement", page: "Automations" };
    if (pathname.includes("/tasks")) return { section: "Operations", page: "Tasks & SLAs" };
    if (pathname.includes("/reports")) return { section: "Operations", page: "Analytics & Reports" };
    if (pathname.includes("/team")) return { section: "Operations", page: "Team Roster" };
    if (pathname.includes("/whatsapp")) return { section: "Configuration", page: "WhatsApp API" };
    if (pathname.includes("/settings/ai")) return { section: "Configuration", page: "AI Engine" };
    if (pathname.includes("/settings/admin")) return { section: "Configuration", page: "Integrations" };
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
      subtitle: "Review proposal terms for Sneha Reddy (Fleet Management)",
      time: "1h ago",
      read: false,
      type: "task",
      href: `/app/${currentOrg.slug}/tasks`,
    },
    {
      id: "n-3",
      title: "Opportunity Qualified",
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

  // Search Results for Command Palette
  const searchResults = useMemo(() => {
    const query = commandSearch.toLowerCase().trim();
    if (!query) {
      return {
        leads: [],
        contacts: [],
        pages: [
          { name: "Overview", href: `/app/${currentOrg.slug}/overview`, icon: Sparkles },
          { name: "WhatsApp", href: `/app/${currentOrg.slug}/inbox`, icon: MessageSquare },
          { name: "Sales Pipeline", href: `/app/${currentOrg.slug}/leads`, icon: Filter },
          { name: "Contacts", href: `/app/${currentOrg.slug}/contacts`, icon: Users },
          { name: "Broadcasts", href: `/app/${currentOrg.slug}/campaigns`, icon: Send },
          { name: "Templates", href: `/app/${currentOrg.slug}/templates`, icon: FileText },
          { name: "Automations", href: `/app/${currentOrg.slug}/automations`, icon: Zap },
          { name: "Tasks & SLAs", href: `/app/${currentOrg.slug}/tasks`, icon: CheckCircle2 },
          { name: "Analytics & Reports", href: `/app/${currentOrg.slug}/reports`, icon: BarChart3 },
          { name: "Team Roster", href: `/app/${currentOrg.slug}/team`, icon: Shield },
          { name: "WhatsApp API", href: `/app/${currentOrg.slug}/whatsapp`, icon: Smartphone },
          { name: "AI Engine", href: `/app/${currentOrg.slug}/settings/ai`, icon: Sparkles },
          { name: "Integrations", href: `/app/${currentOrg.slug}/settings/admin`, icon: Sliders },
          { name: "Subscription & Limits", href: `/app/${currentOrg.slug}/subscription`, icon: CreditCard },
          { name: "Organisation Details", href: `/app/${currentOrg.slug}/settings`, icon: Building2 },
        ],
      };
    }

    const leads = crmStore
      .getLeads(currentOrg.slug)
      .filter((l) => l.title.toLowerCase().includes(query) || (l.contact_name && l.contact_name.toLowerCase().includes(query)))
      .slice(0, 5);

    const contacts = crmStore
      .getContacts(currentOrg.slug)
      .filter((c) => `${c.first_name} ${c.last_name || ""}`.toLowerCase().includes(query) || c.phone.includes(query))
      .slice(0, 5);

    const allPages = [
      { name: "Overview", href: `/app/${currentOrg.slug}/overview` },
      { name: "WhatsApp", href: `/app/${currentOrg.slug}/inbox` },
      { name: "Sales Pipeline", href: `/app/${currentOrg.slug}/leads` },
      { name: "Contacts", href: `/app/${currentOrg.slug}/contacts` },
      { name: "Broadcasts", href: `/app/${currentOrg.slug}/campaigns` },
      { name: "Templates", href: `/app/${currentOrg.slug}/templates` },
      { name: "Automations", href: `/app/${currentOrg.slug}/automations` },
      { name: "Tasks & SLAs", href: `/app/${currentOrg.slug}/tasks` },
      { name: "Analytics & Reports", href: `/app/${currentOrg.slug}/reports` },
      { name: "Team Roster", href: `/app/${currentOrg.slug}/team` },
      { name: "WhatsApp API", href: `/app/${currentOrg.slug}/whatsapp` },
      { name: "AI Engine", href: `/app/${currentOrg.slug}/settings/ai` },
      { name: "Integrations", href: `/app/${currentOrg.slug}/settings/admin` },
      { name: "Subscription & Limits", href: `/app/${currentOrg.slug}/subscription` },
      { name: "Organisation Details", href: `/app/${currentOrg.slug}/settings` },
    ];

    const pages = allPages.filter((p) => p.name.toLowerCase().includes(query)).slice(0, 4);

    return { leads, contacts, pages };
  }, [commandSearch, currentOrg.slug]);

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-[56px] shrink-0 items-center justify-between border-b border-[#EDE8E0] bg-[#F7F3EE]/90 backdrop-blur-md px-6 select-none lg:ml-[var(--sidebar-width,244px)] transition-[margin] duration-160">
        {/* Left: Contextual Breadcrumb */}
        <div className="flex items-center gap-2 text-[14px]">
          <span className="text-[#666C78] font-normal">
            {currentBreadcrumb.section}
          </span>
          <span className="text-[#DCD6CC] select-none font-normal">/</span>
          <span className="font-medium text-[#12141A]">
            {currentBreadcrumb.page}
          </span>
        </div>

        {/* Center-Right: Controls */}
        <div className="flex items-center gap-3">
          {/* Command Palette Trigger (Cmd+K) */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden sm:flex items-center justify-between w-64 h-9 px-3 rounded-[12px] bg-white border border-[#EDE8E0] text-[14px] text-[#666C78] hover:border-[#DCD6CC] hover:text-[#12141A] shadow-[0_1px_2px_rgba(11,13,18,0.04)] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-[#666C78]" />
              <span className="text-[14px]">Search, jump to...</span>
            </div>
            <kbd className="inline-flex items-center rounded-[6px] border border-[#EDE8E0] bg-[#F7F3EE] px-1.5 py-0.5 text-[12px] text-[#666C78] font-variant-numeric tabular-nums">
              ⌘K
            </kbd>
          </button>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              className="relative flex h-9 w-9 items-center justify-center rounded-[12px] border border-[#EDE8E0] bg-white text-[#454B57] hover:text-[#12141A] hover:bg-[#F7F3EE] transition-all shadow-[0_1px_2px_rgba(11,13,18,0.04)] cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#FF5A1F]" />
              )}
            </button>

            {/* Notifications Popover */}
            {notificationsOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setNotificationsOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 z-50 w-88 rounded-[20px] border border-[#E6E2D8] bg-white p-3.5 shadow-overlay animate-reveal text-[#12141A]">
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#E6E2D8] mb-2">
                    <span className="text-[14px] font-medium text-[#12141A]">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsAsRead}
                        className="text-[13px] text-[#FF5A1F] hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.href}
                        onClick={() => setNotificationsOpen(false)}
                        className={cn(
                          "block p-2.5 rounded-[12px] hover:bg-[#F7F5F0] transition-colors text-left",
                          !n.read && "bg-[#FFF1EA]/60"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-medium text-[#12141A]">
                            {n.title}
                          </span>
                          <span className="text-[13px] text-[#666C78]">
                            {n.time}
                          </span>
                        </div>
                        <p className="text-[13px] text-[#454B57] mt-0.5 truncate">
                          {n.subtitle}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Workspace Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOrgDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 h-9 px-3 rounded-[12px] border border-[#EDE8E0] bg-white text-[14px] font-medium text-[#12141A] hover:bg-[#F7F3EE] transition-colors shadow-[0_1px_2px_rgba(11,13,18,0.04)] cursor-pointer"
            >
              <div className="h-5 w-5 rounded-[6px] bg-[#12151C] text-white flex items-center justify-center text-[10px] font-semibold">
                {currentOrg.name.charAt(0)}
              </div>
              <span className="max-w-[140px] truncate">{currentOrg.name}</span>
              <ChevronDown className="h-3.5 w-3.5 text-[#666C78]" />
            </button>

            {/* Workspace Dropdown */}
            {orgDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setOrgDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-[16px] border border-[#E6E2D8] bg-white p-2 shadow-overlay text-[#12141A] animate-reveal">
                  <div className="px-2.5 py-1 text-[13px] font-medium text-[#666C78] uppercase tracking-[0.06em]">
                    Workspaces
                  </div>
                  {organizations.map((org) => {
                    const isSelected = org.slug === currentOrg.slug;
                    return (
                      <button
                        key={org.id}
                        type="button"
                        onClick={() => {
                          setOrgDropdownOpen(false);
                          if (!isSelected) {
                            router.push(`/app/${org.slug}/overview`);
                          }
                        }}
                        className={cn(
                          "flex items-center justify-between w-full px-3 py-2 rounded-[8px] text-[14px] text-left transition-colors",
                          isSelected
                            ? "bg-[#F7F5F0] text-[#12141A] font-medium"
                            : "text-[#454B57] hover:bg-[#F7F5F0] hover:text-[#12141A]"
                        )}
                      >
                        <span className="truncate">{org.name}</span>
                        {isSelected && (
                          <Check className="h-4 w-4 text-[#FF5A1F] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ⌘K Command Palette Modal */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div
            className="fixed inset-0 bg-[#0B0D12]/50 backdrop-blur-xs"
            onClick={() => setCommandPaletteOpen(false)}
          />
          <div className="relative w-full max-w-xl rounded-[14px] border border-[#E4E1D8] bg-white shadow-overlay overflow-hidden animate-reveal text-[#12141A]">
            {/* Input Header */}
            <div className="flex items-center px-4 py-3 border-b border-[#E4E1D8]">
              <Search className="h-4 w-4 text-[#6A707C] mr-3 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={commandSearch}
                onChange={(e) => setCommandSearch(e.target.value)}
                placeholder="Type a command, page, lead or contact..."
                className="w-full text-[14px] bg-transparent outline-none placeholder:text-[#6A707C] text-[#12141A]"
              />
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(false)}
                className="text-[#6A707C] hover:text-[#12141A] ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-3">
              {searchResults.leads.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[12px] font-medium text-[#666C78] uppercase tracking-[0.06em]">
                    Opportunities
                  </div>
                  {searchResults.leads.map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/app/${currentOrg.slug}/leads?leadId=${lead.id}`}
                      onClick={() => setCommandPaletteOpen(false)}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-[12px] hover:bg-[#F7F5F0] transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Filter className="h-4 w-4 text-[#12B886]" />
                        <span className="text-[14px] font-medium text-[#12141A] truncate">
                          {lead.title}
                        </span>
                        {lead.contact_name && (
                          <span className="text-[13px] text-[#666C78]">
                            ({lead.contact_name})
                          </span>
                        )}
                      </div>
                      <span className="text-[14px] font-medium text-[#0A7A53] font-variant-numeric tabular-nums">
                        {formatINR(lead.estimated_value || 0)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {searchResults.contacts.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[12px] font-medium text-[#666C78] uppercase tracking-[0.06em]">
                    Contacts
                  </div>
                  {searchResults.contacts.map((contact) => (
                    <Link
                      key={contact.id}
                      href={`/app/${currentOrg.slug}/contacts?contactId=${contact.id}`}
                      onClick={() => setCommandPaletteOpen(false)}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-[12px] hover:bg-[#F7F5F0] transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Users className="h-4 w-4 text-[#1FA2E8]" />
                        <span className="text-[14px] font-medium text-[#12141A]">
                          {contact.first_name} {contact.last_name || ""}
                        </span>
                      </div>
                      <span className="text-[13px] text-[#666C78] font-variant-numeric tabular-nums">
                        {contact.phone}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {searchResults.pages.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[12px] font-medium text-[#666C78] uppercase tracking-[0.06em]">
                    Navigation
                  </div>
                  {searchResults.pages.map((page) => (
                    <Link
                      key={page.href}
                      href={page.href}
                      onClick={() => setCommandPaletteOpen(false)}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-[12px] hover:bg-[#F7F5F0] transition-colors"
                    >
                      <span className="text-[14px] font-medium text-[#12141A]">
                        {page.name}
                      </span>
                      <span className="text-[13px] text-[#666C78]">Jump</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 bg-[#EFEDE7] border-t border-[#E6E2D8] flex items-center justify-between text-[13px] text-[#666C78]">
              <span>Navigate with arrow keys</span>
              <span>ESC to dismiss</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
