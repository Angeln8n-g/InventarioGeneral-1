-- Migration 029: Evaluation Assignment and Approval System
-- This migration adds support for:
-- 1. Assigning evaluations to specific evaluators
-- 2. Approval workflow for completed evaluations
-- Created: 2025-01-22
-- Related to: classroom-evaluation-system spec

-- ============================================================================
-- 1. Add assignment fields to scheduled_evaluations
-- ============================================================================

-- Add assigned_to field (the evaluator who will perform the evaluation)
ALTER TABLE scheduled_evaluations 
ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id);

-- Add approver_id field (the admin who will approve the evaluation)
ALTER TABLE scheduled_evaluations 
ADD COLUMN IF NOT EXISTS approver_id INTEGER REFERENCES users(id);

-- Create index for assigned_to
CREATE INDEX IF NOT EXISTS idx_scheduled_evaluations_assigned_to 
ON scheduled_evaluations(assigned_to);

-- Create index for approver_id
CREATE INDEX IF NOT EXISTS idx_scheduled_evaluations_approver_id 
ON scheduled_evaluations(approver_id);

-- Add comments
COMMENT ON COLUMN scheduled_evaluations.assigned_to IS 'User ID of the evaluator assigned to perform this evaluation';
COMMENT ON COLUMN scheduled_evaluations.approver_id IS 'User ID of the admin who will approve the completed evaluation';

-- ============================================================================
-- 2. Add approval fields to evaluation_results
-- ============================================================================

-- Add approval status
ALTER TABLE evaluation_results 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending' 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Add approved_by (who approved/rejected)
ALTER TABLE evaluation_results 
ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id);

-- Add approval timestamp
ALTER TABLE evaluation_results 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Add approval comments (reason for approval/rejection)
ALTER TABLE evaluation_results 
ADD COLUMN IF NOT EXISTS approval_comments TEXT;

-- Create indexes for approval fields
CREATE INDEX IF NOT EXISTS idx_evaluation_results_approval_status 
ON evaluation_results(approval_status);

CREATE INDEX IF NOT EXISTS idx_evaluation_results_approved_by 
ON evaluation_results(approved_by);

-- Add comments
COMMENT ON COLUMN evaluation_results.approval_status IS 'Approval status: pending, approved, or rejected';
COMMENT ON COLUMN evaluation_results.approved_by IS 'User ID of the admin who approved/rejected the evaluation';
COMMENT ON COLUMN evaluation_results.approved_at IS 'Timestamp when the evaluation was approved/rejected';
COMMENT ON COLUMN evaluation_results.approval_comments IS 'Comments from the approver explaining the decision';

-- ============================================================================
-- 3. Add new notification types for evaluations
-- ============================================================================

-- Note: The notifications table already exists with a 'type' column
-- We'll add new notification types through the application code
-- Types to add:
-- - 'evaluation_assigned': When an evaluation is assigned to an evaluator
-- - 'evaluation_pending_approval': When an evaluation needs approval
-- - 'evaluation_approved': When an evaluation is approved
-- - 'evaluation_rejected': When an evaluation is rejected

-- ============================================================================
-- 4. Verification
-- ============================================================================

DO $$
BEGIN
  -- Verify assigned_to column exists
  ASSERT (
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_name = 'scheduled_evaluations' AND column_name = 'assigned_to'
  ) = 1, 'assigned_to column was not added to scheduled_evaluations';
  
  -- Verify approver_id column exists
  ASSERT (
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_name = 'scheduled_evaluations' AND column_name = 'approver_id'
  ) = 1, 'approver_id column was not added to scheduled_evaluations';
  
  -- Verify approval_status column exists
  ASSERT (
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_name = 'evaluation_results' AND column_name = 'approval_status'
  ) = 1, 'approval_status column was not added to evaluation_results';
  
  -- Verify approved_by column exists
  ASSERT (
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_name = 'evaluation_results' AND column_name = 'approved_by'
  ) = 1, 'approved_by column was not added to evaluation_results';
  
  RAISE NOTICE 'Migration 029 completed successfully - Evaluation Assignment and Approval fields added';
END;
$$;

-- ============================================================================
-- Migration complete
-- ============================================================================
