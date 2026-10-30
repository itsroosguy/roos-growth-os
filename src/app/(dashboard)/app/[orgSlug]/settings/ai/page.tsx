"use client";

import React, { useState } from "react";
import { useTenant } from "@/lib/organizations/tenant-context";
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
      contentClassName="max-w-[960px]"
      badge={
        <span className="rounded-full bg-[#F4F0FF] border border-[#E0D4FC] text-[12px] font-semibold px-3 py-0.5 text-[#7C4DFF] tabular-nums">
          Gemini 1.5 Flash
        </span>
      }
    >
      <div className="space-y-6">
        {saved && (
          <div className="rounded-[12px] bg-[#E4F7EF] p-4 border border-[#BDECD7] text-[13.5px] text-[#0A7A53] flex items-center space-x-2 shadow-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0A7A53]" />
            <span className="font-semibold">AI configuration and safety settings updated successfully!</span>
          </div>
        )}

        {/* Main Settings Form */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* Master AI Toggle & Provider Status */}
          <div className="border border-[#EDE8E0] bg-white rounded-[16px] card-ref p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-[#EDE8E0]">
              <div className="flex items-center space-x-2.5">
                <Bot className="h-5 w-5 text-[#7C4DFF]" />
                <h2 className="text-[18px] font-semibold text-[#12141A]">Master AI Assistance Control</h2>
              </div>
              <Badge
                variant={isEnabled ? "success" : "neutral"}
                className="text-[11px] uppercase font-semibold"
              >
                {isEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <p className="text-[13px] text-[#666C78] font-normal">
              When disabled, all inbox reply suggestions, lead intelligence panels, and automated summaries are switched off completely.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between p-4 rounded-[12px] bg-[#F7F5F0] border border-[#EDE8E0]">
                <div>
                  <p className="text-[14px] font-semibold text-[#12141A]">
                    Enable AI Assistant for Workspace
                  </p>
                  <p className="text-[13px] text-[#666C78] font-normal mt-0.5">
                    Allows staff agents to generate grounded replies and CRM qualification insights.
                  </p>
                </div>
                <Button
                  type="button"
                  variant={isEnabled ? "primary" : "secondary"}
                  size="sm"
                  className="text-[13px] h-9 px-4 font-semibold rounded-[10px] cursor-pointer"
                  onClick={() => setIsEnabled(!isEnabled)}
                  disabled={!isAdmin}
                >
                  {isEnabled ? "Enabled" : "Disabled"}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
                <div className="p-3.5 bg-[#F7F5F0] rounded-[12px] border border-[#EDE8E0]">
                  <span className="text-[#666C78] block mb-1 font-semibold text-[11px] uppercase tracking-wider">Active AI Model</span>
                  <span className="font-semibold text-[#12141A] tabular-nums text-[14px] block">
                    Google Gemini 1.5 Flash
                  </span>
                  <span className="text-[12.5px] text-[#666C78] block mt-0.5 font-normal">
                    Low latency (~200ms) with grounded contextual retrieval
                  </span>
                </div>
                <div className="p-3.5 bg-[#F7F5F0] rounded-[12px] border border-[#EDE8E0]">
                  <span className="text-[#666C78] block mb-1 font-semibold text-[11px] uppercase tracking-wider">Integration Mode</span>
                  <span className="font-semibold text-[#12141A] tabular-nums text-[14px] block">
                    Local Sandbox / Free Tier
                  </span>
                  <span className="text-[12.5px] text-[#666C78] block mt-0.5 font-normal">
                    Zero paid API costs incurred during development
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Brand Persona & Tone Configuration */}
          <div className="border border-[#EDE8E0] bg-white rounded-[16px] card-ref p-6 space-y-4">
            <div className="flex items-center space-x-2.5 pb-4 border-b border-[#EDE8E0]">
              <Sparkles className="h-5 w-5 text-[#7C4DFF]" />
              <h2 className="text-[18px] font-semibold text-[#12141A]">Brand Tone &amp; Response Sizing</h2>
            </div>
            <p className="text-[13px] text-[#666C78] font-normal">
              Guide how generated replies communicate with WhatsApp customers.
            </p>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-[13.5px] font-semibold text-[#12141A] mb-2.5">
                  Preferred Communication Tone
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                      className={`p-3.5 text-left rounded-[12px] border text-[13px] transition-all cursor-pointer ${
                        tone === t.id
                          ? "border-[#7C4DFF] bg-[#F4F0FF] text-[#12141A] font-semibold shadow-xs"
                          : "border-[#EDE8E0] bg-[#F7F5F0] hover:bg-white text-[#666C78]"
                      }`}
                    >
                      <span className="block font-semibold text-[#12141A]">{t.label}</span>
                      <span className="text-[12px] text-[#666C78] font-normal mt-0.5 block">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-[13.5px] font-semibold text-[#12141A] mb-2">
                  Maximum Suggested Reply Length
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min={50}
                    max={300}
                    step={25}
                    value={maxLength}
                    onChange={(e) => setMaxLength(Number(e.target.value))}
                    className="w-full h-2 bg-[#EDE8E0] rounded-lg cursor-pointer accent-[#7C4DFF]"
                  />
                  <span className="text-[14px] tabular-nums font-semibold text-[#12141A] w-24 text-right shrink-0">
                    {maxLength} words
                  </span>
                </div>
                <p className="text-[12.5px] text-[#666C78] mt-1.5 font-normal">
                  WhatsApp messages read best when concise and directly answering customer inquiries.
                </p>
              </div>
            </div>
          </div>

          {/* Feature Switches */}
          <div className="border border-[#EDE8E0] bg-white rounded-[16px] card-ref p-6 space-y-4">
            <div className="flex items-center space-x-2.5 pb-4 border-b border-[#EDE8E0]">
              <Sliders className="h-5 w-5 text-[#7C4DFF]" />
              <h2 className="text-[18px] font-semibold text-[#12141A]">Granular Feature Permissions</h2>
            </div>
            <p className="text-[13px] text-[#666C78] font-normal">
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
                  className="flex items-center justify-between p-4 rounded-[12px] bg-[#F7F5F0] border border-[#EDE8E0] text-[13.5px]"
                >
                  <div>
                    <span className="font-semibold text-[#12141A] block">{f.title}</span>
                    <p className="text-[12.5px] text-[#666C78] font-normal mt-0.5">{f.description}</p>
                  </div>
                  <Button
                    type="button"
                    variant={f.checked ? "outline" : "secondary"}
                    size="sm"
                    className={`h-9 px-4 text-[13px] font-semibold rounded-[10px] cursor-pointer shrink-0 ml-4 ${
                      f.checked ? "border-[#7C4DFF]/40 text-[#7C4DFF] bg-[#F4F0FF]" : "text-[#666C78]"
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
              <div className="flex justify-end border-t border-[#EDE8E0] pt-4">
                <Button type="submit" variant="primary" className="font-semibold rounded-[12px] text-[14px] h-10 px-5 shadow-xs cursor-pointer">
                  Save AI Configuration
                </Button>
              </div>
            )}
          </div>
        </form>

        {/* Usage Quota & Cost Tracking */}
        <div className="border border-[#EDE8E0] bg-white rounded-[16px] card-ref p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-[#EDE8E0]">
            <div className="flex items-center space-x-2.5">
              <Zap className="h-5 w-5 text-[#7C4DFF]" />
              <h2 className="text-[18px] font-semibold text-[#12141A]">Token Quota &amp; Cost Tracking</h2>
            </div>
            <Badge variant="neutral" className="text-[12px] tabular-nums font-semibold">
              Monthly Budget Cap
            </Badge>
          </div>
          <p className="text-[13px] text-[#666C78] font-normal">
            Live token consumption reconciled for {currentOrg.name}.
          </p>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-[13px]">
              <div className="p-4 bg-[#F7F5F0] border border-[#EDE8E0] rounded-[12px]">
                <span className="text-[#666C78] block mb-1 font-semibold text-[11px] uppercase tracking-wider">Total Generations</span>
                <span className="text-[24px] font-semibold tabular-nums text-[#12141A]">{usage.totalRequests}</span>
                <span className="text-[12px] text-[#666C78] block mt-1 font-normal">This month</span>
              </div>
              <div className="p-4 bg-[#F7F5F0] border border-[#EDE8E0] rounded-[12px]">
                <span className="text-[#666C78] block mb-1 font-semibold text-[11px] uppercase tracking-wider">Tokens Consumed</span>
                <span className="text-[24px] font-semibold text-[#12141A] tabular-nums">
                  {usage.totalTokens.toLocaleString("en-IN")}
                </span>
                <span className="text-[12px] text-[#666C78] block mt-1 font-normal">
                  of {settings.monthly_token_quota.toLocaleString("en-IN")} quota
                </span>
              </div>
              <div className="p-4 bg-[#F7F5F0] border border-[#EDE8E0] rounded-[12px]">
                <span className="text-[#666C78] block mb-1 font-semibold text-[11px] uppercase tracking-wider">Remaining Quota</span>
                <span className="text-[24px] font-semibold text-[#0A7A53] tabular-nums">
                  {usage.remainingQuota.toLocaleString("en-IN")}
                </span>
                <span className="text-[12px] text-[#666C78] block mt-1 font-normal">Tokens available</span>
              </div>
              <div className="p-4 bg-[#F7F5F0] border border-[#EDE8E0] rounded-[12px]">
                <span className="text-[#666C78] block mb-1 font-semibold text-[11px] uppercase tracking-wider">Estimated Cost</span>
                <span className="text-[24px] font-semibold tabular-nums text-[#7C4DFF]">
                  ₹{usage.estimatedCostInr.toFixed(4)}
                </span>
                <span className="text-[12px] text-[#666C78] block mt-1 font-normal">
                  At Gemini 1.5 Flash rates
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-[12.5px] text-[#666C78] font-normal mb-1.5">
                <span>Monthly Token Consumption ({tokenUsagePercentage}%)</span>
                <span className="tabular-nums font-semibold text-[#12141A]">
                  {usage.totalTokens.toLocaleString("en-IN")} / {settings.monthly_token_quota.toLocaleString("en-IN")} tokens
                </span>
              </div>
              <div className="w-full h-2 bg-[#EDE8E0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#7C4DFF] to-[#6538E8] transition-all rounded-full"
                  style={{ width: `${tokenUsagePercentage}%` }}
                />
              </div>
            </div>

            {/* Recent Generation Logs */}
            <div className="pt-2">
              <span className="text-[14px] font-semibold text-[#12141A] block mb-2.5">
                Recent AI Generation Audit Trail
              </span>
              {usage.logs.length === 0 ? (
                <p className="text-[13px] text-[#666C78] py-4 text-center font-normal">
                  No AI requests generated in this period.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-[12px] border border-[#EDE8E0]">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-[#F7F5F0]">
                      <tr className="border-b border-[#EDE8E0] text-[#666C78] font-semibold uppercase text-[11.5px] tracking-wider">
                        <th className="py-3 px-3.5">Time</th>
                        <th className="py-3 px-3.5">Feature</th>
                        <th className="py-3 px-3.5">Tokens (In / Out)</th>
                        <th className="py-3 px-3.5">Latency</th>
                        <th className="py-3 px-3.5">Est. Cost</th>
                        <th className="py-3 px-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDE8E0]">
                      {usage.logs.slice(0, 5).map((log) => (
                        <tr key={log.id} className="hover:bg-[#F7F5F0]/80 transition-colors">
                          <td className="py-3 px-3.5 tabular-nums text-[#666C78]">
                            {new Date(log.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-3 px-3.5 font-semibold text-[#12141A] capitalize">
                            {log.feature.replace("_", " ")}
                          </td>
                          <td className="py-3 px-3.5 tabular-nums text-[#666C78]">
                            {log.input_tokens} / {log.output_tokens}
                          </td>
                          <td className="py-3 px-3.5 tabular-nums text-[#666C78]">
                            {log.latency_ms}ms
                          </td>
                          <td className="py-3 px-3.5 tabular-nums font-semibold text-[#12141A]">
                            ₹{Number(log.estimated_cost_inr).toFixed(4)}
                          </td>
                          <td className="py-3 px-3.5">
                            <Badge variant="success" className="text-[11px] font-semibold">
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
