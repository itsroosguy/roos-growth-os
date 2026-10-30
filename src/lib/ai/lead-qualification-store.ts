import { LeadQualificationRecord, LeadQualificationResult } from "./types";
import { aiService } from "./ai-service";
import { crmStore } from "../crm/crm-store";
import { whatsappStore } from "../whatsapp/whatsapp-store";

class LeadQualificationStore {
  private qualifications: Map<string, LeadQualificationRecord[]> = new Map();

  constructor() {
    this.seedInitialQualifications();
  }

  private seedInitialQualifications() {
    // Seed initial assessment for Acme's lead
    this.qualifications.set("acme-corp", [
      {
        id: "lq-101",
        organization_id: "acme-corp",
        lead_id: "c-101",
        contact_id: "c-101",
        suggestedPriority: "high",
        leadCategory: "Retail Inventory Automation",
        mainRequirement: "Bulk inventory sync and multi-agent shared WhatsApp customer updates",
        productOfInterest: "Growth Plan — WhatsApp CRM Suite (₹799/mo)",
        budget: "₹50,000",
        timeline: "Immediate (Within 48h)",
        keyObjections: "None identified in initial inquiry",
        unansweredQuestions: "Needs clarification on whether Barcode scanners integrate with catalog",
        suggestedNextAction: "Schedule live catalog demo and confirm number of staff user seats",
        suggestedFollowupMessage:
          "Hi Aarav, following up on your request for Patel Enterprises: I can demonstrate the bulk inventory scanner integration this afternoon at 3:00 PM. Would that work?",
        explanation:
          "High priority: Customer specified explicit budget (₹50,000) and expressed urgent commercial need for bulk inventory sync.",
        evidenceCitations: [
          {
            quote: "Interested in bulk inventory management automation",
            context: "Initial customer requirement stated in contact record",
          },
          {
            quote: "Estimated deal value ₹50,000",
            context: "Sales pipeline opportunity record",
          },
        ],
        modelUsed: "gemini-1.5-flash",
        is_reviewed: false,
        created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
    ]);
    this.qualifications.set("demo-corp", this.qualifications.get("acme-corp") || []);
  }

  public getQualificationForLead(
    orgSlug: string,
    leadId: string
  ): LeadQualificationRecord | null {
    const list = this.qualifications.get(orgSlug) || [];
    return list.find((q) => q.lead_id === leadId) || null;
  }

  public async assessLead(
    orgSlug: string,
    leadId: string
  ): Promise<LeadQualificationRecord> {
    const lead = crmStore.getLeadById(orgSlug, leadId);
    if (!lead) {
      throw new Error(`Lead ${leadId} not found in workspace.`);
    }

    const contact = crmStore.getContactById(orgSlug, lead.contact_id);
    const conv = whatsappStore.getOrCreateConversationForContact(orgSlug, lead.contact_id);
    const messages = whatsappStore.getMessages(conv.id);

    const result = await aiService.qualifyLead({
      orgSlug,
      leadId: lead.id,
      leadTitle: lead.title,
      contactName: contact?.first_name ? `${contact.first_name} ${contact.last_name || ""}`.trim() : lead.title,
      contactPhone: contact?.phone || "+919876543210",
      conversationMessages: messages.map((m) => ({
        sender: m.sender_type,
        text: m.body,
      })),
      notes: lead.notes || contact?.notes || "",
    });

    const record: LeadQualificationRecord = {
      ...result,
      id: `lq-${Date.now()}`,
      organization_id: orgSlug,
      lead_id: lead.id,
      contact_id: lead.contact_id,
      is_reviewed: false,
      created_at: new Date().toISOString(),
    };

    const list = this.qualifications.get(orgSlug) || [];
    const existingIndex = list.findIndex((q) => q.lead_id === leadId);
    if (existingIndex >= 0) {
      list[existingIndex] = record;
    } else {
      list.unshift(record);
    }
    this.qualifications.set(orgSlug, list);

    return { ...record };
  }

  public applyQualificationToLead(
    orgSlug: string,
    qualificationId: string,
    reviewedBy: string = "Sales Agent"
  ): boolean {
    const list = this.qualifications.get(orgSlug) || [];
    const index = list.findIndex((q) => q.id === qualificationId);
    if (index === -1) return false;

    const qual = list[index];
    qual.is_reviewed = true;
    qual.reviewed_by = reviewedBy;
    qual.reviewed_at = new Date().toISOString();

    list[index] = qual;
    this.qualifications.set(orgSlug, list);
    return true;
  }
}

export const leadQualificationStore = new LeadQualificationStore();
