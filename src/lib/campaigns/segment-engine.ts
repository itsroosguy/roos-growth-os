import { AudienceFilterCriteria, AudienceSegment } from "./types";
import { crmStore } from "../crm/crm-store";
import { Contact } from "@/types/crm";

export interface SegmentEvaluationResult {
  totalMatched: number;
  eligibleContacts: Contact[];
  suppressedOptOutContacts: Contact[];
  suppressedConsentContacts: Contact[];
  eligibleCount: number;
  suppressedOptOutCount: number;
  suppressedConsentCount: number;
}

class SegmentEngine {
  private savedSegments: Map<string, AudienceSegment[]> = new Map();

  constructor() {
    this.seedInitialSegments();
  }

  private seedInitialSegments() {
    const acmeOrg = "acme-corp";
    const betaOrg = "beta-logistics";

    const acmeSegments: AudienceSegment[] = [
      {
        id: "seg-101",
        organization_id: acmeOrg,
        name: "VIP Retail Clients",
        description: "High-value retail contacts with affirmative marketing consent",
        filter_criteria: {
          tags: ["VIP", "Retail"],
          consent_status: ["opted_in"],
        },
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: "seg-102",
        organization_id: acmeOrg,
        name: "All Opted-in Contacts",
        description: "Entire customer base with verified WhatsApp marketing consent",
        filter_criteria: {
          consent_status: ["opted_in"],
        },
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: "seg-103",
        organization_id: acmeOrg,
        name: "Inbound WhatsApp Inquiries",
        description: "Contacts acquired directly through WhatsApp inbound messaging",
        filter_criteria: {
          source: "WhatsApp Inbound",
          consent_status: ["opted_in"],
        },
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
    ];

    const betaSegments: AudienceSegment[] = [
      {
        id: "seg-beta-1",
        organization_id: betaOrg,
        name: "Logistics Fleet Contacts",
        description: "Beta logistics transport network",
        filter_criteria: {
          tags: ["Transport"],
          consent_status: ["opted_in"],
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.savedSegments.set(acmeOrg, acmeSegments);
    this.savedSegments.set("demo-corp", acmeSegments);
    this.savedSegments.set(betaOrg, betaSegments);
  }

  /**
   * Evaluates criteria against tenant contacts and enforces consent & opt-out rules
   */
  evaluateCriteria(
    orgSlug: string,
    criteria: AudienceFilterCriteria,
    isMarketing = true
  ): SegmentEvaluationResult {
    // 1. Fetch only tenant-owned, unarchived contacts (Tenant Isolation)
    const allContacts = crmStore.getContacts(orgSlug, false);
    const orgLeads = crmStore.getLeads(orgSlug);

    // 2. Filter contacts based on CRM criteria
    const matchedContacts = allContacts.filter((contact) => {
      // Tags filter (OR matching if multiple tags)
      if (criteria.tags && criteria.tags.length > 0) {
        const hasTag = criteria.tags.some((t) => contact.tags.includes(t));
        if (!hasTag) return false;
      }

      // Source filter
      if (criteria.source && criteria.source.trim()) {
        if (!contact.source || !contact.source.toLowerCase().includes(criteria.source.toLowerCase())) {
          return false;
        }
      }

      // Assigned team member
      if (criteria.assigned_to && criteria.assigned_to !== "all") {
        if (contact.assigned_to_name !== criteria.assigned_to) {
          return false;
        }
      }

      // Lead Stage filter
      if (criteria.lead_stages && criteria.lead_stages.length > 0) {
        const contactLeads = orgLeads.filter((l) => l.contact_id === contact.id);
        const hasMatchingStage = contactLeads.some((l) => criteria.lead_stages?.includes(l.stage));
        if (!hasMatchingStage) return false;
      }

      // Age Range filter ("18-25", "26-35", "36-50", "50+")
      if (criteria.age_range && criteria.age_range !== "all") {
        const age = contact.age || 30; // sensible default
        if (criteria.age_range === "18-25" && (age < 18 || age > 25)) return false;
        if (criteria.age_range === "26-35" && (age < 26 || age > 35)) return false;
        if (criteria.age_range === "36-50" && (age < 36 || age > 50)) return false;
        if (criteria.age_range === "50+" && age < 50) return false;
      }

      // Gender filter ("all", "male", "female", "other")
      if (criteria.gender && criteria.gender !== "all") {
        if (contact.gender && contact.gender !== criteria.gender) {
          return false;
        }
      }

      // Department filter ("all", "finance", "operations", "marketing", etc.)
      if (criteria.department && criteria.department !== "all") {
        if (contact.department && contact.department !== criteria.department) {
          return false;
        }
      }

      // Classification filter ("all", "ongoing_client", "new_opportunity")
      if (criteria.classification && criteria.classification !== "all") {
        if (contact.classification && contact.classification !== criteria.classification) {
          return false;
        }
      }

      // Creation date range
      if (criteria.created_after) {
        if (new Date(contact.created_at) < new Date(criteria.created_after)) {
          return false;
        }
      }
      if (criteria.created_before) {
        if (new Date(contact.created_at) > new Date(criteria.created_before)) {
          return false;
        }
      }

      return true;
    });

    // 3. Separate eligible from suppressed contacts (Consent & Opt-Out Safeguards)
    const eligibleContacts: Contact[] = [];
    const suppressedOptOutContacts: Contact[] = [];
    const suppressedConsentContacts: Contact[] = [];

    matchedContacts.forEach((contact) => {
      // Opt-Out suppression list: permanently excluded from all marketing & promotional outreach
      if (contact.consent_status === "opted_out") {
        suppressedOptOutContacts.push(contact);
        return;
      }

      // Marketing campaigns strictly require explicit affirmative opt-in
      if (isMarketing && contact.consent_status !== "opted_in") {
        suppressedConsentContacts.push(contact);
        return;
      }

      eligibleContacts.push(contact);
    });

    return {
      totalMatched: matchedContacts.length,
      eligibleContacts,
      suppressedOptOutContacts,
      suppressedConsentContacts,
      eligibleCount: eligibleContacts.length,
      suppressedOptOutCount: suppressedOptOutContacts.length,
      suppressedConsentCount: suppressedConsentContacts.length,
    };
  }

  // ============================================================================
  // SAVED SEGMENTS CRUD
  // ============================================================================
  getSavedSegments(orgSlug: string): AudienceSegment[] {
    return [...(this.savedSegments.get(orgSlug) || [])];
  }

  getSegmentById(orgSlug: string, segmentId: string): AudienceSegment | null {
    const list = this.savedSegments.get(orgSlug) || [];
    return list.find((s) => s.id === segmentId) || null;
  }

  saveSegment(
    orgSlug: string,
    data: Omit<AudienceSegment, "id" | "organization_id" | "created_at" | "updated_at">
  ): AudienceSegment {
    const list = this.savedSegments.get(orgSlug) || [];
    const newSeg: AudienceSegment = {
      ...data,
      id: `seg-${Date.now()}`,
      organization_id: orgSlug,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newSeg);
    this.savedSegments.set(orgSlug, list);
    return newSeg;
  }

  deleteSegment(orgSlug: string, segmentId: string): boolean {
    const list = this.savedSegments.get(orgSlug) || [];
    const filtered = list.filter((s) => s.id !== segmentId);
    this.savedSegments.set(orgSlug, filtered);
    return filtered.length < list.length;
  }
}

const globalSegmentEngine = (global as unknown as { __segmentEngine?: SegmentEngine });
export const segmentEngine = globalSegmentEngine.__segmentEngine ?? new SegmentEngine();
if (process.env.NODE_ENV !== "production") {
  globalSegmentEngine.__segmentEngine = segmentEngine;
}
