import { crmStore } from "../crm/crm-store";
import { whatsappStore } from "../whatsapp/whatsapp-store";
import { automationEngine } from "../automations/automation-engine";
import { subscriptionService } from "../billing/subscription-service";
import { getPlanDefinition } from "../billing/plans";

export type ReportTimeRange = "7d" | "30d" | "this_month" | "prev_month" | "all";

export interface StageMetric {
  stage: string;
  label: string;
  count: number;
  value: number;
  percentage: number;
}

export interface BusinessReportData {
  timeRange: ReportTimeRange;
  organizationId: string;
  planName: string;
  summary: {
    totalContacts: number;
    newContactsCount: number;
    totalLeads: number;
    pipelineValue: number;
    wonDealsCount: number;
    wonDealsValue: number;
    lostDealsCount: number;
    leadConversionRate: number; // Formula: (Won / (Won + Lost)) * 100
    conversionFormula: string;
    totalTasks: number;
    completedTasksCount: number;
    overdueTasksCount: number;
    taskCompletionRate: number; // Formula: (Completed / Total) * 100
    totalWorkflowExecutions: number;
    workflowSuccessRate: number; // Formula: (Success / Total) * 100
    whatsappMessagesSent: number;
    whatsappDeliveredCount: number;
    whatsappReadCount: number;
    whatsappFailedCount: number;
  };
  leadsByStage: StageMetric[];
  timeline: {
    date: string;
    contacts: number;
    leads: number;
  }[];
  workflowMetrics: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    activeRulesCount: number;
  };
  messagingFunnel: {
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
}

export class ReportingEngine {
  public generateReport(orgSlug: string, range: ReportTimeRange = "30d"): BusinessReportData {
    const sub = subscriptionService.getSubscription(orgSlug);
    const plan = getPlanDefinition(sub.plan_tier);

    const contacts = crmStore.getContacts(orgSlug, false);
    const leads = crmStore.getLeads(orgSlug);
    const tasks = crmStore.getTasks(orgSlug);
    const rules = automationEngine.getRules(orgSlug);
    const executions = automationEngine.getExecutions(orgSlug, 1000);
    const conversations = whatsappStore.getConversations(orgSlug);

    // Compute cutoff timestamp for time filtering
    const now = new Date();
    let cutoffDate = new Date(0); // 'all'

    if (range === "7d") {
      cutoffDate = new Date(now.getTime() - 7 * 86400000);
    } else if (range === "30d") {
      cutoffDate = new Date(now.getTime() - 30 * 86400000);
    } else if (range === "this_month") {
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (range === "prev_month") {
      cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    }

    // Filtered Contacts & Leads
    const filteredContacts = contacts.filter(
      (c) => new Date(c.created_at) >= cutoffDate
    );
    const filteredLeads = leads.filter(
      (l) => new Date(l.created_at) >= cutoffDate
    );

    // Pipeline Stage breakdown
    const stageLabels: Record<string, string> = {
      new: "New Inquiry",
      contacted: "Contacted",
      qualified: "Qualified",
      proposal: "Proposal Sent",
      won: "Closed Won",
      lost: "Closed Lost",
    };

    const stages: Record<string, { count: number; value: number }> = {
      new: { count: 0, value: 0 },
      contacted: { count: 0, value: 0 },
      qualified: { count: 0, value: 0 },
      proposal: { count: 0, value: 0 },
      won: { count: 0, value: 0 },
      lost: { count: 0, value: 0 },
    };

    let totalPipelineValue = 0;
    leads.forEach((l) => {
      if (stages[l.stage]) {
        stages[l.stage].count += 1;
        stages[l.stage].value += l.estimated_value || 0;
      }
      if (l.stage !== "lost") {
        totalPipelineValue += l.estimated_value || 0;
      }
    });

    const leadsByStage: StageMetric[] = Object.entries(stages).map(
      ([stageKey, data]) => ({
        stage: stageKey,
        label: stageLabels[stageKey] || stageKey,
        count: data.count,
        value: data.value,
        percentage:
          leads.length > 0 ? parseFloat(((data.count / leads.length) * 100).toFixed(1)) : 0,
      })
    );

    // Won / Lost conversion rate
    const wonCount = stages.won.count;
    const wonValue = stages.won.value;
    const lostCount = stages.lost.count;
    const closedDeals = wonCount + lostCount;
    // Conversion Formula: (Won / (Won + Lost)) * 100
    const leadConversionRate =
      closedDeals > 0 ? parseFloat(((wonCount / closedDeals) * 100).toFixed(1)) : 0;

    // Follow-up Tasks completion and overdue calculation
    const completedTasksCount = tasks.filter((t) => t.status === "completed").length;
    const nowIso = now.toISOString();
    const overdueTasksCount = tasks.filter(
      (t) => t.status !== "completed" && t.status !== "cancelled" && t.due_date && t.due_date < nowIso
    ).length;
    const taskCompletionRate =
      tasks.length > 0 ? parseFloat(((completedTasksCount / tasks.length) * 100).toFixed(1)) : 0;

    // Automation executions reliability
    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter((e) => e.status === "completed").length;
    const failedExecutions = executions.filter((e) => e.status === "failed").length;
    const workflowSuccessRate =
      totalExecutions > 0
        ? parseFloat(((successfulExecutions / totalExecutions) * 100).toFixed(1))
        : 100;

    // WhatsApp Message delivery funnel
    let whatsappMessagesSent = 0;
    let whatsappDeliveredCount = 0;
    let whatsappReadCount = 0;
    let whatsappFailedCount = 0;

    conversations.forEach((conv) => {
      const messages = whatsappStore.getMessages(conv.id);
      messages.forEach((msg) => {
        if (msg.sender_type === "staff") {
          whatsappMessagesSent += 1;
          if (msg.status === "delivered" || msg.status === "read") {
            whatsappDeliveredCount += 1;
          }
          if (msg.status === "read") {
            whatsappReadCount += 1;
          }
          if (msg.status === "failed") {
            whatsappFailedCount += 1;
          }
        }
      });
    });

    // Recent 7-day timeline aggregation
    const timelineDays: { date: string; contacts: number; leads: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date(now.getTime() - i * 86400000);
      const dayStr = dayDate.toISOString().slice(0, 10);
      const dayContacts = contacts.filter((c) => c.created_at.slice(0, 10) === dayStr).length;
      const dayLeads = leads.filter((l) => l.created_at.slice(0, 10) === dayStr).length;
      timelineDays.push({
        date: dayDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        contacts: dayContacts,
        leads: dayLeads,
      });
    }

    return {
      timeRange: range,
      organizationId: orgSlug,
      planName: plan.name,
      summary: {
        totalContacts: contacts.length,
        newContactsCount: filteredContacts.length,
        totalLeads: leads.length,
        pipelineValue: totalPipelineValue,
        wonDealsCount: wonCount,
        wonDealsValue: wonValue,
        lostDealsCount: lostCount,
        leadConversionRate,
        conversionFormula: "Conversion Rate = (Won Leads / (Won Deals + Lost Deals)) × 100",
        totalTasks: tasks.length,
        completedTasksCount,
        overdueTasksCount,
        taskCompletionRate,
        totalWorkflowExecutions: totalExecutions,
        workflowSuccessRate,
        whatsappMessagesSent,
        whatsappDeliveredCount,
        whatsappReadCount,
        whatsappFailedCount,
      },
      leadsByStage,
      timeline: timelineDays,
      workflowMetrics: {
        totalRuns: totalExecutions,
        successfulRuns: successfulExecutions,
        failedRuns: failedExecutions,
        activeRulesCount: rules.filter((r) => r.is_active).length,
      },
      messagingFunnel: {
        sent: whatsappMessagesSent,
        delivered: whatsappDeliveredCount,
        read: whatsappReadCount,
        failed: whatsappFailedCount,
      },
    };
  }
}

export const reportingEngine = new ReportingEngine();
