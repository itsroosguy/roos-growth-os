"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RoosLogo } from "@/components/ui/roos-logo";
import { cleanSlug } from "@/lib/organizations/slug";
import { Building2, Plus, ArrowRight, ShieldCheck, Lock } from "lucide-react";

export default function SelectOrgPage() {
  const router = useRouter();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Demo organizations for local preview when DB is initializing
  const sampleOrgs: Array<{
    id: string;
    name: string;
    slug: string;
    role: "owner" | "admin" | "senior_manager" | "junior_manager" | "staff";
    plan: string;
    level: string;
  }> = [
    {
      id: "org-1",
      name: "Acme Technologies",
      slug: "acme-corp",
      role: "owner",
      plan: "Growth OS",
      level: "Level 1 Root Owner",
    },
    {
      id: "org-2",
      name: "Beta Logistics",
      slug: "beta-logistics",
      role: "senior_manager",
      plan: "Starter OS",
      level: "Level 2 Senior Manager",
    },
  ];

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = cleanSlug(newOrgName);
    if (!slug) return;
    setIsCreating(true);

    setTimeout(() => {
      setIsCreating(false);
      setCreateModalOpen(false);
      router.push(`/app/${slug}/overview`);
    }, 500);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F7F8] p-6 selection:bg-[#FF7900] selection:text-white">
      <div className="w-full max-w-xl">
        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="flex items-center justify-center mb-3">
            <RoosLogo variant="dark" size="lg" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#24180E] border border-[#FF7900]/30 text-[10px] font-semibold text-[#FF7900] uppercase tracking-wider mb-2">
            <span>Workspace Gateway</span>
            <span className="text-[#8E8E93]">•</span>
            <span className="text-[#8E8E93]">Multi-Tenant Isolation</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0E]">
            Select Workspace
          </h1>
          <p className="mt-1 text-xs text-[#8E8E93]">
            Choose an authorized business tenant or initialize a new organization
          </p>
        </div>

        <div className="space-y-3.5">
          {sampleOrgs.map((org) => {
            const roleVariant =
              org.role === "owner" || org.role === "admin"
                ? "orange"
                : org.role === "senior_manager"
                ? "purple"
                : "neutral";

            return (
              <Card
                key={org.id}
                className="group relative cursor-pointer overflow-hidden transition-all duration-200 border-[#E5E5E7] hover:border-[#FF7900] bg-white rounded-2xl shadow-2xs hover:shadow-sm"
                onClick={() => router.push(`/app/${org.slug}/overview`)}
              >
                <CardContent className="flex items-center justify-between p-4.5">
                  <div className="flex items-center space-x-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#121214] border border-[#1C1C1F] text-[#FF7900] group-hover:scale-105 transition-transform">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-sm font-bold text-[#0D0D0E] group-hover:text-[#FF7900] transition-colors">
                          {org.name}
                        </h2>
                        <Badge variant={roleVariant} className="text-[10px] font-bold uppercase tracking-wider">
                          {org.level}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-[#8E8E93] mt-0.5">
                        workspace: <span className="font-mono text-[#0D0D0E]">/app/{org.slug}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-lg bg-[#F7F7F8] group-hover:bg-[#24180E] text-[#8E8E93] group-hover:text-[#FF7900] flex items-center justify-center transition-colors">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <Button
            onClick={() => setCreateModalOpen(true)}
            variant="outline"
            className="w-full h-12 rounded-xl border-dashed border-[#E5E5E7] hover:border-[#FF7900] hover:text-[#FF7900] bg-white/50 hover:bg-white text-xs font-semibold transition-colors"
          >
            <Plus className="mr-2 h-4 w-4 text-[#FF7900]" />
            Create another organisation
          </Button>
        </div>

        {/* Security Footer */}
        <div className="mt-8 flex items-center justify-center gap-4 text-[11px] text-[#8E8E93]">
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3 text-[#FF7900]" />
            <span>Encrypted Session</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Strict Tenant Isolation</span>
          </span>
        </div>
      </div>

      {/* Create Org Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <form onSubmit={handleCreateOrg}>
          <DialogHeader>
            <DialogTitle>Create new organisation</DialogTitle>
            <DialogDescription>
              Each organisation operates with strict data isolation and separate team memberships.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <Input
              label="Organisation Name"
              placeholder="e.g. Acme Marketing"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              required
            />
            {newOrgName && (
              <p className="text-xs text-[#8E8E93]">
                Generated URL slug:{" "}
                <span className="font-mono text-[#FF7900] font-semibold">
                  /app/{cleanSlug(newOrgName)}
                </span>
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isCreating}
              className="bg-[#FF7900] hover:bg-[#E66D00] text-white font-semibold"
            >
              Create organisation
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
