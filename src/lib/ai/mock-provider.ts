import {
  ConversationSummaryParams,
  ConversationSummaryResult,
  EvidenceCitation,
  LeadPriorityRecommendation,
  LeadQualificationParams,
  LeadQualificationResult,
  ReplySuggestionParams,
  ReplySuggestionResult,
  RewriteParams,
  RewriteResult,
} from "./types";
import { AIProvider } from "./ai-provider";
import { businessContextStore } from "./business-context-store";

export class MockAIProvider implements AIProvider {
  public readonly name = "Mock AI Sandbox";
  public readonly isSandbox = true;

  public async generateReplySuggestion(
    params: ReplySuggestionParams
  ): Promise<ReplySuggestionResult> {
    const profile = businessContextStore.getProfile(params.orgSlug);
    const msg = (params.incomingMessage || "").toLowerCase();

    let suggestionText = "";
    let detectedIntent = "General Enquiry";
    const suggestedNextSteps: string[] = [];

    // Prompt injection guard check
    if (msg.includes("ignore previous instructions") || msg.includes("system override")) {
      return {
        suggestionText: `Hello ${params.customerName}, how can we assist you with our services today?`,
        confidenceScore: 0.99,
        groundedInBusinessProfile: true,
        detectedIntent: "Standard Service Greeting",
        suggestedNextSteps: ["Ask how we can assist with services"],
        modelUsed: "mock-gemini-1.5-flash-sandbox",
        tokensUsed: { input: 95, output: 25 },
        disclaimer: "AI suggestion only • Review before sending • Does not send automatically",
      };
    }

    if (msg.includes("price") || msg.includes("cost") || msg.includes("plan") || msg.includes("rate")) {
      detectedIntent = "Pricing Enquiry";
      suggestionText = `Hi ${params.customerName}! Here are our standard plans for ${profile.business_name}: ${profile.pricing_info}. Would you like me to schedule a quick 10-minute walkthrough for your team?`;
      suggestedNextSteps.push("Send pricing sheet", "Schedule product demo");
    } else if (msg.includes("fleet") || msg.includes("proposal") || msg.includes("finance")) {
      detectedIntent = "Proposal Review Follow-up";
      suggestionText = `Hi ${params.customerName}! Sounds great, take your time reviewing the proposal with your finance team. Should I check back with you on Friday, or would you like me to clarify any line items before then?`;
      suggestedNextSteps.push("Set follow-up reminder for Friday", "Share unit economics breakdown");
    } else if (msg.includes("quotation") || msg.includes("quote") || msg.includes("retail") || msg.includes("setup")) {
      detectedIntent = "Quotation & Scope Delivery";
      suggestionText = `Hi ${params.customerName}! I've prepared the commercial quotation and hardware spec sheet for your setup. Would you prefer I share the PDF directly here on WhatsApp, or hop on a brief 10-minute walkthrough call?`;
      suggestedNextSteps.push("Send quotation PDF", "Schedule brief alignment");
    } else if (msg.includes("refund") || msg.includes("cancel") || msg.includes("return")) {
      detectedIntent = "Cancellation / Refund Policy Enquiry";
      suggestionText = `Hello ${params.customerName}, regarding cancellations: ${profile.return_policy}. Let us know if you need any assistance with your account.`;
      suggestedNextSteps.push("Verify account status", "Offer customer support");
    } else if (msg.includes("hour") || msg.includes("time") || msg.includes("open") || msg.includes("sunday")) {
      detectedIntent = "Operating Hours Enquiry";
      suggestionText = `Hi ${params.customerName}! Our working hours are ${profile.operating_hours}. Our team will gladly assist you during these hours.`;
      suggestedNextSteps.push("Confirm availability", "Follow up next working day");
    } else if (msg.includes("broadcast") || msg.includes("campaign") || msg.includes("template")) {
      detectedIntent = "WhatsApp Broadcast Enquiry";
      const broadcastFaq = profile.faqs.find((f) => f.question.toLowerCase().includes("broadcast"))?.answer;
      suggestionText = `Hello ${params.customerName}! ${broadcastFaq || "Yes, we support broadcast marketing with Meta-approved templates and automated opt-out handling."} Would you like to see a sample broadcast?`;
      suggestedNextSteps.push("Share sample template", "Verify opt-in consent");
    } else if (msg.includes("demo") || msg.includes("trial") || msg.includes("test")) {
      detectedIntent = "Product Demo Request";
      suggestionText = `Hello ${params.customerName}! We would love to show you ${profile.business_name} in action. What time works best for a quick live demonstration today or tomorrow?`;
      suggestedNextSteps.push("Share demo scheduling link", "Create follow-up task");
    } else {
      // General Grounded Reply
      detectedIntent = "Customer Service Inquiry";
      suggestionText = `Hello ${params.customerName}, thank you for reaching out to ${profile.business_name}! How can we help you with ${profile.products_services.slice(0, 80)}... today?`;
      suggestedNextSteps.push("Clarify customer requirement", "Assign to sales agent");
    }

    return {
      suggestionText,
      confidenceScore: 0.92,
      groundedInBusinessProfile: true,
      detectedIntent,
      suggestedNextSteps,
      modelUsed: "mock-gemini-1.5-flash-sandbox",
      tokensUsed: { input: 145, output: 52 },
      disclaimer: "AI suggestion only • Review before sending • Does not send automatically",
    };
  }

  public async rewriteDraft(params: RewriteParams): Promise<RewriteResult> {
    const draft = params.draftText.trim();

    let rewritten = draft;
    switch (params.targetStyle) {
      case "shorter":
        // Condense text
        rewritten = draft
          .replace(/Hello|Hi there|Dear customer/gi, "Hi")
          .replace(/Thank you very much/gi, "Thanks")
          .replace(/Please feel free to reach out to us if you have any questions/gi, "Let us know if you need help.")
          .slice(0, 120);
        break;

      case "friendlier":
        rewritten = `Hi there! 😊 ${draft} Have a wonderful day ahead!`;
        break;

      case "more_professional":
        rewritten = `Dear Customer, ${draft} Best regards, Customer Success Team.`;
        break;
    }

    return {
      rewrittenText: rewritten,
      targetStyle: params.targetStyle,
      modelUsed: "mock-gemini-1.5-flash-sandbox",
    };
  }

  public async summarizeConversation(
    params: ConversationSummaryParams
  ): Promise<ConversationSummaryResult> {
    const profile = businessContextStore.getProfile(params.orgSlug);
    const msgs = params.messages || [];

    const customerTexts = msgs
      .filter((m) => m.sender === "customer")
      .map((m) => m.text)
      .join(" ");

    const keyQuestions: string[] = [];
    const unansweredQuestions: string[] = [];

    if (customerTexts.toLowerCase().includes("price") || customerTexts.toLowerCase().includes("cost")) {
      keyQuestions.push("Customer inquired about subscription plan costs.");
    }
    if (customerTexts.toLowerCase().includes("demo")) {
      keyQuestions.push("Customer requested product demonstration.");
    }
    if (customerTexts.toLowerCase().includes("support") || customerTexts.toLowerCase().includes("help")) {
      keyQuestions.push("Customer requested technical assistance.");
    }

    if (keyQuestions.length === 0) {
      keyQuestions.push("General service questions regarding " + profile.business_name);
    }

    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg && lastMsg.sender === "customer") {
      unansweredQuestions.push(lastMsg.text);
    }

    const summary = `${params.customerName} initiated an enquiry with ${profile.business_name} regarding ${profile.products_services.slice(0, 50)}... Total messages exchanged: ${msgs.length}.`;

    return {
      summary,
      mainIntent: keyQuestions[0] || "General Enquiry",
      keyQuestions,
      unansweredQuestions,
      suggestedNextSteps: [
        "Review customer inquiry",
        "Send personalized WhatsApp response",
        "Schedule follow-up reminder",
      ],
      modelUsed: "mock-gemini-1.5-flash-sandbox",
    };
  }

  public async qualifyLead(
    params: LeadQualificationParams
  ): Promise<LeadQualificationResult> {
    const profile = businessContextStore.getProfile(params.orgSlug);
    const textCorpus = params.conversationMessages.map((m) => m.text).join(" ") + " " + (params.notes || "");
    const lower = textCorpus.toLowerCase();

    // 1. Budget extraction: ONLY if explicitly mentioned with currency symbol or numbers
    let extractedBudget = "Not provided";
    const budgetMatch = textCorpus.match(/(₹|rs\.?|inr)\s?([\d,]+)/i) || textCorpus.match(/budget\s?(is|of)?\s?([\d,]+)/i);
    if (budgetMatch) {
      extractedBudget = `₹${budgetMatch[2] || budgetMatch[1]}`;
    }

    // 2. Timeline extraction: ONLY if explicitly mentioned
    let extractedTimeline = "Unknown";
    if (lower.includes("immediately") || lower.includes("today") || lower.includes("asap") || lower.includes("urgent")) {
      extractedTimeline = "Immediate (Within 48h)";
    } else if (lower.includes("this month") || lower.includes("next week")) {
      extractedTimeline = "Short Term (1-2 Weeks)";
    } else if (lower.includes("next quarter") || lower.includes("next month")) {
      extractedTimeline = "Medium Term (1 Month)";
    }

    // 3. Priority recommendation
    let priority: LeadPriorityRecommendation = "medium";
    let explanation = "";
    const citations: EvidenceCitation[] = [];

    if (extractedBudget !== "Not provided" && extractedTimeline.includes("Immediate")) {
      priority = "high";
      explanation = "High priority: Customer specified explicit budget and requested immediate deployment.";
      citations.push({
        quote: budgetMatch ? budgetMatch[0] : "Budget mentioned",
        context: "Explicit budget commitment",
      });
      citations.push({
        quote: "Urgent/Immediate timeline requested",
        context: "High pipeline velocity intent",
      });
    } else if (lower.includes("demo") || lower.includes("pricing") || lower.includes("bulk")) {
      priority = "medium";
      explanation = "Medium priority: Active commercial inquiry into plans and live demonstration.";
      citations.push({
        quote: "Customer requested demonstration or pricing details",
        context: "Commercial interest expressed",
      });
    } else {
      priority = "needs_more_info";
      explanation = "Needs more information: Basic enquiry without confirmed requirement scope or budget.";
    }

    return {
      suggestedPriority: priority,
      leadCategory: "Inbound B2B Inquiry",
      mainRequirement: "WhatsApp Automation & CRM Integration",
      productOfInterest: profile.products_services.slice(0, 60),
      budget: extractedBudget,
      timeline: extractedTimeline,
      keyObjections: lower.includes("expensive") ? "Price sensitivity expressed" : "None identified",
      unansweredQuestions: "Needs clarification on required user seats and implementation date.",
      suggestedNextAction: "Send customized proposal and schedule discovery call",
      suggestedFollowupMessage: `Hi ${params.contactName}, thank you for your interest in ${profile.business_name}. I have prepared a customized overview for your team. Would 3:00 PM today work for a brief call?`,
      explanation,
      evidenceCitations: citations,
      modelUsed: "mock-gemini-1.5-flash-sandbox",
    };
  }
}

export const mockAIProvider = new MockAIProvider();
