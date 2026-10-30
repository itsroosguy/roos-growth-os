import { WhatsAppTemplateRecord, TemplateCategory, TemplateStatus } from "./types";

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  variables: string[];
}

class TemplateStore {
  private templates: Map<string, WhatsAppTemplateRecord[]> = new Map();

  constructor() {
    this.seedInitialTemplates();
  }

  private seedInitialTemplates() {
    const acmeOrg = "acme-corp";
    const betaOrg = "beta-logistics";

    const acmeTemplates: WhatsAppTemplateRecord[] = [
      {
        id: "tpl-101",
        organization_id: acmeOrg,
        meta_template_id: "meta_tpl_seasonal_offer_991",
        name: "seasonal_promotion_offer",
        category: "marketing",
        language: "en",
        status: "APPROVED",
        header_text: "Exclusive Business Offer",
        body_content: "Hello {{1}}, we are pleased to offer Patel Enterprises an exclusive 20% savings on our retail automation suite for this quarter. Use code SAVE20 before month-end. Reply STOP to opt out.",
        footer_text: "Acme Technologies • Automated WhatsApp Services",
        variables: ["1"],
        sample_values: { "1": "Aarav" },
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 8).toISOString(),
      },
      {
        id: "tpl-102",
        organization_id: acmeOrg,
        meta_template_id: "meta_tpl_order_dispatch_882",
        name: "order_dispatch_notification",
        category: "utility",
        language: "en",
        status: "APPROVED",
        header_text: "Order Update",
        body_content: "Dear {{1}}, your order #{{2}} has been confirmed and scheduled for dispatch. Tracking details will follow shortly. Thank you for choosing Acme.",
        footer_text: "Customer Support Helpline: +91 98765 43210",
        variables: ["1", "2"],
        sample_values: { "1": "Neha", "2": "ORD-5421" },
        created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 6).toISOString(),
      },
      {
        id: "tpl-103",
        organization_id: acmeOrg,
        meta_template_id: "meta_tpl_payment_reminder_773",
        name: "payment_reminder_v1",
        category: "utility",
        language: "en",
        status: "APPROVED",
        header_text: "Invoice Due Notice",
        body_content: "Hi {{1}}, this is a friendly reminder that invoice {{2}} for ₹{{3}} is due on {{4}}. Please let us know if you require any assistance.",
        footer_text: "Accounts & Billing Department",
        variables: ["1", "2", "3", "4"],
        sample_values: { "1": "Sneha", "2": "INV-2026-08", "3": "45,000", "4": "Thursday" },
        created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: "tpl-104",
        organization_id: acmeOrg,
        name: "annual_software_renewal_blast",
        category: "marketing",
        language: "en",
        status: "PENDING",
        header_text: "Annual Renewal Notice",
        body_content: "Hello {{1}}, renew your Business OS subscription before {{2}} to lock in your legacy rate for another 12 months. Reply STOP to unsubscribe.",
        footer_text: "Terms and conditions apply.",
        variables: ["1", "2"],
        sample_values: { "1": "Rohan", "2": "March 31" },
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: "tpl-105",
        organization_id: acmeOrg,
        name: "uncompliant_crypto_offer",
        category: "marketing",
        language: "en",
        status: "REJECTED",
        body_content: "{{1}} get 500% instant return on investment by clicking our external link.",
        variables: ["1"],
        sample_values: { "1": "Customer" },
        rejection_reason: "Meta Policy Violation: Financial promotion violates Meta WhatsApp Commerce and Financial Products Policy. Variable {{1}} also placed at beginning without greeting.",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
    ];

    const betaTemplates: WhatsAppTemplateRecord[] = [
      {
        id: "tpl-beta-1",
        organization_id: betaOrg,
        meta_template_id: "meta_tpl_beta_fleet_1",
        name: "fleet_schedule_alert",
        category: "utility",
        language: "en",
        status: "APPROVED",
        body_content: "Hello {{1}}, vehicle {{2}} is on schedule for delivery at {{3}}.",
        variables: ["1", "2", "3"],
        sample_values: { "1": "Karan", "2": "MH-04-1234", "3": "4 PM" },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.templates.set(acmeOrg, acmeTemplates);
    this.templates.set("demo-corp", acmeTemplates);
    this.templates.set(betaOrg, betaTemplates);
  }

  /**
   * Validates template content according to official Meta Cloud API guidelines
   */
  validateTemplateDraft(
    data: {
      name: string;
      category: TemplateCategory;
      bodyContent: string;
      sampleValues?: Record<string, string>;
    }
  ): TemplateValidationResult {
    const errors: string[] = [];

    // 1. Name validation: lowercase alphanumeric + underscore only
    const nameRegex = /^[a-z0-9_]{1,512}$/;
    if (!data.name || !nameRegex.test(data.name)) {
      errors.push("Template name must contain only lowercase letters, numbers, and underscores (e.g. 'welcome_offer_2026').");
    }

    // 2. Body length & presence
    if (!data.bodyContent || !data.bodyContent.trim()) {
      errors.push("Template body content cannot be empty.");
    } else if (data.bodyContent.length > 1024) {
      errors.push("Template body content exceeds Meta maximum limit of 1,024 characters.");
    }

    // 3. Extract variables {{1}}, {{2}}, etc.
    const variableRegex = /\{\{(\d+)\}\}/g;
    const extractedVars: string[] = [];
    let match;
    while ((match = variableRegex.exec(data.bodyContent)) !== null) {
      extractedVars.push(match[1]);
    }

    // Deduplicate variables
    const uniqueVars = Array.from(new Set(extractedVars)).sort((a, b) => parseInt(a) - parseInt(b));

    // 4. Sequential numbering check (e.g. 1, 2, 3...)
    for (let i = 0; i < uniqueVars.length; i++) {
      const expectedIndex = (i + 1).toString();
      if (uniqueVars[i] !== expectedIndex) {
        errors.push(`Template variables must be sequentially numbered starting from {{1}}. Found {{${uniqueVars[i]}}} instead of {{${expectedIndex}}}.`);
        break;
      }
    }

    // 5. Variable placement checks (Meta policy: variable cannot be start/end without surrounding text)
    const trimmedBody = data.bodyContent.trim();
    if (trimmedBody.startsWith("{{") && !trimmedBody.includes(" ")) {
      errors.push("Variables should not be placed at the very start of the message without greeting or contextual text.");
    }

    // 6. Marketing opt-out disclaimer requirement
    if (data.category === "marketing") {
      const lower = data.bodyContent.toLowerCase();
      if (!lower.includes("stop") && !lower.includes("opt out") && !lower.includes("unsubscribe")) {
        errors.push("Meta Policy Recommendation: Marketing templates should include an opt-out instruction (e.g. 'Reply STOP to opt out').");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      variables: uniqueVars,
    };
  }

  getTemplates(orgSlug: string): WhatsAppTemplateRecord[] {
    return [...(this.templates.get(orgSlug) || [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  getApprovedTemplates(orgSlug: string): WhatsAppTemplateRecord[] {
    return this.getTemplates(orgSlug).filter((t) => t.status === "APPROVED");
  }

  getTemplateById(orgSlug: string, templateId: string): WhatsAppTemplateRecord | null {
    const list = this.templates.get(orgSlug) || [];
    return list.find((t) => t.id === templateId) || null;
  }

  createTemplateDraft(
    orgSlug: string,
    data: {
      name: string;
      category: TemplateCategory;
      language?: string;
      body_content: string;
      header_text?: string;
      footer_text?: string;
      sample_values?: Record<string, string>;
    }
  ): { success: boolean; template?: WhatsAppTemplateRecord; errors?: string[] } {
    const validation = this.validateTemplateDraft({
      name: data.name,
      category: data.category,
      bodyContent: data.body_content,
      sampleValues: data.sample_values,
    });

    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const list = this.templates.get(orgSlug) || [];
    const newTemplate: WhatsAppTemplateRecord = {
      id: `tpl-${Date.now()}`,
      organization_id: orgSlug,
      name: data.name,
      category: data.category,
      language: data.language || "en",
      status: "PENDING", // Starts as PENDING awaiting Meta Cloud API review
      body_content: data.body_content,
      header_text: data.header_text || null,
      footer_text: data.footer_text || null,
      variables: validation.variables,
      sample_values: data.sample_values || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    list.unshift(newTemplate);
    this.templates.set(orgSlug, list);

    return { success: true, template: newTemplate };
  }

  // Simulation helpers for Mock Mode
  simulateMetaApproval(orgSlug: string, templateId: string): boolean {
    const tpl = this.getTemplateById(orgSlug, templateId);
    if (!tpl) return false;
    tpl.status = "APPROVED";
    tpl.meta_template_id = `meta_sim_${Date.now()}`;
    tpl.rejection_reason = null;
    tpl.updated_at = new Date().toISOString();
    return true;
  }

  simulateMetaRejection(orgSlug: string, templateId: string, reason: string): boolean {
    const tpl = this.getTemplateById(orgSlug, templateId);
    if (!tpl) return false;
    tpl.status = "REJECTED";
    tpl.rejection_reason = reason;
    tpl.updated_at = new Date().toISOString();
    return true;
  }

  renderTemplateBody(template: WhatsAppTemplateRecord, variables: Record<string, string>): string {
    let rendered = template.body_content;
    Object.entries(variables).forEach(([key, val]) => {
      rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val);
    });
    return rendered;
  }
}

const globalTemplateStore = (global as unknown as { __templateStore?: TemplateStore });
export const templateStore = globalTemplateStore.__templateStore ?? new TemplateStore();
if (process.env.NODE_ENV !== "production") {
  globalTemplateStore.__templateStore = templateStore;
}
