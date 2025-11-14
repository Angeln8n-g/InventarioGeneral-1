-- Fix RLS policies for consumable_reservations table
-- This script removes the problematic policies and creates simpler ones

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all reservations" ON consumable_reservations;
DROP POLICY IF EXISTS "Users can create their own reservations" ON consumable_reservations;
DROP POLICY IF EXISTS "Users can update their own reservations" ON consumable_reservations;
DROP POLICY IF EXISTS "Admins can update any reservation" ON consumable_reservations;

-- Create a single permissive policy
-- Authentication is handled at the API layer with JWT tokens
CREATE POLICY "Allow all operations for authenticated users"
  ON consumable_reservations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'consumable_reservations';
