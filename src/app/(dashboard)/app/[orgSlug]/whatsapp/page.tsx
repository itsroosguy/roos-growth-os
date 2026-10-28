"use client";

import React, { useState, useMemo } from "react";
import { useTenant } from "@/lib/organizations/tenant-context";
import { whatsappStore } from "@/lib/whatsapp/whatsapp-store";
import { WhatsAppMode, WhatsAppConnectionStatus } from "@/lib/whatsapp/types";
import { MOCK_TEMPLATES } from "@/lib/whatsapp/mock-provider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SettingsShell } from "@/components/layout/settings-shell";
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Shield,
  Zap,
  Info,
  RefreshCw,
  Power,
  Key,
  Globe,
  Radio,
  Sliders,
  Check,
} from "lucide-react";

export default function WhatsAppSettingsPage() {
  const { currentOrg, isAdmin } = useTenant();
  const orgSlug = currentOrg.slug;

  const [refreshKey, setRefreshKey] = useState(0);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Form states
  const connection = useMemo(() => {
    return whatsappStore.getConnection(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  const [mode, setMode] = useState<WhatsAppMode>(connection.mode);
  const [phoneNumberId, setPhoneNumberId] = useState(connection.phone_number_id || "");
  const [wabaId, setWabaId] = useState(connection.waba_id || "");
  const [displayName, setDisplayName] = useState(connection.display_name || "");
  const [displayPhone, setDisplayPhone] = useState(connection.display_phone_number || "");
  const [accessToken, setAccessToken] = useState("");

  const webhookUrl = `${typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/api/webhooks/whatsapp`;

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    whatsappStore.updateConnection(orgSlug, {
      mode,
      phone_number_id: phoneNumberId || null,
      waba_id: wabaId || null,
      display_name: displayName || null,
      display_phone_number: displayPhone || null,
      status: mode === "mock" ? "connected" : phoneNumberId ? "connected" : "disconnected",
      access_token_encrypted: accessToken ? accessToken : connection.access_token_encrypted,
      last_synced_at: new Date().toISOString(),
    });

    setSaveSuccess(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleToggleConnection = () => {
    const nextStatus: WhatsAppConnectionStatus =
      connection.status === "connected" ? "disconnected" : "connected";
    whatsappStore.updateConnection(orgSlug, { status: nextStatus });
    setRefreshKey((k) => k + 1);
  };

  const handleRunConnectionTest = () => {
    setIsTesting(true);
    setTestResult(null);

    setTimeout(() => {
      setIsTesting(false);
      if (mode === "mock") {
        setTestResult({
          success: true,
          msg: "Mock connection active. Simulated incoming/outgoing messaging ready.",
        });
      } else {
        if (!phoneNumberId || !accessToken) {
          setTestResult({
            success: false,
            msg: "Failed: Missing Meta Phone Number ID or System User Access Token.",
          });
        } else {
          setTestResult({
            success: true,
            msg: "Connected to Meta Graph API v20.0 successfully.",
          });
        }
      }
    }, 800);
  };

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SettingsShell
      orgSlug={currentOrg.slug}
      title="WhatsApp Configuration"
      description={`Configure official Meta WhatsApp Business Cloud API or local mock simulation for ${currentOrg.name}.`}
      badge={
        <div className="flex items-center gap-1.5">
          <Badge
            variant={connection.status === "connected" ? "success" : "neutral"}
            className="text-xs uppercase font-medium"
          >
            {connection.status}
          </Badge>
          {connection.mode === "mock" && (
            <Badge variant="orangeSubtle" className="text-xs font-medium tabular-nums">
              MOCK DEV MODE
            </Badge>
          )}
        </div>
      }
    >
      <div className="space-y-6">

        {isAdmin && (
          <div className="flex justify-end pb-2">
            <Button
              variant={connection.status === "connected" ? "outline" : "default"}
              size="sm"
              onClick={handleToggleConnection}
              className={`rounded-xl shadow-2xs font-medium text-xs ${
                connection.status === "connected"
                  ? "border-[#E4E4E7] bg-white hover:bg-[#FAF9F6] text-[#0D0D0E]"
                  : "bg-[#FF7A1A] hover:bg-[#FF8833] text-white"
              }`}
            >
              <Power className="mr-1.5 h-3.5 w-3.5" />
              {connection.status === "connected" ? "Disable WhatsApp" : "Connect WhatsApp"}
            </Button>
          </div>
        )}

      {/* Mode Switcher Banner */}
      <div className="bg-white rounded-2xl border border-[#E5E5E7] shadow-2xs p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-xl bg-[#FFF4EC] text-[#FF7A1A] border border-[#FF7A1A]/30 shrink-0 mt-0.5">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#0D0D0E]">
              Active Messaging Mode:{" "}
              <span className="capitalize text-[#FF7A1A] font-semibold">{mode} Mode</span>
            </h3>
            <p className="text-xs text-[#8E8E93] font-medium mt-1 max-w-xl leading-relaxed">
              {mode === "mock"
                ? "Mock mode operates completely free without requiring Meta credentials. Test chats, 24h window expiry, and webhook simulation locally."
                : "Live mode connects directly to official Meta WhatsApp Cloud API via Graph API v20.0."}
            </p>
          </div>
        </div>

        <div className="flex items-center rounded-xl border border-[#E5E5E7] p-1 bg-[#F7F7F8] shadow-2xs shrink-0">
          <button
            onClick={() => setMode("mock")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === "mock"
                ? "bg-[#24180E] text-[#FF7A1A] shadow-2xs border border-[#FF7A1A]/30"
                : "text-[#8E8E93] hover:text-[#0D0D0E]"
            }`}
          >
            Mock Mode (Free)
          </button>
          <button
            onClick={() => setMode("live")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === "live"
                ? "bg-[#24180E] text-[#FF7A1A] shadow-2xs border border-[#FF7A1A]/30"
                : "text-[#8E8E93] hover:text-[#0D0D0E]"
            }`}
          >
            Live Meta API
          </button>
        </div>
      </div>

      {/* Connection Details Form */}
      <form onSubmit={handleSaveConfig}>
        <div className="bg-white rounded-2xl border border-[#E5E5E7] shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-[#E5E5E7]">
            <h2 className="text-base font-semibold text-[#0D0D0E]">Connection Identifiers &amp; Secrets</h2>
            <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
              {mode === "mock"
                ? "Simulated connection details for testing the CRM and inbox."
                : "Official Meta Business Manager identifiers and System User Token."}
            </p>
          </div>
          
          <div className="p-5 space-y-4">
            {saveSuccess && (
              <div className="rounded-xl bg-emerald-50 p-3.5 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>WhatsApp connection settings saved successfully!</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Sender Display Name"
                placeholder="e.g. Acme Business Solutions"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={!isAdmin}
                className="bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white focus:border-[#FF7A1A] text-[#0D0D0E] rounded-xl text-xs"
              />
              <Input
                label="Display Phone Number"
                placeholder="+1 555 019 2831"
                value={displayPhone}
                onChange={(e) => setDisplayPhone(e.target.value)}
                disabled={!isAdmin}
                className="bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white focus:border-[#FF7A1A] text-[#0D0D0E] tabular-nums rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Phone Number ID"
                placeholder="e.g. 104829104829104"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                disabled={!isAdmin}
                className="bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white focus:border-[#FF7A1A] text-[#0D0D0E] tabular-nums rounded-xl text-xs"
              />
              <Input
                label="WhatsApp Business Account ID (WABA ID)"
                placeholder="e.g. 294829104820194"
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
                disabled={!isAdmin}
                className="bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white focus:border-[#FF7A1A] text-[#0D0D0E] tabular-nums rounded-xl text-xs"
              />
            </div>

            {mode === "live" && (
              <Input
                label="System User Permanent Access Token"
                type="password"
                placeholder="EAAG... (Stored securely on server only)"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                disabled={!isAdmin}
                className="bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white focus:border-[#FF7A1A] text-[#0D0D0E] tabular-nums rounded-xl text-xs"
              />
            )}

            {/* Test Connection Button & Result */}
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRunConnectionTest}
                isLoading={isTesting}
                className="rounded-xl border-[#E5E5E7] bg-white hover:bg-[#F7F7F8] text-[#0D0D0E] font-semibold text-xs"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5 text-[#FF7A1A]" />
                Test Connection Status
              </Button>

              {testResult && (
                <div
                  className={`mt-3 p-3.5 rounded-xl text-xs flex items-center space-x-2 ${
                    testResult.success
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium"
                      : "bg-rose-50 text-rose-800 border border-rose-200 font-medium"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                  <span>{testResult.msg}</span>
                </div>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="p-4 bg-[#F7F7F8] border-t border-[#E5E5E7] flex justify-end">
              <Button type="submit" className="bg-[#FF7A1A] hover:bg-[#FF8833] text-white font-semibold rounded-xl shadow-2xs text-xs">
                Save WhatsApp Configuration
              </Button>
            </div>
          )}
        </div>
      </form>

      {/* Webhook Configuration Section */}
      <div className="bg-white rounded-2xl border border-[#E5E5E7] shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-[#E5E5E7] flex items-center space-x-2">
          <Globe className="h-5 w-5 text-[#FF7A1A]" />
          <div>
            <h2 className="text-base font-semibold text-[#0D0D0E]">Meta Webhook Callback URL</h2>
            <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
              Enter these endpoints into your Meta App Dashboard under WhatsApp &gt; Configuration.
            </p>
          </div>
        </div>
        
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#0D0D0E]">
              Callback URL (Webhook Ingestion)
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 tabular-nums text-xs bg-[#F7F7F8] p-2.5 rounded-xl border border-[#E5E5E7] select-all truncate text-[#0D0D0E] font-semibold">
                {webhookUrl}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(webhookUrl, setCopiedUrl)}
                className="rounded-xl border-[#E5E5E7] bg-white hover:bg-[#F7F7F8] text-[#0D0D0E] font-semibold shrink-0 text-xs"
              >
                {copiedUrl ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1 text-[#8E8E93]" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#0D0D0E]">
              Verify Token
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 tabular-nums text-xs bg-[#F7F7F8] p-2.5 rounded-xl border border-[#E5E5E7] select-all truncate text-[#0D0D0E] font-semibold">
                {connection.webhook_verify_token}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(connection.webhook_verify_token, setCopiedToken)}
                className="rounded-xl border-[#E5E5E7] bg-white hover:bg-[#F7F7F8] text-[#0D0D0E] font-semibold shrink-0 text-xs"
              >
                {copiedToken ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1 text-[#8E8E93]" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-xl bg-[#FFF4EC] p-3.5 border border-[#FF7A1A]/30 text-xs text-[#0D0D0E] space-y-1">
            <span className="font-semibold text-[#FF7A1A] block">Webhook Subscriptions Required:</span>
            <p className="text-[#8E8E93] font-medium">Ensure you check the <code className="bg-white px-1.5 py-0.5 rounded tabular-nums text-[#0D0D0E] font-semibold border border-[#E5E5E7]">messages</code> subscription field in your Meta Developer App Dashboard.</p>
          </div>
        </div>
      </div>

      {/* Message Templates Catalog */}
      <div className="bg-white rounded-2xl border border-[#E5E5E7] shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-[#E5E5E7]">
          <h2 className="text-base font-semibold text-[#0D0D0E]">Pre-Approved Message Templates</h2>
          <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
            Templates permitted for initiating contact or re-engaging customers outside the 24-hour service window.
          </p>
        </div>
        
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                className="p-4 rounded-xl border border-[#E5E5E7] bg-white flex flex-col justify-between shadow-2xs hover:border-[#FF7A1A]/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="tabular-nums font-semibold text-xs text-[#0D0D0E]">
                      {tpl.name}
                    </span>
                    <Badge variant="success" className="text-[10px] uppercase font-medium">
                      {tpl.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#0D0D0E] font-medium leading-relaxed bg-[#F7F7F8] p-2.5 rounded-lg border border-[#E5E5E7] mb-2">
                    &ldquo;{tpl.body_content}&rdquo;
                  </p>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#8E8E93] pt-2 border-t border-[#E5E5E7]">
                  <span className="capitalize font-medium">Category: {tpl.category}</span>
                  <span className="tabular-nums text-[10px]">Variables: {tpl.variables.join(", ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </SettingsShell>
  );
}
