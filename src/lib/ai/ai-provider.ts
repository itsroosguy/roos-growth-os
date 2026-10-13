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

export interface AIProvider {
  readonly name: string;
  readonly isSandbox: boolean;

  generateReplySuggestion(params: ReplySuggestionParams): Promise<ReplySuggestionResult>;
  rewriteDraft(params: RewriteParams): Promise<RewriteResult>;
  summarizeConversation(params: ConversationSummaryParams): Promise<ConversationSummaryResult>;
  qualifyLead(params: LeadQualificationParams): Promise<LeadQualificationResult>;
}
