export type LeadStage =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "won"
  | "lost";

export type ConsentStatus = "opted_in" | "opted_out" | "pending";

export type ContactClassification =
  | "ongoing_client"
  | "new_opportunity"
  | "vip"
  | "partner"
  | "lead";

export type DepartmentType =
  | "finance"
  | "operations"
  | "marketing"
  | "executive"
  | "technology"
  | "sales"
  | "other";

export type TaskPriority = "low" | "medium" | "high";

export type TaskStatus = "todo" | "in_progress" | "completed" | "cancelled";

export interface Contact {
  id: string;
  organization_id: string;
  first_name: string;
  last_name?: string | null;
  phone: string;
  email?: string | null;
  company?: string | null;
  role?: string | null;
  department?: DepartmentType | string | null;
  classification?: ContactClassification | string | null;
  tags: string[];
  source?: string | null;
  notes?: string | null;
  is_archived: boolean;
  assigned_to_user_id?: string | null;
  assigned_to_name?: string | null;
  consent_status: ConsentStatus;
  consent_opted_in_at?: string | null;
  consent_opted_out_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  organization_id: string;
  contact_id: string;
  contact_name: string;
  contact_phone: string;
  title: string;
  stage: LeadStage;
  source?: string | null;
  assigned_to_user_id?: string | null;
  assigned_to_name?: string | null;
  estimated_value: number;
  currency: string;
  next_follow_up_at?: string | null;
  lost_reason?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  organization_id: string;
  lead_id?: string | null;
  lead_title?: string | null;
  contact_id?: string | null;
  contact_name?: string | null;
  assigned_to_user_id?: string | null;
  assigned_to_name?: string | null;
  title: string;
  description?: string | null;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityItem {
  id: string;
  organization_id: string;
  entity_type: "contact" | "lead" | "task";
  entity_id: string;
  actor_name: string;
  action: string;
  details: string;
  created_at: string;
}

export interface DashboardMetrics {
  totalContacts: number;
  newLeads: number;
  leadsByStage: Record<LeadStage, { count: number; value: number }>;
  openFollowUps: number;
  overdueFollowUps: number;
  wonDeals: { count: number; value: number };
  lostDeals: { count: number; value: number };
  pipelineValue: number;
  conversionRate: number; // Percentage (e.g. 25.5)
}
