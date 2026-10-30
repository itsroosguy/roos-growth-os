import React from "react";
import { cookies } from "next/headers";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { TenantProvider } from "@/lib/organizations/tenant-context";
import { ToastProvider } from "@/components/ui/toast-context";
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
  const isSubTesting = orgSlug === "sub-testing-2" || orgSlug === "beta-logistics";
  const currentOrg: Organization = {
    id: isSubTesting ? "org-2" : "org-1",
    name: isSubTesting ? "Sub Testing 2" : "ABC Testing Brand",
    slug: orgSlug,
    plan_tier: isSubTesting ? "starter" : "growth",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const cookieStore = cookies();
  const rawRole = cookieStore.get("roos_user_role")?.value;
  const validRoles: OrganizationRole[] = ["owner", "admin", "senior_manager", "junior_manager", "staff"];
  const userRole: OrganizationRole =
    validRoles.includes(rawRole as OrganizationRole)
      ? (rawRole as OrganizationRole)
      : isSubTesting
      ? "staff"
      : "owner";

  const userOrganizations: Organization[] = [
    {
      id: "org-1",
      name: "ABC Testing Brand",
      slug: "demo-corp",
      plan_tier: "growth",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "org-2",
      name: "Sub Testing 2",
      slug: "sub-testing-2",
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
      <ToastProvider>
        <div className="min-h-screen bg-[var(--canvas)] text-[var(--text-1)] selection:bg-[#FF5A1F] selection:text-white relative">
          <Sidebar orgSlug={orgSlug} />
          <div className="flex flex-col min-w-0">
            <Topbar />
            <main className="app-main">
              <div className="animate-page-enter">{children}</div>
            </main>
          </div>
        </div>
      </ToastProvider>
    </TenantProvider>
  );
}
