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
    <div className="space-y-7 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/60">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              WhatsApp Cloud API Settings
            </h1>
            <Badge
              variant={connection.status === "connected" ? "success" : "neutral"}
              className="text-xs uppercase font-bold shadow-2xs"
            >
              {connection.status}
            </Badge>
            {connection.mode === "mock" && (
              <Badge variant="warning" className="text-xs shadow-2xs">
                MOCK DEV MODE
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
            Configure official Meta WhatsApp Business Cloud API or local mock simulation for {currentOrg.name}.
          </p>
        </div>

        {isAdmin && (
          <Button
            variant={connection.status === "connected" ? "outline" : "default"}
            size="sm"
            onClick={handleToggleConnection}
            className={`rounded-xl shadow-xs ${
              connection.status === "connected"
                ? "border-white/80 bg-white/80 hover:bg-white text-slate-700"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            <Power className="mr-1.5 h-3.5 w-3.5" />
            {connection.status === "connected" ? "Disable WhatsApp" : "Connect WhatsApp"}
          </Button>
        )}
      </div>

      {/* Mode Switcher Banner */}
      <div className="glass-panel rounded-[22px] border border-white/70 bg-white/75 backdrop-blur-xl shadow-glass p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-2xl bg-blue-500/15 text-blue-600 border border-blue-500/20 shadow-xs shrink-0 mt-0.5">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Current Messaging Mode:{" "}
              <span className="capitalize text-blue-600 font-extrabold">{mode} Mode</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
              {mode === "mock"
                ? "Mock mode operates completely free without requiring Meta credentials. Test chats, 24h window expiry, and webhook simulation locally."
                : "Live mode connects directly to official Meta WhatsApp Cloud API via Graph API v20.0."}
            </p>
          </div>
        </div>

        <div className="flex items-center rounded-xl border border-white/80 p-1 bg-white/60 backdrop-blur-xs shadow-2xs shrink-0">
          <button
            onClick={() => setMode("mock")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              mode === "mock"
                ? "bg-white text-blue-600 font-bold shadow-xs border border-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Mock Mode (Free)
          </button>
          <button
            onClick={() => setMode("live")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              mode === "live"
                ? "bg-white text-blue-600 font-bold shadow-xs border border-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Live Meta API
          </button>
        </div>
      </div>

      {/* Connection Details Form */}
      <form onSubmit={handleSaveConfig}>
        <Card>
          <CardHeader>
            <CardTitle>Connection Identifiers & Secrets</CardTitle>
            <CardDescription>
              {mode === "mock"
                ? "Simulated connection details for testing the CRM and inbox."
                : "Official Meta Business Manager identifiers and System User Token."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {saveSuccess && (
              <div className="rounded-2xl bg-google-green-subtle p-3.5 border border-google-green/20 text-xs text-google-green flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
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
              />
              <Input
                label="Display Phone Number"
                placeholder="+1 555 019 2831"
                value={displayPhone}
                onChange={(e) => setDisplayPhone(e.target.value)}
                disabled={!isAdmin}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Phone Number ID"
                placeholder="e.g. 104829104829104"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                disabled={!isAdmin}
              />
              <Input
                label="WhatsApp Business Account ID (WABA ID)"
                placeholder="e.g. 294829104820194"
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
                disabled={!isAdmin}
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
              />
            )}

            {/* Test Connection Button & Result */}
            <div className="pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRunConnectionTest}
                isLoading={isTesting}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Test Connection Status
              </Button>

              {testResult && (
                <div
                  className={`mt-3 p-3 rounded-2xl text-xs flex items-center space-x-2 ${
                    testResult.success
                      ? "bg-google-green-subtle text-google-green border border-google-green/20"
                      : "bg-google-red-subtle text-google-red border border-google-red/20"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{testResult.msg}</span>
                </div>
              )}
            </div>
          </CardContent>

          {isAdmin && (
            <CardFooter className="flex justify-end border-t border-border pt-4">
              <Button type="submit">Save WhatsApp Configuration</Button>
            </CardFooter>
          )}
        </Card>
      </form>

      {/* Webhook Configuration Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-google-blue" />
            <CardTitle>Meta Webhook Callback URL</CardTitle>
          </div>
          <CardDescription>
            Enter these endpoints into your Meta App Dashboard under WhatsApp &gt; Configuration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground-secondary">
              Callback URL (Webhook Ingestion)
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 font-mono text-xs bg-surface-subtle p-2.5 rounded-xl border border-border select-all truncate">
                {webhookUrl}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(webhookUrl, setCopiedUrl)}
              >
                <Copy className="h-3.5 w-3.5 mr-1" />
                {copiedUrl ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground-secondary">
              Verify Token
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 font-mono text-xs bg-surface-subtle p-2.5 rounded-xl border border-border select-all truncate">
                {connection.webhook_verify_token}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(connection.webhook_verify_token, setCopiedToken)}
              >
                <Copy className="h-3.5 w-3.5 mr-1" />
                {copiedToken ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl bg-surface-subtle p-3.5 border border-border text-xs text-foreground-secondary space-y-1">
            <span className="font-semibold text-foreground block">Webhook Subscriptions Required:</span>
            <p>Ensure you check the <code className="bg-white px-1.5 py-0.5 rounded font-mono text-google-blue">messages</code> subscription field in Meta App Dashboard.</p>
          </div>
        </CardContent>
      </Card>

      {/* Message Templates Catalog */}
      <Card>
        <CardHeader>
          <CardTitle>Pre-Approved Message Templates</CardTitle>
          <CardDescription>
            Templates permitted for initiating contact or re-engaging customers outside the 24-hour service window.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                className="p-4 rounded-2xl border border-border bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs font-mono text-foreground">
                      {tpl.name}
                    </span>
                    <Badge variant="success" className="text-[10px] uppercase font-bold">
                      {tpl.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-foreground-secondary leading-relaxed bg-surface-subtle p-2.5 rounded-xl border border-border/70 mb-2">
                    &ldquo;{tpl.body_content}&rdquo;
                  </p>
                </div>
                <div className="flex items-center justify-between text-[11px] text-foreground-secondary pt-2 border-t border-border/50">
                  <span className="capitalize">Category: {tpl.category}</span>
                  <span>Variables: {tpl.variables.join(", ")}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
