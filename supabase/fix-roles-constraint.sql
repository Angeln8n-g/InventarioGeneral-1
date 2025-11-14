-- ============================================
-- SCRIPT PARA ARREGLAR EL CONSTRAINT DE ROLES
-- Ejecuta este script en el SQL Editor de Supabase
-- ============================================

-- 1. Agregar columna full_name si no existe
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);

-- 2. Actualizar usuarios existentes con full_name (usando username como default)
UPDATE users SET full_name = username WHERE full_name IS NULL;

-- 3. Hacer full_name NOT NULL
ALTER TABLE users ALTER COLUMN full_name SET NOT NULL;

-- 4. Eliminar el constraint antiguo de roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 5. Agregar el nuevo constraint con user y admin solamente
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));

-- 6. Actualizar el default role a 'user'
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';

-- 7. Actualizar usuarios existentes con roles antiguos a 'user'
UPDATE users SET role = 'user' WHERE role IN ('student', 'teacher');

-- Verificar los cambios
SELECT 'Constraint actualizado correctamente!' as status;
SELECT id, username, email, full_name, role FROM users;
