-- ==============================================================================
-- MIGRATION: 20261012000002_rls_policies.sql
-- DESCRIPTION: Row Level Security helper functions and comprehensive isolation policies
-- ==============================================================================

-- 1. Helper function: Return active organization IDs for the authenticated caller
CREATE OR REPLACE FUNCTION public.auth_user_org_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = auth.uid()
    AND status = 'active';
$$;

-- 2. Helper function: Check if caller holds an allowed role in the specified organization
CREATE OR REPLACE FUNCTION public.auth_has_org_role(target_org_id UUID, allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = target_org_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND role = ANY(allowed_roles)
  );
$$;

-- ------------------------------------------------------------------------------
-- RLS POLICIES FOR ALL TENANT TABLES
-- ------------------------------------------------------------------------------

-- Organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can view organizations they belong to"
  ON public.organizations FOR SELECT TO authenticated
  USING (id IN (SELECT auth_user_org_ids()));

CREATE POLICY "Owners and Admins can update organization profile"
  ON public.organizations FOR UPDATE TO authenticated
  USING (id IN (SELECT auth_user_org_ids()) AND auth_has_org_role(id, ARRAY['owner', 'admin']))
  WITH CHECK (id IN (SELECT auth_user_org_ids()) AND auth_has_org_role(id, ARRAY['owner', 'admin']));

CREATE POLICY "Only Owners can delete an organization"
  ON public.organizations FOR DELETE TO authenticated
  USING (id IN (SELECT auth_user_org_ids()) AND auth_has_org_role(id, ARRAY['owner']));

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can view profiles in their organizations"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR id IN (
      SELECT om.user_id FROM public.organization_members om
      WHERE om.organization_id IN (SELECT auth_user_org_ids())
    )
  );

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Organization Members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members FORCE ROW LEVEL SECURITY;

CREATE POLICY "Members can view other members in their organization"
  ON public.organization_members FOR SELECT TO authenticated
  USING (organization_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "Owners and Admins can manage members"
  ON public.organization_members FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT auth_user_org_ids()) AND auth_has_org_role(organization_id, ARRAY['owner', 'admin']));

CREATE POLICY "Owners and Admins can update members"
  ON public.organization_members FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT auth_user_org_ids()) AND auth_has_org_role(organization_id, ARRAY['owner', 'admin']))
  WITH CHECK (organization_id IN (SELECT auth_user_org_ids()) AND auth_has_org_role(organization_id, ARRAY['owner', 'admin']));

CREATE POLICY "Owners and Admins can remove members"
  ON public.organization_members FOR DELETE TO authenticated
  USING (organization_id IN (SELECT auth_user_org_ids()) AND auth_has_org_role(organization_id, ARRAY['owner', 'admin']));

-- Contacts
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts FORCE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select on contacts" ON public.contacts
  FOR SELECT TO authenticated USING (organization_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "Tenant insert on contacts" ON public.contacts
  FOR INSERT TO authenticated WITH CHECK (organization_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "Tenant update on contacts" ON public.contacts
  FOR UPDATE TO authenticated USING (organization_id IN (SELECT auth_user_org_ids()))
  WITH CHECK (organization_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "Owner/Admin delete on contacts" ON public.contacts
  FOR DELETE TO authenticated
  USING (organization_id IN (SELECT auth_user_org_ids()) AND auth_has_org_role(organization_id, ARRAY['owner', 'admin']));

-- Consent Records
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records FORCE ROW LEVEL SECURITY;

CREATE POLICY "Tenant access on consent_records" ON public.consent_records
  FOR ALL TO authenticated USING (organization_id IN (SELECT auth_user_org_ids()))
  WITH CHECK (organization_id IN (SELECT auth_user_org_ids()));

-- Leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select on leads" ON public.leads
  FOR SELECT TO authenticated USING (organization_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "Tenant insert on leads" ON public.leads
  FOR INSERT TO authenticated WITH CHECK (organization_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "Tenant update on leads" ON public.leads
  FOR UPDATE TO authenticated USING (organization_id IN (SELECT auth_user_org_ids()))
  WITH CHECK (organization_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "Owner/Admin delete on leads" ON public.leads
  FOR DELETE TO authenticated
  USING (organization_id IN (SELECT auth_user_org_ids()) AND auth_has_org_role(organization_id, ARRAY['owner', 'admin']));

-- WhatsApp Connections
ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_connections FORCE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select on whatsapp_connections" ON public.whatsapp_connections
  FOR SELECT TO authenticated USING (organization_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "Owner/Admin manage whatsapp_connections" ON public.whatsapp_connections
  FOR ALL TO authenticated
  USING (organization_id IN (SELECT auth_user_org_ids()) AND auth_has_org_role(organization_id, ARRAY['owner', 'admin']))
  WITH CHECK (organization_id IN (SELECT auth_user_org_ids()) AND auth_has_org_role(organization_id, ARRAY['owner', 'admin']));

-- Conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations FORCE ROW LEVEL SECURITY;

CREATE POLICY "Tenant access on conversations" ON public.conversations
  FOR ALL TO authenticated USING (organization_id IN (SELECT auth_user_org_ids()))
  WITH CHECK (organization_id IN (SELECT auth_user_org_ids()));

-- Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages FORCE ROW LEVEL SECURITY;

CREATE POLICY "Tenant access on messages" ON public.messages
  FOR ALL TO authenticated USING (organization_id IN (SELECT auth_user_org_ids()))
  WITH CHECK (organization_id IN (SELECT auth_user_org_ids()));

-- Message Templates
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates FORCE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select on message_templates" ON public.message_templates
  FOR SELECT TO authenticated USING (organization_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "Owner/Admin manage message_templates" ON public.message_templates
  FOR ALL TO authenticated
  USING (organization_id IN (SELECT auth_user_org_ids()) AND auth_has_org_role(organization_id, ARRAY['owner', 'admin']))
  WITH CHECK (organization_id IN (SELECT auth_user_org_ids()) AND auth_has_org_role(organization_id, ARRAY['owner', 'admin']));

-- Tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks FORCE ROW LEVEL SECURITY;

CREATE POLICY "Tenant access on tasks" ON public.tasks
  FOR ALL TO authenticated USING (organization_id IN (SELECT auth_user_org_ids()))
  WITH CHECK (organization_id IN (SELECT auth_user_org_ids()));

-- Follow Ups
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups FORCE ROW LEVEL SECURITY;

CREATE POLICY "Tenant access on follow_ups" ON public.follow_ups
  FOR ALL TO authenticated USING (organization_id IN (SELECT auth_user_org_ids()))
  WITH CHECK (organization_id IN (SELECT auth_user_org_ids()));

-- Automation Rules
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules FORCE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select on automation_rules" ON public.automation_rules
  FOR SELECT TO authenticated USING (organization_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "Owner/Admin manage automation_rules" ON public.automation_rules
  FOR ALL TO authenticated
  USING (organization_id IN (SELECT auth_user_org_ids()) AND auth_has_org_role(organization_id, ARRAY['owner', 'admin']))
  WITH CHECK (organization_id IN (SELECT auth_user_org_ids()) AND auth_has_org_role(organization_id, ARRAY['owner', 'admin']));

-- Automation Executions (Queue & Logs)
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions FORCE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select on executions" ON public.automation_executions
  FOR SELECT TO authenticated USING (organization_id IN (SELECT auth_user_org_ids()));

-- Subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions FORCE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select on subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (organization_id IN (SELECT auth_user_org_ids()));

CREATE POLICY "Owner manage subscriptions" ON public.subscriptions
  FOR ALL TO authenticated
  USING (organization_id IN (SELECT auth_user_org_ids()) AND auth_has_org_role(organization_id, ARRAY['owner']))
  WITH CHECK (organization_id IN (SELECT auth_user_org_ids()) AND auth_has_org_role(organization_id, ARRAY['owner']));

-- Usage Records
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records FORCE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select on usage_records" ON public.usage_records
  FOR SELECT TO authenticated USING (organization_id IN (SELECT auth_user_org_ids()));

-- Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select on audit_logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (organization_id IN (SELECT auth_user_org_ids()));
