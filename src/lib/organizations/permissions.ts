import { OrganizationRole } from "./types";

/**
 * Role capability matrix helpers.
 * Owner: Full root access
 * Admin: Operational management (team, settings, automations, whatsapp)
 * Staff: Standard daily operations (contacts, leads, inbox, tasks)
 */

export function isOwner(role: OrganizationRole): boolean {
  return role === "owner";
}

export function isAdmin(role: OrganizationRole): boolean {
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

export function canManageWhatsAppSettings(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin";
}

export function canConfigureAutomations(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin";
}

export function canDeleteRecords(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin";
}

export function hasPermission(
  role: OrganizationRole,
  allowedRoles: OrganizationRole[]
): boolean {
  return allowedRoles.includes(role);
}
