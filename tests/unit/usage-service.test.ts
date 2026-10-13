import { describe, it, expect } from "vitest";
import { usageService } from "../../src/lib/billing/usage-service";

describe("Usage Tracking & Quota Service", () => {
  const orgSlug = "acme-corp";

  it("should compute current period month in YYYY-MM-01 format", () => {
    const usage = usageService.getTenantUsage(orgSlug);
    expect(usage.organization_id).toBe(orgSlug);
    expect(usage.period_month).toMatch(/^\d{4}-\d{2}-01$/);
  });

  it("should reconcile metrics against live CRM and team stores", () => {
    const usage = usageService.getTenantUsage(orgSlug);
    const m = usage.metrics;

    expect(m.team_seats.current_count).toBeGreaterThan(0);
    expect(m.active_contacts.current_count).toBeGreaterThan(0);
    expect(m.active_leads.current_count).toBeGreaterThan(0);
    expect(m.active_workflows.current_count).toBeGreaterThan(0);

    // Percentage calculation
    expect(m.team_seats.percentage_used).toBe(
      parseFloat(((m.team_seats.current_count / m.team_seats.max_quota) * 100).toFixed(1))
    );
  });

  it("should identify warning thresholds when usage exceeds 80%", () => {
    // Increment message count until it exceeds 80% of Growth limit (1,000 msgs -> >800)
    usageService.incrementCounter(orgSlug, "whatsapp_messages", 850);
    const usage = usageService.getTenantUsage(orgSlug);

    expect(usage.metrics.whatsapp_messages.is_warning).toBe(true);
    expect(usage.metrics.whatsapp_messages.current_count).toBeGreaterThanOrEqual(850);
  });

  it("should support administrative quota overrides with audit reason", () => {
    const initialUsage = usageService.getTenantUsage("beta-logistics");
    const initialContactQuota = initialUsage.metrics.active_contacts.max_quota;

    // Grant 1,000 bonus contacts
    const override = usageService.addOverride(
      "beta-logistics",
      "active_contacts",
      1000,
      "High-volume customer promotion",
      "Head of Operations"
    );

    expect(override.extra_quota).toBe(1000);
    expect(override.reason).toBe("High-volume customer promotion");

    const updatedUsage = usageService.getTenantUsage("beta-logistics");
    expect(updatedUsage.metrics.active_contacts.max_quota).toBe(initialContactQuota + 1000);
    expect(updatedUsage.metrics.active_contacts.admin_override_quota).toBe(1000);
  });
});
