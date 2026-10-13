import {
  MetricUsageItem,
  PlanOverride,
  TenantUsageSummary,
  UsageMetricName,
} from "./types";
import { getPlanDefinition } from "./plans";
import { subscriptionService } from "./subscription-service";
import { crmStore } from "../crm/crm-store";
import { teamStore } from "../team/team-store";
import { automationEngine } from "../automations/automation-engine";
import { whatsappStore } from "../whatsapp/whatsapp-store";

class UsageService {
  private overrides: Map<string, PlanOverride[]> = new Map();
  private extraUsageCounters: Map<string, Record<string, number>> = new Map();

  constructor() {
    this.seedInitialOverrides();
  }

  private seedInitialOverrides() {
    // Acme has an active override granted by platform support for 100 extra contacts
    this.overrides.set("acme-corp", [
      {
        id: "ovr-1",
        organization_id: "acme-corp",
        metric_name: "active_contacts",
        extra_quota: 500,
        reason: "Early adopter customer bonus quota",
        granted_by: "System Administrator",
        expires_at: null,
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      },
    ]);
  }

  // ============================================================================
  // OVERRIDE MANAGEMENT (ADMINISTRATIVE)
  // ============================================================================

  public getOverrides(orgSlug: string): PlanOverride[] {
    return [...(this.overrides.get(orgSlug) || [])];
  }

  public addOverride(
    orgSlug: string,
    metricName: UsageMetricName,
    extraQuota: number,
    reason: string,
    grantedBy: string = "Platform Operator"
  ): PlanOverride {
    const list = this.overrides.get(orgSlug) || [];
    const newOverride: PlanOverride = {
      id: `ovr-${Date.now()}`,
      organization_id: orgSlug,
      metric_name: metricName,
      extra_quota: extraQuota,
      reason,
      granted_by: grantedBy,
      expires_at: null,
      created_at: new Date().toISOString(),
    };
    list.unshift(newOverride);
    this.overrides.set(orgSlug, list);
    return newOverride;
  }

  // ============================================================================
  // USAGE CONSUMPTION COUNTERS
  // ============================================================================

  public incrementCounter(orgSlug: string, metric: string, amount = 1): void {
    const orgCounters = this.extraUsageCounters.get(orgSlug) || {};
    orgCounters[metric] = (orgCounters[metric] || 0) + amount;
    this.extraUsageCounters.set(orgSlug, orgCounters);
  }

  // ============================================================================
  // CURRENT PERIOD USAGE RECONCILIATION
  // ============================================================================

  public getTenantUsage(orgSlug: string): TenantUsageSummary {
    const sub = subscriptionService.getSubscription(orgSlug);
    const plan = getPlanDefinition(sub.plan_tier);
    const overrides = this.getOverrides(orgSlug);

    const now = new Date();
    const periodMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    // 1. Team Seats
    const teamMembers = teamStore.getTeamMembers(orgSlug);
    const teamSeatCount = teamMembers.length;
    const teamSeatOverride =
      overrides.find((o) => o.metric_name === "team_seats")?.extra_quota || 0;
    const teamSeatQuota = plan.limits.maxTeamMembers + teamSeatOverride;

    // 2. Contacts
    const contacts = crmStore.getContacts(orgSlug, false);
    const contactCount = contacts.length;
    const contactOverride =
      overrides.find((o) => o.metric_name === "active_contacts")?.extra_quota || 0;
    const contactQuota = plan.limits.maxContacts + contactOverride;

    // 3. Leads
    const leads = crmStore.getLeads(orgSlug);
    const leadCount = leads.length;
    const leadOverride =
      overrides.find((o) => o.metric_name === "active_leads")?.extra_quota || 0;
    const leadQuota = plan.limits.maxLeads + leadOverride;

    // 4. Active Workflows
    const rules = automationEngine.getRules(orgSlug);
    const activeWorkflowCount = rules.filter((r) => r.is_active).length;
    const workflowQuota = plan.limits.maxActiveWorkflows;

    // 5. Workflow Executions (Current Month)
    const executions = automationEngine.getExecutions(orgSlug, 500);
    const workflowExecutionsCount = executions.length;
    const executionQuota = plan.limits.maxWorkflowExecutionsPerMonth;

    // 6. WhatsApp Messages
    // Reconcile from conversations & messages in whatsappStore
    const convs = whatsappStore.getConversations(orgSlug);
    let sentMessageCount = 0;
    convs.forEach((c) => {
      const msgs = whatsappStore.getMessages(c.id);
      sentMessageCount += msgs.filter((m) => m.sender_type === "staff").length;
    });
    // Add extra recorded messages
    const extraMsgCount = this.extraUsageCounters.get(orgSlug)?.whatsapp_messages || 0;
    sentMessageCount += extraMsgCount;
    const messageQuota = plan.limits.maxWhatsAppMessagesPerMonth;

    // 7. Campaign Recipients
    const campaignRecipientsCount = this.extraUsageCounters.get(orgSlug)?.campaign_recipients || 0;
    const campaignQuota = plan.limits.campaignsEnabled ? 5000 : 0;

    const buildItem = (
      metric: UsageMetricName,
      label: string,
      current: number,
      quota: number,
      unit: string,
      overrideQuota = 0
    ): MetricUsageItem => {
      const pct = quota > 0 ? parseFloat(((current / quota) * 100).toFixed(1)) : 0;
      return {
        metric_name: metric,
        label,
        current_count: current,
        max_quota: quota,
        unit,
        percentage_used: pct,
        is_warning: pct >= 80,
        is_exceeded: current >= quota && quota > 0,
        admin_override_quota: overrideQuota > 0 ? overrideQuota : undefined,
      };
    };

    const metrics: Record<UsageMetricName, MetricUsageItem> = {
      team_seats: buildItem("team_seats", "Team Members", teamSeatCount, teamSeatQuota, "seats", teamSeatOverride),
      active_contacts: buildItem("active_contacts", "Contacts", contactCount, contactQuota, "contacts", contactOverride),
      active_leads: buildItem("active_leads", "Leads Pipeline", leadCount, leadQuota, "leads", leadOverride),
      active_workflows: buildItem("active_workflows", "Active Workflows", activeWorkflowCount, workflowQuota, "rules"),
      workflow_executions: buildItem("workflow_executions", "Workflow Executions", workflowExecutionsCount, executionQuota, "runs / mo"),
      whatsapp_messages: buildItem("whatsapp_messages", "WhatsApp Messages", sentMessageCount, messageQuota, "messages / mo"),
      campaign_recipients: buildItem("campaign_recipients", "Campaign Reach", campaignRecipientsCount, campaignQuota, "recipients / mo"),
    };

    const isAnyExceeded = Object.values(metrics).some((m) => m.is_exceeded);

    return {
      organization_id: orgSlug,
      period_month: periodMonth,
      metrics,
      is_any_exceeded: isAnyExceeded,
      updated_at: new Date().toISOString(),
    };
  }
}

export const usageService = new UsageService();
