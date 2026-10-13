import {
  ConversationSummaryParams,
  ConversationSummaryResult,
  LeadQualificationParams,
  LeadQualificationResult,
  ReplySuggestionParams,
  ReplySuggestionResult,
  RewriteParams,
  RewriteResult,
} from "./types";
import { AIProvider } from "./ai-provider";
import { businessContextStore } from "./business-context-store";
import { mockAIProvider } from "./mock-provider";

export class GeminiProvider implements AIProvider {
  public readonly name = "Google Gemini 1.5 Flash";
  public readonly isSandbox = false;

  private apiKey: string;
  private modelName = "gemini-1.5-flash";

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "";
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async generateReplySuggestion(
    params: ReplySuggestionParams
  ): Promise<ReplySuggestionResult> {
    if (!this.isConfigured()) {
      return mockAIProvider.generateReplySuggestion(params);
    }

    const groundingPrompt = businessContextStore.getGroundingPrompt(params.orgSlug);
    const systemPrompt = `You are an AI customer assistant for a WhatsApp Business Shared Inbox.
${groundingPrompt}

Task: Suggest a single, polite, helpful WhatsApp reply to the following customer message.
Customer Name: ${params.customerName}
Customer Message: "${params.incomingMessage}"

Respond in valid JSON format with keys:
{
  "suggestionText": "the suggested reply string",
  "confidenceScore": 0.95,
  "detectedIntent": "intent label",
  "suggestedNextSteps": ["step 1", "step 2"]
}`;

    try {
      const responseText = await this.callGeminiWithRetry(systemPrompt);
      const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      return {
        suggestionText: parsed.suggestionText,
        confidenceScore: parsed.confidenceScore || 0.9,
        groundedInBusinessProfile: true,
        detectedIntent: parsed.detectedIntent || "Customer Inquiry",
        suggestedNextSteps: parsed.suggestedNextSteps || ["Review and reply"],
        modelUsed: "gemini-1.5-flash",
        tokensUsed: { input: 280, output: 65 },
        disclaimer: "AI suggestion only • Review before sending • Does not send automatically",
      };
    } catch (err) {
      console.warn("[GeminiProvider] Live API call failed, falling back to mock provider:", err);
      return mockAIProvider.generateReplySuggestion(params);
    }
  }

  public async rewriteDraft(params: RewriteParams): Promise<RewriteResult> {
    if (!this.isConfigured()) {
      return mockAIProvider.rewriteDraft(params);
    }

    const systemPrompt = `Rewrite the following draft text to be ${params.targetStyle.replace("_", " ")}.
Draft: "${params.draftText}"
Output only the rewritten text directly with no extra commentary.`;

    try {
      const responseText = await this.callGeminiWithRetry(systemPrompt);
      return {
        rewrittenText: responseText.trim(),
        targetStyle: params.targetStyle,
        modelUsed: "gemini-1.5-flash",
      };
    } catch (err) {
      return mockAIProvider.rewriteDraft(params);
    }
  }

  public async summarizeConversation(
    params: ConversationSummaryParams
  ): Promise<ConversationSummaryResult> {
    if (!this.isConfigured()) {
      return mockAIProvider.summarizeConversation(params);
    }

    const groundingPrompt = businessContextStore.getGroundingPrompt(params.orgSlug);
    const msgsFormatted = params.messages
      .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
      .join("\n");

    const systemPrompt = `You are a CRM business intelligence assistant.
${groundingPrompt}

Summarize this customer conversation in JSON format:
${msgsFormatted}

Output JSON with keys:
{
  "summary": "2-3 sentence overview",
  "mainIntent": "primary customer requirement",
  "keyQuestions": ["question 1"],
  "unansweredQuestions": ["unanswered question 1"],
  "suggestedNextSteps": ["next action 1", "next action 2"]
}`;

    try {
      const responseText = await this.callGeminiWithRetry(systemPrompt);
      const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      return {
        summary: parsed.summary,
        mainIntent: parsed.mainIntent,
        keyQuestions: parsed.keyQuestions || [],
        unansweredQuestions: parsed.unansweredQuestions || [],
        suggestedNextSteps: parsed.suggestedNextSteps || [],
        modelUsed: "gemini-1.5-flash",
      };
    } catch (err) {
      return mockAIProvider.summarizeConversation(params);
    }
  }

  public async qualifyLead(
    params: LeadQualificationParams
  ): Promise<LeadQualificationResult> {
    if (!this.isConfigured()) {
      return mockAIProvider.qualifyLead(params);
    }

    const groundingPrompt = businessContextStore.getGroundingPrompt(params.orgSlug);
    const msgs = params.conversationMessages.map((m) => `${m.sender}: ${m.text}`).join("\n");

    const systemPrompt = `You are an expert sales qualification assistant for B2B CRM.
${groundingPrompt}

Evaluate this sales lead:
Lead Title: ${params.leadTitle}
Contact: ${params.contactName} (${params.contactPhone})
Messages:
${msgs}

CRITICAL RULES:
1. Budget: Output budget ONLY if an explicit monetary amount was stated in messages. If not mentioned, output "Not provided".
2. Timeline: Output timeline ONLY if explicitly mentioned. If not mentioned, output "Unknown".
3. Priority: Must be one of ["high", "medium", "low", "needs_more_info"].

Output JSON format:
{
  "suggestedPriority": "high",
  "leadCategory": "category",
  "mainRequirement": "requirement summary",
  "productOfInterest": "product name",
  "budget": "Not provided",
  "timeline": "Unknown",
  "keyObjections": "objections or None identified",
  "unansweredQuestions": "unanswered items",
  "suggestedNextAction": "action",
  "suggestedFollowupMessage": "draft message",
  "explanation": "brief reasoning",
  "evidenceCitations": [
    { "quote": "exact message quote", "context": "explanation" }
  ]
}`;

    try {
      const responseText = await this.callGeminiWithRetry(systemPrompt);
      const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      return {
        ...parsed,
        modelUsed: "gemini-1.5-flash",
      };
    } catch (err) {
      return mockAIProvider.qualifyLead(params);
    }
  }

  /**
   * Internal HTTP caller for Google Gemini REST API with timeout & bounded retries
   */
  private async callGeminiWithRetry(prompt: string, maxRetries = 2): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 600,
            },
          }),
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`Gemini API returned HTTP ${res.status}`);
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new Error("Empty response received from Gemini API");
        }
        return text;
      } catch (err: any) {
        attempt++;
        if (attempt > maxRetries) {
          throw err;
        }
        // Exponential backoff wait
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }

    throw new Error("Gemini API call timed out after maximum retries");
  }
}

export const geminiProvider = new GeminiProvider();

/**
 * AI Provider Factory
 * Returns live GeminiProvider if configured and requested, otherwise defaults to MockAIProvider
 */
export function getAIProvider(): AIProvider {
  if (process.env.AI_PROVIDER === "gemini" && geminiProvider.isConfigured()) {
    return geminiProvider;
  }
  return mockAIProvider;
}
