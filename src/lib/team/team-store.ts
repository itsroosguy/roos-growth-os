import { OrganizationRole } from "@/lib/organizations/types";

export interface TeamMember {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  role: OrganizationRole;
  status: "active" | "invited";
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
        name: "Workspace Founder",
        email: "founder@acmetech.io",
        role: "owner",
        status: "active",
        joined_at: "2026-01-10T10:00:00.000Z",
      },
      {
        id: "user-102",
        organization_id: acmeOrg,
        name: "Admin (Full Access)",
        email: "admin@acmetech.io",
        role: "admin",
        status: "active",
        joined_at: "2026-01-12T11:00:00.000Z",
      },
      {
        id: "user-103",
        organization_id: acmeOrg,
        name: "Senior Operations Manager",
        email: "operations.lead@acmetech.io",
        role: "senior_manager",
        status: "active",
        joined_at: "2026-01-15T12:00:00.000Z",
      },
      {
        id: "user-104",
        organization_id: acmeOrg,
        name: "Junior Manager (Tasks & Performance)",
        email: "jr.manager@acmetech.io",
        role: "junior_manager",
        status: "active",
        joined_at: "2026-02-01T09:30:00.000Z",
      },
      {
        id: "user-105",
        organization_id: acmeOrg,
        name: "Customer Support Agent",
        email: "support@acmetech.io",
        role: "staff",
        status: "active",
        joined_at: "2026-02-15T14:20:00.000Z",
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
