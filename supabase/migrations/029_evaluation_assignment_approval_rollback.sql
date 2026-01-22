-- Rollback Migration 029: Evaluation Assignment and Approval System
-- This rollback removes the assignment and approval fields

-- Remove indexes first
DROP INDEX IF EXISTS idx_scheduled_evaluations_assigned_to;
DROP INDEX IF EXISTS idx_scheduled_evaluations_approver_id;
DROP INDEX IF EXISTS idx_evaluation_results_approval_status;
DROP INDEX IF EXISTS idx_evaluation_results_approved_by;

-- Remove columns from evaluation_results
ALTER TABLE evaluation_results DROP COLUMN IF EXISTS approval_comments;
ALTER TABLE evaluation_results DROP COLUMN IF EXISTS approved_at;
ALTER TABLE evaluation_results DROP COLUMN IF EXISTS approved_by;
ALTER TABLE evaluation_results DROP COLUMN IF EXISTS approval_status;

-- Remove columns from scheduled_evaluations
ALTER TABLE scheduled_evaluations DROP COLUMN IF EXISTS approver_id;
ALTER TABLE scheduled_evaluations DROP COLUMN IF EXISTS assigned_to;

-- Verification
DO $
BEGIN
  RAISE NOTICE 'Rollback 029 completed - Evaluation Assignment and Approval fields removed';
END;
$;
