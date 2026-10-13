import {
  AISettings,
  AIUsageLog,
  ConversationSummaryParams,
  ConversationSummaryResult,
  LeadQualificationParams,
  LeadQualificationResult,
  ReplySuggestionParams,
  ReplySuggestionResult,
  RewriteParams,
  RewriteResult,
} from "./types";
import { getAIProvider } from "./gemini-provider";
import { subscriptionService } from "../billing/subscription-service";
import { getPlanDefinition } from "../billing/plans";

class AIService {
  private settings: Map<string, AISettings> = new Map();
  private logs: Map<string, AIUsageLog[]> = new Map();

  constructor() {
    this.seedInitialSettings();
  }

  private seedInitialSettings() {
    // 1. Acme Technologies Settings
    this.settings.set("acme-corp", {
      id: "ai-set-acme",
      organization_id: "acme-corp",
      is_enabled: true,
      provider: "mock",
      model_name: "gemini-1.5-flash",
      tone_preference: "friendly",
      max_response_length: 150,
      monthly_token_quota: 250000,
      enable_reply_suggestions: true,
      enable_lead_qualification: true,
      enable_conversation_summaries: true,
      enable_workflow_ai: true,
      updated_at: new Date().toISOString(),
    });

    this.logs.set("acme-corp", [
      {
        id: "log-1",
        organization_id: "acme-corp",
        feature: "reply_suggestion",
        provider: "mock",
        model_name: "gemini-1.5-flash",
        input_tokens: 145,
        output_tokens: 52,
        estimated_cost_inr: 0.0012,
        latency_ms: 120,
        status: "success",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: "log-2",
        organization_id: "acme-corp",
        feature: "lead_qualification",
        provider: "mock",
        model_name: "gemini-1.5-flash",
        input_tokens: 310,
        output_tokens: 180,
        estimated_cost_inr: 0.0031,
        latency_ms: 240,
        status: "success",
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
    ]);

    // 2. Beta Logistics Settings
    this.settings.set("beta-logistics", {
      id: "ai-set-beta",
      organization_id: "beta-logistics",
      is_enabled: true,
      provider: "mock",
      model_name: "gemini-1.5-flash",
      tone_preference: "professional",
      max_response_length: 120,
      monthly_token_quota: 50000,
      enable_reply_suggestions: true,
      enable_lead_qualification: true,
      enable_conversation_summaries: true,
      enable_workflow_ai: false,
      updated_at: new Date().toISOString(),
    });
  }

  // ============================================================================
  // SETTINGS & CONFIGURATION
  // ============================================================================

  public getSettings(orgSlug: string): AISettings {
    const existing = this.settings.get(orgSlug);
    if (existing) return { ...existing };

    const fallback: AISettings = {
      id: `ai-set-${orgSlug}`,
      organization_id: orgSlug,
      is_enabled: true,
      provider: "mock",
      model_name: "gemini-1.5-flash",
      tone_preference: "friendly",
      max_response_length: 150,
      monthly_token_quota: 50000,
      enable_reply_suggestions: true,
      enable_lead_qualification: true,
      enable_conversation_summaries: true,
      enable_workflow_ai: true,
      updated_at: new Date().toISOString(),
    };
    this.settings.set(orgSlug, fallback);
    return { ...fallback };
  }

  public updateSettings(orgSlug: string, updates: Partial<AISettings>): AISettings {
    const current = this.getSettings(orgSlug);
    const updated: AISettings = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.settings.set(orgSlug, updated);
    return { ...updated };
  }

  // ============================================================================
  // USAGE & TOKEN AUDITING
  // ============================================================================

  public getUsageSummary(orgSlug: string): {
    totalRequests: number;
    totalTokens: number;
    estimatedCostInr: number;
    remainingQuota: number;
    logs: AIUsageLog[];
  } {
    const logs = this.logs.get(orgSlug) || [];
    const settings = this.getSettings(orgSlug);

    let totalTokens = 0;
    let estimatedCostInr = 0;

    logs.forEach((l) => {
      totalTokens += (l.input_tokens || 0) + (l.output_tokens || 0);
      estimatedCostInr += Number(l.estimated_cost_inr || 0);
    });

    const remainingQuota = Math.max(0, settings.monthly_token_quota - totalTokens);

    return {
      totalRequests: logs.length,
      totalTokens,
      estimatedCostInr: parseFloat(estimatedCostInr.toFixed(4)),
      remainingQuota,
      logs: [...logs].slice(0, 50),
    };
  }

  private recordUsage(
    orgSlug: string,
    feature: AIUsageLog["feature"],
    inputTokens: number,
    outputTokens: number,
    latencyMs: number,
    status: AIUsageLog["status"] = "success"
  ): void {
    const logs = this.logs.get(orgSlug) || [];
    // Cost estimation for Gemini 1.5 Flash:
    // Input: $0.075 / 1,000,000 tokens * 84 INR/USD = ₹0.0000063 per token
    // Output: $0.30 / 1,000,000 tokens * 84 INR/USD = ₹0.0000252 per token
    const costInr = inputTokens * 0.0000063 + outputTokens * 0.0000252;

    const newLog: AIUsageLog = {
      id: `ai-log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      organization_id: orgSlug,
      feature,
      provider: "mock",
      model_name: "gemini-1.5-flash",
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost_inr: parseFloat(costInr.toFixed(4)),
      latency_ms: latencyMs,
      status,
      created_at: new Date().toISOString(),
    };

    logs.unshift(newLog);
    this.logs.set(orgSlug, logs);
  }

  // ============================================================================
  // GUARDED AI OPERATIONS
  // ============================================================================

  public async generateReplySuggestion(
    params: ReplySuggestionParams
  ): Promise<ReplySuggestionResult> {
    const settings = this.getSettings(params.orgSlug);
    if (!settings.is_enabled || !settings.enable_reply_suggestions) {
      throw new Error("AI Reply Suggestions are disabled for this workspace.");
    }

    // Subscription check: ensure tenant is not suspended/expired
    const sub = subscriptionService.getSubscription(params.orgSlug);
    if (sub.status === "suspended" || sub.status === "expired") {
      throw new Error("AI features unavailable: Workspace subscription is in read-only mode.");
    }

    const provider = getAIProvider();
    const startTime = Date.now();
    try {
      const result = await provider.generateReplySuggestion(params);
      const latency = Date.now() - startTime;
      this.recordUsage(
        params.orgSlug,
        "reply_suggestion",
        result.tokensUsed.input,
        result.tokensUsed.output,
        latency,
        "success"
      );
      return result;
    } catch (err: any) {
      this.recordUsage(params.orgSlug, "reply_suggestion", 0, 0, Date.now() - startTime, "failed");
      throw err;
    }
  }

  public async rewriteDraft(params: RewriteParams): Promise<RewriteResult> {
    const settings = this.getSettings(params.orgSlug);
    if (!settings.is_enabled) {
      throw new Error("AI Assistance is disabled for this workspace.");
    }

    const provider = getAIProvider();
    const startTime = Date.now();
    try {
      const result = await provider.rewriteDraft(params);
      const latency = Date.now() - startTime;
      this.recordUsage(params.orgSlug, "rewrite", 50, 40, latency, "success");
      return result;
    } catch (err: any) {
      this.recordUsage(params.orgSlug, "rewrite", 0, 0, Date.now() - startTime, "failed");
      throw err;
    }
  }

  public async summarizeConversation(
    params: ConversationSummaryParams
  ): Promise<ConversationSummaryResult> {
    const settings = this.getSettings(params.orgSlug);
    if (!settings.is_enabled || !settings.enable_conversation_summaries) {
      throw new Error("AI Conversation Summaries are disabled for this workspace.");
    }

    const provider = getAIProvider();
    const startTime = Date.now();
    try {
      const result = await provider.summarizeConversation(params);
      const latency = Date.now() - startTime;
      this.recordUsage(params.orgSlug, "summary", 180, 80, latency, "success");
      return result;
    } catch (err: any) {
      this.recordUsage(params.orgSlug, "summary", 0, 0, Date.now() - startTime, "failed");
      throw err;
    }
  }

  public async qualifyLead(
    params: LeadQualificationParams
  ): Promise<LeadQualificationResult> {
    const settings = this.getSettings(params.orgSlug);
    if (!settings.is_enabled || !settings.enable_lead_qualification) {
      throw new Error("AI Lead Qualification is disabled for this workspace.");
    }

    const provider = getAIProvider();
    const startTime = Date.now();
    try {
      const result = await provider.qualifyLead(params);
      const latency = Date.now() - startTime;
      this.recordUsage(params.orgSlug, "lead_qualification", 260, 140, latency, "success");
      return result;
    } catch (err: any) {
      this.recordUsage(params.orgSlug, "lead_qualification", 0, 0, Date.now() - startTime, "failed");
      throw err;
    }
  }
}

export const aiService = new AIService();
