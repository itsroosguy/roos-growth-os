import { describe, it, expect, beforeEach } from "vitest";
import { aiService } from "../../src/lib/ai/ai-service";
import { businessContextStore } from "../../src/lib/ai/business-context-store";
import { subscriptionService } from "../../src/lib/billing/subscription-service";
import * as fs from "fs";
import * as path from "path";

describe("Tenant Isolation, Security & AI Quotas", () => {
  beforeEach(() => {
    // Reset Acme settings to default enabled
    aiService.updateSettings("acme-corp", {
      is_enabled: true,
      enable_reply_suggestions: true,
      enable_lead_qualification: true,
      enable_conversation_summaries: true,
      monthly_token_quota: 250000,
    });

    // Reset Beta settings
    aiService.updateSettings("beta-logistics", {
      is_enabled: true,
      enable_reply_suggestions: true,
      tone_preference: "professional",
      monthly_token_quota: 50000,
    });
  });

  it("should maintain strict isolation between Acme and Beta AI settings", () => {
    const acmeSettings = aiService.getSettings("acme-corp");
    const betaSettings = aiService.getSettings("beta-logistics");

    expect(acmeSettings.monthly_token_quota).toBe(250000);
    expect(betaSettings.monthly_token_quota).toBe(50000);
    expect(betaSettings.tone_preference).toBe("professional");

    // Modify Beta settings and ensure Acme is unaffected
    aiService.updateSettings("beta-logistics", {
      monthly_token_quota: 75000,
      tone_preference: "concise",
    });

    const acmeAfter = aiService.getSettings("acme-corp");
    const betaAfter = aiService.getSettings("beta-logistics");

    expect(betaAfter.monthly_token_quota).toBe(75000);
    expect(betaAfter.tone_preference).toBe("concise");
    expect(acmeAfter.monthly_token_quota).toBe(250000);
  });

  it("should maintain strict isolation of AI usage audit logs between tenants", () => {
    const acmeSummary = aiService.getUsageSummary("acme-corp");
    const betaSummary = aiService.getUsageSummary("beta-logistics");

    // Both should have independent logs
    expect(acmeSummary.logs.every((l) => l.organization_id === "acme-corp")).toBe(true);
    expect(betaSummary.logs.every((l) => l.organization_id === "beta-logistics")).toBe(true);
    expect(acmeSummary.totalRequests).toBeGreaterThanOrEqual(2);
  });

  it("should calculate token quotas, consumption and estimated INR costs", () => {
    const acmeSummary = aiService.getUsageSummary("acme-corp");

    expect(acmeSummary.totalTokens).toBeGreaterThan(0);
    expect(acmeSummary.estimatedCostInr).toBeGreaterThan(0);
    expect(acmeSummary.remainingQuota).toBe(
      250000 - acmeSummary.totalTokens
    );
  });

  it("should enforce master AI killswitch when disabled by organisation admin", async () => {
    aiService.updateSettings("acme-corp", { is_enabled: false });

    await expect(
      aiService.generateReplySuggestion({
        orgSlug: "acme-corp",
        customerName: "Pooja",
        incomingMessage: "What are your prices?",
        recentMessages: [],
      })
    ).rejects.toThrow("AI Reply Suggestions are disabled for this workspace.");

    // Beta should remain enabled
    const betaSuggestion = await aiService.generateReplySuggestion({
      orgSlug: "beta-logistics",
      customerName: "Ramesh",
      incomingMessage: "What are your freight rates?",
      recentMessages: [],
    });
    expect(betaSuggestion).toBeDefined();
    expect(betaSuggestion.groundedInBusinessProfile).toBe(true);
  });

  it("should block AI generation when workspace subscription is suspended", async () => {
    // Temporarily suspend Beta Logistics subscription
    subscriptionService.updateSubscription("beta-logistics", {
      status: "suspended",
    });

    try {
      await expect(
        aiService.generateReplySuggestion({
          orgSlug: "beta-logistics",
          customerName: "Client",
          incomingMessage: "Can you send quote?",
          recentMessages: [],
        })
      ).rejects.toThrow("AI features unavailable: Workspace subscription is in read-only mode.");
    } finally {
      // Restore subscription
      subscriptionService.updateSubscription("beta-logistics", {
        status: "active",
      });
    }
  });

  it("should verify Supabase SQL migration defines strict RLS for AI tables", () => {
    const migrationPath = path.resolve(
      __dirname,
      "../../supabase/migrations/20261012000008_ai_capabilities.sql"
    );
    expect(fs.existsSync(migrationPath)).toBe(true);

    const sql = fs.readFileSync(migrationPath, "utf-8");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.business_profiles");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.ai_settings");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.ai_usage_logs");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.lead_qualifications");
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain('CREATE POLICY "Members can view organization business profile"');
    expect(sql).toContain('CREATE POLICY "Members can view organization ai settings"');
    expect(sql).toContain('CREATE POLICY "Members can view organization ai usage logs"');
    expect(sql).toContain('CREATE POLICY "Members can view lead qualifications"');
  });
});
