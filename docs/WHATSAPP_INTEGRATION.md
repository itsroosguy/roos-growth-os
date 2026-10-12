# WhatsApp Integration & Provider Architecture

## 1. Meta Cloud API Compliance & Architecture

The application communicates **exclusively** via the official Meta WhatsApp Business Platform Cloud API (Graph API v20.0+).

> [!IMPORTANT]
> Unofficial WhatsApp Web scrapers, Puppeteer/Playwright browser automation, QR-session emulators, or reverse-engineered libraries are strictly prohibited. These risk permanent business account bans and violate WhatsApp terms of service.

---

## 2. Provider Abstraction

To ensure that the CRM functions end-to-end without requiring active Meta credentials during development and automated tests, messaging is decoupled behind the `IWhatsAppProvider` interface.

```typescript
export interface SendMessagePayload {
  toPhone: string;
  type: 'text' | 'template';
  text?: string;
  templateName?: string;
  templateLanguage?: string;
  templateVariables?: Record<string, string>;
}

export interface SendMessageResult {
  success: boolean;
  externalMessageId?: string; // Meta wamid or mock ID
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  errorCode?: string;
  errorMessage?: string;
}

export interface IWhatsAppProvider {
  sendMessage(payload: SendMessagePayload): Promise<SendMessageResult>;
  verifyWebhook(mode: string, token: string, challenge: string): string | null;
  processWebhookPayload(rawPayload: unknown, signatureHeader?: string): Promise<WebhookProcessingResult>;
  fetchTemplates(): Promise<WhatsAppTemplate[]>;
}
```

---

## 3. Mock WhatsApp Provider (Development & Testing)

The Mock Provider is built-in for local development and CI testing:
- **Incoming Simulation**: Injects mock incoming customer messages with configurable phone numbers, simulating inbound lead inquiries.
- **Outgoing Delivery Simulation**: Accepts outgoing messages and automatically transitions delivery states from `queued` -> `sent` -> `delivered` -> `read` over configurable simulated delays.
- **Error Simulation**: Emulates typical Meta failure modes:
  - Expired 24-hour customer service window error (`131047: Re-engagement message`)
  - Recipient not opt-in (`131026: Message undeliverable`)
  - Rate limit exceeded (`130429: Rate limit hit`)
  - Invalid template parameters
- **Clear Identification**: All mock messages are explicitly flagged with `is_mock: true` in metadata and carry a clear badge in the UI: `[MOCK / DEV MODE]`.

---

## 4. Meta Business Cloud API (Live Mode)

Live mode is activated only when an organization configures verified credentials in `whatsapp_connections`:
- `phone_number_id`: Meta Phone Number ID
- `waba_id`: WhatsApp Business Account ID
- `access_token`: System User Permanent Access Token with `whatsapp_business_messaging` and `whatsapp_business_management` permissions.
- `app_secret`: Meta App Secret (for HMAC SHA-256 webhook validation)

### Meta 24-Hour Customer Care Window Enforcement
Under Meta's Business Messaging Policy:
1. **Inside the 24-Hour Window**: When a customer sends a message, a 24-hour customer service window opens (`conversations.last_customer_message_at`). Businesses may send free-form text and media messages during this window.
2. **Outside the 24-Hour Window**: Free-form text messages are rejected by Meta API with error code `131047`. Outbound messaging is **only** permitted using pre-approved WhatsApp Message Templates (Utility, Marketing, or Authentication).
3. **Application Guardrail**:
   - The UI inbox displays a live countdown timer showing the remaining window time.
   - If `NOW() - last_customer_message_at > 24 hours`, the free-form text input is disabled and prompts the user to select an approved template.

---

## 5. Webhook Ingestion & Idempotency

### Webhook Verification (GET `/api/webhooks/whatsapp`)
Meta sends a GET request to verify the webhook URL:
```
hub.mode=subscribe&hub.challenge=1158201444&hub.verify_token=[YOUR_VERIFY_TOKEN]
```
The endpoint returns the exact `hub.challenge` string upon matching the token.

### Event Processing (POST `/api/webhooks/whatsapp`)
1. **Signature Validation**: Computes `HMAC-SHA256(rawBody, META_WA_APP_SECRET)` and verifies against `X-Hub-Signature-256`.
2. **Deduplication**: Meta webhooks guarantee at-least-once delivery and frequently resend events.
   - The unique message ID (`wamid.HBg...`) is checked against `messages.external_message_id`.
   - If already present, the event is acknowledged immediately with `HTTP 200 OK` without duplicating database rows or triggering automations twice.
3. **Customer Matching**: Inbound messages extract the sender's phone number, match or create a `contacts` record, update the `conversations` thread, and trigger any configured automation rules (`incoming_message`).
