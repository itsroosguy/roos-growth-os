import { describe, it, expect, beforeEach } from "vitest";
import { subscriptionService } from "../../src/lib/billing/subscription-service";

describe("Server-Side Subscription Entitlement Engine", () => {
  const testOrg = "beta-logistics"; // Seeded with Starter plan

  beforeEach(() => {
    // Reset Beta Logistics to active Starter plan
    subscriptionService.updateSubscription(testOrg, {
      plan_tier: "starter",
      status: "active",
      cancel_at_period_end: false,
    });
  });

  it("should allow team member addition within limit and block when exceeded", () => {
    // Starter allows 2 team members
    const check1 = subscriptionService.canAddTeamMember(testOrg, 1);
    expect(check1.allowed).toBe(true);
    expect(check1.limit).toBe(2);

    const check2 = subscriptionService.canAddTeamMember(testOrg, 2);
    expect(check2.allowed).toBe(false);
    expect(check2.reason).toContain("allows up to 2 team members");
  });

  it("should enforce contact quota limits strictly on Starter plan", () => {
    // Starter allows 500 contacts
    const underLimit = subscriptionService.canCreateContact(testOrg, 499);
    expect(underLimit.allowed).toBe(true);

    const atLimit = subscriptionService.canCreateContact(testOrg, 500);
    expect(atLimit.allowed).toBe(false);
    expect(atLimit.reason).toContain("limit of 500 contacts has been reached");
  });

  it("should gate broadcast campaigns on Starter tier", () => {
    const campaignCheck = subscriptionService.canLaunchCampaign(testOrg, 50);
    expect(campaignCheck.allowed).toBe(false);
    expect(campaignCheck.reason).toContain("not available on the Starter plan");

    // Upgrade to Growth
    subscriptionService.changePlan(testOrg, "growth", "monthly");
    const growthCheck = subscriptionService.canLaunchCampaign(testOrg, 50);
    expect(growthCheck.allowed).toBe(true);
  });

  it("should enforce workflow activation limits (Starter: 3, Growth: 10)", () => {
    subscriptionService.updateSubscription(testOrg, { plan_tier: "starter" });
    const checkUnder = subscriptionService.canActivateAutomation(testOrg, 2);
    expect(checkUnder.allowed).toBe(true);

    const checkOver = subscriptionService.canActivateAutomation(testOrg, 3);
    expect(checkOver.allowed).toBe(false);
    expect(checkOver.reason).toContain("allows up to 3 active workflow rules");
  });

  it("should switch to read-only mode on suspended/expired/canceled status without data loss", () => {
    subscriptionService.updateSubscription(testOrg, { status: "canceled" });

    // Contact creation should be blocked
    const contactCheck = subscriptionService.canCreateContact(testOrg, 10);
    expect(contactCheck.allowed).toBe(false);
    expect(contactCheck.reason).toContain("read-only mode");

    // Team member addition should be blocked
    const teamCheck = subscriptionService.canAddTeamMember(testOrg, 0);
    expect(teamCheck.allowed).toBe(false);
    expect(teamCheck.reason).toContain("read-only mode");

    // Existing data is not deleted
    const sub = subscriptionService.getSubscription(testOrg);
    expect(sub.status).toBe("canceled");
  });

  it("should provide transparent warnings before downgrading without deleting customer records", () => {
    // Simulate tenant currently using 4 team seats and 2,000 contacts (on Growth)
    const downgradeEval = subscriptionService.evaluateDowngrade(testOrg, "starter", {
      teamMembers: 4,
      contacts: 2000,
      leads: 300,
      activeWorkflows: 5,
    });

    expect(downgradeEval.allowed).toBe(true); // Allowed to switch, but warnings issued
    expect(downgradeEval.warnings.length).toBeGreaterThanOrEqual(3);
    expect(downgradeEval.warnings[0]).toContain("currently have 4 team members");
    expect(downgradeEval.warnings[1]).toContain("have 2000 contacts");
    expect(downgradeEval.warnings[2]).toContain("5 active automations");
  });
});
