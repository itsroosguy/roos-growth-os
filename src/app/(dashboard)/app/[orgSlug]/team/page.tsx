"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTenant } from "@/lib/organizations/tenant-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Shield,
  UserPlus,
  Mail,
  CheckCircle2,
  AlertCircle,
  Users,
  Crown,
  ShieldAlert,
  KeyRound,
  Copy,
  Check,
  Lock,
  Unlock,
  CreditCard,
  CheckSquare,
  BarChart3,
  Sparkles,
  Zap,
  ArrowRight,
  RefreshCw,
  Send,
  Eye,
  ExternalLink,
  ShieldCheck,
  Landmark,
} from "lucide-react";
import { OrganizationRole, AccessCredential } from "@/lib/organizations/types";
import { credentialsStore } from "@/lib/credentials/credentials-store";
import {
  invitationStore,
  ENTERPRISE_GOVERNANCE_RULES,
  TeamInvitation,
} from "@/lib/team/invitation-store";
import { ROLE_DEFINITIONS } from "@/lib/organizations/permissions";
import { cn } from "@/lib/utils";

interface MemberItem {
  id: string;
  name: string;
  email: string;
  role: OrganizationRole;
  status: "active" | "invited";
  joinedAt: string;
}

export default function TeamAndCredentialsPage() {
  const { currentOrg, userRole, setUserRole, isAdmin } = useTenant();

  // Active Tab: "credentials" | "roster" | "invitations" | "matrix"
  const [activeTab, setActiveTab] = useState<"credentials" | "roster" | "invitations" | "matrix">("invitations");

  // Credential State
  const [credentials, setCredentials] = useState<AccessCredential[]>(() =>
    credentialsStore.getCredentials(currentOrg.slug)
  );
  const [newCredModalOpen, setNewCredModalOpen] = useState(false);
  const [credName, setCredName] = useState("");
  const [credEmail, setCredEmail] = useState("");
  const [credRole, setCredRole] = useState<OrganizationRole>("senior_manager");
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Invitations State
  const [invitations, setInvitations] = useState<TeamInvitation[]>(() =>
    invitationStore.getInvitations(currentOrg.slug)
  );
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrganizationRole>("senior_manager");
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Email Preview Modal State
  const [emailPreviewModalOpen, setEmailPreviewModalOpen] = useState(false);
  const [previewInvite, setPreviewInvite] = useState<TeamInvitation | null>(null);
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);

  // Active Team Roster
  const [members, setMembers] = useState<MemberItem[]>([
    {
      id: "mem-1",
      name: "Workspace Founder",
      email: "founder@acmetech.io",
      role: "owner",
      status: "active",
      joinedAt: "Jan 10, 2026",
    },
    {
      id: "mem-2",
      name: "Platform Administrator",
      email: "admin@acmetech.io",
      role: "admin",
      status: "active",
      joinedAt: "Jan 12, 2026",
    },
    {
      id: "mem-3",
      name: "Senior Operations Lead",
      email: "operations.lead@acmetech.io",
      role: "senior_manager",
      status: "active",
      joinedAt: "Jan 15, 2026",
    },
    {
      id: "mem-4",
      name: "Junior Operations Manager",
      email: "jr.manager@acmetech.io",
      role: "junior_manager",
      status: "active",
      joinedAt: "Feb 01, 2026",
    },
    {
      id: "mem-5",
      name: "Support Specialist",
      email: "support@acmetech.io",
      role: "staff",
      status: "active",
      joinedAt: "Feb 15, 2026",
    },
  ]);

  const handleCopy = (keyId: string) => {
    navigator.clipboard?.writeText(keyId);
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleCopyLink = (token: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const fullUrl = `${origin}/invite/${token}`;
    navigator.clipboard?.writeText(fullUrl);
    setCopiedInviteLink(true);
    setTimeout(() => setCopiedInviteLink(false), 2000);
  };

  const handleCreateCredential = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!credName || !credEmail) return;

    credentialsStore.createCredential(currentOrg.slug, {
      name: credName,
      email: credEmail,
      role: credRole,
    });

    setCredentials(credentialsStore.getCredentials(currentOrg.slug));
    setCredName("");
    setCredEmail("");
    setNewCredModalOpen(false);
  };

  /**
   * Only Admin (Level 1) or Owner can create & dispatch invitations
   */
  const handleDispatchInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);

    if (!isAdmin) {
      setInviteError("Unauthorized: Only Level 1 Administrators hold the authority to dispatch multi-level account invitations.");
      return;
    }

    if (!inviteName.trim() || !inviteEmail.trim()) {
      setInviteError("Please provide both respondent name and email address.");
      return;
    }

    const res = invitationStore.createInvitation(currentOrg.slug, {
      inviterName: "Platform Administrator",
      inviterEmail: "admin@acmetech.io",
      inviterRole: userRole,
      recipientName: inviteName.trim(),
      recipientEmail: inviteEmail.trim(),
      role: inviteRole,
      organizationName: currentOrg.name,
    });

    if (!res.success || !res.invitation) {
      setInviteError(res.error || "Failed to dispatch invitation.");
      return;
    }

    // Refresh list
    const updated = invitationStore.getInvitations(currentOrg.slug);
    setInvitations(updated);

    // Close form, launch branded email preview modal
    setInviteModalOpen(false);
    setPreviewInvite(res.invitation);
    setEmailPreviewModalOpen(true);

    // Reset inputs
    setInviteName("");
    setInviteEmail("");
  };

  const handleUpdateRole = (memberId: string, newRole: OrganizationRole) => {
    if (!isAdmin) return;
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
  };

  const pendingCount = invitations.filter((i) => i.status === "pending").length;

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E5E7]">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0D0D0E]">
              Access Credentials &amp; Team Governance
            </h1>
            <span className="rounded-full bg-[#FFF4EC] border border-[#FF7900]/30 text-xs font-semibold px-3 py-1 text-[#FF7900] font-mono">
              Admin Dispatched
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8E8E93] font-medium mt-1">
            Only Level 1 Administrators can issue multi-level appointments, dispatched via cryptographic email with verified acceptance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin ? (
            <>
              <Button
                onClick={() => setInviteModalOpen(true)}
                className="rounded-xl bg-[#FF7900] hover:bg-[#E66D00] text-white font-semibold shadow-2xs text-xs h-9 px-3.5 cursor-pointer flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Dispatch Multi-Level Account</span>
              </Button>
              <Button
                onClick={() => setNewCredModalOpen(true)}
                variant="outline"
                className="rounded-xl border-[#E5E5E7] bg-white text-[#0D0D0E] font-semibold text-xs h-9 px-3 hover:bg-[#F7F7F8] cursor-pointer"
              >
                <KeyRound className="mr-1 h-3.5 w-3.5 text-[#8E8E93]" />
                API Token
              </Button>
            </>
          ) : (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-800 font-semibold flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-amber-600" />
              <span>Admin Authority Required to Dispatch Accounts</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-[#E5E5E7] gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("invitations")}
          className={cn(
            "pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2",
            activeTab === "invitations"
              ? "border-[#FF7900] text-[#FF7900] font-semibold"
              : "border-transparent text-[#8E8E93] hover:text-[#0D0D0E]"
          )}
        >
          <Mail className="h-4 w-4" />
          <span>Email Dispatches &amp; Tokens ({pendingCount} pending)</span>
        </button>
        <button
          onClick={() => setActiveTab("roster")}
          className={cn(
            "pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2",
            activeTab === "roster"
              ? "border-[#FF7900] text-[#FF7900] font-semibold"
              : "border-transparent text-[#8E8E93] hover:text-[#0D0D0E]"
          )}
        >
          <Users className="h-4 w-4" />
          <span>Active Team Roster ({members.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("credentials")}
          className={cn(
            "pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2",
            activeTab === "credentials"
              ? "border-[#FF7900] text-[#FF7900] font-semibold"
              : "border-transparent text-[#8E8E93] hover:text-[#0D0D0E]"
          )}
        >
          <KeyRound className="h-4 w-4" />
          <span>API Tokens ({credentials.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("matrix")}
          className={cn(
            "pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2",
            activeTab === "matrix"
              ? "border-[#FF7900] text-[#FF7900] font-semibold"
              : "border-transparent text-[#8E8E93] hover:text-[#0D0D0E]"
          )}
        >
          <Shield className="h-4 w-4" />
          <span>Brand Governance Rules</span>
        </button>
      </div>

      {/* Trust & Decoupled Liability Highlights Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Level 1: Admin */}
        <div className="bg-[#121214] text-white rounded-2xl border border-[#1F1F23] p-5 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#FF7900] bg-[#24180E] border border-[#FF7900]/30 px-2.5 py-0.5 rounded-full font-mono">
              Level 1: Admin
            </span>
            <Crown className="h-4 w-4 text-[#FF7900]" />
          </div>
          <h3 className="text-sm font-semibold text-white">Full Root &amp; Fund Authority</h3>
          <p className="text-xs text-[#8E8E93] leading-relaxed font-medium">
            Exclusive authority to issue multi-level credentials, execute overall fund transfers, manage bank settlements, and configure webhooks.
          </p>
          <div className="pt-2 flex items-center justify-between border-t border-white/10 text-[11px] font-medium">
            <span className="text-emerald-400 flex items-center gap-1">
              <Unlock className="h-3.5 w-3.5" /> Full Funds: Authorized
            </span>
            <button
              onClick={() => setUserRole("admin")}
              className="text-[#FF7900] hover:underline cursor-pointer"
            >
              Simulate Role →
            </button>
          </div>
        </div>

        {/* Level 2: Senior Manager */}
        <div className="bg-white rounded-2xl border border-[#E5E5E7] p-5 shadow-2xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full font-mono">
              Level 2: Senior Manager
            </span>
            <Shield className="h-4 w-4 text-purple-600" />
          </div>
          <h3 className="text-sm font-semibold text-[#0D0D0E]">Operational Management</h3>
          <p className="text-xs text-[#8E8E93] leading-relaxed font-medium">
            Full operational access (CRM, shared inbox, automations, campaigns). <strong>Strictly Decoupled &amp; Protected: Zero fund transfer liability.</strong>
          </p>
          <div className="pt-2 flex items-center justify-between border-t border-[#E5E5E7] text-[11px] font-medium">
            <span className="text-rose-600 flex items-center gap-1">
              <Lock className="h-3.5 w-3.5" /> Funds: Blocked (Safe)
            </span>
            <button
              onClick={() => setUserRole("senior_manager")}
              className="text-[#FF7900] hover:underline cursor-pointer"
            >
              Simulate Role →
            </button>
          </div>
        </div>

        {/* Level 3: Junior Manager */}
        <div className="bg-white rounded-2xl border border-[#E5E5E7] p-5 shadow-2xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-mono">
              Level 3: Jr Manager
            </span>
            <CheckSquare className="h-4 w-4 text-emerald-600" />
          </div>
          <h3 className="text-sm font-semibold text-[#0D0D0E]">Tasks &amp; Performance KPIs</h3>
          <p className="text-xs text-[#8E8E93] leading-relaxed font-medium">
            Focused exclusively on task completion, client follow-up reminders, SLA response metrics, and assigned WhatsApp chats.
          </p>
          <div className="pt-2 flex items-center justify-between border-t border-[#E5E5E7] text-[11px] font-medium">
            <span className="text-emerald-700 flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5" /> Task KPIs: Active
            </span>
            <button
              onClick={() => setUserRole("junior_manager")}
              className="text-[#FF7900] hover:underline cursor-pointer"
            >
              Simulate Role →
            </button>
          </div>
        </div>
      </div>
      {/* TAB 1: EMAIL DISPATCHES & INVITATIONS */}
      {activeTab === "invitations" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[#0D0D0E]">
                Dispatched Multi-Level Account Invitations
              </h2>
              <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
                Every appointment generates an enterprise verification token delivered via email and activated upon respondent acceptance.
              </p>
            </div>
            {isAdmin && (
              <Button
                onClick={() => setInviteModalOpen(true)}
                className="bg-[#FF7900] hover:bg-[#E66D00] text-white font-semibold text-xs h-8.5 rounded-xl self-start sm:self-auto cursor-pointer"
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                New Appointment Dispatch
              </Button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E5E7] shadow-2xs overflow-hidden">
            <Table>
              <TableHeader className="bg-[#F7F7F8] border-b border-[#E5E5E7]">
                <TableRow>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-[#8E8E93] py-3.5">Recipient</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-[#8E8E93] py-3.5">Assigned Level</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-[#8E8E93] py-3.5">Fund Liability</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-[#8E8E93] py-3.5">Status</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wider text-[#8E8E93] py-3.5">SLA Expiry</TableHead>
                  <TableHead className="text-right text-[11px] font-medium uppercase tracking-wider text-[#8E8E93] py-3.5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => {
                  const roleMeta = ROLE_DEFINITIONS[inv.role];
                  return (
                    <TableRow key={inv.id} className="hover:bg-[#F7F7F8]/80 transition-colors border-b border-[#E5E5E7]">
                      <TableCell>
                        <div className="flex items-center space-x-3 py-1">
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white font-semibold text-xs",
                              inv.role === "admin"
                                ? "bg-[#121214] text-[#FF7900] border border-[#FF7900]/30"
                                : inv.role === "senior_manager"
                                ? "bg-purple-600"
                                : "bg-emerald-600"
                            )}
                          >
                            {inv.recipient_name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-sm text-[#0D0D0E] block">
                              {inv.recipient_name}
                            </span>
                            <span className="text-xs text-[#8E8E93] font-mono">
                              {inv.recipient_email}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span
                          className={cn(
                            "text-[10px] font-medium uppercase px-2 py-0.5 rounded-full border",
                            inv.role === "admin"
                              ? "bg-[#FFF4EC] text-[#FF7900] border-[#FF7900]/30 font-semibold"
                              : inv.role === "senior_manager"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          )}
                        >
                          {roleMeta.title}
                        </span>
                      </TableCell>

                      <TableCell>
                        {inv.role === "admin" ? (
                          <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" /> Full Funds
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-[#8E8E93] flex items-center gap-1">
                            <Lock className="h-3.5 w-3.5 text-rose-500" /> Decoupled
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <span
                          className={cn(
                            "text-[10px] font-medium capitalize px-2 py-0.5 rounded-full border",
                            inv.status === "pending"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : inv.status === "accepted"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          )}
                        >
                          {inv.status === "pending" ? "Awaiting Acceptance" : inv.status}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs text-[#8E8E93] font-medium">
                        {new Date(inv.expires_at).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setPreviewInvite(inv);
                              setEmailPreviewModalOpen(true);
                            }}
                            className="h-7 text-xs text-[#0D0D0E] hover:text-[#FF7900] hover:bg-[#FFF4EC] font-semibold px-2 rounded-xl cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1 text-[#8E8E93]" />
                            Email Preview
                          </Button>
                          <Link
                            href={`/invite/${inv.token}`}
                            target="_blank"
                            className="inline-flex items-center text-xs font-semibold text-[#0D0D0E] hover:text-[#FF7900] bg-[#F7F7F8] hover:bg-[#FFF4EC] px-2.5 py-1 rounded-xl transition-colors border border-[#E5E5E7]"
                          >
                            <span>Accept</span>
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE TEAM ROSTER */}
      {activeTab === "roster" && (
        <div className="bg-white rounded-2xl border border-[#E5E5E7] shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-[#E5E5E7] flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#0D0D0E]">Active Workspace Members</h2>
              <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
                Staff holding activated credentials in {currentOrg.name}
              </p>
            </div>
            <span className="rounded-full bg-[#F7F7F8] border border-[#E5E5E7] text-xs font-semibold px-3 py-1 text-[#0D0D0E]">
              <span className="font-mono font-semibold text-[#FF7900] mr-1">{members.length}</span>
              members
            </span>
          </div>

          <Table>
            <TableHeader className="bg-[#F7F7F8] border-b border-[#E5E5E7]">
              <TableRow>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-[#8E8E93] py-3.5">User</TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-[#8E8E93] py-3.5">Assigned Role</TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-[#8E8E93] py-3.5">Fund Clearance</TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-[#8E8E93] py-3.5">Status</TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-[#8E8E93] py-3.5">Joined</TableHead>
                {isAdmin && <TableHead className="text-right text-[11px] font-medium uppercase tracking-wider text-[#8E8E93] py-3.5">Role Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const isFundAllowed = member.role === "admin" || member.role === "owner";
                return (
                  <TableRow key={member.id} className="hover:bg-[#F7F7F8]/80 transition-colors border-b border-[#E5E5E7]">
                    <TableCell>
                      <div className="flex items-center space-x-3 py-1">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white font-semibold text-xs shadow-2xs",
                            member.role === "admin" || member.role === "owner"
                              ? "bg-[#121214] text-[#FF7900] border border-[#FF7900]/30"
                              : member.role === "senior_manager"
                              ? "bg-purple-600"
                              : "bg-emerald-600"
                          )}
                        >
                          {member.name[0]?.toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-[#0D0D0E]">
                            {member.name}
                          </span>
                          <span className="text-xs text-[#8E8E93] font-medium">
                            {member.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border",
                          member.role === "owner"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : member.role === "admin"
                            ? "bg-[#FFF4EC] text-[#FF7900] border-[#FF7900]/30"
                            : member.role === "senior_manager"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        )}
                      >
                        {member.role === "admin"
                          ? "Level 1: Admin"
                          : member.role === "senior_manager"
                          ? "Level 2: Sr Manager"
                          : member.role === "junior_manager"
                          ? "Level 3: Jr Manager"
                          : member.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      {isFundAllowed ? (
                        <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Full Funds
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-[#8E8E93] flex items-center gap-1">
                          <Lock className="h-3.5 w-3.5 text-rose-500" /> Decoupled
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "text-[10px] font-medium capitalize px-2 py-0.5 rounded-full border",
                          member.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        )}
                      >
                        {member.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-[#8E8E93] font-medium">
                      {member.joinedAt}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        {member.role !== "owner" ? (
                          <div className="flex items-center justify-end gap-2">
                            <select
                              value={member.role}
                              onChange={(e) =>
                                handleUpdateRole(member.id, e.target.value as OrganizationRole)
                              }
                              className="rounded-xl border border-[#E5E5E7] bg-white px-2 py-1 text-xs font-semibold text-[#0D0D0E] focus:outline-none focus:border-[#FF7900]"
                            >
                              <option value="admin">Level 1: Admin</option>
                              <option value="senior_manager">Level 2: Sr Manager</option>
                              <option value="junior_manager">Level 3: Jr Manager</option>
                              <option value="staff">Staff</option>
                            </select>
                            <button
                              onClick={() =>
                                setMembers(members.filter((m) => m.id !== member.id))
                              }
                              className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer ml-1"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-medium text-[#8E8E93]">Root Owner</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 3: API TOKENS */}
      {activeTab === "credentials" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Active Access Credentials & Tokens</h2>
              <p className="text-xs text-slate-600 font-normal mt-0.5">
                Cryptographic credentials for users, backend microservices, and WhatsApp integrations
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-500">
              Workspace: {currentOrg.slug}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {credentials.map((cred) => {
              const roleMeta = ROLE_DEFINITIONS[cred.role];
              const isCopied = copiedKeyId === cred.apiKeyId;

              return (
                <div
                  key={cred.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-semibold text-xs shadow-2xs",
                          cred.role === "admin" || cred.role === "owner"
                            ? "bg-blue-600 text-white"
                            : cred.role === "senior_manager"
                            ? "bg-purple-600 text-white"
                            : "bg-emerald-600 text-white"
                        )}
                      >
                        <KeyRound className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-slate-950">{cred.name}</h3>
                          <span
                            className={cn(
                              "text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border",
                              cred.role === "admin" || cred.role === "owner"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : cred.role === "senior_manager"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            )}
                          >
                            {roleMeta.title}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{cred.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(cred.apiKeyId)}
                        className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 h-8 px-2.5 cursor-pointer"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 mr-1" />
                            Copy Key
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setUserRole(cred.role)}
                        className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold h-8 px-3 cursor-pointer"
                      >
                        Activate Role
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {cred.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 font-mono text-xs flex items-center justify-between">
                      <div className="truncate pr-2">
                        <span className="text-[10px] uppercase font-medium text-slate-400 block font-sans">
                          Access Key ID
                        </span>
                        <span className="text-slate-800 font-semibold truncate block">
                          {cred.apiKeyId}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopy(cred.apiKeyId)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 font-mono text-xs flex items-center justify-between">
                      <div className="truncate pr-2">
                        <span className="text-[10px] uppercase font-medium text-slate-400 block font-sans">
                          Secret Token
                        </span>
                        <span className="text-slate-500 font-semibold tracking-widest truncate block">
                          {cred.secretMasked}
                        </span>
                      </div>
                      <span className="text-[10px] font-sans font-semibold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        Encrypted
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: ENTERPRISE BRAND GOVERNANCE RULES */}
      {activeTab === "matrix" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#E5E5E7] p-6 shadow-2xs space-y-4">
            <div>
              <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-[#FFF4EC] text-[#FF7900] border border-[#FF7900]/30 font-mono">
                Brand Product &amp; Institutional Trust Seal
              </span>
              <h2 className="text-lg font-semibold text-[#0D0D0E] mt-2">
                Enterprise Multi-Level Access &amp; Liability Rules
              </h2>
              <p className="text-xs text-[#8E8E93] mt-1 font-medium">
                These rules guarantee customer trust, enterprise compliance, and legal protection for every team member.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {ENTERPRISE_GOVERNANCE_RULES.map((rule) => (
                <div
                  key={rule.code}
                  className="p-5 rounded-2xl bg-[#F7F7F8] border border-[#E5E5E7] space-y-2 hover:border-[#FF7900]/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-[#0D0D0E] flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-[#FF7900]" />
                      {rule.title}
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-[#FF7900] bg-[#FFF4EC] px-2 py-0.5 rounded-full border border-[#FF7900]/30">
                      {rule.code}
                    </span>
                  </div>
                  <p className="text-xs text-[#8E8E93] leading-relaxed font-medium">
                    {rule.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: DISPATCH MULTI-LEVEL INVITATION (ADMIN ONLY) */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <form onSubmit={handleDispatchInvitation} className="max-w-md bg-white rounded-2xl p-2">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#0D0D0E] flex items-center gap-2">
              <Send className="h-5 w-5 text-[#FF7900]" />
              <span>Dispatch Account Invitation</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8E8E93] font-medium mt-0.5">
              Only Level 1 Administrators can dispatch formal multi-level appointments to respondent emails.
            </DialogDescription>
          </DialogHeader>

          {inviteError && (
            <div className="my-3 rounded-xl bg-rose-50 p-3.5 border border-rose-200 text-xs text-rose-800 font-semibold flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{inviteError}</span>
            </div>
          )}

          <div className="space-y-4 my-4 text-xs">
            <Input
              label="Recipient Full Name *"
              placeholder="e.g. Ramesh Iyer"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              required
              className="bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white focus:border-[#FF7900] rounded-xl text-xs"
            />

            <Input
              label="Recipient Official Email *"
              type="email"
              placeholder="ramesh@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              className="bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white focus:border-[#FF7900] rounded-xl text-xs"
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#0D0D0E]">
                Designated Clearance Level
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as OrganizationRole)}
                className="w-full rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] px-3.5 py-2 text-xs font-semibold text-[#0D0D0E] focus:border-[#FF7900] focus:bg-white focus:outline-none"
              >
                <option value="admin">Level 1: Admin (Full Access + Overall Fund Transfers)</option>
                <option value="senior_manager">Level 2: Senior Manager (Operational - Zero Fund Liability)</option>
                <option value="junior_manager">Level 3: Jr Manager (Tasks, KPIs &amp; Assigned Records)</option>
              </select>
            </div>

            <div className="rounded-xl bg-[#F7F7F8] p-3 border border-[#E5E5E7] text-[11px] text-[#8E8E93] space-y-1">
              <span className="font-semibold text-[#0D0D0E] block">Brand Trust Guarantee:</span>
              {inviteRole === "admin" && (
                <span className="text-[#FF7900] font-semibold block">
                  ✓ Full governance clearance. Recipient is granted overall fund transfer &amp; settlement oversight.
                </span>
              )}
              {inviteRole === "senior_manager" && (
                <span className="text-purple-700 font-semibold block">
                  ✓ Full operational control. <strong>Decoupled liability:</strong> Recipient is cryptographically blocked from capital &amp; fund transfers.
                </span>
              )}
              {inviteRole === "junior_manager" && (
                <span className="text-emerald-700 font-semibold block">
                  ✓ Protected task workspace. Recipient focuses on customer response SLAs and performance KPIs.
                </span>
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-[#E5E5E7] pt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setInviteModalOpen(false)}
              className="text-[#8E8E93] hover:text-[#0D0D0E] rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#FF7900] hover:bg-[#E66D00] text-white font-semibold rounded-xl text-xs shadow-2xs cursor-pointer"
            >
              Dispatch Email Invitation
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* MODAL 2: BRANDED DISPATCHED EMAIL PREVIEW */}
      <Dialog open={emailPreviewModalOpen} onOpenChange={setEmailPreviewModalOpen}>
        <div className="max-w-lg bg-white rounded-2xl p-2">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-semibold text-[#0D0D0E] flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#FF7900]" />
                <span>Dispatched Official Invitation Email</span>
              </DialogTitle>
              <Badge variant="success" className="text-[10px] uppercase font-medium">
                Email Delivered
              </Badge>
            </div>
            <DialogDescription className="text-xs text-[#8E8E93] font-medium mt-0.5">
              Live preview of the official institutional appointment email sent to {previewInvite?.recipient_email}
            </DialogDescription>
          </DialogHeader>

          {previewInvite && (
            <div className="my-4 border border-[#E5E5E7] rounded-2xl overflow-hidden shadow-2xs bg-[#F7F7F8]">
              {/* Email Envelope Bar */}
              <div className="bg-[#E5E5E7]/50 p-3 border-b border-[#E5E5E7] text-[11px] space-y-1 font-mono text-[#0D0D0E]">
                <div>
                  <span className="text-[#8E8E93] font-semibold">From:</span> ROOS STUDIOX Growth OS &lt;auth@roosstudiox.com&gt;
                </div>
                <div>
                  <span className="text-[#8E8E93] font-semibold">To:</span> {previewInvite.recipient_name} &lt;{previewInvite.recipient_email}&gt;
                </div>
                <div>
                  <span className="text-[#8E8E93] font-semibold">Subject:</span> [Action Required] Formal appointment as {ROLE_DEFINITIONS[previewInvite.role].title} for {previewInvite.organization_name}
                </div>
              </div>

              {/* Email Body Preview */}
              <div className="p-6 bg-white space-y-4 text-xs">
                {/* Brand Logo Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7]">
                  <div className="flex items-center gap-2 font-semibold text-sm text-[#0D0D0E]">
                    <div className="h-7 w-7 rounded-lg bg-[#FF7900] text-white font-semibold flex items-center justify-center text-xs">
                      RX
                    </div>
                    <span>ROOS STUDIOX</span>
                  </div>
                  <span className="text-[10px] text-[#8E8E93] font-mono">SOC-2 VERIFIED</span>
                </div>

                <div className="space-y-2">
                  <p className="font-semibold text-[#0D0D0E]">
                    Dear {previewInvite.recipient_name},
                  </p>
                  <p className="text-[#8E8E93] leading-relaxed font-medium">
                    You have been formally designated as <strong className="text-[#0D0D0E]">{ROLE_DEFINITIONS[previewInvite.role].title}</strong> for <strong className="text-[#0D0D0E]">{previewInvite.organization_name}</strong> by Workspace Administrator {previewInvite.inviter_name}.
                  </p>
                </div>

                {/* Scope Box */}
                <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-[#E5E5E7] space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase text-[#8E8E93] tracking-wider block">
                    Assigned Clearance Scope
                  </span>
                  <p className="text-[#0D0D0E] text-xs font-semibold">
                    {ROLE_DEFINITIONS[previewInvite.role].summary}
                  </p>
                  <p className="text-[11px] text-[#8E8E93] font-medium">
                    {previewInvite.role === "admin"
                      ? "✓ Authorized for overall fund transfers, bank payouts & master governance."
                      : "✓ Decoupled Liability: Protected from overall fund transfers & corporate treasury liabilities."}
                  </p>
                </div>

                {/* Call to action */}
                <div className="text-center pt-2">
                  <Link
                    href={`/invite/${previewInvite.token}`}
                    target="_blank"
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#FF7900] hover:bg-[#E66D00] text-white font-semibold text-xs shadow-xs transition-colors"
                  >
                    <span>Accept Appointment &amp; Activate Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <span className="text-[10px] text-[#8E8E93] mt-2 block font-mono">
                    Token Expiration: 7 Days (168 Hours) SLA Guarantee
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#E5E5E7] pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => previewInvite && handleCopyLink(previewInvite.token)}
              className="text-xs h-9 rounded-xl border-[#E5E5E7] font-semibold text-[#0D0D0E] hover:bg-[#F7F7F8] w-full sm:w-auto"
            >
              {copiedInviteLink ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                  Link Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1 text-[#8E8E93]" />
                  Copy Invitation Link
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={() => setEmailPreviewModalOpen(false)}
              className="bg-[#0D0D0E] hover:bg-[#1C1C1F] text-white font-semibold text-xs h-9 rounded-xl w-full sm:w-auto"
            >
              Done
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* MODAL 3: API TOKEN GENERATOR */}
      <Dialog open={newCredModalOpen} onOpenChange={setNewCredModalOpen}>
        <form onSubmit={handleCreateCredential} className="max-w-md bg-white rounded-2xl p-2">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#0D0D0E]">
              Generate API Access Token
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8E8E93] font-medium mt-0.5">
              Generate programmatic microservice credentials scoped to one of the 3 clearance levels.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4 text-xs">
            <Input
              label="Token Description *"
              placeholder="e.g. ERP Integration Service"
              value={credName}
              onChange={(e) => setCredName(e.target.value)}
              required
              className="bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white focus:border-[#FF7900] rounded-xl text-xs"
            />

            <Input
              label="Service Account Email *"
              type="email"
              placeholder="service@company.com"
              value={credEmail}
              onChange={(e) => setCredEmail(e.target.value)}
              required
              className="bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white focus:border-[#FF7900] rounded-xl text-xs"
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#0D0D0E]">
                Clearance Tier
              </label>
              <select
                value={credRole}
                onChange={(e) => setCredRole(e.target.value as OrganizationRole)}
                className="w-full rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] px-3.5 py-2 text-xs font-semibold text-[#0D0D0E] focus:border-[#FF7900] focus:bg-white focus:outline-none"
              >
                <option value="admin">Level 1: Admin (Full Access + Fund Transfers)</option>
                <option value="senior_manager">Level 2: Senior Manager (Operational)</option>
                <option value="junior_manager">Level 3: Jr Manager (Tasks &amp; Performance Only)</option>
              </select>
            </div>
          </div>

          <DialogFooter className="border-t border-[#E5E5E7] pt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setNewCredModalOpen(false)}
              className="text-[#8E8E93] hover:text-[#0D0D0E] rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#FF7900] hover:bg-[#E66D00] text-white font-semibold rounded-xl text-xs shadow-2xs cursor-pointer"
            >
              Generate Token
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
