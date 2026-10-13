-- Migration: 20261012000008_ai_capabilities.sql
-- Description: Milestone 9 AI-Assisted Replies, Business Context, and Lead Qualification

-- 1. Business Profiles Table (Grounding knowledge per organization)
CREATE TABLE IF NOT EXISTS public.business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
    business_name TEXT NOT NULL,
    description TEXT,
    products_services TEXT,
    operating_hours TEXT DEFAULT 'Mon - Sat: 9:00 AM - 6:00 PM IST',
    service_area TEXT DEFAULT 'All India',
    contact_email TEXT,
    contact_phone TEXT,
    faqs JSONB NOT NULL DEFAULT '[]'::JSONB,
    pricing_info TEXT,
    return_policy TEXT,
    preferred_tone TEXT NOT NULL DEFAULT 'friendly' CHECK (preferred_tone IN ('professional', 'friendly', 'concise', 'consultative')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_profiles_org ON public.business_profiles (organization_id);

-- 2. AI Settings Table (Organization-level AI controls and quotas)
CREATE TABLE IF NOT EXISTS public.ai_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    provider TEXT NOT NULL DEFAULT 'mock' CHECK (provider IN ('mock', 'gemini', 'openai')),
    model_name TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
    tone_preference TEXT NOT NULL DEFAULT 'friendly' CHECK (tone_preference IN ('professional', 'friendly', 'concise', 'consultative')),
    max_response_length INTEGER NOT NULL DEFAULT 150,
    monthly_token_quota INTEGER NOT NULL DEFAULT 100000,
    enable_reply_suggestions BOOLEAN NOT NULL DEFAULT TRUE,
    enable_lead_qualification BOOLEAN NOT NULL DEFAULT TRUE,
    enable_conversation_summaries BOOLEAN NOT NULL DEFAULT TRUE,
    enable_workflow_ai BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_settings_org ON public.ai_settings (organization_id);

-- 3. AI Usage Logs Table (Audit trail of token consumption and estimated costs)
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    feature TEXT NOT NULL CHECK (feature IN ('reply_suggestion', 'rewrite', 'summary', 'lead_qualification', 'workflow_action')),
    provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    estimated_cost_inr NUMERIC(10, 4) NOT NULL DEFAULT 0,
    latency_ms INTEGER,
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'rate_limited', 'quota_exceeded')),
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_org_created ON public.ai_usage_logs (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_feature ON public.ai_usage_logs (organization_id, feature);

-- 4. Lead Qualifications Table (Structured assessment records with citations)
CREATE TABLE IF NOT EXISTS public.lead_qualifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id TEXT NOT NULL,
    contact_id TEXT NOT NULL,
    suggested_priority TEXT NOT NULL CHECK (suggested_priority IN ('high', 'medium', 'low', 'needs_more_info')),
    lead_category TEXT NOT NULL,
    main_requirement TEXT NOT NULL,
    product_of_interest TEXT NOT NULL,
    budget TEXT NOT NULL DEFAULT 'Not provided',
    timeline TEXT NOT NULL DEFAULT 'Unknown',
    key_objections TEXT,
    unanswered_questions TEXT,
    suggested_next_action TEXT NOT NULL,
    suggested_followup_message TEXT,
    explanation TEXT NOT NULL,
    evidence_citations JSONB NOT NULL DEFAULT '[]'::JSONB,
    is_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_qualifications_lead ON public.lead_qualifications (organization_id, lead_id);

-- 5. Row Level Security Policies
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view organization business profile" ON public.business_profiles;
CREATE POLICY "Members can view organization business profile"
    ON public.business_profiles FOR SELECT TO authenticated
    USING (organization_id IN (SELECT public.auth_user_org_ids()));

DROP POLICY IF EXISTS "Admins can update organization business profile" ON public.business_profiles;
CREATE POLICY "Admins can update organization business profile"
    ON public.business_profiles FOR ALL TO authenticated
    USING (organization_id IN (SELECT public.auth_user_org_ids()))
    WITH CHECK (organization_id IN (SELECT public.auth_user_org_ids()));

ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_settings FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view organization ai settings" ON public.ai_settings;
CREATE POLICY "Members can view organization ai settings"
    ON public.ai_settings FOR SELECT TO authenticated
    USING (organization_id IN (SELECT public.auth_user_org_ids()));

DROP POLICY IF EXISTS "Admins can update organization ai settings" ON public.ai_settings;
CREATE POLICY "Admins can update organization ai settings"
    ON public.ai_settings FOR ALL TO authenticated
    USING (organization_id IN (SELECT public.auth_user_org_ids()))
    WITH CHECK (organization_id IN (SELECT public.auth_user_org_ids()));

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view organization ai usage logs" ON public.ai_usage_logs;
CREATE POLICY "Members can view organization ai usage logs"
    ON public.ai_usage_logs FOR SELECT TO authenticated
    USING (organization_id IN (SELECT public.auth_user_org_ids()));

ALTER TABLE public.lead_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_qualifications FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view lead qualifications" ON public.lead_qualifications;
CREATE POLICY "Members can view lead qualifications"
    ON public.lead_qualifications FOR SELECT TO authenticated
    USING (organization_id IN (SELECT public.auth_user_org_ids()));

DROP POLICY IF EXISTS "Members can insert or update lead qualifications" ON public.lead_qualifications;
CREATE POLICY "Members can insert or update lead qualifications"
    ON public.lead_qualifications FOR ALL TO authenticated
    USING (organization_id IN (SELECT public.auth_user_org_ids()))
    WITH CHECK (organization_id IN (SELECT public.auth_user_org_ids()));
