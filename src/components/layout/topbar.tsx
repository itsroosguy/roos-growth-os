"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { currentOrg, userRole, setUserRole, organizations } = useTenant();
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);

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
      { name: "Tasks & Follow-ups", href: `/app/${currentOrg.slug}/tasks`, category: "Navigation" },
      { name: "Broadcast Campaigns", href: `/app/${currentOrg.slug}/campaigns`, category: "Navigation" },
      { name: "Message Templates", href: `/app/${currentOrg.slug}/templates`, category: "Navigation" },
      { name: "Automations Engine", href: `/app/${currentOrg.slug}/automations`, category: "Navigation" },
      { name: "Sales Reports", href: `/app/${currentOrg.slug}/reports`, category: "Navigation" },
      { name: "WhatsApp Cloud API", href: `/app/${currentOrg.slug}/whatsapp`, category: "Navigation" },
      { name: "Subscription & Limits", href: `/app/${currentOrg.slug}/subscription`, category: "Navigation" },
    ].filter((p) => p.name.toLowerCase().includes(q));

    return { leads, contacts, pages };
  }, [commandSearch, currentOrg.slug]);

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      // Ignore network errors on logout
    }

    document.cookie = "roos_session=; path=/; max-age=0";
    document.cookie = "roos_user_role=; path=/; max-age=0";
    document.cookie = "roos_user_email=; path=/; max-age=0";

    const supabase = createClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // Ignore
      }
    }
    window.location.href = "/login?logout=1";
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-[#E5E7EB] bg-white px-4 sm:px-6 select-none">
        {/* Global Search Input */}
        <div className="relative w-64 sm:w-80 md:w-96 pl-10 lg:pl-0">
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="flex w-full items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F8F9FA] px-3 py-1.5 text-xs text-slate-500 hover:border-[#D1D5DB] hover:bg-white hover:text-slate-800 transition-colors shadow-2xs cursor-pointer"
          >
            <div className="flex items-center space-x-2 truncate">
              <Search className="h-3.5 w-3.5 text-[#717680] shrink-0" />
              <span className="truncate text-[#94A3B8] font-normal text-xs">
                Search leads, contacts, threads...
              </span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded bg-white border border-[#E5E7EB] px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500">
              ⌘ K
            </kbd>
          </button>
        </div>

        {/* Right Section Controls */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Organization Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setOrgDropdownOpen(!orgDropdownOpen);
                setNotificationsOpen(false);
                setUserMenuOpen(false);
              }}
              className="flex items-center space-x-2 rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 transition-all hover:bg-[#F8F9FA] hover:border-[#D1D5DB] shadow-2xs cursor-pointer h-8.5"
            >
              <Building2 className="h-3.5 w-3.5 text-[#717680]" />
              <span className="font-medium text-slate-900 truncate max-w-[130px] sm:max-w-none">
                {currentOrg.name}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {orgDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOrgDropdownOpen(false)} />
                <div className="absolute right-0 mt-1.5 z-50 w-60 rounded-xl border border-[#E5E7EB] bg-white p-1.5 shadow-dropdown animate-page-enter">
                  <div className="px-2.5 py-1 type-utility text-[#717680]">
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
                            "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                            isCurrent
                              ? "bg-[#FFF9F5] text-[#FF7900] border border-[#FF7900]/20"
                              : "text-slate-700 hover:bg-[#F8F9FA] hover:text-slate-950"
                          )}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <Building2 className="h-3.5 w-3.5" />
                            <span className="truncate">{org.name}</span>
                          </div>
                          {isCurrent && <Check className="h-3.5 w-3.5 text-[#FF7900] shrink-0" />}
                        </Link>
                      );
                    })}
                  </div>

                  <div className="my-1 border-t border-[#E5E7EB]" />

                  <Link
                    href="/select-org"
                    onClick={() => setOrgDropdownOpen(false)}
                    className="flex items-center space-x-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#FF7900] hover:bg-[#FF7900]/10 transition-colors"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>Create new organisation</span>
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
              className="relative flex h-8.5 w-8.5 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-slate-600 hover:bg-[#F8F9FA] hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 text-[#717680]" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#FF7900] ring-2 ring-white" />
              )}
            </button>

            {notificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                <div className="absolute right-0 mt-1.5 z-50 w-80 sm:w-92 rounded-xl border border-[#E5E7EB] bg-white p-2.5 shadow-dropdown animate-page-enter space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#E5E7EB] px-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-slate-900">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-[#FF7900] text-white text-[10px] font-medium px-1.5 py-0.2">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-[11px] font-medium text-[#FF7900] hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                    {notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.href}
                        onClick={() => setNotificationsOpen(false)}
                        className={cn(
                          "flex items-start space-x-2.5 rounded-lg p-2 transition-colors border",
                          n.read
                            ? "bg-white border-transparent hover:bg-[#F8F9FA]"
                            : "bg-[#FFF9F5] border-[#FF7900]/20 hover:bg-[#FFF5ED]"
                        )}
                      >
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white border border-slate-200">
                          {n.type === "inbox" && <MessageSquare className="h-3 w-3 text-emerald-600" />}
                          {n.type === "task" && <CheckSquare className="h-3 w-3 text-amber-600" />}
                          {n.type === "lead" && <Users className="h-3 w-3 text-blue-600" />}
                          {n.type === "system" && <Sparkles className="h-3 w-3 text-purple-600" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-900 truncate">{n.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono font-normal">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1 leading-snug font-normal">
                            {n.subtitle}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="pt-1.5 border-t border-[#E5E7EB] text-center">
                    <Link
                      href={`/app/${currentOrg.slug}/tasks`}
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs font-medium text-[#FF7900] hover:underline transition-colors"
                    >
                      View all tasks & updates →
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile Avatar with dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                setOrgDropdownOpen(false);
                setNotificationsOpen(false);
              }}
              className="flex h-8.5 w-8.5 items-center justify-center rounded-full border border-slate-300 bg-slate-900 text-white font-medium text-xs shadow-2xs cursor-pointer hover:ring-2 hover:ring-[#FF7900]/30 transition-all overflow-hidden"
              title="User Account"
            >
              <User className="h-4 w-4 text-slate-200" />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 mt-1.5 z-50 w-52 rounded-xl border border-[#E5E7EB] bg-white p-1.5 shadow-dropdown animate-page-enter">
                  <div className="px-2.5 py-2 border-b border-[#E5E7EB] mb-1">
                    <p className="text-xs font-medium text-slate-900">Signed in</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate font-normal">{currentOrg.name}</p>
                    <span className="inline-block mt-1 text-[10px] uppercase font-medium text-[#FF7900] bg-[#FF7900]/10 px-2 py-0.5 rounded-full">
                      {userRole.replace("_", " ")}
                    </span>
                  </div>

                  <Link
                    href={`/app/${currentOrg.slug}/settings`}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center px-2.5 py-1.5 text-xs text-slate-700 hover:bg-[#F8F9FA] rounded-lg transition-colors font-medium"
                  >
                    <User className="mr-2 h-3.5 w-3.5 text-slate-400" />
                    Account Settings
                  </Link>

                  <div className="my-1 border-t border-[#E5E7EB]" />

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
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-120">
          <div
            className="fixed inset-0"
            onClick={() => setCommandPaletteOpen(false)}
          />

          <div className="relative w-full max-w-xl bg-white rounded-xl border border-[#E5E7EB] shadow-floating overflow-hidden z-10 animate-page-enter">
            {/* Search Input Bar */}
            <div className="flex items-center px-3.5 py-3 border-b border-[#E5E7EB]">
              <Search className="h-4 w-4 text-[#FF7900] mr-2.5 shrink-0" />
              <input
                ref={searchInputRef}
                value={commandSearch}
                onChange={(e) => setCommandSearch(e.target.value)}
                placeholder="Type a command or search leads, contacts, pages..."
                className="w-full text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
              />
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                aria-label="Close command palette"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Results Area */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-3">
              {/* If no search typed, show quick shortcuts */}
              {!commandSearch.trim() && (
                <div className="space-y-1">
                  <div className="px-2.5 py-1 type-utility text-[#717680]">
                    Quick Jumps
                  </div>
                  {[
                    { name: "Overview Dashboard", href: `/app/${currentOrg.slug}/overview`, icon: Building2 },
                    { name: "WhatsApp Shared Inbox", href: `/app/${currentOrg.slug}/inbox`, icon: MessageSquare },
                    { name: "Sales Pipeline", href: `/app/${currentOrg.slug}/leads`, icon: Users },
                    { name: "Tasks & Follow-ups", href: `/app/${currentOrg.slug}/tasks`, icon: CheckSquare },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setCommandPaletteOpen(false)}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-[#F8F9FA] hover:text-slate-950 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center space-x-2.5">
                          <Icon className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#FF7900]" />
                          <span>{item.name}</span>
                        </div>
                        <ArrowRight className="h-3 w-3 text-slate-300 group-hover:text-slate-600" />
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Matching Leads */}
              {searchResults.leads.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2.5 py-1 type-utility text-[#717680]">
                    Leads ({searchResults.leads.length})
                  </div>
                  {searchResults.leads.map((l) => (
                    <Link
                      key={l.id}
                      href={`/app/${currentOrg.slug}/leads?leadId=${l.id}`}
                      onClick={() => setCommandPaletteOpen(false)}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-[#F8F9FA] hover:text-slate-950 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <Users className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span className="font-medium text-slate-900 truncate">{l.title}</span>
                        {l.contact_name && (
                          <span className="text-[11px] text-slate-400 truncate">({l.contact_name})</span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-emerald-600 font-medium shrink-0">
                        ₹{(l.estimated_value || 0).toLocaleString()}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Matching Contacts */}
              {searchResults.contacts.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2.5 py-1 type-utility text-[#717680]">
                    Contacts ({searchResults.contacts.length})
                  </div>
                  {searchResults.contacts.map((c) => (
                    <Link
                      key={c.id}
                      href={`/app/${currentOrg.slug}/contacts?contactId=${c.id}`}
                      onClick={() => setCommandPaletteOpen(false)}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-[#F8F9FA] hover:text-slate-950 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <div className="h-5 w-5 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center text-[10px] font-medium shrink-0">
                          {c.first_name[0]}
                        </div>
                        <span className="font-medium text-slate-900 truncate">
                          {c.first_name} {c.last_name || ""}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400 font-normal">
                        {c.phone}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Matching Pages */}
              {searchResults.pages.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2.5 py-1 type-utility text-[#717680]">
                    Pages ({searchResults.pages.length})
                  </div>
                  {searchResults.pages.map((p) => (
                    <Link
                      key={p.href}
                      href={p.href}
                      onClick={() => setCommandPaletteOpen(false)}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-[#F8F9FA] hover:text-slate-950 transition-colors cursor-pointer"
                    >
                      <span className="font-medium text-slate-900">{p.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Jump</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Empty Search State */}
              {commandSearch.trim() &&
                searchResults.leads.length === 0 &&
                searchResults.contacts.length === 0 &&
                searchResults.pages.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400 font-medium">
                    No results found for &quot;{commandSearch}&quot;
                  </div>
                )}
            </div>

            {/* Footer Hints */}
            <div className="bg-[#F8F9FA] px-3.5 py-2 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Navigate with arrow keys</span>
              <span>ESC to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
