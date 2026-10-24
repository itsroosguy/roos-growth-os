import { describe, it, expect } from "vitest";
import { invitationStore } from "../../src/lib/team/invitation-store";

describe("Enterprise Multi-Level Account Invitation & Governance Engine", () => {
  const orgSlug = "acme-corp";

  it("should allow Level 1 Admin to dispatch a multi-level account invitation", () => {
    const res = invitationStore.createInvitation(orgSlug, {
      inviterName: "Platform Administrator",
      inviterEmail: "admin@acmetech.io",
      inviterRole: "admin",
      recipientName: "Deepak Verma",
      recipientEmail: "deepak.ops@acmetech.io",
      role: "senior_manager",
      organizationName: "Acme Technologies",
    });

    expect(res.success).toBe(true);
    expect(res.invitation).toBeDefined();
    expect(res.invitation?.token).toMatch(/^inv_live_snr_/);
    expect(res.invitation?.status).toBe("pending");
    expect(res.invitation?.role).toBe("senior_manager");
  });

  it("should REJECT non-admin roles (e.g. Senior Manager, Junior Manager) from dispatching invitations", () => {
    const seniorManagerAttempt = invitationStore.createInvitation(orgSlug, {
      inviterName: "Senior Operations Lead",
      inviterEmail: "operations.lead@acmetech.io",
      inviterRole: "senior_manager",
      recipientName: "Junior Candidate",
      recipientEmail: "junior@acmetech.io",
      role: "junior_manager",
      organizationName: "Acme Technologies",
    });

    expect(seniorManagerAttempt.success).toBe(false);
    expect(seniorManagerAttempt.error).toContain("Unauthorized: Only Level 1 Administrators hold clearance");

    const juniorManagerAttempt = invitationStore.createInvitation(orgSlug, {
      inviterName: "Junior Lead",
      inviterEmail: "jr@acmetech.io",
      inviterRole: "junior_manager",
      recipientName: "Another Person",
      recipientEmail: "person@acmetech.io",
      role: "junior_manager",
      organizationName: "Acme Technologies",
    });

    expect(juniorManagerAttempt.success).toBe(false);
  });

  it("should allow respondent to verify and accept a valid token", () => {
    // 1. Admin creates invite
    const inviteRes = invitationStore.createInvitation(orgSlug, {
      inviterName: "Platform Administrator",
      inviterEmail: "admin@acmetech.io",
      inviterRole: "admin",
      recipientName: "Rahul Sharma",
      recipientEmail: "rahul.tasks@acmetech.io",
      role: "junior_manager",
      organizationName: "Acme Technologies",
    });

    const token = inviteRes.invitation!.token;

    // 2. Lookup by token
    const fetched = invitationStore.getInvitationByToken(token);
    expect(fetched).toBeDefined();
    expect(fetched?.recipient_email).toBe("rahul.tasks@acmetech.io");

    // 3. Accept appointment
    const acceptRes = invitationStore.acceptInvitation(token, "Rahul Sharma");
    expect(acceptRes.success).toBe(true);
    expect(acceptRes.invitation?.status).toBe("accepted");
    expect(acceptRes.invitation?.accepted_at).toBeDefined();

    // 4. Duplicate acceptance should be rejected
    const secondAttempt = invitationStore.acceptInvitation(token, "Rahul Sharma");
    expect(secondAttempt.success).toBe(false);
    expect(secondAttempt.error).toContain("already been accepted");
  });
});
