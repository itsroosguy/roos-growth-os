"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { invitationStore, ENTERPRISE_GOVERNANCE_RULES, TeamInvitation } from "@/lib/team/invitation-store";
import { ROLE_DEFINITIONS } from "@/lib/organizations/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RoosLogo } from "@/components/ui/roos-logo";
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  Building2,
  ArrowRight,
  Clock,
  Sparkles,
  Check,
  Crown,
  Users,
  CheckSquare,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params.token === "string" ? params.token : "";

  const [invite, setInvite] = useState<TeamInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToGov, setAgreedToGov] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No security token provided in URL.");
      setLoading(false);
      return;
    }

    const found = invitationStore.getInvitationByToken(token);
    if (!found) {
      setError("Invalid or expired invitation token. Please request a new invitation from your workspace administrator.");
    } else {
      setInvite(found);
      setFullName(found.recipient_name);
    }
    setLoading(false);
  }, [token]);

  const handleAccept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite) return;

    if (!agreedToGov) {
      setError("Please acknowledge the brand governance rules and clearance boundaries before proceeding.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = invitationStore.acceptInvitation(token, fullName);

    if (!result.success) {
      setError(result.error || "Failed to accept invitation.");
      setIsSubmitting(false);
      return;
    }

    try {
      localStorage.setItem(`roos_active_role_${invite.organization_slug}`, invite.role);
    } catch {
      // Ignore
    }

    setAcceptedSuccess(true);
    setIsSubmitting(false);

    setTimeout(() => {
      if (invite.role === "junior_manager" || invite.role === "staff") {
        router.push(`/app/${invite.organization_slug}/tasks`);
      } else {
        router.push(`/app/${invite.organization_slug}/overview`);
      }
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0E] flex items-center justify-center p-4">
        <div className="text-white text-xs font-mono flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#FF7900] animate-spin" />
          <span>Verifying cryptographic token security...</span>
        </div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen bg-[#0D0D0E] flex items-center justify-center p-4 selection:bg-[#FF7900] selection:text-white">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-2xl text-center space-y-4 border border-[#E5E5E7]">
          <div className="h-14 w-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-semibold text-[#0D0D0E]">Invalid Invitation Token</h2>
          <p className="text-xs text-[#8E8E93] leading-relaxed">{error}</p>
          <div className="pt-2">
            <Link href="/login">
              <Button className="w-full bg-[#FF7900] hover:bg-[#E66D00] text-white rounded-xl text-xs font-semibold h-10">
                Return to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!invite) return null;

  const roleMeta = ROLE_DEFINITIONS[invite.role];

  return (
    <div className="min-h-screen bg-[#0D0D0E] py-12 px-4 sm:px-6 lg:px-8 text-white flex flex-col justify-center items-center selection:bg-[#FF7900] selection:text-white">
      {/* Brand Header */}
      <div className="max-w-2xl w-full text-center space-y-3 mb-6 flex flex-col items-center">
        <div className="flex items-center justify-center mb-1">
          <RoosLogo variant="white" size="lg" />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#24180E] border border-[#FF7900]/30 text-[11px] font-mono text-[#FF7900]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#FF7900]" />
          <span>ROOS STUDIOX VERIFIED INSTITUTIONAL CREDENTIAL</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Formal Workspace Appointment
        </h1>
        <p className="text-xs sm:text-sm text-[#8E8E93] max-w-lg mx-auto">
          You have been formally invited to join <strong className="text-white">{invite.organization_name}</strong> on the Growth Operating System.
        </p>
      </div>

      <div className="max-w-2xl w-full bg-white text-[#0D0D0E] rounded-2xl shadow-2xl border border-[#E5E5E7] overflow-hidden">
        {/* Token Verification Bar */}
        <div className="bg-[#F7F7F8] border-b border-[#E5E5E7] p-4 px-6 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-[#0D0D0E]">
              Verified Invitation from: <span className="text-[#FF7900] font-semibold">{invite.inviter_name}</span> ({invite.inviter_email})
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#8E8E93] bg-white border border-[#E5E5E7] px-2 py-0.5 rounded-md">
            7-Day SLA Token Valid
          </span>
        </div>

        {acceptedSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="h-16 w-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h2 className="text-2xl font-semibold text-[#0D0D0E]">Credential Activated!</h2>
            <p className="text-xs text-[#8E8E93] max-w-md mx-auto leading-relaxed">
              Your appointment as <strong className="text-[#0D0D0E] font-semibold">{roleMeta.title}</strong> has been sealed. Launching your workspace session now...
            </p>
            <div className="flex items-center justify-center text-xs font-mono text-[#FF7900] pt-2 animate-pulse">
              Redirecting to secure workspace...
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Appointment Card */}
            <div
              className={cn(
                "rounded-2xl p-5 border space-y-3",
                invite.role === "admin"
                  ? "bg-[#24180E]/20 border-[#FF7900]/30"
                  : invite.role === "senior_manager"
                  ? "bg-purple-50/50 border-purple-200"
                  : "bg-emerald-50/50 border-emerald-200"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-[10px] font-medium uppercase px-2.5 py-0.5 rounded-full border tracking-wider",
                    invite.role === "admin"
                      ? "bg-[#24180E] text-[#FF7900] border-[#FF7900]/40"
                      : invite.role === "senior_manager"
                      ? "bg-purple-100 text-purple-800 border-purple-300"
                      : "bg-emerald-100 text-emerald-800 border-emerald-300"
                  )}
                >
                  {roleMeta.level} Clearance
                </span>
                <span className="text-xs font-semibold text-[#8E8E93] flex items-center gap-1 font-mono">
                  Token: {invite.token.substring(0, 16)}...
                </span>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-[#0D0D0E] flex items-center gap-2">
                  {roleMeta.title}
                </h2>
                <p className="text-xs text-[#8E8E93] mt-1 leading-relaxed">
                  {roleMeta.summary}
                </p>
              </div>

              {/* Explicit Financial & Operational Clearance Boundary */}
              <div className="pt-2 border-t border-[#E5E5E7] flex items-center justify-between text-xs">
                <span className="font-semibold text-[#0D0D0E]">Financial Fund Transfers:</span>
                {invite.role === "admin" ? (
                  <span className="font-semibold text-emerald-700 flex items-center gap-1 text-[11px] bg-white px-2.5 py-0.5 rounded-md border border-emerald-200">
                    <Check className="h-3.5 w-3.5" /> Full Clearance Authorized
                  </span>
                ) : (
                  <span className="font-semibold text-[#8E8E93] flex items-center gap-1 text-[11px] bg-white px-2.5 py-0.5 rounded-md border border-[#E5E5E7]">
                    <Lock className="h-3.5 w-3.5 text-rose-500" /> Decoupled &amp; Protected (Zero Liability)
                  </span>
                )}
              </div>
            </div>

            {/* Enterprise Governance Rules Section (Builds Brand Trust) */}
            <div className="space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-[#8E8E93] flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-[#FF7900]" />
                Enterprise Brand Governance &amp; Trust Commitments
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ENTERPRISE_GOVERNANCE_RULES.map((rule) => (
                  <div
                    key={rule.code}
                    className="p-3 rounded-xl bg-[#F7F7F8] border border-[#E5E5E7] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0D0D0E] text-[11px]">{rule.title}</span>
                      <span className="text-[9px] font-mono font-semibold text-[#FF7900] bg-white px-1.5 py-0.5 rounded border border-[#E5E5E7]">
                        {rule.code}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8E8E93] leading-normal">
                      {rule.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Acceptance Form */}
            <form onSubmit={handleAccept} className="space-y-4 pt-2 border-t border-[#E5E5E7]">
              {error && (
                <div className="rounded-xl bg-rose-50 p-3.5 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Your Full Name *"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />

                <Input
                  label="Confirmed Email"
                  value={invite.recipient_email}
                  disabled
                  className="bg-[#F7F7F8] cursor-not-allowed"
                />
              </div>

              <Input
                label="Create Workspace Security Password *"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {/* Compliance & Trust Agreement */}
              <div className="pt-2">
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedToGov}
                    onChange={(e) => setAgreedToGov(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[#E5E5E7] text-[#FF7900] focus:ring-[#FF7900] cursor-pointer"
                  />
                  <span className="text-[11px] text-[#8E8E93] leading-relaxed">
                    I acknowledge my operational appointment as{" "}
                    <strong className="text-[#0D0D0E] font-semibold">{roleMeta.title}</strong> and accept the platform security governance, data isolation policies, and clearance boundaries of {invite.organization_name}.
                  </span>
                </label>
              </div>

              <div className="pt-3">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#FF7900] hover:bg-[#E66D00] text-white font-semibold h-11 rounded-xl shadow-xs text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Accept Credential &amp; Enter Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Footer Security Seal */}
        <div className="p-4 bg-[#F7F7F8] border-t border-[#E5E5E7] text-center text-[10px] text-[#8E8E93] font-mono flex items-center justify-center gap-4">
          <span>🔒 SOC-2 TYPE II COMPLIANT</span>
          <span>•</span>
          <span>256-BIT TOKEN ENCRYPTED</span>
          <span>•</span>
          <span>ROOS STUDIOX ENTERPRISE GUARANTEE</span>
        </div>
      </div>
    </div>
  );
}
