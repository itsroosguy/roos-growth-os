import { OrganizationRole } from "@/lib/organizations/types";

export type DepartmentType = "sales" | "billing" | "support" | "ops" | "management";

export interface TeamMember {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  role: OrganizationRole;
  status: "active" | "invited";
  department?: DepartmentType;
  title?: string;
  avatar?: string;
  joined_at: string;
}

class TeamStore {
  private members: Map<string, TeamMember[]> = new Map();

  constructor() {
    this.seedInitialMembers();
  }

  private seedInitialMembers() {
    const acmeOrg = "acme-corp";
    const betaOrg = "beta-logistics";

    const acmeMembers: TeamMember[] = [
      {
        id: "user-101",
        organization_id: acmeOrg,
        name: "Praveen",
        email: "praveen@acmetech.io",
        role: "owner",
        department: "sales",
        title: "Sales Lead & Founder",
        status: "active",
        joined_at: "2026-01-10T10:00:00.000Z",
      },
      {
        id: "user-102",
        organization_id: acmeOrg,
        name: "Rohan Mehta",
        email: "rohan.billing@acmetech.io",
        role: "admin",
        department: "billing",
        title: "Billing & Invoicing Specialist",
        status: "active",
        joined_at: "2026-01-12T11:00:00.000Z",
      },
      {
        id: "user-103",
        organization_id: acmeOrg,
        name: "Sneha Reddy",
        email: "operations.lead@acmetech.io",
        role: "senior_manager",
        department: "ops",
        title: "Operations & Fleet Lead",
        status: "active",
        joined_at: "2026-01-15T12:00:00.000Z",
      },
      {
        id: "user-104",
        organization_id: acmeOrg,
        name: "Vikram Deshmukh",
        email: "vikram.sales@acmetech.io",
        role: "junior_manager",
        department: "sales",
        title: "Commercial Account Executive",
        status: "active",
        joined_at: "2026-02-01T09:30:00.000Z",
      },
      {
        id: "user-105",
        organization_id: acmeOrg,
        name: "Priya Sharma",
        email: "support@acmetech.io",
        role: "staff",
        department: "support",
        title: "Customer Support Agent",
        status: "active",
        joined_at: "2026-02-15T14:20:00.000Z",
      },
      {
        id: "user-106",
        organization_id: acmeOrg,
        name: "Ananya Rao",
        email: "ananya.tax@acmetech.io",
        role: "staff",
        department: "billing",
        title: "Billing & Accounts Associate",
        status: "active",
        joined_at: "2026-02-20T10:00:00.000Z",
      },
    ];

    const betaMembers: TeamMember[] = [
      {
        id: "user-beta-1",
        organization_id: betaOrg,
        name: "Logistics Manager",
        email: "manager@betalogistics.in",
        role: "owner",
        status: "active",
        joined_at: "2026-02-10T10:00:00.000Z",
      },
    ];

    this.members.set(acmeOrg, acmeMembers);
    this.members.set("demo-corp", acmeMembers);
    this.members.set(betaOrg, betaMembers);
  }

  getTeamMembers(orgSlug: string): TeamMember[] {
    return [...(this.members.get(orgSlug) || [])];
  }

  getMemberById(orgSlug: string, memberId: string): TeamMember | null {
    const list = this.members.get(orgSlug) || [];
    return list.find((m) => m.id === memberId) || null;
  }

  addMember(orgSlug: string, member: Omit<TeamMember, "id" | "organization_id" | "joined_at">): TeamMember {
    const list = this.members.get(orgSlug) || [];
    const newMember: TeamMember = {
      ...member,
      id: `user-${Date.now()}`,
      organization_id: orgSlug,
      joined_at: new Date().toISOString(),
    };
    list.push(newMember);
    this.members.set(orgSlug, list);
    return newMember;
  }

  updateMemberRole(orgSlug: string, memberId: string, role: OrganizationRole): boolean {
    const list = this.members.get(orgSlug) || [];
    const member = list.find((m) => m.id === memberId);
    if (!member) return false;
    member.role = role;
    this.members.set(orgSlug, list);
    return true;
  }

  removeMember(orgSlug: string, memberId: string): boolean {
    const list = this.members.get(orgSlug) || [];
    const filtered = list.filter((m) => m.id !== memberId);
    this.members.set(orgSlug, filtered);
    return true;
  }
}

const globalTeamStore = (global as unknown as { __teamStore?: TeamStore });
export const teamStore = globalTeamStore.__teamStore ?? new TeamStore();
if (process.env.NODE_ENV !== "production") {
  globalTeamStore.__teamStore = teamStore;
}
