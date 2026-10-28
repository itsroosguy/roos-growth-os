"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useTenant } from "@/lib/organizations/tenant-context";
import { crmStore } from "@/lib/crm/crm-store";
import { Lead, LeadStage, Contact, Task } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { Drawer } from "@/components/ui/drawer";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast-context";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  Filter,
  Kanban,
  Table as TableIcon,
  Phone,
  Calendar,
  Building2,
  Trash2,
  Check,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  ArrowRight,
  User,
} from "lucide-react";

interface StageConfig {
  id: LeadStage;
  label: string;
  dotColor: string;
  count: number;
  totalValue: number;
}

export default function LeadsPage() {
  const { currentOrg } = useTenant();
  const orgSlug = currentOrg.slug;
  const { toast } = useToast();

  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<"board" | "table">("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  // Drag and drop state
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStage | null>(null);

  // Create Opportunity modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dealValue, setDealValue] = useState("50000");
  const [initialStage, setInitialStage] = useState<LeadStage>("new");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [source, setSource] = useState("WhatsApp Inbound");

  // Live leads & contacts from store
  const rawLeads = useMemo(() => crmStore.getLeads(orgSlug), [orgSlug, refreshKey]);
  const contacts = useMemo(() => crmStore.getContacts(orgSlug), [orgSlug, refreshKey]);

  // Filtered leads
  const leads = useMemo(() => {
    if (!searchQuery.trim()) return rawLeads;
    const q = searchQuery.toLowerCase();
    return rawLeads.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        (l.contact_name && l.contact_name.toLowerCase().includes(q)) ||
        (l.contact_phone && l.contact_phone.includes(q))
    );
  }, [rawLeads, searchQuery]);

  // Stage configuration & metrics
  const stages: StageConfig[] = useMemo(() => {
    const stageDefs: Array<{ id: LeadStage; label: string; dotColor: string }> = [
      { id: "new", label: "Lead / Inbound", dotColor: "bg-[#CFC8B8]" },
      { id: "contacted", label: "Contacted", dotColor: "bg-[#A9B0BF]" },
      { id: "qualified", label: "Qualified", dotColor: "bg-[#6C7690]" },
      { id: "proposal", label: "Proposal Sent", dotColor: "bg-[#3B4258]" },
      { id: "won", label: "Deals Won", dotColor: "bg-[#0F7B5A]" },
      { id: "lost", label: "Closed Lost", dotColor: "bg-[#B42318]" },
    ];

    return stageDefs.map((def) => {
      const stageLeads = leads.filter((l) => l.stage === def.id);
      const totalValue = stageLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
      return {
        ...def,
        count: stageLeads.length,
        totalValue,
      };
    });
  }, [leads]);

  const totalOpenValue = useMemo(() => {
    return leads
      .filter((l) => l.stage !== "won" && l.stage !== "lost")
      .reduce((sum, l) => sum + (l.estimated_value || 0), 0);
  }, [leads]);

  // Drag and Drop Handlers
  const handleDragStart = (leadId: string) => {
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: LeadStage) => {
    e.preventDefault();
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId);
    }
  };

  const handleDrop = (targetStage: LeadStage) => {
    if (!draggedLeadId) return;

    crmStore.updateLeadStage(orgSlug, draggedLeadId, targetStage);
    setDraggedLeadId(null);
    setDragOverStage(null);
    setRefreshKey((k) => k + 1);

    if (targetStage === "won") {
      toast("Deal marked Won! Revenue added to closed totals", { type: "success" });
    } else {
      toast(`Opportunity moved to ${targetStage}`, { type: "info" });
    }
  };

  // Create Opportunity Handler
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    crmStore.createLead(orgSlug, {
      title,
      estimated_value: parseFloat(dealValue) || 50000,
      currency: "INR",
      stage: initialStage,
      contact_id: "c-direct",
      contact_name: contactName || "Direct Client",
      contact_phone: contactPhone || "+919876543210",
      source,
    });

    setCreateModalOpen(false);
    setTitle("");
    setDealValue("50000");
    setContactName("");
    setContactPhone("");
    setRefreshKey((k) => k + 1);
    toast("Opportunity created", { type: "success" });
  };

  return (
    <div className="space-y-6 animate-page-enter">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col gap-3 pb-5 border-b border-[#E4E1D8] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] sm:text-[30px] font-medium leading-[36px] tracking-[-0.02em] text-[#12141A]">
            Sales Pipeline
          </h1>
          <p className="mt-1 text-[13px] text-[#4B515D]">
            {leads.length} opportunities • ₹{totalOpenValue.toLocaleString()} active pipeline • 6 pipeline stages
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Field */}
          <div className="relative w-48 sm:w-60">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#6A707C]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deals..."
              className="h-8.5 w-full rounded-[8px] border border-[#E4E1D8] bg-white pl-8 pr-3 text-[12px] text-[#12141A] placeholder:text-[#6A707C] focus:border-[#FF5A1F] focus:outline-none shadow-hairline"
            />
          </div>

          {/* Board / Table View Toggle */}
          <div className="flex items-center rounded-[8px] border border-[#E4E1D8] bg-white p-0.5 shadow-hairline">
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-medium transition-colors",
                viewMode === "board"
                  ? "bg-[#EFEDE7] text-[#12141A]"
                  : "text-[#6A707C] hover:text-[#12141A]"
              )}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-medium transition-colors",
                viewMode === "table"
                  ? "bg-[#EFEDE7] text-[#12141A]"
                  : "text-[#6A707C] hover:text-[#12141A]"
              )}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>

          {/* Primary Action Button */}
          <Button
            onClick={() => setCreateModalOpen(true)}
            variant="primary"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add opportunity</span>
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. KANBAN BOARD VIEW (Viewport-Pinned Bottom Scrollbar)                    */}
      {/* ========================================================================= */}
      {viewMode === "board" && (
        <div className="overflow-x-auto pb-4 custom-light-scroll select-none">
          <div className="flex gap-4 min-w-[1340px] items-start">
            {stages.map((stage) => {
              const stageLeads = leads.filter((l) => l.stage === stage.id);
              const isOver = dragOverStage === stage.id;

              return (
                <div
                  key={stage.id}
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDrop={() => handleDrop(stage.id)}
                  className={cn(
                    "flex flex-col w-[260px] shrink-0 rounded-[14px] border border-[#E4E1D8] bg-[#FFFFFF] shadow-hairline transition-colors duration-140",
                    isOver && "border-[#FF5A1F] bg-[#FFF1EA]/30"
                  )}
                >
                  {/* Stage Header */}
                  <div className="p-3.5 border-b border-[#E4E1D8] bg-[#FFFFFF] rounded-t-[14px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", stage.dotColor)} />
                        <h3 className="text-[13px] font-medium text-[#12141A]">
                          {stage.label}
                        </h3>
                      </div>
                      <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-[#EFEDE7] text-[#4B515D] text-[11px] font-medium flex items-center justify-center font-variant-numeric tabular-nums">
                        {stage.count}
                      </span>
                    </div>

                    <div className="mt-1 text-[11px] text-[#6A707C] font-variant-numeric tabular-nums">
                      ₹{stage.totalValue.toLocaleString()}
                    </div>
                  </div>

                  {/* Cards List */}
                  <div className="p-2 space-y-2.5 min-h-[460px] max-h-[calc(100vh-270px)] overflow-y-auto custom-light-scroll">
                    {stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={() => handleDragStart(lead.id)}
                        onClick={() => setActiveLead(lead)}
                        className="group relative p-3.5 rounded-[10px] border border-[#E4E1D8] bg-white hover:border-[#D2CEC2] hover:shadow-card transition-all duration-140 cursor-grab active:cursor-grabbing"
                      >
                        <h4 className="text-[13px] font-medium text-[#12141A] truncate group-hover:underline">
                          {lead.title}
                        </h4>

                        <div className="mt-2 flex items-center justify-between text-[12px]">
                          <span className="font-medium text-[#0F7B5A] font-variant-numeric tabular-nums">
                            ₹{(lead.estimated_value || 0).toLocaleString()}
                          </span>
                          <span className="text-[11px] text-[#6A707C] truncate max-w-[100px]">
                            {lead.contact_name || "Lead"}
                          </span>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-[#E4E1D8]/80 flex items-center justify-between text-[11px] text-[#6A707C]">
                          <div className="flex items-center gap-1.5">
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#EFEDE7] text-[#12141A] text-[9px] font-medium">
                              {lead.contact_name ? lead.contact_name[0] : "L"}
                            </div>
                            <span className="truncate max-w-[90px]">{lead.source}</span>
                          </div>
                          {lead.stage === "won" && (
                            <span className="text-[#0F7B5A] font-medium">Won</span>
                          )}
                        </div>
                      </div>
                    ))}

                    {stageLeads.length === 0 && (
                      <div className="h-32 flex items-center justify-center rounded-[8px] border border-dashed border-[#E4E1D8] text-[11px] text-[#6A707C]">
                        Drag deals here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TABLE VIEW (Dense, 40px Rows, Hairlines)                               */}
      {/* ========================================================================= */}
      {viewMode === "table" && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Opportunity</TableHead>
              <TableHead>Client Contact</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Value (INR)</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow
                key={lead.id}
                onClick={() => setActiveLead(lead)}
                className="cursor-pointer"
              >
                <TableCell className="font-medium text-[#12141A]">
                  {lead.title}
                </TableCell>
                <TableCell className="text-[#4B515D]">
                  {lead.contact_name || "Enterprise Lead"} ({lead.contact_phone || "—"})
                </TableCell>
                <TableCell>
                  <StatusPill
                    variant={
                      lead.stage === "won"
                        ? "success"
                        : lead.stage === "lost"
                        ? "danger"
                        : "neutral"
                    }
                    size="sm"
                  >
                    {lead.stage}
                  </StatusPill>
                </TableCell>
                <TableCell className="font-medium text-[#0F7B5A]">
                  ₹{(lead.estimated_value || 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-[#6A707C]">{lead.source}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveLead(lead);
                    }}
                    className="h-7 text-[12px]"
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {leads.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center text-[#6A707C]">
                  No opportunities found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* ========================================================================= */}
      {/* 4. DETAIL DRAWER (Slide-over Record View)                                 */}
      {/* ========================================================================= */}
      <Drawer
        isOpen={!!activeLead}
        onClose={() => setActiveLead(null)}
        title={activeLead?.title || "Opportunity Details"}
        description={`Current Stage: ${activeLead?.stage}`}
      >
        <div className="space-y-6">
          <div className="p-4 rounded-[8px] bg-[#EFEDE7] space-y-2">
            <span className="text-[11px] font-medium tracking-[0.06em] text-[#6A707C] uppercase">
              Deal Value
            </span>
            <div className="text-[32px] font-medium text-[#12141A] font-variant-numeric tabular-nums">
              ₹{(activeLead?.estimated_value || 0).toLocaleString()}
            </div>
          </div>

          <div className="space-y-3 text-[13px]">
            <h4 className="text-[11px] font-medium tracking-[0.06em] text-[#6A707C] uppercase">
              Deal Attributes
            </h4>
            <div className="p-3 rounded-[8px] border border-[#E4E1D8] space-y-2.5">
              <div className="flex items-center justify-between text-[#4B515D]">
                <span>Client Name</span>
                <span className="font-medium text-[#12141A]">
                  {activeLead?.contact_name || "Direct Client"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#4B515D]">
                <span>WhatsApp Phone</span>
                <span className="font-medium text-[#12141A] font-variant-numeric tabular-nums">
                  {activeLead?.contact_phone || "+919876543210"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#4B515D]">
                <span>Lead Source</span>
                <span className="font-medium text-[#12141A]">{activeLead?.source}</span>
              </div>
            </div>
          </div>

          {/* Quick Stage Progression */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-medium tracking-[0.06em] text-[#6A707C] uppercase">
              Move to Stage
            </h4>
            <div className="grid grid-cols-3 gap-1.5">
              {(["new", "contacted", "qualified", "proposal", "won", "lost"] as const).map(
                (stage) => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => {
                      if (activeLead) {
                        crmStore.updateLeadStage(orgSlug, activeLead.id, stage);
                        setActiveLead((prev) => (prev ? { ...prev, stage } : null));
                        setRefreshKey((k) => k + 1);
                        toast(`Moved to ${stage}`, { type: "info" });
                      }
                    }}
                    className={cn(
                      "px-2 py-1.5 rounded-[6px] text-[11px] font-medium capitalize border transition-colors",
                      activeLead?.stage === stage
                        ? "bg-[#1B1F29] text-white border-transparent"
                        : "bg-[#EFEDE7] text-[#12141A] border-[#E4E1D8] hover:bg-[#E4E1D8]"
                    )}
                  >
                    {stage}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E4E1D8] flex items-center justify-between">
            <Link href={`/app/${orgSlug}/inbox`}>
              <Button variant="secondary" size="sm">
                Open WhatsApp Thread
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveLead(null)}
            >
              Close
            </Button>
          </div>
        </div>
      </Drawer>

      {/* ========================================================================= */}
      {/* 5. CREATE OPPORTUNITY MODAL DIALOG                                        */}
      {/* ========================================================================= */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <form onSubmit={handleCreateLead} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add Sales Opportunity</DialogTitle>
            <DialogDescription>
              Create a commercial deal in your active workspace pipeline.
            </DialogDescription>
          </DialogHeader>

          <Input
            label="Deal Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Enterprise WhatsApp Retainer"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Estimated Value (INR) *"
              type="number"
              value={dealValue}
              onChange={(e) => setDealValue(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[#4B515D]">
                Initial Stage
              </label>
              <select
                value={initialStage}
                onChange={(e) => setInitialStage(e.target.value as LeadStage)}
                className="w-full h-9 px-3 rounded-[8px] border border-[#E4E1D8] bg-[#EFEDE7] text-[13px] text-[#12141A] outline-none"
              >
                <option value="new">Lead / Inbound</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal Sent</option>
                <option value="won">Deals Won</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Client Contact Name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
            />

            <Input
              label="Client Phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+919876543210"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Opportunity
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
