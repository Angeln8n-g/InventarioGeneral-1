-- Rollback Migration 036
DROP TRIGGER IF EXISTS trg_audit_loans ON public.loans;
DROP TRIGGER IF EXISTS trg_audit_tool_instances ON public.tool_instances;
DROP TRIGGER IF EXISTS trg_audit_consumable_stock ON public.consumable_stock;
DROP TRIGGER IF EXISTS trg_audit_device_assignments ON public.device_assignments;

DROP FUNCTION IF EXISTS public.log_table_audit();

DROP INDEX IF EXISTS public.idx_audit_logs_cursor;
DROP INDEX IF EXISTS public.idx_stock_movements_cursor;
DROP INDEX IF EXISTS public.idx_stock_movements_stock_date;
