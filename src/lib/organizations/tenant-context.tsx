"use client";

import React, { createContext, useContext } from "react";
import { Organization, OrganizationRole } from "./types";

interface TenantContextType {
  currentOrg: Organization;
  userRole: OrganizationRole;
  organizations: Organization[];
  isOwner: boolean;
  isAdmin: boolean;
}

const TenantContext = createContext<TenantContextType | null>(null);

export function TenantProvider({
  children,
  currentOrg,
  userRole,
  organizations,
}: {
  children: React.ReactNode;
  currentOrg: Organization;
  userRole: OrganizationRole;
  organizations: Organization[];
}) {
  const isOwner = userRole === "owner";
  const isAdmin = userRole === "owner" || userRole === "admin";

  return (
    <TenantContext.Provider
      value={{
        currentOrg,
        userRole,
        organizations,
        isOwner,
        isAdmin,
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
