import { describe, it, expect } from "vitest";
import * as crypto from "crypto";
import { MockWhatsAppProvider, MOCK_TEMPLATES } from "../../src/lib/whatsapp/mock-provider";
import { MetaCloudApiProvider } from "../../src/lib/whatsapp/meta-provider";
import { whatsappStore } from "../../src/lib/whatsapp/whatsapp-store";
import { crmStore } from "../../src/lib/crm/crm-store";
import { WhatsAppConnection, WhatsAppConversation } from "../../src/lib/whatsapp/types";

describe("WhatsApp Integration Unit Tests", () => {
  const mockProvider = new MockWhatsAppProvider();
  const metaProvider = new MetaCloudApiProvider();

  const sampleConnection: WhatsAppConnection = {
    id: "conn-test",
    organization_id: "acme-corp",
    mode: "mock",
    phone_number_id: "123456789",
    webhook_verify_token: "test_secret_token",
    status: "connected",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  describe("Mock WhatsApp Provider", () => {
    it("should successfully send valid text messages in mock mode", async () => {
      const result = await mockProvider.sendMessage(
        {
          toPhone: "+919876543210",
          type: "text",
          text: "Hello from unit test!",
        },
        sampleConnection
      );

      expect(result.success).toBe(true);
      expect(result.isSimulated).toBe(true);
      expect(result.externalMessageId).toContain("mock_wamid_");
      expect(result.status).toBe("delivered");
    });

    it("should validate and reject empty text messages", async () => {
      const result = await mockProvider.sendMessage(
        {
          toPhone: "+919876543210",
          type: "text",
          text: "   ",
        },
        sampleConnection
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("131000");
    });

    it("should successfully send approved templates", async () => {
      const result = await mockProvider.sendMessage(
        {
          toPhone: "+919876543210",
          type: "template",
          templateName: "welcome_greeting",
          templateVariables: { "1": "Aarav", "2": "Acme" },
        },
        sampleConnection
      );

      expect(result.success).toBe(true);
    });

    it("should reject non-existent or unapproved templates", async () => {
      const result = await mockProvider.sendMessage(
        {
          toPhone: "+919876543210",
          type: "template",
          templateName: "unapproved_fake_template",
        },
        sampleConnection
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("132000");
    });
  });

  describe("Meta Webhook Verification & HMAC Signature", () => {
    it("should verify webhook challenge when token matches", () => {
      const challenge = "1158201444";
      const res = metaProvider.verifyWebhook(
        "subscribe",
        "test_secret_token",
        challenge,
        "test_secret_token"
      );
      expect(res).toBe(challenge);
    });

    it("should reject webhook challenge when token mismatches", () => {
      const res = metaProvider.verifyWebhook(
        "subscribe",
        "wrong_token",
        "1158201444",
        "test_secret_token"
      );
      expect(res).toBeNull();
    });

    it("should correctly validate valid X-Hub-Signature-256", () => {
      const appSecret = "meta_test_secret_key_12345";
      const payload = JSON.stringify({ object: "whatsapp_business_account" });
      const signature = `sha256=${crypto
        .createHmac("sha256", appSecret)
        .update(payload)
        .digest("hex")}`;

      const isValid = metaProvider.validateSignature(payload, signature, appSecret);
      expect(isValid).toBe(true);
    });

    it("should reject tampered or invalid X-Hub-Signature-256", () => {
      const appSecret = "meta_test_secret_key_12345";
      const payload = JSON.stringify({ object: "whatsapp_business_account" });
      const badSignature = "sha256=0000000000000000000000000000000000000000000000000000000000000000";

      const isValid = metaProvider.validateSignature(payload, badSignature, appSecret);
      expect(isValid).toBe(false);
    });
  });

  describe("Meta 24-Hour Customer Service Window Enforcement", () => {
    it("should allow free-form text if last customer message was within 24 hours", () => {
      const conv: WhatsAppConversation = {
        id: "c-active-window",
        organization_id: "acme-corp",
        contact_id: "c-101",
        contact_name: "Test",
        contact_phone: "+919876543210",
        whatsapp_connection_id: "conn-1",
        last_message_text: "Inquiry",
        last_message_at: new Date().toISOString(),
        last_customer_message_at: new Date(Date.now() - 3600000 * 4).toISOString(), // 4h ago
        status: "open",
        unread_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const check = whatsappStore.isWithin24HourWindow(conv);
      expect(check.allowed).toBe(true);
      expect(check.hoursRemaining).toBeGreaterThan(0);
    });

    it("should reject free-form text if last customer message was > 24 hours ago", () => {
      const conv: WhatsAppConversation = {
        id: "c-expired-window",
        organization_id: "acme-corp",
        contact_id: "c-101",
        contact_name: "Test",
        contact_phone: "+919876543210",
        whatsapp_connection_id: "conn-1",
        last_message_text: "Inquiry",
        last_message_at: new Date().toISOString(),
        last_customer_message_at: new Date(Date.now() - 3600000 * 30).toISOString(), // 30h ago
        status: "open",
        unread_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const check = whatsappStore.isWithin24HourWindow(conv);
      expect(check.allowed).toBe(false);
      expect(check.hoursRemaining).toBe(0);
    });
  });

  describe("Customer Opt-Out Suppression", () => {
    it("should block outbound messages to opted-out contacts", async () => {
      // Create opted-out contact in store
      const optedOutContact = crmStore.createContact("acme-corp", {
        first_name: "OptedOut",
        phone: "+919999999991",
        consent_status: "opted_out",
        is_archived: false,
        tags: [],
      });

      const conv = whatsappStore.getOrCreateConversationForContact("acme-corp", optedOutContact.id);

      const result = await whatsappStore.sendOutboundMessage("acme-corp", conv.id, {
        toPhone: optedOutContact.phone,
        type: "text",
        text: "Attempting to message opted out contact",
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("OPT_OUT_BLOCKED");
    });
  });
});
