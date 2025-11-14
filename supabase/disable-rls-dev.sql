-- ============================================
-- DESHABILITAR RLS PARA DESARROLLO
-- Ejecuta este script si tienes problemas de permisos
-- ============================================

-- ADVERTENCIA: Solo para desarrollo local
-- NO ejecutar en producción

-- Deshabilitar RLS en todas las tablas
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE item_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE tool_instances DISABLE ROW LEVEL SECURITY;
ALTER TABLE consumable_stock DISABLE ROW LEVEL SECURITY;
ALTER TABLE loans DISABLE ROW LEVEL SECURITY;
ALTER TABLE consumable_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS users_insert_self ON users;
DROP POLICY IF EXISTS users_select_own ON users;

-- Mensaje de confirmación
SELECT 'RLS deshabilitado para desarrollo' AS status;
SELECT 'ADVERTENCIA: No usar en producción' AS warning;
