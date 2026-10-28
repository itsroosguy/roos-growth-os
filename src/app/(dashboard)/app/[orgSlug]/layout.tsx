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
      slug: "acme-corp",
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
        <div className="flex min-h-screen bg-[#FAF9F6] text-[#0D0D0E] selection:bg-[#FF7A1A] selection:text-white relative">
          <Sidebar orgSlug={orgSlug} />
          <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
            <Topbar />
            <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 bg-[#FAF9F6] custom-light-scroll">
              <div className="mx-auto max-w-[1680px] animate-page-enter">{children}</div>
            </main>
          </div>
        </div>
      </ToastProvider>
    </TenantProvider>
  );
}
