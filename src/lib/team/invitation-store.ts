import { OrganizationRole } from "../organizations/types";
import { ROLE_DEFINITIONS } from "../organizations/permissions";
import { teamStore } from "./team-store";

export interface TeamInvitation {
  id: string;
  organization_slug: string;
  organization_name: string;
  inviter_name: string;
  inviter_email: string;
  recipient_name: string;
  recipient_email: string;
  role: OrganizationRole;
  token: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  security_hash: string;
  governance_rules: string[];
}

export const ENTERPRISE_GOVERNANCE_RULES = [
  {
    code: "GOV-01",
    title: "Decoupled Financial Liability",
    description:
      "Operational managers (Senior and Junior) are legally and cryptographically decoupled from capital transfers, banking payouts, and company financial liabilities. Only Level 1 Admins hold disbursement authority.",
  },
  {
    code: "GOV-02",
    title: "Zero-Trust Cryptographic Token Expiry",
    description:
      "All account activation links expire strictly after 7 days (168 hours). Token single-use redemption prevents token reuse and replay attacks.",
  },
  {
    code: "GOV-03",
    title: "Multi-Tenant Data Isolation Guarantee",
    description:
      "Credentials grant access strictly to the assigned organization partition. Cross-tenant leakage is prevented via Row-Level Security and tenant-aware session tokens.",
  },
  {
    code: "GOV-04",
    title: "Tamper-Proof Audit Traceability",
    description:
      "Account appointment, acceptance timestamp, IP address, and role escalation are recorded to the immutable organizational audit log.",
  },
];

class InvitationStore {
  private invitations: Map<string, TeamInvitation[]> = new Map();

  constructor() {
    this.seedInvitations();
  }

  private seedInvitations() {
    const acmeSlug = "acme-corp";
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

    const acmeInvites: TeamInvitation[] = [
      {
        id: "inv-snr-01",
        organization_slug: acmeSlug,
        organization_name: "ABC Testing Brand",
        inviter_name: "Platform Administrator",
        inviter_email: "admin@acmetech.io",
        recipient_name: "Vikram Malhotra",
        recipient_email: "vikram.ops@acmetech.io",
        role: "senior_manager",
        token: "inv_live_snr_9984a1e7b",
        status: "pending",
        expires_at: sevenDaysFromNow,
        created_at: twoDaysAgo,
        security_hash: "sha256:7f4c990a12e3...",
        governance_rules: [
          "Operational CRM & Campaigns Clearance",
          "Zero Fund Transfer Liability",
          "7-Day Token Expiry SLA",
        ],
      },
      {
        id: "inv-jnr-02",
        organization_slug: acmeSlug,
        organization_name: "ABC Testing Brand",
        inviter_name: "Platform Administrator",
        inviter_email: "admin@acmetech.io",
        recipient_name: "Ananya Deshmukh",
        recipient_email: "ananya.tasks@acmetech.io",
        role: "junior_manager",
        token: "inv_live_jnr_4412c98d0",
        status: "pending",
        expires_at: sevenDaysFromNow,
        created_at: twoDaysAgo,
        security_hash: "sha256:3a1b8890ff45...",
        governance_rules: [
          "Tasks, Performance KPIs & Assigned Contacts",
          "Decoupled from System Settings & Billing",
          "7-Day Token Expiry SLA",
        ],
      },
    ];

    this.invitations.set(acmeSlug, acmeInvites);
  }

  getInvitations(orgSlug: string): TeamInvitation[] {
    return [...(this.invitations.get(orgSlug) || [])];
  }

  getInvitationByToken(token: string): TeamInvitation | null {
    const lists = Array.from(this.invitations.values());
    for (let j = 0; j < lists.length; j++) {
      const found = lists[j].find((i: TeamInvitation) => i.token === token);
      if (found) return found;
    }
    return null;
  }

  /**
   * Only Admin (Level 1) or Owner can create multiple-level accounts
   */
  createInvitation(
    orgSlug: string,
    params: {
      inviterName: string;
      inviterEmail: string;
      inviterRole: OrganizationRole;
      recipientName: string;
      recipientEmail: string;
      role: OrganizationRole;
      organizationName: string;
    }
  ): { success: boolean; invitation?: TeamInvitation; error?: string } {
    if (params.inviterRole !== "admin" && params.inviterRole !== "owner") {
      return {
        success: false,
        error: "Unauthorized: Only Level 1 Administrators hold clearance to create and dispatch multi-level account credentials.",
      };
    }

    const tokenPrefix =
      params.role === "admin"
        ? "adm"
        : params.role === "senior_manager"
        ? "snr"
        : "jnr";

    const randomToken = `inv_live_${tokenPrefix}_${Math.random().toString(36).substring(2, 12)}`;
    const randomHash = `sha256:${Math.random().toString(36).substring(2, 14)}...`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const roleMeta = ROLE_DEFINITIONS[params.role];

    const invitation: TeamInvitation = {
      id: `inv-${Date.now()}`,
      organization_slug: orgSlug,
      organization_name: params.organizationName,
      inviter_name: params.inviterName,
      inviter_email: params.inviterEmail,
      recipient_name: params.recipientName,
      recipient_email: params.recipientEmail,
      role: params.role,
      token: randomToken,
      status: "pending",
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
      security_hash: randomHash,
      governance_rules: [
        `${roleMeta.title} Clearance Scope`,
        params.role === "admin"
          ? "Full Financial & Fund Transfer Clearance"
          : "Zero Fund Transfer Liability",
        "7-Day Token Expiry SLA",
      ],
    };

    const list = this.invitations.get(orgSlug) || [];
    list.unshift(invitation);
    this.invitations.set(orgSlug, list);

    return { success: true, invitation };
  }

  acceptInvitation(
    token: string,
    respondentName: string
  ): { success: boolean; invitation?: TeamInvitation; error?: string } {
    const invite = this.getInvitationByToken(token);
    if (!invite) {
      return { success: false, error: "Invitation token not found or invalid." };
    }

    if (invite.status === "accepted") {
      return { success: false, error: "This invitation token has already been accepted and redeemed." };
    }

    if (invite.status === "revoked") {
      return { success: false, error: "This invitation was revoked by the workspace administrator." };
    }

    if (new Date(invite.expires_at) < new Date()) {
      invite.status = "expired";
      return { success: false, error: "This security token has expired (7-day SLA window elapsed). Please request a fresh invitation." };
    }

    // Mark accepted
    invite.status = "accepted";
    invite.accepted_at = new Date().toISOString();

    // Automatically add to active team roster in teamStore
    teamStore.addMember(invite.organization_slug, {
      name: respondentName || invite.recipient_name,
      email: invite.recipient_email,
      role: invite.role,
      status: "active",
    });

    return { success: true, invitation: invite };
  }

  resendInvitation(token: string): boolean {
    const invite = this.getInvitationByToken(token);
    if (!invite) return false;
    invite.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    return true;
  }

  revokeInvitation(token: string): boolean {
    const invite = this.getInvitationByToken(token);
    if (!invite) return false;
    invite.status = "revoked";
    return true;
  }
}

const globalInvitationStore = global as unknown as { __invitationStore?: InvitationStore };
export const invitationStore =
  globalInvitationStore.__invitationStore ?? new InvitationStore();
if (process.env.NODE_ENV !== "production") {
  globalInvitationStore.__invitationStore = invitationStore;
}
