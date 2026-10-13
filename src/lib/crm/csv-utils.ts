import { Contact, ConsentStatus } from "@/types/crm";

export interface CSVContactRow {
  first_name: string;
  last_name?: string;
  phone: string;
  email?: string;
  company?: string;
  tags?: string;
  source?: string;
  consent_status?: string;
}

export interface CSVValidationResult {
  validRows: Array<{
    first_name: string;
    last_name?: string;
    phone: string;
    email?: string;
    company?: string;
    tags: string[];
    source?: string;
    consent_status: ConsentStatus;
    isDuplicate: boolean;
    duplicateReason?: string;
  }>;
  invalidRows: Array<{
    rowNumber: number;
    rawData: Record<string, string>;
    errors: string[];
  }>;
  duplicateCount: number;
}

/**
 * Normalizes phone numbers (removes whitespace, dashes, braces)
 */
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "").trim();
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.length === 10) return `+91${cleaned}`; // Default to India country code if 10 digits
  return `+${cleaned}`;
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Parses raw CSV string into array of objects based on header row
 */
export function parseCSVText(csvText: string): Array<Record<string, string>> {
  const lines = csvText.trim().split(/\r\n|\n|\r/);
  if (lines.length < 2) return [];

  // Parse header
  const headers = parseCSVLine(lines[0]).map((h) =>
    h.toLowerCase().trim().replace(/[\s_-]+/g, "_")
  );

  const results: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ? values[index].trim() : "";
    });

    results.push(row);
  }

  return results;
}

/**
 * Parses a single CSV line honoring double quotes
 */
export function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        currentValue += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      values.push(currentValue);
      currentValue = "";
    } else {
      currentValue += char;
    }
  }
  values.push(currentValue);
  return values;
}

/**
 * Validates parsed CSV rows against existing contacts for duplicate detection
 */
export function validateAndDetectDuplicates(
  rows: Array<Record<string, string>>,
  existingContacts: Contact[]
): CSVValidationResult {
  const validRows: CSVValidationResult["validRows"] = [];
  const invalidRows: CSVValidationResult["invalidRows"] = [];
  let duplicateCount = 0;

  // Build lookup index for existing contacts
  const existingPhones = new Set<string>();
  const existingEmails = new Set<string>();

  existingContacts.forEach((c) => {
    if (c.phone) existingPhones.add(normalizePhone(c.phone));
    if (c.email) existingEmails.add(c.email.toLowerCase().trim());
  });

  rows.forEach((row, index) => {
    const errors: string[] = [];
    const rowNumber = index + 2; // +1 for 0-index, +1 for header

    // First name or full name is required
    const firstName = row.first_name || row.name || row.full_name;
    if (!firstName || firstName.trim().length === 0) {
      errors.push("Missing required First Name.");
    }

    // Phone is required for WhatsApp CRM
    const rawPhone = row.phone || row.mobile || row.phone_number;
    if (!rawPhone || rawPhone.trim().length === 0) {
      errors.push("Missing required Phone Number.");
    } else if (rawPhone.replace(/[^\d]/g, "").length < 7) {
      errors.push("Phone number is too short.");
    }

    // Email format check if provided
    const email = row.email?.trim();
    if (email && !isValidEmail(email)) {
      errors.push(`Invalid email format: ${email}`);
    }

    if (errors.length > 0) {
      invalidRows.push({
        rowNumber,
        rawData: row,
        errors,
      });
      return;
    }

    // Validate Consent Status
    let consentStatus: ConsentStatus = "pending";
    const rawConsent = (row.consent_status || row.consent || "").toLowerCase();
    if (rawConsent.includes("opted_in") || rawConsent === "yes" || rawConsent === "true") {
      consentStatus = "opted_in";
    } else if (rawConsent.includes("opted_out") || rawConsent === "no" || rawConsent === "false") {
      consentStatus = "opted_out";
    }

    const normalizedP = normalizePhone(rawPhone);
    const normalizedE = email ? email.toLowerCase() : undefined;

    // Duplicate detection
    let isDuplicate = false;
    let duplicateReason: string | undefined;

    if (existingPhones.has(normalizedP)) {
      isDuplicate = true;
      duplicateReason = `Phone ${normalizedP} already exists.`;
      duplicateCount++;
    } else if (normalizedE && existingEmails.has(normalizedE)) {
      isDuplicate = true;
      duplicateReason = `Email ${normalizedE} already exists.`;
      duplicateCount++;
    }

    // Parse tags
    const tagsStr = row.tags || "";
    const tags = tagsStr
      ? tagsStr.split(";").map((t) => t.trim()).filter(Boolean)
      : [];

    validRows.push({
      first_name: firstName.trim(),
      last_name: row.last_name?.trim() || undefined,
      phone: normalizedP,
      email: email || undefined,
      company: row.company?.trim() || undefined,
      tags,
      source: row.source?.trim() || "CSV Import",
      consent_status: consentStatus,
      isDuplicate,
      duplicateReason,
    });
  });

  return {
    validRows,
    invalidRows,
    duplicateCount,
  };
}

/**
 * Generates formatted CSV string from Contact records
 */
export function exportContactsToCSV(contacts: Contact[]): string {
  const headers = [
    "First Name",
    "Last Name",
    "Phone",
    "Email",
    "Company",
    "Tags",
    "Source",
    "Consent Status",
    "Notes",
    "Created At",
  ];

  const rows = contacts.map((c) => [
    c.first_name,
    c.last_name || "",
    c.phone,
    c.email || "",
    c.company || "",
    c.tags.join(";"),
    c.source || "",
    c.consent_status,
    (c.notes || "").replace(/\n/g, " "),
    c.created_at,
  ]);

  const csvLines = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((val) => {
          const str = String(val);
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(",")
    ),
  ];

  return csvLines.join("\n");
}
