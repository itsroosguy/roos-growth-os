"use client";

import React from "react";
import { WhatsAppConversation } from "@/lib/whatsapp/types";
import { Meeting } from "@/lib/calendar/types";
import { Lead } from "@/types/crm";
import { formatCompactINR } from "@/lib/utils";

interface BriefingLineProps {
  unreadConversations: Array<
    WhatsAppConversation & {
      inboundText?: string;
      waitingHours?: number;
    }
  >;
  todayMeetings: Meeting[];
  proposalLeads: Lead[];
  onOpenContactDrawer: (contact: {
    name: string;
    phone: string;
    email?: string;
    reason?: string;
  }) => void;
  onOpenDealDrawer: (deal: Lead) => void;
  onScrollToHero: () => void;
  onScrollToDayRail: () => void;
  onFilterProposal: () => void;
}

export function BriefingLine({
  unreadConversations,
  todayMeetings,
  proposalLeads,
  onOpenContactDrawer,
  onOpenDealDrawer,
  onScrollToHero,
  onScrollToDayRail,
  onFilterProposal,
}: BriefingLineProps) {
  const topWaiting = unreadConversations[0];
  const totalProposalValue = proposalLeads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0);
  const firstProposalLead = proposalLeads[0];

  const waitTime = topWaiting?.waitingHours
    ? `${topWaiting.waitingHours}h`
    : "2h";

  const Chip = ({
    children,
    onClick,
    variant = "sky",
    title,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    variant?: "sky" | "amber" | "ultramarine" | "emerald" | "violet" | "rose";
    title?: string;
  }) => {
    const variants = {
      sky: "bg-[#E3F3FD] text-[#0A6AA3] border-[#BFE3FA] hover:bg-[#D4EDFC]",
      amber: "bg-[#FFF3D6] text-[#8F5300] border-[#FFE5A3] hover:bg-[#FFEAB8]",
      ultramarine: "bg-[#EAEEFF] text-[#2A3DB5] border-[#D3DCFF] hover:bg-[#DCE5FF]",
      emerald: "bg-[#E4F7EF] text-[#0A7A53] border-[#BDECD7] hover:bg-[#D2F2E4]",
      violet: "bg-[#F0EAFF] text-[#5B34C9] border-[#D9C9FF] hover:bg-[#E5D9FF]",
      rose: "bg-[#FFE9EA] text-[#B42336] border-[#FDC8CA] hover:bg-[#FDB5B8]",
    };

    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        className={`inline-flex items-center px-2 py-0.5 rounded-[8px] text-[15px] font-medium border transition-transform duration-140 active:scale-95 mx-0.5 align-baseline cursor-pointer ${variants[variant]}`}
      >
        {children}
      </button>
    );
  };

  // 1. Top waiting customer present
  if (topWaiting) {
    const rawName = topWaiting.contact_name || topWaiting.contact_phone || "A customer";
    const firstName = rawName.includes(" ") ? rawName.split(" ")[0] : rawName;

    return (
      <p className="text-[17px] sm:text-[19px] text-[#454B57] font-normal leading-relaxed">
        <Chip
          variant="sky"
          title={`Click to view conversation with ${rawName}`}
          onClick={() =>
            onOpenContactDrawer({
              name: rawName,
              phone: topWaiting.contact_phone,
              email: `${firstName.toLowerCase()}@example.com`,
              reason: "Awaiting customer response on WhatsApp",
            })
          }
        >
          {rawName}
        </Chip>
        {" has waited "}
        <Chip
          variant="amber"
          title="Jump to Next Best Action"
          onClick={onScrollToHero}
        >
          {waitTime}
        </Chip>
        {". You have "}
        {todayMeetings.length > 0 ? (
          <Chip
            variant="ultramarine"
            title="View today's meetings on Day Rail"
            onClick={onScrollToDayRail}
          >
            {todayMeetings.length} {todayMeetings.length === 1 ? "call" : "calls"}
          </Chip>
        ) : (
          <span className="font-medium text-[#12141A]">no calls</span>
        )}
        {" today and "}
        {totalProposalValue > 0 ? (
          <>
            <Chip
              variant="emerald"
              title="View proposal opportunities"
              onClick={() => {
                if (firstProposalLead) {
                  onOpenDealDrawer(firstProposalLead);
                } else {
                  onFilterProposal();
                }
              }}
            >
              {formatCompactINR(totalProposalValue)}
            </Chip>
            {" sitting in "}
            <Chip
              variant="amber"
              title="Filter pipeline to Proposal stage"
              onClick={onFilterProposal}
            >
              Proposal
            </Chip>
            {"."}
          </>
        ) : (
          " an open calendar ready for high-value outreach."
        )}
      </p>
    );
  }

  // 2. All conversations answered; has meetings scheduled
  if (todayMeetings.length > 0) {
    return (
      <p className="text-[17px] sm:text-[19px] text-[#454B57] font-normal leading-relaxed">
        {"You are caught up on WhatsApp. You have "}
        <Chip
          variant="ultramarine"
          title="View scheduled calls on Day Rail"
          onClick={onScrollToDayRail}
        >
          {todayMeetings.length} {todayMeetings.length === 1 ? "call" : "calls"}
        </Chip>
        {" scheduled today"}
        {totalProposalValue > 0 && (
          <>
            {" and "}
            <Chip
              variant="emerald"
              title="View proposal deals"
              onClick={() => {
                if (firstProposalLead) onOpenDealDrawer(firstProposalLead);
                else onFilterProposal();
              }}
            >
              {formatCompactINR(totalProposalValue)}
            </Chip>
            {" sitting in "}
            <Chip
              variant="amber"
              title="Filter pipeline to Proposal stage"
              onClick={onFilterProposal}
            >
              Proposal
            </Chip>
          </>
        )}
        {"."}
      </p>
    );
  }

  // 3. Calm state with active pipeline
  if (totalProposalValue > 0) {
    return (
      <p className="text-[17px] sm:text-[19px] text-[#454B57] font-normal leading-relaxed">
        {"All queues and meetings are clear for today. You have "}
        <Chip
          variant="emerald"
          title="View proposal opportunities"
          onClick={() => {
            if (firstProposalLead) onOpenDealDrawer(firstProposalLead);
            else onFilterProposal();
          }}
        >
          {formatCompactINR(totalProposalValue)}
        </Chip>
        {" in "}
        <Chip
          variant="amber"
          title="Filter pipeline to Proposal stage"
          onClick={onFilterProposal}
        >
          Proposal
        </Chip>
        {" ready for follow-up."}
      </p>
    );
  }

  // 4. Clean slate empty state
  return (
    <p className="text-[17px] sm:text-[19px] text-[#454B57] font-normal leading-relaxed">
      All customer queues and follow-ups are up to date. Ready for new inquiries.
    </p>
  );
}
