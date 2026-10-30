import {
  BillingInterval,
  PaymentEvent,
  PlanTier,
  SubscriptionStatus,
  TenantSubscription,
} from "./types";
import { getPlanDefinition } from "./plans";

class SubscriptionService {
  private subscriptions: Map<string, TenantSubscription> = new Map();
  private paymentEvents: Map<string, PaymentEvent[]> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // 1. Acme Technologies (Growth Plan, Active)
    this.subscriptions.set("acme-corp", {
      id: "sub-acme-1",
      organization_id: "acme-corp",
      plan_tier: "growth",
      status: "active",
      billing_interval: "monthly",
      mode: "development",
      provider: "mock",
      provider_customer_id: "cus_mock_acme",
      provider_subscription_id: "sub_mock_acme_growth",
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: false,
      created_at: new Date(now.getTime() - 86400000 * 45).toISOString(),
      updated_at: new Date().toISOString(),
    });
    this.subscriptions.set("demo-corp", {
      ...this.subscriptions.get("acme-corp")!,
      organization_id: "demo-corp",
      id: "sub-demo-1",
    });

    this.paymentEvents.set("acme-corp", [
      {
        id: "pay-acme-1",
        organization_id: "acme-corp",
        provider: "mock",
        provider_payment_id: "pay_mock_98231",
        provider_invoice_id: "inv_2026_09_acme",
        amount_inr_paise: 79900, // ₹799.00
        currency: "INR",
        status: "succeeded",
        payment_method: "upi",
        receipt_url: "https://receipts.business-os.in/inv_2026_09_acme.pdf",
        description: "Growth Plan — Monthly Subscription (Sep 2026)",
        created_at: new Date(now.getTime() - 86400000 * 30).toISOString(),
      },
      {
        id: "pay-acme-2",
        organization_id: "acme-corp",
        provider: "mock",
        provider_payment_id: "pay_mock_10482",
        provider_invoice_id: "inv_2026_10_acme",
        amount_inr_paise: 79900, // ₹799.00
        currency: "INR",
        status: "succeeded",
        payment_method: "upi",
        receipt_url: "https://receipts.business-os.in/inv_2026_10_acme.pdf",
        description: "Growth Plan — Monthly Subscription (Oct 2026)",
        created_at: periodStart,
      },
    ]);
    this.paymentEvents.set("demo-corp", this.paymentEvents.get("acme-corp") || []);

    // 2. Beta Logistics (Starter Plan, Active)
    this.subscriptions.set("beta-logistics", {
      id: "sub-beta-1",
      organization_id: "beta-logistics",
      plan_tier: "starter",
      status: "active",
      billing_interval: "monthly",
      mode: "development",
      provider: "mock",
      provider_customer_id: "cus_mock_beta",
      provider_subscription_id: "sub_mock_beta_starter",
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: false,
      created_at: new Date(now.getTime() - 86400000 * 15).toISOString(),
      updated_at: new Date().toISOString(),
    });

    this.paymentEvents.set("beta-logistics", [
      {
        id: "pay-beta-1",
        organization_id: "beta-logistics",
        provider: "mock",
        provider_payment_id: "pay_mock_44211",
        provider_invoice_id: "inv_2026_10_beta",
        amount_inr_paise: 29900, // ₹299.00
        currency: "INR",
        status: "succeeded",
        payment_method: "card",
        receipt_url: "https://receipts.business-os.in/inv_2026_10_beta.pdf",
        description: "Starter Plan — Monthly Subscription (Oct 2026)",
        created_at: periodStart,
      },
    ]);
  }

  // ============================================================================
  // SUBSCRIPTION RETRIEVAL & LIFECYCLE
  // ============================================================================

  public getSubscription(orgSlug: string): TenantSubscription {
    const existing = this.subscriptions.get(orgSlug);
    if (existing) {
      return { ...existing };
    }

    // Default fallback: Initial Starter tier in trial or active
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const fallback: TenantSubscription = {
      id: `sub-${orgSlug}-${Date.now()}`,
      organization_id: orgSlug,
      plan_tier: "starter",
      status: "active",
      billing_interval: "monthly",
      mode: "development",
      provider: "manual",
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: false,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    this.subscriptions.set(orgSlug, fallback);
    return { ...fallback };
  }

  public updateSubscription(
    orgSlug: string,
    updates: Partial<TenantSubscription>
  ): TenantSubscription {
    const current = this.getSubscription(orgSlug);
    const updated: TenantSubscription = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.subscriptions.set(orgSlug, updated);
    return { ...updated };
  }

  public changePlan(
    orgSlug: string,
    targetTier: PlanTier,
    interval: BillingInterval = "monthly"
  ): TenantSubscription {
    const current = this.getSubscription(orgSlug);
    const now = new Date();
    const periodEnd =
      interval === "yearly"
        ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString()
        : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    return this.updateSubscription(orgSlug, {
      plan_tier: targetTier,
      billing_interval: interval,
      status: "active",
      cancel_at_period_end: false,
      cancel_reason: null,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd,
    });
  }

  public cancelSubscription(
    orgSlug: string,
    reason: string = "Customer requested cancellation",
    immediately = false
  ): TenantSubscription {
    if (immediately) {
      return this.updateSubscription(orgSlug, {
        status: "canceled",
        cancel_at_period_end: false,
        cancel_reason: reason,
      });
    }

    return this.updateSubscription(orgSlug, {
      cancel_at_period_end: true,
      cancel_reason: reason,
    });
  }

  public reactivateSubscription(orgSlug: string): TenantSubscription {
    return this.updateSubscription(orgSlug, {
      status: "active",
      cancel_at_period_end: false,
      cancel_reason: null,
    });
  }

  // ============================================================================
  // SERVER-SIDE ENTITLEMENT ENGINE
  // ============================================================================

  /**
   * Helper that checks whether the tenant subscription status allows write modifications.
   * If status is canceled/expired/suspended, tenant is put into read-only mode (no data loss).
   */
  public isWriteAllowed(status: SubscriptionStatus): boolean {
    if (status === "active" || status === "trialing") {
      return true;
    }
    if (status === "past_due") {
      // 3-day grace period is allowed before hard write cutoff
      return true;
    }
    // 'canceled', 'suspended', 'expired' are strictly read-only
    return false;
  }

  public canAddTeamMember(
    orgSlug: string,
    currentCount: number
  ): { allowed: boolean; reason?: string; limit: number; current: number } {
    const sub = this.getSubscription(orgSlug);
    if (!this.isWriteAllowed(sub.status)) {
      return {
        allowed: false,
        reason: `Workspace subscription is ${sub.status}. Data is in read-only mode. Please reactivate your plan to add team members.`,
        limit: 0,
        current: currentCount,
      };
    }

    const plan = getPlanDefinition(sub.plan_tier);
    const limit = plan.limits.maxTeamMembers;
    const allowed = currentCount < limit;

    return {
      allowed,
      reason: allowed
        ? undefined
        : `Your ${plan.name} plan allows up to ${limit} team members. Upgrade your plan to invite more collaborators.`,
      limit,
      current: currentCount,
    };
  }

  public canCreateContact(
    orgSlug: string,
    currentCount: number
  ): { allowed: boolean; reason?: string; limit: number; current: number } {
    const sub = this.getSubscription(orgSlug);
    if (!this.isWriteAllowed(sub.status)) {
      return {
        allowed: false,
        reason: `Workspace subscription is ${sub.status}. Existing contacts are preserved in read-only mode. Please update billing to add contacts.`,
        limit: 0,
        current: currentCount,
      };
    }

    const plan = getPlanDefinition(sub.plan_tier);
    const limit = plan.limits.maxContacts;
    const allowed = currentCount < limit;

    return {
      allowed,
      reason: allowed
        ? undefined
        : `Your ${plan.name} plan limit of ${limit} contacts has been reached. Existing contacts are safe, but upgrade is required to add more.`,
      limit,
      current: currentCount,
    };
  }

  public canCreateLead(
    orgSlug: string,
    currentCount: number
  ): { allowed: boolean; reason?: string; limit: number; current: number } {
    const sub = this.getSubscription(orgSlug);
    if (!this.isWriteAllowed(sub.status)) {
      return {
        allowed: false,
        reason: `Workspace subscription is ${sub.status}. Leads are preserved in read-only mode. Upgrade to create new sales leads.`,
        limit: 0,
        current: currentCount,
      };
    }

    const plan = getPlanDefinition(sub.plan_tier);
    const limit = plan.limits.maxLeads;
    const allowed = currentCount < limit;

    return {
      allowed,
      reason: allowed
        ? undefined
        : `Your ${plan.name} plan limit of ${limit} leads has been reached. Upgrade to continue adding leads to your pipeline.`,
      limit,
      current: currentCount,
    };
  }

  public canActivateAutomation(
    orgSlug: string,
    currentActiveCount: number
  ): { allowed: boolean; reason?: string; limit: number; current: number } {
    const sub = this.getSubscription(orgSlug);
    if (!this.isWriteAllowed(sub.status)) {
      return {
        allowed: false,
        reason: `Workspace subscription is ${sub.status}. Automation execution is paused until subscription is renewed.`,
        limit: 0,
        current: currentActiveCount,
      };
    }

    const plan = getPlanDefinition(sub.plan_tier);
    const limit = plan.limits.maxActiveWorkflows;
    const allowed = currentActiveCount < limit;

    return {
      allowed,
      reason: allowed
        ? undefined
        : `Your ${plan.name} plan allows up to ${limit} active workflow rules. Upgrade to Growth or Business for higher workflow capacity.`,
      limit,
      current: currentActiveCount,
    };
  }

  public canExecuteWorkflow(
    orgSlug: string,
    currentMonthExecutions: number
  ): { allowed: boolean; reason?: string; limit: number; current: number } {
    const sub = this.getSubscription(orgSlug);
    if (!this.isWriteAllowed(sub.status)) {
      return {
        allowed: false,
        reason: `Subscription is ${sub.status}. Automatic background executions paused.`,
        limit: 0,
        current: currentMonthExecutions,
      };
    }

    const plan = getPlanDefinition(sub.plan_tier);
    const limit = plan.limits.maxWorkflowExecutionsPerMonth;
    const allowed = currentMonthExecutions < limit;

    return {
      allowed,
      reason: allowed
        ? undefined
        : `Monthly limit of ${limit} workflow executions reached on ${plan.name} plan. Additional trigger events queued until upgrade or billing reset.`,
      limit,
      current: currentMonthExecutions,
    };
  }

  public canLaunchCampaign(
    orgSlug: string,
    recipientCount: number
  ): { allowed: boolean; reason?: string } {
    const sub = this.getSubscription(orgSlug);
    if (!this.isWriteAllowed(sub.status)) {
      return {
        allowed: false,
        reason: `Campaign dispatch blocked: Workspace is ${sub.status}. Reactivate subscription to send broadcasts.`,
      };
    }

    const plan = getPlanDefinition(sub.plan_tier);
    if (!plan.limits.campaignsEnabled) {
      return {
        allowed: false,
        reason: `Broadcast campaigns are not available on the ${plan.name} plan. Upgrade to Growth or Business to launch campaigns.`,
      };
    }

    return { allowed: true };
  }

  public canSendWhatsAppMessage(
    orgSlug: string,
    currentMonthMessages: number
  ): { allowed: boolean; reason?: string; limit: number; current: number } {
    const sub = this.getSubscription(orgSlug);
    if (!this.isWriteAllowed(sub.status)) {
      return {
        allowed: false,
        reason: `WhatsApp messaging suspended: subscription status is ${sub.status}. Incoming messages logged; outbound sending requires active plan.`,
        limit: 0,
        current: currentMonthMessages,
      };
    }

    const plan = getPlanDefinition(sub.plan_tier);
    const limit = plan.limits.maxWhatsAppMessagesPerMonth;
    const allowed = currentMonthMessages < limit;

    return {
      allowed,
      reason: allowed
        ? undefined
        : `Monthly WhatsApp quota of ${limit} messages reached on ${plan.name} plan. Upgrade plan or configure top-up messaging balance.`,
      limit,
      current: currentMonthMessages,
    };
  }

  public canAccessAdvancedReporting(
    orgSlug: string
  ): { allowed: boolean; reason?: string } {
    const sub = this.getSubscription(orgSlug);
    const plan = getPlanDefinition(sub.plan_tier);

    if (!plan.limits.advancedReportingEnabled) {
      return {
        allowed: false,
        reason: `Detailed funnel analytics and delivery reports require the Growth or Business plan.`,
      };
    }

    return { allowed: true };
  }

  public canExportData(
    orgSlug: string,
    rowCount: number
  ): { allowed: boolean; reason?: string; limit: number } {
    const sub = this.getSubscription(orgSlug);
    const plan = getPlanDefinition(sub.plan_tier);
    const limit = plan.limits.dataExportLimit;
    const allowed = rowCount <= limit;

    return {
      allowed,
      reason: allowed
        ? undefined
        : `Export size (${rowCount} rows) exceeds your ${plan.name} export limit of ${limit} rows. Upgrade to export larger datasets.`,
      limit,
    };
  }

  // ============================================================================
  // PRE-DOWNGRADE IMPACT ANALYSIS
  // ============================================================================

  /**
   * Pre-flight checks before downgrading a customer's subscription.
   * Warns the customer precisely what limits will be applied without deleting their data.
   */
  public evaluateDowngrade(
    orgSlug: string,
    targetTier: PlanTier,
    currentUsage: {
      teamMembers: number;
      contacts: number;
      leads: number;
      activeWorkflows: number;
    }
  ): { allowed: boolean; warnings: string[]; blockedReasons: string[] } {
    const targetPlan = getPlanDefinition(targetTier);
    const warnings: string[] = [];
    const blockedReasons: string[] = [];

    if (currentUsage.teamMembers > targetPlan.limits.maxTeamMembers) {
      warnings.push(
        `You currently have ${currentUsage.teamMembers} team members, but ${targetPlan.name} includes only ${targetPlan.limits.maxTeamMembers}. Existing members will retain access, but you cannot add new members until count is reduced.`
      );
    }

    if (currentUsage.contacts > targetPlan.limits.maxContacts) {
      warnings.push(
        `You have ${currentUsage.contacts} contacts, but ${targetPlan.name} includes ${targetPlan.limits.maxContacts}. All contacts remain safely preserved and viewable, but adding new contacts will be restricted.`
      );
    }

    if (currentUsage.activeWorkflows > targetPlan.limits.maxActiveWorkflows) {
      warnings.push(
        `You have ${currentUsage.activeWorkflows} active automations, exceeding ${targetPlan.name}'s limit of ${targetPlan.limits.maxActiveWorkflows}. Excess workflows will be automatically paused until reactivated.`
      );
    }

    if (!targetPlan.limits.campaignsEnabled) {
      warnings.push(
        `WhatsApp broadcast campaigns are not supported on ${targetPlan.name}. You will not be able to send new bulk campaigns.`
      );
    }

    return {
      allowed: blockedReasons.length === 0,
      warnings,
      blockedReasons,
    };
  }

  // ============================================================================
  // PAYMENT HISTORY & INVOICES
  // ============================================================================

  public getPaymentEvents(orgSlug: string): PaymentEvent[] {
    const list = this.paymentEvents.get(orgSlug) || [];
    return [...list].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public recordPaymentEvent(
    event: Omit<PaymentEvent, "id" | "created_at">
  ): PaymentEvent {
    const list = this.paymentEvents.get(event.organization_id) || [];
    const newEvent: PaymentEvent = {
      ...event,
      id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
    };
    list.unshift(newEvent);
    this.paymentEvents.set(event.organization_id, list);
    return newEvent;
  }
}

export const subscriptionService = new SubscriptionService();
