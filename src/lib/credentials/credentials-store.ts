import { AccessCredential, OrganizationRole } from "@/lib/organizations/types";

class CredentialsStore {
  private credentials: Map<string, AccessCredential[]> = new Map();

  constructor() {
    this.seedInitialCredentials();
  }

  private seedInitialCredentials() {
    const acmeOrg = "acme-corp";
    const betaOrg = "beta-logistics";

    const acmeCredentials: AccessCredential[] = [
      {
        id: "cred-adm-01",
        organizationId: acmeOrg,
        name: "Admin Master Credential",
        role: "admin",
        email: "admin@acmetech.io",
        apiKeyId: "roos_live_adm_9f82d114c0a",
        secretMasked: "sec_live_••••••••••••9a7e",
        scopes: [
          "admin:full_access",
          "billing:fund_transfers",
          "billing:payout_governance",
          "team:credentials_manage",
          "whatsapp:api_full",
          "crm:all_pipelines",
          "automations:all_workflows",
        ],
        description: "Full root authority: Financial fund transfers, billing, team credential issuance & system architecture.",
        lastActive: "Just now",
        status: "active",
        created_at: "2026-01-10T10:00:00.000Z",
        canAccessFunds: true,
        operationalScope: "root_governance",
      },
      {
        id: "cred-snr-02",
        organizationId: acmeOrg,
        name: "Senior Operations Manager Credential",
        role: "senior_manager",
        email: "operations.lead@acmetech.io",
        apiKeyId: "roos_live_snr_3b48f98a21e",
        secretMasked: "sec_live_••••••••••••33b1",
        scopes: [
          "crm:all_pipelines",
          "inbox:team_conversations",
          "campaigns:broadcast_send",
          "templates:meta_submit",
          "automations:builder_trigger",
          "reports:operational_analytics",
          "team:workload_oversight",
        ],
        description: "Complete operational management across CRM, workflows, campaigns, and inbox. Restricted from overall fund transfer ledgers and payout credentials.",
        lastActive: "12m ago",
        status: "active",
        created_at: "2026-01-15T12:00:00.000Z",
        canAccessFunds: false,
        operationalScope: "full_operational",
      },
      {
        id: "cred-jnr-03",
        organizationId: acmeOrg,
        name: "Junior Manager (Tasks & Performance) Credential",
        role: "junior_manager",
        email: "jr.manager@acmetech.io",
        apiKeyId: "roos_live_jnr_7c21e54f99d",
        secretMasked: "sec_live_••••••••••••88d0",
        scopes: [
          "tasks:manage_assigned",
          "performance:personal_metrics",
          "inbox:assigned_chats",
          "contacts:view_assigned",
          "leads:update_stage",
        ],
        description: "Focused execution: Tasks checklist, personal throughput performance, follow-up reminders, and assigned customer interactions.",
        lastActive: "25m ago",
        status: "active",
        created_at: "2026-02-01T09:30:00.000Z",
        canAccessFunds: false,
        operationalScope: "task_performance_only",
      },
    ];

    const betaCredentials: AccessCredential[] = [
      {
        id: "cred-beta-01",
        organizationId: betaOrg,
        name: "Beta Logistics Admin Credential",
        role: "admin",
        email: "manager@betalogistics.in",
        apiKeyId: "roos_live_adm_beta7712a",
        secretMasked: "sec_live_••••••••••••55aa",
        scopes: ["admin:full_access", "billing:fund_transfers", "crm:all_pipelines"],
        description: "Full administrative credential for Beta Logistics workspace.",
        lastActive: "1h ago",
        status: "active",
        created_at: "2026-02-10T10:00:00.000Z",
        canAccessFunds: true,
        operationalScope: "root_governance",
      },
    ];

    this.credentials.set(acmeOrg, acmeCredentials);
    this.credentials.set("demo-corp", acmeCredentials);
    this.credentials.set(betaOrg, betaCredentials);
  }

  getCredentials(orgSlug: string): AccessCredential[] {
    return [...(this.credentials.get(orgSlug) || [])];
  }

  getCredentialById(orgSlug: string, credId: string): AccessCredential | null {
    const list = this.credentials.get(orgSlug) || [];
    return list.find((c) => c.id === credId) || null;
  }

  createCredential(
    orgSlug: string,
    params: {
      name: string;
      email: string;
      role: OrganizationRole;
      description?: string;
    }
  ): AccessCredential {
    const list = this.credentials.get(orgSlug) || [];
    const prefix =
      params.role === "admin" || params.role === "owner"
        ? "adm"
        : params.role === "senior_manager"
        ? "snr"
        : "jnr";

    const randomHex = Math.random().toString(36).substring(2, 10);
    const apiKeyId = `roos_live_${prefix}_${randomHex}`;
    const secretSuffix = Math.random().toString(36).substring(2, 6);

    let scopes: string[] = [];
    let canAccessFunds = false;
    let operationalScope: "root_governance" | "full_operational" | "task_performance_only" =
      "task_performance_only";

    if (params.role === "admin" || params.role === "owner") {
      canAccessFunds = true;
      operationalScope = "root_governance";
      scopes = [
        "admin:full_access",
        "billing:fund_transfers",
        "billing:payout_governance",
        "team:credentials_manage",
        "whatsapp:api_full",
        "crm:all_pipelines",
        "automations:all_workflows",
      ];
    } else if (params.role === "senior_manager") {
      canAccessFunds = false;
      operationalScope = "full_operational";
      scopes = [
        "crm:all_pipelines",
        "inbox:team_conversations",
        "campaigns:broadcast_send",
        "templates:meta_submit",
        "automations:builder_trigger",
        "reports:operational_analytics",
        "team:workload_oversight",
      ];
    } else {
      canAccessFunds = false;
      operationalScope = "task_performance_only";
      scopes = [
        "tasks:manage_assigned",
        "performance:personal_metrics",
        "inbox:assigned_chats",
        "contacts:view_assigned",
      ];
    }

    const newCred: AccessCredential = {
      id: `cred-${Date.now()}`,
      organizationId: orgSlug,
      name: params.name,
      role: params.role,
      email: params.email,
      apiKeyId,
      secretMasked: `sec_live_••••••••••••${secretSuffix}`,
      scopes,
      description:
        params.description ||
        (params.role === "admin"
          ? "Full administrative and financial access."
          : params.role === "senior_manager"
          ? "Operational management across CRM, workflows, campaigns. No fund transfers."
          : "Limited to tasks, performance tracking and assigned records."),
      lastActive: "Never",
      status: "active",
      created_at: new Date().toISOString(),
      canAccessFunds,
      operationalScope,
    };

    list.unshift(newCred);
    this.credentials.set(orgSlug, list);
    return newCred;
  }

  revokeCredential(orgSlug: string, credId: string): boolean {
    const list = this.credentials.get(orgSlug) || [];
    const cred = list.find((c) => c.id === credId);
    if (!cred) return false;
    cred.status = "revoked";
    this.credentials.set(orgSlug, list);
    return true;
  }

  deleteCredential(orgSlug: string, credId: string): boolean {
    const list = this.credentials.get(orgSlug) || [];
    const filtered = list.filter((c) => c.id !== credId);
    this.credentials.set(orgSlug, filtered);
    return true;
  }
}

const globalCredentialsStore = global as unknown as { __credentialsStore?: CredentialsStore };
export const credentialsStore =
  globalCredentialsStore.__credentialsStore ?? new CredentialsStore();
if (process.env.NODE_ENV !== "production") {
  globalCredentialsStore.__credentialsStore = credentialsStore;
}
