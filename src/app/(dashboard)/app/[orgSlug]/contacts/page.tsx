"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useTenant } from "@/lib/organizations/tenant-context";
import { crmStore } from "@/lib/crm/crm-store";
import { Contact, ConsentStatus } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast-context";
import {
  cn,
  getAvatarColor,
  getInitials,
} from "@/lib/utils";
import {
  Users,
  Plus,
  Search,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Trash2,
  Eye,
  Check,
  Upload,
  Download,
} from "lucide-react";

export default function ContactsPage() {
  const { currentOrg } = useTenant();
  const orgSlug = currentOrg.slug;
  const { toast } = useToast();

  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [consentFilter, setConsentFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected Contact for Detail Drawer
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Add Contact Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>("opted_in");

  // Load contacts from store
  const allContacts = useMemo(() => {
    return crmStore.getContacts(orgSlug);
  }, [orgSlug, refreshKey]);

  // Filter contacts
  const filteredContacts = useMemo(() => {
    return allContacts.filter((c) => {
      // Consent filter
      if (consentFilter !== "all" && c.consent_status !== consentFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${c.first_name} ${c.last_name || ""}`.toLowerCase();
        const phoneMatch = c.phone.includes(q);
        const emailMatch = c.email?.toLowerCase().includes(q);
        const companyMatch = c.company?.toLowerCase().includes(q);
        return fullName.includes(q) || phoneMatch || emailMatch || companyMatch;
      }
      return true;
    });
  }, [allContacts, consentFilter, searchQuery]);

  // Real Pagination
  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / pageSize));
  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredContacts.slice(start, start + pageSize);
  }, [filteredContacts, currentPage, pageSize]);

  // Handlers
  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !phone.trim()) return;

    crmStore.createContact(orgSlug, {
      first_name: firstName.trim(),
      last_name: lastName.trim() || undefined,
      phone: phone.trim(),
      email: email.trim() || undefined,
      company: company.trim() || undefined,
      consent_status: consentStatus,
      tags: [],
      is_archived: false,
      source: "Manual Entry",
    });

    setAddModalOpen(false);
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
    setCompany("");
    setRefreshKey((k) => k + 1);
    toast("Contact added to directory", { type: "success" });
  };

  const handleDeleteContact = (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    crmStore.deleteContact(orgSlug, contactId);
    if (selectedContact?.id === contactId) setSelectedContact(null);
    setRefreshKey((k) => k + 1);
    toast("Contact removed", { type: "info" });
  };

  return (
    <div className="space-y-6 animate-page-enter">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col gap-3 pb-5 border-b border-[#E4E1D8] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] sm:text-[30px] font-medium leading-[36px] tracking-[-0.02em] text-[#12141A]">
            Contacts
          </h1>
          <p className="mt-1 text-[13px] text-[#4B515D]">
            {filteredContacts.length} customer records • WhatsApp opt-in and consent directory
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative w-56 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#6A707C]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search contacts..."
              className="h-8.5 w-full rounded-[8px] border border-[#E4E1D8] bg-white pl-8 pr-3 text-[12px] text-[#12141A] placeholder:text-[#6A707C] focus:border-[#FF5A1F] focus:outline-none shadow-hairline"
            />
          </div>

          {/* Consent Filter */}
          <select
            value={consentFilter}
            onChange={(e) => {
              setConsentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 px-3 rounded-[12px] border border-[#E6E2D8] bg-white text-[14px] font-medium text-[#12141A] outline-none shadow-xs cursor-pointer"
          >
            <option value="all">All Consent</option>
            <option value="opted_in">Opted In</option>
            <option value="opted_out">Opted Out</option>
            <option value="pending">Pending</option>
          </select>

          {/* Primary Action Button */}
          <Button
            onClick={() => setAddModalOpen(true)}
            className="btn-primary flex items-center gap-2 text-[14px]"
          >
            <Plus className="h-4 w-4" />
            <span>Add contact</span>
          </Button>
        </div>
      </div>

      {/* 2. DENSE CONTACTS DATA TABLE */}
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact Name</TableHead>
              <TableHead>WhatsApp Phone</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Consent Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedContacts.map((contact) => {
              const avatarStyle = getAvatarColor(contact.first_name);
              return (
                <TableRow
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className="cursor-pointer group"
                >
                  <TableCell className="font-medium text-[#12141A]">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-medium border shrink-0",
                          avatarStyle.bg,
                          avatarStyle.text,
                          avatarStyle.border
                        )}
                      >
                        {getInitials(`${contact.first_name} ${contact.last_name || ""}`)}
                      </div>
                      <span className="text-[14px]">
                        {contact.first_name} {contact.last_name || ""}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-variant-numeric tabular-nums text-[#12141A] text-[14px]">
                    {contact.phone}
                  </TableCell>
                  <TableCell className="text-[#454B57] text-[14px]">
                    {contact.company || "—"}
                  </TableCell>
                  <TableCell>
                    <StatusPill
                      variant={
                        contact.consent_status === "opted_in"
                          ? "emerald"
                          : contact.consent_status === "opted_out"
                          ? "rose"
                          : "amber"
                      }
                      dot
                      size="sm"
                    >
                      {contact.consent_status === "opted_in"
                        ? "Opted In"
                        : contact.consent_status === "opted_out"
                        ? "Opted Out"
                        : "Pending"}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="text-[#666C78] text-[14px]">
                    {contact.source || "Direct"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/app/${orgSlug}/inbox?phone=${encodeURIComponent(contact.phone)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-[8px] text-[#454B57] hover:text-[#12141A] hover:bg-[#EFEDE7] transition-colors"
                        title="Open WhatsApp chat"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteContact(contact.id, e)}
                        className="p-1.5 rounded-[8px] text-[#666C78] hover:text-[#E5484D] hover:bg-[#FFE9EA] transition-colors"
                        title="Delete contact"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {paginatedContacts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-[14px] text-[#666C78]">
                  No contacts found matching your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Real Pagination Controls */}
        <div className="flex items-center justify-between px-2 text-[13px] text-[#666C78]">
          <span>
            Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, filteredContacts.length)} of {filteredContacts.length} contacts
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-[8px] border border-[#E6E2D8] bg-white disabled:opacity-30 hover:bg-[#EFEDE7] text-[#12141A] transition-colors shadow-xs"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-medium text-[#12141A] px-2 font-variant-numeric tabular-nums text-[13px]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-[6px] border border-[#E4E1D8] bg-white disabled:opacity-30 hover:bg-[#EFEDE7] text-[#12141A] transition-colors shadow-hairline"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. CONTACT PREVIEW DRAWER */}
      <Drawer
        isOpen={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        title={selectedContact ? `${selectedContact.first_name} ${selectedContact.last_name || ""}` : "Contact Details"}
        description={selectedContact?.company || "Customer Record"}
      >
        <div className="space-y-6">
          <div className="p-4 rounded-[8px] bg-[#EFEDE7] space-y-2.5 text-[13px]">
            <div className="flex items-center justify-between text-[#4B515D]">
              <span>WhatsApp Phone</span>
              <span className="font-medium text-[#12141A] font-variant-numeric tabular-nums">
                {selectedContact?.phone}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#4B515D]">
              <span>Email</span>
              <span className="font-medium text-[#12141A]">
                {selectedContact?.email || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#4B515D]">
              <span>Consent</span>
              <StatusPill
                variant={selectedContact?.consent_status === "opted_in" ? "success" : "neutral"}
                size="sm"
              >
                {selectedContact?.consent_status === "opted_in" ? "Opted In" : "Pending"}
              </StatusPill>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E4E1D8] flex items-center justify-between">
            <Link
              href={`/app/${orgSlug}/inbox?phone=${encodeURIComponent(selectedContact?.phone || "")}`}
            >
              <Button variant="primary" size="sm">
                Open in WhatsApp
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedContact(null)}
            >
              Close
            </Button>
          </div>
        </div>
      </Drawer>

      {/* 4. ADD CONTACT MODAL */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <form onSubmit={handleCreateContact} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add Customer Contact</DialogTitle>
            <DialogDescription>
              Create a record in your organization WhatsApp contact directory.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name *"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="e.g. Ramesh"
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Gupta"
            />
          </div>

          <Input
            label="WhatsApp Phone Number *"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="+919876543210"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ramesh@company.com"
            />
            <Input
              label="Company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Enterprise Ltd"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Contact
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
