import { describe, it, expect } from "vitest";
import { whatsappStore } from "../../src/lib/whatsapp/whatsapp-store";
import { crmStore } from "../../src/lib/crm/crm-store";

describe("WhatsApp Webhook Ingestion & Idempotency Integration Tests", () => {
  const orgSlug = "acme-corp";

  it("should process inbound message and match to existing contact", () => {
    const existing = crmStore.getContacts(orgSlug)[0];
    const uniqueWamid = `test_wamid_match_${Date.now()}`;

    const res = whatsappStore.processInboundMessage(orgSlug, {
      externalMessageId: uniqueWamid,
      fromPhone: existing.phone,
      body: "Testing inbound matching to existing contact",
      isSimulated: true,
    });

    expect(res.success).toBe(true);
    expect(res.duplicate).toBe(false);
    expect(res.message).toBeDefined();

    // Verify conversation was updated
    const conv = whatsappStore.getOrCreateConversationForContact(orgSlug, existing.id);
    expect(conv.last_message_text).toBe("Testing inbound matching to existing contact");
    expect(conv.last_customer_message_at).toBeDefined();
  });

  it("should auto-create contact when inbound message is from an unknown phone number", () => {
    const unknownPhone = `+91987000${Math.floor(1000 + Math.random() * 9000)}`;
    const uniqueWamid = `test_wamid_unknown_${Date.now()}`;

    const res = whatsappStore.processInboundMessage(orgSlug, {
      externalMessageId: uniqueWamid,
      fromPhone: unknownPhone,
      senderName: "New Prospect",
      body: "Hello, looking for a demo",
      isSimulated: true,
    });

    expect(res.success).toBe(true);
    expect(res.duplicate).toBe(false);

    // Verify contact was automatically created in CRM
    const contacts = crmStore.getContacts(orgSlug);
    const created = contacts.find((c) => c.phone === unknownPhone);
    expect(created).toBeDefined();
    expect(created?.first_name).toBe("New Prospect");
    expect(created?.source).toBe("WhatsApp Inbound");
  });

  it("should enforce IDEMPOTENCY: reject duplicate webhook payloads with same external message ID", () => {
    const duplicateWamid = `test_wamid_duplicate_check_${Date.now()}`;

    // First delivery
    const firstDelivery = whatsappStore.processInboundMessage(orgSlug, {
      externalMessageId: duplicateWamid,
      fromPhone: "+919876543210",
      body: "Initial delivery",
      isSimulated: true,
    });
    expect(firstDelivery.success).toBe(true);
    expect(firstDelivery.duplicate).toBe(false);

    // Second delivery (Meta webhook retry on network timeout)
    const secondDelivery = whatsappStore.processInboundMessage(orgSlug, {
      externalMessageId: duplicateWamid,
      fromPhone: "+919876543210",
      body: "Initial delivery retry",
      isSimulated: true,
    });

    expect(secondDelivery.success).toBe(true);
    expect(secondDelivery.duplicate).toBe(true); // Flagged as duplicate without creating second row
  });

  it("should update delivery status on webhook status receipts", () => {
    const testWamid = `test_wamid_status_${Date.now()}`;

    // Inject message
    whatsappStore.processInboundMessage(orgSlug, {
      externalMessageId: testWamid,
      fromPhone: "+919876543210",
      body: "Testing status transition",
    });

    // Update to read
    const updated = whatsappStore.updateMessageStatus(testWamid, "read");
    expect(updated).toBe(true);
  });

  it("should enforce cross-tenant WhatsApp isolation (Org A vs Org B)", () => {
    const orgB = "beta-logistics";

    const orgAConversations = whatsappStore.getConversations(orgSlug);
    const orgBConversations = whatsappStore.getConversations(orgB);

    // Assert Org A conversations cannot be seen in Org B
    const orgAConvIds = new Set(orgAConversations.map((c) => c.id));
    orgBConversations.forEach((c) => {
      expect(orgAConvIds.has(c.id)).toBe(false);
      expect(c.organization_id).toBe(orgB);
    });
  });
});
