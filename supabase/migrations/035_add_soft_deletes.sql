-- ==============================================================================
-- Migration 035: Soft Deletes & Master Data Protection
-- ==============================================================================

-- 1. Add deleted_at column to master catalog tables
ALTER TABLE public.item_types ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.tool_instances ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.electronic_devices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.classrooms ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.device_categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. Create partial indexes for optimal queries filtering non-deleted records
CREATE INDEX IF NOT EXISTS idx_item_types_not_deleted ON public.item_types (id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tool_instances_not_deleted ON public.tool_instances (id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_electronic_devices_not_deleted ON public.electronic_devices (id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_classrooms_not_deleted ON public.classrooms (id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_device_categories_not_deleted ON public.device_categories (id, is_active) WHERE deleted_at IS NULL;

-- 3. Stored Procedure for Safe Soft Delete
CREATE OR REPLACE FUNCTION public.soft_delete_entity(
    p_table_name TEXT,
    p_id INTEGER,
    p_user_id INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF p_table_name NOT IN ('item_types', 'tool_instances', 'electronic_devices', 'classrooms', 'device_categories') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid table for soft delete');
    END IF;

    EXECUTE format('UPDATE %I SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL', p_table_name)
    USING p_id;

    RETURN jsonb_build_object(
        'success', true,
        'table', p_table_name,
        'id', p_id,
        'deleted_at', CURRENT_TIMESTAMP
    );
END;
$$;

-- 4. Stored Procedure for Entity Restore
CREATE OR REPLACE FUNCTION public.restore_entity(
    p_table_name TEXT,
    p_id INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF p_table_name NOT IN ('item_types', 'tool_instances', 'electronic_devices', 'classrooms', 'device_categories') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid table for restore');
    END IF;

    EXECUTE format('UPDATE %I SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NOT NULL', p_table_name)
    USING p_id;

    RETURN jsonb_build_object(
        'success', true,
        'table', p_table_name,
        'id', p_id,
        'restored_at', CURRENT_TIMESTAMP
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.soft_delete_entity TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.restore_entity TO authenticated, service_role, anon;
