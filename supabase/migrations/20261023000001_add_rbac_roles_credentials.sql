-- ==============================================================================
-- MIGRATION: 3-LEVEL ACCESS CREDENTIALS & ROLE-BASED ACCESS CONTROL (RBAC)
-- 1. Admin: Full root & financial clearance (overall fund transfers, billing, credentials, settings)
-- 2. Senior Manager: All operational access (CRM, campaigns, automations). Strictly restricted from fund transfers.
-- 3. Junior Manager: Limited to tasks, performance metrics, and assigned records.
-- ==============================================================================

-- 1. Update organization_members role check constraint
ALTER TABLE public.organization_members
    DROP CONSTRAINT IF EXISTS organization_members_role_check;

ALTER TABLE public.organization_members
    ADD CONSTRAINT organization_members_role_check
    CHECK (role IN ('owner', 'admin', 'senior_manager', 'junior_manager', 'staff'));

-- 2. Create access_credentials table for cryptographic keys and programmatic tokens
CREATE TABLE IF NOT EXISTS public.access_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'senior_manager', 'junior_manager', 'staff')),
    email TEXT NOT NULL,
    api_key_id TEXT NOT NULL UNIQUE,
    secret_hash TEXT NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT '{}',
    can_access_funds BOOLEAN NOT NULL DEFAULT FALSE,
    operational_scope TEXT NOT NULL CHECK (operational_scope IN ('root_governance', 'full_operational', 'task_performance_only')),
    description TEXT,
    last_active TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_access_credentials_org ON public.access_credentials(organization_id);
CREATE INDEX IF NOT EXISTS idx_access_credentials_key ON public.access_credentials(api_key_id);
CREATE INDEX IF NOT EXISTS idx_access_credentials_role ON public.access_credentials(role);

-- Enable RLS
ALTER TABLE public.access_credentials ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies: Only Level 1 Admin (and Owner) can view and issue credentials
CREATE POLICY "Admin and Owner can view organization access credentials"
    ON public.access_credentials
    FOR SELECT
    USING (
        organization_id IN (SELECT auth_user_org_ids())
        AND auth_has_org_role(organization_id, ARRAY['owner', 'admin'])
    );

CREATE POLICY "Admin and Owner can insert access credentials"
    ON public.access_credentials
    FOR INSERT
    WITH CHECK (
        organization_id IN (SELECT auth_user_org_ids())
        AND auth_has_org_role(organization_id, ARRAY['owner', 'admin'])
    );

CREATE POLICY "Admin and Owner can update or revoke access credentials"
    ON public.access_credentials
    FOR UPDATE
    USING (
        organization_id IN (SELECT auth_user_org_ids())
        AND auth_has_org_role(organization_id, ARRAY['owner', 'admin'])
    )
    WITH CHECK (
        organization_id IN (SELECT auth_user_org_ids())
        AND auth_has_org_role(organization_id, ARRAY['owner', 'admin'])
    );

CREATE POLICY "Admin and Owner can delete access credentials"
    ON public.access_credentials
    FOR DELETE
    USING (
        organization_id IN (SELECT auth_user_org_ids())
        AND auth_has_org_role(organization_id, ARRAY['owner', 'admin'])
    );
