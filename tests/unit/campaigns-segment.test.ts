import { describe, it, expect } from "vitest";
import { segmentEngine } from "../../src/lib/campaigns/segment-engine";
import { crmStore } from "../../src/lib/crm/crm-store";

describe("Milestone 6: Audience Segments & Compliance Suppression Unit Tests", () => {
  const acmeOrg = "acme-corp";
  const betaOrg = "beta-logistics";

  describe("1. Dynamic Segment Filtering", () => {
    it("should match contacts by tag and enforce marketing opt-in consent", () => {
      const result = segmentEngine.evaluateCriteria(
        acmeOrg,
        { tags: ["VIP"] },
        true // Marketing campaign
      );

      expect(result.totalMatched).toBeGreaterThan(0);
      result.eligibleContacts.forEach((c) => {
        expect(c.tags).toContain("VIP");
        expect(c.consent_status).toBe("opted_in");
      });
    });

    it("should match contacts by source", () => {
      const result = segmentEngine.evaluateCriteria(
        acmeOrg,
        { source: "WhatsApp Inbound" },
        true
      );

      expect(result.totalMatched).toBeGreaterThan(0);
      result.eligibleContacts.forEach((c) => {
        expect(c.source?.toLowerCase()).toContain("whatsapp");
      });
    });
  });

  describe("2. Consent & Opt-Out Suppression Safeguards", () => {
    it("should strictly exclude opted-out contacts from eligible audience", () => {
      // Mark a contact as explicitly opted out
      const contacts = crmStore.getContacts(acmeOrg, false);
      const target = contacts[0];
      crmStore.updateContact(acmeOrg, target.id, { consent_status: "opted_out" });

      const result = segmentEngine.evaluateCriteria(acmeOrg, {}, true);

      // Must be present in suppressed list and absent from eligible list
      expect(result.suppressedOptOutContacts.some((c) => c.id === target.id)).toBe(true);
      expect(result.eligibleContacts.some((c) => c.id === target.id)).toBe(false);

      // Restore opt-in status for clean subsequent tests
      crmStore.updateContact(acmeOrg, target.id, { consent_status: "opted_in" });
    });

    it("should exclude contacts with pending consent from marketing broadcasts", () => {
      const contacts = crmStore.getContacts(acmeOrg, false);
      const pendingContact = contacts.find((c) => c.consent_status === "pending");

      if (pendingContact) {
        const result = segmentEngine.evaluateCriteria(acmeOrg, {}, true);
        expect(result.eligibleContacts.some((c) => c.id === pendingContact.id)).toBe(false);
        expect(result.suppressedConsentContacts.some((c) => c.id === pendingContact.id)).toBe(true);
      }
    });
  });

  describe("3. Tenant Isolation in Audience Evaluation", () => {
    it("should never include contacts from another organization in audience segments", () => {
      const acmeResult = segmentEngine.evaluateCriteria(acmeOrg, {}, false);
      const betaResult = segmentEngine.evaluateCriteria(betaOrg, {}, false);

      expect(acmeResult.eligibleCount).toBeGreaterThan(0);
      expect(betaResult.eligibleCount).toBeGreaterThan(0);

      // Verify no cross-tenant leakage
      acmeResult.eligibleContacts.forEach((c) => {
        expect(c.organization_id).toBe(acmeOrg);
        expect(c.organization_id).not.toBe(betaOrg);
      });

      betaResult.eligibleContacts.forEach((c) => {
        expect(c.organization_id).toBe(betaOrg);
        expect(c.organization_id).not.toBe(acmeOrg);
      });
    });
  });
});
