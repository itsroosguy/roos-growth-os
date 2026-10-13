"use client";

import React, { useState } from "react";
import { useTenant } from "@/lib/organizations/tenant-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Shield, UserPlus, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { OrganizationRole } from "@/lib/organizations/types";

interface MemberItem {
  id: string;
  name: string;
  email: string;
  role: OrganizationRole;
  status: "active" | "invited";
  joinedAt: string;
}

export default function TeamPage() {
  const { currentOrg, userRole, isAdmin } = useTenant();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrganizationRole>("staff");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const [members, setMembers] = useState<MemberItem[]>([
    {
      id: "mem-1",
      name: "Workspace Founder",
      email: "owner@business.com",
      role: "owner",
      status: "active",
      joinedAt: "Today",
    },
    {
      id: "mem-2",
      name: "Operations Lead",
      email: "ops@business.com",
      role: "admin",
      status: "active",
      joinedAt: "Today",
    },
    {
      id: "mem-3",
      name: "Sales Agent",
      email: "sales@business.com",
      role: "staff",
      status: "invited",
      joinedAt: "Pending",
    },
  ]);

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    const newMember: MemberItem = {
      id: `mem-${Date.now()}`,
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole,
      status: "invited",
      joinedAt: "Pending",
    };

    setMembers([...members, newMember]);
    setInviteEmail("");
    setInviteSuccess(true);
    setTimeout(() => {
      setInviteSuccess(false);
      setInviteModalOpen(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Team & Members
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
            Manage your organisation staff, roles and access permissions for {currentOrg.name}.
          </p>
        </div>

        {isAdmin && (
          <Button onClick={() => setInviteModalOpen(true)} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite member
          </Button>
        )}
      </div>

      {/* Role explanation banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        <div className="glass-card rounded-[22px] border border-white/75 bg-white/80 backdrop-blur-xl p-5 shadow-glass hover:bg-white/95 transition-all space-y-2">
          <Badge variant="default" className="text-xs uppercase font-bold mb-1 shadow-2xs">
            Owner
          </Badge>
          <p className="text-xs text-slate-600 leading-relaxed">
            Full control over billing, workspace deletion, team management and all data.
          </p>
        </div>
        <div className="glass-card rounded-[22px] border border-white/75 bg-white/80 backdrop-blur-xl p-5 shadow-glass hover:bg-white/95 transition-all space-y-2">
          <Badge variant="success" className="text-xs uppercase font-bold mb-1 shadow-2xs">
            Admin
          </Badge>
          <p className="text-xs text-slate-600 leading-relaxed">
            Manage team members, configure WhatsApp connections, and manage automations.
          </p>
        </div>
        <div className="glass-card rounded-[22px] border border-white/75 bg-white/80 backdrop-blur-xl p-5 shadow-glass hover:bg-white/95 transition-all space-y-2">
          <Badge variant="neutral" className="text-xs uppercase font-bold mb-1 shadow-2xs">
            Staff
          </Badge>
          <p className="text-xs text-slate-600 leading-relaxed">
            Daily CRM usage: chat in WhatsApp shared inbox, manage leads, contacts and tasks.
          </p>
        </div>
      </div>

      {/* Members table */}
      <Card>
        <CardHeader>
          <CardTitle>Organisation Members</CardTitle>
          <CardDescription>
            Showing users with active access to this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">
                        {member.name}
                      </span>
                      <span className="text-xs text-foreground-secondary">
                        {member.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        member.role === "owner"
                          ? "default"
                          : member.role === "admin"
                          ? "success"
                          : "neutral"
                      }
                      className="uppercase text-[10px] font-bold"
                    >
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={member.status === "active" ? "success" : "warning"}
                      className="capitalize text-[10px]"
                    >
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-foreground-secondary">
                    {member.joinedAt}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      {member.role !== "owner" && (
                        <button
                          onClick={() =>
                            setMembers(members.filter((m) => m.id !== member.id))
                          }
                          className="text-xs text-google-red hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invite Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <form onSubmit={handleSendInvite}>
          <DialogHeader>
            <DialogTitle>Invite team member</DialogTitle>
            <DialogDescription>
              Send an invitation email to add a staff member or administrator to {currentOrg.name}.
            </DialogDescription>
          </DialogHeader>

          {inviteSuccess ? (
            <div className="my-4 rounded-2xl bg-google-green-subtle p-4 border border-google-green/20 text-xs text-google-green flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>Invitation sent successfully!</span>
            </div>
          ) : (
            <div className="space-y-4 my-4">
              <Input
                label="Email address"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-foreground-secondary">
                  Role Assignment
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(e.target.value as OrganizationRole)
                  }
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-google-blue focus:outline-none"
                >
                  <option value="staff">Staff (Inbox, Leads, Tasks)</option>
                  <option value="admin">Admin (Operational management)</option>
                </select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={inviteSuccess}>
              Send invitation
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
