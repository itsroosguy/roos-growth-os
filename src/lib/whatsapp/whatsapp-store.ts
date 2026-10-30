import {
  WhatsAppConnection,
  WhatsAppConversation,
  WhatsAppMessage,
  WhatsAppMode,
  WhatsAppTemplate,
  ConversationStatus,
  ConversationActivity,
  ActivityType,
  SendMessagePayload,
  SendMessageResult,
} from "./types";
import { crmStore } from "../crm/crm-store";
import { WhatsAppProviderFactory } from "./factory";
import { MOCK_TEMPLATES } from "./mock-provider";

export interface ConversationFilters {
  status?: ConversationStatus | "all";
  assigneeId?: string | "all" | "unassigned" | "me";
  currentUserId?: string;
  unreadOnly?: boolean;
  search?: string;
}

class WhatsAppStore {
  private connections: Map<string, WhatsAppConnection> = new Map();
  private conversations: Map<string, WhatsAppConversation[]> = new Map();
  private messages: Map<string, WhatsAppMessage[]> = new Map(); // conversation_id -> messages[]
  private activities: Map<string, ConversationActivity[]> = new Map(); // conversation_id -> activities[]
  private processedMessageIds: Set<string> = new Set(); // For webhook idempotency deduplication

  constructor() {
    this.seedInitialWhatsAppState();
  }

  private seedInitialWhatsAppState() {
    const acmeOrg = "acme-corp";
    const betaOrg = "beta-logistics";

    // 1. Acme Connection
    const acmeConn: WhatsAppConnection = {
      id: "wa-conn-acme",
      organization_id: acmeOrg,
      mode: "mock",
      phone_number_id: "mock_phone_101",
      waba_id: "mock_waba_101",
      display_phone_number: "+1 555 019 2831",
      display_name: "Acme Business Inbound",
      webhook_verify_token: "acme_verified_token_secret_123",
      status: "connected",
      last_synced_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 2. Beta Connection (Disconnected test state)
    const betaConn: WhatsAppConnection = {
      id: "wa-conn-beta",
      organization_id: betaOrg,
      mode: "mock",
      phone_number_id: null,
      waba_id: null,
      display_phone_number: null,
      display_name: "Beta Logistics Hub",
      webhook_verify_token: "beta_secret_token_verify_456",
      status: "disconnected",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.connections.set(acmeOrg, acmeConn);
    this.connections.set(betaOrg, betaConn);

    // 3. Seed Acme Conversations
    const conv1Id = "conv-101";
    const conv2Id = "conv-102";
    const conv3Id = "conv-103";
    const conv4Id = "conv-104";

    const conv5Id = "conv-105";
    const conv6Id = "conv-106";
    const conv7Id = "conv-107";
    const conv8Id = "conv-108";
    const conv9Id = "conv-109";
    const conv10Id = "conv-110";

    const acmeConversations: WhatsAppConversation[] = [
      {
        id: conv2Id,
        organization_id: acmeOrg,
        contact_id: "c-104",
        contact_name: "Sneha Reddy",
        contact_phone: "+91 98765 43213",
        whatsapp_connection_id: acmeConn.id,
        last_message_text: "Thanks, we will review the fleet proposal with our finance team.",
        last_message_at: new Date(Date.now() - 3600000 * 1).toISOString(),
        last_customer_message_at: new Date(Date.now() - 3600000 * 1).toISOString(),
        status: "pending",
        assigned_to_user_id: "user-101",
        assigned_to_name: "Praveen",
        assigned_department: "sales",
        assigned_by_name: "Workspace Founder",
        assigned_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        lead_id: "lead-204",
        lead_title: "Fleet Management Solution",
        unread_count: 1,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
      },
      {
        id: conv1Id,
        organization_id: acmeOrg,
        contact_id: "c-101",
        contact_name: "Aarav Patel",
        contact_phone: "+919876543210",
        whatsapp_connection_id: acmeConn.id,
        last_message_text: "Can you provide the quotation for the retail automation setup?",
        last_message_at: new Date(Date.now() - 3600000 * 1.2).toISOString(),
        last_customer_message_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        status: "open",
        assigned_to_user_id: "user-101",
        assigned_to_name: "Praveen",
        assigned_department: "sales",
        lead_id: "lead-201",
        lead_title: "Retail Automation Inquiry",
        unread_count: 1,
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 1.2).toISOString(),
      },
      {
        id: conv5Id,
        organization_id: acmeOrg,
        contact_id: "c-105",
        contact_name: "Rahul Mehta",
        contact_phone: "+91 98765 43214",
        whatsapp_connection_id: acmeConn.id,
        last_message_text: "Do you have a demo available this week?",
        last_message_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        last_customer_message_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        status: "open",
        assigned_to_user_id: "user-102",
        assigned_to_name: "Rohan Mehta",
        assigned_department: "billing",
        lead_title: "Mehta Enterprises Deployment",
        unread_count: 2,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: conv6Id,
        organization_id: acmeOrg,
        contact_id: "c-106",
        contact_name: "Priya Sharma",
        contact_phone: "+91 98765 43215",
        whatsapp_connection_id: acmeConn.id,
        last_message_text: "Great! Please share the pricing details.",
        last_message_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        last_customer_message_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        status: "open",
        assigned_to_user_id: "user-105",
        assigned_to_name: "Priya Sharma",
        assigned_department: "support",
        lead_title: "Sharma Distributors CRM",
        unread_count: 0,
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        id: conv7Id,
        organization_id: acmeOrg,
        contact_id: "c-107",
        contact_name: "Vikram Deshmukh",
        contact_phone: "+91 98765 43216",
        whatsapp_connection_id: acmeConn.id,
        last_message_text: "Can we schedule a call this week?",
        last_message_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        last_customer_message_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        status: "open",
        assigned_to_user_id: null,
        assigned_to_name: null,
        lead_title: "Deshmukh & Co. Integration",
        unread_count: 0,
        created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        id: conv8Id,
        organization_id: acmeOrg,
        contact_id: "c-108",
        contact_name: "Ananya Iyer",
        contact_phone: "+91 98765 43217",
        whatsapp_connection_id: acmeConn.id,
        last_message_text: "Thank you for the information!",
        last_message_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        last_customer_message_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        status: "resolved",
        assigned_to_user_id: "user-102",
        assigned_to_name: "Operations Lead",
        unread_count: 0,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: conv9Id,
        organization_id: acmeOrg,
        contact_id: "c-109",
        contact_name: "Karan Malhotra",
        contact_phone: "+91 98765 43218",
        whatsapp_connection_id: acmeConn.id,
        last_message_text: "Is the integration with our system possible?",
        last_message_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        last_customer_message_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        status: "open",
        assigned_to_user_id: "user-101",
        assigned_to_name: "Workspace Founder",
        unread_count: 0,
        created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: conv4Id,
        organization_id: acmeOrg,
        contact_id: "c-102",
        contact_name: "Neha Gupta",
        contact_phone: "+91 98765 43211",
        whatsapp_connection_id: acmeConn.id,
        last_message_text: "We are interested in your enterprise plan.",
        last_message_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        last_customer_message_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        status: "pending",
        assigned_to_user_id: null,
        assigned_to_name: null,
        unread_count: 0,
        created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: conv10Id,
        organization_id: acmeOrg,
        contact_id: "c-110",
        contact_name: "Arjun Patel",
        contact_phone: "+91 98765 43219",
        whatsapp_connection_id: acmeConn.id,
        last_message_text: "Please confirm the next steps.",
        last_message_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        last_customer_message_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        status: "open",
        assigned_to_user_id: "user-101",
        assigned_to_name: "Workspace Founder",
        unread_count: 0,
        created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ];

    this.conversations.set(acmeOrg, acmeConversations);

    // 4. Seed Messages for Acme Conversations
    const conv2Messages: WhatsAppMessage[] = [
      {
        id: "msg-201",
        organization_id: acmeOrg,
        conversation_id: conv2Id,
        sender_type: "customer",
        sender_name: "Sneha Reddy",
        external_message_id: "mock_wamid_inbound_sneha_1",
        message_type: "text",
        body: "Hi, I'm interested in your fleet management solution. Could you share more details about the pricing and onboarding process?",
        status: "read",
        cost_units: 0,
        is_simulated: true,
        is_internal: false,
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: "msg-202",
        organization_id: acmeOrg,
        conversation_id: conv2Id,
        sender_type: "staff",
        sender_name: "Workspace Founder",
        external_message_id: "mock_wamid_outbound_sneha_1",
        message_type: "text",
        body: "Hello Sneha! Thanks for reaching out. I'd be happy to share the details. Could you please let me know your fleet size and primary requirements so I can send the most relevant information?",
        status: "read",
        cost_units: 1,
        is_simulated: true,
        is_internal: false,
        created_at: new Date(Date.now() - 3600000 * 2.5).toISOString(),
      },
      {
        id: "msg-203",
        organization_id: acmeOrg,
        conversation_id: conv2Id,
        sender_type: "customer",
        sender_name: "Sneha Reddy",
        external_message_id: "mock_wamid_inbound_sneha_2",
        message_type: "text",
        body: "We currently have around 50 vehicles and are looking for real-time tracking, maintenance alerts and driver management. Also, do you have a demo available this week?",
        status: "read",
        cost_units: 0,
        is_simulated: true,
        is_internal: false,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: "msg-204",
        organization_id: acmeOrg,
        conversation_id: conv2Id,
        sender_type: "internal_note",
        sender_name: "Operations Lead",
        message_type: "text",
        body: "Interested in enterprise plan. Schedule product demo with sales team for this week. Focus on fleet tracking and maintenance features.",
        status: "delivered",
        cost_units: 0,
        is_simulated: false,
        is_internal: true,
        created_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      },
      {
        id: "msg-205",
        organization_id: acmeOrg,
        conversation_id: conv2Id,
        sender_type: "customer",
        sender_name: "Sneha Reddy",
        external_message_id: "mock_wamid_inbound_sneha_3",
        message_type: "text",
        body: "Thanks, we will review the fleet proposal with our finance team.",
        status: "delivered",
        cost_units: 0,
        is_simulated: true,
        is_internal: false,
        created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
      },
    ];

    const conv1Messages: WhatsAppMessage[] = [
      {
        id: "msg-101",
        organization_id: acmeOrg,
        conversation_id: conv1Id,
        sender_type: "customer",
        sender_name: "Aarav Patel",
        external_message_id: "mock_wamid_inbound_1",
        message_type: "text",
        body: "Hello, I am interested in automated inventory alerts for my retail stores.",
        status: "read",
        cost_units: 0,
        is_simulated: true,
        is_internal: false,
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: "msg-102",
        organization_id: acmeOrg,
        conversation_id: conv1Id,
        sender_type: "staff",
        sender_name: "Workspace Founder",
        external_message_id: "mock_wamid_outbound_1",
        message_type: "text",
        body: "Hi Aarav! Thanks for reaching out. We support automated inventory tracking and CRM alerts directly on WhatsApp.",
        status: "read",
        cost_units: 1,
        is_simulated: true,
        is_internal: false,
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: "msg-103",
        organization_id: acmeOrg,
        conversation_id: conv1Id,
        sender_type: "customer",
        sender_name: "Aarav Patel",
        external_message_id: "mock_wamid_inbound_2",
        message_type: "text",
        body: "Can you provide the quotation for the retail automation setup?",
        status: "delivered",
        cost_units: 0,
        is_simulated: true,
        is_internal: false,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: "msg-104",
        organization_id: acmeOrg,
        conversation_id: conv1Id,
        sender_type: "internal_note",
        sender_name: "Workspace Founder",
        message_type: "text",
        body: "Customer requested pricing breakdown for 3 store branches before EOD.",
        status: "delivered",
        cost_units: 0,
        is_simulated: false,
        is_internal: true,
        created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
      },
    ];


    const conv3Messages: WhatsAppMessage[] = [
      {
        id: "msg-301",
        organization_id: acmeOrg,
        conversation_id: conv3Id,
        sender_type: "customer",
        sender_name: "Rohan Mehta",
        external_message_id: "mock_wamid_inbound_rohan",
        message_type: "text",
        body: "Got the webhook setup guide, all questions resolved!",
        status: "read",
        cost_units: 0,
        is_simulated: true,
        is_internal: false,
        created_at: new Date(Date.now() - 3600000 * 7).toISOString(),
      },
      {
        id: "msg-302",
        organization_id: acmeOrg,
        conversation_id: conv3Id,
        sender_type: "staff",
        sender_name: "Workspace Founder",
        external_message_id: "mock_wamid_outbound_rohan",
        message_type: "text",
        body: "Glad to help Rohan! Reach out if you need anything else.",
        status: "read",
        cost_units: 1,
        is_simulated: true,
        is_internal: false,
        created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
    ];

    const conv4Messages: WhatsAppMessage[] = [
      {
        id: "msg-401",
        organization_id: acmeOrg,
        conversation_id: conv4Id,
        sender_type: "customer",
        sender_name: "Neha Gupta",
        external_message_id: "mock_wamid_inbound_neha",
        message_type: "text",
        body: "Hi team, we need a quote for 4 agent seats with custom WhatsApp templates.",
        status: "delivered",
        cost_units: 0,
        is_simulated: true,
        is_internal: false,
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
    ];

    this.messages.set(conv1Id, conv1Messages);
    this.messages.set(conv2Id, conv2Messages);
    this.messages.set(conv3Id, conv3Messages);
    this.messages.set(conv4Id, conv4Messages);

    // 5. Seed Activities
    const conv1Activities: ConversationActivity[] = [
      {
        id: "act-1",
        conversation_id: conv1Id,
        organization_id: acmeOrg,
        type: "assigned",
        description: "Assigned to Workspace Founder",
        actor_name: "Workspace Founder",
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        id: "act-2",
        conversation_id: conv1Id,
        organization_id: acmeOrg,
        type: "lead_linked",
        description: "Linked to deal Retail Automation Suite",
        actor_name: "Workspace Founder",
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: "act-3",
        conversation_id: conv1Id,
        organization_id: acmeOrg,
        type: "note_added",
        description: "Internal note added by Workspace Founder",
        actor_name: "Workspace Founder",
        created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
      },
    ];

    const conv2Activities: ConversationActivity[] = [
      {
        id: "act-201",
        conversation_id: conv2Id,
        organization_id: acmeOrg,
        type: "assigned",
        description: "Assigned to Operations Lead by Workspace Founder",
        actor_name: "Workspace Founder",
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: "act-202",
        conversation_id: conv2Id,
        organization_id: acmeOrg,
        type: "status_changed",
        description: "Status changed to Pending",
        actor_name: "Operations Lead",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ];

    const conv3Activities: ConversationActivity[] = [
      {
        id: "act-301",
        conversation_id: conv3Id,
        organization_id: acmeOrg,
        type: "status_changed",
        description: "Marked as Resolved by Workspace Founder",
        actor_name: "Workspace Founder",
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ];

    const conv4Activities: ConversationActivity[] = [
      {
        id: "act-401",
        conversation_id: conv4Id,
        organization_id: acmeOrg,
        type: "unassigned",
        description: "New inbound customer inquiry waiting for assignment",
        actor_name: "System",
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
    ];

    this.activities.set(conv1Id, conv1Activities);
    this.activities.set(conv2Id, conv2Activities);
    this.activities.set(conv3Id, conv3Activities);
    this.activities.set(conv4Id, conv4Activities);

    // 6. Seed Beta Logistics (Tenant Isolation Verification)
    const convBeta1Id = "conv-beta-101";
    const betaConversations: WhatsAppConversation[] = [
      {
        id: convBeta1Id,
        organization_id: betaOrg,
        contact_id: "c-beta-1",
        contact_name: "Karan Verma",
        contact_phone: "+919876543999",
        whatsapp_connection_id: betaConn.id,
        last_message_text: "Inquiry regarding logistics fleet integration.",
        last_message_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        last_customer_message_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        status: "open",
        assigned_to_user_id: "user-beta-1",
        assigned_to_name: "Logistics Manager",
        assigned_by_name: "Logistics Manager",
        lead_id: "lead-beta-1",
        lead_title: "Cold Chain Transport Setup",
        unread_count: 1,
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ];

    this.conversations.set(betaOrg, betaConversations);
    this.messages.set(convBeta1Id, [
      {
        id: "msg-beta-101",
        organization_id: betaOrg,
        conversation_id: convBeta1Id,
        sender_type: "customer",
        sender_name: "Karan Verma",
        external_message_id: "mock_wamid_beta_inbound_1",
        message_type: "text",
        body: "Inquiry regarding logistics fleet integration.",
        status: "delivered",
        cost_units: 0,
        is_simulated: true,
        is_internal: false,
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ]);

    this.processedMessageIds.add("mock_wamid_inbound_1");
    this.processedMessageIds.add("mock_wamid_outbound_1");
    this.processedMessageIds.add("mock_wamid_inbound_2");
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================
  getConnection(orgSlug: string): WhatsAppConnection {
    let conn = this.connections.get(orgSlug);
    if (!conn) {
      conn = {
        id: `wa-conn-${orgSlug}`,
        organization_id: orgSlug,
        mode: "mock",
        webhook_verify_token: `token_${orgSlug}_${Math.random().toString(36).substring(2, 9)}`,
        status: "disconnected",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.connections.set(orgSlug, conn);
    }
    return conn;
  }

  updateConnection(orgSlug: string, updates: Partial<WhatsAppConnection>): WhatsAppConnection {
    const conn = this.getConnection(orgSlug);
    const updated = {
      ...conn,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.connections.set(orgSlug, updated);
    return updated;
  }

  // ============================================================================
  // CONVERSATIONS
  // ============================================================================
  getConversations(orgSlug: string): WhatsAppConversation[] {
    return [...(this.conversations.get(orgSlug) || [])].sort(
      (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    );
  }

  getFilteredConversations(orgSlug: string, filters: ConversationFilters): WhatsAppConversation[] {
    let list = this.getConversations(orgSlug);

    if (filters.status && filters.status !== "all") {
      list = list.filter((c) => c.status === filters.status);
    }

    if (filters.assigneeId && filters.assigneeId !== "all") {
      if (filters.assigneeId === "unassigned") {
        list = list.filter((c) => !c.assigned_to_user_id && !c.assigned_to_name);
      } else if (filters.assigneeId === "me" && filters.currentUserId) {
        list = list.filter((c) => c.assigned_to_user_id === filters.currentUserId);
      } else {
        list = list.filter(
          (c) => c.assigned_to_user_id === filters.assigneeId || c.assigned_to_name === filters.assigneeId
        );
      }
    }

    if (filters.unreadOnly) {
      list = list.filter((c) => c.unread_count > 0);
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.contact_name.toLowerCase().includes(q) ||
          c.contact_phone.includes(q) ||
          c.last_message_text.toLowerCase().includes(q)
      );
    }

    return list;
  }

  getConversationById(orgSlug: string, conversationId: string): WhatsAppConversation | null {
    const list = this.conversations.get(orgSlug) || [];
    return list.find((c) => c.id === conversationId) || null;
  }

  getOrCreateConversationForContact(orgSlug: string, contactId: string): WhatsAppConversation {
    const list = this.conversations.get(orgSlug) || [];
    const existing = list.find((c) => c.contact_id === contactId);
    if (existing) return existing;

    const contact = crmStore.getContactById(orgSlug, contactId);
    if (!contact) {
      throw new Error(`Contact ${contactId} not found in ${orgSlug}`);
    }

    const conn = this.getConnection(orgSlug);
    const newConv: WhatsAppConversation = {
      id: `conv-${Date.now()}`,
      organization_id: orgSlug,
      contact_id: contact.id,
      contact_name: `${contact.first_name} ${contact.last_name || ""}`.trim(),
      contact_phone: contact.phone,
      whatsapp_connection_id: conn.id,
      last_message_text: "Conversation started",
      last_message_at: new Date().toISOString(),
      last_customer_message_at: null, // No incoming customer message yet
      status: "open",
      unread_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    list.unshift(newConv);
    this.conversations.set(orgSlug, list);
    return newConv;
  }

  // ============================================================================
  // CONVERSATION STATUS & ASSIGNMENT (MILESTONE 5)
  // ============================================================================
  updateConversationStatus(
    orgSlug: string,
    conversationId: string,
    status: ConversationStatus,
    actorName = "Staff Member"
  ): WhatsAppConversation | null {
    const conv = this.getConversationById(orgSlug, conversationId);
    if (!conv) return null;

    const oldStatus = conv.status;
    conv.status = status;
    const nowIso = new Date().toISOString();
    conv.updated_at = nowIso;

    if (status === "resolved") {
      conv.resolved_at = nowIso;
    } else if (oldStatus === "resolved") {
      conv.resolved_at = null;
    }

    this.addActivity(orgSlug, conversationId, {
      type: "status_changed",
      description: `Status changed from ${oldStatus.toUpperCase()} to ${status.toUpperCase()} by ${actorName}`,
      actor_name: actorName,
      metadata: { oldStatus, newStatus: status },
    });

    return conv;
  }

  assignConversation(
    orgSlug: string,
    conversationId: string,
    assignee: { userId: string | null; name: string | null; department?: string | null },
    actorName = "Staff Member",
    handoffNote?: string | null
  ): WhatsAppConversation | null {
    const conv = this.getConversationById(orgSlug, conversationId);
    if (!conv) return null;

    const nowIso = new Date().toISOString();
    conv.assigned_to_user_id = assignee.userId;
    conv.assigned_to_name = assignee.name;
    conv.assigned_department = assignee.department || null;
    conv.assigned_by_name = actorName;
    conv.assigned_at = nowIso;
    conv.updated_at = nowIso;
    if (handoffNote) {
      conv.handoff_note = handoffNote;
    }

    const deptStr = assignee.department ? ` (${assignee.department.charAt(0).toUpperCase() + assignee.department.slice(1)})` : "";
    const desc = assignee.name
      ? `Assigned to ${assignee.name}${deptStr} by ${actorName}`
      : `Unassigned by ${actorName}`;

    this.addActivity(orgSlug, conversationId, {
      type: assignee.name ? "assigned" : "unassigned",
      description: desc,
      actor_name: actorName,
      metadata: {
        assigneeId: assignee.userId,
        assigneeName: assignee.name,
        department: assignee.department,
        handoffNote: handoffNote || null,
      },
    });

    if (handoffNote && handoffNote.trim()) {
      this.addInternalNote(
        orgSlug,
        conversationId,
        `🔀 Handoff Note • Forwarded to ${assignee.name || "Colleague"}${deptStr}:\n"${handoffNote.trim()}"`,
        actorName,
        "user-current"
      );
    }

    return conv;
  }

  markConversationRead(orgSlug: string, conversationId: string): boolean {
    const conv = this.getConversationById(orgSlug, conversationId);
    if (!conv) return false;
    conv.unread_count = 0;
    conv.updated_at = new Date().toISOString();
    return true;
  }

  markConversationUnread(orgSlug: string, conversationId: string): boolean {
    const conv = this.getConversationById(orgSlug, conversationId);
    if (!conv) return false;
    conv.unread_count = Math.max(1, (conv.unread_count || 0) + 1);
    conv.updated_at = new Date().toISOString();
    return true;
  }

  linkConversationLead(
    orgSlug: string,
    conversationId: string,
    leadId: string | null,
    actorName = "Staff Member"
  ): WhatsAppConversation | null {
    const conv = this.getConversationById(orgSlug, conversationId);
    if (!conv) return null;

    if (leadId) {
      const lead = crmStore.getLeadById(orgSlug, leadId);
      if (!lead) return null;
      conv.lead_id = lead.id;
      conv.lead_title = lead.title;
      this.addActivity(orgSlug, conversationId, {
        type: "lead_linked",
        description: `Linked to deal "${lead.title}" by ${actorName}`,
        actor_name: actorName,
        metadata: { leadId: lead.id, leadTitle: lead.title },
      });
    } else {
      conv.lead_id = null;
      conv.lead_title = null;
      this.addActivity(orgSlug, conversationId, {
        type: "lead_linked",
        description: `Unlinked from deal by ${actorName}`,
        actor_name: actorName,
      });
    }

    conv.updated_at = new Date().toISOString();
    return conv;
  }

  // ============================================================================
  // TEAM COLLABORATION & INTERNAL NOTES (MILESTONE 5)
  // ============================================================================
  addInternalNote(
    orgSlug: string,
    conversationId: string,
    noteText: string,
    staffName = "Staff Member",
    staffUserId?: string
  ): WhatsAppMessage | null {
    const conv = this.getConversationById(orgSlug, conversationId);
    if (!conv || !noteText.trim()) return null;

    const nowIso = new Date().toISOString();
    const noteMsg: WhatsAppMessage = {
      id: `msg-note-${Date.now()}`,
      organization_id: orgSlug,
      conversation_id: conversationId,
      sender_type: "internal_note",
      sender_id: staffUserId,
      sender_name: staffName,
      message_type: "text",
      body: noteText.trim(),
      status: "delivered", // Delivered internally
      cost_units: 0,
      is_simulated: false,
      is_internal: true, // Guarantees this is completely hidden from external dispatch
      created_at: nowIso,
    };

    const msgs = this.messages.get(conversationId) || [];
    msgs.push(noteMsg);
    this.messages.set(conversationId, msgs);

    conv.last_message_text = `[Internal Note] ${noteText.trim()}`;
    conv.last_message_at = nowIso;
    conv.updated_at = nowIso;

    this.addActivity(orgSlug, conversationId, {
      type: "note_added",
      description: `Internal team note posted by ${staffName}`,
      actor_name: staffName,
    });

    return noteMsg;
  }

  getConversationActivities(conversationId: string): ConversationActivity[] {
    return [...(this.activities.get(conversationId) || [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  addActivity(
    orgSlug: string,
    conversationId: string,
    activity: {
      type: ActivityType;
      description: string;
      actor_name: string;
      metadata?: Record<string, unknown>;
    }
  ): ConversationActivity {
    const list = this.activities.get(conversationId) || [];
    const newAct: ConversationActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      organization_id: orgSlug,
      conversation_id: conversationId,
      type: activity.type,
      description: activity.description,
      actor_name: activity.actor_name,
      metadata: activity.metadata,
      created_at: new Date().toISOString(),
    };
    list.unshift(newAct);
    this.activities.set(conversationId, list);
    return newAct;
  }

  // ============================================================================
  // 24-HOUR CUSTOMER SERVICE WINDOW CHECK
  // ============================================================================
  isWithin24HourWindow(conversation: WhatsAppConversation): {
    allowed: boolean;
    hoursRemaining: number;
    expiredAt?: string;
  } {
    if (!conversation.last_customer_message_at) {
      return { allowed: false, hoursRemaining: 0 };
    }

    const lastMsgTime = new Date(conversation.last_customer_message_at).getTime();
    const expiryTime = lastMsgTime + 24 * 60 * 60 * 1000;
    const now = Date.now();
    const diffMs = expiryTime - now;

    if (diffMs <= 0) {
      return {
        allowed: false,
        hoursRemaining: 0,
        expiredAt: new Date(expiryTime).toISOString(),
      };
    }

    const hoursRemaining = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
    return {
      allowed: true,
      hoursRemaining,
    };
  }

  // ============================================================================
  // MESSAGES
  // ============================================================================
  getMessages(conversationId: string): WhatsAppMessage[] {
    return [...(this.messages.get(conversationId) || [])].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  /**
   * Outbound message dispatcher with Meta policy checks
   */
  async sendOutboundMessage(
    orgSlug: string,
    conversationId: string,
    payload: SendMessagePayload
  ): Promise<SendMessageResult> {
    const conv = this.getConversationById(orgSlug, conversationId);
    if (!conv) {
      return {
        success: false,
        status: "failed",
        errorCode: "NOT_FOUND",
        errorMessage: "Conversation not found.",
        isSimulated: false,
      };
    }

    const contact = crmStore.getContactById(orgSlug, conv.contact_id);

    // Consent Check: if customer explicitly opted out, reject outbound sends
    if (contact && contact.consent_status === "opted_out") {
      return {
        success: false,
        status: "failed",
        errorCode: "OPT_OUT_BLOCKED",
        errorMessage: "Customer has opted out of WhatsApp messages. Re-engagement is prohibited by Meta policy.",
        isSimulated: false,
      };
    }

    // 24-Hour Customer Service Window check
    const windowCheck = this.isWithin24HourWindow(conv);
    if (payload.type === "text" && !windowCheck.allowed) {
      return {
        success: false,
        status: "failed",
        errorCode: "131047",
        errorMessage: "Meta Policy Violation: Customer service window (24h) has expired. You must select an approved Message Template to initiate contact.",
        isSimulated: false,
      };
    }

    const conn = this.getConnection(orgSlug);
    if (conn.status === "disconnected") {
      return {
        success: false,
        status: "failed",
        errorCode: "DISCONNECTED",
        errorMessage: "WhatsApp connection is disconnected for this organisation.",
        isSimulated: conn.mode === "mock",
      };
    }

    const provider = WhatsAppProviderFactory.getProvider(conn.mode);
    const result = await provider.sendMessage(payload, conn);

    if (result.success) {
      // Store message
      let bodyText = payload.text || "";
      if (payload.type === "template") {
        const tpl = MOCK_TEMPLATES.find((t) => t.name === payload.templateName);
        bodyText = tpl ? tpl.body_content : `[Template: ${payload.templateName}]`;
        if (payload.templateVariables) {
          Object.entries(payload.templateVariables).forEach(([key, val]) => {
            bodyText = bodyText.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val);
          });
        }
      }

      const newMsg: WhatsAppMessage = {
        id: `msg-${Date.now()}`,
        organization_id: orgSlug,
        conversation_id: conversationId,
        sender_type: "staff",
        sender_name: payload.staffName || "Staff Member",
        external_message_id: result.externalMessageId,
        message_type: payload.type,
        body: bodyText,
        template_name: payload.templateName,
        status: result.status,
        cost_units: 1,
        is_simulated: result.isSimulated,
        is_internal: false,
        created_at: new Date().toISOString(),
      };

      const msgs = this.messages.get(conversationId) || [];
      msgs.push(newMsg);
      this.messages.set(conversationId, msgs);

      // Update conversation last message
      conv.last_message_text = bodyText;
      conv.last_message_at = newMsg.created_at;
      conv.updated_at = newMsg.created_at;
    }

    return result;
  }

  /**
   * Inbound message processor with deduplication & contact matching
   */
  processInboundMessage(
    orgSlug: string,
    data: {
      externalMessageId: string;
      fromPhone: string;
      senderName?: string;
      body: string;
      timestamp?: string;
      isSimulated?: boolean;
    }
  ): { success: boolean; duplicate: boolean; message?: WhatsAppMessage } {
    // 1. Idempotency Check
    if (this.processedMessageIds.has(data.externalMessageId)) {
      return { success: true, duplicate: true };
    }

    this.processedMessageIds.add(data.externalMessageId);

    // 2. Contact Matching: find existing contact or auto-create
    const allContacts = crmStore.getContacts(orgSlug, true);
    let contact = allContacts.find((c) => {
      const cleanPhone = c.phone.replace(/[^\d]/g, "");
      const incomingClean = data.fromPhone.replace(/[^\d]/g, "");
      return cleanPhone === incomingClean || cleanPhone.endsWith(incomingClean) || incomingClean.endsWith(cleanPhone);
    });

    if (!contact) {
      // Auto-create new contact from inbound inquiry
      contact = crmStore.createContact(orgSlug, {
        first_name: data.senderName || "WhatsApp Customer",
        phone: data.fromPhone,
        source: "WhatsApp Inbound",
        tags: ["Inbound"],
        is_archived: false,
        consent_status: "opted_in", // Inbound message establishes affirmative communication
        consent_opted_in_at: new Date().toISOString(),
      });
    }

    // 3. Find or create conversation
    const conv = this.getOrCreateConversationForContact(orgSlug, contact.id);

    // 3.1 Compliance Safeguard: Check for opt-out keywords (STOP, UNSUBSCRIBE, OPTOUT)
    const upperText = data.body.trim().toUpperCase();
    if (upperText === "STOP" || upperText === "UNSUBSCRIBE" || upperText === "OPTOUT") {
      crmStore.updateContact(orgSlug, contact.id, {
        consent_status: "opted_out",
        consent_opted_out_at: new Date().toISOString(),
      });
      this.addActivity(orgSlug, conv.id, {
        type: "contact_updated",
        description: `Customer replied ${upperText}: Marketing consent automatically updated to OPTED OUT`,
        actor_name: "Compliance Guard",
      });
    }

    // 4. Update conversation metadata & open 24h window
    const nowIso = data.timestamp || new Date().toISOString();
    conv.last_message_text = data.body;
    conv.last_message_at = nowIso;
    conv.last_customer_message_at = nowIso; // Opens 24h Meta Customer Service Window!
    conv.unread_count += 1;
    conv.updated_at = nowIso;

    // 5. Store inbound message
    const newMsg: WhatsAppMessage = {
      id: `msg-${Date.now()}`,
      organization_id: orgSlug,
      conversation_id: conv.id,
      sender_type: "customer",
      sender_name: contact.first_name,
      external_message_id: data.externalMessageId,
      message_type: "text",
      body: data.body,
      status: "delivered",
      cost_units: 0,
      is_simulated: data.isSimulated ?? true,
      is_internal: false,
      created_at: nowIso,
    };

    const msgs = this.messages.get(conv.id) || [];
    msgs.push(newMsg);
    this.messages.set(conv.id, msgs);

    return { success: true, duplicate: false, message: newMsg };
  }

  /**
   * Update message delivery status from Meta webhook receipt
   */
  updateMessageStatus(
    externalMessageId: string,
    newStatus: WhatsAppMessage["status"]
  ): boolean {
    let updated = false;
    this.messages.forEach((msgs: WhatsAppMessage[]) => {
      const target = msgs.find((m: WhatsAppMessage) => m.external_message_id === externalMessageId);
      if (target) {
        target.status = newStatus;
        updated = true;
      }
    });
    return updated;
  }
}

// Global singleton instance for local runtime
const globalWAStore = (global as unknown as { __whatsappStore?: WhatsAppStore });
export const whatsappStore = globalWAStore.__whatsappStore ?? new WhatsAppStore();
if (process.env.NODE_ENV !== "production") {
  globalWAStore.__whatsappStore = whatsappStore;
}
