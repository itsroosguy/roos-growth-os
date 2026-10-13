"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cleanSlug } from "@/lib/organizations/slug";
import { Building2, Plus, ArrowRight, ShieldCheck, User } from "lucide-react";

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
    role: "owner" | "admin" | "staff";
    plan: string;
  }> = [
    {
      id: "org-1",
      name: "Acme Technologies",
      slug: "acme-corp",
      role: "owner",
      plan: "growth",
    },
    {
      id: "org-2",
      name: "Beta Logistics",
      slug: "beta-logistics",
      role: "staff",
      plan: "starter",
    },
  ];

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = cleanSlug(newOrgName);
    if (!slug) return;
    setIsCreating(true);

    // In live mode with Supabase, calls server action or DB insert.
    // For local transition:
    setTimeout(() => {
      setIsCreating(false);
      setCreateModalOpen(false);
      router.push(`/app/${slug}/overview`);
    }, 500);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-subtle p-6">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-google-blue text-white shadow-card mb-4">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Select Organisation
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Choose a workspace to continue or create a new business tenant
          </p>
        </div>

        <div className="space-y-4">
          {sampleOrgs.map((org) => {
            const roleVariant =
              org.role === "owner"
                ? "default"
                : org.role === "admin"
                ? "success"
                : "neutral";

            return (
              <Card
                key={org.id}
                className="group relative cursor-pointer overflow-hidden transition-all hover:border-google-blue/40 hover:shadow-card"
                onClick={() => router.push(`/app/${org.slug}/overview`)}
              >
                <CardContent className="flex items-center justify-between p-5">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-subtle border border-border group-hover:border-google-blue/30 group-hover:bg-surface-blue transition-colors">
                      <Building2 className="h-6 w-6 text-foreground-secondary group-hover:text-google-blue transition-colors" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-base font-semibold text-foreground">
                          {org.name}
                        </h2>
                        <Badge variant={roleVariant} className="text-[10px] font-bold uppercase">
                          {org.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground-secondary mt-0.5">
                        workspace: <span className="font-mono">/app/{org.slug}</span>
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="group-hover:text-google-blue group-hover:bg-surface-blue"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}

          <Button
            onClick={() => setCreateModalOpen(true)}
            variant="outline"
            className="w-full h-14 rounded-2xl border-dashed border-2 hover:border-google-blue hover:text-google-blue"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create another organisation
          </Button>
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
              <p className="text-xs text-foreground-secondary">
                Generated URL slug:{" "}
                <span className="font-mono text-google-blue">
                  {cleanSlug(newOrgName)}
                </span>
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating}>
              Create organisation
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
