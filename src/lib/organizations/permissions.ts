import { OrganizationRole } from "./types";

/**
 * 3-Level Access Credential Matrix:
 * 1. Admin (owner | admin):
 *    - Full Access: Team credentials, WhatsApp Cloud API tokens, Workspace settings,
 *      Overall fund transfers, bank payouts, invoices, and billing governance.
 *
 * 2. Senior Manager (senior_manager):
 *    - All Operational Access: Sales pipeline, inbox, campaigns, templates,
 *      automation triggers, team oversight, operational reports.
 *    - RESTRICTED: Overall fund transfer details, payout ledgers, settlement accounts,
 *      billing management, and master API credential revocation.
 *
 * 3. Junior Manager (junior_manager | staff):
 *    - Limited to Tasks & Performance: Assigned tasks, daily follow-ups,
 *      assigned leads/contacts, conversation handling, and personal productivity metrics.
 *    - RESTRICTED: Cannot configure automations, cannot view company-wide finances,
 *      cannot view or modify team credentials or WhatsApp API settings.
 */

export function isOwner(role: OrganizationRole): boolean {
  return role === "owner";
}

export function isAdmin(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin";
}

export function isSeniorManager(role: OrganizationRole): boolean {
  return role === "senior_manager" || isAdmin(role);
}

export function isJuniorManager(role: OrganizationRole): boolean {
  return role === "junior_manager" || role === "staff";
}

/**
 * Fund Transfers & Financial Ledgers:
 * ONLY Admin (and Owner) hold financial clearance.
 * Senior Manager and Junior Manager are strictly restricted.
 */
export function canAccessFundTransfers(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin";
}

export function canManageBilling(role: OrganizationRole): boolean {
  return role === "owner";
}

export function canDeleteOrganization(role: OrganizationRole): boolean {
  return role === "owner";
}

export function canManageTeam(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin";
}

export function canManageCredentials(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin";
}

export function canManageWhatsAppSettings(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin";
}

/**
 * Operations: Automations, Campaigns, and Templates
 * Admin and Senior Manager have full operational rights.
 * Junior Manager is restricted to executing tasks and interacting with assigned leads.
 */
export function canConfigureAutomations(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin" || role === "senior_manager";
}

export function canBroadcastCampaigns(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin" || role === "senior_manager";
}

export function canManageTemplates(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin" || role === "senior_manager";
}

export function canDeleteRecords(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin";
}

export function canViewAllPipelines(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin" || role === "senior_manager";
}

export function canAccessTasks(role: OrganizationRole): boolean {
  // All roles can access tasks; Junior Manager has tasks as their primary operational workspace
  return true;
}

export function canViewCompanyReports(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin" || role === "senior_manager";
}

export function hasPermission(
  role: OrganizationRole,
  allowedRoles: OrganizationRole[]
): boolean {
  return allowedRoles.includes(role);
}

export interface RoleMetadata {
  role: OrganizationRole;
  title: string;
  level: "Level 1" | "Level 2" | "Level 3";
  badgeVariant: "purple" | "blue" | "emerald" | "neutral";
  summary: string;
  fundTransferAccess: boolean;
  operationalScope: string;
  allowedFeatures: string[];
  restrictions: string[];
}

export const ROLE_DEFINITIONS: Record<OrganizationRole, RoleMetadata> = {
  owner: {
    role: "owner",
    title: "Root Owner / Super Admin",
    level: "Level 1",
    badgeVariant: "purple",
    summary: "Full platform root governance, fund transfer oversight, billing and organisation lifecycle.",
    fundTransferAccess: true,
    operationalScope: "Root Governance & Financial Clearance",
    allowedFeatures: [
      "Full CRM pipeline & contact management",
      "Overall fund transfers & bank settlements",
      "Billing, subscriptions & invoice downloads",
      "Team credential issuance & revocation",
      "Meta WhatsApp Cloud API integration & webhooks",
      "Automations & AI workflow builder",
      "Company-wide reporting & analytics",
    ],
    restrictions: ["None (Root authority)"],
  },
  admin: {
    role: "admin",
    title: "Administrator (Full Access)",
    level: "Level 1",
    badgeVariant: "blue",
    summary: "Complete administrative, operational, and financial transfer clearance.",
    fundTransferAccess: true,
    operationalScope: "Full Access & Financial Control",
    allowedFeatures: [
      "Full CRM pipeline & contact management",
      "Overall fund transfers & bank payout tracking",
      "Plan upgrades, billing & payment gateway control",
      "Issue, rotate and revoke user access credentials",
      "WhatsApp Cloud API token configuration",
      "Create & publish automation workflows",
      "Team-wide performance & revenue reports",
    ],
    restrictions: ["Cannot delete the workspace root tenant without owner approval"],
  },
  senior_manager: {
    role: "senior_manager",
    title: "Senior Manager (Operational Access)",
    level: "Level 2",
    badgeVariant: "purple",
    summary: "All operational capabilities across CRM, campaigns, and team tasks, without fund transfer details.",
    fundTransferAccess: false,
    operationalScope: "Full Operational Management (Excluding Fund Transfers)",
    allowedFeatures: [
      "Full CRM pipeline (all stages, deals, customer records)",
      "WhatsApp shared inbox & broadcast campaigns",
      "Automation triggers & template submissions",
      "Team operational oversight & agent task distribution",
      "Campaign analytics & conversion reports",
    ],
    restrictions: [
      "NO access to overall fund transfer details or bank settlements",
      "NO access to subscription invoices or payment gateway tokens",
      "Cannot view or modify Meta WhatsApp master secret keys",
      "Cannot delete organisation or revoke Admin credentials",
    ],
  },
  junior_manager: {
    role: "junior_manager",
    title: "Junior Manager (Tasks & Performance)",
    level: "Level 3",
    badgeVariant: "emerald",
    summary: "Focused workspace dedicated to task execution, personal performance, and assigned customer follow-ups.",
    fundTransferAccess: false,
    operationalScope: "Tasks, Performance & Assigned Records Only",
    allowedFeatures: [
      "Tasks & Follow-up checklists (due today, overdue, completed)",
      "Personal performance metrics & response-time analytics",
      "Assigned WhatsApp chats & client inquiries",
      "Assigned contact follow-ups and deal note updates",
    ],
    restrictions: [
      "NO access to fund transfers, payout accounts, or billing",
      "NO access to system settings or WhatsApp API credentials",
      "Cannot configure or modify automation workflows",
      "Cannot view company-wide financial revenue reports",
      "Cannot invite, view, or manage other team members",
    ],
  },
  staff: {
    role: "staff",
    title: "Staff Member (Operational Support)",
    level: "Level 3",
    badgeVariant: "neutral",
    summary: "Standard day-to-day customer support and assigned task execution.",
    fundTransferAccess: false,
    operationalScope: "Assigned Inbox, Contacts & Tasks",
    allowedFeatures: [
      "Assigned customer chat interactions",
      "Personal daily task follow-ups",
      "Contact updates for assigned leads",
    ],
    restrictions: [
      "NO access to fund transfers or billing",
      "NO access to automations builder or settings",
    ],
  },
};

