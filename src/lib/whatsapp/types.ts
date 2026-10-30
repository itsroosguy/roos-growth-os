import { ConsentStatus } from "@/types/crm";

export type WhatsAppMode = "mock" | "live";

export type WhatsAppConnectionStatus = "disconnected" | "connected" | "error";

export type ConversationStatus = "open" | "pending" | "resolved" | "closed" | "snoozed";

export type MessageSenderType = "customer" | "staff" | "system" | "automation" | "internal_note";

export type MessageDeliveryStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export type MessageContentType = "text" | "template" | "image" | "document";

export type ActivityType =
  | "status_changed"
  | "assigned"
  | "unassigned"
  | "forwarded"
  | "lead_linked"
  | "lead_created"
  | "note_added"
  | "contact_updated";

export interface ConversationActivity {
  id: string;
  conversation_id: string;
  organization_id: string;
  type: ActivityType;
  description: string;
  actor_name: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface WhatsAppConnection {
  id: string;
  organization_id: string;
  mode: WhatsAppMode;
  phone_number_id?: string | null;
  waba_id?: string | null;
  display_phone_number?: string | null;
  display_name?: string | null;
  access_token_encrypted?: string | null;
  webhook_verify_token: string;
  status: WhatsAppConnectionStatus;
  error_message?: string | null;
  last_synced_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppConversation {
  id: string;
  organization_id: string;
  contact_id: string;
  contact_name: string;
  contact_phone: string;
  whatsapp_connection_id: string;
  last_message_text: string;
  last_message_at: string;
  last_customer_message_at?: string | null; // Critical for 24-hour Meta customer service window!
  status: ConversationStatus;
  assigned_to_user_id?: string | null;
  assigned_to_name?: string | null;
  assigned_department?: string | null;
  assigned_by_user_id?: string | null;
  assigned_by_name?: string | null;
  assigned_at?: string | null;
  handoff_note?: string | null;
  resolved_at?: string | null;
  lead_id?: string | null;
  lead_title?: string | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppMessage {
  id: string;
  organization_id: string;
  conversation_id: string;
  sender_type: MessageSenderType;
  sender_id?: string | null;
  sender_name?: string | null;
  external_message_id?: string | null; // Meta wamid or mock ID for deduplication
  message_type: MessageContentType;
  body: string;
  media_url?: string | null;
  template_name?: string | null;
  template_language?: string | null;
  status: MessageDeliveryStatus;
  error_message?: string | null;
  cost_units: number;
  is_simulated: boolean; // Flag to clearly mark simulated test messages
  is_internal?: boolean; // True for internal team notes that are never sent to customer
  created_at: string;
}

export interface WhatsAppTemplate {
  id: string;
  meta_template_id?: string;
  name: string;
  category: "marketing" | "utility" | "authentication";
  language: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  body_content: string;
  variables: string[]; // e.g. ["{{1}}", "{{2}}"]
  description?: string;
}

export interface SendMessagePayload {
  toPhone: string;
  type: "text" | "template";
  text?: string;
  templateName?: string;
  templateLanguage?: string;
  templateVariables?: Record<string, string>;
  staffUserId?: string;
  staffName?: string;
}

export interface SendMessageResult {
  success: boolean;
  externalMessageId?: string;
  status: MessageDeliveryStatus;
  errorCode?: string;
  errorMessage?: string;
  isSimulated: boolean;
}

export interface WebhookProcessingResult {
  success: boolean;
  processedCount: number;
  duplicateCount: number;
  error?: string;
}

export interface IWhatsAppProvider {
  mode: WhatsAppMode;
  sendMessage(payload: SendMessagePayload, connection: WhatsAppConnection): Promise<SendMessageResult>;
  verifyWebhook(mode: string, token: string, challenge: string, expectedToken: string): string | null;
  validateSignature(rawBody: string, signatureHeader?: string | null, appSecret?: string | null): boolean;
  fetchTemplates(connection: WhatsAppConnection): Promise<WhatsAppTemplate[]>;
  checkConnection(connection: WhatsAppConnection): Promise<{ connected: boolean; error?: string }>;
}
