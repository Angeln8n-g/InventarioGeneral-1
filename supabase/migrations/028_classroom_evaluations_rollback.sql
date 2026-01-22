-- Rollback Migration 028: Classroom Evaluation System
-- This script removes all tables and functions created by migration 028

-- ============================================================================
-- 1. Drop tables (in reverse order of dependencies)
-- ============================================================================

DROP TABLE IF EXISTS evaluation_responses CASCADE;
DROP TABLE IF EXISTS evaluation_results CASCADE;
DROP TABLE IF EXISTS scheduled_evaluations CASCADE;
DROP TABLE IF EXISTS template_questions CASCADE;
DROP TABLE IF EXISTS evaluation_templates CASCADE;

-- ============================================================================
-- 2. Drop trigger functions
-- ============================================================================

DROP FUNCTION IF EXISTS update_evaluation_template_timestamp() CASCADE;
DROP FUNCTION IF EXISTS update_template_question_timestamp() CASCADE;
DROP FUNCTION IF EXISTS update_scheduled_evaluation_timestamp() CASCADE;
DROP FUNCTION IF EXISTS update_evaluation_result_timestamp() CASCADE;

-- ============================================================================
-- Rollback complete
-- ============================================================================

DO $
BEGIN
  RAISE NOTICE 'Rollback of Migration 028 completed successfully - Classroom Evaluation System tables removed';
END $;
