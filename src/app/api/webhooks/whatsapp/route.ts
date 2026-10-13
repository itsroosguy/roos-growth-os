import { NextRequest, NextResponse } from "next/server";
import { whatsappStore } from "@/lib/whatsapp/whatsapp-store";
import { WhatsAppProviderFactory } from "@/lib/whatsapp/factory";

/**
 * GET: Meta Webhook Verification (Challenge-Response)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode") || "";
  const token = searchParams.get("hub.verify_token") || "";
  const challenge = searchParams.get("hub.challenge") || "";

  // Primary verify token from environment or fallback
  const expectedToken =
    process.env.META_WA_WEBHOOK_VERIFY_TOKEN || "acme_verified_token_secret_123";

  const liveProvider = WhatsAppProviderFactory.getProvider("live");
  const responseChallenge = liveProvider.verifyWebhook(
    mode,
    token,
    challenge,
    expectedToken
  );

  if (responseChallenge) {
    return new NextResponse(responseChallenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Forbidden: Invalid verify token" }, { status: 403 });
}

/**
 * POST: Meta Webhook Event Ingestion (Incoming messages & status updates)
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");
    const appSecret = process.env.META_WA_APP_SECRET;

    // Signature Validation (if live app secret is configured)
    if (appSecret) {
      const liveProvider = WhatsAppProviderFactory.getProvider("live");
      const isValid = liveProvider.validateSignature(rawBody, signature, appSecret);
      if (!isValid) {
        return NextResponse.json(
          { error: "Unauthorized: Invalid webhook signature" },
          { status: 401 }
        );
      }
    }

    const payload = JSON.parse(rawBody);

    // Meta Cloud API payload traversal
    const entries = payload?.entry || [];
    let processedCount = 0;
    let duplicateCount = 0;

    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const change of changes) {
        const value = change?.value;
        const orgSlug = "acme-corp"; // Default workspace for standalone single-tenant webhook or resolve from WABA ID

        // 1. Process Inbound Messages
        const messages = value?.messages || [];
        const contacts = value?.contacts || [];

        for (const msg of messages) {
          const wamid = msg.id;
          const fromPhone = `+${msg.from}`;
          const contactProfile = contacts.find((c: { wa_id: string }) => c.wa_id === msg.from);
          const senderName = contactProfile?.profile?.name || "Customer";

          let bodyText = "";
          if (msg.type === "text") {
            bodyText = msg.text?.body || "";
          } else if (msg.type === "button") {
            bodyText = msg.button?.text || "";
          } else {
            bodyText = `[Received ${msg.type} message]`;
          }

          const result = whatsappStore.processInboundMessage(orgSlug, {
            externalMessageId: wamid,
            fromPhone,
            senderName,
            body: bodyText,
            timestamp: msg.timestamp
              ? new Date(parseInt(msg.timestamp, 10) * 1000).toISOString()
              : new Date().toISOString(),
            isSimulated: false,
          });

          if (result.duplicate) {
            duplicateCount++;
          } else {
            processedCount++;
          }
        }

        // 2. Process Delivery Status Receipts
        const statuses = value?.statuses || [];
        for (const st of statuses) {
          const wamid = st.id;
          const metaStatus = st.status; // 'sent', 'delivered', 'read', 'failed'
          if (["sent", "delivered", "read", "failed"].includes(metaStatus)) {
            whatsappStore.updateMessageStatus(wamid, metaStatus as "sent" | "delivered" | "read" | "failed");
          }
        }
      }
    }

    return NextResponse.json({
      status: "success",
      processed: processedCount,
      duplicates: duplicateCount,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error processing webhook";
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
