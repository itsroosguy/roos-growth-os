import {
  Meeting,
  MeetingPlatform,
  MeetingStatus,
  CalendarIntegrations,
  GoogleCalendarIntegration,
  ZoomIntegration,
} from "./types";

class CalendarStore {
  private meetings: Map<string, Meeting[]> = new Map();
  private integrations: Map<string, CalendarIntegrations> = new Map();

  constructor() {
    this.seedInitialState();
  }

  private seedInitialState() {
    const acmeOrg = "acme-corp";
    const betaOrg = "beta-logistics";

    // 1. Acme Meetings Seed
    const acmeMeetings: Meeting[] = [
      {
        id: "meet-101",
        organization_id: acmeOrg,
        title: "Fleet Proposal Walkthrough",
        contact_id: "c-104",
        contact_name: "Sneha Reddy",
        contact_phone: "+91 98765 43213",
        contact_email: "sneha.reddy@acmefleet.in",
        start_time: "11:30 AM",
        end_time: "12:15 PM",
        date: new Date().toISOString().split("T")[0],
        platform: "zoom",
        meeting_url: "https://zoom.us/j/98765432101",
        status: "scheduled",
        notes: "Review custom pricing schedule, 20-agent seat setup, and SLA commitments.",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: "meet-102",
        organization_id: acmeOrg,
        title: "WhatsApp Cloud API Architecture",
        contact_id: "c-103",
        contact_name: "Rohan Mehta",
        contact_phone: "+91 98765 43212",
        contact_email: "rohan@mehtalogistics.com",
        start_time: "2:30 PM",
        end_time: "3:15 PM",
        date: new Date().toISOString().split("T")[0],
        platform: "google_meet",
        meeting_url: "https://meet.google.com/abc-roos-xyz",
        status: "scheduled",
        notes: "Technical architecture payload structure review for Meta Cloud webhook gateway.",
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        id: "meet-103",
        organization_id: acmeOrg,
        title: "Growth Bundle Contract Sign-off",
        contact_id: "c-101",
        contact_name: "Aarav Patel",
        contact_phone: "+91 98765 43210",
        contact_email: "aarav.patel@retailpulse.io",
        start_time: "5:00 PM",
        end_time: "5:30 PM",
        date: new Date().toISOString().split("T")[0],
        platform: "zoom",
        meeting_url: "https://zoom.us/j/98765432102",
        status: "scheduled",
        notes: "Final legal sign-off on 5-seat Growth tier onboarding and bank verification terms.",
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ];

    this.meetings.set(acmeOrg, acmeMeetings);
    this.meetings.set(betaOrg, []);

    // 2. Acme Integrations Seed
    const acmeIntegrations: CalendarIntegrations = {
      google_calendar: {
        connected: true,
        account_email: "praveen@roosstudiox.com",
        calendar_name: "Roos StudioX Primary Calendar",
        last_synced_at: new Date().toISOString(),
        auto_sync_whatsapp: true,
        two_way_sync: true,
      },
      zoom: {
        connected: true,
        account_email: "praveen@roosstudiox.com",
        pmi_or_generated: "auto_generate",
        auto_create_links: true,
        last_synced_at: new Date().toISOString(),
        default_duration_minutes: 30,
      },
    };

    const betaIntegrations: CalendarIntegrations = {
      google_calendar: {
        connected: false,
        account_email: "",
        calendar_name: "",
        last_synced_at: "",
        auto_sync_whatsapp: false,
        two_way_sync: false,
      },
      zoom: {
        connected: false,
        account_email: "",
        pmi_or_generated: "auto_generate",
        auto_create_links: false,
        last_synced_at: "",
        default_duration_minutes: 30,
      },
    };

    this.integrations.set(acmeOrg, acmeIntegrations);
    this.integrations.set(betaOrg, betaIntegrations);
  }

  // ============================================================================
  // MEETINGS CRUD
  // ============================================================================
  getMeetings(orgSlug: string): Meeting[] {
    const list = this.meetings.get(orgSlug) || [];
    return [...list];
  }

  getTodayMeetings(orgSlug: string): Meeting[] {
    const todayStr = new Date().toISOString().split("T")[0];
    const list = this.getMeetings(orgSlug);
    return list.filter((m) => m.date === todayStr && m.status !== "cancelled");
  }

  createMeeting(
    orgSlug: string,
    data: {
      title: string;
      contact_name: string;
      contact_phone?: string;
      contact_email?: string;
      contact_id?: string;
      start_time: string;
      end_time: string;
      date?: string;
      platform: MeetingPlatform;
      meeting_url?: string;
      notes?: string;
    }
  ): Meeting {
    const list = this.meetings.get(orgSlug) || [];
    const id = `meet-${Date.now()}`;
    const date = data.date || new Date().toISOString().split("T")[0];

    // Generate meeting URL if not supplied
    let meeting_url = data.meeting_url;
    if (!meeting_url) {
      if (data.platform === "zoom") {
        const randId = Math.floor(10000000000 + Math.random() * 90000000000);
        meeting_url = `https://zoom.us/j/${randId}`;
      } else {
        const chars = "abcdefghijklmnopqrstuvwxyz";
        const seg = (len: number) =>
          Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        meeting_url = `https://meet.google.com/${seg(3)}-${seg(4)}-${seg(3)}`;
      }
    }

    const newMeeting: Meeting = {
      id,
      organization_id: orgSlug,
      title: data.title,
      contact_name: data.contact_name,
      contact_phone: data.contact_phone,
      contact_email: data.contact_email,
      contact_id: data.contact_id,
      start_time: data.start_time,
      end_time: data.end_time,
      date,
      platform: data.platform,
      meeting_url,
      status: "scheduled",
      notes: data.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    list.push(newMeeting);
    // Keep sorted by start_time
    list.sort((a, b) => a.start_time.localeCompare(b.start_time));
    this.meetings.set(orgSlug, list);
    return newMeeting;
  }

  updateMeetingStatus(orgSlug: string, id: string, status: MeetingStatus): Meeting | null {
    const list = this.meetings.get(orgSlug) || [];
    const index = list.findIndex((m) => m.id === id);
    if (index === -1) return null;

    list[index] = {
      ...list[index],
      status,
      updated_at: new Date().toISOString(),
    };
    this.meetings.set(orgSlug, list);
    return list[index];
  }

  deleteMeeting(orgSlug: string, id: string): boolean {
    const list = this.meetings.get(orgSlug) || [];
    const initialLen = list.length;
    const filtered = list.filter((m) => m.id !== id);
    if (filtered.length !== initialLen) {
      this.meetings.set(orgSlug, filtered);
      return true;
    }
    return false;
  }

  // ============================================================================
  // INTEGRATIONS CRUD
  // ============================================================================
  getIntegrations(orgSlug: string): CalendarIntegrations {
    const existing = this.integrations.get(orgSlug);
    if (existing) return existing;

    const defaultIntegrations: CalendarIntegrations = {
      google_calendar: {
        connected: false,
        account_email: "",
        calendar_name: "",
        last_synced_at: "",
        auto_sync_whatsapp: false,
        two_way_sync: false,
      },
      zoom: {
        connected: false,
        account_email: "",
        pmi_or_generated: "auto_generate",
        auto_create_links: false,
        last_synced_at: "",
        default_duration_minutes: 30,
      },
    };
    this.integrations.set(orgSlug, defaultIntegrations);
    return defaultIntegrations;
  }

  updateGoogleCalendar(
    orgSlug: string,
    updates: Partial<GoogleCalendarIntegration>
  ): GoogleCalendarIntegration {
    const current = this.getIntegrations(orgSlug);
    const updated: GoogleCalendarIntegration = {
      ...current.google_calendar,
      ...updates,
      last_synced_at: new Date().toISOString(),
    };
    this.integrations.set(orgSlug, {
      ...current,
      google_calendar: updated,
    });
    return updated;
  }

  updateZoom(orgSlug: string, updates: Partial<ZoomIntegration>): ZoomIntegration {
    const current = this.getIntegrations(orgSlug);
    const updated: ZoomIntegration = {
      ...current.zoom,
      ...updates,
      last_synced_at: new Date().toISOString(),
    };
    this.integrations.set(orgSlug, {
      ...current,
      zoom: updated,
    });
    return updated;
  }

  syncNow(orgSlug: string): { count: number; timestamp: string } {
    const meetings = this.getTodayMeetings(orgSlug);
    const ts = new Date().toISOString();
    const current = this.getIntegrations(orgSlug);

    this.integrations.set(orgSlug, {
      google_calendar: {
        ...current.google_calendar,
        last_synced_at: ts,
      },
      zoom: {
        ...current.zoom,
        last_synced_at: ts,
      },
    });

    return {
      count: meetings.length,
      timestamp: ts,
    };
  }
}

export const calendarStore = new CalendarStore();
