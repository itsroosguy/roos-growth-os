import { describe, it, expect } from "vitest";
import {
  isOwner,
  isAdmin,
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

    it("should have operational permissions but NOT billing or workspace deletion", () => {
      expect(isOwner(role)).toBe(false);
      expect(isAdmin(role)).toBe(true);
      expect(canManageTeam(role)).toBe(true);
      expect(canManageWhatsAppSettings(role)).toBe(true);
      expect(canConfigureAutomations(role)).toBe(true);
      expect(canDeleteRecords(role)).toBe(true);

      // Denied actions
      expect(canManageBilling(role)).toBe(false);
      expect(canDeleteOrganization(role)).toBe(false);
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
