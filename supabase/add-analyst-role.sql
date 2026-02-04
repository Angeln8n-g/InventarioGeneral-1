-- ============================================
-- SCRIPT PARA AGREGAR ROL DE ANALISTA
-- Ejecuta este script en el SQL Editor de Supabase
-- ============================================

-- 1. Insertar el rol de analista si no existe
INSERT INTO roles (name, description, is_protected)
VALUES ('analyst', 'Analista con acceso a reportes y dashboard admin', FALSE)
ON CONFLICT (name) DO NOTHING;

-- 2. Obtener el ID del rol analyst y asignar al usuario
DO $$
DECLARE
    analyst_role_id INTEGER;
    target_user_id INTEGER;
BEGIN
    -- Obtener el ID del rol analyst
    SELECT id INTO analyst_role_id FROM roles WHERE name = 'analyst';
    
    -- Obtener el ID del usuario Bene_Germ
    SELECT id INTO target_user_id FROM users WHERE username = 'Bene_Germ';
    
    -- Actualizar el usuario con el rol de analyst
    IF target_user_id IS NOT NULL AND analyst_role_id IS NOT NULL THEN
        UPDATE users SET role_id = analyst_role_id WHERE id = target_user_id;
        RAISE NOTICE 'Usuario Bene_Germ actualizado con rol analyst (role_id: %)', analyst_role_id;
    ELSE
        RAISE NOTICE 'Usuario o rol no encontrado. user_id: %, role_id: %', target_user_id, analyst_role_id;
    END IF;
END $$;

-- 3. Agregar permisos básicos al rol analyst
-- La tabla role_permissions usa 'permission' (VARCHAR), no 'permission_id'
INSERT INTO role_permissions (role_id, permission)
SELECT r.id, p.permission_name
FROM roles r
CROSS JOIN (
    VALUES 
        ('admin:view_dashboard'),
        ('reports:view'),
        ('reports:export'),
        ('audit:view'),
        ('tools:view'),
        ('consumables:view'),
        ('loans:view_all'),
        ('sections:dashboard'),
        ('sections:my_loans'),
        ('sections:consumables'),
        ('sections:profile')
) AS p(permission_name)
WHERE r.name = 'analyst'
ON CONFLICT (role_id, permission) DO NOTHING;

-- 4. Verificar los cambios
SELECT 'Rol analyst creado y asignado!' as status;

-- Ver el usuario actualizado
SELECT u.id, u.username, u.email, u.role_id, r.name as role_name
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.username = 'Bene_Germ';

-- Ver los permisos del rol analyst
SELECT r.name as role_name, rp.permission
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
WHERE r.name = 'analyst';
