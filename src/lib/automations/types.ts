// Domain models and type definitions for Milestone 7 Workflow Automations

export type AutomationTriggerType =
  // CRM Triggers
  | "lead.created"
  | "lead.stage_changed"
  | "lead.assigned"
  | "contact.created"
  | "followup.due"
  | "followup.overdue"
  // Inbox Triggers
  | "message.received"
  | "conversation.assigned"
  | "conversation.resolved"
  | "conversation.unanswered"
  // Campaign Triggers
  | "campaign.completed"
  | "campaign.failed"
  // Scheduled / Time Triggers
  | "scheduled.reminder"
  | "inactivity.timer";

export type AutomationActionType =
  | "task.create"
  | "lead.assign"
  | "lead.update_stage"
  | "internal_note.create"
  | "whatsapp.send_template"
  | "reminder.schedule";

export type AutomationConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "greater_than"
  | "less_than"
  | "is_empty"
  | "is_not_empty"
  | "in";

export interface WorkflowCondition {
  id: string;
  field: string; // e.g., 'stage', 'assigned_to', 'tags', 'deal_value', 'consent_status'
  operator: AutomationConditionOperator;
  value: string | number | boolean | string[];
}

export interface WorkflowAction {
  id: string;
  type: AutomationActionType;
  config: Record<string, any>;
  order: number;
}

export type PredefinedTemplateId =
  | "template_a" // New lead follow-up
  | "template_b" // Unanswered customer enquiry
  | "template_c" // Lead stage changed to Qualified/Proposal
  | "template_d" // Overdue follow-up reminder
  | "template_e" // Conversation resolved
  | "template_f"; // Won lead post-conversion

export interface PredefinedTemplate {
  id: PredefinedTemplateId;
  name: string;
  tagline: string;
  description: string;
  category: "lead_generation" | "support" | "sales_pipeline" | "retention";
  trigger_type: AutomationTriggerType;
  trigger_label: string;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  recommended_for: string;
}

export interface AutomationRule {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  template_id?: PredefinedTemplateId | string | null;
  trigger_type: AutomationTriggerType;
  trigger_config: Record<string, any>;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  is_active: boolean;
  total_executions: number;
  success_count: number;
  failure_count: number;
  last_executed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type ExecutionStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "retrying"
  | "cancelled";

export interface ExecutionStepResult {
  action_type: AutomationActionType;
  status: "success" | "failed" | "skipped";
  details?: string;
  timestamp: string;
  output?: Record<string, any>;
}

export interface AutomationExecution {
  id: string;
  organization_id: string;
  rule_id: string;
  rule_name?: string;
  trigger_event: AutomationTriggerType;
  idempotency_key: string;
  status: ExecutionStatus;
  retry_count: number;
  max_retries: number;
  scheduled_for: string;
  started_at?: string | null;
  completed_at?: string | null;
  duration_ms?: number | null;
  payload: Record<string, any>;
  actions_executed: ExecutionStepResult[];
  error_log?: string | null;
  created_at: string;
}

export interface TriggerEventPayload {
  organization_id: string;
  trigger_type: AutomationTriggerType;
  entity_id: string;
  timestamp?: string;
  data: {
    lead?: any;
    contact?: any;
    conversation?: any;
    message?: any;
    task?: any;
    campaign?: any;
    [key: string]: any;
  };
  // Anti-loop recursion guards
  execution_depth?: number;
  chain_rule_ids?: string[];
}

export const AUTOMATION_PLAN_LIMITS: Record<string, number> = {
  starter: 3,
  growth: 10,
  business: Infinity,
};
