import { describe, it, expect, beforeEach } from "vitest";
import { calendarStore } from "../../src/lib/calendar/calendar-store";

describe("Calendar & Meetings Store", () => {
  const acmeOrg = "acme-corp";
  const betaOrg = "beta-logistics";

  it("seeds initial meetings for acme-corp with valid platforms", () => {
    const meetings = calendarStore.getMeetings(acmeOrg);
    expect(meetings.length).toBeGreaterThanOrEqual(3);

    const zoomMeetings = meetings.filter((m) => m.platform === "zoom");
    const meetMeetings = meetings.filter((m) => m.platform === "google_meet");

    expect(zoomMeetings.length).toBeGreaterThanOrEqual(1);
    expect(meetMeetings.length).toBeGreaterThanOrEqual(1);
    expect(zoomMeetings[0].meeting_url).toContain("zoom.us");
    expect(meetMeetings[0].meeting_url).toContain("meet.google.com");
  });

  it("enforces tenant isolation between organizations", () => {
    const acmeMeetings = calendarStore.getMeetings(acmeOrg);
    const betaMeetings = calendarStore.getMeetings(betaOrg);

    expect(acmeMeetings.length).toBeGreaterThan(0);
    expect(betaMeetings.length).toBe(0);
  });

  it("creates a new meeting with auto-generated Zoom link", () => {
    const newMeeting = calendarStore.createMeeting(acmeOrg, {
      title: "Test Zoom Walkthrough",
      contact_name: "Karan Johar",
      contact_phone: "+91 99999 88888",
      start_time: "6:00 PM",
      end_time: "6:30 PM",
      platform: "zoom",
    });

    expect(newMeeting.id).toBeDefined();
    expect(newMeeting.meeting_url).toContain("https://zoom.us/j/");
    expect(newMeeting.status).toBe("scheduled");

    const meetings = calendarStore.getMeetings(acmeOrg);
    expect(meetings.some((m) => m.id === newMeeting.id)).toBe(true);
  });

  it("creates a new meeting with auto-generated Google Meet link", () => {
    const newMeeting = calendarStore.createMeeting(acmeOrg, {
      title: "Test Meet Session",
      contact_name: "Maya Sarabhai",
      start_time: "7:00 PM",
      end_time: "7:45 PM",
      platform: "google_meet",
    });

    expect(newMeeting.id).toBeDefined();
    expect(newMeeting.meeting_url).toContain("https://meet.google.com/");
  });

  it("updates meeting status to completed", () => {
    const meetings = calendarStore.getMeetings(acmeOrg);
    const firstId = meetings[0].id;

    const updated = calendarStore.updateMeetingStatus(acmeOrg, firstId, "completed");
    expect(updated).not.toBeNull();
    expect(updated?.status).toBe("completed");
  });

  it("manages Google Calendar and Zoom integrations", () => {
    const integrations = calendarStore.getIntegrations(acmeOrg);
    expect(integrations.google_calendar.connected).toBe(true);
    expect(integrations.zoom.connected).toBe(true);

    calendarStore.updateGoogleCalendar(acmeOrg, { auto_sync_whatsapp: false });
    const updated = calendarStore.getIntegrations(acmeOrg);
    expect(updated.google_calendar.auto_sync_whatsapp).toBe(false);

    const syncRes = calendarStore.syncNow(acmeOrg);
    expect(syncRes.count).toBeGreaterThan(0);
    expect(syncRes.timestamp).toBeDefined();
  });
});
