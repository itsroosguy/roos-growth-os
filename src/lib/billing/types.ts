export type PlanTier = "starter" | "growth" | "business";

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "trialing"
  | "suspended"
  | "expired";

export type BillingInterval = "monthly" | "yearly";

export interface PlanLimits {
  maxTeamMembers: number;
  maxContacts: number;
  maxLeads: number;
  maxActiveWorkflows: number;
  maxWorkflowExecutionsPerMonth: number;
  maxWhatsAppMessagesPerMonth: number;
  campaignsEnabled: boolean;
  sharedInboxEnabled: boolean;
  advancedReportingEnabled: boolean;
  dataExportLimit: number;
  prioritySupport: boolean;
}

export interface PlanDefinition {
  tier: PlanTier;
  name: string;
  tagline: string;
  description: string;
  monthlyPriceInr: number;
  yearlyPriceInr: number; // Discounted annual pricing
  limits: PlanLimits;
  features: string[];
  popular?: boolean;
}

export interface TenantSubscription {
  id: string;
  organization_id: string;
  plan_tier: PlanTier;
  status: SubscriptionStatus;
  billing_interval: BillingInterval;
  mode: "development" | "live";
  provider: "manual" | "mock" | "razorpay" | "stripe";
  provider_customer_id?: string | null;
  provider_subscription_id?: string | null;
  current_period_start: string;
  current_period_end: string;
  trial_ends_at?: string | null;
  grace_period_ends_at?: string | null;
  cancel_at_period_end: boolean;
  cancel_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentEvent {
  id: string;
  organization_id: string;
  provider: "manual" | "mock" | "razorpay" | "stripe";
  provider_payment_id?: string;
  provider_invoice_id?: string;
  amount_inr_paise: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  payment_method: string; // 'upi' | 'card' | 'netbanking'
  receipt_url?: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export type UsageMetricName =
  | "team_seats"
  | "active_contacts"
  | "active_leads"
  | "active_workflows"
  | "workflow_executions"
  | "whatsapp_messages"
  | "campaign_recipients";

export interface MetricUsageItem {
  metric_name: UsageMetricName;
  label: string;
  current_count: number;
  max_quota: number;
  unit: string;
  percentage_used: number;
  is_warning: boolean; // >= 80%
  is_exceeded: boolean; // >= 100%
  admin_override_quota?: number;
}

export interface TenantUsageSummary {
  organization_id: string;
  period_month: string; // 'YYYY-MM-01'
  metrics: Record<UsageMetricName, MetricUsageItem>;
  is_any_exceeded: boolean;
  updated_at: string;
}

export interface PlanOverride {
  id: string;
  organization_id: string;
  metric_name: UsageMetricName;
  extra_quota: number;
  reason: string;
  granted_by?: string;
  expires_at?: string | null;
  created_at: string;
}

export interface UnitEconomics {
  planTier: PlanTier;
  monthlyPriceInr: number;
  gstInr: number; // 18% GST collected for government
  revenueExclGstInr: number;
  paymentGatewayFeeInr: number; // 2% + 18% GST on the fee
  infrastructureAllocationInr: number; // Cloud hosting, Supabase DB share
  messagingAllowanceCostInr: number; // Estimated Meta cost for WhatsApp quota
  contributionMarginInr: number;
  contributionMarginPercentage: number;
}
