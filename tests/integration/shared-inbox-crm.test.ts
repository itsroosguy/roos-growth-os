import { describe, it, expect } from "vitest";
import { whatsappStore } from "../../src/lib/whatsapp/whatsapp-store";
import { crmStore } from "../../src/lib/crm/crm-store";
import { teamStore } from "../../src/lib/team/team-store";
import * as fs from "fs";
import * as path from "path";

describe("Milestone 5: Shared Inbox CRM Integration & Multi-Tenant Security", () => {
  const acmeOrg = "acme-corp";
  const betaOrg = "beta-logistics";

  describe("1. CRM Lead Linking from Inbox", () => {
    it("should link an existing CRM lead to a conversation and log activity", () => {
      const conv = whatsappStore.getConversations(acmeOrg)[0];
      const lead = crmStore.getLeads(acmeOrg)[0];

      const updated = whatsappStore.linkConversationLead(acmeOrg, conv.id, lead.id, "Workspace Founder");
      expect(updated?.lead_id).toBe(lead.id);
      expect(updated?.lead_title).toBe(lead.title);

      const activities = whatsappStore.getConversationActivities(conv.id);
      const linkAct = activities.find((a) => a.type === "lead_linked");
      expect(linkAct).toBeDefined();
      expect(linkAct?.description).toContain(lead.title);
    });

    it("should allow unlinking a CRM lead from a conversation", () => {
      const conv = whatsappStore.getConversations(acmeOrg)[0];
      const updated = whatsappStore.linkConversationLead(acmeOrg, conv.id, null, "Workspace Founder");
      expect(updated?.lead_id).toBeNull();
      expect(updated?.lead_title).toBeNull();
    });
  });

  describe("2. Cross-Tenant Isolation Enforcement", () => {
    it("should never expose Beta Logistics conversations or team members to Acme Technologies", () => {
      const acmeConvs = whatsappStore.getConversations(acmeOrg);
      const betaConvs = whatsappStore.getConversations(betaOrg);

      expect(betaConvs.length).toBeGreaterThan(0);
      acmeConvs.forEach((c) => {
        expect(c.organization_id).toBe(acmeOrg);
        expect(c.organization_id).not.toBe(betaOrg);
      });

      // Verify team member isolation
      const acmeMembers = teamStore.getTeamMembers(acmeOrg);
      const betaMembers = teamStore.getTeamMembers(betaOrg);

      expect(acmeMembers.some((m) => m.name === "Logistics Manager")).toBe(false);
      expect(betaMembers.some((m) => m.name === "Workspace Founder")).toBe(false);
    });

    it("should reject cross-tenant conversation status modification", () => {
      const betaConv = whatsappStore.getConversations(betaOrg)[0];
      expect(betaConv).toBeDefined();

      // Attempting to modify Beta conversation under Acme context must fail (return null)
      const tamperedResult = whatsappStore.updateConversationStatus(
        acmeOrg,
        betaConv.id,
        "resolved",
        "Malicious Actor"
      );
      expect(tamperedResult).toBeNull();
    });
  });

  describe("3. Inbound Webhook Idempotency & Duplicate Rejection", () => {
    it("should safely ignore duplicate webhook message deliveries without inflating unread counts", () => {
      const externalMsgId = `mock_wamid_idempotent_${Date.now()}`;
      const payload = {
        externalMessageId: externalMsgId,
        fromPhone: "+919876543210",
        senderName: "Aarav Patel",
        body: "Checking quotation status",
        isSimulated: true,
      };

      // First webhook delivery
      const firstResult = whatsappStore.processInboundMessage(acmeOrg, payload);
      expect(firstResult.success).toBe(true);
      expect(firstResult.duplicate).toBe(false);

      const conv = whatsappStore.getConversations(acmeOrg).find((c) => c.contact_phone === payload.fromPhone);
      const initialUnread = conv?.unread_count || 0;

      // Second webhook delivery with identical external message ID
      const secondResult = whatsappStore.processInboundMessage(acmeOrg, payload);
      expect(secondResult.success).toBe(true);
      expect(secondResult.duplicate).toBe(true); // Flagged as duplicate

      // Unread count must remain unchanged
      expect(conv?.unread_count).toBe(initialUnread);
    });
  });

  describe("4. Database Migration 20261012000004_shared_inbox.sql Integrity", () => {
    it("should define conversation status constraints, activity logs, and RLS policies", () => {
      const migrationPath = path.resolve(
        __dirname,
        "../../supabase/migrations/20261012000004_shared_inbox.sql"
      );
      const sqlContent = fs.readFileSync(migrationPath, "utf-8");

      expect(sqlContent).toContain("ALTER TABLE public.conversations");
      expect(sqlContent).toContain("CHECK (status IN ('open', 'pending', 'resolved', 'closed', 'snoozed'))");
      expect(sqlContent).toContain("CREATE TABLE IF NOT EXISTS public.conversation_activities");
      expect(sqlContent).toContain("ALTER TABLE public.conversation_activities ENABLE ROW LEVEL SECURITY;");
      expect(sqlContent).toContain("ALTER TABLE public.conversation_activities FORCE ROW LEVEL SECURITY;");
      expect(sqlContent).toContain("CHECK (sender_type IN ('customer', 'staff', 'system', 'automation', 'internal_note'))");
    });
  });
});
