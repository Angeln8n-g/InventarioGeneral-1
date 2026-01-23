-- Migration 030: Evaluation Responsible Person Feedback
-- This migration adds support for:
-- 1. Responsible person feedback on completed evaluations
-- 2. Linking responsible_person to users table
-- Created: 2025-01-22
-- Related to: classroom-evaluation-system spec

-- ============================================================================
-- 1. Add responsible_user_id to classrooms table
-- ============================================================================

-- Add responsible_user_id field to link responsible_person to a user account
ALTER TABLE classrooms 
ADD COLUMN IF NOT EXISTS responsible_user_id INTEGER REFERENCES users(id);

-- Create index for responsible_user_id
CREATE INDEX IF NOT EXISTS idx_classrooms_responsible_user_id 
ON classrooms(responsible_user_id);

-- Add comment
COMMENT ON COLUMN classrooms.responsible_user_id IS 'User ID of the responsible person for this classroom (allows notifications and feedback)';

-- ============================================================================
-- 2. Create evaluation_feedback table
-- ============================================================================

CREATE TABLE IF NOT EXISTS evaluation_feedback (
  id SERIAL PRIMARY KEY,
  evaluation_result_id INTEGER NOT NULL REFERENCES evaluation_results(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  agrees_with_result BOOLEAN NOT NULL,
  feedback_comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one feedback per user per evaluation result
  UNIQUE(evaluation_result_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_evaluation_feedback_result_id 
ON evaluation_feedback(evaluation_result_id);

CREATE INDEX IF NOT EXISTS idx_evaluation_feedback_user_id 
ON evaluation_feedback(user_id);

-- Add comments
COMMENT ON TABLE evaluation_feedback IS 'Feedback from responsible persons on evaluation results';
COMMENT ON COLUMN evaluation_feedback.evaluation_result_id IS 'The evaluation result this feedback is for';
COMMENT ON COLUMN evaluation_feedback.user_id IS 'The user providing feedback (typically the responsible person)';
COMMENT ON COLUMN evaluation_feedback.agrees_with_result IS 'Whether the user agrees with the evaluation result';
COMMENT ON COLUMN evaluation_feedback.feedback_comments IS 'Comments explaining agreement or disagreement';

-- ============================================================================
-- 3. Add new notification types for responsible person
-- ============================================================================

-- Note: The notifications table already exists with a 'type' column
-- New notification types to add through application code:
-- - 'evaluation_completed_for_space': When an evaluation is completed for a space the user is responsible for
-- - 'evaluation_feedback_received': When a responsible person provides feedback on an evaluation

-- ============================================================================
-- 4. Verification
-- ============================================================================

DO $$
BEGIN
  -- Verify responsible_user_id column exists
  ASSERT (
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_name = 'classrooms' AND column_name = 'responsible_user_id'
  ) = 1, 'responsible_user_id column was not added to classrooms';
  
  -- Verify evaluation_feedback table exists
  ASSERT (
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_name = 'evaluation_feedback'
  ) = 1, 'evaluation_feedback table was not created';
  
  RAISE NOTICE 'Migration 030 completed successfully - Evaluation Responsible Feedback tables added';
END;
$$;

-- ============================================================================
-- Migration complete
-- ============================================================================
