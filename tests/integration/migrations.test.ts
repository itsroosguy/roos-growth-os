import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Database Migration Integrity Checks", () => {
  const schemaMigrationPath = path.resolve(
    __dirname,
    "../../supabase/migrations/20261012000001_core_schema.sql"
  );
  const rlsMigrationPath = path.resolve(
    __dirname,
    "../../supabase/migrations/20261012000002_rls_policies.sql"
  );

  const expected17Tables = [
    "organizations",
    "profiles",
    "organization_members",
    "contacts",
    "consent_records",
    "leads",
    "whatsapp_connections",
    "conversations",
    "messages",
    "message_templates",
    "tasks",
    "follow_ups",
    "automation_rules",
    "automation_executions",
    "subscriptions",
    "usage_records",
    "audit_logs",
  ];

  it("should define all 17 tables in 20261012000001_core_schema.sql", () => {
    const content = fs.readFileSync(schemaMigrationPath, "utf-8");

    expected17Tables.forEach((table) => {
      const tableDeclaration = `CREATE TABLE IF NOT EXISTS public.${table}`;
      expect(content).toContain(tableDeclaration);
    });
  });

  it("should enable and force RLS on all tenant tables in 20261012000002_rls_policies.sql", () => {
    const content = fs.readFileSync(rlsMigrationPath, "utf-8");

    // All customer-data tables must have ENABLE and FORCE RLS
    expected17Tables.forEach((table) => {
      const enableRls = `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`;
      const forceRls = `ALTER TABLE public.${table} FORCE ROW LEVEL SECURITY;`;
      expect(content).toContain(enableRls);
      expect(content).toContain(forceRls);
    });
  });

  it("should define security definer helper functions", () => {
    const content = fs.readFileSync(rlsMigrationPath, "utf-8");
    expect(content).toContain("FUNCTION public.auth_user_org_ids()");
    expect(content).toContain("FUNCTION public.auth_has_org_role(");
  });
});
