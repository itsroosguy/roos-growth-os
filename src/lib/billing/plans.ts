import { PlanDefinition, PlanTier, UnitEconomics } from "./types";

export const SUBSCRIPTION_PLANS: Record<PlanTier, PlanDefinition> = {
  starter: {
    tier: "starter",
    name: "Starter",
    tagline: "Essential CRM & task management for solopreneurs and micro-teams",
    description: "Affordable foundation for organizing contacts, tracking sales leads, and basic follow-ups.",
    monthlyPriceInr: 299,
    yearlyPriceInr: 2990, // ~17% discount (2 months free)
    limits: {
      maxTeamMembers: 2,
      maxContacts: 500,
      maxLeads: 500,
      maxActiveWorkflows: 3,
      maxWorkflowExecutionsPerMonth: 50,
      maxWhatsAppMessagesPerMonth: 100,
      campaignsEnabled: false,
      sharedInboxEnabled: false,
      advancedReportingEnabled: false,
      dataExportLimit: 500,
      prioritySupport: false,
    },
    features: [
      "1 organisation workspace",
      "Up to 2 team members",
      "Up to 500 active contacts & leads",
      "Lead pipeline board & table view",
      "Follow-up task tracking",
      "Up to 3 active automation rules",
      "50 workflow executions / month",
      "Mock WhatsApp mode during development",
      "Standard CSV export (up to 500 rows)",
    ],
  },
  growth: {
    tier: "growth",
    name: "Growth",
    tagline: "Collaborative WhatsApp CRM with shared inbox and automation",
    description: "Designed for scaling sales and customer service teams managing multi-agent conversations.",
    monthlyPriceInr: 799,
    yearlyPriceInr: 7990,
    popular: true,
    limits: {
      maxTeamMembers: 5,
      maxContacts: 5000,
      maxLeads: 5000,
      maxActiveWorkflows: 10,
      maxWorkflowExecutionsPerMonth: 500,
      maxWhatsAppMessagesPerMonth: 1000,
      campaignsEnabled: true,
      sharedInboxEnabled: true,
      advancedReportingEnabled: true,
      dataExportLimit: 5000,
      prioritySupport: false,
    },
    features: [
      "Up to 5 team members",
      "Up to 5,000 active contacts & leads",
      "Multi-agent WhatsApp shared inbox",
      "Internal notes & team assignment",
      "Up to 10 active automation rules",
      "500 workflow executions / month",
      "Controlled WhatsApp broadcast campaigns",
      "Advanced sales & conversation reporting",
      "CSV import & export (up to 5,000 rows)",
      "Official Meta WhatsApp API integration",
    ],
  },
  business: {
    tier: "business",
    name: "Business",
    tagline: "High-volume automation, custom segments, and dedicated support",
    description: "Full-capacity Business OS for established SMEs with high message volume and strict SLAs.",
    monthlyPriceInr: 1499,
    yearlyPriceInr: 14990,
    limits: {
      maxTeamMembers: 15,
      maxContacts: 20000,
      maxLeads: 20000,
      maxActiveWorkflows: 50,
      maxWorkflowExecutionsPerMonth: 2500,
      maxWhatsAppMessagesPerMonth: 5000,
      campaignsEnabled: true,
      sharedInboxEnabled: true,
      advancedReportingEnabled: true,
      dataExportLimit: 20000,
      prioritySupport: true,
    },
    features: [
      "Up to 15 team members",
      "Up to 20,000 active contacts & leads",
      "Advanced team assignment controls",
      "Up to 50 active automation workflows",
      "2,500 workflow executions / month",
      "Campaign delivery & conversion analytics",
      "Audience segment engine with opt-out guards",
      "Full audit trail & payment event history",
      "Priority customer support designation",
    ],
  },
};

export function getPlanDefinition(tier: PlanTier): PlanDefinition {
  return SUBSCRIPTION_PLANS[tier] || SUBSCRIPTION_PLANS.starter;
}

export function getAllPlans(): PlanDefinition[] {
  return Object.values(SUBSCRIPTION_PLANS);
}

/**
 * Calculates preliminary unit economics and contribution margin per plan.
 * Contribution = Subscription Revenue (excl. GST) - Payment Fees - Direct Infra - Messaging Cost.
 */
export function calculateUnitEconomics(tier: PlanTier): UnitEconomics {
  const plan = getPlanDefinition(tier);
  const monthlyPrice = plan.monthlyPriceInr;
  const gstRate = 0.18; // 18% GST in India
  const gstInr = Math.round(monthlyPrice * gstRate);
  const revenueExclGstInr = monthlyPrice; // B2B prices quoted excl GST

  // Payment gateway fee (Razorpay standard domestic: 2% + 18% GST on the 2% fee = 2.36%)
  const paymentGatewayFeeInr = parseFloat((monthlyPrice * 0.02 * 1.18).toFixed(2));

  // Infrastructure allocation per organization (Vercel compute, Supabase storage, background queue)
  const infraMap: Record<PlanTier, number> = {
    starter: 35,
    growth: 60,
    business: 95,
  };
  const infrastructureAllocationInr = infraMap[tier];

  // Messaging cost allocation: In development mock mode this is 0;
  // in production, estimated weighted blend of utility & marketing WhatsApp templates
  const messagingCostMap: Record<PlanTier, number> = {
    starter: 0, // Mock mode during early stage
    growth: 45, // ~150 outbound billable template messages
    business: 160, // ~500 outbound billable template messages
  };
  const messagingAllowanceCostInr = messagingCostMap[tier];

  const totalDirectCosts = paymentGatewayFeeInr + infrastructureAllocationInr + messagingAllowanceCostInr;
  const contributionMarginInr = parseFloat((revenueExclGstInr - totalDirectCosts).toFixed(2));
  const contributionMarginPercentage = parseFloat(((contributionMarginInr / revenueExclGstInr) * 100).toFixed(1));

  return {
    planTier: tier,
    monthlyPriceInr: monthlyPrice,
    gstInr,
    revenueExclGstInr,
    paymentGatewayFeeInr,
    infrastructureAllocationInr,
    messagingAllowanceCostInr,
    contributionMarginInr,
    contributionMarginPercentage,
  };
}
