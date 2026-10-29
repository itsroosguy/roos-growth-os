"use client";

import React, { useState, useMemo } from "react";
import { useTenant } from "@/lib/organizations/tenant-context";
import { templateStore } from "@/lib/campaigns/template-store";
import {
  WhatsAppTemplateRecord,
  TemplateCategory,
  TemplateStatus,
} from "@/lib/campaigns/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { Drawer } from "@/components/ui/drawer";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Smartphone,
  Eye,
  Send,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast-context";

export default function TemplatesPage() {
  const { currentOrg } = useTenant();
  const orgSlug = currentOrg.slug;
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplateRecord | null>(null);

  // Create Template Dialog State
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("utility");
  const [bodyContent, setBodyContent] = useState("");

  const templates = useMemo(() => {
    return templateStore.getTemplates(orgSlug);
  }, [orgSlug]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return t.name.toLowerCase().includes(q) || t.body_content.toLowerCase().includes(q);
      }
      return true;
    });
  }, [templates, categoryFilter, searchQuery]);

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !bodyContent.trim()) return;

    templateStore.createTemplateDraft(orgSlug, {
      name: name.toLowerCase().replace(/\s+/g, "_"),
      category,
      language: "en_US",
      body_content: bodyContent.trim(),
    });

    setCreateOpen(false);
    setName("");
    setBodyContent("");
    toast("Template submitted for Meta review", { type: "success" });
  };

  return (
    <div className="space-y-6 animate-page-enter">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col gap-3 pb-5 border-b border-[#E6E2D8] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="type-display text-[#12141A]">
            Templates
          </h1>
          <p className="type-body text-[#454B57] mt-1">
            {templates.length} pre-approved WhatsApp Cloud API templates for broadcasting and instant agent responses
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-56 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666C78]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="h-10 w-full rounded-[12px] border border-[#E6E2D8] bg-white pl-9 pr-3 text-[14px] text-[#12141A] placeholder:text-[#666C78] focus:border-[#FF5A1F] focus:outline-none shadow-xs"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 px-3 rounded-[12px] border border-[#E6E2D8] bg-white text-[14px] font-medium text-[#12141A] outline-none shadow-xs cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="utility">Utility</option>
            <option value="marketing">Marketing</option>
            <option value="authentication">Authentication</option>
          </select>

          <Button
            onClick={() => setCreateOpen(true)}
            variant="primary"
            className="flex items-center gap-1.5 h-10 px-4 rounded-[12px] text-[14px]"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>New template</span>
          </Button>
        </div>
      </div>

      {/* 2. TEMPLATES MASTER GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            onClick={() => setSelectedTemplate(tpl)}
            className="group p-5 rounded-[20px] border border-[#E6E2D8] bg-white hover:border-[#D2CEC2] shadow-[0_1px_2px_rgba(11,13,18,.04),0_8px_24px_-12px_rgba(11,13,18,.12)] transition-all duration-140 cursor-pointer space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-medium text-[#12141A] group-hover:underline">
                  {tpl.name}
                </span>
                <StatusPill
                  variant={tpl.status === "APPROVED" ? "emerald" : "amber"}
                  dot
                  size="sm"
                >
                  {tpl.status}
                </StatusPill>
              </div>

              <div className="flex items-center gap-2 mt-1.5 text-[13px] text-[#666C78]">
                <span className="capitalize">{tpl.category}</span>
                <span>•</span>
                <span>{tpl.language}</span>
              </div>

              <p className="mt-3.5 text-[14px] text-[#454B57] line-clamp-3 bg-[#F7F5F0] p-3.5 rounded-[12px] border border-[#E6E2D8] leading-relaxed">
                {tpl.body_content}
              </p>
            </div>

            <div className="pt-3 border-t border-[#E6E2D8] flex items-center justify-between text-[13px] text-[#666C78]">
              <span>Click to view phone preview</span>
              <Smartphone className="h-4 w-4 text-[#666C78] group-hover:text-[#7C4DFF] transition-colors" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. SMARTPHONE PREVIEW DRAWER */}
      <Drawer
        isOpen={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        title={selectedTemplate?.name}
        description="WhatsApp smartphone preview simulation"
      >
        <div className="space-y-6">
          {/* Simulated Smartphone Container */}
          <div className="mx-auto max-w-[300px] rounded-[32px] border-4 border-[#1B1F29] bg-[#EFEAE2] p-4 shadow-overlay space-y-3.5">
            {/* Phone Top Notch */}
            <div className="mx-auto h-3.5 w-24 rounded-full bg-[#1B1F29]" />

            {/* Chat Bubble Simulation */}
            <div className="rounded-[14px] bg-white p-3.5 shadow-xs text-[14px] text-[#12141A] leading-relaxed border border-[#E6E2D8]">
              {selectedTemplate?.header_text && (
                <div className="font-medium text-[#12141A] mb-1.5 text-[14px]">
                  {selectedTemplate.header_text}
                </div>
              )}
              <p className="whitespace-pre-wrap">{selectedTemplate?.body_content}</p>
              {selectedTemplate?.footer_text && (
                <div className="mt-2 text-[13px] text-[#666C78] border-t border-[#E6E2D8] pt-1.5">
                  {selectedTemplate.footer_text}
                </div>
              )}
              <div className="mt-1.5 text-right text-[13px] text-[#666C78] font-variant-numeric tabular-nums">
                12:45 PM • Read
              </div>
            </div>
          </div>

          <div className="space-y-2.5 text-[14px]">
            <div className="flex items-center justify-between py-2 border-b border-[#E6E2D8]">
              <span className="text-[#666C78]">Category</span>
              <span className="font-medium text-[#12141A] capitalize">{selectedTemplate?.category}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#E6E2D8]">
              <span className="text-[#666C78]">Meta Template Status</span>
              <StatusPill variant={selectedTemplate?.status === "APPROVED" ? "emerald" : "amber"} size="sm">
                {selectedTemplate?.status}
              </StatusPill>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#E6E2D8]">
              <span className="text-[#666C78]">Language</span>
              <span className="font-medium text-[#12141A]">{selectedTemplate?.language}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E6E2D8] flex items-center justify-between">
            <Link href={`/app/${orgSlug}/campaigns?template=${selectedTemplate?.name}`}>
              <Button variant="primary" size="sm" className="rounded-[12px] text-[14px] h-10 px-4">
                Use in Broadcast
              </Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={() => setSelectedTemplate(null)} className="rounded-[12px] text-[14px] h-10 px-4">
              Close Preview
            </Button>
          </div>
        </div>
      </Drawer>

      {/* 4. NEW TEMPLATE MODAL */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <form onSubmit={handleCreateTemplate} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create WhatsApp Template</DialogTitle>
            <DialogDescription>
              Draft a template to submit to Meta Business Manager for approval.
            </DialogDescription>
          </DialogHeader>

          <Input
            label="Template Identifier Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. order_confirmation"
          />

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[#4B515D]">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TemplateCategory)}
              className="w-full h-9 px-3 rounded-[8px] border border-[#E4E1D8] bg-[#EFEDE7] text-[13px] text-[#12141A] outline-none"
            >
              <option value="utility">Utility (Account / Service updates)</option>
              <option value="marketing">Marketing (Promotions / Retargeting)</option>
              <option value="authentication">Authentication (OTPs / Security)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[#4B515D]">
              Body Message Text *
            </label>
            <textarea
              rows={4}
              value={bodyContent}
              onChange={(e) => setBodyContent(e.target.value)}
              required
              placeholder="Hi {{1}}, thank you for your order with Roos StudioX. Your tracking number is {{2}}."
              className="w-full rounded-[8px] border border-[#E4E1D8] bg-[#EFEDE7] p-2.5 text-[13px] text-[#12141A] outline-none focus:border-[#FF5A1F] focus:bg-white resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" size="sm" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Submit Template
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
