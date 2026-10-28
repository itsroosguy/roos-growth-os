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
import { SettingsShell } from "@/components/layout/settings-shell";
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
    <SettingsShell
      orgSlug={currentOrg.slug}
      title="AI Assistant &amp; Copilot"
      description="Configure model persona, response tone, and token consumption limits."
      badge={<span className="rounded-full bg-[#FFF4EC] border border-[#FF7A1A]/30 text-xs font-medium px-2.5 py-0.5 text-[#FF7A1A] tabular-nums">Gemini 1.5 Flash</span>}
    >
      <div className="space-y-6">

      {saved && (
        <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2 shadow-2xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="font-semibold">AI configuration and safety settings updated successfully!</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Master AI Toggle & Provider Status */}
        <div className="border border-[#E5E5E7] bg-white rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7]">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-[#FF7A1A]" />
              <h2 className="text-base font-semibold text-[#0D0D0E]">Master AI Assistance Control</h2>
            </div>
            <Badge
              variant={isEnabled ? "success" : "neutral"}
              className="text-[10px] uppercase font-medium"
            >
              {isEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <p className="text-xs text-[#8E8E93] font-medium">
            When disabled, all inbox reply suggestions, lead intelligence panels, and automated summaries are switched off completely.
          </p>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#F7F7F8] border border-[#E5E5E7]">
              <div>
                <p className="text-xs font-semibold text-[#0D0D0E]">
                  Enable AI Assistant for Workspace
                </p>
                <p className="text-[11px] text-[#8E8E93] font-medium mt-0.5">
                  Allows staff agents to generate grounded replies and CRM qualification insights.
                </p>
              </div>
              <Button
                type="button"
                variant={isEnabled ? "default" : "secondary"}
                size="sm"
                className={`text-xs h-8 font-semibold rounded-xl cursor-pointer ${
                  isEnabled ? "bg-[#FF7A1A] hover:bg-[#FF8833] text-white" : "bg-[#E5E5E7] text-[#0D0D0E]"
                }`}
                onClick={() => setIsEnabled(!isEnabled)}
                disabled={!isAdmin}
              >
                {isEnabled ? "Enabled" : "Disabled"}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-[#F7F7F8] rounded-xl border border-[#E5E5E7]">
                <span className="text-[#8E8E93] block mb-1 font-medium text-[11px] uppercase tracking-wider">Active AI Model</span>
                <span className="font-semibold text-[#0D0D0E] tabular-nums text-sm">
                  Google Gemini 1.5 Flash
                </span>
                <span className="text-[10px] text-[#8E8E93] block mt-0.5 font-medium">
                  Low latency (~200ms) with grounded contextual retrieval
                </span>
              </div>
              <div className="p-3 bg-[#F7F7F8] rounded-xl border border-[#E5E5E7]">
                <span className="text-[#8E8E93] block mb-1 font-medium text-[11px] uppercase tracking-wider">Integration Mode</span>
                <span className="font-semibold text-[#0D0D0E] tabular-nums text-sm">
                  Local Sandbox / Free Tier
                </span>
                <span className="text-[10px] text-[#8E8E93] block mt-0.5 font-medium">
                  Zero paid API costs incurred during development
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Persona & Tone Configuration */}
        <div className="border border-[#E5E5E7] bg-white rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#E5E5E7]">
            <Sparkles className="h-5 w-5 text-[#FF7A1A]" />
            <h2 className="text-base font-semibold text-[#0D0D0E]">Brand Tone &amp; Response Sizing</h2>
          </div>
          <p className="text-xs text-[#8E8E93] font-medium">
            Guide how generated replies communicate with WhatsApp customers.
          </p>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-[#0D0D0E] mb-2">
                Preferred Communication Tone
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                    className={`p-3 text-left rounded-xl border text-xs transition-all cursor-pointer ${
                      tone === t.id
                        ? "border-[#FF7A1A] bg-[#FFF4EC] text-[#0D0D0E] font-semibold shadow-2xs"
                        : "border-[#E5E5E7] bg-[#F7F7F8] hover:bg-white text-[#8E8E93]"
                    }`}
                  >
                    <span className="block font-semibold text-[#0D0D0E]">{t.label}</span>
                    <span className="text-[10px] text-[#8E8E93] font-medium">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-medium text-[#0D0D0E] mb-1.5">
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
                  className="w-full h-1.5 bg-[#E5E5E7] rounded-lg cursor-pointer accent-[#FF7A1A]"
                />
                <span className="text-xs tabular-nums font-semibold text-[#0D0D0E] w-20 text-right">
                  {maxLength} words
                </span>
              </div>
              <p className="text-[11px] text-[#8E8E93] mt-1 font-medium">
                WhatsApp messages read best when concise and directly answering customer inquiries.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Switches */}
        <div className="border border-[#E5E5E7] bg-white rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#E5E5E7]">
            <Sliders className="h-5 w-5 text-[#FF7A1A]" />
            <h2 className="text-base font-semibold text-[#0D0D0E]">Granular Feature Permissions</h2>
          </div>
          <p className="text-xs text-[#8E8E93] font-medium">
            Toggle specific AI capabilities on or off independently.
          </p>

          <div className="space-y-3 pt-2">
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
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#F7F7F8] border border-[#E5E5E7] text-xs"
              >
                <div>
                  <span className="font-semibold text-[#0D0D0E]">{f.title}</span>
                  <p className="text-[11px] text-[#8E8E93] font-medium mt-0.5">{f.description}</p>
                </div>
                <Button
                  type="button"
                  variant={f.checked ? "outline" : "secondary"}
                  size="sm"
                  className={`h-7 text-xs font-semibold rounded-lg cursor-pointer ${
                    f.checked ? "border-[#FF7A1A]/40 text-[#FF7A1A] bg-[#FFF4EC]" : "text-[#8E8E93]"
                  }`}
                  onClick={f.onChange}
                  disabled={!isEnabled || !isAdmin}
                >
                  {f.checked ? "Active" : "Off"}
                </Button>
              </div>
            ))}
          </div>

          {isAdmin && (
            <div className="flex justify-end border-t border-[#E5E5E7] pt-4">
              <Button type="submit" className="bg-[#FF7A1A] hover:bg-[#FF8833] text-white font-semibold rounded-xl text-xs shadow-2xs">
                Save AI Configuration
              </Button>
            </div>
          )}
        </div>
      </form>

      {/* Usage Quota & Cost Tracking */}
      <div className="border border-[#E5E5E7] bg-white rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7]">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-[#FF7A1A]" />
            <h2 className="text-base font-semibold text-[#0D0D0E]">Token Quota &amp; Cost Tracking</h2>
          </div>
          <Badge variant="neutral" className="text-xs tabular-nums font-medium">
            Monthly Budget Cap
          </Badge>
        </div>
        <p className="text-xs text-[#8E8E93] font-medium">
          Live token consumption reconciled for {currentOrg.name}.
        </p>

        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 bg-[#F7F7F8] border border-[#E5E5E7] rounded-xl">
              <span className="text-[#8E8E93] block mb-0.5 font-medium text-[11px] uppercase tracking-wider">Total Generations</span>
              <span className="text-xl font-semibold tabular-nums text-[#0D0D0E]">{usage.totalRequests}</span>
              <span className="text-[10px] text-[#8E8E93] block mt-0.5 font-medium">This month</span>
            </div>
            <div className="p-3.5 bg-[#F7F7F8] border border-[#E5E5E7] rounded-xl">
              <span className="text-[#8E8E93] block mb-0.5 font-medium text-[11px] uppercase tracking-wider">Tokens Consumed</span>
              <span className="text-xl font-semibold text-[#0D0D0E] tabular-nums">
                {usage.totalTokens.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-[#8E8E93] block mt-0.5 font-medium">
                of {settings.monthly_token_quota.toLocaleString("en-IN")} quota
              </span>
            </div>
            <div className="p-3.5 bg-[#F7F7F8] border border-[#E5E5E7] rounded-xl">
              <span className="text-[#8E8E93] block mb-0.5 font-medium text-[11px] uppercase tracking-wider">Remaining Quota</span>
              <span className="text-xl font-semibold text-emerald-600 tabular-nums">
                {usage.remainingQuota.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-[#8E8E93] block mt-0.5 font-medium">Tokens available</span>
            </div>
            <div className="p-3.5 bg-[#F7F7F8] border border-[#E5E5E7] rounded-xl">
              <span className="text-[#8E8E93] block mb-0.5 font-medium text-[11px] uppercase tracking-wider">Estimated Cost</span>
              <span className="text-xl font-semibold tabular-nums text-[#FF7A1A]">
                ₹{usage.estimatedCostInr.toFixed(4)}
              </span>
              <span className="text-[10px] text-[#8E8E93] block mt-0.5 font-medium">
                At Gemini 1.5 Flash rates
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-[11px] text-[#8E8E93] font-medium mb-1">
              <span>Monthly Token Consumption ({tokenUsagePercentage}%)</span>
              <span>
                {usage.totalTokens.toLocaleString("en-IN")} / {settings.monthly_token_quota.toLocaleString("en-IN")} tokens
              </span>
            </div>
            <div className="w-full h-2 bg-[#E5E5E7] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF7A1A] transition-all rounded-full"
                style={{ width: `${tokenUsagePercentage}%` }}
              />
            </div>
          </div>

          {/* Recent Generation Logs */}
          <div className="pt-2">
            <span className="text-xs font-semibold text-[#0D0D0E] block mb-2">
              Recent AI Generation Audit Trail
            </span>
            {usage.logs.length === 0 ? (
              <p className="text-xs text-[#8E8E93] py-4 text-center font-medium">
                No AI requests generated in this period.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#E5E5E7]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F7F8]">
                    <tr className="border-b border-[#E5E5E7] text-[#8E8E93] font-medium uppercase text-[11px] tracking-wider">
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3">Feature</th>
                      <th className="py-2.5 px-3">Tokens (In / Out)</th>
                      <th className="py-2.5 px-3">Latency</th>
                      <th className="py-2.5 px-3">Est. Cost</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E7]">
                    {usage.logs.slice(0, 5).map((log) => (
                      <tr key={log.id} className="hover:bg-[#F7F7F8]/80 transition-colors">
                        <td className="py-2.5 px-3 tabular-nums text-[#8E8E93]">
                          {new Date(log.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#0D0D0E] capitalize">
                          {log.feature.replace("_", " ")}
                        </td>
                        <td className="py-2.5 px-3 tabular-nums text-[#8E8E93]">
                          {log.input_tokens} / {log.output_tokens}
                        </td>
                        <td className="py-2.5 px-3 tabular-nums text-[#8E8E93]">
                          {log.latency_ms}ms
                        </td>
                        <td className="py-2.5 px-3 tabular-nums font-semibold text-[#0D0D0E]">
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
        </div>
      </div>
      </div>
    </SettingsShell>
  );
}
