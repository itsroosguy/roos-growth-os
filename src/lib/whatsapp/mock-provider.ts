import {
  IWhatsAppProvider,
  WhatsAppMode,
  WhatsAppConnection,
  SendMessagePayload,
  SendMessageResult,
  WhatsAppTemplate,
} from "./types";

export const MOCK_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "tpl-1",
    name: "welcome_greeting",
    category: "utility",
    language: "en",
    status: "APPROVED",
    body_content: "Hello {{1}}, welcome to {{2}}! How can we assist your business today?",
    variables: ["{{1}}", "{{2}}"],
    description: "Standard welcome message for new inquiries.",
  },
  {
    id: "tpl-2",
    name: "appointment_reminder",
    category: "utility",
    language: "en",
    status: "APPROVED",
    body_content: "Hi {{1}}, this is a quick reminder about your scheduled meeting on {{2}} at {{3}}.",
    variables: ["{{1}}", "{{2}}", "{{3}}"],
    description: "Scheduled meeting or follow-up reminder.",
  },
  {
    id: "tpl-3",
    name: "reengagement_followup",
    category: "marketing",
    language: "en",
    status: "APPROVED",
    body_content: "Hi {{1}}, we noticed you were interested in {{2}}. We have an exclusive update for you! Reply YES to learn more.",
    variables: ["{{1}}", "{{2}}"],
    description: "Permitted marketing template for re-engaging contacts outside the 24h window.",
  },
  {
    id: "tpl-4",
    name: "proposal_delivered",
    category: "utility",
    language: "en",
    status: "APPROVED",
    body_content: "Hello {{1}}, your quotation for {{2}} is ready for review. Please check your email or reply here with any questions.",
    variables: ["{{1}}", "{{2}}"],
    description: "Notification for commercial proposals sent.",
  },
];

export class MockWhatsAppProvider implements IWhatsAppProvider {
  readonly mode: WhatsAppMode = "mock";

  async sendMessage(
    payload: SendMessagePayload,
    connection: WhatsAppConnection
  ): Promise<SendMessageResult> {
    // Basic validation
    if (!payload.toPhone || payload.toPhone.replace(/[^\d]/g, "").length < 7) {
      return {
        success: false,
        status: "failed",
        errorCode: "131026",
        errorMessage: "Message undeliverable: Invalid recipient phone number.",
        isSimulated: true,
      };
    }

    if (payload.type === "text" && (!payload.text || payload.text.trim().length === 0)) {
      return {
        success: false,
        status: "failed",
        errorCode: "131000",
        errorMessage: "Message body cannot be empty.",
        isSimulated: true,
      };
    }

    if (payload.type === "template") {
      const template = MOCK_TEMPLATES.find((t) => t.name === payload.templateName);
      if (!template) {
        return {
          success: false,
          status: "failed",
          errorCode: "132000",
          errorMessage: `Template '${payload.templateName}' does not exist or is not approved.`,
          isSimulated: true,
        };
      }
    }

    // Generate mock WhatsApp message identifier (format: mock_wamid_<timestamp>_<random>)
    const mockWamid = `mock_wamid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      success: true,
      externalMessageId: mockWamid,
      status: "delivered", // Simulated immediate delivery
      isSimulated: true,
    };
  }

  verifyWebhook(
    mode: string,
    token: string,
    challenge: string,
    expectedToken: string
  ): string | null {
    if (mode === "subscribe" && token === expectedToken) {
      return challenge;
    }
    return null;
  }

  validateSignature(
    _rawBody: string,
    _signatureHeader?: string | null,
    _appSecret?: string | null
  ): boolean {
    // In mock mode, signature check passes by default for local simulation
    return true;
  }

  async fetchTemplates(_connection: WhatsAppConnection): Promise<WhatsAppTemplate[]> {
    return [...MOCK_TEMPLATES];
  }

  async checkConnection(_connection: WhatsAppConnection): Promise<{ connected: boolean; error?: string }> {
    return { connected: true };
  }
}
