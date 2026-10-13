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
        name: "Operations Lead",
        email: "operations@acmetech.io",
        role: "admin",
        status: "active",
        joined_at: "2026-01-15T12:00:00.000Z",
      },
      {
        id: "user-103",
        organization_id: acmeOrg,
        name: "Sales Agent",
        email: "sales@acmetech.io",
        role: "staff",
        status: "active",
        joined_at: "2026-02-01T09:30:00.000Z",
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
}

const globalTeamStore = (global as unknown as { __teamStore?: TeamStore });
export const teamStore = globalTeamStore.__teamStore ?? new TeamStore();
if (process.env.NODE_ENV !== "production") {
  globalTeamStore.__teamStore = teamStore;
}
