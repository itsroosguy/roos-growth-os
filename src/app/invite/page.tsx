"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { invitationStore } from "@/lib/team/invitation-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoosLogo } from "@/components/ui/roos-logo";
import { Shield, KeyRound, ArrowRight, Check, Users } from "lucide-react";

export default function InviteIndexPage() {
  const router = useRouter();
  const [inputToken, setInputToken] = useState("");
  const pendingInvites = invitationStore.getInvitations("acme-corp");

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputToken.trim()) {
      router.push(`/invite/${encodeURIComponent(inputToken.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0E] flex items-center justify-center p-4 text-white selection:bg-[#FF7900] selection:text-white">
      <div className="max-w-md w-full bg-white text-[#0D0D0E] rounded-2xl p-6 sm:p-8 shadow-2xl border border-[#E5E5E7] space-y-6">
        <div className="text-center space-y-2 flex flex-col items-center">
          <div className="flex items-center justify-center mb-2">
            <RoosLogo variant="dark" size="md" />
          </div>
          <div className="h-12 w-12 rounded-2xl bg-[#24180E] text-[#FF7900] flex items-center justify-center mx-auto border border-[#FF7900]/25">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold text-[#0D0D0E] tracking-tight">Redeem Access Credential</h1>
          <p className="text-xs text-[#8E8E93] leading-relaxed">
            Enter your invitation security token received via dispatch email to activate your workspace account.
          </p>
        </div>

        <form onSubmit={handleLookup} className="space-y-3">
          <Input
            label="Invitation Token *"
            placeholder="e.g. inv_live_snr_9984a1e7b"
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            required
            className="font-mono text-xs"
          />
          <Button
            type="submit"
            className="w-full bg-[#FF7900] hover:bg-[#E66D00] text-white font-semibold h-10 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <span>Verify &amp; Accept Appointment</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="pt-4 border-t border-[#E5E5E7] space-y-2.5">
          <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block">
            Demo Dispatched Tokens:
          </span>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <Link
                key={invite.id}
                href={`/invite/${invite.token}`}
                className="p-3 rounded-xl border border-[#E5E5E7] hover:border-[#FF7900] bg-[#F7F7F8] hover:bg-[#24180E]/10 transition-all flex items-center justify-between text-xs group"
              >
                <div>
                  <span className="font-semibold text-[#0D0D0E] block group-hover:text-[#FF7900] transition-colors">
                    {invite.recipient_name} ({invite.role})
                  </span>
                  <span className="text-[10px] font-mono text-[#8E8E93]">
                    {invite.token}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-[#FF7900] group-hover:underline">
                  Redeem →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
