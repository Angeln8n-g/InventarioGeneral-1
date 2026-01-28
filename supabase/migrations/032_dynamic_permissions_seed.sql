-- Migration: Dynamic Permissions System Seed Data
-- Description: Seeds initial roles, sections, and default permissions
-- Requirements: 4.1, 8.3
-- 
-- This migration creates:
-- - Initial protected roles (admin, user)
-- - 17 system sections as defined in requirements
-- - Default permissions for admin role (all permissions)
-- - Default permissions for user role (basic permissions)

-- ============================================
-- Insert Initial Roles
-- Requirement 8.3: Initial roles with protected flag
-- ============================================
INSERT INTO roles (name, description, is_protected) VALUES
  ('admin', 'Administrador del sistema', TRUE),
  ('user', 'Usuario estándar', TRUE);

-- ============================================
-- Insert System Sections
-- Requirement 4.1: 17 controllable sections
-- ============================================
INSERT INTO sections (name, path, required_permission, is_admin_section, display_order, description) VALUES
  -- User sections (non-admin)
  ('Dashboard', '/dashboard', 'sections:dashboard', FALSE, 1, 'Panel principal del usuario'),
  ('Herramientas', '/tools', 'sections:tools', FALSE, 2, 'Catálogo de herramientas disponibles'),
  ('Consumibles', '/consumables', 'sections:consumables', FALSE, 3, 'Catálogo de consumibles disponibles'),
  ('Mis Préstamos', '/my-loans', 'sections:my_loans', FALSE, 4, 'Préstamos activos del usuario'),
  ('Mis Espacios', '/my-spaces', 'sections:my_spaces', FALSE, 5, 'Espacios reservados por el usuario'),
  ('Perfil', '/profile', 'sections:profile', FALSE, 6, 'Perfil y configuración del usuario'),
  
  -- Admin sections
  ('Admin Dashboard', '/admin/dashboard', 'admin:view_dashboard', TRUE, 10, 'Panel de administración'),
  ('Admin Herramientas', '/admin/tools', 'admin:manage_tools', TRUE, 11, 'Gestión de herramientas'),
  ('Admin Consumibles', '/admin/consumables', 'admin:manage_consumables', TRUE, 12, 'Gestión de consumibles'),
  ('Admin Electrónicos', '/admin/electronics', 'admin:manage_electronics', TRUE, 13, 'Gestión de equipos electrónicos'),
  ('Admin Aulas', '/admin/classrooms', 'admin:manage_classrooms', TRUE, 14, 'Gestión de aulas y espacios'),
  ('Admin Asignaciones', '/admin/assignments', 'admin:manage_assignments', TRUE, 15, 'Gestión de asignaciones'),
  ('Admin Usuarios', '/admin/users', 'users:manage', TRUE, 16, 'Gestión de usuarios'),
  ('Admin Categorías', '/admin/categories', 'admin:manage_categories', TRUE, 17, 'Gestión de categorías'),
  ('Admin Reportes', '/admin/reports', 'reports:view', TRUE, 18, 'Reportes y estadísticas'),
  ('Admin Auditoría', '/admin/audit', 'audit:view', TRUE, 19, 'Registro de auditoría'),
  ('Admin Permisos', '/admin/permissions', 'admin:manage_permissions', TRUE, 20, 'Gestión de roles y permisos');

-- ============================================
-- Insert Admin Role Permissions (All Permissions)
-- Requirement 8.3: Admin has all permissions
-- ============================================
INSERT INTO role_permissions (role_id, permission)
SELECT r.id, p.permission
FROM roles r
CROSS JOIN (
  VALUES
    -- Section access permissions
    ('sections:dashboard'),
    ('sections:tools'),
    ('sections:consumables'),
    ('sections:my_loans'),
    ('sections:my_spaces'),
    ('sections:profile'),
    
    -- Tool management
    ('tools:view'),
    ('tools:create'),
    ('tools:update'),
    ('tools:delete'),
    ('tools:adjust_status'),
    ('tools:generate_qr'),
    
    -- Loan management
    ('loans:view_own'),
    ('loans:view_all'),
    ('loans:create'),
    ('loans:return_own'),
    ('loans:return_any'),
    ('loans:extend'),
    ('loans:override'),
    
    -- Consumable management
    ('consumables:view'),
    ('consumables:request'),
    ('consumables:manage_stock'),
    ('consumables:fulfill_requests'),
    
    -- Admin permissions
    ('admin:view_dashboard'),
    ('admin:manage_items'),
    ('admin:manage_tools'),
    ('admin:manage_consumables'),
    ('admin:manage_loans'),
    ('admin:manage_categories'),
    ('admin:manage_electronics'),
    ('admin:manage_classrooms'),
    ('admin:manage_assignments'),
    ('admin:manage_permissions'),
    
    -- User management
    ('users:view_own'),
    ('users:view_all'),
    ('users:create'),
    ('users:update_own'),
    ('users:update_any'),
    ('users:delete'),
    ('users:manage'),
    
    -- Notification management
    ('notifications:view_own'),
    ('notifications:view_all'),
    ('notifications:create'),
    ('notifications:send'),
    ('notifications:view'),
    
    -- Audit and reporting
    ('audit:view'),
    ('reports:view'),
    ('reports:export'),
    
    -- System administration
    ('system:configure'),
    ('system:backup'),
    ('system:maintenance')
) AS p(permission)
WHERE r.name = 'admin';

-- ============================================
-- Insert User Role Permissions (Basic Permissions)
-- Requirement 8.3: User has basic permissions
-- ============================================
INSERT INTO role_permissions (role_id, permission)
SELECT r.id, p.permission
FROM roles r
CROSS JOIN (
  VALUES
    -- Section access permissions (user sections only)
    ('sections:dashboard'),
    ('sections:tools'),
    ('sections:consumables'),
    ('sections:my_loans'),
    ('sections:my_spaces'),
    ('sections:profile'),
    
    -- Tool permissions (view only)
    ('tools:view'),
    
    -- Loan permissions (own loans)
    ('loans:view'),
    ('loans:view_own'),
    ('loans:create'),
    ('loans:return_own'),
    
    -- Consumable permissions (view and request)
    ('consumables:view'),
    ('consumables:request'),
    
    -- User permissions (own profile)
    ('users:view_own'),
    ('users:update_own'),
    
    -- Notification permissions (own notifications)
    ('notifications:view'),
    ('notifications:view_own')
) AS p(permission)
WHERE r.name = 'user';

-- ============================================
-- Add comments for documentation
-- ============================================
COMMENT ON TABLE roles IS 'System roles including protected admin and user roles';
COMMENT ON TABLE sections IS 'System sections with 17 controllable areas as per requirement 4.1';
COMMENT ON TABLE role_permissions IS 'Permission assignments for each role';
