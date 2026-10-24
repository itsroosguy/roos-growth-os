"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTenant } from "@/lib/organizations/tenant-context";
import { crmStore } from "@/lib/crm/crm-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  ChevronDown,
  LogOut,
  PlusCircle,
  Check,
  User,
  Search,
  Smartphone,
  Bell,
  X,
  MessageSquare,
  Users,
  CheckSquare,
  Sparkles,
  Zap,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
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
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-[#EAEAEA] bg-white px-4 sm:px-6 select-none">
        {/* Global Search Input (Matching Reference Image) */}
        <div className="relative w-72 sm:w-80 md:w-96 pl-10 md:pl-0">
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border border-[#EAEAEA] bg-transparent px-3.5 py-2 text-xs sm:text-sm text-slate-500 hover:border-slate-300 hover:text-slate-800 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
          >
            <div className="flex items-center space-x-2.5 truncate">
              <Search className="h-4 w-4 text-[#9CA3AF] shrink-0" />
              <span className="truncate text-slate-400 font-normal">
                Search leads, contacts, conversations...
              </span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md bg-[#F4F4F6] border border-[#E5E7EB] px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-500">
              ⌘ K
            </kbd>
          </button>
        </div>

        {/* Right Section Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Organization Switcher (Matching Reference Image) */}
          <div className="relative">
            <button
              onClick={() => {
                setOrgDropdownOpen(!orgDropdownOpen);
                setNotificationsOpen(false);
                setUserMenuOpen(false);
              }}
              className="flex items-center space-x-2 rounded-xl border border-[#EAEAEA] bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition-all hover:bg-[#F7F7F8] hover:border-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer h-9.5"
            >
              <Building2 className="h-4 w-4 text-slate-500" />
              <span className="font-bold text-slate-900 truncate max-w-[130px] sm:max-w-none">
                {currentOrg.name}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {orgDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOrgDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 z-50 w-64 rounded-2xl border border-[#EAEAEA] bg-white p-2 shadow-xl animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Workspaces
                  </div>
                  <div className="space-y-1">
                    {organizations.map((org) => {
                      const isCurrent = org.id === currentOrg.id;
                      return (
                        <Link
                          key={org.id}
                          href={`/app/${org.slug}/overview`}
                          onClick={() => setOrgDropdownOpen(false)}
                          className={cn(
                            "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                            isCurrent
                              ? "bg-[#24180E] text-[#FF7900] font-bold"
                              : "text-slate-700 hover:bg-[#F4F4F6] hover:text-slate-950"
                          )}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <Building2 className="h-4 w-4" />
                            <span className="truncate">{org.name}</span>
                          </div>
                          {isCurrent && <Check className="h-4 w-4 text-[#FF7900] shrink-0" />}
                        </Link>
                      );
                    })}
                  </div>

                  <div className="my-1.5 border-t border-slate-100" />

                  <Link
                    href="/select-org"
                    onClick={() => setOrgDropdownOpen(false)}
                    className="flex items-center space-x-2 rounded-xl px-3 py-2 text-xs font-bold text-[#FF7900] hover:bg-[#FF7900]/10 transition-colors"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Create new organisation</span>
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Notifications Bell with Orange Indicator Dot */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setOrgDropdownOpen(false);
                setUserMenuOpen(false);
              }}
              className="relative flex h-9.5 w-9.5 items-center justify-center rounded-xl border border-[#EAEAEA] bg-white text-slate-600 hover:bg-[#F7F7F8] hover:text-slate-900 transition-colors cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              aria-label="Notifications"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#FF7900] ring-2 ring-white animate-pulse" />
              )}
            </button>

            {notificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                <div className="absolute right-0 mt-2 z-50 w-80 sm:w-96 rounded-2xl border border-[#EAEAEA] bg-white p-3 shadow-2xl animate-in fade-in zoom-in-95 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 px-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-slate-950">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-[#FF7900] text-white text-[10px] font-bold px-1.5 py-0.2">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-[11px] font-bold text-[#FF7900] hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                    {notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.href}
                        onClick={() => setNotificationsOpen(false)}
                        className={cn(
                          "flex items-start space-x-2.5 rounded-xl p-2.5 transition-colors border",
                          n.read
                            ? "bg-white border-transparent hover:bg-slate-50"
                            : "bg-[#FFF9F5] border-[#FF7900]/20 hover:bg-[#FFF5ED]"
                        )}
                      >
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200">
                          {n.type === "inbox" && <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />}
                          {n.type === "task" && <CheckSquare className="h-3.5 w-3.5 text-amber-600" />}
                          {n.type === "lead" && <Users className="h-3.5 w-3.5 text-blue-600" />}
                          {n.type === "system" && <Sparkles className="h-3.5 w-3.5 text-purple-600" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-950 truncate">{n.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1 leading-snug font-normal">
                            {n.subtitle}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-center">
                    <Link
                      href={`/app/${currentOrg.slug}/tasks`}
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs font-bold text-[#FF7900] hover:underline transition-colors"
                    >
                      View all tasks & updates →
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile Avatar with dropdown (Matching Reference Image) */}
          <div className="relative">
            <button
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                setOrgDropdownOpen(false);
                setNotificationsOpen(false);
              }}
              className="flex h-9.5 w-9.5 items-center justify-center rounded-full border border-slate-300 bg-slate-900 text-white font-extrabold text-xs shadow-xs cursor-pointer hover:ring-2 hover:ring-[#FF7900]/30 transition-all overflow-hidden"
              title="User Account"
            >
              <User className="h-4.5 w-4.5 text-slate-200" />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 z-50 w-56 rounded-2xl border border-[#EAEAEA] bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-bold text-slate-950">Signed in</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{currentOrg.name}</p>
                    <span className="inline-block mt-1 text-[10px] uppercase font-bold text-[#FF7900] bg-[#FF7900]/10 px-2 py-0.5 rounded-full">
                      {userRole.replace("_", " ")}
                    </span>
                  </div>

                  <Link
                    href={`/app/${currentOrg.slug}/settings`}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-semibold"
                  >
                    <User className="mr-2 h-4 w-4 text-slate-400" />
                    Account Settings
                  </Link>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-semibold cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
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
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setCommandPaletteOpen(false)}
          />

          <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-slate-200">
              <Search className="h-5 w-5 text-[#FF7900] mr-3 shrink-0" />
              <input
                ref={searchInputRef}
                value={commandSearch}
                onChange={(e) => setCommandSearch(e.target.value)}
                placeholder="Type a command or search leads, contacts, pages..."
                className="w-full text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
              />
              <button
                onClick={() => setCommandPaletteOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Results Area */}
            <div className="max-h-96 overflow-y-auto p-3 space-y-4 text-xs">
              {!commandSearch.trim() ? (
                <div className="py-6 text-center text-slate-400 space-y-2">
                  <p className="font-semibold text-slate-600">Quick Navigation</p>
                  <div className="flex flex-wrap justify-center gap-1.5 max-w-md mx-auto pt-1">
                    {[
                      { name: "Overview", href: `/app/${currentOrg.slug}/overview` },
                      { name: "Pipeline", href: `/app/${currentOrg.slug}/leads` },
                      { name: "Inbox", href: `/app/${currentOrg.slug}/inbox` },
                      { name: "Tasks", href: `/app/${currentOrg.slug}/tasks` },
                      { name: "Campaigns", href: `/app/${currentOrg.slug}/campaigns` },
                      { name: "Team", href: `/app/${currentOrg.slug}/team` },
                    ].map((quick) => (
                      <Link
                        key={quick.href}
                        href={quick.href}
                        onClick={() => setCommandPaletteOpen(false)}
                        className="rounded-lg bg-[#F7F7F8] border border-slate-200 px-2.5 py-1 text-slate-700 font-bold hover:bg-[#24180E] hover:text-[#FF7900] hover:border-[#FF7900]/30 transition-colors"
                      >
                        {quick.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Pages Category */}
                  {searchResults.pages.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-400 px-2 block mb-1">
                        Navigation Pages
                      </span>
                      <div className="space-y-0.5">
                        {searchResults.pages.map((page) => (
                          <Link
                            key={page.href}
                            href={page.href}
                            onClick={() => setCommandPaletteOpen(false)}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors text-slate-800 font-semibold"
                          >
                            <span>{page.name}</span>
                            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Leads Category */}
                  {searchResults.leads.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-400 px-2 block mb-1">
                        Sales Deals
                      </span>
                      <div className="space-y-0.5">
                        {searchResults.leads.map((lead) => (
                          <Link
                            key={lead.id}
                            href={`/app/${currentOrg.slug}/leads`}
                            onClick={() => setCommandPaletteOpen(false)}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors text-slate-800"
                          >
                            <div>
                              <span className="font-bold block">{lead.title}</span>
                              <span className="text-[11px] text-slate-500">
                                ₹{(lead.estimated_value || 0).toLocaleString("en-IN")} • {lead.stage}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-[#FF7900] bg-[#FF7900]/10 px-2 py-0.5 rounded-full">
                              Lead
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contacts Category */}
                  {searchResults.contacts.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-400 px-2 block mb-1">
                        Contacts
                      </span>
                      <div className="space-y-0.5">
                        {searchResults.contacts.map((contact) => (
                          <Link
                            key={contact.id}
                            href={`/app/${currentOrg.slug}/contacts`}
                            onClick={() => setCommandPaletteOpen(false)}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors text-slate-800"
                          >
                            <div>
                              <span className="font-bold block">
                                {contact.first_name} {contact.last_name || ""}
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono">{contact.phone}</span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Contact
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Navigate with arrow keys</span>
              <span>ESC to dismiss</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
