-- ==============================================================================
-- Migration 036: Automated Database Triggers for Audit Logging & Performance
-- ==============================================================================

-- 1. Create Generic Audit Trigger Function
CREATE OR REPLACE FUNCTION public.log_table_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id INTEGER;
    v_old_values JSONB := NULL;
    v_new_values JSONB := NULL;
    v_entity_id INTEGER;
BEGIN
    -- Extract context user if set via session
    BEGIN
        v_user_id := NULLIF(current_setting('app.current_user_id', true), '')::INTEGER;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF TG_OP = 'INSERT' THEN
        v_entity_id := NEW.id;
        v_new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_entity_id := NEW.id;
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_entity_id := OLD.id;
        v_old_values := to_jsonb(OLD);
    END IF;

    -- Avoid logging updated_at-only changes
    IF TG_OP = 'UPDATE' AND (v_old_values - 'updated_at' - 'version') = (v_new_values - 'updated_at' - 'version') THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values,
        created_at
    ) VALUES (
        COALESCE(v_user_id, CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN (NEW.user_id)::INTEGER ELSE NULL END),
        LOWER(TG_TABLE_NAME || '_' || TG_OP),
        TG_TABLE_NAME,
        v_entity_id,
        v_old_values,
        v_new_values,
        CURRENT_TIMESTAMP
    );

    RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
    -- Prevent audit log failure from blocking business transaction
    RAISE WARNING 'Audit log trigger failure on %: %', TG_TABLE_NAME, SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- 2. Attach Triggers to Critical Tables
DROP TRIGGER IF EXISTS trg_audit_loans ON public.loans;
CREATE TRIGGER trg_audit_loans
AFTER INSERT OR UPDATE OR DELETE ON public.loans
FOR EACH ROW EXECUTE FUNCTION public.log_table_audit();

DROP TRIGGER IF EXISTS trg_audit_tool_instances ON public.tool_instances;
CREATE TRIGGER trg_audit_tool_instances
AFTER INSERT OR UPDATE OR DELETE ON public.tool_instances
FOR EACH ROW EXECUTE FUNCTION public.log_table_audit();

DROP TRIGGER IF EXISTS trg_audit_consumable_stock ON public.consumable_stock;
CREATE TRIGGER trg_audit_consumable_stock
AFTER INSERT OR UPDATE OR DELETE ON public.consumable_stock
FOR EACH ROW EXECUTE FUNCTION public.log_table_audit();

DROP TRIGGER IF EXISTS trg_audit_device_assignments ON public.device_assignments;
CREATE TRIGGER trg_audit_device_assignments
AFTER INSERT OR UPDATE OR DELETE ON public.device_assignments
FOR EACH ROW EXECUTE FUNCTION public.log_table_audit();

-- 3. High-Performance Keyset/Cursor Pagination Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_cursor ON public.audit_logs (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_cursor ON public.stock_movements (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_stock_date ON public.stock_movements (consumable_stock_id, created_at DESC);
