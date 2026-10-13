"use client";

import React, { useState } from "react";
import { useTenant } from "@/lib/organizations/tenant-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cleanSlug } from "@/lib/organizations/slug";
import { Building2, AlertTriangle, CheckCircle2 } from "lucide-react";

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
    <div className="space-y-7 max-w-4xl pb-12">
      <div className="pb-3 border-b border-white/60">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Organisation Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
          Manage workspace profile and preferences for {currentOrg.name}.
        </p>
      </div>

      {/* Workspace Profile */}
      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle>Workspace Profile</CardTitle>
            <CardDescription>
              Basic identifying information for this organisation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {saved && (
              <div className="rounded-2xl bg-google-green-subtle p-3.5 border border-google-green/20 text-xs text-google-green flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Organisation settings updated successfully!</span>
              </div>
            )}

            <Input
              label="Organisation Name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              disabled={!isAdmin}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground-secondary">
                Workspace URL Identifier (Slug)
              </label>
              <div className="flex h-11 items-center rounded-xl border border-border bg-surface-subtle px-3.5 text-sm font-mono text-foreground-secondary">
                /app/{currentOrg.slug}
              </div>
              <p className="text-[11px] text-foreground-secondary">
                Slugs are immutable to preserve external links and webhook endpoints.
              </p>
            </div>
          </CardContent>
          {isAdmin && (
            <CardFooter className="flex justify-end border-t border-border pt-4">
              <Button type="submit">Save changes</Button>
            </CardFooter>
          )}
        </Card>
      </form>

      {/* AI Copilot & Business Grounding Knowledge */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-google-blue" />
            <CardTitle>AI Assistant & Business Knowledge</CardTitle>
          </div>
          <CardDescription>
            Configure tone, model parameters, and ground AI reply suggestions in your verified company profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-subtle border border-border">
            <div>
              <p className="text-sm font-semibold text-foreground">
                AI Copilot Settings & Model Controls
              </p>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Toggle features, set response length, configure tone, and track token usage.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = `/app/${currentOrg.slug}/settings/ai`}
            >
              Configure AI Settings
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-subtle border border-border">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Business Knowledge & FAQs Profile
              </p>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Manage official products, operating hours, and FAQs used to prevent hallucinations.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = `/app/${currentOrg.slug}/settings/business-profile`}
            >
              Edit Business Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Platform Administration (Owner Only) */}
      {isOwner && (
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-google-blue" />
              <CardTitle>Platform Administration</CardTitle>
            </div>
            <CardDescription>
              Authorised operator console for multi-tenant oversight, quota overrides, and subscription health.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-subtle border border-border">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Operator Management Console
                </p>
                <p className="text-xs text-foreground-secondary mt-0.5">
                  Manage tenant states, review payment events, and audit bonus quota grants.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = `/app/${currentOrg.slug}/settings/admin`}
              >
                Open Admin Console
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone (Owner Only) */}
      <Card className="border-google-red/30">
        <CardHeader>
          <div className="flex items-center space-x-2 text-google-red">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle className="text-google-red">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Irreversible actions for this workspace. Only the Owner can perform these operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-google-red-subtle/40 border border-google-red/20">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Delete this organisation
              </p>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Permanently delete all contacts, leads, conversations, and settings.
              </p>
            </div>
            <Button
              variant="danger"
              disabled={!isOwner}
              onClick={() => alert("Deletion confirmation required in production.")}
            >
              Delete workspace
            </Button>
          </div>
          {!isOwner && (
            <p className="text-xs text-foreground-secondary mt-2">
              You are currently signed in as <span className="font-semibold uppercase">{userRole}</span>. Contact the workspace Owner to request deletion.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
