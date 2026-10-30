"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useTenant } from "@/lib/organizations/tenant-context";
import { crmStore } from "@/lib/crm/crm-store";
import { Contact, ConsentStatus, ContactClassification, DepartmentType } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { Drawer } from "@/components/ui/drawer";
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
  Check,
  Mail,
  Building2,
  Briefcase,
  ExternalLink,
  Phone,
  Send,
} from "lucide-react";

// Department Configuration & Visual Colors
const DEPARTMENT_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  finance: {
    label: "Finance",
    bg: "bg-[#EFF6FF]",
    text: "text-[#1D4ED8]",
    border: "border-[#BFDBFE]",
  },
  operations: {
    label: "Operations",
    bg: "bg-[#FFF8E6]",
    text: "text-[#B45309]",
    border: "border-[#FDE68A]",
  },
  marketing: {
    label: "Marketing",
    bg: "bg-[#FDF2F8]",
    text: "text-[#BE185D]",
    border: "border-[#FBCFE8]",
  },
  executive: {
    label: "Executive",
    bg: "bg-[#F5F3FF]",
    text: "text-[#6D28D9]",
    border: "border-[#DDD6FE]",
  },
  technology: {
    label: "Technology",
    bg: "bg-[#F0FDF4]",
    text: "text-[#15803D]",
    border: "border-[#BBF7D0]",
  },
  sales: {
    label: "Sales",
    bg: "bg-[#FFF1F2]",
    text: "text-[#BE123C]",
    border: "border-[#FECDD3]",
  },
  other: {
    label: "General",
    bg: "bg-[#F3F4F6]",
    text: "text-[#4B5563]",
    border: "border-[#E5E7EB]",
  },
};

// Client Classification Configuration (Ongoing Client vs New Opportunity)
const CLASSIFICATION_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dotColor: string }
> = {
  ongoing_client: {
    label: "Ongoing Client",
    bg: "bg-[#E4F7EF]",
    text: "text-[#0A7A53]",
    border: "border-[#BDECD7]",
    dotColor: "bg-[#10B981]",
  },
  new_opportunity: {
    label: "New Opportunity",
    bg: "bg-[#E3F3FD]",
    text: "text-[#0A6AA3]",
    border: "border-[#BFE3FA]",
    dotColor: "bg-[#0284C7]",
  },
  vip: {
    label: "VIP Strategic",
    bg: "bg-[#F0EAFF]",
    text: "text-[#5B34C9]",
    border: "border-[#D9C9FF]",
    dotColor: "bg-[#8B5CF6]",
  },
  lead: {
    label: "General Lead",
    bg: "bg-[#F5F2EB]",
    text: "text-[#666C78]",
    border: "border-[#E6E2D8]",
    dotColor: "bg-[#9CA3AF]",
  },
};

export default function ContactsPage() {
  const { currentOrg } = useTenant();
  const orgSlug = currentOrg.slug;
  const { toast } = useToast();

  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [classificationFilter, setClassificationFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
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
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState<DepartmentType>("operations");
  const [classification, setClassification] = useState<ContactClassification>("new_opportunity");
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>("opted_in");

  // Load contacts from store
  const allContacts = useMemo(() => {
    return crmStore.getContacts(orgSlug);
  }, [orgSlug, refreshKey]);

  // Aggregate counts for quick tabs
  const ongoingCount = useMemo(
    () => allContacts.filter((c) => c.classification === "ongoing_client").length,
    [allContacts]
  );
  const opportunityCount = useMemo(
    () => allContacts.filter((c) => c.classification === "new_opportunity" || !c.classification).length,
    [allContacts]
  );

  // Filter contacts by Classification, Department, Consent & Search Query
  const filteredContacts = useMemo(() => {
    return allContacts.filter((c) => {
      // Classification filter
      if (classificationFilter !== "all") {
        const contactClass = c.classification || "new_opportunity";
        if (contactClass !== classificationFilter) return false;
      }
      // Department filter
      if (departmentFilter !== "all") {
        if (c.department !== departmentFilter) return false;
      }
      // Consent filter
      if (consentFilter !== "all" && c.consent_status !== consentFilter) {
        return false;
      }
      // Search query (matches Name, Email, Phone, Company, Role, Department)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${c.first_name} ${c.last_name || ""}`.toLowerCase();
        const phoneMatch = c.phone.includes(q);
        const emailMatch = c.email?.toLowerCase().includes(q);
        const companyMatch = c.company?.toLowerCase().includes(q);
        const roleMatch = c.role?.toLowerCase().includes(q);
        const deptMatch = c.department?.toLowerCase().includes(q);
        return Boolean(fullName.includes(q) || phoneMatch || emailMatch || companyMatch || roleMatch || deptMatch);
      }
      return true;
    });
  }, [allContacts, classificationFilter, departmentFilter, consentFilter, searchQuery]);

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
      role: role.trim() || undefined,
      department,
      classification,
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
    setRole("");
    setDepartment("operations");
    setClassification("new_opportunity");
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
      <div className="flex flex-col gap-4 pb-5 border-b border-[#E4E1D8] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[28px] sm:text-[30px] font-medium leading-[36px] tracking-[-0.02em] text-[#12141A]">
              Contacts Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#FAF9F5] text-[#454B57] border border-[#E6E2D8]">
              {allContacts.length} verified
            </span>
          </div>
          <p className="mt-1 text-[13.5px] text-[#4B515D]">
            Classified by client lifecycle (Ongoing vs Opportunities), department roles, and verified WhatsApp & Email channels
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {/* Search Input */}
          <div className="relative w-64 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666C78]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, email, role, or company..."
              className="h-10 w-full rounded-[12px] border border-[#E6E2D8] bg-white pl-9 pr-3 text-[13.5px] text-[#12141A] placeholder:text-[#666C78] focus:border-[#FF5A1F] focus:outline-none shadow-xs"
            />
          </div>

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

      {/* 2. CLASSIFICATION & DEPARTMENT FILTERS BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Quick Filter Tabs for Ongoing Clients vs New Opportunities */}
        <div className="flex items-center bg-[#F5F2EB] p-0.5 rounded-xl border border-[#E6E2D8] self-start overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => {
              setClassificationFilter("all");
              setCurrentPage(1);
            }}
            className={cn(
              "px-3.5 py-1.5 text-[12.5px] font-medium rounded-lg transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap",
              classificationFilter === "all"
                ? "bg-white text-[#12141A] shadow-xs"
                : "text-[#666C78] hover:text-[#12141A]"
            )}
            style={{
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <span>All Contacts</span>
            <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-[#FAF9F5] border border-[#E6E2D8] text-[#454B57]">
              {allContacts.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setClassificationFilter("ongoing_client");
              setCurrentPage(1);
            }}
            className={cn(
              "px-3.5 py-1.5 text-[12.5px] font-medium rounded-lg transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap",
              classificationFilter === "ongoing_client"
                ? "bg-white text-[#12141A] shadow-xs"
                : "text-[#666C78] hover:text-[#12141A]"
            )}
            style={{
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span>Ongoing Clients</span>
            <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-[#E4F7EF] text-[#0A7A53] font-medium">
              {ongoingCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setClassificationFilter("new_opportunity");
              setCurrentPage(1);
            }}
            className={cn(
              "px-3.5 py-1.5 text-[12.5px] font-medium rounded-lg transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap",
              classificationFilter === "new_opportunity"
                ? "bg-white text-[#12141A] shadow-xs"
                : "text-[#666C78] hover:text-[#12141A]"
            )}
            style={{
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-[#0284C7]" />
            <span>New Opportunities</span>
            <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-[#E3F3FD] text-[#0A6AA3] font-medium">
              {opportunityCount}
            </span>
          </button>
        </div>

        {/* Dropdown Filters: Department & Consent */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Department Filter (Finance, Operations, Marketing, Executive, Technology) */}
          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-3 rounded-[11px] border border-[#E6E2D8] bg-white text-[13px] font-medium text-[#12141A] outline-none shadow-xs cursor-pointer"
          >
            <option value="all">All Departments</option>
            <option value="finance">Finance (CFO / Accounts)</option>
            <option value="operations">Operations (Head of Ops)</option>
            <option value="marketing">Marketing & Growth</option>
            <option value="executive">Executive & Founders</option>
            <option value="technology">Technology & Engineering</option>
          </select>

          {/* Consent Filter */}
          <select
            value={consentFilter}
            onChange={(e) => {
              setConsentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-3 rounded-[11px] border border-[#E6E2D8] bg-white text-[13px] font-medium text-[#12141A] outline-none shadow-xs cursor-pointer"
          >
            <option value="all">All Consent</option>
            <option value="opted_in">Opted In</option>
            <option value="opted_out">Opted Out</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* 3. DENSE CONTACTS DATA TABLE */}
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact & Role</TableHead>
              <TableHead>Email ID</TableHead>
              <TableHead>WhatsApp Phone</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Relationship Status</TableHead>
              <TableHead>Consent</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedContacts.map((contact) => {
              const avatarStyle = getAvatarColor(contact.first_name);
              const deptConfig = DEPARTMENT_CONFIG[contact.department || "other"] || DEPARTMENT_CONFIG.other;
              const classConfig =
                CLASSIFICATION_CONFIG[contact.classification || "new_opportunity"] ||
                CLASSIFICATION_CONFIG.new_opportunity;

              return (
                <TableRow
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className="cursor-pointer group hover:bg-[#FAF9F5] transition-colors"
                >
                  {/* Contact Name & Role */}
                  <TableCell className="font-medium text-[#12141A]">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-medium border shrink-0 shadow-2xs select-none",
                          avatarStyle.bg,
                          avatarStyle.text,
                          avatarStyle.border
                        )}
                      >
                        {getInitials(`${contact.first_name} ${contact.last_name || ""}`)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[14px] font-medium text-[#12141A] block truncate group-hover:text-[#FF5A1F] transition-colors">
                          {contact.first_name} {contact.last_name || ""}
                        </span>
                        <span className="text-[12px] text-[#666C78] block truncate">
                          {contact.role || "Lead Contact"}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Email ID (MANDATORY USER REQUEST) */}
                  <TableCell className="text-[#12141A] text-[13px]">
                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-[#12141A] hover:text-[#FF5A1F] transition-colors group/mail"
                        title={`Compose email to ${contact.email}`}
                      >
                        <Mail className="h-3.5 w-3.5 text-[#878D96] group-hover/mail:text-[#FF5A1F]" />
                        <span className="truncate max-w-[200px]">{contact.email}</span>
                      </a>
                    ) : (
                      <span className="text-[#A3A9B6] text-[13px]">—</span>
                    )}
                  </TableCell>

                  {/* WhatsApp Phone */}
                  <TableCell className="tabular-nums text-[#12141A] text-[13.5px]">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-[#25D366] shrink-0" />
                      <span>{contact.phone}</span>
                    </div>
                  </TableCell>

                  {/* Company */}
                  <TableCell className="text-[#454B57] text-[13.5px]">
                    {contact.company || "—"}
                  </TableCell>

                  {/* Department (Finance, Operations, Marketing, Executive, Tech) */}
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border",
                        deptConfig.bg,
                        deptConfig.text,
                        deptConfig.border
                      )}
                    >
                      {deptConfig.label}
                    </span>
                  </TableCell>

                  {/* Relationship Status (Ongoing Client vs New Opportunity) */}
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-medium border",
                        classConfig.bg,
                        classConfig.text,
                        classConfig.border
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", classConfig.dotColor)} />
                      <span>{classConfig.label}</span>
                    </span>
                  </TableCell>

                  {/* Consent Status */}
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

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/app/${orgSlug}/inbox?phone=${encodeURIComponent(contact.phone)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-[8px] text-[#454B57] hover:text-[#075E54] hover:bg-[#25D366]/15 transition-colors"
                        title="Open WhatsApp chat"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Link>
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-[8px] text-[#454B57] hover:text-[#12141A] hover:bg-[#EFEDE7] transition-colors"
                          title="Compose Email"
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                      )}
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
                <TableCell colSpan={8} className="h-32 text-center text-[14px] text-[#666C78]">
                  No contacts found matching your classification and search criteria.
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
            <span className="font-medium text-[#12141A] px-2 tabular-nums text-[13px]">
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

      {/* 4. CONTACT PREVIEW DRAWER */}
      <Drawer
        isOpen={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        title={selectedContact ? `${selectedContact.first_name} ${selectedContact.last_name || ""}` : "Contact Details"}
        description={selectedContact?.company || "Customer Record"}
      >
        {selectedContact && (
          <div className="space-y-6 pt-2">
            {/* Relationship & Department Identity Card */}
            <div className="p-4 rounded-[16px] bg-[#FAF9F5] border border-[#E6E2D8] space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11.5px] font-medium text-[#878D96] uppercase tracking-wider">
                  Profile & Classification
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[11px] font-medium border",
                      (DEPARTMENT_CONFIG[selectedContact.department || "other"] || DEPARTMENT_CONFIG.other).bg,
                      (DEPARTMENT_CONFIG[selectedContact.department || "other"] || DEPARTMENT_CONFIG.other).text,
                      (DEPARTMENT_CONFIG[selectedContact.department || "other"] || DEPARTMENT_CONFIG.other).border
                    )}
                  >
                    {(DEPARTMENT_CONFIG[selectedContact.department || "other"] || DEPARTMENT_CONFIG.other).label}
                  </span>
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[11.5px] font-medium border",
                      (CLASSIFICATION_CONFIG[selectedContact.classification || "new_opportunity"] || CLASSIFICATION_CONFIG.new_opportunity).bg,
                      (CLASSIFICATION_CONFIG[selectedContact.classification || "new_opportunity"] || CLASSIFICATION_CONFIG.new_opportunity).text,
                      (CLASSIFICATION_CONFIG[selectedContact.classification || "new_opportunity"] || CLASSIFICATION_CONFIG.new_opportunity).border
                    )}
                  >
                    {(CLASSIFICATION_CONFIG[selectedContact.classification || "new_opportunity"] || CLASSIFICATION_CONFIG.new_opportunity).label}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-[17px] font-medium text-[#12141A]">
                  {selectedContact.first_name} {selectedContact.last_name || ""}
                </h3>
                <p className="text-[13.5px] text-[#454B57] mt-0.5">
                  {selectedContact.role || "Key Contact"} • {selectedContact.company || "Independent"}
                </p>
              </div>

              {selectedContact.notes && (
                <div className="pt-2.5 border-t border-[#EBE7DF] text-[12.5px] text-[#666C78]">
                  <span className="font-medium text-[#12141A] block mb-0.5">Context:</span>
                  {selectedContact.notes}
                </div>
              )}
            </div>

            {/* Direct Channel Actions */}
            <div className="space-y-2">
              <span className="text-[11.5px] font-medium text-[#666C78] uppercase tracking-wider block">
                Direct Channels
              </span>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/app/${orgSlug}/inbox?phone=${encodeURIComponent(selectedContact.phone)}`}
                  className="p-3 rounded-[12px] bg-[#25D366]/10 text-[#075E54] border border-[#25D366]/30 hover:bg-[#25D366]/20 transition-colors text-center text-[13px] font-medium flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>WhatsApp Chat</span>
                </Link>

                {selectedContact.email ? (
                  <a
                    href={`mailto:${selectedContact.email}`}
                    className="p-3 rounded-[12px] bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] hover:bg-[#DBEAFE] transition-colors text-center text-[13px] font-medium flex items-center justify-center gap-1.5"
                  >
                    <Mail className="h-4 w-4" />
                    <span>Send Email</span>
                  </a>
                ) : (
                  <button
                    disabled
                    className="p-3 rounded-[12px] bg-[#F5F2EB] text-[#A3A9B6] border border-[#E6E2D8] text-center text-[13px] font-medium flex items-center justify-center gap-1.5 opacity-60"
                  >
                    <Mail className="h-4 w-4" />
                    <span>No Email ID</span>
                  </button>
                )}
              </div>
            </div>

            {/* Detailed Meta Card */}
            <div className="p-4 rounded-[14px] bg-white border border-[#E6E2D8] space-y-2.5 text-[13px]">
              <div className="flex items-center justify-between text-[#666C78]">
                <span>Email ID</span>
                <span className="font-medium text-[#12141A]">{selectedContact.email || "—"}</span>
              </div>
              <div className="flex items-center justify-between text-[#666C78]">
                <span>WhatsApp Phone</span>
                <span className="font-medium text-[#12141A] tabular-nums">{selectedContact.phone}</span>
              </div>
              <div className="flex items-center justify-between text-[#666C78]">
                <span>Consent Status</span>
                <StatusPill
                  variant={selectedContact.consent_status === "opted_in" ? "emerald" : "amber"}
                  size="sm"
                  dot
                >
                  {selectedContact.consent_status === "opted_in" ? "Opted In" : "Pending"}
                </StatusPill>
              </div>
              <div className="flex items-center justify-between text-[#666C78]">
                <span>Lead Source</span>
                <span className="font-medium text-[#12141A]">{selectedContact.source || "Direct"}</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full py-2.5"
                onClick={() => setSelectedContact(null)}
              >
                Close Drawer
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* 5. ADD CONTACT MODAL WITH EXPANDED CLASSIFICATION & EMAIL */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <form onSubmit={handleCreateContact} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add Classified Contact</DialogTitle>
            <DialogDescription>
              Create a record with department role, lifecycle classification, and verified email/WhatsApp.
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

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="WhatsApp Phone Number *"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="+919876543210"
            />
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ramesh@company.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Enterprise Ltd"
            />
            <Input
              label="Role / Designation"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Finance Head / CFO"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-[#454B57] block mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as DepartmentType)}
                className="h-10 w-full px-3 rounded-[10px] border border-[#E6E2D8] bg-white text-[13.5px] font-medium text-[#12141A] outline-none shadow-xs"
              >
                <option value="finance">Finance</option>
                <option value="operations">Operations</option>
                <option value="marketing">Marketing</option>
                <option value="executive">Executive / Leadership</option>
                <option value="technology">Technology & Engineering</option>
                <option value="sales">Sales</option>
                <option value="other">Other / General</option>
              </select>
            </div>

            <div>
              <label className="text-[12px] font-medium text-[#454B57] block mb-1">
                Client Classification
              </label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value as ContactClassification)}
                className="h-10 w-full px-3 rounded-[10px] border border-[#E6E2D8] bg-white text-[13.5px] font-medium text-[#12141A] outline-none shadow-xs"
              >
                <option value="ongoing_client">Ongoing Client</option>
                <option value="new_opportunity">New Opportunity</option>
                <option value="vip">VIP Strategic Account</option>
                <option value="lead">General Lead</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[12px] font-medium text-[#454B57] block mb-1">
              WhatsApp Consent Status
            </label>
            <select
              value={consentStatus}
              onChange={(e) => setConsentStatus(e.target.value as ConsentStatus)}
              className="h-10 w-full px-3 rounded-[10px] border border-[#E6E2D8] bg-white text-[13.5px] font-medium text-[#12141A] outline-none shadow-xs"
            >
              <option value="opted_in">Opted In (Verified)</option>
              <option value="pending">Pending Opt-In</option>
              <option value="opted_out">Opted Out</option>
            </select>
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
