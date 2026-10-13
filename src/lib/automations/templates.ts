import { PredefinedTemplate } from "./types";

export const PREDEFINED_TEMPLATES: PredefinedTemplate[] = [
  {
    id: "template_a",
    name: "New Lead Fast Follow-Up",
    tagline: "Instant lead owner assignment and priority follow-up task",
    description:
      "When a new lead is captured from WhatsApp or web forms, automatically assigns the lead, schedules a 2-hour follow-up task, and logs an internal audit note.",
    category: "lead_generation",
    trigger_type: "lead.created",
    trigger_label: "When a new lead is created",
    recommended_for: "Inbound sales teams needing rapid response times",
    conditions: [],
    actions: [
      {
        id: "act-a-1",
        type: "lead.assign",
        config: {
          strategy: "lead_owner",
          default_assignee_name: "Workspace Founder",
        },
        order: 1,
      },
      {
        id: "act-a-2",
        type: "task.create",
        config: {
          title: "Follow up with new lead",
          description: "Review lead requirements and initiate contact via WhatsApp or phone call.",
          due_offset_minutes: 120, // +2 hours
          priority: "high",
        },
        order: 2,
      },
      {
        id: "act-a-3",
        type: "internal_note.create",
        config: {
          content: "Automated Workflow: Lead captured. Follow-up task scheduled (+2h). Assigned to owner.",
        },
        order: 3,
      },
    ],
  },
  {
    id: "template_b",
    name: "Unanswered Customer Enquiry Escalation",
    tagline: "Flag idle customer messages and assign urgent response tasks",
    description:
      "Detects incoming customer messages that remain unanswered after a threshold and escalates by creating an urgent task for the support team.",
    category: "support",
    trigger_type: "conversation.unanswered",
    trigger_label: "When customer enquiry is unanswered for 30 minutes",
    recommended_for: "Customer support teams with SLAs",
    conditions: [
      {
        id: "cond-b-1",
        field: "status",
        operator: "equals",
        value: "open",
      },
    ],
    actions: [
      {
        id: "act-b-1",
        type: "task.create",
        config: {
          title: "Urgent: Unanswered customer enquiry",
          description: "Customer waiting for response. Check WhatsApp conversation immediately.",
          due_offset_minutes: 30,
          priority: "urgent",
        },
        order: 1,
      },
      {
        id: "act-b-2",
        type: "internal_note.create",
        config: {
          content: "Automated Alert: Customer enquiry remained unanswered for 30 mins. Follow-up task created.",
        },
        order: 2,
      },
    ],
  },
  {
    id: "template_c",
    name: "Stage Changed to Qualified / Proposal",
    tagline: "Automate proposal generation task when deal qualifies",
    description:
      "When a deal reaches Qualified or Proposal stage, schedules a proposal preparation task and logs a milestone in the activity history.",
    category: "sales_pipeline",
    trigger_type: "lead.stage_changed",
    trigger_label: "When lead moves to Qualified or Proposal stage",
    recommended_for: "B2B sales teams preparing quotes and commercial proposals",
    conditions: [
      {
        id: "cond-c-1",
        field: "stage",
        operator: "in",
        value: ["qualified", "proposal"],
      },
    ],
    actions: [
      {
        id: "act-c-1",
        type: "task.create",
        config: {
          title: "Prepare tailored quotation / proposal",
          description: "Review client specs, calculate package pricing, and send proposal document.",
          due_offset_minutes: 1440, // +24 hours
          priority: "high",
        },
        order: 1,
      },
      {
        id: "act-c-2",
        type: "internal_note.create",
        config: {
          content: "Pipeline Milestone: Lead advanced stage. Proposal preparation task assigned.",
        },
        order: 2,
      },
    ],
  },
  {
    id: "template_d",
    name: "Overdue Follow-up Reminder",
    tagline: "Escalate missed commitments to manager and flag urgent",
    description:
      "When a follow-up task misses its deadline, creates an escalation task and adds an internal alert notice to prevent customer abandonment.",
    category: "sales_pipeline",
    trigger_type: "followup.overdue",
    trigger_label: "When a follow-up task passes its scheduled deadline",
    recommended_for: "Team leads supervising customer response times",
    conditions: [
      {
        id: "cond-d-1",
        field: "status",
        operator: "not_equals",
        value: "completed",
      },
    ],
    actions: [
      {
        id: "act-d-1",
        type: "task.create",
        config: {
          title: "Escalation: Overdue follow-up requires immediate action",
          description: "Previous task deadline exceeded without completion. Contact customer today.",
          due_offset_minutes: 60, // +1 hour
          priority: "urgent",
        },
        order: 1,
      },
      {
        id: "act-d-2",
        type: "internal_note.create",
        config: {
          content: "Escalation Notice: Task deadline missed. Manager alerted and urgency increased.",
        },
        order: 2,
      },
    ],
  },
  {
    id: "template_e",
    name: "Conversation Resolved Quality Check",
    tagline: "Schedule follow-up review after closing customer conversations",
    description:
      "When a conversation is marked resolved, automatically schedules a 48-hour satisfaction check task and logs the resolution audit.",
    category: "support",
    trigger_type: "conversation.resolved",
    trigger_label: "When WhatsApp conversation is marked as resolved",
    recommended_for: "Post-resolution quality assurance and retention",
    conditions: [
      {
        id: "cond-e-1",
        field: "status",
        operator: "equals",
        value: "resolved",
      },
    ],
    actions: [
      {
        id: "act-e-1",
        type: "task.create",
        config: {
          title: "Post-resolution satisfaction check",
          description: "Check if customer issue remained solved and verify overall customer satisfaction.",
          due_offset_minutes: 2880, // +48 hours
          priority: "medium",
        },
        order: 1,
      },
      {
        id: "act-e-2",
        type: "internal_note.create",
        config: {
          content: "Audit Log: Conversation closed and verified. Satisfaction check scheduled.",
        },
        order: 2,
      },
    ],
  },
  {
    id: "template_f",
    name: "Won Lead Post-Conversion Onboarding",
    tagline: "Trigger client onboarding workflow immediately upon closing a deal",
    description:
      "When a deal is marked Won, creates a client onboarding kickoff task and records the conversion win activity.",
    category: "retention",
    trigger_type: "lead.stage_changed",
    trigger_label: "When lead stage is updated to Won",
    recommended_for: "Client success and account onboarding teams",
    conditions: [
      {
        id: "cond-f-1",
        field: "stage",
        operator: "equals",
        value: "won",
      },
    ],
    actions: [
      {
        id: "act-f-1",
        type: "task.create",
        config: {
          title: "Initiate customer onboarding & setup",
          description: "Welcome client, send kickoff questionnaire, and schedule orientation call.",
          due_offset_minutes: 1440, // +24 hours
          priority: "high",
        },
        order: 1,
      },
      {
        id: "act-f-2",
        type: "internal_note.create",
        config: {
          content: "Deal Won! Post-sale onboarding workflow initialized. Customer kickoff task created.",
        },
        order: 2,
      },
    ],
  },
];
