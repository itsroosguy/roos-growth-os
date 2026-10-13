-- Migration: 20261012000007_billing_and_reporting.sql
-- Description: Milestone 8 Subscription Billing, Usage Limits, and Payment Webhook Infrastructure

-- 1. Extend public.subscriptions for billing intervals, extended lifecycle statuses, and cancellation reasons
ALTER TABLE public.subscriptions
    DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE public.subscriptions
    ADD CONSTRAINT subscriptions_status_check 
    CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'suspended', 'expired'));

ALTER TABLE public.subscriptions
    ADD COLUMN IF NOT EXISTS billing_interval TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'yearly')),
    ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
    ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ;

-- 2. Payment Events / Invoices Table
CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('manual', 'mock', 'razorpay', 'stripe')),
    provider_payment_id TEXT,
    provider_invoice_id TEXT,
    amount_inr_paise INTEGER NOT NULL, -- Stored in smallest currency unit (paise: ₹299 = 29900)
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
    payment_method TEXT DEFAULT 'upi', -- 'upi', 'card', 'netbanking'
    receipt_url TEXT,
    description TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_org ON public.payment_events (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_events_provider ON public.payment_events (provider, provider_payment_id);

-- 3. Webhook Events Table (Authoritative Deduplication & Audit Log)
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    error_log TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_dedup ON public.webhook_events (event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_type ON public.webhook_events (provider, event_type);

-- 4. Admin Plan Overrides Table (Tenant Quota Exceptions & Custom Grants)
CREATE TABLE IF NOT EXISTS public.plan_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    extra_quota INTEGER NOT NULL DEFAULT 0,
    reason TEXT NOT NULL,
    granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_overrides_org ON public.plan_overrides (organization_id, metric_name);

-- 5. Row Level Security for Payment & Billing Tables
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view organization payment events" ON public.payment_events;
CREATE POLICY "Members can view organization payment events"
    ON public.payment_events
    FOR SELECT
    TO authenticated
    USING (organization_id IN (SELECT public.auth_user_org_ids()));

DROP POLICY IF EXISTS "Service role can insert payment events" ON public.payment_events;
CREATE POLICY "Service role can insert payment events"
    ON public.payment_events
    FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

ALTER TABLE public.plan_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_overrides FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view organization overrides" ON public.plan_overrides;
CREATE POLICY "Members can view organization overrides"
    ON public.plan_overrides
    FOR SELECT
    TO authenticated
    USING (organization_id IN (SELECT public.auth_user_org_ids()));
