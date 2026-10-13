import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { TenantProvider } from "@/lib/organizations/tenant-context";
import { Organization, OrganizationRole } from "@/lib/organizations/types";

interface OrgDashboardLayoutProps {
  children: React.ReactNode;
  params: {
    orgSlug: string;
  };
}

export default async function OrgDashboardLayout({
  children,
  params,
}: OrgDashboardLayoutProps) {
  const { orgSlug } = params;

  // Resolve organization details (or mock tenant context for local preview)
  const currentOrg: Organization = {
    id: "org-1",
    name: orgSlug === "beta-logistics" ? "Beta Logistics" : "Acme Technologies",
    slug: orgSlug,
    plan_tier: "growth",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const userRole: OrganizationRole = orgSlug === "beta-logistics" ? "staff" : "owner";

  const userOrganizations: Organization[] = [
    {
      id: "org-1",
      name: "Acme Technologies",
      slug: "acme-corp",
      plan_tier: "growth",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "org-2",
      name: "Beta Logistics",
      slug: "beta-logistics",
      plan_tier: "starter",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  return (
    <TenantProvider
      currentOrg={currentOrg}
      userRole={userRole}
      organizations={userOrganizations}
    >
      <div className="flex min-h-screen atmospheric-canvas text-slate-900 selection:bg-blue-600 selection:text-white relative">
        {/* Ambient atmospheric liquid light orbs */}
        <div className="pointer-events-none fixed -top-32 -left-32 h-[520px] w-[520px] rounded-full bg-blue-300/25 blur-[120px] -z-10" />
        <div className="pointer-events-none fixed top-1/3 -right-32 h-[580px] w-[580px] rounded-full bg-purple-300/25 blur-[130px] -z-10" />
        <div className="pointer-events-none fixed -bottom-32 left-1/4 h-[500px] w-[500px] rounded-full bg-amber-200/25 blur-[120px] -z-10" />

        <Sidebar orgSlug={orgSlug} />
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6">
            <div className="mx-auto max-w-[1580px]">{children}</div>
          </main>
        </div>
      </div>
    </TenantProvider>
  );
}
