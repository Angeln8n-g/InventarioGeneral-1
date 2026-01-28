# Migration 031: Dynamic Permissions System Schema

## Overview

This migration creates the database schema for the Dynamic Permissions System, which replaces the hardcoded role-based permissions with a flexible, database-driven approach.

## Requirements Addressed

- **Requirement 8.3**: Database schema for dynamic permissions
- **Requirement 9.5**: Optimized indexes for permission queries

## Tables Created

### 1. `roles`
Stores custom roles that can be assigned to users.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR(50) | Unique role name |
| description | TEXT | Role description |
| is_protected | BOOLEAN | Protected roles cannot be deleted (admin, user) |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### 2. `role_permissions`
Maps permissions to roles (many-to-many relationship).

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| role_id | INTEGER | Foreign key to roles |
| permission | VARCHAR(100) | Permission identifier (e.g., tools:view) |
| created_at | TIMESTAMP | Creation timestamp |

### 3. `user_permissions`
User-specific permission overrides that supersede role permissions.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | INTEGER | Foreign key to users |
| permission | VARCHAR(100) | Permission identifier |
| is_granted | BOOLEAN | true = granted, false = revoked |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### 4. `sections`
System sections with access control requirements.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR(100) | Section display name |
| path | VARCHAR(200) | Unique URL path |
| description | TEXT | Section description |
| required_permission | VARCHAR(100) | Permission required for access |
| parent_section_id | INTEGER | Self-reference for hierarchy |
| display_order | INTEGER | Order for display in navigation |
| is_admin_section | BOOLEAN | Whether it's an admin section |
| created_at | TIMESTAMP | Creation timestamp |

### 5. `permissions_audit`
Immutable audit log for all permission changes.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| admin_user_id | INTEGER | User who made the change |
| action_type | VARCHAR(50) | Type of action performed |
| target_type | VARCHAR(20) | 'role' or 'user' |
| target_id | INTEGER | ID of affected entity |
| target_name | VARCHAR(100) | Name of affected entity |
| changes | JSONB | Detailed change information |
| ip_address | INET | IP address of admin |
| user_agent | TEXT | Browser user agent |
| created_at | TIMESTAMP | Timestamp of change |

## Schema Modifications

### `users` table
Added column:
- `role_id INTEGER REFERENCES roles(id)` - Links users to dynamic roles

## Indexes Created

### For `role_permissions`:
- `idx_role_permissions_role_id` - Fast lookup by role
- `idx_role_permissions_permission` - Fast lookup by permission

### For `user_permissions`:
- `idx_user_permissions_user_id` - Fast lookup by user
- `idx_user_permissions_permission` - Fast lookup by permission

### For `sections`:
- `idx_sections_path` - Fast lookup by URL path
- `idx_sections_required_permission` - Fast lookup by permission
- `idx_sections_parent` - Fast lookup for hierarchy

### For `permissions_audit`:
- `idx_permissions_audit_target` - Composite index for target queries
- `idx_permissions_audit_admin` - Fast lookup by admin user
- `idx_permissions_audit_created` - Descending index for recent entries
- `idx_permissions_audit_action` - Fast lookup by action type

### For `users`:
- `idx_users_role_id` - Fast lookup by role

## Triggers

- `update_roles_updated_at` - Auto-updates `updated_at` on roles
- `update_user_permissions_updated_at` - Auto-updates `updated_at` on user_permissions

## Rollback

To rollback this migration, run:
```sql
\i supabase/migrations/031_dynamic_permissions_schema_rollback.sql
```

## Next Steps

After applying this migration:
1. Run the seed script (Task 1.2) to populate initial roles and sections
2. Run the data migration script (Task 1.3) to migrate existing users
