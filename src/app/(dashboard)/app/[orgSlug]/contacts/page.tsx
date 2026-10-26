"use client";

import React, { useState, useMemo } from "react";
import { useTenant } from "@/lib/organizations/tenant-context";
import { crmStore } from "@/lib/crm/crm-store";
import { Contact, ConsentStatus } from "@/types/crm";
import {
  parseCSVText,
  validateAndDetectDuplicates,
  exportContactsToCSV,
  CSVValidationResult,
} from "@/lib/crm/csv-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Users,
  Plus,
  Search,
  Upload,
  Download,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Archive,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MessageSquare,
  Check,
  FileSpreadsheet,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { useMounted } from "@/lib/use-mounted";
import { useToast } from "@/components/ui/toast-context";

export default function ContactsPage() {
  const { currentOrg, isAdmin } = useTenant();
  const orgSlug = currentOrg.slug;
  const mounted = useMounted();
  const { toast } = useToast();

  // Local state reflecting store
  const [refreshKey, setRefreshKey] = useState(0);
  const [copiedContactId, setCopiedContactId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [consentFilter, setConsentFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "date" | "company">("date");

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [detailContact, setDetailContact] = useState<Contact | null>(null);

  // Form states for Add Contact
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [source, setSource] = useState("Manual Entry");
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>("opted_in");
  const [notes, setNotes] = useState("");

  // CSV Import state
  const [csvRawText, setCsvRawText] = useState("");
  const [csvPreview, setCsvPreview] = useState<CSVValidationResult | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // Fetch contacts for this tenant
  const rawContacts = useMemo(() => {
    return crmStore.getContacts(orgSlug, showArchived);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, showArchived, refreshKey]);

  // Total counts for stats banner
  const allContacts = useMemo(() => {
    return crmStore.getContacts(orgSlug, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);
  const optedInCount = useMemo(() => allContacts.filter((c) => c.consent_status === "opted_in").length, [allContacts]);
  const pendingCount = useMemo(() => allContacts.filter((c) => c.consent_status === "pending").length, [allContacts]);
  const optedOutCount = useMemo(() => allContacts.filter((c) => c.consent_status === "opted_out").length, [allContacts]);

  // Filter and sort contacts
  const filteredContacts = useMemo(() => {
    return rawContacts
      .filter((c) => {
        const query = searchQuery.toLowerCase();
        const matchesQuery =
          c.first_name.toLowerCase().includes(query) ||
          (c.last_name && c.last_name.toLowerCase().includes(query)) ||
          c.phone.includes(query) ||
          (c.email && c.email.toLowerCase().includes(query)) ||
          (c.company && c.company.toLowerCase().includes(query));

        const matchesConsent =
          consentFilter === "all" || c.consent_status === consentFilter;

        return matchesQuery && matchesConsent;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.first_name.localeCompare(b.first_name);
        }
        if (sortBy === "company") {
          return (a.company || "").localeCompare(b.company || "");
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [rawContacts, searchQuery, consentFilter, sortBy]);

  // Handlers
  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !phone) return;

    crmStore.createContact(orgSlug, {
      first_name: firstName,
      last_name: lastName || undefined,
      phone,
      email: email || undefined,
      company: company || undefined,
      tags: tagsInput
        ? tagsInput.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      source,
      notes: notes || undefined,
      is_archived: false,
      consent_status: consentStatus,
      consent_opted_in_at: consentStatus === "opted_in" ? new Date().toISOString() : null,
      consent_opted_out_at: consentStatus === "opted_out" ? new Date().toISOString() : null,
    });

    toast("Contact Created!", {
      message: `${firstName} ${lastName || ""} added to CRM`,
      type: "success",
    });

    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
    setCompany("");
    setTagsInput("");
    setNotes("");
    setAddModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  const handleToggleConsent = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextConsent: ConsentStatus =
      contact.consent_status === "opted_in" ? "opted_out" : "opted_in";
    crmStore.updateContact(orgSlug, contact.id, {
      consent_status: nextConsent,
      consent_opted_in_at: nextConsent === "opted_in" ? new Date().toISOString() : null,
      consent_opted_out_at: nextConsent === "opted_out" ? new Date().toISOString() : null,
    });
    setRefreshKey((k) => k + 1);
    toast(nextConsent === "opted_in" ? "WhatsApp Consent Granted ✅" : "Opted Out 🛑", {
      message: `${contact.first_name}: status changed to ${nextConsent.replace("_", " ")}`,
      type: nextConsent === "opted_in" ? "success" : "warning",
    });
  };

  const handleCopyPhone = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(contact.phone);
    setCopiedContactId(contact.id);
    toast("Phone Copied to Clipboard", { message: contact.phone, type: "info" });
    setTimeout(() => setCopiedContactId(null), 2000);
  };

  const handleArchiveToggle = (contact: Contact) => {
    const nextArchived = !contact.is_archived;
    crmStore.archiveContact(orgSlug, contact.id, nextArchived);
    setRefreshKey((k) => k + 1);
    toast(nextArchived ? "Contact Archived" : "Contact Restored", {
      message: contact.first_name,
      type: "info",
    });
  };

  const handleDelete = (contactId: string) => {
    if (!isAdmin) {
      alert("Only Admins and Owners can delete contact records.");
      return;
    }
    crmStore.deleteContact(orgSlug, contactId);
    setRefreshKey((k) => k + 1);
    toast("Contact Deleted", { type: "info" });
  };

  // CSV handlers
  const handleParseCSV = () => {
    if (!csvRawText.trim()) return;
    const parsed = parseCSVText(csvRawText);
    const existing = crmStore.getContacts(orgSlug, true);
    const result = validateAndDetectDuplicates(parsed, existing);
    setCsvPreview(result);
  };

  const handleExecuteImport = () => {
    if (!csvPreview || csvPreview.validRows.length === 0) return;

    let imported = 0;
    csvPreview.validRows.forEach((row) => {
      crmStore.createContact(orgSlug, {
        first_name: row.first_name,
        last_name: row.last_name,
        phone: row.phone,
        email: row.email,
        company: row.company,
        tags: row.tags,
        source: row.source || "CSV Import",
        is_archived: false,
        consent_status: row.consent_status,
      });
      imported++;
    });

    setImportSuccessMsg(`Successfully imported ${imported} contacts into ${currentOrg.name}.`);
    setCsvRawText("");
    setCsvPreview(null);
    setRefreshKey((k) => k + 1);

    setTimeout(() => {
      setImportSuccessMsg(null);
      setImportModalOpen(false);
    }, 1500);
  };

  const handleExportCSV = () => {
    const csvData = exportContactsToCSV(filteredContacts);
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `contacts-${orgSlug}-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getConsentBadge = (status: ConsentStatus, onClick?: (e: React.MouseEvent) => void) => {
    const isInteractive = !!onClick;
    const clickProps = isInteractive
      ? {
          onClick,
          title: "Click to toggle WhatsApp consent (Opted In / Opted Out)",
          role: "button",
          className:
            "inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full cursor-pointer hover:shadow-2xs transition-all active:scale-95 ",
        }
      : {
          className:
            "inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full ",
        };

    switch (status) {
      case "opted_in":
        return (
          <span
            {...clickProps}
            className={`${clickProps.className} text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100`}
          >
            <ShieldCheck className="h-3 w-3" />
            <span>Opted In</span>
          </span>
        );
      case "opted_out":
        return (
          <span
            {...clickProps}
            className={`${clickProps.className} text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100`}
          >
            <ShieldAlert className="h-3 w-3" />
            <span>Opted Out</span>
          </span>
        );
      default:
        return (
          <span
            {...clickProps}
            className={`${clickProps.className} text-[#8E8E93] bg-[#F7F7F8] border border-[#E5E5E7] hover:bg-[#E5E5E7]`}
          >
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E5E7]">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0D0D0E]">
              Contacts Directory
            </h1>
            <span
              className="rounded-full bg-[#FFF4EC] border border-[#FF7900]/30 text-xs font-semibold px-3 py-1 text-[#FF7900] flex items-center gap-1.5 shadow-2xs font-mono"
              suppressHydrationWarning
            >
              <span className="font-mono font-semibold text-[#FF7900]">
                {mounted ? filteredContacts.length : rawContacts.length}
              </span>
              <span>contacts</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8E8E93] font-medium mt-1">
            Directory, WhatsApp consent records and relationship tracking for {currentOrg.name}.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={filteredContacts.length === 0}
            className="rounded-xl border-[#E5E5E7] bg-white hover:bg-[#F7F7F8] text-[#0D0D0E] font-semibold shadow-2xs text-xs h-9 px-3 cursor-pointer"
          >
            <Download className="mr-1.5 h-3.5 w-3.5 text-[#8E8E93]" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportModalOpen(true)}
            className="rounded-xl border-[#E5E5E7] bg-white hover:bg-[#F7F7F8] text-[#0D0D0E] font-semibold shadow-2xs text-xs h-9 px-3 cursor-pointer"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5 text-[#8E8E93]" />
            Import CSV
          </Button>
          <Button
            size="sm"
            onClick={() => setAddModalOpen(true)}
            className="rounded-xl bg-[#FF7900] hover:bg-[#E66D00] text-white font-semibold shadow-2xs text-xs h-9 px-3.5 cursor-pointer"
          >
            <Plus className="mr-1.5 h-4 w-4 stroke-[3]" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Stats Summary Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E5E7] p-4 shadow-xs flex items-center justify-between interactive-hover-card">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#8E8E93]">Total Contacts</span>
            <div className="text-2xl font-semibold font-mono text-[#0D0D0E] mt-1">{allContacts.length}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#F7F7F8] border border-[#E5E5E7] flex items-center justify-center text-[#0D0D0E]">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E5E7] p-4 shadow-xs flex items-center justify-between interactive-hover-card">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-700">WhatsApp Opted-In</span>
            <div className="text-2xl font-semibold font-mono text-emerald-600 mt-1">{optedInCount}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E5E7] p-4 shadow-xs flex items-center justify-between interactive-hover-card">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-amber-700">Pending Consent</span>
            <div className="text-2xl font-semibold font-mono text-amber-600 mt-1">{pendingCount}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E5E7] p-4 shadow-xs flex items-center justify-between interactive-hover-card">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-rose-700">Opted Out</span>
            <div className="text-2xl font-semibold font-mono text-rose-600 mt-1">{optedOutCount}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#E5E5E7] shadow-xs">
        <div className="flex flex-col md:flex-row items-center gap-3 justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93]" />
            <input
              type="text"
              placeholder="Search name, phone, email, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] pl-10 pr-4 text-xs sm:text-sm font-medium text-[#0D0D0E] placeholder:text-[#8E8E93] focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] focus:bg-white focus:outline-none transition-all shadow-2xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto text-xs">
            {/* Consent filter */}
            <div className="flex items-center space-x-1 border border-[#E5E5E7] rounded-xl p-1 bg-[#F7F7F8] shadow-2xs">
              <span className="px-2 text-xs font-semibold text-[#8E8E93]">
                Consent:
              </span>
              {(["all", "opted_in", "pending", "opted_out"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setConsentFilter(status)}
                  className={`px-3 py-1 rounded-lg capitalize text-xs font-semibold transition-all cursor-pointer ${
                    consentFilter === status
                      ? "bg-[#0D0D0E] text-white shadow-2xs"
                      : "text-[#8E8E93] hover:text-[#0D0D0E] font-semibold"
                  }`}
                >
                  {status.replace("_", " ")}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "date" | "company")}
              className="h-9 rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] px-3 text-xs font-semibold text-[#0D0D0E] focus:outline-none focus:border-[#FF7900] focus:bg-white shadow-2xs cursor-pointer"
            >
              <option value="date">Newest First</option>
              <option value="name">Sort by Name</option>
              <option value="company">Sort by Company</option>
            </select>

            {/* Archived toggle */}
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`h-9 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                showArchived
                  ? "bg-[#FFF4EC] border-[#FF7900]/30 text-[#FF7900]"
                  : "border-[#E5E5E7] bg-[#F7F7F8] text-[#8E8E93] hover:text-[#0D0D0E] hover:bg-white"
              }`}
            >
              {showArchived ? "Archived Included" : "Active Only"}
            </button>
          </div>
        </div>
      </div>

      {/* Contacts Table View */}
      {filteredContacts.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8 text-[#FF7900]" />}
          title="No contacts found"
          description={
            searchQuery
              ? `No contacts match your query "${searchQuery}".`
              : "Your contacts directory is currently empty. Add your first contact or import from a CSV file."
          }
          actionLabel="Add Contact"
          onAction={() => setAddModalOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E5E7] shadow-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-[#F7F7F8] border-b border-[#E5E5E7]">
              <TableRow>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] py-3.5">Contact</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] py-3.5">Phone / WhatsApp</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] py-3.5">Company</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] py-3.5">Marketing Consent</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93] py-3.5">Tags</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-[#8E8E93] py-3.5">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id} className={`hover:bg-[#FFF4EC]/15 transition-colors ${contact.is_archived ? "opacity-60 bg-slate-50/50" : ""}`}>
                  <TableCell>
                    <div className="flex items-center space-x-3 py-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0D0D0E] text-white font-semibold text-sm shadow-2xs">
                        {contact.first_name[0]}
                        {contact.last_name ? contact.last_name[0] : ""}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-[#0D0D0E] flex items-center gap-1.5">
                          {contact.first_name} {contact.last_name || ""}
                          {contact.is_archived && (
                            <span className="text-[10px] font-medium py-0.5 px-1.5 rounded bg-[#F7F7F8] text-[#8E8E93] border border-[#E5E5E7]">
                              Archived
                            </span>
                          )}
                        </span>
                        {contact.email && (
                          <span className="text-xs text-[#8E8E93] font-normal">
                            {contact.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1.5 font-mono text-xs font-semibold text-[#0D0D0E]">
                      <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>{contact.phone}</span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyPhone(contact, e)}
                        className="p-1 rounded-lg text-[#8E8E93] hover:text-[#0D0D0E] hover:bg-[#F7F7F8] transition-colors cursor-pointer"
                        title="Copy phone number"
                      >
                        {copiedContactId === contact.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold text-[#0D0D0E]">
                      {contact.company || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {getConsentBadge(contact.consent_status, (e) => handleToggleConsent(contact, e))}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.length > 0
                        ? contact.tags.map((t) => (
                            <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F7F7F8] text-[#0D0D0E] border border-[#E5E5E7]">
                              {t}
                            </span>
                          ))
                        : <span className="text-[#8E8E93] text-xs">—</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Link
                        href={`/app/${orgSlug}/inbox?phone=${encodeURIComponent(contact.phone)}`}
                        className="p-1.5 rounded-lg text-[#8E8E93] hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <MessageSquare className="h-4 w-4 text-emerald-600" />
                      </Link>
                      <button
                        onClick={() => setDetailContact(contact)}
                        className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#FF7900] hover:bg-[#FFF4EC] transition-colors cursor-pointer"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleArchiveToggle(contact)}
                        className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#0D0D0E] hover:bg-[#F7F7F8] transition-colors cursor-pointer"
                        title={contact.is_archived ? "Unarchive" : "Archive"}
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(contact.id)}
                          className="p-1.5 rounded-lg text-[#8E8E93] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete contact"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Contact Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <form onSubmit={handleCreateContact} className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#0D0D0E]">Add New Contact</DialogTitle>
            <DialogDescription className="text-xs text-[#8E8E93]">
              Create a customer record in {currentOrg.name} with marketing consent tracking.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 my-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name *"
                placeholder="Aarav"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white text-xs"
              />
              <Input
                label="Last Name"
                placeholder="Patel"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Phone Number (E.164) *"
                placeholder="+919876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white font-mono text-xs"
              />
              <Input
                label="Email"
                type="email"
                placeholder="aarav@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Company"
                placeholder="Patel Enterprises"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white text-xs"
              />
              <Input
                label="Tags (comma-separated)"
                placeholder="VIP, Retail, Partner"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white text-xs"
              />
            </div>

            {/* Marketing Consent Selector */}
            <div className="rounded-xl bg-[#F7F7F8] p-3.5 border border-[#E5E5E7]">
              <label className="block text-xs font-medium text-[#0D0D0E] mb-1.5">
                Meta WhatsApp Marketing Consent
              </label>
              <div className="flex gap-4 text-xs font-medium text-[#0D0D0E]">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="consent"
                    checked={consentStatus === "opted_in"}
                    onChange={() => setConsentStatus("opted_in")}
                    className="accent-[#FF7900]"
                  />
                  <span>Opted In (Permit broadcasts)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="consent"
                    checked={consentStatus === "pending"}
                    onChange={() => setConsentStatus("pending")}
                    className="accent-[#FF7900]"
                  />
                  <span>Pending</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="consent"
                    checked={consentStatus === "opted_out"}
                    onChange={() => setConsentStatus("opted_out")}
                    className="accent-[#FF7900]"
                  />
                  <span>Opted Out</span>
                </label>
              </div>
            </div>

            <Input
              label="Internal Notes"
              placeholder="Customer notes, requirements, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white text-xs"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setAddModalOpen(false)} className="text-[#8E8E93]">
              Cancel
            </Button>
            <Button type="submit" className="bg-[#FF7900] hover:bg-[#E66D00] text-white font-semibold">
              Create Contact
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* CSV Import Modal */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <div className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#0D0D0E]">Import Contacts from CSV</DialogTitle>
            <DialogDescription className="text-xs text-[#8E8E93]">
              Validate rows, detect duplicate numbers, and bulk import into {currentOrg.name}.
            </DialogDescription>
          </DialogHeader>

          {importSuccessMsg ? (
            <div className="my-4 rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>{importSuccessMsg}</span>
            </div>
          ) : (
            <div className="space-y-4 my-4 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-[#0D0D0E]">
                    Paste CSV Data or Template
                  </label>
                  <button
                    onClick={() =>
                      setCsvRawText(
                        `First Name,Last Name,Phone,Email,Company,Tags,Consent\nRajesh,Kumar,+919876543280,rajesh@example.com,Kumar Imports,Wholesale,opted_in\nSimran,Kaur,+919876543281,simran@example.com,Kaur Exports,Retail,pending\nAarav,Patel,+919876543210,aarav@duplicate.com,Patel Group,VIP,opted_in`
                      )
                    }
                    className="text-[#FF7900] hover:underline font-semibold"
                  >
                    Load Sample CSV
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={csvRawText}
                  onChange={(e) => {
                    setCsvRawText(e.target.value);
                    setCsvPreview(null);
                  }}
                  placeholder="First Name,Last Name,Phone,Email,Company,Tags,Consent..."
                  className="w-full rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] p-3 text-xs font-mono text-[#0D0D0E] focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] focus:bg-white focus:outline-none"
                />
              </div>

              {!csvPreview && (
                <Button
                  type="button"
                  onClick={handleParseCSV}
                  disabled={!csvRawText.trim()}
                  variant="outline"
                  className="w-full border-[#E5E5E7] font-semibold"
                >
                  Validate &amp; Check Duplicates
                </Button>
              )}

              {/* Preview results */}
              {csvPreview && (
                <div className="space-y-3 rounded-xl bg-[#F7F7F8] p-3.5 border border-[#E5E5E7] text-xs">
                  <div className="flex justify-between font-semibold text-[#0D0D0E]">
                    <span>Validation Summary:</span>
                    <span className="text-emerald-700">
                      {csvPreview.validRows.length} valid rows
                    </span>
                  </div>

                  {csvPreview.duplicateCount > 0 && (
                    <div className="rounded-lg bg-amber-50 p-2 border border-amber-200 text-amber-800 flex items-center gap-1.5 font-medium">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                      <span>{csvPreview.duplicateCount} duplicate contact(s) detected in database.</span>
                    </div>
                  )}

                  {csvPreview.invalidRows.length > 0 && (
                    <div className="rounded-lg bg-rose-50 p-2 border border-rose-200 text-rose-800 space-y-1">
                      <div className="font-semibold">{csvPreview.invalidRows.length} row(s) failed validation:</div>
                      {csvPreview.invalidRows.map((inv) => (
                        <div key={inv.rowNumber} className="text-[11px]">
                          Row {inv.rowNumber}: {inv.errors.join("; ")}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setImportModalOpen(false)} className="text-[#8E8E93]">
              Cancel
            </Button>
            {csvPreview && (
              <Button
                onClick={handleExecuteImport}
                disabled={csvPreview.validRows.length === 0}
                className="bg-[#FF7900] hover:bg-[#E66D00] text-white font-semibold"
              >
                Import {csvPreview.validRows.length} Contacts
              </Button>
            )}
          </DialogFooter>
        </div>
      </Dialog>

      {/* Contact Detail Modal */}
      {detailContact && (
        <Dialog open={Boolean(detailContact)} onOpenChange={() => setDetailContact(null)}>
          <div className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center space-x-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0D0D0E] text-white font-semibold text-base shadow-2xs">
                  {detailContact.first_name[0]}
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold text-[#0D0D0E]">
                    {detailContact.first_name} {detailContact.last_name || ""}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#8E8E93]">
                    {detailContact.company || "Individual Contact"}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 my-5 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#F7F7F8] border border-[#E5E5E7]">
                <div>
                  <span className="text-[#8E8E93] block">Phone</span>
                  <span className="font-semibold text-[#0D0D0E] font-mono">
                    {detailContact.phone}
                  </span>
                </div>
                <div>
                  <span className="text-[#8E8E93] block">Email</span>
                  <span className="font-semibold text-[#0D0D0E]">
                    {detailContact.email || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[#8E8E93] block">Marketing Consent</span>
                  <div className="mt-0.5">{getConsentBadge(detailContact.consent_status)}</div>
                </div>
                <div>
                  <span className="text-[#8E8E93] block">Source</span>
                  <span className="font-semibold text-[#0D0D0E]">
                    {detailContact.source || "Direct"}
                  </span>
                </div>
              </div>

              {detailContact.notes && (
                <div className="p-3.5 rounded-xl bg-white border border-[#E5E5E7]">
                  <span className="font-semibold text-[#0D0D0E] block mb-1">Notes</span>
                  <p className="text-[#8E8E93] leading-relaxed">
                    {detailContact.notes}
                  </p>
                </div>
              )}

              {/* Related Leads */}
              <div className="space-y-2">
                <span className="font-semibold text-[#0D0D0E] block">
                  Associated Deals &amp; Leads
                </span>
                {crmStore
                  .getLeads(orgSlug)
                  .filter((l) => l.contact_id === detailContact.id)
                  .map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-[#E5E5E7] bg-white"
                    >
                      <div>
                        <span className="font-semibold text-[#0D0D0E] block">
                          {lead.title}
                        </span>
                        <span className="text-xs font-mono font-semibold text-[#8E8E93]">
                          ₹{lead.estimated_value.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <Badge variant="orangeSubtle" className="uppercase text-[10px] font-medium">
                        {lead.stage}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between">
              <Link href={`/app/${orgSlug}/inbox?phone=${encodeURIComponent(detailContact.phone)}`}>
                <Button variant="outline" className="text-emerald-700 font-semibold border-emerald-200 hover:bg-emerald-50 flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-emerald-600" />
                  Chat on WhatsApp
                </Button>
              </Link>
              <Button onClick={() => setDetailContact(null)} className="bg-[#0D0D0E] text-white font-semibold">Close</Button>
            </DialogFooter>
          </div>
        </Dialog>
      )}
    </div>
  );
}
