"use client";

import React, { useState } from "react";
import { useTenant } from "@/lib/organizations/tenant-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      contentClassName="max-w-[960px]"
    >
      <div className="space-y-6">
        {!isAdmin && (
          <div className="rounded-[12px] bg-[#FFF3D6] border border-[#FFE5A3] p-4 text-[13px] text-[#8F5300] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Shield className="h-4 w-4 text-[#8F5300] shrink-0" />
              <span>
                <strong className="font-semibold">Read-Only View:</strong> Workspace configuration and master parameters are restricted to Level 1 Administrators. Your current role is{" "}
                <strong className="capitalize font-semibold">{userRole.replace("_", " ")}</strong>.
              </span>
            </div>
          </div>
        )}

        {/* Workspace Profile */}
        <form onSubmit={handleSave}>
          <div className="bg-white rounded-[16px] border border-[#EDE8E0] card-ref p-0 overflow-hidden">
            <div className="p-6 border-b border-[#EDE8E0]">
              <h2 className="text-[18px] font-semibold text-[#12141A]">Workspace Profile</h2>
              <p className="text-[13px] text-[#666C78] font-normal mt-0.5">
                Basic identifying information for this organisation.
              </p>
            </div>

            <div className="p-6 space-y-5">
              {saved && (
                <div className="rounded-[12px] bg-[#E4F7EF] p-4 border border-[#BDECD7] text-[13.5px] text-[#0A7A53] font-medium flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-[#0A7A53] shrink-0" />
                  <span>Organisation settings updated successfully!</span>
                </div>
              )}

              <Input
                label="Organisation Name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                disabled={!isAdmin}
                required
                className="bg-[#F7F5F0] border-[#EDE8E0] focus:bg-white focus:border-[#FF5A1F] text-[#12141A] rounded-[12px] text-[14px]"
              />

              <div className="space-y-1.5">
                <label className="block text-[13.5px] font-medium text-[#12141A]">
                  Workspace URL Identifier (Slug)
                </label>
                <div className="flex h-10 items-center rounded-[12px] border border-[#EDE8E0] bg-[#F7F5F0] px-3.5 text-[14px] tabular-nums font-semibold text-[#12141A]">
                  /app/{currentOrg.slug}
                </div>
                <p className="text-[13px] text-[#666C78]">
                  Slugs are immutable to preserve external links, webhook callbacks, and tenant isolation.
                </p>
              </div>
            </div>

            {isAdmin && (
              <div className="p-4 bg-[#F7F5F0] border-t border-[#EDE8E0] flex justify-end">
                <Button type="submit" variant="primary" className="rounded-[12px] text-[14px] h-10 px-5 font-semibold cursor-pointer">
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </form>

        {/* AI Copilot & Business Grounding Knowledge */}
        <div className="bg-white rounded-[16px] border border-[#EDE8E0] card-ref p-0 overflow-hidden">
          <div className="p-6 border-b border-[#EDE8E0] flex items-center space-x-2.5">
            <Sparkles className="h-5 w-5 text-[#FF5A1F]" />
            <div>
              <h2 className="text-[18px] font-semibold text-[#12141A]">AI Assistant &amp; Business Knowledge</h2>
              <p className="text-[13px] text-[#666C78] font-normal mt-0.5">
                Configure tone, model parameters, and ground AI reply suggestions in your verified company profile.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[12px] bg-[#F7F5F0] border border-[#EDE8E0]">
              <div>
                <p className="text-[14px] font-semibold text-[#12141A]">
                  AI Copilot Settings &amp; Model Controls
                </p>
                <p className="text-[13px] text-[#666C78] mt-0.5">
                  Toggle automated draft suggestions, configure tone, and track token usage.
                </p>
              </div>
              <Link href={`/app/${currentOrg.slug}/settings/ai`}>
                <Button
                  variant="outline"
                  className="h-9 px-3.5 border-[#EDE8E0] bg-white hover:bg-[#F7F5F0] text-[#12141A] font-medium text-[13px] rounded-[10px] cursor-pointer"
                >
                  Configure AI Settings
                </Button>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[12px] bg-[#F7F5F0] border border-[#EDE8E0]">
              <div>
                <p className="text-[14px] font-semibold text-[#12141A]">
                  Business Knowledge &amp; FAQs Profile
                </p>
                <p className="text-[13px] text-[#666C78] mt-0.5">
                  Manage official products, operating hours, and FAQs used to prevent AI hallucinations.
                </p>
              </div>
              <Link href={`/app/${currentOrg.slug}/settings/business-profile`}>
                <Button
                  variant="outline"
                  className="h-9 px-3.5 border-[#EDE8E0] bg-white hover:bg-[#F7F5F0] text-[#12141A] font-medium text-[13px] rounded-[10px] cursor-pointer"
                >
                  Manage Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Platform Administration (Owner Only) */}
        {isOwner && (
          <div className="bg-white rounded-[16px] border border-[#EDE8E0] card-ref p-0 overflow-hidden">
            <div className="p-6 border-b border-[#EDE8E0] flex items-center space-x-2.5">
              <Building2 className="h-5 w-5 text-[#FF5A1F]" />
              <div>
                <h2 className="text-[18px] font-semibold text-[#12141A]">Platform Administration</h2>
                <p className="text-[13px] text-[#666C78] font-normal mt-0.5">
                  Authorized operator console for multi-tenant oversight, quota overrides, and subscription health.
                </p>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[12px] bg-[#F7F5F0] border border-[#EDE8E0]">
                <div>
                  <p className="text-[14px] font-semibold text-[#12141A]">
                    Operator Management Console
                  </p>
                  <p className="text-[13px] text-[#666C78] mt-0.5">
                    Manage tenant states, review payment events, and audit bonus quota grants.
                  </p>
                </div>
                <Link href={`/app/${currentOrg.slug}/settings/admin`}>
                  <Button
                    variant="outline"
                    className="h-9 px-3.5 border-[#EDE8E0] bg-white hover:bg-[#F7F5F0] text-[#12141A] font-medium text-[13px] rounded-[10px] cursor-pointer"
                  >
                    Open Admin Console
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone (Owner Only) */}
        <div className="bg-white rounded-[16px] border border-[#FFCCD0] card-ref p-0 overflow-hidden">
          <div className="p-6 border-b border-[#FFCCD0] flex items-center space-x-2.5 text-[#E5484D]">
            <AlertTriangle className="h-5 w-5 text-[#E5484D]" />
            <div>
              <h2 className="text-[18px] font-semibold text-[#B42336]">Danger Zone</h2>
              <p className="text-[13px] text-[#666C78] font-normal mt-0.5">
                Irreversible actions for this workspace. Only the Owner can perform these operations.
              </p>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[12px] bg-[#FFE9EA] border border-[#FFCCD0]">
              <div>
                <p className="text-[14px] font-semibold text-[#B42336]">
                  Delete this organisation
                </p>
                <p className="text-[13px] text-[#666C78] mt-0.5">
                  Permanently delete all contacts, leads, conversations, and settings.
                </p>
              </div>
              <Button
                variant="danger"
                disabled={!isOwner}
                onClick={() => alert("Deletion confirmation required in production.")}
                className="h-9 px-3.5 text-[13px] font-semibold rounded-[10px]"
              >
                Delete Workspace
              </Button>
            </div>
            {!isOwner && (
              <p className="text-[13px] text-[#666C78] mt-2 font-normal">
                You are currently signed in as <span className="font-semibold uppercase text-[#12141A]">{userRole}</span>. Contact the workspace Owner to request deletion.
              </p>
            )}
          </div>
        </div>
      </div>
    </SettingsShell>
  );
}
