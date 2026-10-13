-- ==============================================================================
-- MIGRATION: 20261012000005_templates_and_campaigns.sql
-- DESCRIPTION: Schema for WhatsApp template validation, audience segments,
--              controlled campaigns, send queue, and tenant-isolated RLS policies
-- ==============================================================================

-- 1. Extend message_templates with rejection details and sample variables
ALTER TABLE public.message_templates
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
    ADD COLUMN IF NOT EXISTS sample_values JSONB DEFAULT '{}'::JSONB,
    ADD COLUMN IF NOT EXISTS header_text TEXT,
    ADD COLUMN IF NOT EXISTS footer_text TEXT;

-- 2. Update message_templates status check constraint to support DRAFT
ALTER TABLE public.message_templates
    DROP CONSTRAINT IF EXISTS message_templates_status_check;

ALTER TABLE public.message_templates
    ADD CONSTRAINT message_templates_status_check
    CHECK (status IN ('APPROVED', 'PENDING', 'REJECTED', 'DRAFT'));

-- 3. audience_segments (Saved CRM audience filters for marketing campaigns)
CREATE TABLE IF NOT EXISTS public.audience_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    filter_criteria JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_segments_org ON public.audience_segments (organization_id);

-- 4. campaigns (Controlled WhatsApp marketing & utility campaigns)
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    template_id UUID NOT NULL REFERENCES public.message_templates(id) ON DELETE RESTRICT,
    segment_id UUID REFERENCES public.audience_segments(id) ON DELETE SET NULL,
    filter_criteria JSONB NOT NULL DEFAULT '{}'::JSONB,
    variable_mappings JSONB NOT NULL DEFAULT '{}'::JSONB,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft',
        'scheduled',
        'processing',
        'paused',
        'completed',
        'cancelled',
        'failed'
    )),
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    total_recipients INTEGER NOT NULL DEFAULT 0,
    sent_count INTEGER NOT NULL DEFAULT 0,
    delivered_count INTEGER NOT NULL DEFAULT 0,
    read_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    estimated_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
    actual_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
    recipient_limit INTEGER,
    is_test_mode BOOLEAN NOT NULL DEFAULT FALSE,
    is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_campaigns_org_status ON public.campaigns (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_org_created ON public.campaigns (organization_id, created_at DESC);

-- 5. campaign_recipients (Persistent send queue & recipient delivery log)
CREATE TABLE IF NOT EXISTS public.campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
        'queued',
        'sent',
        'delivered',
        'read',
        'failed',
        'skipped',
        'cancelled'
    )),
    external_message_id TEXT,
    idempotency_key TEXT NOT NULL UNIQUE,
    error_message TEXT,
    cost_units NUMERIC(6,2) NOT NULL DEFAULT 0,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_camp_recipients_camp_status ON public.campaign_recipients (campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_camp_recipients_org ON public.campaign_recipients (organization_id);

-- 6. Enable and Force Row Level Security
ALTER TABLE public.audience_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audience_segments FORCE ROW LEVEL SECURITY;

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns FORCE ROW LEVEL SECURITY;

ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients FORCE ROW LEVEL SECURITY;

-- 7. RLS Policies for Audience Segments
CREATE POLICY "Tenant members can view audience segments"
    ON public.audience_segments
    FOR SELECT
    TO authenticated
    USING (organization_id IN (SELECT public.auth_user_org_ids()));

CREATE POLICY "Tenant members can manage audience segments"
    ON public.audience_segments
    FOR ALL
    TO authenticated
    USING (organization_id IN (SELECT public.auth_user_org_ids()))
    WITH CHECK (organization_id IN (SELECT public.auth_user_org_ids()));

-- 8. RLS Policies for Campaigns
CREATE POLICY "Tenant members can view campaigns"
    ON public.campaigns
    FOR SELECT
    TO authenticated
    USING (organization_id IN (SELECT public.auth_user_org_ids()));

CREATE POLICY "Tenant members can manage campaigns"
    ON public.campaigns
    FOR ALL
    TO authenticated
    USING (organization_id IN (SELECT public.auth_user_org_ids()))
    WITH CHECK (organization_id IN (SELECT public.auth_user_org_ids()));

-- 9. RLS Policies for Campaign Recipients
CREATE POLICY "Tenant members can view campaign recipients"
    ON public.campaign_recipients
    FOR SELECT
    TO authenticated
    USING (organization_id IN (SELECT public.auth_user_org_ids()));

CREATE POLICY "Tenant members can manage campaign recipients"
    ON public.campaign_recipients
    FOR ALL
    TO authenticated
    USING (organization_id IN (SELECT public.auth_user_org_ids()))
    WITH CHECK (organization_id IN (SELECT public.auth_user_org_ids()));
