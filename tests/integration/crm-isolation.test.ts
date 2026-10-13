import { describe, it, expect } from "vitest";
import { crmStore } from "../../src/lib/crm/crm-store";

describe("Cross-Tenant CRM Data Isolation (Org A vs Org B)", () => {
  const orgA = "acme-corp";
  const orgB = "beta-logistics";

  it("should enforce separate contact directories between Org A and Org B", () => {
    const orgAContacts = crmStore.getContacts(orgA, true);
    const orgBContacts = crmStore.getContacts(orgB, true);

    expect(orgAContacts.length).toBeGreaterThan(0);
    expect(orgBContacts.length).toBeGreaterThan(0);

    // Assert no contact ID from Org A exists in Org B
    const orgAIds = new Set(orgAContacts.map((c) => c.id));
    const orgBIds = new Set(orgBContacts.map((c) => c.id));

    orgAIds.forEach((id) => {
      expect(orgBIds.has(id)).toBe(false);
    });

    // Assert all Org A contacts strictly have organization_id === orgA
    orgAContacts.forEach((c) => {
      expect(c.organization_id).toBe(orgA);
    });

    // Assert all Org B contacts strictly have organization_id === orgB
    orgBContacts.forEach((c) => {
      expect(c.organization_id).toBe(orgB);
    });
  });

  it("should enforce separate leads and pipeline calculations between Org A and Org B", () => {
    const orgALeads = crmStore.getLeads(orgA);
    const orgBLeads = crmStore.getLeads(orgB);

    expect(orgALeads.length).toBeGreaterThan(0);
    expect(orgBLeads.length).toBeGreaterThan(0);

    // Verify metrics are calculated strictly per organization
    const metricsA = crmStore.getMetrics(orgA);
    const metricsB = crmStore.getMetrics(orgB);

    expect(metricsA.totalContacts).not.toBe(metricsB.totalContacts);
    expect(metricsA.pipelineValue).not.toBe(metricsB.pipelineValue);
  });

  it("should NOT expose newly created Org A contacts to Org B", () => {
    const newContactA = crmStore.createContact(orgA, {
      first_name: "Confidential",
      last_name: "Client A",
      phone: "+919876543777",
      tags: ["Secret"],
      is_archived: false,
      consent_status: "opted_in",
    });

    const orgBContacts = crmStore.getContacts(orgB, true);
    const leaked = orgBContacts.find((c) => c.id === newContactA.id);
    expect(leaked).toBeUndefined();
  });
});
