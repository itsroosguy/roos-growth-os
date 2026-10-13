-- ==============================================================================
-- SEED DATA: supabase/seed.sql
-- DESCRIPTION: Development seed data with 2 independent organizations
-- ==============================================================================

-- 1. Create Organization A: Acme Technologies
INSERT INTO public.organizations (id, name, slug, plan_tier)
VALUES ('11111111-1111-1111-1111-111111111111', 'Acme Technologies', 'acme-corp', 'growth')
ON CONFLICT (slug) DO NOTHING;

-- 2. Create Organization B: Beta Logistics
INSERT INTO public.organizations (id, name, slug, plan_tier)
VALUES ('22222222-2222-2222-2222-222222222222', 'Beta Logistics', 'beta-logistics', 'starter')
ON CONFLICT (slug) DO NOTHING;

-- Initialize WhatsApp connection for Org A (mock mode)
INSERT INTO public.whatsapp_connections (organization_id, mode, status)
VALUES ('11111111-1111-1111-1111-111111111111', 'mock', 'connected')
ON CONFLICT (organization_id) DO NOTHING;

-- Initialize WhatsApp connection for Org B (mock mode)
INSERT INTO public.whatsapp_connections (organization_id, mode, status)
VALUES ('22222222-2222-2222-2222-222222222222', 'mock', 'connected')
ON CONFLICT (organization_id) DO NOTHING;

-- Contacts for Org A
INSERT INTO public.contacts (organization_id, first_name, last_name, phone, email, company)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Rajesh', 'Kumar', '+919876543210', 'rajesh@techcorp.in', 'TechCorp India'),
    ('11111111-1111-1111-1111-111111111111', 'Priya', 'Sharma', '+919876543211', 'priya@apexventures.com', 'Apex Ventures')
ON CONFLICT DO NOTHING;

-- Contacts for Org B (Cross-tenant separation test data)
INSERT INTO public.contacts (organization_id, first_name, last_name, phone, email, company)
VALUES 
    ('22222222-2222-2222-2222-222222222222', 'Vikram', 'Singh', '+919876543220', 'vikram@translog.in', 'TransLog')
ON CONFLICT DO NOTHING;
