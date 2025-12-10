-- Rollback: Remove classroom reservations table

-- Drop policies
DROP POLICY IF EXISTS "Users can view all classroom reservations" ON classroom_reservations;
DROP POLICY IF EXISTS "Users can create their own reservations" ON classroom_reservations;
DROP POLICY IF EXISTS "Users can update own reservations or admins any" ON classroom_reservations;
DROP POLICY IF EXISTS "Users can delete own reservations or admins any" ON classroom_reservations;

-- Drop trigger
DROP TRIGGER IF EXISTS trigger_classroom_reservation_updated_at ON classroom_reservations;

-- Drop function
DROP FUNCTION IF EXISTS update_classroom_reservation_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_classroom_reservations_classroom_id;
DROP INDEX IF EXISTS idx_classroom_reservations_user_id;
DROP INDEX IF EXISTS idx_classroom_reservations_status;
DROP INDEX IF EXISTS idx_classroom_reservations_datetime;

-- Drop table
DROP TABLE IF EXISTS classroom_reservations;
