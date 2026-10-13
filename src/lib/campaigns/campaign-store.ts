import {
  Campaign,
  CampaignRecipient,
  CampaignStatus,
  AudienceFilterCriteria,
  TemplateCategory,
  RecipientDeliveryStatus,
} from "./types";
import { templateStore } from "./template-store";
import { segmentEngine } from "./segment-engine";
import { calculateCampaignPricing } from "./pricing";
import { crmStore } from "../crm/crm-store";
import { Contact } from "@/types/crm";

export interface CreateCampaignPayload {
  name: string;
  templateId: string;
  segmentId?: string;
  filterCriteria: AudienceFilterCriteria;
  variableMappings: Record<string, string>;
  scheduledAt?: string;
  recipientLimit?: number;
  isTestMode?: boolean;
  createdByName?: string;
}

class CampaignStore {
  private campaigns: Map<string, Campaign[]> = new Map();
  private recipients: Map<string, CampaignRecipient[]> = new Map(); // campaign_id -> recipients[]
  private processedRecipientKeys: Set<string> = new Set(); // For idempotency deduplication

  constructor() {
    this.seedInitialCampaigns();
  }

  private seedInitialCampaigns() {
    const acmeOrg = "acme-corp";
    const betaOrg = "beta-logistics";

    const camp1Id = "camp-101";
    const camp2Id = "camp-102";

    const acmeCampaigns: Campaign[] = [
      {
        id: camp1Id,
        organization_id: acmeOrg,
        name: "Q4 Retail Automation Announcement",
        template_id: "tpl-101",
        template_name: "seasonal_promotion_offer",
        template_category: "marketing",
        segment_id: "seg-101",
        filter_criteria: {
          tags: ["VIP", "Retail"],
          consent_status: ["opted_in"],
        },
        variable_mappings: { "1": "first_name" },
        status: "completed",
        scheduled_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        started_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        completed_at: new Date(Date.now() - 86400000 * 2 + 15000).toISOString(),
        total_recipients: 2,
        sent_count: 2,
        delivered_count: 2,
        read_count: 1,
        failed_count: 0,
        estimated_cost: 1.64,
        actual_cost: 1.64,
        recipient_limit: null,
        is_test_mode: false,
        is_simulated: true,
        created_by_name: "Workspace Founder",
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: camp2Id,
        organization_id: acmeOrg,
        name: "Scheduled Logistics Follow-up",
        template_id: "tpl-102",
        template_name: "order_dispatch_notification",
        template_category: "utility",
        filter_criteria: {
          tags: ["Logistics"],
          consent_status: ["opted_in"],
        },
        variable_mappings: { "1": "first_name", "2": "company" },
        status: "scheduled",
        scheduled_at: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days in future
        total_recipients: 1,
        sent_count: 0,
        delivered_count: 0,
        read_count: 0,
        failed_count: 0,
        estimated_cost: 0.35,
        actual_cost: 0,
        recipient_limit: 10,
        is_test_mode: true,
        is_simulated: true,
        created_by_name: "Operations Lead",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ];

    this.campaigns.set(acmeOrg, acmeCampaigns);
    this.campaigns.set(betaOrg, []);

    // Seed recipients for completed campaign 1
    const camp1Recipients: CampaignRecipient[] = [
      {
        id: "recip-101",
        campaign_id: camp1Id,
        organization_id: acmeOrg,
        contact_id: "c-101",
        contact_name: "Aarav Patel",
        phone: "+919876543210",
        status: "read",
        rendered_body: "Hello Aarav, we are pleased to offer Patel Enterprises an exclusive 20% savings on our retail automation suite for this quarter. Use code SAVE20 before month-end. Reply STOP to opt out.",
        external_message_id: "mock_camp_wamid_aarav_1",
        idempotency_key: `camp_${camp1Id}_c_101`,
        cost: 0.82,
        sent_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        delivered_at: new Date(Date.now() - 86400000 * 2 + 2000).toISOString(),
        read_at: new Date(Date.now() - 86400000 * 2 + 5000).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: "recip-102",
        campaign_id: camp1Id,
        organization_id: acmeOrg,
        contact_id: "c-102",
        contact_name: "Neha Gupta",
        phone: "+919876543211",
        status: "delivered",
        rendered_body: "Hello Neha, we are pleased to offer Patel Enterprises an exclusive 20% savings on our retail automation suite for this quarter. Use code SAVE20 before month-end. Reply STOP to opt out.",
        external_message_id: "mock_camp_wamid_neha_2",
        idempotency_key: `camp_${camp1Id}_c_102`,
        cost: 0.82,
        sent_at: new Date(Date.now() - 86400000 * 2 + 1000).toISOString(),
        delivered_at: new Date(Date.now() - 86400000 * 2 + 4000).toISOString(),
        read_at: null,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ];

    this.recipients.set(camp1Id, camp1Recipients);
    this.recipients.set(camp2Id, []);

    this.processedRecipientKeys.add(`camp_${camp1Id}_c_101`);
    this.processedRecipientKeys.add(`camp_${camp1Id}_c_102`);
  }

  // ============================================================================
  // CAMPAIGN MANAGEMENT
  // ============================================================================
  getCampaigns(orgSlug: string): Campaign[] {
    return [...(this.campaigns.get(orgSlug) || [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  getCampaignById(orgSlug: string, campaignId: string): Campaign | null {
    const list = this.campaigns.get(orgSlug) || [];
    return list.find((c) => c.id === campaignId) || null;
  }

  getCampaignRecipients(campaignId: string): CampaignRecipient[] {
    return [...(this.recipients.get(campaignId) || [])];
  }

  /**
   * Creates and optionally executes a controlled WhatsApp campaign
   */
  createCampaign(
    orgSlug: string,
    payload: CreateCampaignPayload
  ): { success: boolean; campaign?: Campaign; error?: string } {
    // 1. Template Validation: must exist and be APPROVED by Meta
    const tpl = templateStore.getTemplateById(orgSlug, payload.templateId);
    if (!tpl) {
      return { success: false, error: "Template not found." };
    }
    if (tpl.status !== "APPROVED") {
      return {
        success: false,
        error: `Cannot launch campaign with ${tpl.status} template. Meta Cloud API requires an APPROVED template.`,
      };
    }

    // 2. Audience Evaluation & Consent Filtering (Real-time recalculation)
    const isMarketing = tpl.category === "marketing";
    const segmentResult = segmentEngine.evaluateCriteria(orgSlug, payload.filterCriteria, isMarketing);

    let targetContacts = segmentResult.eligibleContacts;
    if (targetContacts.length === 0) {
      return {
        success: false,
        error: "No eligible recipients found matching the criteria. Opted-out or non-consented contacts were excluded.",
      };
    }

    // Recipient limit capping
    if (payload.recipientLimit && payload.recipientLimit > 0) {
      targetContacts = targetContacts.slice(0, payload.recipientLimit);
    }

    // 3. Pricing Calculation & Cost Limits
    const pricing = calculateCampaignPricing(
      tpl.category,
      targetContacts.length,
      segmentResult.totalMatched,
      segmentResult.suppressedOptOutCount,
      segmentResult.suppressedConsentCount
    );

    if (pricing.isOverBudget) {
      return {
        success: false,
        error: `Campaign cost (₹${pricing.estimatedTotalCostINR}) exceeds configured monthly spending limit (₹${pricing.monthlyBudgetLimitINR}).`,
      };
    }

    const campaignId = `camp-${Date.now()}`;
    const isImmediate = !payload.scheduledAt || new Date(payload.scheduledAt) <= new Date();

    const newCampaign: Campaign = {
      id: campaignId,
      organization_id: orgSlug,
      name: payload.name.trim(),
      template_id: tpl.id,
      template_name: tpl.name,
      template_category: tpl.category,
      segment_id: payload.segmentId || null,
      filter_criteria: payload.filterCriteria,
      variable_mappings: payload.variableMappings,
      status: isImmediate ? "processing" : "scheduled",
      scheduled_at: payload.scheduledAt || null,
      started_at: isImmediate ? new Date().toISOString() : null,
      completed_at: null,
      total_recipients: targetContacts.length,
      sent_count: 0,
      delivered_count: 0,
      read_count: 0,
      failed_count: 0,
      estimated_cost: pricing.estimatedTotalCostINR,
      actual_cost: 0,
      recipient_limit: payload.recipientLimit || null,
      is_test_mode: payload.isTestMode || false,
      is_simulated: true,
      created_by_name: payload.createdByName || "Staff Member",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 4. Provision Recipient Send Queue with Idempotency Keys
    const recipientList: CampaignRecipient[] = targetContacts.map((c) => {
      const idempotencyKey = `camp_${campaignId}_c_${c.id}`;

      // Render customized variables for this specific contact
      const varValues: Record<string, string> = {};
      Object.entries(payload.variableMappings).forEach(([varKey, contactField]) => {
        const val = (c as unknown as Record<string, unknown>)[contactField];
        varValues[varKey] = (val as string) || c.first_name;
      });

      const renderedText = templateStore.renderTemplateBody(tpl, varValues);

      return {
        id: `recip-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        campaign_id: campaignId,
        organization_id: orgSlug,
        contact_id: c.id,
        contact_name: `${c.first_name} ${c.last_name || ""}`.trim(),
        phone: c.phone,
        status: "queued",
        rendered_body: renderedText,
        external_message_id: null,
        idempotency_key: idempotencyKey,
        cost: pricing.unitCostINR,
        created_at: new Date().toISOString(),
      };
    });

    const orgCampaigns = this.campaigns.get(orgSlug) || [];
    orgCampaigns.unshift(newCampaign);
    this.campaigns.set(orgSlug, orgCampaigns);
    this.recipients.set(campaignId, recipientList);

    // 5. If immediate, process the queue synchronously in local Mock Mode
    if (isImmediate) {
      this.executeCampaignQueue(orgSlug, campaignId);
    }

    return { success: true, campaign: newCampaign };
  }

  /**
   * Executes the send queue with idempotency protection and status progression
   */
  executeCampaignQueue(orgSlug: string, campaignId: string): void {
    const campaign = this.getCampaignById(orgSlug, campaignId);
    if (
      !campaign ||
      campaign.status === "cancelled" ||
      campaign.status === "paused" ||
      campaign.status === "completed"
    ) {
      return;
    }

    const recipients = this.recipients.get(campaignId) || [];
    let sent = 0;
    let delivered = 0;
    let read = 0;
    let failed = 0;
    let totalCost = 0;

    recipients.forEach((recip, index) => {
      // Idempotency check: duplicate send prevention
      if (this.processedRecipientKeys.has(recip.idempotency_key) && recip.status !== "queued") {
        return;
      }

      this.processedRecipientKeys.add(recip.idempotency_key);

      // Re-check consent before actual send (Zero-tolerance opt-out enforcement)
      const currentContact = crmStore.getContactById(orgSlug, recip.contact_id);
      if (currentContact && currentContact.consent_status === "opted_out") {
        recip.status = "skipped";
        recip.error_message = "Suppressed: Customer opted out of WhatsApp communication.";
        return;
      }

      // Simulate network dispatch with realistic wamid
      const nowIso = new Date().toISOString();
      recip.external_message_id = `mock_camp_wamid_${Date.now()}_${index}`;
      recip.sent_at = nowIso;
      sent++;
      totalCost += recip.cost;

      // Simulate delivery rates (80% delivered, 50% read)
      recip.status = "delivered";
      recip.delivered_at = nowIso;
      delivered++;

      if (index % 2 === 0) {
        recip.status = "read";
        recip.read_at = nowIso;
        read++;
      }
    });

    campaign.sent_count = sent;
    campaign.delivered_count = delivered;
    campaign.read_count = read;
    campaign.failed_count = failed;
    campaign.actual_cost = Math.round(totalCost * 100) / 100;
    campaign.status = "completed";
    campaign.completed_at = new Date().toISOString();
    campaign.updated_at = new Date().toISOString();
  }

  pauseCampaign(orgSlug: string, campaignId: string): boolean {
    const camp = this.getCampaignById(orgSlug, campaignId);
    if (!camp || camp.status === "completed" || camp.status === "cancelled") return false;
    camp.status = "paused";
    camp.updated_at = new Date().toISOString();
    return true;
  }

  resumeCampaign(orgSlug: string, campaignId: string): boolean {
    const camp = this.getCampaignById(orgSlug, campaignId);
    if (!camp || camp.status !== "paused") return false;
    camp.status = "processing";
    camp.updated_at = new Date().toISOString();
    this.executeCampaignQueue(orgSlug, campaignId);
    return true;
  }

  cancelCampaign(orgSlug: string, campaignId: string): boolean {
    const camp = this.getCampaignById(orgSlug, campaignId);
    if (!camp || camp.status === "completed") return false;
    camp.status = "cancelled";
    camp.updated_at = new Date().toISOString();

    // Cancel remaining queued recipients
    const recips = this.recipients.get(campaignId) || [];
    recips.forEach((r) => {
      if (r.status === "queued") {
        r.status = "cancelled";
      }
    });

    return true;
  }

  /**
   * Inbound keyword handler for automatic STOP / opt-out compliance
   */
  handleInboundKeyword(orgSlug: string, phone: string, text: string): boolean {
    const cleanText = text.trim().toUpperCase();
    if (cleanText === "STOP" || cleanText === "UNSUBSCRIBE" || cleanText === "OPTOUT") {
      const contacts = crmStore.getContacts(orgSlug, true);
      const matched = contacts.find((c) => c.phone.replace(/[^\d]/g, "") === phone.replace(/[^\d]/g, ""));
      if (matched) {
        crmStore.updateContact(orgSlug, matched.id, {
          consent_status: "opted_out",
          consent_opted_out_at: new Date().toISOString(),
        });
        return true;
      }
    }
    return false;
  }

  /**
   * Generates a validated CSV export of campaign delivery results
   */
  exportCampaignReportCSV(campaignId: string): string {
    const recips = this.recipients.get(campaignId) || [];
    const headers = [
      "Contact Name",
      "Phone",
      "Status",
      "External Message ID",
      "Cost (INR)",
      "Sent At",
      "Delivered At",
      "Read At",
      "Error Reason",
    ];

    const rows = recips.map((r) => [
      `"${r.contact_name.replace(/"/g, '""')}"`,
      `"${r.phone}"`,
      r.status,
      r.external_message_id || "",
      r.cost.toFixed(2),
      r.sent_at || "",
      r.delivered_at || "",
      r.read_at || "",
      `"${(r.error_message || "").replace(/"/g, '""')}"`,
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }
}

const globalCampaignStore = (global as unknown as { __campaignStore?: CampaignStore });
export const campaignStore = globalCampaignStore.__campaignStore ?? new CampaignStore();
if (process.env.NODE_ENV !== "production") {
  globalCampaignStore.__campaignStore = campaignStore;
}
