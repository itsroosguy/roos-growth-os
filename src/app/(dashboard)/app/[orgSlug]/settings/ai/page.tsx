"use client";

import React, { useState } from "react";
import { useTenant } from "@/lib/organizations/tenant-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { aiService } from "@/lib/ai/ai-service";
import { AITonePreference } from "@/lib/ai/types";
import {
  Sparkles,
  Bot,
  Sliders,
  CheckCircle2,
  Clock,
  Shield,
  Zap,
  HelpCircle,
  FileText,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";

export default function AISettingsPage() {
  const { currentOrg, isAdmin } = useTenant();
  const [saved, setSaved] = useState(false);

  // Live state
  const settings = aiService.getSettings(currentOrg.slug);
  const usage = aiService.getUsageSummary(currentOrg.slug);

  const [isEnabled, setIsEnabled] = useState(settings.is_enabled);
  const [tone, setTone] = useState<AITonePreference>(settings.tone_preference);
  const [maxLength, setMaxLength] = useState(settings.max_response_length);
  const [enableReplies, setEnableReplies] = useState(settings.enable_reply_suggestions);
  const [enableQual, setEnableQual] = useState(settings.enable_lead_qualification);
  const [enableSummaries, setEnableSummaries] = useState(settings.enable_conversation_summaries);
  const [enableWorkflows, setEnableWorkflows] = useState(settings.enable_workflow_ai);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    aiService.updateSettings(currentOrg.slug, {
      is_enabled: isEnabled,
      tone_preference: tone,
      max_response_length: maxLength,
      enable_reply_suggestions: enableReplies,
      enable_lead_qualification: enableQual,
      enable_conversation_summaries: enableSummaries,
      enable_workflow_ai: enableWorkflows,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tokenUsagePercentage = Math.min(
    100,
    parseFloat(((usage.totalTokens / settings.monthly_token_quota) * 100).toFixed(1))
  );

  return (
    <div className="space-y-7 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/60">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              AI Assistant & Copilot Settings
            </h1>
            <span className="glass-pill rounded-full bg-white/80 border border-white text-xs font-semibold px-3 py-0.5 text-blue-700 shadow-xs">
              Gemini 1.5 Flash
            </span>
            <span className="glass-pill rounded-full bg-white/80 border border-white text-xs font-semibold px-3 py-0.5 text-slate-700 shadow-xs">
              Sandbox Mode
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
            Configure response tone, token consumption limits, and feature permissions for {currentOrg.name}.
          </p>
        </div>

        <Link href={`/app/${currentOrg.slug}/settings/business-profile`}>
          <Button variant="outline" size="sm" className="text-xs rounded-xl border-white/80 bg-white/80 hover:bg-white text-slate-700 shadow-xs">
            <FileText className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
            Edit Business Knowledge Profile
          </Button>
        </Link>
      </div>

      {saved && (
        <div className="rounded-2xl bg-emerald-50/90 backdrop-blur-sm p-4 border border-emerald-200/80 text-xs text-emerald-800 flex items-center space-x-2 shadow-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="font-semibold">AI configuration and safety settings updated successfully!</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Master AI Toggle & Provider Status */}
        <Card className="border-border bg-surface">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-google-blue" />
                <CardTitle className="text-base">Master AI Assistance Control</CardTitle>
              </div>
              <Badge
                variant={isEnabled ? "success" : "neutral"}
                className="text-[10px] uppercase font-bold"
              >
                {isEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              When disabled, all inbox reply suggestions, lead intelligence panels, and automated summaries are switched off completely.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-subtle border border-border">
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Enable AI Assistant for Workspace
                </p>
                <p className="text-[11px] text-foreground-secondary mt-0.5">
                  Allows staff agents to generate grounded replies and CRM qualification insights.
                </p>
              </div>
              <Button
                type="button"
                variant={isEnabled ? "default" : "secondary"}
                size="sm"
                className="text-xs h-8"
                onClick={() => setIsEnabled(!isEnabled)}
                disabled={!isAdmin}
              >
                {isEnabled ? "Enabled" : "Disabled"}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-surface-subtle rounded-xl border border-border/60">
                <span className="text-foreground-secondary block mb-1">Active AI Model</span>
                <span className="font-semibold text-foreground font-mono">
                  Google Gemini 1.5 Flash
                </span>
                <span className="text-[10px] text-foreground-secondary block mt-0.5">
                  Low latency (~200ms) with grounded contextual retrieval
                </span>
              </div>
              <div className="p-3 bg-surface-subtle rounded-xl border border-border/60">
                <span className="text-foreground-secondary block mb-1">Integration Mode</span>
                <span className="font-semibold text-foreground font-mono">
                  Local Sandbox / Free Tier
                </span>
                <span className="text-[10px] text-foreground-secondary block mt-0.5">
                  Zero paid API costs incurred during development
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brand Persona & Tone Configuration */}
        <Card className="border-border bg-surface">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-google-blue" />
              <CardTitle className="text-base">Brand Tone & Response Sizing</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Guide how generated replies communicate with WhatsApp customers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Preferred Communication Tone
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    { id: "friendly", label: "Friendly & Warm", desc: "Approachable, conversational" },
                    { id: "professional", label: "Professional", desc: "Formal, respectful B2B" },
                    { id: "concise", label: "Concise & Fast", desc: "Short, direct, bulleted" },
                    { id: "consultative", label: "Consultative", desc: "Advisory, solution-focused" },
                  ] as const
                ).map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`p-3 text-left rounded-xl border text-xs transition-all ${
                      tone === t.id
                        ? "border-google-blue bg-surface-blue text-foreground font-semibold shadow-xs"
                        : "border-border bg-surface hover:bg-surface-subtle text-foreground-secondary"
                    }`}
                  >
                    <span className="block font-medium text-foreground">{t.label}</span>
                    <span className="text-[10px] text-foreground-secondary">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Maximum Suggested Reply Length
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min={50}
                  max={300}
                  step={25}
                  value={maxLength}
                  onChange={(e) => setMaxLength(Number(e.target.value))}
                  className="w-full h-1.5 bg-surface-subtle rounded-lg cursor-pointer accent-google-blue"
                />
                <span className="text-xs font-mono font-bold text-foreground w-20 text-right">
                  {maxLength} words
                </span>
              </div>
              <p className="text-[11px] text-foreground-secondary mt-1">
                WhatsApp messages read best when concise and directly answering customer inquiries.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Feature Switches */}
        <Card className="border-border bg-surface">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Sliders className="h-5 w-5 text-google-blue" />
              <CardTitle className="text-base">Granular Feature Permissions</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Toggle specific AI capabilities on or off independently.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                title: "Inbox Reply Suggestions & Rewriting",
                description: "Suggest draft responses and allow tone rewrites in the WhatsApp shared inbox.",
                checked: enableReplies,
                onChange: () => setEnableReplies(!enableReplies),
              },
              {
                title: "CRM Lead Qualification & Intelligence",
                description: "Extract budget, timeline, and recommend lead priority on lead detail sheets.",
                checked: enableQual,
                onChange: () => setEnableQual(!enableQual),
              },
              {
                title: "Conversation Summaries & Intent Detection",
                description: "Generate 2-sentence conversation summaries and highlight unanswered customer questions.",
                checked: enableSummaries,
                onChange: () => setEnableSummaries(!enableSummaries),
              },
              {
                title: "Workflow Automation AI Actions",
                description: "Enable automated background actions like AI enquiry classification.",
                checked: enableWorkflows,
                onChange: () => setEnableWorkflows(!enableWorkflows),
              },
            ].map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle border border-border/60 text-xs"
              >
                <div>
                  <span className="font-semibold text-foreground">{f.title}</span>
                  <p className="text-[11px] text-foreground-secondary">{f.description}</p>
                </div>
                <Button
                  type="button"
                  variant={f.checked ? "outline" : "secondary"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={f.onChange}
                  disabled={!isEnabled || !isAdmin}
                >
                  {f.checked ? "Active" : "Off"}
                </Button>
              </div>
            ))}
          </CardContent>
          {isAdmin && (
            <CardFooter className="flex justify-end border-t border-border pt-4">
              <Button type="submit" variant="default" size="sm">
                Save AI Configuration
              </Button>
            </CardFooter>
          )}
        </Card>
      </form>

      {/* Usage Quota & Cost Tracking */}
      <Card className="border-border bg-surface">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-google-yellow" />
              <CardTitle className="text-base">Token Quota & Cost Tracking</CardTitle>
            </div>
            <Badge variant="neutral" className="text-xs font-mono">
              Monthly Budget Cap
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Live token consumption reconciled for {currentOrg.name}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-surface-subtle rounded-xl">
              <span className="text-foreground-secondary block mb-0.5">Total Generations</span>
              <span className="text-base font-bold text-foreground">{usage.totalRequests}</span>
              <span className="text-[10px] text-foreground-secondary block">This month</span>
            </div>
            <div className="p-3 bg-surface-subtle rounded-xl">
              <span className="text-foreground-secondary block mb-0.5">Tokens Consumed</span>
              <span className="text-base font-bold text-foreground font-mono">
                {usage.totalTokens.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-foreground-secondary block">
                of {settings.monthly_token_quota.toLocaleString("en-IN")} quota
              </span>
            </div>
            <div className="p-3 bg-surface-subtle rounded-xl">
              <span className="text-foreground-secondary block mb-0.5">Remaining Quota</span>
              <span className="text-base font-bold text-google-green font-mono">
                {usage.remainingQuota.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-foreground-secondary block">Tokens available</span>
            </div>
            <div className="p-3 bg-surface-subtle rounded-xl">
              <span className="text-foreground-secondary block mb-0.5">Estimated Cost</span>
              <span className="text-base font-bold text-foreground">
                ₹{usage.estimatedCostInr.toFixed(4)}
              </span>
              <span className="text-[10px] text-foreground-secondary block">
                At Gemini 1.5 Flash rates
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-[11px] text-foreground-secondary mb-1">
              <span>Monthly Token Consumption ({tokenUsagePercentage}%)</span>
              <span>
                {usage.totalTokens.toLocaleString("en-IN")} / {settings.monthly_token_quota.toLocaleString("en-IN")} tokens
              </span>
            </div>
            <div className="w-full h-2 bg-surface-subtle rounded-full overflow-hidden">
              <div
                className="h-full bg-google-blue transition-all"
                style={{ width: `${tokenUsagePercentage}%` }}
              />
            </div>
          </div>

          {/* Recent Generation Logs */}
          <div className="pt-2">
            <span className="text-xs font-semibold text-foreground block mb-2">
              Recent AI Generation Audit Trail
            </span>
            {usage.logs.length === 0 ? (
              <p className="text-xs text-foreground-secondary py-3 text-center">
                No AI requests generated in this period.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-foreground-secondary font-medium">
                      <th className="py-2 px-3">Time</th>
                      <th className="py-2 px-3">Feature</th>
                      <th className="py-2 px-3">Tokens (In / Out)</th>
                      <th className="py-2 px-3">Latency</th>
                      <th className="py-2 px-3">Est. Cost</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {usage.logs.slice(0, 5).map((log) => (
                      <tr key={log.id} className="hover:bg-surface-subtle/50">
                        <td className="py-2.5 px-3 font-mono text-foreground-secondary">
                          {new Date(log.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-foreground capitalize">
                          {log.feature.replace("_", " ")}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-foreground-secondary">
                          {log.input_tokens} / {log.output_tokens}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-foreground-secondary">
                          {log.latency_ms}ms
                        </td>
                        <td className="py-2.5 px-3 font-mono text-foreground">
                          ₹{Number(log.estimated_cost_inr).toFixed(4)}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="success" className="text-[10px]">
                            {log.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
