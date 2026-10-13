export type AIProviderType = "mock" | "gemini" | "openai";

export type AITonePreference = "professional" | "friendly" | "concise" | "consultative";

export type AIFeatureType =
  | "reply_suggestion"
  | "rewrite"
  | "summary"
  | "lead_qualification"
  | "workflow_action";

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface BusinessProfile {
  id: string;
  organization_id: string;
  business_name: string;
  description: string;
  products_services: string;
  operating_hours: string;
  service_area: string;
  contact_email: string;
  contact_phone: string;
  faqs: FAQItem[];
  pricing_info: string;
  return_policy: string;
  preferred_tone: AITonePreference;
  updated_at: string;
}

export interface AISettings {
  id: string;
  organization_id: string;
  is_enabled: boolean;
  provider: AIProviderType;
  model_name: string;
  tone_preference: AITonePreference;
  max_response_length: number; // in words (e.g. 100 - 300)
  monthly_token_quota: number; // e.g. 100,000 tokens
  enable_reply_suggestions: boolean;
  enable_lead_qualification: boolean;
  enable_conversation_summaries: boolean;
  enable_workflow_ai: boolean;
  updated_at: string;
}

export interface ReplySuggestionParams {
  orgSlug: string;
  customerName: string;
  incomingMessage: string;
  recentMessages: Array<{ sender: "customer" | "staff" | "system" | "automation" | "internal_note" | string; text: string }>;
  tone?: AITonePreference;
}

export interface ReplySuggestionResult {
  suggestionText: string;
  confidenceScore: number; // 0.0 to 1.0
  groundedInBusinessProfile: boolean;
  detectedIntent: string;
  suggestedNextSteps: string[];
  modelUsed: string;
  tokensUsed: { input: number; output: number };
  disclaimer: string;
}

export interface RewriteParams {
  orgSlug: string;
  draftText: string;
  targetStyle: "shorter" | "friendlier" | "more_professional";
}

export interface RewriteResult {
  rewrittenText: string;
  targetStyle: string;
  modelUsed: string;
}

export interface ConversationSummaryParams {
  orgSlug: string;
  customerName: string;
  messages: Array<{ sender: "customer" | "staff" | "system" | "automation" | "internal_note" | string; text: string; timestamp?: string }>;
}

export interface ConversationSummaryResult {
  summary: string;
  mainIntent: string;
  keyQuestions: string[];
  unansweredQuestions: string[];
  suggestedNextSteps: string[];
  modelUsed: string;
}

export type LeadPriorityRecommendation = "high" | "medium" | "low" | "needs_more_info";

export interface EvidenceCitation {
  quote: string;
  context: string;
}

export interface LeadQualificationParams {
  orgSlug: string;
  leadId: string;
  leadTitle: string;
  contactName: string;
  contactPhone: string;
  conversationMessages: Array<{ sender: "customer" | "staff" | "system" | "automation" | "internal_note" | string; text: string }>;
  notes?: string;
}

export interface LeadQualificationResult {
  suggestedPriority: LeadPriorityRecommendation;
  leadCategory: string;
  mainRequirement: string;
  productOfInterest: string;
  budget: string; // Explicit amount or "Not provided"
  timeline: string; // Specific timeframe or "Unknown"
  keyObjections: string;
  unansweredQuestions: string;
  suggestedNextAction: string;
  suggestedFollowupMessage: string;
  explanation: string;
  evidenceCitations: EvidenceCitation[];
  modelUsed: string;
}

export interface LeadQualificationRecord extends LeadQualificationResult {
  id: string;
  organization_id: string;
  lead_id: string;
  contact_id: string;
  is_reviewed: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface AIUsageLog {
  id: string;
  organization_id: string;
  feature: AIFeatureType;
  provider: string;
  model_name: string;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_inr: number;
  latency_ms: number;
  status: "success" | "failed" | "rate_limited" | "quota_exceeded";
  metadata?: Record<string, any>;
  created_at: string;
}
