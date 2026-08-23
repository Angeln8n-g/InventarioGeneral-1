-- ==============================================================================
-- Migration 027: Database Health, Index Optimization & Security Remediation
-- ==============================================================================

-- 1. DROP REDUNDANT INDEXES (Covered by unique constraints or exact duplicates)
DROP INDEX IF EXISTS public.idx_tool_instances_qr_code;
DROP INDEX IF EXISTS public.idx_consumable_stock_qr_code;
DROP INDEX IF EXISTS public.idx_warehouse_qr_codes_qr_code;
DROP INDEX IF EXISTS public.idx_notification_preferences_user_id;
DROP INDEX IF EXISTS public.idx_device_assignments_device;

-- 2. CREATE MISSING COVERING INDEXES FOR FOREIGN KEYS
CREATE INDEX IF NOT EXISTS idx_internet_services_created_by ON public.classroom_internet_services (created_by);
CREATE INDEX IF NOT EXISTS idx_consumable_requests_item_type ON public.consumable_requests (item_type_id);
CREATE INDEX IF NOT EXISTS idx_consumable_requests_user ON public.consumable_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_device_assignments_assigned_by ON public.device_assignments (assigned_by);
CREATE INDEX IF NOT EXISTS idx_device_assignments_removed_by ON public.device_assignments (removed_by);
CREATE INDEX IF NOT EXISTS idx_device_combinations_created_by ON public.device_combinations (created_by);
CREATE INDEX IF NOT EXISTS idx_device_combinations_removed_by ON public.device_combinations (removed_by);
CREATE INDEX IF NOT EXISTS idx_device_movements_moved_by ON public.device_movements (moved_by);
CREATE INDEX IF NOT EXISTS idx_evaluation_templates_created_by ON public.evaluation_templates (created_by);
CREATE INDEX IF NOT EXISTS idx_maintenance_reports_created_by ON public.maintenance_reports (created_by);
CREATE INDEX IF NOT EXISTS idx_maintenance_reports_updated_by ON public.maintenance_reports (updated_by);
CREATE INDEX IF NOT EXISTS idx_qr_scan_attempts_scanned_qr ON public.qr_scan_attempts (scanned_qr_code_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_evaluations_created_by ON public.scheduled_evaluations (created_by);

-- 3. CREATE GENERIC updated_at TRIGGER FUNCTION AND ATTACH MISSING TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_category_fields_updated_at ON public.category_fields;
CREATE TRIGGER trigger_category_fields_updated_at
BEFORE UPDATE ON public.category_fields
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_device_custom_fields_updated_at ON public.device_custom_fields;
CREATE TRIGGER trigger_device_custom_fields_updated_at
BEFORE UPDATE ON public.device_custom_fields
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_evaluation_feedback_updated_at ON public.evaluation_feedback;
CREATE TRIGGER trigger_evaluation_feedback_updated_at
BEFORE UPDATE ON public.evaluation_feedback
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. UPDATE USERS ROLE CHECK CONSTRAINT TO SUPPORT DYNAMIC/ANALYST ROLES
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('user', 'admin', 'analyst', 'teacher', 'student', 'technician'));

-- 5. FUNCTION SECURITY HARDENING (SET search_path)
ALTER FUNCTION public.get_classroom_device_count(integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at_with_version() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_evaluation_template_timestamp() SET search_path = public, pg_temp;
ALTER FUNCTION public.can_combine_devices(integer, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_template_question_timestamp() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_classroom_timestamp() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_device_assignment_timestamp() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_device_combination_timestamp() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_maintenance_reports_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_scheduled_evaluation_timestamp() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_evaluation_result_timestamp() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_category_fields_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_classroom_reservation_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_internet_service_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_device_custom_fields_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_consumable_reservations_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.expire_old_reservations() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_consumable_returns_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_warehouse_qr_codes_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_recent_failed_attempts(integer, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_active_warehouse_qr_codes() SET search_path = public, pg_temp;
ALTER FUNCTION public.notify_failed_scan_attempt() SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_consumable_qr_code() SET search_path = public, pg_temp;
ALTER FUNCTION public.create_default_notification_preferences() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_updated_at() SET search_path = public, pg_temp;

-- 6. RESTRICT EXECUTE ON rls_auto_enable
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM public, anon, authenticated;
