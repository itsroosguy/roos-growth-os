-- ==============================================================================
-- MIGRATION: 20261012000003_auth_triggers.sql
-- DESCRIPTION: Automated profile creation & initial organization bootstrap trigger
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_org_id UUID;
    org_name TEXT;
    org_slug TEXT;
    user_full_name TEXT;
BEGIN
    -- Extract metadata from raw_user_meta_data
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    org_name := NEW.raw_user_meta_data->>'initial_org_name';
    org_slug := NEW.raw_user_meta_data->>'initial_org_slug';

    -- 1. Create Profile record
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, user_full_name)
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);

    -- 2. Bootstrap Initial Organization if provided during signup
    IF org_name IS NOT NULL AND org_slug IS NOT NULL THEN
        -- Insert organization (or recover existing if same slug)
        INSERT INTO public.organizations (name, slug, plan_tier)
        VALUES (org_name, org_slug, 'starter')
        ON CONFLICT (slug) DO NOTHING
        RETURNING id INTO new_org_id;

        IF new_org_id IS NOT NULL THEN
            -- Add user as OWNER
            INSERT INTO public.organization_members (organization_id, user_id, role, status)
            VALUES (new_org_id, NEW.id, 'owner', 'active');

            -- Initialize subscription
            INSERT INTO public.subscriptions (organization_id, plan_tier, status, mode)
            VALUES (new_org_id, 'starter', 'active', 'development');

            -- Initialize mock WhatsApp connection
            INSERT INTO public.whatsapp_connections (organization_id, mode, status)
            VALUES (new_org_id, 'mock', 'connected');

            -- Log audit record
            INSERT INTO public.audit_logs (organization_id, actor_id, action, entity_type, entity_id)
            VALUES (new_org_id, NEW.id, 'org.created', 'organizations', new_org_id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Drop if exists and recreate trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
