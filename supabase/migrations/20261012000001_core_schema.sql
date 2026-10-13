-- ==============================================================================
-- MIGRATION: 20261012000001_core_schema.sql
-- DESCRIPTION: Core 17-table schema with constraints, foreign keys and indexes
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    plan_tier TEXT NOT NULL DEFAULT 'starter' CHECK (plan_tier IN ('starter', 'growth', 'business')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. profiles (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. organization_members
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'staff')),
    invited_email TEXT,
    invitation_token TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_org_user UNIQUE (organization_id, user_id)
);

-- 4. contacts
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    company TEXT,
    tags TEXT[] DEFAULT '{}',
    source TEXT,
    notes TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contacts_org_phone ON public.contacts (organization_id, phone);
CREATE INDEX IF NOT EXISTS idx_contacts_org_archived ON public.contacts (organization_id, is_archived);

-- 5. consent_records
CREATE TABLE IF NOT EXISTS public.consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'email')),
    consent_status TEXT NOT NULL CHECK (consent_status IN ('opted_in', 'opted_out', 'pending')),
    consent_source TEXT,
    opted_in_at TIMESTAMPTZ,
    opted_out_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_consent_org_contact ON public.consent_records (organization_id, contact_id, channel);

-- 6. leads
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    stage TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
    source TEXT,
    assigned_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    estimated_value NUMERIC(12,2) DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'INR',
    next_follow_up_at TIMESTAMPTZ,
    lost_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leads_org_stage ON public.leads (organization_id, stage);
CREATE INDEX IF NOT EXISTS idx_leads_org_assigned ON public.leads (organization_id, assigned_to_user_id);

-- 7. whatsapp_connections
CREATE TABLE IF NOT EXISTS public.whatsapp_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
    mode TEXT NOT NULL DEFAULT 'mock' CHECK (mode IN ('mock', 'live')),
    phone_number_id TEXT,
    waba_id TEXT,
    access_token_encrypted TEXT,
    webhook_verify_token TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'connected', 'error')),
    error_message TEXT,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    whatsapp_connection_id UUID NOT NULL REFERENCES public.whatsapp_connections(id) ON DELETE RESTRICT,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_customer_message_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'snoozed')),
    assigned_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conversations_org_last_msg ON public.conversations (organization_id, last_message_at DESC);

-- 9. messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'staff', 'system', 'automation')),
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    external_message_id TEXT,
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'template', 'image', 'document')),
    body TEXT NOT NULL,
    media_url TEXT,
    template_name TEXT,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent' , 'delivered', 'read', 'failed')),
    error_message TEXT,
    cost_units INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_org_external_msg UNIQUE (organization_id, external_message_id)
);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages (conversation_id, created_at ASC);

-- 10. message_templates
CREATE TABLE IF NOT EXISTS public.message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    meta_template_id TEXT,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('marketing', 'utility', 'authentication')),
    language TEXT NOT NULL DEFAULT 'en',
    status TEXT NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('APPROVED', 'PENDING', 'REJECTED')),
    body_content TEXT NOT NULL,
    variables_schema JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    assigned_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_org_status_due ON public.tasks (organization_id, status, due_date);

-- 12. follow_ups
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    reminder_at TIMESTAMPTZ,
    assigned_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue', 'cancelled')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_follow_ups_org_sched ON public.follow_ups (organization_id, scheduled_at, status);

-- 13. automation_rules
CREATE TABLE IF NOT EXISTS public.automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL,
    trigger_config JSONB NOT NULL DEFAULT '{}'::JSONB,
    action_type TEXT NOT NULL,
    action_config JSONB NOT NULL DEFAULT '{}'::JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. automation_executions (Persistent Job Queue)
CREATE TABLE IF NOT EXISTS public.automation_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES public.automation_rules(id) ON DELETE SET NULL,
    trigger_event TEXT NOT NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying', 'cancelled')),
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    error_log TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_executions_queue ON public.automation_executions (status, scheduled_for);

-- 15. subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_tier TEXT NOT NULL DEFAULT 'starter' CHECK (plan_tier IN ('starter', 'growth', 'business')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
    mode TEXT NOT NULL DEFAULT 'development' CHECK (mode IN ('development', 'live')),
    provider TEXT NOT NULL DEFAULT 'manual' CHECK (provider IN ('manual', 'stripe', 'razorpay')),
    provider_customer_id TEXT,
    provider_subscription_id TEXT,
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. usage_records
CREATE TABLE IF NOT EXISTS public.usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    period_month DATE NOT NULL,
    metric_name TEXT NOT NULL,
    current_count INTEGER NOT NULL DEFAULT 0,
    max_quota INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_org_period_metric UNIQUE (organization_id, period_month, metric_name)
);

-- 17. audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created ON public.audit_logs (organization_id, created_at DESC);
