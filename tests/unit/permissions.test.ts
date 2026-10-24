import { describe, it, expect } from "vitest";
import {
  isOwner,
  isAdmin,
  isSeniorManager,
  isJuniorManager,
  canAccessFundTransfers,
  canManageBilling,
  canDeleteOrganization,
  canManageTeam,
  canManageWhatsAppSettings,
  canConfigureAutomations,
  canDeleteRecords,
} from "../../src/lib/organizations/permissions";

describe("Organization Role Permissions", () => {
  describe("Owner Role", () => {
    const role = "owner";

    it("should have all permissions", () => {
      expect(isOwner(role)).toBe(true);
      expect(isAdmin(role)).toBe(true);
      expect(canAccessFundTransfers(role)).toBe(true);
      expect(canManageBilling(role)).toBe(true);
      expect(canDeleteOrganization(role)).toBe(true);
      expect(canManageTeam(role)).toBe(true);
      expect(canManageWhatsAppSettings(role)).toBe(true);
      expect(canConfigureAutomations(role)).toBe(true);
      expect(canDeleteRecords(role)).toBe(true);
    });
  });

  describe("Admin Role", () => {
    const role = "admin";

    it("should have operational and fund clearance permissions but NOT workspace deletion", () => {
      expect(isOwner(role)).toBe(false);
      expect(isAdmin(role)).toBe(true);
      expect(canAccessFundTransfers(role)).toBe(true);
      expect(canManageTeam(role)).toBe(true);
      expect(canManageWhatsAppSettings(role)).toBe(true);
      expect(canConfigureAutomations(role)).toBe(true);
      expect(canDeleteRecords(role)).toBe(true);

      // Denied actions
      expect(canManageBilling(role)).toBe(false);
      expect(canDeleteOrganization(role)).toBe(false);
    });
  });

  describe("Senior Manager Role", () => {
    const role = "senior_manager";

    it("should have operational permissions but NO fund transfers or billing", () => {
      expect(isOwner(role)).toBe(false);
      expect(isAdmin(role)).toBe(false);
      expect(isSeniorManager(role)).toBe(true);
      expect(isJuniorManager(role)).toBe(false);

      // Operational capabilities
      expect(canConfigureAutomations(role)).toBe(true);

      // Denied actions: Fund transfers and billing are strictly blocked
      expect(canAccessFundTransfers(role)).toBe(false);
      expect(canManageBilling(role)).toBe(false);
      expect(canDeleteOrganization(role)).toBe(false);
      expect(canManageTeam(role)).toBe(false);
      expect(canManageWhatsAppSettings(role)).toBe(false);
    });
  });

  describe("Junior Manager Role", () => {
    const role = "junior_manager";

    it("should be restricted to tasks, personal KPIs and assigned interactions", () => {
      expect(isOwner(role)).toBe(false);
      expect(isAdmin(role)).toBe(false);
      expect(isSeniorManager(role)).toBe(false);
      expect(isJuniorManager(role)).toBe(true);

      // Denied actions: No automations, no fund transfers, no billing, no settings
      expect(canAccessFundTransfers(role)).toBe(false);
      expect(canManageBilling(role)).toBe(false);
      expect(canConfigureAutomations(role)).toBe(false);
      expect(canDeleteOrganization(role)).toBe(false);
      expect(canManageTeam(role)).toBe(false);
      expect(canManageWhatsAppSettings(role)).toBe(false);
      expect(canDeleteRecords(role)).toBe(false);
    });
  });

  describe("Staff Role", () => {
    const role = "staff";

    it("should be restricted from all administrative actions", () => {
      expect(isOwner(role)).toBe(false);
      expect(isAdmin(role)).toBe(false);
      expect(canManageBilling(role)).toBe(false);
      expect(canDeleteOrganization(role)).toBe(false);
      expect(canManageTeam(role)).toBe(false);
      expect(canManageWhatsAppSettings(role)).toBe(false);
      expect(canConfigureAutomations(role)).toBe(false);
      expect(canDeleteRecords(role)).toBe(false);
    });
  });
});

