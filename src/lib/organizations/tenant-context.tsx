"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Organization, OrganizationRole } from "./types";
import {
  isAdmin as checkAdmin,
  isOwner as checkOwner,
  isSeniorManager as checkSeniorManager,
  isJuniorManager as checkJuniorManager,
  canAccessFundTransfers as checkFundTransfers,
  canConfigureAutomations as checkAutomations,
  canManageTeam as checkTeam,
  canManageWhatsAppSettings as checkWhatsApp,
  canViewAllPipelines as checkPipelines,
} from "./permissions";

interface TenantContextType {
  currentOrg: Organization;
  userRole: OrganizationRole;
  setUserRole: (role: OrganizationRole) => void;
  organizations: Organization[];
  isOwner: boolean;
  isAdmin: boolean;
  isSeniorManager: boolean;
  isJuniorManager: boolean;
  canAccessFunds: boolean;
  canManageAutomations: boolean;
  canManageTeam: boolean;
  canManageWhatsApp: boolean;
  canViewAllPipelines: boolean;
}

const TenantContext = createContext<TenantContextType | null>(null);

export function TenantProvider({
  children,
  currentOrg,
  userRole: initialRole,
  organizations,
}: {
  children: React.ReactNode;
  currentOrg: Organization;
  userRole: OrganizationRole;
  organizations: Organization[];
}) {
  const [activeRole, setActiveRole] = useState<OrganizationRole>(initialRole);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`roos_active_role_${currentOrg.slug}`);
      if (
        stored &&
        ["owner", "admin", "senior_manager", "junior_manager", "staff"].includes(stored)
      ) {
        setActiveRole(stored as OrganizationRole);
      }
    } catch {
      // LocalStorage access might fail in private browsing
    }
  }, [currentOrg.slug]);

  const handleSetRole = (newRole: OrganizationRole) => {
    setActiveRole(newRole);
    try {
      localStorage.setItem(`roos_active_role_${currentOrg.slug}`, newRole);
    } catch {
      // Ignore
    }
  };

  const isOwner = checkOwner(activeRole);
  const isAdmin = checkAdmin(activeRole);
  const isSeniorManager = checkSeniorManager(activeRole);
  const isJuniorManager = checkJuniorManager(activeRole);
  const canAccessFunds = checkFundTransfers(activeRole);
  const canManageAutomations = checkAutomations(activeRole);
  const canManageTeam = checkTeam(activeRole);
  const canManageWhatsApp = checkWhatsApp(activeRole);
  const canViewAllPipelines = checkPipelines(activeRole);

  return (
    <TenantContext.Provider
      value={{
        currentOrg,
        userRole: activeRole,
        setUserRole: handleSetRole,
        organizations,
        isOwner,
        isAdmin,
        isSeniorManager,
        isJuniorManager,
        canAccessFunds,
        canManageAutomations,
        canManageTeam,
        canManageWhatsApp,
        canViewAllPipelines,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
