"use client";

import React, { useState } from "react";
import { useTenant } from "@/lib/organizations/tenant-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SettingsShell } from "@/components/layout/settings-shell";
import { Building2, AlertTriangle, CheckCircle2, Sparkles, Shield, Trash2, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { currentOrg, userRole, isOwner, isAdmin } = useTenant();
  const [orgName, setOrgName] = useState(currentOrg.name);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SettingsShell
      orgSlug={currentOrg.slug}
      title="Organisation Details"
      description={`Manage workspace profile, parameters, and defaults for ${currentOrg.name}.`}
    >
      <div className="space-y-6">

      {!isAdmin && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Shield className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>Read-Only View:</strong> Workspace configuration and master parameters are restricted to Level 1 Administrators. Your current role is{" "}
              <strong className="capitalize">{userRole.replace("_", " ")}</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Workspace Profile */}
      <form onSubmit={handleSave}>
        <div className="bg-white rounded-2xl border border-[#E5E5E7] shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-[#E5E5E7]">
            <h2 className="text-base font-semibold text-[#0D0D0E]">Workspace Profile</h2>
            <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
              Basic identifying information for this organisation.
            </p>
          </div>

          <div className="p-5 space-y-4">
            {saved && (
              <div className="rounded-xl bg-emerald-50 p-3.5 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Organisation settings updated successfully!</span>
              </div>
            )}

            <Input
              label="Organisation Name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              disabled={!isAdmin}
              required
              className="bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white focus:border-[#FF7A1A] text-[#0D0D0E] rounded-xl text-xs"
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#0D0D0E]">
                Workspace URL Identifier (Slug)
              </label>
              <div className="flex h-10 items-center rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] px-3.5 text-xs tabular-nums font-semibold text-[#0D0D0E]">
                /app/{currentOrg.slug}
              </div>
              <p className="text-[11px] text-[#8E8E93]">
                Slugs are immutable to preserve external links, webhook callbacks, and tenant isolation.
              </p>
            </div>
          </div>

          {isAdmin && (
            <div className="p-4 bg-[#F7F7F8] border-t border-[#E5E5E7] flex justify-end">
              <Button type="submit" className="bg-[#FF7A1A] hover:bg-[#FF8833] text-white font-semibold rounded-xl shadow-2xs text-xs">
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </form>

      {/* AI Copilot & Business Grounding Knowledge */}
      <div className="bg-white rounded-2xl border border-[#E5E5E7] shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-[#E5E5E7] flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-[#FF7A1A]" />
          <div>
            <h2 className="text-base font-semibold text-[#0D0D0E]">AI Assistant &amp; Business Knowledge</h2>
            <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
              Configure tone, model parameters, and ground AI reply suggestions in your verified company profile.
            </p>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#F7F7F8] border border-[#E5E5E7]">
            <div>
              <p className="text-sm font-semibold text-[#0D0D0E]">
                AI Copilot Settings &amp; Model Controls
              </p>
              <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
                Toggle automated draft suggestions, configure tone, and track token usage.
              </p>
            </div>
            <Link href={`/app/${currentOrg.slug}/settings/ai`}>
              <Button
                variant="outline"
                size="sm"
                className="border-[#E5E5E7] bg-white hover:bg-[#F7F7F8] text-[#0D0D0E] font-semibold text-xs rounded-xl"
              >
                Configure AI Settings
              </Button>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#F7F7F8] border border-[#E5E5E7]">
            <div>
              <p className="text-sm font-semibold text-[#0D0D0E]">
                Business Knowledge &amp; FAQs Profile
              </p>
              <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
                Manage official products, operating hours, and FAQs used to prevent AI hallucinations.
              </p>
            </div>
            <Link href={`/app/${currentOrg.slug}/settings/business-profile`}>
              <Button
                variant="outline"
                size="sm"
                className="border-[#E5E5E7] bg-white hover:bg-[#F7F7F8] text-[#0D0D0E] font-semibold text-xs rounded-xl"
              >
                Edit Business Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Platform Administration (Owner Only) */}
      {isOwner && (
        <div className="bg-white rounded-2xl border border-[#E5E5E7] shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-[#E5E5E7] flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-[#FF7A1A]" />
            <div>
              <h2 className="text-base font-semibold text-[#0D0D0E]">Platform Administration</h2>
              <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
                Authorized operator console for multi-tenant oversight, quota overrides, and subscription health.
              </p>
            </div>
          </div>

          <div className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#F7F7F8] border border-[#E5E5E7]">
              <div>
                <p className="text-sm font-semibold text-[#0D0D0E]">
                  Operator Management Console
                </p>
                <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
                  Manage tenant states, review payment events, and audit bonus quota grants.
                </p>
              </div>
              <Link href={`/app/${currentOrg.slug}/settings/admin`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#E5E5E7] bg-white hover:bg-[#F7F7F8] text-[#0D0D0E] font-semibold text-xs rounded-xl"
                >
                  Open Admin Console
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone (Owner Only) */}
      <div className="bg-white rounded-2xl border border-rose-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-rose-100 flex items-center space-x-2 text-rose-600">
          <AlertTriangle className="h-5 w-5 text-rose-600" />
          <div>
            <h2 className="text-base font-semibold text-rose-700">Danger Zone</h2>
            <p className="text-xs text-rose-600 font-normal mt-0.5">
              Irreversible actions for this workspace. Only the Owner can perform these operations.
            </p>
          </div>
        </div>

        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-rose-50 border border-rose-200">
            <div>
              <p className="text-sm font-semibold text-rose-950">
                Delete this organisation
              </p>
              <p className="text-xs text-rose-800 mt-0.5">
                Permanently delete all contacts, leads, conversations, and settings.
              </p>
            </div>
            <Button
              variant="danger"
              disabled={!isOwner}
              onClick={() => alert("Deletion confirmation required in production.")}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl"
            >
              Delete Workspace
            </Button>
          </div>
          {!isOwner && (
            <p className="text-xs text-[#8E8E93] mt-2 font-medium">
              You are currently signed in as <span className="font-medium uppercase text-[#0D0D0E]">{userRole}</span>. Contact the workspace Owner to request deletion.
            </p>
          )}
        </div>
      </div>
      </div>
    </SettingsShell>
  );
}
