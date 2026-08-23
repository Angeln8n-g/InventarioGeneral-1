-- Rollback Migration 035
DROP FUNCTION IF EXISTS public.soft_delete_entity(TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.restore_entity(TEXT, INTEGER);

DROP INDEX IF EXISTS public.idx_item_types_not_deleted;
DROP INDEX IF EXISTS public.idx_tool_instances_not_deleted;
DROP INDEX IF EXISTS public.idx_electronic_devices_not_deleted;
DROP INDEX IF EXISTS public.idx_classrooms_not_deleted;
DROP INDEX IF EXISTS public.idx_device_categories_not_deleted;

ALTER TABLE public.item_types DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE public.tool_instances DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE public.electronic_devices DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE public.classrooms DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE public.device_categories DROP COLUMN IF EXISTS deleted_at;
