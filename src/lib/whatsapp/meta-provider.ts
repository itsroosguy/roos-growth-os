import * as crypto from "crypto";
import {
  IWhatsAppProvider,
  WhatsAppMode,
  WhatsAppConnection,
  SendMessagePayload,
  SendMessageResult,
  WhatsAppTemplate,
} from "./types";

export class MetaCloudApiProvider implements IWhatsAppProvider {
  readonly mode: WhatsAppMode = "live";
  private readonly baseUrl = "https://graph.facebook.com/v20.0";

  /**
   * Sends an official WhatsApp message via Meta Cloud API
   */
  async sendMessage(
    payload: SendMessagePayload,
    connection: WhatsAppConnection
  ): Promise<SendMessageResult> {
    if (!connection.phone_number_id || !connection.access_token_encrypted) {
      return {
        success: false,
        status: "failed",
        errorCode: "CONFIG_ERROR",
        errorMessage: "Meta Phone Number ID or Access Token is missing.",
        isSimulated: false,
      };
    }

    const endpoint = `${this.baseUrl}/${connection.phone_number_id}/messages`;

    // Construct Meta Cloud API request body
    const requestBody: Record<string, unknown> = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: payload.toPhone.replace(/[^\d]/g, ""),
    };

    if (payload.type === "text") {
      requestBody.type = "text";
      requestBody.text = {
        preview_url: false,
        body: payload.text,
      };
    } else if (payload.type === "template") {
      requestBody.type = "template";
      const components: Array<{ type: string; parameters: Array<{ type: string; text: string }> }> = [];

      if (payload.templateVariables && Object.keys(payload.templateVariables).length > 0) {
        const parameters = Object.values(payload.templateVariables).map((val) => ({
          type: "text",
          text: val,
        }));
        components.push({
          type: "body",
          parameters,
        });
      }

      requestBody.template = {
        name: payload.templateName,
        language: {
          code: payload.templateLanguage || "en",
        },
        components: components.length > 0 ? components : undefined,
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${connection.access_token_encrypted}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorDetails = responseData?.error;
        return {
          success: false,
          status: "failed",
          errorCode: errorDetails?.code?.toString() || `${response.status}`,
          errorMessage: errorDetails?.message || "Failed to deliver message via Meta Cloud API.",
          isSimulated: false,
        };
      }

      const messageId = responseData?.messages?.[0]?.id;

      return {
        success: true,
        externalMessageId: messageId,
        status: "sent",
        isSimulated: false,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error contacting Meta Cloud API.";
      return {
        success: false,
        status: "failed",
        errorCode: "NETWORK_ERROR",
        errorMessage: msg,
        isSimulated: false,
      };
    }
  }

  /**
   * Verifies incoming webhook challenge during Meta webhook registration
   */
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

  /**
   * Validates Meta X-Hub-Signature-256 header using SHA-256 HMAC
   */
  validateSignature(
    rawBody: string,
    signatureHeader?: string | null,
    appSecret?: string | null
  ): boolean {
    if (!signatureHeader || !appSecret) {
      return false;
    }

    const parts = signatureHeader.split("=");
    if (parts.length !== 2 || parts[0] !== "sha256") {
      return false;
    }

    const expectedHash = crypto
      .createHmac("sha256", appSecret)
      .update(rawBody, "utf8")
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(parts[1], "hex"),
      Buffer.from(expectedHash, "hex")
    );
  }

  /**
   * Fetches official approved message templates from Meta Graph API
   */
  async fetchTemplates(connection: WhatsAppConnection): Promise<WhatsAppTemplate[]> {
    if (!connection.waba_id || !connection.access_token_encrypted) {
      return [];
    }

    const endpoint = `${this.baseUrl}/${connection.waba_id}/message_templates?status=APPROVED&limit=100`;

    try {
      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${connection.access_token_encrypted}`,
        },
      });

      if (!res.ok) return [];

      const data = await res.json();
      const metaTemplates = data?.data || [];

      return metaTemplates.map((t: { id: string; name: string; category: string; language: string; status: string; components?: Array<{ type: string; text?: string }> }) => {
        const bodyComp = t.components?.find((c) => c.type === "BODY");
        const bodyText = bodyComp?.text || "";

        return {
          id: t.id,
          meta_template_id: t.id,
          name: t.name,
          category: (t.category?.toLowerCase() || "utility") as WhatsAppTemplate["category"],
          language: t.language,
          status: t.status as WhatsAppTemplate["status"],
          body_content: bodyText,
          variables: bodyText.match(/{{\d+}}/g) || [],
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Verifies connectivity to the registered Meta phone number
   */
  async checkConnection(
    connection: WhatsAppConnection
  ): Promise<{ connected: boolean; error?: string }> {
    if (!connection.phone_number_id || !connection.access_token_encrypted) {
      return { connected: false, error: "Missing Phone Number ID or Access Token." };
    }

    try {
      const res = await fetch(`${this.baseUrl}/${connection.phone_number_id}`, {
        headers: {
          Authorization: `Bearer ${connection.access_token_encrypted}`,
        },
      });

      if (res.ok) {
        return { connected: true };
      }

      const errData = await res.json();
      return { connected: false, error: errData?.error?.message || "Connection check failed." };
    } catch (e: unknown) {
      return { connected: false, error: e instanceof Error ? e.message : "Network error" };
    }
  }
}
