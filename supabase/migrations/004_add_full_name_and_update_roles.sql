-- Add full_name column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);

-- Update existing users to have a full_name (using username as default)
UPDATE users SET full_name = username WHERE full_name IS NULL;

-- Make full_name NOT NULL after populating it
ALTER TABLE users ALTER COLUMN full_name SET NOT NULL;

-- Update role constraint to keep only user and admin
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));

-- Update default role to 'user'
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';

-- Update existing roles (student, teacher) to 'user'
UPDATE users SET role = 'user' WHERE role IN ('student', 'teacher');
