import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Billing & Reporting Database Migration Integrity", () => {
  const migrationPath = path.resolve(
    __dirname,
    "../../supabase/migrations/20261012000007_billing_and_reporting.sql"
  );

  it("should create payment_events, webhook_events, and plan_overrides tables", () => {
    const content = fs.readFileSync(migrationPath, "utf-8");

    expect(content).toContain("CREATE TABLE IF NOT EXISTS public.payment_events");
    expect(content).toContain("CREATE TABLE IF NOT EXISTS public.webhook_events");
    expect(content).toContain("CREATE TABLE IF NOT EXISTS public.plan_overrides");
  });

  it("should extend public.subscriptions with billing intervals, status checks, and cancel reasons", () => {
    const content = fs.readFileSync(migrationPath, "utf-8");

    expect(content).toContain("CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'suspended', 'expired'))");
    expect(content).toContain("ADD COLUMN IF NOT EXISTS billing_interval TEXT");
    expect(content).toContain("ADD COLUMN IF NOT EXISTS cancel_reason TEXT");
  });

  it("should enforce Row Level Security on payment_events and plan_overrides", () => {
    const content = fs.readFileSync(migrationPath, "utf-8");

    expect(content).toContain("ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;");
    expect(content).toContain("ALTER TABLE public.payment_events FORCE ROW LEVEL SECURITY;");
    expect(content).toContain("ALTER TABLE public.plan_overrides ENABLE ROW LEVEL SECURITY;");
    expect(content).toContain("ALTER TABLE public.plan_overrides FORCE ROW LEVEL SECURITY;");
  });
});
