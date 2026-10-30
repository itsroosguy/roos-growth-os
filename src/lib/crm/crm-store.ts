import {
  Contact,
  Lead,
  Task,
  ActivityItem,
  LeadStage,
  DashboardMetrics,
  ConsentStatus,
} from "@/types/crm";

// In-memory tenant store maintaining state across the running local session
class CRMStore {
  private contacts: Map<string, Contact[]> = new Map();
  private leads: Map<string, Lead[]> = new Map();
  private tasks: Map<string, Task[]> = new Map();
  private activities: Map<string, ActivityItem[]> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const acmeOrg = "acme-corp";
    const betaOrg = "beta-logistics";

    // 1. Seed Acme Technologies Contacts
    const acmeContacts: Contact[] = [
      {
        id: "c-101",
        organization_id: acmeOrg,
        first_name: "Aarav",
        last_name: "Patel",
        phone: "+919876543210",
        email: "aarav@patelenterprises.in",
        company: "Patel Enterprises",
        role: "Founder & CEO",
        department: "executive",
        classification: "new_opportunity",
        age: 32,
        gender: "male",
        city: "Mumbai",
        tags: ["VIP", "Retail"],
        source: "WhatsApp Inbound",
        notes: "Interested in bulk inventory management automation.",
        is_archived: false,
        assigned_to_name: "Workspace Founder",
        consent_status: "opted_in",
        consent_opted_in_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: "c-102",
        organization_id: acmeOrg,
        first_name: "Neha",
        last_name: "Gupta",
        phone: "+919876543211",
        email: "neha@guptastores.com",
        company: "Gupta Global Stores",
        role: "Marketing Director",
        department: "marketing",
        classification: "new_opportunity",
        age: 28,
        gender: "female",
        city: "Delhi",
        tags: ["Wholesale"],
        source: "Website Form",
        notes: "Requested a live CRM demo for 4 team members.",
        is_archived: false,
        assigned_to_name: "Operations Lead",
        consent_status: "opted_in",
        consent_opted_in_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: "c-103",
        organization_id: acmeOrg,
        first_name: "Rohan",
        last_name: "Mehta",
        phone: "+919876543212",
        email: "rohan@mehtasolutions.io",
        company: "Mehta Tech Solutions",
        role: "CTO & Architecture Lead",
        department: "technology",
        classification: "new_opportunity",
        age: 36,
        gender: "male",
        city: "Bengaluru",
        tags: ["Tech", "Partner"],
        source: "Referral",
        notes: "Evaluating WhatsApp API integration for automated alerts.",
        is_archived: false,
        assigned_to_name: "Workspace Founder",
        consent_status: "pending",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: "c-104",
        organization_id: acmeOrg,
        first_name: "Sneha",
        last_name: "Reddy",
        phone: "+919876543213",
        email: "sneha@reddycorp.in",
        company: "Reddy Logistics",
        role: "Operations Head",
        department: "operations",
        classification: "new_opportunity",
        age: 34,
        gender: "female",
        city: "Hyderabad",
        tags: ["Fleet", "Enterprise", "Hot Lead"],
        source: "WhatsApp Inbound",
        notes: "Needs automated order tracking via WhatsApp.",
        is_archived: false,
        assigned_to_name: "Operations Lead",
        consent_status: "opted_in",
        consent_opted_in_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        id: "c-105",
        organization_id: acmeOrg,
        first_name: "Vikram",
        last_name: "Deshmukh",
        phone: "+919876543214",
        email: "vikram@deshmukhindustries.com",
        company: "Deshmukh Industries",
        role: "Finance Head & CFO",
        department: "finance",
        classification: "ongoing_client",
        age: 45,
        gender: "male",
        city: "Pune",
        tags: ["Enterprise"],
        source: "Cold Outreach",
        notes: "Contract signed, onboarding scheduled.",
        is_archived: false,
        assigned_to_name: "Workspace Founder",
        consent_status: "opted_in",
        consent_opted_in_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      },
      {
        id: "c-106",
        organization_id: acmeOrg,
        first_name: "Ananya",
        last_name: "Iyer",
        phone: "+919876543215",
        email: "ananya@iyerdesigns.com",
        company: "Iyer Creative Studio",
        tags: ["Design"],
        source: "Website Form",
        notes: "Looking for budget tier CRM.",
        is_archived: true, // Archived contact test
        assigned_to_name: "Operations Lead",
        consent_status: "opted_out",
        consent_opted_out_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      },
    ];

    // 2. Seed Acme Leads across stages
    const acmeLeads: Lead[] = [
      {
        id: "lead-201",
        organization_id: acmeOrg,
        contact_id: "c-101",
        contact_name: "Aarav Patel",
        contact_phone: "+919876543210",
        title: "Retail Automation Contract",
        stage: "new",
        source: "WhatsApp Inbound",
        assigned_to_name: "Workspace Founder",
        estimated_value: 65000,
        currency: "INR",
        next_follow_up_at: new Date(Date.now() + 86400000 * 1).toISOString(),
        notes: "Initial inquiry received via WhatsApp.",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: "lead-202",
        organization_id: acmeOrg,
        contact_id: "c-102",
        contact_name: "Neha Gupta",
        contact_phone: "+919876543211",
        title: "Multi-Store CRM Deployment",
        stage: "contacted",
        source: "Website Form",
        assigned_to_name: "Operations Lead",
        estimated_value: 120000,
        currency: "INR",
        next_follow_up_at: new Date(Date.now() + 86400000 * 2).toISOString(),
        notes: "Spoke on phone, scheduled live demo.",
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        id: "lead-203",
        organization_id: acmeOrg,
        contact_id: "c-103",
        contact_name: "Rohan Mehta",
        contact_phone: "+919876543212",
        title: "WhatsApp API Gateway Setup",
        stage: "qualified",
        source: "Referral",
        assigned_to_name: "Workspace Founder",
        estimated_value: 85000,
        currency: "INR",
        next_follow_up_at: new Date(Date.now() - 86400000 * 1).toISOString(), // Overdue follow-up!
        notes: "Requirement document reviewed, qualified for proposal.",
        created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: "lead-204",
        organization_id: acmeOrg,
        contact_id: "c-104",
        contact_name: "Sneha Reddy",
        contact_phone: "+919876543213",
        title: "Fleet Management Solution",
        stage: "proposal",
        source: "WhatsApp Inbound",
        assigned_to_name: "Operations Lead",
        estimated_value: 150000,
        currency: "INR",
        next_follow_up_at: new Date().toISOString(), // Due today!
        notes: "Commercial proposal sent, waiting for CFO sign-off.",
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        id: "lead-205",
        organization_id: acmeOrg,
        contact_id: "c-105",
        contact_name: "Vikram Deshmukh",
        contact_phone: "+919876543214",
        title: "Enterprise Annual Subscription",
        stage: "won",
        source: "Cold Outreach",
        assigned_to_name: "Workspace Founder",
        estimated_value: 240000,
        currency: "INR",
        notes: "Deal closed successfully! Annual prepayment confirmed.",
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: "lead-206",
        organization_id: acmeOrg,
        contact_id: "c-106",
        contact_name: "Ananya Iyer",
        contact_phone: "+919876543215",
        title: "Studio Starter Package",
        stage: "lost",
        lost_reason: "Budget constraints",
        source: "Website Form",
        assigned_to_name: "Operations Lead",
        estimated_value: 25000,
        currency: "INR",
        notes: "Selected a free alternative for now.",
        created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ];

    // 3. Seed Acme Tasks & Follow-ups
    const acmeTasks: Task[] = [
      {
        id: "t-301",
        organization_id: acmeOrg,
        lead_id: "lead-204",
        lead_title: "Fleet Management Solution",
        contact_id: "c-104",
        contact_name: "Sneha Reddy",
        assigned_to_name: "Operations Lead",
        title: "Follow up on proposal feedback",
        description: "Call Sneha regarding the proposal sent on Monday.",
        due_date: new Date().toISOString(), // Due Today
        priority: "high",
        status: "todo",
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        id: "t-302",
        organization_id: acmeOrg,
        lead_id: "lead-203",
        lead_title: "WhatsApp API Gateway Setup",
        contact_id: "c-103",
        contact_name: "Rohan Mehta",
        assigned_to_name: "Workspace Founder",
        title: "Send technical architecture draft",
        description: "Provide sample payload structure for Meta Cloud API.",
        due_date: new Date(Date.now() - 86400000 * 1).toISOString(), // Overdue
        priority: "medium",
        status: "todo",
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: "t-303",
        organization_id: acmeOrg,
        lead_id: "lead-202",
        lead_title: "Multi-Store CRM Deployment",
        contact_id: "c-102",
        contact_name: "Neha Gupta",
        assigned_to_name: "Operations Lead",
        title: "Conduct Zoom product walkthrough",
        description: "Demo the shared inbox and contacts CSV import.",
        due_date: new Date(Date.now() + 86400000 * 2).toISOString(), // Upcoming
        priority: "medium",
        status: "todo",
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        id: "t-304",
        organization_id: acmeOrg,
        lead_id: "lead-205",
        lead_title: "Enterprise Annual Subscription",
        contact_id: "c-105",
        contact_name: "Vikram Deshmukh",
        assigned_to_name: "Workspace Founder",
        title: "Send onboarding invoice and welcome message",
        description: "Confirm payment and send WhatsApp onboarding guide.",
        due_date: new Date(Date.now() - 86400000 * 2).toISOString(),
        priority: "low",
        status: "completed",
        completed_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ];

    // 4. Seed Beta Logistics (Independent Org B for isolation verification)
    const betaContacts: Contact[] = [
      {
        id: "c-beta-1",
        organization_id: betaOrg,
        first_name: "Karan",
        last_name: "Verma",
        phone: "+919876543999",
        email: "karan@transquick.in",
        company: "TransQuick Cargo",
        tags: ["Transport"],
        source: "Direct",
        notes: "Beta logistics client.",
        is_archived: false,
        consent_status: "opted_in",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const betaLeads: Lead[] = [
      {
        id: "lead-beta-1",
        organization_id: betaOrg,
        contact_id: "c-beta-1",
        contact_name: "Karan Verma",
        contact_phone: "+919876543999",
        title: "Cold Chain Transport Setup",
        stage: "new",
        estimated_value: 90000,
        currency: "INR",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.contacts.set(acmeOrg, acmeContacts);
    this.leads.set(acmeOrg, acmeLeads);
    this.tasks.set(acmeOrg, acmeTasks);
    // Also bind demo-corp workspace
    this.contacts.set("demo-corp", acmeContacts);
    this.leads.set("demo-corp", acmeLeads);
    this.tasks.set("demo-corp", acmeTasks);

    this.contacts.set(betaOrg, betaContacts);
    this.leads.set(betaOrg, betaLeads);
    this.tasks.set(betaOrg, []);
  }

  // ============================================================================
  // CONTACTS OPERATIONS (TENANT-ISOLATED)
  // ============================================================================
  getContacts(orgSlug: string, includeArchived = false): Contact[] {
    const list = this.contacts.get(orgSlug) || [];
    if (includeArchived) return [...list];
    return list.filter((c) => !c.is_archived);
  }

  getContactById(orgSlug: string, contactId: string): Contact | null {
    const list = this.contacts.get(orgSlug) || [];
    return list.find((c) => c.id === contactId) || null;
  }

  createContact(orgSlug: string, data: Omit<Contact, "id" | "organization_id" | "created_at" | "updated_at">): Contact {
    const list = this.contacts.get(orgSlug) || [];
    const newContact: Contact = {
      ...data,
      id: `c-${Date.now()}`,
      organization_id: orgSlug,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newContact);
    this.contacts.set(orgSlug, list);
    return newContact;
  }

  updateContact(orgSlug: string, contactId: string, updates: Partial<Contact>): Contact | null {
    const list = this.contacts.get(orgSlug) || [];
    const index = list.findIndex((c) => c.id === contactId);
    if (index === -1) return null;

    const updated = {
      ...list[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    list[index] = updated;
    this.contacts.set(orgSlug, list);
    return updated;
  }

  archiveContact(orgSlug: string, contactId: string, archive = true): boolean {
    const contact = this.updateContact(orgSlug, contactId, { is_archived: archive });
    return Boolean(contact);
  }

  deleteContact(orgSlug: string, contactId: string): boolean {
    const list = this.contacts.get(orgSlug) || [];
    const filtered = list.filter((c) => c.id !== contactId);
    this.contacts.set(orgSlug, filtered);
    return filtered.length < list.length;
  }

  // ============================================================================
  // LEADS OPERATIONS (TENANT-ISOLATED)
  // ============================================================================
  getLeads(orgSlug: string): Lead[] {
    const raw = this.leads.get(orgSlug) || [];
    const now = Date.now();
    return raw.map((l) => {
      if (l.id === "lead-204" && l.next_follow_up_at) {
        return { ...l, next_follow_up_at: new Date(now).toISOString() };
      }
      if (l.id === "lead-203" && l.next_follow_up_at) {
        return { ...l, next_follow_up_at: new Date(now - 86400000).toISOString() };
      }
      return l;
    });
  }

  getLeadById(orgSlug: string, leadId: string): Lead | null {
    const list = this.leads.get(orgSlug) || [];
    return list.find((l) => l.id === leadId) || null;
  }

  createLead(orgSlug: string, data: Omit<Lead, "id" | "organization_id" | "created_at" | "updated_at">): Lead {
    const list = this.leads.get(orgSlug) || [];
    const newLead: Lead = {
      ...data,
      id: `lead-${Date.now()}`,
      organization_id: orgSlug,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newLead);
    this.leads.set(orgSlug, list);
    return newLead;
  }

  updateLead(
    orgSlug: string,
    leadId: string,
    updates: Partial<Omit<Lead, "id" | "organization_id" | "created_at">>
  ): Lead | null {
    const list = this.leads.get(orgSlug) || [];
    const index = list.findIndex((l) => l.id === leadId);
    if (index === -1) return null;

    const updated: Lead = {
      ...list[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    list[index] = updated;
    this.leads.set(orgSlug, list);
    return updated;
  }

  updateLeadStage(orgSlug: string, leadId: string, newStage: LeadStage, lostReason?: string): Lead | null {
    const list = this.leads.get(orgSlug) || [];
    const index = list.findIndex((l) => l.id === leadId);
    if (index === -1) return null;

    const updated: Lead = {
      ...list[index],
      stage: newStage,
      lost_reason: newStage === "lost" ? lostReason || "Not specified" : null,
      updated_at: new Date().toISOString(),
    };
    list[index] = updated;
    this.leads.set(orgSlug, list);
    return updated;
  }

  deleteLead(orgSlug: string, leadId: string): boolean {
    const list = this.leads.get(orgSlug) || [];
    const filtered = list.filter((l) => l.id !== leadId);
    this.leads.set(orgSlug, filtered);
    return filtered.length < list.length;
  }

  // ============================================================================
  // TASKS & FOLLOW-UPS (TENANT-ISOLATED)
  // ============================================================================
  getTasks(orgSlug: string): Task[] {
    const raw = this.tasks.get(orgSlug) || [];
    const now = Date.now();
    return raw.map((t) => {
      if (t.id === "t-301") {
        return { ...t, due_date: new Date(now).toISOString() };
      }
      if (t.id === "t-302") {
        return { ...t, due_date: new Date(now - 86400000).toISOString() };
      }
      if (t.id === "t-303") {
        return { ...t, due_date: new Date(now + 86400000 * 2).toISOString() };
      }
      return t;
    });
  }

  createTask(orgSlug: string, data: Omit<Task, "id" | "organization_id" | "created_at" | "updated_at">): Task {
    const list = this.tasks.get(orgSlug) || [];
    const newTask: Task = {
      ...data,
      id: `t-${Date.now()}`,
      organization_id: orgSlug,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newTask);
    this.tasks.set(orgSlug, list);
    return newTask;
  }

  updateTaskStatus(orgSlug: string, taskId: string, status: Task["status"]): Task | null {
    const list = this.tasks.get(orgSlug) || [];
    const index = list.findIndex((t) => t.id === taskId);
    if (index === -1) return null;

    const updated: Task = {
      ...list[index],
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };
    list[index] = updated;
    this.tasks.set(orgSlug, list);
    return updated;
  }

  // ============================================================================
  // REAL-TIME DASHBOARD METRICS CALCULATION
  // ============================================================================
  getMetrics(orgSlug: string): DashboardMetrics {
    const contacts = this.getContacts(orgSlug);
    const leads = this.getLeads(orgSlug);
    const tasks = this.getTasks(orgSlug);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const stages: Record<LeadStage, { count: number; value: number }> = {
      new: { count: 0, value: 0 },
      contacted: { count: 0, value: 0 },
      qualified: { count: 0, value: 0 },
      proposal: { count: 0, value: 0 },
      won: { count: 0, value: 0 },
      lost: { count: 0, value: 0 },
    };

    let pipelineValue = 0;

    leads.forEach((l) => {
      stages[l.stage].count += 1;
      stages[l.stage].value += l.estimated_value;
      if (l.stage !== "lost") {
        pipelineValue += l.estimated_value;
      }
    });

    const openFollowUps = tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled").length;
    const overdueFollowUps = tasks.filter((t) => {
      if (t.status === "completed" || t.status === "cancelled") return false;
      const dueDate = new Date(t.due_date);
      return dueDate < startOfToday;
    }).length;

    // Conversion rate: Won deals / (Won + Lost) or Won deals / Total leads
    const closedDeals = stages.won.count + stages.lost.count;
    const conversionRate = closedDeals > 0
      ? Math.round((stages.won.count / closedDeals) * 100)
      : leads.length > 0
      ? Math.round((stages.won.count / leads.length) * 100)
      : 0;

    return {
      totalContacts: contacts.length,
      newLeads: stages.new.count,
      leadsByStage: stages,
      openFollowUps,
      overdueFollowUps,
      wonDeals: stages.won,
      lostDeals: stages.lost,
      pipelineValue,
      conversionRate,
    };
  }
}

// Global singleton instance preserved in memory across API / page reloads
const globalStore = (global as unknown as { __crmStore?: CRMStore });
export const crmStore = globalStore.__crmStore ?? new CRMStore();
if (process.env.NODE_ENV !== "production") {
  globalStore.__crmStore = crmStore;
}
