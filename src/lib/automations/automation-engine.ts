import {
  AutomationExecution,
  AutomationRule,
  ExecutionStatus,
  ExecutionStepResult,
  PredefinedTemplateId,
  TriggerEventPayload,
  WorkflowAction,
  WorkflowCondition,
} from "./types";
import { PREDEFINED_TEMPLATES } from "./templates";
import { crmStore } from "../crm/crm-store";
import { whatsappStore } from "../whatsapp/whatsapp-store";
import { subscriptionService } from "../billing/subscription-service";

class AutomationEngine {
  private rules: Map<string, AutomationRule[]> = new Map();
  private executions: Map<string, AutomationExecution[]> = new Map();

  constructor() {
    this.seedInitialAutomations();
  }

  private seedInitialAutomations() {
    const acmeOrg = "acme-corp";
    const betaOrg = "beta-logistics";

    // Seed Acme Workflows
    const acmeTemplateA = PREDEFINED_TEMPLATES.find((t) => t.id === "template_a")!;
    const acmeTemplateC = PREDEFINED_TEMPLATES.find((t) => t.id === "template_c")!;

    const acmeRules: AutomationRule[] = [
      {
        id: "rule-acme-1",
        organization_id: acmeOrg,
        name: acmeTemplateA.name,
        description: acmeTemplateA.description,
        template_id: "template_a",
        trigger_type: acmeTemplateA.trigger_type,
        trigger_config: {},
        conditions: [...acmeTemplateA.conditions],
        actions: [...acmeTemplateA.actions],
        is_active: true,
        total_executions: 14,
        success_count: 14,
        failure_count: 0,
        last_executed_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: "rule-acme-2",
        organization_id: acmeOrg,
        name: acmeTemplateC.name,
        description: acmeTemplateC.description,
        template_id: "template_c",
        trigger_type: acmeTemplateC.trigger_type,
        trigger_config: {},
        conditions: [...acmeTemplateC.conditions],
        actions: [...acmeTemplateC.actions],
        is_active: true,
        total_executions: 8,
        success_count: 7,
        failure_count: 1,
        last_executed_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
    ];

    const betaTemplateA = PREDEFINED_TEMPLATES.find((t) => t.id === "template_a")!;
    const betaRules: AutomationRule[] = [
      {
        id: "rule-beta-1",
        organization_id: betaOrg,
        name: betaTemplateA.name,
        description: betaTemplateA.description,
        template_id: "template_a",
        trigger_type: betaTemplateA.trigger_type,
        trigger_config: {},
        conditions: [...betaTemplateA.conditions],
        actions: [...betaTemplateA.actions],
        is_active: true,
        total_executions: 3,
        success_count: 3,
        failure_count: 0,
        last_executed_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
    ];

    this.rules.set(acmeOrg, acmeRules);
    this.rules.set(betaOrg, betaRules);

    // Seed Sample Executions for Acme
    this.executions.set(acmeOrg, [
      {
        id: "exec-acme-1",
        organization_id: acmeOrg,
        rule_id: "rule-acme-1",
        rule_name: acmeTemplateA.name,
        trigger_event: "lead.created",
        idempotency_key: "rule-acme-1_lead-c101_17280000",
        status: "completed",
        retry_count: 0,
        max_retries: 3,
        scheduled_for: new Date(Date.now() - 3600000 * 2).toISOString(),
        started_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        completed_at: new Date(Date.now() - 3600000 * 2 + 140).toISOString(),
        duration_ms: 140,
        payload: { lead_id: "lead-1", lead_name: "Aarav Patel" },
        actions_executed: [
          {
            action_type: "lead.assign",
            status: "success",
            details: "Assigned lead to Workspace Founder",
            timestamp: new Date().toISOString(),
          },
          {
            action_type: "task.create",
            status: "success",
            details: "Created task: Follow up with new lead (+2h)",
            timestamp: new Date().toISOString(),
          },
          {
            action_type: "internal_note.create",
            status: "success",
            details: "Logged internal note to lead activity stream",
            timestamp: new Date().toISOString(),
          },
        ],
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: "exec-acme-2",
        organization_id: acmeOrg,
        rule_id: "rule-acme-2",
        rule_name: acmeTemplateC.name,
        trigger_event: "lead.stage_changed",
        idempotency_key: "rule-acme-2_lead-c102_17284000",
        status: "completed",
        retry_count: 0,
        max_retries: 3,
        scheduled_for: new Date(Date.now() - 3600000 * 5).toISOString(),
        started_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        completed_at: new Date(Date.now() - 3600000 * 5 + 95).toISOString(),
        duration_ms: 95,
        payload: { lead_id: "lead-2", stage: "qualified" },
        actions_executed: [
          {
            action_type: "task.create",
            status: "success",
            details: "Created task: Prepare tailored quotation / proposal",
            timestamp: new Date().toISOString(),
          },
          {
            action_type: "internal_note.create",
            status: "success",
            details: "Stage change note added",
            timestamp: new Date().toISOString(),
          },
        ],
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ]);
  }

  // ============================================================================
  // WORKFLOW RULE CRUD & LIFECYCLE
  // ============================================================================

  public getRules(orgSlug: string): AutomationRule[] {
    return [...(this.rules.get(orgSlug) || [])];
  }

  public getRuleById(orgSlug: string, ruleId: string): AutomationRule | null {
    const list = this.rules.get(orgSlug) || [];
    return list.find((r) => r.id === ruleId) || null;
  }

  public createRule(
    orgSlug: string,
    ruleData: Omit<
      AutomationRule,
      | "id"
      | "organization_id"
      | "total_executions"
      | "success_count"
      | "failure_count"
      | "last_executed_at"
      | "created_at"
      | "updated_at"
    >
  ): { success: boolean; rule?: AutomationRule; error?: string } {
    const currentRules = this.getRules(orgSlug);
    const activeCount = currentRules.filter((r) => r.is_active).length;

    // Server-side entitlement check
    if (ruleData.is_active) {
      const entitlement = subscriptionService.canActivateAutomation(orgSlug, activeCount);
      if (!entitlement.allowed) {
        return { success: false, error: entitlement.reason };
      }
    }

    const newRule: AutomationRule = {
      ...ruleData,
      id: `rule-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      organization_id: orgSlug,
      total_executions: 0,
      success_count: 0,
      failure_count: 0,
      last_executed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    currentRules.unshift(newRule);
    this.rules.set(orgSlug, currentRules);
    return { success: true, rule: newRule };
  }

  public updateRule(
    orgSlug: string,
    ruleId: string,
    updates: Partial<AutomationRule>
  ): AutomationRule | null {
    const currentRules = this.rules.get(orgSlug) || [];
    const index = currentRules.findIndex((r) => r.id === ruleId);
    if (index === -1) return null;

    const updated: AutomationRule = {
      ...currentRules[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    currentRules[index] = updated;
    this.rules.set(orgSlug, currentRules);
    return updated;
  }

  public toggleRule(
    orgSlug: string,
    ruleId: string,
    isActive: boolean
  ): { success: boolean; rule?: AutomationRule; error?: string } {
    const rule = this.getRuleById(orgSlug, ruleId);
    if (!rule) return { success: false, error: "Rule not found." };

    if (isActive) {
      const activeCount = this.getRules(orgSlug).filter((r) => r.is_active && r.id !== ruleId).length;
      const entitlement = subscriptionService.canActivateAutomation(orgSlug, activeCount);
      if (!entitlement.allowed) {
        return { success: false, error: entitlement.reason };
      }
    }

    const updated = this.updateRule(orgSlug, ruleId, { is_active: isActive });
    return { success: true, rule: updated || undefined };
  }

  public deleteRule(orgSlug: string, ruleId: string): boolean {
    const list = this.rules.get(orgSlug) || [];
    const filtered = list.filter((r) => r.id !== ruleId);
    this.rules.set(orgSlug, filtered);
    return filtered.length < list.length;
  }

  public activatePredefinedTemplate(
    orgSlug: string,
    templateId: PredefinedTemplateId
  ): { success: boolean; rule?: AutomationRule; error?: string } {
    const template = PREDEFINED_TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
      return { success: false, error: "Requested template does not exist." };
    }

    return this.createRule(orgSlug, {
      name: template.name,
      description: template.description,
      template_id: template.id,
      trigger_type: template.trigger_type,
      trigger_config: {},
      conditions: [...template.conditions],
      actions: [...template.actions],
      is_active: true,
    });
  }

  // ============================================================================
  // EXECUTION LOGS & QUEUE ENGINE
  // ============================================================================

  public getExecutions(orgSlug: string, limit = 50): AutomationExecution[] {
    const list = this.executions.get(orgSlug) || [];
    return [...list]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  public getExecutionById(orgSlug: string, executionId: string): AutomationExecution | null {
    const list = this.executions.get(orgSlug) || [];
    return list.find((e) => e.id === executionId) || null;
  }

  /**
   * Evaluates condition rules against runtime event payload data
   */
  public evaluateConditions(conditions: WorkflowCondition[], data: Record<string, any>): boolean {
    if (!conditions || conditions.length === 0) return true;

    for (const cond of conditions) {
      const actualValue = data[cond.field];

      switch (cond.operator) {
        case "equals":
          if (String(actualValue) !== String(cond.value)) return false;
          break;
        case "not_equals":
          if (String(actualValue) === String(cond.value)) return false;
          break;
        case "contains":
          if (!String(actualValue).toLowerCase().includes(String(cond.value).toLowerCase())) return false;
          break;
        case "greater_than":
          if (Number(actualValue) <= Number(cond.value)) return false;
          break;
        case "less_than":
          if (Number(actualValue) >= Number(cond.value)) return false;
          break;
        case "is_empty":
          if (actualValue !== undefined && actualValue !== null && actualValue !== "") return false;
          break;
        case "is_not_empty":
          if (actualValue === undefined || actualValue === null || actualValue === "") return false;
          break;
        case "in":
          if (Array.isArray(cond.value)) {
            if (!cond.value.map(String).includes(String(actualValue))) return false;
          }
          break;
      }
    }

    return true;
  }

  /**
   * Main Event Trigger Dispatcher
   */
  public async triggerAutomations(payload: TriggerEventPayload): Promise<AutomationExecution[]> {
    const { organization_id, trigger_type, entity_id } = payload;
    const rules = this.getRules(organization_id).filter(
      (r) => r.is_active && r.trigger_type === trigger_type
    );

    if (rules.length === 0) return [];

    // Loop prevention guard (max recursion depth 3)
    const currentDepth = payload.execution_depth || 1;
    if (currentDepth > 3) {
      console.warn(`[Automation] Loop recursion guard halted event ${trigger_type} at depth ${currentDepth}`);
      return [];
    }

    const executedList: AutomationExecution[] = [];

    for (const rule of rules) {
      // Idempotency key construction: rule_{id}_{entity}_{timestamp/event}
      const eventTimestamp = payload.timestamp || new Date().toISOString();
      const idempotencyKey = `rule_${rule.id}_${entity_id}_${eventTimestamp.slice(0, 16)}`;

      // Check if execution already exists
      const existingExecutions = this.executions.get(organization_id) || [];
      const duplicate = existingExecutions.find((e) => e.idempotency_key === idempotencyKey);
      if (duplicate) {
        continue;
      }

      // Check monthly workflow execution quota from subscription entitlement
      const currentMonthExecutions = existingExecutions.length;
      const quotaCheck = subscriptionService.canExecuteWorkflow(organization_id, currentMonthExecutions);
      if (!quotaCheck.allowed) {
        console.warn(`[Automation Engine] Execution blocked by quota: ${quotaCheck.reason}`);
        continue;
      }

      // Evaluate conditions
      const conditionPayload = {
        ...payload.data,
        ...payload.data.lead,
        ...payload.data.contact,
        ...payload.data.conversation,
        ...payload.data.task,
      };

      const conditionsPass = this.evaluateConditions(rule.conditions, conditionPayload);
      if (!conditionsPass) {
        continue;
      }

      // Run execution
      const startTime = Date.now();
      const actionsExecuted: ExecutionStepResult[] = [];
      let executionStatus: ExecutionStatus = "completed";
      let errorLog: string | null = null;

      for (const action of rule.actions) {
        try {
          const stepResult = await this.executeAction(organization_id, action, payload);
          actionsExecuted.push(stepResult);
        } catch (err: any) {
          executionStatus = "failed";
          errorLog = err?.message || "Action step failed";
          actionsExecuted.push({
            action_type: action.type,
            status: "failed",
            details: errorLog || undefined,
            timestamp: new Date().toISOString(),
          });
          break; // Stop action chain on failure
        }
      }

      const durationMs = Date.now() - startTime;
      const executionRecord: AutomationExecution = {
        id: `exec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        organization_id,
        rule_id: rule.id,
        rule_name: rule.name,
        trigger_event: trigger_type,
        idempotency_key: idempotencyKey,
        status: executionStatus,
        retry_count: 0,
        max_retries: 3,
        scheduled_for: new Date(startTime).toISOString(),
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
        payload: payload.data,
        actions_executed: actionsExecuted,
        error_log: errorLog,
        created_at: new Date().toISOString(),
      };

      // Record execution
      existingExecutions.unshift(executionRecord);
      this.executions.set(organization_id, existingExecutions);
      executedList.push(executionRecord);

      // Update rule metrics
      this.updateRule(organization_id, rule.id, {
        total_executions: rule.total_executions + 1,
        success_count: executionStatus === "completed" ? rule.success_count + 1 : rule.success_count,
        failure_count: executionStatus === "failed" ? rule.failure_count + 1 : rule.failure_count,
        last_executed_at: new Date().toISOString(),
      });
    }

    return executedList;
  }

  /**
   * Action Step Runner
   */
  private async executeAction(
    orgSlug: string,
    action: WorkflowAction,
    payload: TriggerEventPayload
  ): Promise<ExecutionStepResult> {
    const config = action.config || {};
    const timestamp = new Date().toISOString();

    switch (action.type) {
      case "lead.assign": {
        const leadId = payload.data?.lead?.id || payload.entity_id;
        const assignee = config.default_assignee_name || "Workspace Founder";
        if (leadId) {
          const lead = crmStore.getLeadById(orgSlug, leadId);
          if (lead) {
            // Updated lead assignment
            lead.assigned_to_name = assignee;
          }
        }
        return {
          action_type: action.type,
          status: "success",
          details: `Assigned lead ${leadId} to ${assignee}`,
          timestamp,
        };
      }

      case "task.create": {
        const offsetMins = config.due_offset_minutes || 120;
        const dueDate = new Date(Date.now() + offsetMins * 60000).toISOString();
        const contactId = payload.data?.lead?.contact_id || payload.data?.contact?.id || "c-101";

        const createdTask = crmStore.createTask(orgSlug, {
          title: config.title || "Follow up with customer",
          description: config.description || "Automated workflow task",
          contact_id: contactId,
          contact_name: payload.data?.contact?.first_name || payload.data?.lead?.title || "Customer",
          due_date: dueDate,
          priority: config.priority || "high",
          status: "todo",
          assigned_to_name: config.assigned_to_name || "Workspace Founder",
        });

        return {
          action_type: action.type,
          status: "success",
          details: `Created task "${createdTask.title}" (Due: +${offsetMins}m)`,
          timestamp,
          output: { task_id: createdTask.id },
        };
      }

      case "internal_note.create": {
        const noteContent = config.content || "Automated workflow event recorded.";
        const conversationId = payload.data?.conversation?.id;

        if (conversationId) {
          whatsappStore.addInternalNote(
            orgSlug,
            conversationId,
            noteContent,
            "system-automation",
            "Automation Bot"
          );
        }

        return {
          action_type: action.type,
          status: "success",
          details: `Logged internal note: "${noteContent.slice(0, 40)}..."`,
          timestamp,
        };
      }

      case "lead.update_stage": {
        const leadId = payload.data?.lead?.id || payload.entity_id;
        const targetStage = config.stage;
        if (leadId && targetStage) {
          crmStore.updateLeadStage(orgSlug, leadId, targetStage);
        }
        return {
          action_type: action.type,
          status: "success",
          details: `Updated lead stage to ${targetStage}`,
          timestamp,
        };
      }

      case "whatsapp.send_template": {
        // Enforce strict safety guardrails
        const conn = whatsappStore.getConnection(orgSlug);
        if (conn.status !== "connected") {
          return {
            action_type: action.type,
            status: "skipped",
            details: "WhatsApp connection is not active. Message skipped.",
            timestamp,
          };
        }

        return {
          action_type: action.type,
          status: "success",
          details: `Simulated template message sent: ${config.template_name}`,
          timestamp,
        };
      }

      default:
        return {
          action_type: action.type,
          status: "success",
          details: `Action executed: ${action.type}`,
          timestamp,
        };
    }
  }

  /**
   * Retries a failed or retrying execution
   */
  public async retryExecution(orgSlug: string, executionId: string): Promise<AutomationExecution> {
    const exec = this.getExecutionById(orgSlug, executionId);
    if (!exec) {
      throw new Error("Execution not found.");
    }

    const rule = this.getRuleById(orgSlug, exec.rule_id);
    if (!rule) {
      throw new Error("Parent rule no longer exists.");
    }

    exec.status = "processing";
    exec.retry_count += 1;

    const startTime = Date.now();
    const actionsExecuted: ExecutionStepResult[] = [];
    let executionStatus: ExecutionStatus = "completed";
    let errorLog: string | null = null;

    const syntheticPayload: TriggerEventPayload = {
      organization_id: orgSlug,
      trigger_type: exec.trigger_event,
      entity_id: "retry",
      data: exec.payload,
    };

    for (const action of rule.actions) {
      try {
        const stepResult = await this.executeAction(orgSlug, action, syntheticPayload);
        actionsExecuted.push(stepResult);
      } catch (err: any) {
        executionStatus = "failed";
        errorLog = err?.message || "Retry attempt failed";
        actionsExecuted.push({
          action_type: action.type,
          status: "failed",
          details: errorLog || undefined,
          timestamp: new Date().toISOString(),
        });
        break;
      }
    }

    exec.status = executionStatus;
    exec.completed_at = new Date().toISOString();
    exec.duration_ms = Date.now() - startTime;
    exec.actions_executed = actionsExecuted;
    exec.error_log = errorLog;

    return { ...exec };
  }
}

export const automationEngine = new AutomationEngine();
