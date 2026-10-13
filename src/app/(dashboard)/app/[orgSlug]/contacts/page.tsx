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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  UserCheck,
  Plus,
  Search,
  Upload,
  Download,
  ShieldCheck,
  ShieldAlert,
  Clock,
  MoreVertical,
  Archive,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  Tag,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

export default function ContactsPage() {
  const { currentOrg, isAdmin } = useTenant();
  const orgSlug = currentOrg.slug;

  // Local state reflecting store
  const [refreshKey, setRefreshKey] = useState(0);
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

    // Reset form
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

  const handleArchiveToggle = (contact: Contact) => {
    crmStore.archiveContact(orgSlug, contact.id, !contact.is_archived);
    setRefreshKey((k) => k + 1);
  };

  const handleDelete = (contactId: string) => {
    if (!isAdmin) {
      alert("Only Admins and Owners can delete contact records.");
      return;
    }
    crmStore.deleteContact(orgSlug, contactId);
    setRefreshKey((k) => k + 1);
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

  const getConsentBadge = (status: ConsentStatus) => {
    switch (status) {
      case "opted_in":
        return (
          <Badge variant="success" className="text-[10px] gap-1 font-semibold">
            <ShieldCheck className="h-3 w-3" />
            Opted In
          </Badge>
        );
      case "opted_out":
        return (
          <Badge variant="danger" className="text-[10px] gap-1 font-semibold">
            <ShieldAlert className="h-3 w-3" />
            Opted Out
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" className="text-[10px] gap-1 font-semibold">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/60">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Contacts CRM
            </h1>
            <span className="glass-pill rounded-full bg-white/80 border border-white text-xs font-semibold px-3 py-0.5 text-slate-700 shadow-xs">
              {filteredContacts.length} contacts
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
            Directory, WhatsApp consent records and relationship tracking for {currentOrg.name}.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={filteredContacts.length === 0}
            className="rounded-xl border-white/80 bg-white/80 hover:bg-white text-slate-700 shadow-xs"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setImportModalOpen(true)}
            className="rounded-xl border-white/80 bg-white/80 hover:bg-white text-slate-700 shadow-xs"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Import CSV
          </Button>
          <Button size="sm" onClick={() => setAddModalOpen(true)} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/70 bg-white/75 backdrop-blur-xl shadow-glass">
        <div className="flex flex-col md:flex-row items-center gap-3 justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, phone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/80 bg-white/70 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 backdrop-blur-sm focus:border-blue-500/80 focus:bg-white focus:outline-none transition-all shadow-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto text-xs">
            {/* Consent filter */}
            <div className="flex items-center space-x-1 border border-white/80 rounded-xl p-1 bg-white/60 backdrop-blur-xs shadow-2xs">
              <span className="px-2 text-[11px] font-semibold text-slate-500">
                Consent:
              </span>
              {(["all", "opted_in", "pending", "opted_out"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setConsentFilter(status)}
                  className={`px-2.5 py-1 rounded-lg capitalize text-[11px] transition-colors cursor-pointer ${
                    consentFilter === status
                      ? "bg-white text-blue-600 font-bold shadow-xs border border-white"
                      : "text-slate-600 hover:text-slate-900"
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
              className="h-9 rounded-xl border border-white/80 bg-white/70 px-3 text-xs text-slate-700 backdrop-blur-xs focus:outline-none focus:bg-white shadow-2xs cursor-pointer"
            >
              <option value="date">Newest First</option>
              <option value="name">Sort by Name</option>
              <option value="company">Sort by Company</option>
            </select>

            {/* Archived toggle */}
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`h-9 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer shadow-2xs ${
                showArchived
                  ? "bg-blue-50 border-blue-200 text-blue-700 font-bold"
                  : "border-white/80 bg-white/70 text-slate-600 hover:text-slate-900 hover:bg-white"
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
          icon={<UserCheck className="h-8 w-8 text-google-blue" />}
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Phone / WhatsApp</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Marketing Consent</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.map((contact) => (
              <TableRow key={contact.id} className={contact.is_archived ? "opacity-60 bg-surface-subtle/50" : ""}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-blue text-google-blue font-bold text-xs">
                      {contact.first_name[0]}
                      {contact.last_name ? contact.last_name[0] : ""}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        {contact.first_name} {contact.last_name || ""}
                        {contact.is_archived && (
                          <Badge variant="neutral" className="text-[9px] py-0">
                            Archived
                          </Badge>
                        )}
                      </span>
                      {contact.email && (
                        <span className="text-xs text-foreground-secondary">
                          {contact.email}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1.5 font-mono text-xs text-foreground">
                    <Phone className="h-3 w-3 text-google-green shrink-0" />
                    <span>{contact.phone}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-foreground-secondary">
                    {contact.company || "—"}
                  </span>
                </TableCell>
                <TableCell>{getConsentBadge(contact.consent_status)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.length > 0
                      ? contact.tags.map((t) => (
                          <Badge key={t} variant="neutral" className="text-[10px] px-2 py-0">
                            {t}
                          </Badge>
                        ))
                      : "—"}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <Link
                      href={`/app/${orgSlug}/inbox?contactId=${contact.id}`}
                      className="p-1.5 rounded-full text-foreground-secondary hover:text-google-green hover:bg-google-green-subtle"
                      title="Chat on WhatsApp"
                    >
                      <MessageSquare className="h-4 w-4 text-google-green" />
                    </Link>
                    <button
                      onClick={() => setDetailContact(contact)}
                      className="p-1.5 rounded-full text-foreground-secondary hover:text-google-blue hover:bg-surface-blue"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleArchiveToggle(contact)}
                      className="p-1.5 rounded-full text-foreground-secondary hover:text-foreground hover:bg-surface-subtle"
                      title={contact.is_archived ? "Unarchive" : "Archive"}
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="p-1.5 rounded-full text-foreground-secondary hover:text-google-red hover:bg-google-red-subtle"
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
      )}

      {/* Add Contact Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <form onSubmit={handleCreateContact}>
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Create a customer record in {currentOrg.name} with marketing consent tracking.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 my-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name *"
                placeholder="Aarav"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Last Name"
                placeholder="Patel"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Phone Number (E.164) *"
                placeholder="+919876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="aarav@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Company"
                placeholder="Patel Enterprises"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
              <Input
                label="Tags (comma-separated)"
                placeholder="VIP, Retail, Partner"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>

            {/* Marketing Consent Selector */}
            <div className="rounded-2xl bg-surface-subtle p-3.5 border border-border">
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Meta WhatsApp Marketing Consent
              </label>
              <div className="flex gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="consent"
                    checked={consentStatus === "opted_in"}
                    onChange={() => setConsentStatus("opted_in")}
                  />
                  <span>Opted In (Permit broadcasts)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="consent"
                    checked={consentStatus === "pending"}
                    onChange={() => setConsentStatus("pending")}
                  />
                  <span>Pending</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="consent"
                    checked={consentStatus === "opted_out"}
                    onChange={() => setConsentStatus("opted_out")}
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
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Contact</Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* CSV Import Modal */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <div>
          <DialogHeader>
            <DialogTitle>Import Contacts from CSV</DialogTitle>
            <DialogDescription>
              Validate rows, detect duplicate numbers, and bulk import into {currentOrg.name}.
            </DialogDescription>
          </DialogHeader>

          {importSuccessMsg ? (
            <div className="my-4 rounded-2xl bg-google-green-subtle p-4 border border-google-green/20 text-xs text-google-green flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>{importSuccessMsg}</span>
            </div>
          ) : (
            <div className="space-y-4 my-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-foreground-secondary">
                    Paste CSV Data or Template
                  </label>
                  <button
                    onClick={() =>
                      setCsvRawText(
                        `First Name,Last Name,Phone,Email,Company,Tags,Consent\nRajesh,Kumar,+919876543280,rajesh@example.com,Kumar Imports,Wholesale,opted_in\nSimran,Kaur,+919876543281,simran@example.com,Kaur Exports,Retail,pending\nAarav,Patel,+919876543210,aarav@duplicate.com,Patel Group,VIP,opted_in`
                      )
                    }
                    className="text-google-blue hover:underline"
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
                  className="w-full rounded-2xl border border-border p-3 text-xs font-mono text-foreground focus:border-google-blue focus:outline-none"
                />
              </div>

              {!csvPreview && (
                <Button
                  type="button"
                  onClick={handleParseCSV}
                  disabled={!csvRawText.trim()}
                  variant="secondary"
                  className="w-full"
                >
                  Validate & Check Duplicates
                </Button>
              )}

              {/* Preview results */}
              {csvPreview && (
                <div className="space-y-3 rounded-2xl bg-surface-subtle p-3.5 border border-border text-xs">
                  <div className="flex justify-between font-semibold">
                    <span>Validation Summary:</span>
                    <span className="text-google-green font-bold">
                      {csvPreview.validRows.length} valid rows
                    </span>
                  </div>

                  {csvPreview.duplicateCount > 0 && (
                    <div className="rounded-xl bg-google-yellow-subtle p-2 border border-google-yellow/30 text-google-yellow-hover flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{csvPreview.duplicateCount} duplicate contact(s) detected in database.</span>
                    </div>
                  )}

                  {csvPreview.invalidRows.length > 0 && (
                    <div className="rounded-xl bg-google-red-subtle p-2 border border-google-red/20 text-google-red space-y-1">
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
            <Button variant="ghost" onClick={() => setImportModalOpen(false)}>
              Cancel
            </Button>
            {csvPreview && (
              <Button
                onClick={handleExecuteImport}
                disabled={csvPreview.validRows.length === 0}
              >
                Import {csvPreview.validRows.length} Contacts
              </Button>
            )}
          </DialogFooter>
        </div>
      </Dialog>

      {/* Contact Detail Slide-over / Modal */}
      {detailContact && (
        <Dialog open={Boolean(detailContact)} onOpenChange={() => setDetailContact(null)}>
          <div>
            <DialogHeader>
              <div className="flex items-center space-x-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-blue text-google-blue font-bold text-base">
                  {detailContact.first_name[0]}
                </div>
                <div>
                  <DialogTitle>
                    {detailContact.first_name} {detailContact.last_name || ""}
                  </DialogTitle>
                  <DialogDescription>
                    {detailContact.company || "Individual Contact"}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 my-5 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-surface-subtle border border-border">
                <div>
                  <span className="text-foreground-secondary block">Phone</span>
                  <span className="font-semibold text-foreground font-mono">
                    {detailContact.phone}
                  </span>
                </div>
                <div>
                  <span className="text-foreground-secondary block">Email</span>
                  <span className="font-semibold text-foreground">
                    {detailContact.email || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-foreground-secondary block">Marketing Consent</span>
                  <div className="mt-0.5">{getConsentBadge(detailContact.consent_status)}</div>
                </div>
                <div>
                  <span className="text-foreground-secondary block">Source</span>
                  <span className="font-semibold text-foreground">
                    {detailContact.source || "Direct"}
                  </span>
                </div>
              </div>

              {detailContact.notes && (
                <div className="p-3 rounded-2xl bg-white border border-border">
                  <span className="font-semibold text-foreground block mb-1">Notes</span>
                  <p className="text-foreground-secondary leading-relaxed">
                    {detailContact.notes}
                  </p>
                </div>
              )}

              {/* Related Leads */}
              <div className="space-y-2">
                <span className="font-semibold text-foreground block">
                  Associated Leads
                </span>
                {crmStore
                  .getLeads(orgSlug)
                  .filter((l) => l.contact_id === detailContact.id)
                  .map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-white"
                    >
                      <div>
                        <span className="font-medium text-foreground block">
                          {lead.title}
                        </span>
                        <span className="text-[11px] text-foreground-secondary">
                          ₹{lead.estimated_value.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <Badge variant="default" className="uppercase text-[10px]">
                        {lead.stage}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>

            <DialogFooter>
              <Link href={`/app/${orgSlug}/inbox?contactId=${detailContact.id}`}>
                <Button variant="secondary" className="text-google-green font-medium flex items-center gap-1.5 border-google-green/20">
                  <MessageSquare className="h-4 w-4" />
                  Chat on WhatsApp
                </Button>
              </Link>
              <Button onClick={() => setDetailContact(null)}>Close</Button>
            </DialogFooter>
          </div>
        </Dialog>
      )}
    </div>
  );
}
