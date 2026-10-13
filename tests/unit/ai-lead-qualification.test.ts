import { describe, it, expect, beforeEach } from "vitest";
import { MockAIProvider } from "../../src/lib/ai/mock-provider";
import { leadQualificationStore } from "../../src/lib/ai/lead-qualification-store";

describe("AI Lead Qualification & Pipeline Intelligence", () => {
  let provider: MockAIProvider;

  beforeEach(() => {
    provider = new MockAIProvider();
  });

  it("should extract explicit budget with Indian Rupees formatting", async () => {
    const res = await provider.qualifyLead({
      orgSlug: "acme-corp",
      leadId: "lead-test-1",
      leadTitle: "ERP Integration Lead",
      contactName: "Aarav Sharma",
      contactPhone: "+919876543210",
      conversationMessages: [
        { sender: "customer", text: "We need WhatsApp automation for 10 users." },
        { sender: "customer", text: "Our approved budget is ₹50,000 for this quarter." },
      ],
      notes: "Met at Mumbai Tech Expo",
    });

    expect(res.budget).toBe("₹50,000");
  });

  it("should mark budget strictly as 'Not provided' when unstated by the customer", async () => {
    const res = await provider.qualifyLead({
      orgSlug: "acme-corp",
      leadId: "lead-test-2",
      leadTitle: "Website Inquiry Lead",
      contactName: "Meera Nair",
      contactPhone: "+919876543211",
      conversationMessages: [
        { sender: "customer", text: "Hi, can you tell me more about your CRM features?" },
        { sender: "customer", text: "Can we see a demo tomorrow?" },
      ],
      notes: "",
    });

    // Anti-hallucination check: must NOT invent an assumed budget
    expect(res.budget).toBe("Not provided");
  });

  it("should detect immediate timeline and recommend high priority for urgent leads with budget", async () => {
    const res = await provider.qualifyLead({
      orgSlug: "acme-corp",
      leadId: "lead-test-3",
      leadTitle: "Urgent Retail Deployment",
      contactName: "Deepak Verma",
      contactPhone: "+919876543212",
      conversationMessages: [
        { sender: "customer", text: "We need this deployed immediately today! We have ₹75,000 ready." },
      ],
      notes: "",
    });

    expect(res.timeline).toContain("Immediate");
    expect(res.suggestedPriority).toBe("high");
    expect(res.explanation).toContain("High priority");
    expect(res.evidenceCitations.length).toBeGreaterThanOrEqual(1);
  });

  it("should default timeline to 'Unknown' when not specified by the customer", async () => {
    const res = await provider.qualifyLead({
      orgSlug: "acme-corp",
      leadId: "lead-test-4",
      leadTitle: "General Query",
      contactName: "Ritu Kapoor",
      contactPhone: "+919876543213",
      conversationMessages: [
        { sender: "customer", text: "Hello, do you have brochures?" },
      ],
      notes: "",
    });

    expect(res.timeline).toBe("Unknown");
    expect(res.suggestedPriority).toBe("needs_more_info");
  });

  it("should detect price sensitivity objection when customer expresses concern", async () => {
    const res = await provider.qualifyLead({
      orgSlug: "acme-corp",
      leadId: "lead-test-5",
      leadTitle: "Price Question",
      contactName: "Amitabh Sen",
      contactPhone: "+919876543214",
      conversationMessages: [
        { sender: "customer", text: "Your competitor is cheaper, ₹1,499/mo feels expensive for our small shop." },
      ],
      notes: "",
    });

    expect(res.keyObjections).toContain("Price sensitivity expressed");
  });

  it("should require human agent confirmation before applying assessment to CRM lead", () => {
    const initialQual = leadQualificationStore.getQualificationForLead("acme-corp", "c-101");
    expect(initialQual).not.toBeNull();
    expect(initialQual?.is_reviewed).toBe(false);

    // Apply confirmation with human agent ID
    const applied = leadQualificationStore.applyQualificationToLead(
      "acme-corp",
      initialQual!.id,
      "Rohan Deshmukh"
    );
    expect(applied).toBe(true);

    const updatedQual = leadQualificationStore.getQualificationForLead("acme-corp", "c-101");
    expect(updatedQual?.is_reviewed).toBe(true);
    expect(updatedQual?.reviewed_by).toBe("Rohan Deshmukh");
    expect(updatedQual?.reviewed_at).toBeDefined();
  });
});
