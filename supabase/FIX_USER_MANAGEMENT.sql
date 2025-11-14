-- ============================================
-- FIX: Add full_name column to users table
-- ============================================
-- This SQL adds the missing full_name column needed for user management
-- 
-- HOW TO RUN:
-- 1. Go to Supabase Dashboard
-- 2. Click on "SQL Editor" in the left menu
-- 3. Click "New Query"
-- 4. Copy and paste this entire file
-- 5. Click "Run" or press Ctrl+Enter
-- ============================================

-- Step 1: Add full_name column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);

-- Step 2: Update existing users to have a full_name (using username as default)
UPDATE users SET full_name = username WHERE full_name IS NULL OR full_name = '';

-- Step 3: Verify the changes
SELECT 
    id,
    username,
    email,
    role,
    full_name,
    created_at
FROM users
ORDER BY id;

-- ============================================
-- Expected Result:
-- You should see all users with their full_name populated
-- ============================================
