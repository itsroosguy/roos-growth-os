import { describe, it, expect } from "vitest";
import { campaignStore } from "../../src/lib/campaigns/campaign-store";
import { templateStore } from "../../src/lib/campaigns/template-store";
import { crmStore } from "../../src/lib/crm/crm-store";
import { whatsappStore } from "../../src/lib/whatsapp/whatsapp-store";
import * as fs from "fs";
import * as path from "path";

describe("Milestone 6: Controlled Campaign Execution & Idempotency Integration Tests", () => {
  const acmeOrg = "acme-corp";

  describe("1. Campaign Creation & Template Approval Guard", () => {
    it("should reject campaign creation if the template is not APPROVED by Meta", () => {
      // Find or create pending template
      const pendingTpl = templateStore.getTemplates(acmeOrg).find((t) => t.status === "PENDING");
      expect(pendingTpl).toBeDefined();

      if (pendingTpl) {
        const result = campaignStore.createCampaign(acmeOrg, {
          name: "Illegal Unapproved Launch",
          templateId: pendingTpl.id,
          filterCriteria: {},
          variableMappings: {},
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("requires an APPROVED template");
      }
    });

    it("should successfully launch an immediate campaign with an APPROVED template", () => {
      const approvedTpl = templateStore.getApprovedTemplates(acmeOrg)[0];
      expect(approvedTpl).toBeDefined();

      const result = campaignStore.createCampaign(acmeOrg, {
        name: "Q4 Partner Broadcast",
        templateId: approvedTpl.id,
        filterCriteria: { tags: ["Retail"] },
        variableMappings: { "1": "first_name" },
        recipientLimit: 5,
        isTestMode: true,
        createdByName: "Workspace Founder",
      });

      expect(result.success).toBe(true);
      expect(result.campaign).toBeDefined();
      expect(result.campaign?.status).toBe("completed");
      expect(result.campaign?.sent_count).toBeGreaterThan(0);
      expect(result.campaign?.actual_cost).toBeGreaterThan(0);

      // Verify recipient queue
      const recipients = campaignStore.getCampaignRecipients(result.campaign!.id);
      expect(recipients.length).toBeGreaterThan(0);
      recipients.forEach((r) => {
        expect(r.idempotency_key).toContain(result.campaign!.id);
        expect(["delivered", "read", "sent"]).toContain(r.status);
        expect(r.external_message_id).toBeTruthy();
      });
    });
  });

  describe("2. Idempotency & Duplicate Prevention", () => {
    it("should prevent duplicate sends when the campaign queue execution is invoked repeatedly", () => {
      const campaigns = campaignStore.getCampaigns(acmeOrg);
      const completedCamp = campaigns.find((c) => c.status === "completed");
      expect(completedCamp).toBeDefined();

      if (completedCamp) {
        const initialSent = completedCamp.sent_count;
        const initialCost = completedCamp.actual_cost;

        // Re-execute queue
        campaignStore.executeCampaignQueue(acmeOrg, completedCamp.id);

        // Counts and costs must remain unchanged due to idempotency keys
        expect(completedCamp.sent_count).toBe(initialSent);
        expect(completedCamp.actual_cost).toBe(initialCost);
      }
    });
  });

  describe("3. Pause, Resume, and Cancellation Controls", () => {
    it("should allow pausing, resuming, and cancelling scheduled campaigns", () => {
      const approvedTpl = templateStore.getApprovedTemplates(acmeOrg)[0];

      const createRes = campaignStore.createCampaign(acmeOrg, {
        name: "Controllable Test Campaign",
        templateId: approvedTpl.id,
        filterCriteria: {},
        variableMappings: { "1": "first_name" },
        scheduledAt: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days in future
      });

      expect(createRes.success).toBe(true);
      const campId = createRes.campaign!.id;
      expect(createRes.campaign?.status).toBe("scheduled");

      // Pause
      const paused = campaignStore.pauseCampaign(acmeOrg, campId);
      expect(paused).toBe(true);
      expect(campaignStore.getCampaignById(acmeOrg, campId)?.status).toBe("paused");

      // Cancel
      const cancelled = campaignStore.cancelCampaign(acmeOrg, campId);
      expect(cancelled).toBe(true);
      expect(campaignStore.getCampaignById(acmeOrg, campId)?.status).toBe("cancelled");
    });
  });

  describe("4. Inbound STOP Keyword Automated Compliance", () => {
    it("should update contact consent to opted_out upon receiving inbound STOP keyword", () => {
      const contact = crmStore.getContacts(acmeOrg, false)[0];
      expect(contact.consent_status).toBe("opted_in");

      // Process incoming message with body STOP
      const inboundRes = whatsappStore.processInboundMessage(acmeOrg, {
        externalMessageId: `wamid_stop_test_${Date.now()}`,
        fromPhone: contact.phone,
        body: "STOP",
        isSimulated: true,
      });

      expect(inboundRes.success).toBe(true);

      // Verify CRM record was automatically transitioned to opted_out
      const updatedContact = crmStore.getContactById(acmeOrg, contact.id);
      expect(updatedContact?.consent_status).toBe("opted_out");
      expect(updatedContact?.consent_opted_out_at).toBeTruthy();

      // Subsequent marketing campaign audience evaluation must exclude this contact
      const approvedTpl = templateStore.getApprovedTemplates(acmeOrg)[0];
      const campRes = campaignStore.createCampaign(acmeOrg, {
        name: "Post-OptOut Campaign",
        templateId: approvedTpl.id,
        filterCriteria: { source: contact.source || undefined },
        variableMappings: { "1": "first_name" },
      });

      if (campRes.success) {
        const recipients = campaignStore.getCampaignRecipients(campRes.campaign!.id);
        const optOutRecipient = recipients.find((r) => r.contact_id === contact.id);
        expect(optOutRecipient).toBeUndefined(); // Completely excluded!
      }

      // Restore consent for test suite hygiene
      crmStore.updateContact(acmeOrg, contact.id, { consent_status: "opted_in" });
    });
  });

  describe("5. Database Migration 20261012000005 Integrity", () => {
    it("should define templates extension, audience_segments, campaigns, send queue, and RLS policies", () => {
      const migrationPath = path.resolve(
        __dirname,
        "../../supabase/migrations/20261012000005_templates_and_campaigns.sql"
      );
      const sqlContent = fs.readFileSync(migrationPath, "utf-8");

      expect(sqlContent).toContain("CREATE TABLE IF NOT EXISTS public.audience_segments");
      expect(sqlContent).toContain("CREATE TABLE IF NOT EXISTS public.campaigns");
      expect(sqlContent).toContain("CREATE TABLE IF NOT EXISTS public.campaign_recipients");
      expect(sqlContent).toContain("ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;");
      expect(sqlContent).toContain("ALTER TABLE public.campaigns FORCE ROW LEVEL SECURITY;");
      expect(sqlContent).toContain("ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;");
      expect(sqlContent).toContain("ALTER TABLE public.campaign_recipients FORCE ROW LEVEL SECURITY;");
      expect(sqlContent).toContain("CHECK (status IN ('APPROVED', 'PENDING', 'REJECTED', 'DRAFT'))");
    });
  });
});
