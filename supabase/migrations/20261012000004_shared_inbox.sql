-- ==============================================================================
-- MIGRATION: 20261012000004_shared_inbox.sql
-- DESCRIPTION: Shared Inbox schema enhancements, conversation activities,
--              internal notes flagging, assignments, and multi-tenant RLS policies
-- ==============================================================================

-- 1. Extend conversations table with team assignment, resolution timestamps, and lead linkage
ALTER TABLE public.conversations 
    ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS assigned_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS unread_count INTEGER NOT NULL DEFAULT 0;

-- 2. Update conversation status check constraint to support open, pending, resolved, closed, snoozed
ALTER TABLE public.conversations 
    DROP CONSTRAINT IF EXISTS conversations_status_check;

ALTER TABLE public.conversations 
    ADD CONSTRAINT conversations_status_check 
    CHECK (status IN ('open', 'pending', 'resolved', 'closed', 'snoozed'));

-- 3. Extend messages table with internal note flag and sender_type check
ALTER TABLE public.messages 
    ADD COLUMN IF NOT EXISTS is_internal BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.messages 
    DROP CONSTRAINT IF EXISTS messages_sender_type_check;

ALTER TABLE public.messages 
    ADD CONSTRAINT messages_sender_type_check 
    CHECK (sender_type IN ('customer', 'staff', 'system', 'automation', 'internal_note'));

-- 4. Create conversation_activities table for audit and team collaboration timeline
CREATE TABLE IF NOT EXISTS public.conversation_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'status_changed',
        'assigned',
        'unassigned',
        'lead_linked',
        'lead_created',
        'note_added',
        'contact_updated'
    )),
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Indexes for shared inbox performance
CREATE INDEX IF NOT EXISTS idx_conversations_org_status ON public.conversations (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_org_assigned ON public.conversations (organization_id, assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_org_unread ON public.conversations (organization_id, unread_count);
CREATE INDEX IF NOT EXISTS idx_messages_conv_internal ON public.messages (conversation_id, is_internal);
CREATE INDEX IF NOT EXISTS idx_activities_conv_created ON public.conversation_activities (conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_activities_org ON public.conversation_activities (organization_id);

-- 6. Enable and Force Row Level Security on conversation_activities
ALTER TABLE public.conversation_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_activities FORCE ROW LEVEL SECURITY;

-- 7. RLS Policies for conversation_activities
CREATE POLICY "Tenant members can view conversation activities"
    ON public.conversation_activities
    FOR SELECT
    TO authenticated
    USING (organization_id IN (SELECT public.auth_user_org_ids()));

CREATE POLICY "Tenant members can insert conversation activities"
    ON public.conversation_activities
    FOR INSERT
    TO authenticated
    WITH CHECK (organization_id IN (SELECT public.auth_user_org_ids()));
