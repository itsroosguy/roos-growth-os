import { ConsentStatus, LeadStage } from "@/types/crm";

export type TemplateCategory = "marketing" | "utility" | "authentication";

export type TemplateStatus = "APPROVED" | "PENDING" | "REJECTED" | "DRAFT";

export interface WhatsAppTemplateRecord {
  id: string;
  organization_id: string;
  meta_template_id?: string | null;
  name: string; // Lowercase alphanumeric with underscores (Meta rule)
  category: TemplateCategory;
  language: string; // e.g. "en_US", "en", "hi"
  status: TemplateStatus;
  body_content: string; // Must contain variables like {{1}}, {{2}}
  header_text?: string | null;
  footer_text?: string | null;
  variables: string[]; // ["1", "2"]
  sample_values: Record<string, string>; // {"1": "Aarav", "2": "Acme"}
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AudienceFilterCriteria {
  tags?: string[];
  source?: string;
  lead_stages?: LeadStage[];
  assigned_to?: string;
  consent_status?: ConsentStatus[];
  created_after?: string;
  created_before?: string;
  age_range?: string; // "all" | "18-25" | "26-35" | "36-50" | "50+"
  gender?: "all" | "male" | "female" | "other";
  department?: string; // "all" | "finance" | "operations" | "marketing" | "executive" | "technology" | "sales"
  classification?: string; // "all" | "ongoing_client" | "new_opportunity"
  recipient_limit?: number | null;
}

export interface AudienceSegment {
  id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  filter_criteria: AudienceFilterCriteria;
  created_at: string;
  updated_at: string;
}

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "processing"
  | "paused"
  | "completed"
  | "cancelled"
  | "failed";

export type RecipientDeliveryStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "skipped"
  | "cancelled";

export interface Campaign {
  id: string;
  organization_id: string;
  name: string;
  template_id: string;
  template_name: string;
  template_category: TemplateCategory;
  segment_id?: string | null;
  filter_criteria: AudienceFilterCriteria;
  variable_mappings: Record<string, string>; // Maps var index (e.g. "1") to contact field (e.g. "first_name")
  status: CampaignStatus;
  scheduled_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  estimated_cost: number;
  actual_cost: number;
  recipient_limit?: number | null;
  is_test_mode: boolean;
  is_simulated: boolean;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignRecipient {
  id: string;
  campaign_id: string;
  organization_id: string;
  contact_id: string;
  contact_name: string;
  phone: string;
  status: RecipientDeliveryStatus;
  rendered_body: string;
  external_message_id?: string | null;
  idempotency_key: string;
  error_message?: string | null;
  cost: number;
  age?: number;
  gender?: "male" | "female" | "other";
  department?: string;
  classification?: string;
  city?: string;
  sent_at?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
  created_at: string;
}

export interface PricingEstimate {
  category: TemplateCategory;
  eligibleRecipients: number;
  unitCostINR: number;
  estimatedTotalCostINR: number;
  currency: string;
  pricingDate: string;
  monthlyBudgetLimitINR: number;
  currentMonthlyUsageINR: number;
  isOverBudget: boolean;
  totalMatchedContacts: number;
  suppressedOptOutCount: number;
  suppressedConsentCount: number;
}
