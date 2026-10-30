import { describe, it, expect, beforeEach } from "vitest";
import { whatsappStore } from "../../src/lib/whatsapp/whatsapp-store";
import { teamStore } from "../../src/lib/team/team-store";
import { crmStore } from "../../src/lib/crm/crm-store";
import { ConversationStatus } from "../../src/lib/whatsapp/types";

describe("Milestone 5: Shared Inbox Unit Tests", () => {
  const orgSlug = "acme-corp";

  beforeEach(() => {
    // Reset/ensure clean state if needed
  });

  describe("1. Conversation Listing & Filtering", () => {
    it("should list conversations sorted by recent activity", () => {
      const convs = whatsappStore.getConversations(orgSlug);
      expect(convs.length).toBeGreaterThan(0);

      for (let i = 0; i < convs.length - 1; i++) {
        const t1 = new Date(convs[i].last_message_at).getTime();
        const t2 = new Date(convs[i + 1].last_message_at).getTime();
        expect(t1).toBeGreaterThanOrEqual(t2);
      }
    });

    it("should filter conversations by status (open, pending, resolved)", () => {
      const openConvs = whatsappStore.getFilteredConversations(orgSlug, { status: "open" });
      openConvs.forEach((c) => expect(c.status).toBe("open"));

      const pendingConvs = whatsappStore.getFilteredConversations(orgSlug, { status: "pending" });
      pendingConvs.forEach((c) => expect(c.status).toBe("pending"));

      const resolvedConvs = whatsappStore.getFilteredConversations(orgSlug, { status: "resolved" });
      resolvedConvs.forEach((c) => expect(c.status).toBe("resolved"));
    });

    it("should filter conversations by assignee and unassigned", () => {
      const unassigned = whatsappStore.getFilteredConversations(orgSlug, { assigneeId: "unassigned" });
      unassigned.forEach((c) => {
        expect(c.assigned_to_user_id).toBeFalsy();
        expect(c.assigned_to_name).toBeFalsy();
      });

      const assignedFounder = whatsappStore.getFilteredConversations(orgSlug, { assigneeId: "Workspace Founder" });
      assignedFounder.forEach((c) => {
        expect(c.assigned_to_name).toBe("Workspace Founder");
      });
    });

    it("should filter conversations by unreadOnly", () => {
      const unread = whatsappStore.getFilteredConversations(orgSlug, { unreadOnly: true });
      unread.forEach((c) => {
        expect(c.unread_count).toBeGreaterThan(0);
      });
    });

    it("should search conversations by customer name or phone", () => {
      const results = whatsappStore.getFilteredConversations(orgSlug, { search: "Aarav" });
      expect(results.length).toBeGreaterThan(0);
      results.forEach((c) => {
        expect(c.contact_name.toLowerCase()).toContain("aarav");
      });
    });
  });

  describe("2. Conversation Assignment & Reassignment", () => {
    it("should assign a conversation to a team member and record activity", () => {
      const conv = whatsappStore.getConversations(orgSlug)[0];
      const result = whatsappStore.assignConversation(
        orgSlug,
        conv.id,
        { userId: "user-102", name: "Operations Lead" },
        "Workspace Founder"
      );

      expect(result).not.toBeNull();
      expect(result?.assigned_to_user_id).toBe("user-102");
      expect(result?.assigned_to_name).toBe("Operations Lead");
      expect(result?.assigned_by_name).toBe("Workspace Founder");

      // Verify activity recorded
      const activities = whatsappStore.getConversationActivities(conv.id);
      const assignAct = activities.find((a) => a.type === "assigned");
      expect(assignAct).toBeDefined();
      expect(assignAct?.description).toContain("Assigned to Operations Lead");
    });

    it("should allow leaving a conversation unassigned and log activity", () => {
      const conv = whatsappStore.getConversations(orgSlug)[0];
      const result = whatsappStore.assignConversation(
        orgSlug,
        conv.id,
        { userId: null, name: null },
        "Operations Lead"
      );

      expect(result?.assigned_to_user_id).toBeNull();
      expect(result?.assigned_to_name).toBeNull();

      const activities = whatsappStore.getConversationActivities(conv.id);
      const unassignAct = activities.find((a) => a.type === "unassigned");
      expect(unassignAct).toBeDefined();
    });

    it("should forward conversation to a different department (sales to billing) with a handoff note", () => {
      const conv = whatsappStore.getConversations(orgSlug)[0];
      const result = whatsappStore.assignConversation(
        orgSlug,
        conv.id,
        { userId: "user-102", name: "Rohan Mehta", department: "billing" },
        "Praveen (Sales Lead)",
        "Customer needs GST invoice and payment link for the fleet proposal."
      );

      expect(result).not.toBeNull();
      expect(result?.assigned_to_user_id).toBe("user-102");
      expect(result?.assigned_to_name).toBe("Rohan Mehta");
      expect(result?.assigned_department).toBe("billing");
      expect(result?.handoff_note).toBe("Customer needs GST invoice and payment link for the fleet proposal.");

      // Verify internal note was posted in thread
      const messages = whatsappStore.getMessages(conv.id);
      const handoffNoteMsg = messages.find((m) => m.body.includes("Handoff Note • Forwarded to Rohan Mehta"));
      expect(handoffNoteMsg).toBeDefined();
      expect(handoffNoteMsg?.is_internal).toBe(true);
    });
  });

  describe("3. Status Lifecycle (Open, Pending, Resolved, Reopen)", () => {
    it("should transition status to pending and resolved, and store resolved timestamp", () => {
      const conv = whatsappStore.getConversations(orgSlug)[0];

      // Mark Pending
      whatsappStore.updateConversationStatus(orgSlug, conv.id, "pending", "Staff Agent");
      expect(conv.status).toBe("pending");

      // Mark Resolved
      whatsappStore.updateConversationStatus(orgSlug, conv.id, "resolved", "Staff Agent");
      expect(conv.status).toBe("resolved");
      expect(conv.resolved_at).toBeTruthy();

      // Reopen
      whatsappStore.updateConversationStatus(orgSlug, conv.id, "open", "Staff Agent");
      expect(conv.status).toBe("open");
      expect(conv.resolved_at).toBeNull();

      // Activity timeline verification
      const activities = whatsappStore.getConversationActivities(conv.id);
      const statusActivities = activities.filter((a) => a.type === "status_changed");
      expect(statusActivities.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("4. Unread & Read Tracking", () => {
    it("should mark conversation as read and reset unread_count to 0", () => {
      const conv = whatsappStore.getConversations(orgSlug)[0];
      conv.unread_count = 3;

      whatsappStore.markConversationRead(orgSlug, conv.id);
      expect(conv.unread_count).toBe(0);
    });

    it("should mark conversation as unread and increment unread_count", () => {
      const conv = whatsappStore.getConversations(orgSlug)[0];
      conv.unread_count = 0;

      whatsappStore.markConversationUnread(orgSlug, conv.id);
      expect(conv.unread_count).toBe(1);
    });
  });

  describe("5. Team Collaboration & Internal Notes Privacy", () => {
    it("should post internal notes flagged with is_internal: true and never send to WhatsApp customer", () => {
      const conv = whatsappStore.getConversations(orgSlug)[0];
      const initialMessageCount = whatsappStore.getMessages(conv.id).length;

      const noteMsg = whatsappStore.addInternalNote(
        orgSlug,
        conv.id,
        "Customer wants 15% bulk discount on annual subscription. Waiting on founder approval.",
        "Sales Agent",
        "user-103"
      );

      expect(noteMsg).not.toBeNull();
      expect(noteMsg?.is_internal).toBe(true);
      expect(noteMsg?.sender_type).toBe("internal_note");
      expect(noteMsg?.body).toContain("Customer wants 15% bulk discount");

      // Verify it was appended to message history
      const updatedMessages = whatsappStore.getMessages(conv.id);
      expect(updatedMessages.length).toBe(initialMessageCount + 1);

      // Verify it logged a note_added activity
      const activities = whatsappStore.getConversationActivities(conv.id);
      const noteAct = activities.find((a) => a.type === "note_added");
      expect(noteAct).toBeDefined();
      expect(noteAct?.description).toContain("Internal team note posted");
    });
  });
});
