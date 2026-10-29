export type MeetingPlatform = "zoom" | "google_meet";
export type MeetingStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export interface Meeting {
  id: string;
  organization_id: string;
  title: string;
  contact_id?: string;
  contact_name: string;
  contact_phone?: string;
  contact_email?: string;
  start_time: string; // e.g. "11:30 AM" or ISO
  end_time: string;   // e.g. "12:15 PM" or ISO
  date: string;       // YYYY-MM-DD or ISO
  platform: MeetingPlatform;
  meeting_url?: string;
  status: MeetingStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface GoogleCalendarIntegration {
  connected: boolean;
  account_email: string;
  calendar_name: string;
  last_synced_at: string;
  auto_sync_whatsapp: boolean;
  two_way_sync: boolean;
}

export interface ZoomIntegration {
  connected: boolean;
  account_email: string;
  pmi_or_generated: "auto_generate" | "personal";
  auto_create_links: boolean;
  last_synced_at: string;
  default_duration_minutes: number;
}

export interface CalendarIntegrations {
  google_calendar: GoogleCalendarIntegration;
  zoom: ZoomIntegration;
}
