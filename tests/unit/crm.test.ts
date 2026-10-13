import { describe, it, expect } from "vitest";
import { crmStore } from "../../src/lib/crm/crm-store";
import {
  parseCSVText,
  parseCSVLine,
  validateAndDetectDuplicates,
  exportContactsToCSV,
  normalizePhone,
  isValidEmail,
} from "../../src/lib/crm/csv-utils";
import { Contact } from "../../src/types/crm";

describe("CRM Module: Contacts, Leads & CSV Operations", () => {
  const testOrg = "test-crm-org";

  describe("Phone and Email Validation", () => {
    it("should normalize phone numbers properly", () => {
      expect(normalizePhone("9876543210")).toBe("+919876543210");
      expect(normalizePhone("+91 98765-43210")).toBe("+919876543210");
      expect(normalizePhone("+1 (555) 019-2831")).toBe("+15550192831");
    });

    it("should validate email format correctly", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
      expect(isValidEmail("invalid-email")).toBe(false);
      expect(isValidEmail("@no-user.com")).toBe(false);
    });
  });

  describe("CSV Parser and Duplicate Detection", () => {
    it("should correctly parse CSV lines with commas inside quotes", () => {
      const line = 'John,"Doe, Jr.",+919876543210,"Acme, Inc."';
      const parsed = parseCSVLine(line);
      expect(parsed).toEqual(["John", "Doe, Jr.", "+919876543210", "Acme, Inc."]);
    });

    it("should parse multiple CSV lines", () => {
      const csv = `First Name,Last Name,Phone,Email\nAarav,Patel,+919876543210,aarav@test.com\nNeha,Gupta,+919876543211,neha@test.com`;
      const rows = parseCSVText(csv);
      expect(rows).toHaveLength(2);
      expect(rows[0].first_name).toBe("Aarav");
      expect(rows[0].phone).toBe("+919876543210");
    });

    it("should detect duplicate contacts by phone or email", () => {
      const existing: Contact[] = [
        {
          id: "1",
          organization_id: "test-org",
          first_name: "Aarav",
          phone: "+919876543210",
          email: "aarav@test.com",
          tags: [],
          is_archived: false,
          consent_status: "opted_in",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const csvRows = [
        { first_name: "New Person", phone: "+919876543299", email: "new@test.com" },
        { first_name: "Duplicate Phone", phone: "9876543210", email: "diff@test.com" },
        { first_name: "Duplicate Email", phone: "+919876543288", email: "aarav@test.com" },
      ];

      const validation = validateAndDetectDuplicates(csvRows, existing);
      expect(validation.validRows).toHaveLength(3);
      expect(validation.duplicateCount).toBe(2);
      expect(validation.validRows[0].isDuplicate).toBe(false);
      expect(validation.validRows[1].isDuplicate).toBe(true);
      expect(validation.validRows[2].isDuplicate).toBe(true);
    });

    it("should reject rows with missing mandatory fields", () => {
      const invalidRows: Record<string, string>[] = [
        { first_name: "", phone: "+919876543210" }, // Missing name
        { first_name: "Bob", phone: "" },           // Missing phone
        { first_name: "Alice", phone: "+919876543210", email: "not-an-email" }, // Bad email
      ];

      const validation = validateAndDetectDuplicates(invalidRows, []);
      expect(validation.invalidRows).toHaveLength(3);
      expect(validation.invalidRows[0].errors[0]).toContain("Missing required First Name");
      expect(validation.invalidRows[1].errors[0]).toContain("Missing required Phone Number");
      expect(validation.invalidRows[2].errors[0]).toContain("Invalid email format");
    });
  });

  describe("Contact Store CRUD Operations", () => {
    it("should create, read, update, and archive a contact", () => {
      const created = crmStore.createContact(testOrg, {
        first_name: "Pooja",
        last_name: "Hegde",
        phone: "+919876543255",
        email: "pooja@example.com",
        company: "Hegde Media",
        tags: ["VIP"],
        is_archived: false,
        consent_status: "opted_in",
      });

      expect(created.id).toBeDefined();
      expect(created.first_name).toBe("Pooja");

      // Verify read
      const found = crmStore.getContactById(testOrg, created.id);
      expect(found).not.toBeNull();
      expect(found?.phone).toBe("+919876543255");

      // Update
      const updated = crmStore.updateContact(testOrg, created.id, { company: "Hegde Global" });
      expect(updated?.company).toBe("Hegde Global");

      // Archive
      crmStore.archiveContact(testOrg, created.id, true);
      const activeList = crmStore.getContacts(testOrg, false);
      const archivedList = crmStore.getContacts(testOrg, true);
      expect(activeList.find((c) => c.id === created.id)).toBeUndefined();
      expect(archivedList.find((c) => c.id === created.id)).toBeDefined();
    });
  });

  describe("Lead Stage Transitions and Metrics", () => {
    it("should transition lead stages and recompute conversion metrics", () => {
      const lead = crmStore.createLead(testOrg, {
        contact_id: "c-test-1",
        contact_name: "Pooja Hegde",
        contact_phone: "+919876543255",
        title: "Media Production CRM",
        stage: "new",
        estimated_value: 100000,
        currency: "INR",
      });

      expect(lead.stage).toBe("new");

      // Advance stage to qualified
      const qualified = crmStore.updateLeadStage(testOrg, lead.id, "qualified");
      expect(qualified?.stage).toBe("qualified");

      // Win the deal
      const won = crmStore.updateLeadStage(testOrg, lead.id, "won");
      expect(won?.stage).toBe("won");

      // Recompute metrics
      const metrics = crmStore.getMetrics(testOrg);
      expect(metrics.wonDeals.count).toBe(1);
      expect(metrics.wonDeals.value).toBe(100000);
      expect(metrics.conversionRate).toBeGreaterThan(0);
    });
  });
});
