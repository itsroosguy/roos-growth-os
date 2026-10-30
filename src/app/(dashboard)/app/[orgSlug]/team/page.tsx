"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTenant } from "@/lib/organizations/tenant-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatStrip } from "@/components/ui/stat-strip";
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
import { cn, formatINR, getAvatarColor, getInitials } from "@/lib/utils";

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

  // Active Tab: "roster" | "invitations" | "credentials" | "matrix"
  const [activeTab, setActiveTab] = useState<"credentials" | "roster" | "invitations" | "matrix">("roster");

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
      name: "Siddharth Rao",
      email: "siddharth@acmetech.io",
      role: "admin",
      status: "active",
      joinedAt: "Jan 14, 2026",
    },
    {
      id: "mem-3",
      name: "Pooja Varma",
      email: "pooja@acmetech.io",
      role: "senior_manager",
      status: "active",
      joinedAt: "Feb 02, 2026",
    },
    {
      id: "mem-4",
      name: "Karan Malhotra",
      email: "karan@acmetech.io",
      role: "junior_manager",
      status: "active",
      joinedAt: "Feb 18, 2026",
    },
    {
      id: "mem-5",
      name: "Ananya Deshmukh",
      email: "ananya@acmetech.io",
      role: "junior_manager",
      status: "active",
      joinedAt: "Mar 01, 2026",
    },
  ]);

  const handleCopy = (keyId: string) => {
    navigator.clipboard.writeText(keyId);
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleCopyLink = (token: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://app.roosstudiox.com";
    const fullUrl = `${origin}/invite/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedInviteLink(true);
    setTimeout(() => setCopiedInviteLink(false), 2000);
  };

  const handleCreateCredential = (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EDE8E0]">
        <div>
          <h1 className="text-[30px] font-semibold leading-tight text-[#12141A] tracking-[-0.02em]">
            Team Roster &amp; Access
          </h1>
          <p className="text-[14px] text-[#666C78] mt-1 font-normal">
            Invite teammates, manage multi-level clearance roles, and issue integration API tokens.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          {isAdmin ? (
            <>
              <Button
                onClick={() => setInviteModalOpen(true)}
                variant="primary"
                className="h-10 px-4 cursor-pointer flex items-center gap-2 rounded-[12px]"
              >
                <UserPlus className="h-4 w-4" />
                <span>Invite Member</span>
              </Button>
              <Button
                onClick={() => setNewCredModalOpen(true)}
                variant="outline"
                className="h-10 px-3.5 border-[#EDE8E0] bg-white hover:bg-[#F7F5F0] text-[#12141A] cursor-pointer flex items-center gap-2 rounded-[12px]"
              >
                <KeyRound className="h-4 w-4 text-[#666C78]" />
                <span>API Token</span>
              </Button>
            </>
          ) : (
            <div className="rounded-[12px] bg-[#FFF3D6] border border-[#FFE5A3] px-3.5 py-2 text-[13px] text-[#8F5300] font-medium flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-[#8F5300]" />
              <span>Admin access required to invite members</span>
            </div>
          )}
        </div>
      </div>

      {/* StatStrip Metrics Banner */}
      <StatStrip
        stats={[
          {
            id: "members",
            label: "Team Members",
            value: members.length,
            subtext: "Active in workspace",
          },
          {
            id: "invites",
            label: "Pending Invites",
            value: pendingCount,
            change: { value: `${pendingCount} awaiting accept`, trend: "neutral" },
          },
          {
            id: "credentials",
            label: "API Tokens",
            value: credentials.length,
            subtext: "Active integrations",
          },
          {
            id: "governance",
            label: "Workspace Plan",
            value: "Growth",
            change: { value: "All seats active", trend: "up" },
          },
        ]}
      />

      {/* Tabs */}
      <div className="flex items-center border-b border-[#EDE8E0] gap-6 text-[14px] font-medium overflow-x-auto no-scrollbar whitespace-nowrap">
        <button
          onClick={() => setActiveTab("roster")}
          className={cn(
            "pb-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2",
            activeTab === "roster"
              ? "border-[#FF5A1F] text-[#FF5A1F] font-semibold"
              : "border-transparent text-[#666C78] hover:text-[#12141A]"
          )}
        >
          <Users className="h-4 w-4" />
          <span>Active Team Roster ({members.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("invitations")}
          className={cn(
            "pb-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2",
            activeTab === "invitations"
              ? "border-[#FF5A1F] text-[#FF5A1F] font-semibold"
              : "border-transparent text-[#666C78] hover:text-[#12141A]"
          )}
        >
          <Mail className="h-4 w-4" />
          <span>Pending Invitations ({pendingCount})</span>
        </button>
        <button
          onClick={() => setActiveTab("credentials")}
          className={cn(
            "pb-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2",
            activeTab === "credentials"
              ? "border-[#FF5A1F] text-[#FF5A1F] font-semibold"
              : "border-transparent text-[#666C78] hover:text-[#12141A]"
          )}
        >
          <KeyRound className="h-4 w-4" />
          <span>API Tokens ({credentials.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("matrix")}
          className={cn(
            "pb-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2",
            activeTab === "matrix"
              ? "border-[#FF5A1F] text-[#FF5A1F] font-semibold"
              : "border-transparent text-[#666C78] hover:text-[#12141A]"
          )}
        >
          <Shield className="h-4 w-4" />
          <span>Brand Governance Rules</span>
        </button>
      </div>

      {/* Trust & Decoupled Liability Highlights Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Level 1: Admin */}
        <div className="bg-[#0B0D12] text-white rounded-[16px] border border-[#242A38] p-6 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[#FF5A1F] bg-[#FF5A1F]/15 border border-[#FF5A1F]/30 px-3 py-0.5 rounded-full tabular-nums">
              Level 1: Admin
            </span>
            <Crown className="h-5 w-5 text-[#FF5A1F]" />
          </div>
          <h3 className="text-[16px] font-semibold text-white">Full Root &amp; Fund Authority</h3>
          <p className="text-[13px] text-[#A3A9B6] leading-relaxed font-normal">
            Exclusive authority to issue multi-level credentials, execute overall fund transfers, manage bank settlements, and configure webhooks.
          </p>
          <div className="pt-3 flex items-center justify-between border-t border-white/10 text-[13px] font-medium">
            <span className="text-[#12B886] flex items-center gap-1.5">
              <Unlock className="h-4 w-4" /> Full Funds: Authorized
            </span>
            <button
              onClick={() => setUserRole("admin")}
              className="text-[#FF5A1F] hover:underline cursor-pointer font-medium"
            >
              Simulate Role →
            </button>
          </div>
        </div>

        {/* Level 2: Senior Manager */}
        <div className="bg-white rounded-[16px] border border-[#EDE8E0] p-6 card-ref space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[#7C4DFF] bg-[#F4F0FF] border border-[#E0D4FC] px-3 py-0.5 rounded-full tabular-nums">
              Level 2: Senior Manager
            </span>
            <Shield className="h-5 w-5 text-[#7C4DFF]" />
          </div>
          <h3 className="text-[16px] font-semibold text-[#12141A]">Operational Management</h3>
          <p className="text-[13px] text-[#666C78] leading-relaxed font-normal">
            Full operational access (CRM, shared inbox, automations, campaigns). <span className="font-semibold text-[#12141A]">Strictly Decoupled &amp; Protected: Zero fund transfer liability.</span>
          </p>
          <div className="pt-3 flex items-center justify-between border-t border-[#EDE8E0] text-[13px] font-medium">
            <span className="text-[#E5484D] flex items-center gap-1.5">
              <Lock className="h-4 w-4" /> Funds: Blocked (Safe)
            </span>
            <button
              onClick={() => setUserRole("senior_manager")}
              className="text-[#FF5A1F] hover:underline cursor-pointer font-medium"
            >
              Simulate Role →
            </button>
          </div>
        </div>

        {/* Level 3: Junior Manager */}
        <div className="bg-white rounded-[16px] border border-[#EDE8E0] p-6 card-ref space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[#3D5AFE] bg-[#EBF2FF] border border-[#D4E2FF] px-3 py-0.5 rounded-full tabular-nums">
              Level 3: Junior Manager
            </span>
            <Users className="h-5 w-5 text-[#3D5AFE]" />
          </div>
          <h3 className="text-[16px] font-semibold text-[#12141A]">Customer &amp; Task Frontline</h3>
          <p className="text-[13px] text-[#666C78] leading-relaxed font-normal">
            Direct client communication and operational follow-up execution. <span className="font-semibold text-[#12141A]">Strictly Decoupled &amp; Protected: Zero financial configuration exposure.</span>
          </p>
          <div className="pt-3 flex items-center justify-between border-t border-[#EDE8E0] text-[13px] font-medium">
            <span className="text-[#E5484D] flex items-center gap-1.5">
              <Lock className="h-4 w-4" /> Funds: Blocked (Safe)
            </span>
            <button
              onClick={() => setUserRole("junior_manager")}
              className="text-[#FF5A1F] hover:underline cursor-pointer font-medium"
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
              <h2 className="text-[17px] font-semibold text-[#12141A]">
                Dispatched Multi-Level Account Invitations
              </h2>
              <p className="text-[13px] text-[#666C78] font-normal mt-0.5">
                Every appointment generates an enterprise verification token delivered via email and activated upon respondent acceptance.
              </p>
            </div>
            {isAdmin && (
              <Button
                onClick={() => setInviteModalOpen(true)}
                variant="primary"
                className="h-9 px-4 rounded-[12px] text-[13px] self-start sm:self-auto cursor-pointer"
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                New Appointment Dispatch
              </Button>
            )}
          </div>

          <div className="bg-white rounded-[16px] border border-[#EDE8E0] card-ref p-0 overflow-hidden">
            <Table>
              <TableHeader className="bg-[#F7F5F0] border-b border-[#EDE8E0]">
                <TableRow>
                  <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-[#666C78] py-4">Recipient</TableHead>
                  <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-[#666C78] py-4">Assigned Level</TableHead>
                  <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-[#666C78] py-4">Fund Liability</TableHead>
                  <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-[#666C78] py-4">Status</TableHead>
                  <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-[#666C78] py-4">SLA Expiry</TableHead>
                  <TableHead className="text-right text-[12px] font-semibold uppercase tracking-wider text-[#666C78] py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => {
                  const roleMeta = ROLE_DEFINITIONS[inv.role];
                  const avatarColor = getAvatarColor(inv.recipient_name);
                  return (
                    <TableRow key={inv.id} className="hover:bg-[#F7F5F0]/70 transition-colors border-b border-[#EDE8E0]/70">
                      <TableCell>
                        <div className="flex items-center space-x-3 py-1">
                          <div
                            style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] font-semibold text-[13px] border border-black/5 shadow-2xs"
                          >
                            {getInitials(inv.recipient_name)}
                          </div>
                          <div>
                            <span className="font-semibold text-[14px] text-[#12141A] block">
                              {inv.recipient_name}
                            </span>
                            <span className="text-[12px] text-[#666C78] tabular-nums">
                              {inv.recipient_email}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span
                          className={cn(
                            "text-[12px] font-semibold uppercase px-2.5 py-0.5 rounded-full border",
                            inv.role === "admin"
                              ? "bg-[#FFF0EB] text-[#FF5A1F] border-[#FF5A1F]/30"
                              : inv.role === "senior_manager"
                              ? "bg-[#F3E8FF] text-[#5E35B1] border-[#E9D5FF]"
                              : "bg-[#E4F7EF] text-[#0A7A53] border-[#BDECD7]"
                          )}
                        >
                          {roleMeta.title}
                        </span>
                      </TableCell>

                      <TableCell>
                        {inv.role === "admin" ? (
                          <span className="text-[13px] font-medium text-[#0A7A53] flex items-center gap-1">
                            <Check className="h-4 w-4" /> Full Funds
                          </span>
                        ) : (
                          <span className="text-[13px] font-medium text-[#666C78] flex items-center gap-1">
                            <Lock className="h-4 w-4 text-[#E5484D]" /> Decoupled
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <span
                          className={cn(
                            "text-[12px] font-medium capitalize px-2.5 py-0.5 rounded-full border",
                            inv.status === "pending"
                              ? "bg-[#FFF3D6] text-[#8F5300] border-[#FFE5A3]"
                              : inv.status === "accepted"
                              ? "bg-[#E4F7EF] text-[#0A7A53] border-[#BDECD7]"
                              : "bg-[#FFE9EA] text-[#B42336] border-[#FFCCD0]"
                          )}
                        >
                          {inv.status === "pending" ? "Awaiting Acceptance" : inv.status}
                        </span>
                      </TableCell>

                      <TableCell className="text-[13px] text-[#666C78] font-medium tabular-nums">
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
                            className="h-8 text-[13px] text-[#12141A] hover:text-[#FF5A1F] hover:bg-[#FFF0EB] font-medium px-2.5 rounded-[10px] cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1 text-[#666C78]" />
                            Email Preview
                          </Button>
                          <Link
                            href={`/invite/${inv.token}`}
                            target="_blank"
                            className="inline-flex items-center text-[13px] font-medium text-[#12141A] hover:text-[#FF5A1F] bg-[#F7F5F0] hover:bg-[#FFF0EB] px-3 py-1.5 rounded-[10px] transition-colors border border-[#EDE8E0]"
                          >
                            <span>Accept</span>
                            <ExternalLink className="h-3.5 w-3.5 ml-1" />
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
        <div className="bg-white rounded-[16px] border border-[#EDE8E0] card-ref p-0 overflow-hidden">
          <div className="p-5 border-b border-[#EDE8E0] flex items-center justify-between">
            <div>
              <h2 className="text-[17px] font-semibold text-[#12141A]">Active Workspace Members</h2>
              <p className="text-[13px] text-[#666C78] font-normal mt-0.5">
                Staff holding activated credentials in {currentOrg.name}
              </p>
            </div>
            <span className="rounded-full bg-[#F7F5F0] border border-[#EDE8E0] text-[13px] font-medium px-3.5 py-1 text-[#12141A]">
              <span className="tabular-nums font-semibold text-[#FF5A1F] mr-1">{members.length}</span>
              members
            </span>
          </div>

          <Table>
            <TableHeader className="bg-[#F7F5F0] border-b border-[#EDE8E0]">
              <TableRow>
                <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-[#666C78] py-4">User</TableHead>
                <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-[#666C78] py-4">Assigned Role</TableHead>
                <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-[#666C78] py-4">Fund Clearance</TableHead>
                <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-[#666C78] py-4">Status</TableHead>
                <TableHead className="text-[12px] font-semibold uppercase tracking-wider text-[#666C78] py-4">Joined</TableHead>
                {isAdmin && <TableHead className="text-right text-[12px] font-semibold uppercase tracking-wider text-[#666C78] py-4">Role Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const isFundAllowed = member.role === "admin" || member.role === "owner";
                const avatarColor = getAvatarColor(member.name);
                return (
                  <TableRow key={member.id} className="hover:bg-[#F7F5F0]/70 transition-colors border-b border-[#EDE8E0]/70">
                    <TableCell>
                      <div className="flex items-center space-x-3 py-1">
                        <div
                          style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] font-semibold text-[13px] border border-black/5 shadow-2xs"
                        >
                          {getInitials(member.name)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-[14px] text-[#12141A]">
                            {member.name}
                          </span>
                          <span className="text-[12px] text-[#666C78] font-normal">
                            {member.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "text-[12px] font-semibold uppercase px-2.5 py-0.5 rounded-full border",
                          member.role === "owner"
                            ? "bg-[#F3E8FF] text-[#5E35B1] border-[#E9D5FF]"
                            : member.role === "admin"
                            ? "bg-[#FFF0EB] text-[#FF5A1F] border-[#FF5A1F]/30"
                            : member.role === "senior_manager"
                            ? "bg-[#EBF2FF] text-[#2545D3] border-[#D4E2FF]"
                            : "bg-[#E4F7EF] text-[#0A7A53] border-[#BDECD7]"
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
                        <span className="text-[13px] font-medium text-[#0A7A53] flex items-center gap-1">
                          <Check className="h-4 w-4" /> Full Funds
                        </span>
                      ) : (
                        <span className="text-[13px] font-medium text-[#666C78] flex items-center gap-1">
                          <Lock className="h-4 w-4 text-[#E5484D]" /> Decoupled
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "text-[12px] font-medium capitalize px-2.5 py-0.5 rounded-full border",
                          member.status === "active"
                            ? "bg-[#E4F7EF] text-[#0A7A53] border-[#BDECD7]"
                            : "bg-[#FFF3D6] text-[#8F5300] border-[#FFE5A3]"
                        )}
                      >
                        {member.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-[13px] text-[#666C78] font-medium tabular-nums">
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
                              className="rounded-[10px] border border-[#EDE8E0] bg-white px-2.5 py-1.5 text-[13px] font-medium text-[#12141A] focus:outline-none focus:border-[#FF5A1F] cursor-pointer"
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
                              className="text-[13px] font-medium text-[#E5484D] hover:text-[#B42336] cursor-pointer ml-1.5"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <span className="text-[13px] font-medium text-[#666C78]">Root Owner</span>
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
              <h2 className="text-[17px] font-semibold text-[#12141A]">Active Access Credentials &amp; Tokens</h2>
              <p className="text-[13px] text-[#666C78] font-normal mt-0.5">
                Cryptographic credentials for users, backend microservices, and WhatsApp integrations
              </p>
            </div>
            <span className="text-[12px] tabular-nums font-semibold text-[#666C78]">
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
                  className="bg-white rounded-[16px] border border-[#EDE8E0] card-ref p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] font-semibold text-xs shadow-2xs",
                          cred.role === "admin" || cred.role === "owner"
                            ? "bg-[#FFF0EB] text-[#FF5A1F] border border-[#FF5A1F]/30"
                            : cred.role === "senior_manager"
                            ? "bg-[#F3E8FF] text-[#5E35B1] border border-[#E9D5FF]"
                            : "bg-[#E4F7EF] text-[#0A7A53] border border-[#BDECD7]"
                        )}
                      >
                        <KeyRound className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[15px] text-[#12141A]">{cred.name}</h3>
                          <span
                            className={cn(
                              "text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full border",
                              cred.role === "admin" || cred.role === "owner"
                                ? "bg-[#FFF0EB] text-[#FF5A1F] border-[#FF5A1F]/30"
                                : cred.role === "senior_manager"
                                ? "bg-[#F3E8FF] text-[#5E35B1] border-[#E9D5FF]"
                                : "bg-[#E4F7EF] text-[#0A7A53] border-[#BDECD7]"
                            )}
                          >
                            {roleMeta.title}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#666C78] font-normal">{cred.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(cred.apiKeyId)}
                        className="rounded-[10px] border-[#EDE8E0] text-[13px] font-medium text-[#12141A] hover:bg-[#F7F5F0] h-8.5 px-3 cursor-pointer"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1 text-[#0A7A53]" />
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
                        className="rounded-[10px] bg-[#0B0D12] hover:bg-[#1B1F29] text-white text-[13px] font-semibold h-8.5 px-3.5 cursor-pointer"
                      >
                        Activate Role
                      </Button>
                    </div>
                  </div>

                  <p className="text-[13px] text-[#666C78] leading-relaxed font-normal">
                    {cred.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="bg-[#F7F5F0] rounded-[12px] p-2.5 border border-[#EDE8E0] tabular-nums text-xs flex items-center justify-between">
                      <div className="truncate pr-2">
                        <span className="text-[10px] uppercase font-semibold text-[#666C78] block">
                          Access Key ID
                        </span>
                        <span className="text-[#12141A] font-semibold truncate block text-[13px]">
                          {cred.apiKeyId}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopy(cred.apiKeyId)}
                        className="text-[#666C78] hover:text-[#12141A] cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="bg-[#F7F5F0] rounded-[12px] p-2.5 border border-[#EDE8E0] tabular-nums text-xs flex items-center justify-between">
                      <div className="truncate pr-2">
                        <span className="text-[10px] uppercase font-semibold text-[#666C78] block">
                          Secret Token
                        </span>
                        <span className="text-[#666C78] font-semibold tracking-widest truncate block text-[13px]">
                          {cred.secretMasked}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-[#666C78] bg-white px-2 py-0.5 rounded-full border border-[#EDE8E0]">
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
          <div className="bg-white rounded-[16px] border border-[#EDE8E0] card-ref p-6 space-y-4">
            <div>
              <span className="text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-[#FFF0EB] text-[#FF5A1F] border border-[#FF5A1F]/30 tabular-nums">
                Brand Product &amp; Institutional Trust Seal
              </span>
              <h2 className="text-[18px] font-semibold text-[#12141A] mt-2">
                Enterprise Multi-Level Access &amp; Liability Rules
              </h2>
              <p className="text-[13px] text-[#666C78] mt-1 font-normal">
                These rules guarantee customer trust, enterprise compliance, and legal protection for every team member.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {ENTERPRISE_GOVERNANCE_RULES.map((rule) => (
                <div
                  key={rule.code}
                  className="p-5 rounded-[14px] bg-[#F7F5F0] border border-[#EDE8E0] space-y-2 hover:border-[#FF5A1F]/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[14px] text-[#12141A] flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-[#FF5A1F]" />
                      {rule.title}
                    </span>
                    <span className="text-[11px] tabular-nums font-semibold text-[#FF5A1F] bg-white px-2 py-0.5 rounded-full border border-[#EDE8E0]">
                      {rule.code}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#666C78] leading-relaxed font-normal">
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
        <form onSubmit={handleDispatchInvitation} className="max-w-md bg-white rounded-[16px] border border-[#EDE8E0] p-4 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold text-[#12141A] flex items-center gap-2">
              <Send className="h-5 w-5 text-[#FF5A1F]" />
              <span>Dispatch Account Invitation</span>
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#666C78] font-normal mt-0.5">
              Only Level 1 Administrators can dispatch formal multi-level appointments to respondent emails.
            </DialogDescription>
          </DialogHeader>

          {inviteError && (
            <div className="my-3 rounded-[12px] bg-[#FFE9EA] p-3.5 border border-[#FFCCD0] text-[13px] text-[#B42336] font-semibold flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-[#E5484D] shrink-0" />
              <span>{inviteError}</span>
            </div>
          )}

          <div className="space-y-4 my-4 text-[13px]">
            <Input
              label="Recipient Full Name *"
              placeholder="e.g. Ramesh Iyer"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              required
              className="bg-[#F7F5F0] border-[#EDE8E0] focus:bg-white focus:border-[#FF5A1F] rounded-[12px] text-[13.5px] text-[#12141A]"
            />

            <Input
              label="Recipient Official Email *"
              type="email"
              placeholder="ramesh@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              className="bg-[#F7F5F0] border-[#EDE8E0] focus:bg-white focus:border-[#FF5A1F] rounded-[12px] text-[13.5px] text-[#12141A]"
            />

            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[#12141A]">
                Designated Clearance Level
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as OrganizationRole)}
                className="w-full rounded-[12px] border border-[#EDE8E0] bg-[#F7F5F0] px-3.5 py-2 text-[13px] font-semibold text-[#12141A] focus:border-[#FF5A1F] focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="admin">Level 1: Admin (Full Access + Overall Fund Transfers)</option>
                <option value="senior_manager">Level 2: Senior Manager (Operational - Zero Fund Liability)</option>
                <option value="junior_manager">Level 3: Jr Manager (Tasks, KPIs &amp; Assigned Records)</option>
              </select>
            </div>

            <div className="rounded-[12px] bg-[#F7F5F0] p-3.5 border border-[#EDE8E0] text-[12px] text-[#666C78] space-y-1">
              <span className="font-semibold text-[#12141A] block">Brand Trust Guarantee:</span>
              {inviteRole === "admin" && (
                <span className="text-[#FF5A1F] font-semibold block">
                  ✓ Full governance clearance. Recipient is granted overall fund transfer &amp; settlement oversight.
                </span>
              )}
              {inviteRole === "senior_manager" && (
                <span className="text-[#5E35B1] font-semibold block">
                  ✓ Full operational control. <strong className="text-[#12141A]">Decoupled liability:</strong> Recipient is cryptographically blocked from capital &amp; fund transfers.
                </span>
              )}
              {inviteRole === "junior_manager" && (
                <span className="text-[#0A7A53] font-semibold block">
                  ✓ Protected task workspace. Recipient focuses on customer response SLAs and performance KPIs.
                </span>
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-[#EDE8E0] pt-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setInviteModalOpen(false)}
              className="text-[#666C78] hover:text-[#12141A] rounded-[10px] text-[13px] font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="rounded-[10px] text-[13px] font-semibold shadow-xs cursor-pointer px-4"
            >
              Dispatch Email Invitation
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* MODAL 2: BRANDED DISPATCHED EMAIL PREVIEW */}
      <Dialog open={emailPreviewModalOpen} onOpenChange={setEmailPreviewModalOpen}>
        <div className="max-w-lg bg-white rounded-[16px] border border-[#EDE8E0] p-4 shadow-xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-[17px] font-semibold text-[#12141A] flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#FF5A1F]" />
                <span>Dispatched Official Invitation Email</span>
              </DialogTitle>
              <Badge variant="success" className="text-[11px] uppercase font-semibold">
                Email Delivered
              </Badge>
            </div>
            <DialogDescription className="text-[13px] text-[#666C78] font-normal mt-0.5">
              Live preview of the official institutional appointment email sent to {previewInvite?.recipient_email}
            </DialogDescription>
          </DialogHeader>

          {previewInvite && (
            <div className="my-4 border border-[#EDE8E0] rounded-[14px] overflow-hidden shadow-2xs bg-[#F7F5F0]">
              {/* Email Envelope Bar */}
              <div className="bg-[#EDE8E0]/40 p-3 border-b border-[#EDE8E0] text-[12px] space-y-1 tabular-nums text-[#12141A]">
                <div>
                  <span className="text-[#666C78] font-semibold">From:</span> ROOS STUDIOX Growth OS &lt;auth@roosstudiox.com&gt;
                </div>
                <div>
                  <span className="text-[#666C78] font-semibold">To:</span> {previewInvite.recipient_name} &lt;{previewInvite.recipient_email}&gt;
                </div>
                <div>
                  <span className="text-[#666C78] font-semibold">Subject:</span> [Action Required] Formal appointment as {ROLE_DEFINITIONS[previewInvite.role].title} for {previewInvite.organization_name}
                </div>
              </div>

              {/* Email Body Preview */}
              <div className="p-6 bg-white space-y-4 text-[13px]">
                {/* Brand Logo Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#EDE8E0]">
                  <div className="flex items-center gap-2 font-semibold text-[14px] text-[#12141A]">
                    <div className="h-7 w-7 rounded-[8px] bg-gradient-to-b from-[#FF7A3D] to-[#FF5A1F] text-white font-semibold flex items-center justify-center text-xs">
                      RX
                    </div>
                    <span>ROOS STUDIOX</span>
                  </div>
                  <span className="text-[11px] text-[#666C78] tabular-nums font-semibold">SOC-2 VERIFIED</span>
                </div>

                <div className="space-y-2">
                  <p className="font-semibold text-[#12141A]">
                    Dear {previewInvite.recipient_name},
                  </p>
                  <p className="text-[#666C78] leading-relaxed font-normal">
                    You have been formally designated as <strong className="text-[#12141A] font-semibold">{ROLE_DEFINITIONS[previewInvite.role].title}</strong> for <strong className="text-[#12141A] font-semibold">{previewInvite.organization_name}</strong> by Workspace Administrator {previewInvite.inviter_name}.
                  </p>
                </div>

                {/* Scope Box */}
                <div className="p-3.5 rounded-[12px] bg-[#F7F5F0] border border-[#EDE8E0] space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase text-[#666C78] tracking-wider block">
                    Assigned Clearance Scope
                  </span>
                  <p className="text-[#12141A] text-[13px] font-semibold">
                    {ROLE_DEFINITIONS[previewInvite.role].summary}
                  </p>
                  <p className="text-[12px] text-[#666C78] font-normal">
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
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-[12px] bg-gradient-to-b from-[#FF7A3D] to-[#FF5A1F] hover:opacity-95 text-white font-semibold text-[13px] shadow-xs transition-opacity"
                  >
                    <span>Accept Appointment &amp; Activate Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <span className="text-[11px] text-[#666C78] mt-2 block tabular-nums">
                    Token Expiration: 7 Days (168 Hours) SLA Guarantee
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#EDE8E0] pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => previewInvite && handleCopyLink(previewInvite.token)}
              className="text-[13px] h-9 rounded-[10px] border-[#EDE8E0] font-medium text-[#12141A] hover:bg-[#F7F5F0] w-full sm:w-auto"
            >
              {copiedInviteLink ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1 text-[#0A7A53]" />
                  Link Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1 text-[#666C78]" />
                  Copy Invitation Link
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={() => setEmailPreviewModalOpen(false)}
              className="bg-[#0B0D12] hover:bg-[#1B1F29] text-white font-semibold text-[13px] h-9 rounded-[10px] w-full sm:w-auto"
            >
              Done
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* MODAL 3: API TOKEN GENERATOR */}
      <Dialog open={newCredModalOpen} onOpenChange={setNewCredModalOpen}>
        <form onSubmit={handleCreateCredential} className="max-w-md bg-white rounded-[16px] border border-[#EDE8E0] p-4 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold text-[#12141A]">
              Generate API Access Token
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#666C78] font-normal mt-0.5">
              Generate programmatic microservice credentials scoped to one of the 3 clearance levels.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4 text-[13px]">
            <Input
              label="Token Description *"
              placeholder="e.g. ERP Integration Service"
              value={credName}
              onChange={(e) => setCredName(e.target.value)}
              required
              className="bg-[#F7F5F0] border-[#EDE8E0] focus:bg-white focus:border-[#FF5A1F] rounded-[12px] text-[13.5px] text-[#12141A]"
            />

            <Input
              label="Service Account Email *"
              type="email"
              placeholder="service@company.com"
              value={credEmail}
              onChange={(e) => setCredEmail(e.target.value)}
              required
              className="bg-[#F7F5F0] border-[#EDE8E0] focus:bg-white focus:border-[#FF5A1F] rounded-[12px] text-[13.5px] text-[#12141A]"
            />

            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[#12141A]">
                Clearance Tier
              </label>
              <select
                value={credRole}
                onChange={(e) => setCredRole(e.target.value as OrganizationRole)}
                className="w-full rounded-[12px] border border-[#EDE8E0] bg-[#F7F5F0] px-3.5 py-2 text-[13px] font-semibold text-[#12141A] focus:border-[#FF5A1F] focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="admin">Level 1: Admin (Full Access + Fund Transfers)</option>
                <option value="senior_manager">Level 2: Senior Manager (Operational)</option>
                <option value="junior_manager">Level 3: Jr Manager (Tasks &amp; Performance Only)</option>
              </select>
            </div>
          </div>

          <DialogFooter className="border-t border-[#EDE8E0] pt-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setNewCredModalOpen(false)}
              className="text-[#666C78] hover:text-[#12141A] rounded-[10px] text-[13px] font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="rounded-[10px] text-[13px] font-semibold shadow-xs cursor-pointer px-4"
            >
              Generate Token
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
