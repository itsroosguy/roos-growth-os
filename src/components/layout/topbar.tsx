"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTenant } from "@/lib/organizations/tenant-context";
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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function Topbar() {
  const router = useRouter();
  const { currentOrg, userRole, organizations } = useTenant();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const roleVariant =
    userRole === "owner"
      ? "default"
      : userRole === "admin"
      ? "success"
      : "neutral";

  const handleSignOut = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/70 bg-white/60 px-4 sm:px-6 py-2.5 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
      {/* Center/Left Search Pill (Matching reference design) */}
      <div className="relative w-72 sm:w-80 md:w-96">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search conversations, contacts or messages..."
          className="w-full h-9 pl-9 pr-12 rounded-full glass-input text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs transition-all"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-medium text-slate-400 bg-white/80 border border-slate-200/80 px-1.5 py-0.5 rounded-md shadow-2xs">
          ⌘ K
        </kbd>
      </div>

      {/* Right Action Cluster */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* WhatsApp Connection Pill (Matching reference image) */}
        <Link
          href={`/app/${currentOrg.slug}/whatsapp`}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/75 border border-white/85 shadow-2xs text-xs font-semibold text-slate-800 hover:bg-white hover:shadow-xs transition-all cursor-pointer"
          title="WhatsApp Cloud API Status"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
            <Smartphone className="h-3 w-3" />
          </div>
          <span className="font-bold text-slate-800">WhatsApp</span>
          <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
            Connected <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </span>
        </Link>

        {/* Notifications Bell */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/75 border border-white/85 text-slate-600 hover:text-slate-900 hover:bg-white shadow-2xs transition-all"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        {/* Organization Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 rounded-full border border-white/85 bg-white/75 px-3 py-1.5 text-xs font-semibold text-slate-800 transition-all hover:bg-white shadow-2xs cursor-pointer"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <Building2 className="h-3 w-3" />
            </div>
            <span className="font-bold text-slate-900 truncate max-w-[120px] sm:max-w-none">
              {currentOrg.name}
            </span>
            <Badge variant={roleVariant} className="text-[9px] uppercase font-bold px-1.5 py-0">
              {userRole}
            </Badge>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 z-50 w-64 rounded-2xl border border-white/80 bg-white/95 p-2 shadow-dropdown backdrop-blur-xl">
                <div className="px-3 py-1.5 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Workspaces
                </div>
                <div className="space-y-1">
                  {organizations.map((org) => {
                    const isCurrent = org.id === currentOrg.id;
                    return (
                      <Link
                        key={org.id}
                        href={`/app/${org.slug}/overview`}
                        onClick={() => setDropdownOpen(false)}
                        className={cn(
                          "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                          isCurrent
                            ? "bg-blue-50 text-blue-700 font-semibold"
                            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                        )}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <span className="truncate">{org.name}</span>
                        </div>
                        {isCurrent && (
                          <Check className="h-4 w-4 text-blue-600 shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </div>

                <div className="my-1.5 border-t border-slate-100" />

                <Link
                  href="/select-org"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center space-x-2 rounded-xl px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Create new organisation</span>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-1.5 rounded-full border border-white/85 bg-white/75 p-1 pr-2 text-xs font-medium text-slate-700 hover:bg-white transition-all cursor-pointer shadow-2xs"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-slate-900 to-slate-700 text-white font-bold text-xs ring-1 ring-white">
              {currentOrg.name.charAt(0)}
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 z-50 w-52 rounded-2xl border border-white/80 bg-white/95 p-2 shadow-dropdown backdrop-blur-xl">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-semibold text-slate-900">
                    Active Session
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {currentOrg.name} ({userRole})
                  </p>
                </div>

                <Link
                  href={`/app/${currentOrg.slug}/settings`}
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <User className="mr-2 h-4 w-4 text-slate-400" />
                  Organisation Settings
                </Link>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
