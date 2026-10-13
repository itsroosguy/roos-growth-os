-- Migration: 20261012000006_automations.sql
-- Description: Milestone 7 Workflow Automation & Scheduled Follow-ups schema extensions

-- 1. Extend public.automation_rules with multi-step actions, condition sets, and performance stats
ALTER TABLE public.automation_rules 
    ADD COLUMN IF NOT EXISTS conditions JSONB NOT NULL DEFAULT '[]'::JSONB,
    ADD COLUMN IF NOT EXISTS actions JSONB NOT NULL DEFAULT '[]'::JSONB,
    ADD COLUMN IF NOT EXISTS template_id TEXT,
    ADD COLUMN IF NOT EXISTS total_executions INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS success_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS failure_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_executed_at TIMESTAMPTZ;

-- 2. Extend public.automation_executions with execution diagnostics
ALTER TABLE public.automation_executions
    ADD COLUMN IF NOT EXISTS actions_executed JSONB NOT NULL DEFAULT '[]'::JSONB,
    ADD COLUMN IF NOT EXISTS duration_ms INTEGER;

-- 3. Indexes for fast queue queries and tenant analytics
CREATE INDEX IF NOT EXISTS idx_automation_rules_org ON public.automation_rules (organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_executions_org ON public.automation_executions (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_executions_rule_status ON public.automation_executions (rule_id, status);
CREATE INDEX IF NOT EXISTS idx_executions_idempotency ON public.automation_executions (idempotency_key);

-- 4. Audit logging trigger for automation rule configuration changes
CREATE OR REPLACE FUNCTION public.log_automation_rule_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (
        organization_id,
        actor_id,
        action,
        resource_type,
        resource_id,
        details
    ) VALUES (
        COALESCE(NEW.organization_id, OLD.organization_id),
        auth.uid(),
        TG_OP,
        'automation_rule',
        COALESCE(NEW.id, OLD.id),
        jsonb_build_object(
            'rule_name', COALESCE(NEW.name, OLD.name),
            'trigger_type', COALESCE(NEW.trigger_type, OLD.trigger_type),
            'is_active', COALESCE(NEW.is_active, OLD.is_active)
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_automation_rules ON public.automation_rules;
CREATE TRIGGER trg_audit_automation_rules
    AFTER INSERT OR UPDATE OR DELETE ON public.automation_rules
    FOR EACH ROW EXECUTE FUNCTION public.log_automation_rule_changes();
