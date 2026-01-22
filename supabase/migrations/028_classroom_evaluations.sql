-- Migration 028: Classroom Evaluation System
-- This migration adds support for classroom condition evaluations
-- Created: 2025-01-XX
-- Related to: classroom-evaluation-system spec

-- ============================================================================
-- 1. Create evaluation_templates table
-- ============================================================================

CREATE TABLE IF NOT EXISTS evaluation_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  space_type VARCHAR(50) NOT NULL CHECK (space_type IN ('training_room', 'warehouse', 'external_plant')),
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for evaluation_templates
CREATE INDEX idx_evaluation_templates_space_type ON evaluation_templates(space_type);
CREATE INDEX idx_evaluation_templates_is_active ON evaluation_templates(is_active);

-- Add comments
COMMENT ON TABLE evaluation_templates IS 'Templates for classroom condition evaluations with configurable questions';
COMMENT ON COLUMN evaluation_templates.space_type IS 'Type of space: training_room, warehouse, or external_plant';
COMMENT ON COLUMN evaluation_templates.version IS 'Version number for template versioning when modified';
COMMENT ON COLUMN evaluation_templates.is_active IS 'Whether the template is currently active and available for use';

-- ============================================================================
-- 2. Create template_questions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS template_questions (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES evaluation_templates(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('organization', 'cleanliness', 'maintenance')),
  is_required BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for template_questions
CREATE INDEX idx_template_questions_template ON template_questions(template_id);
CREATE INDEX idx_template_questions_category ON template_questions(category);

-- Add comments
COMMENT ON TABLE template_questions IS 'Questions belonging to evaluation templates';
COMMENT ON COLUMN template_questions.category IS 'Question category: organization, cleanliness, or maintenance';
COMMENT ON COLUMN template_questions.is_required IS 'Whether the question must be answered to submit evaluation';
COMMENT ON COLUMN template_questions.display_order IS 'Order in which questions are displayed in the questionnaire';

-- ============================================================================
-- 3. Create scheduled_evaluations table
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduled_evaluations (
  id SERIAL PRIMARY KEY,
  classroom_id INTEGER NOT NULL REFERENCES classrooms(id),
  template_id INTEGER NOT NULL REFERENCES evaluation_templates(id),
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue', 'cancelled')),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for scheduled_evaluations
CREATE INDEX idx_scheduled_evaluations_date ON scheduled_evaluations(scheduled_date);
CREATE INDEX idx_scheduled_evaluations_classroom ON scheduled_evaluations(classroom_id);
CREATE INDEX idx_scheduled_evaluations_status ON scheduled_evaluations(status);
CREATE INDEX idx_scheduled_evaluations_template ON scheduled_evaluations(template_id);

-- Add comments
COMMENT ON TABLE scheduled_evaluations IS 'Scheduled evaluations for classrooms with date and status tracking';
COMMENT ON COLUMN scheduled_evaluations.status IS 'Evaluation status: pending, completed, overdue, or cancelled';
COMMENT ON COLUMN scheduled_evaluations.scheduled_date IS 'Date and time when the evaluation is scheduled';

-- ============================================================================
-- 4. Create evaluation_results table
-- ============================================================================

CREATE TABLE IF NOT EXISTS evaluation_results (
  id SERIAL PRIMARY KEY,
  scheduled_evaluation_id INTEGER NOT NULL REFERENCES scheduled_evaluations(id),
  evaluator_id INTEGER NOT NULL REFERENCES users(id),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_score INTEGER NOT NULL,
  max_possible_score INTEGER NOT NULL,
  score_percentage DECIMAL(5,2) NOT NULL,
  organization_score INTEGER NOT NULL DEFAULT 0,
  organization_max INTEGER NOT NULL DEFAULT 0,
  cleanliness_score INTEGER NOT NULL DEFAULT 0,
  cleanliness_max INTEGER NOT NULL DEFAULT 0,
  maintenance_score INTEGER NOT NULL DEFAULT 0,
  maintenance_max INTEGER NOT NULL DEFAULT 0,
  is_draft BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for evaluation_results
CREATE INDEX idx_evaluation_results_scheduled ON evaluation_results(scheduled_evaluation_id);
CREATE INDEX idx_evaluation_results_evaluator ON evaluation_results(evaluator_id);
CREATE INDEX idx_evaluation_results_completed_at ON evaluation_results(completed_at);
CREATE INDEX idx_evaluation_results_is_draft ON evaluation_results(is_draft);

-- Add comments
COMMENT ON TABLE evaluation_results IS 'Results of completed evaluations with scores by category';
COMMENT ON COLUMN evaluation_results.total_score IS 'Total points earned (count of Yes responses)';
COMMENT ON COLUMN evaluation_results.max_possible_score IS 'Maximum possible points (total responses minus Not Applicable)';
COMMENT ON COLUMN evaluation_results.score_percentage IS 'Percentage score: (total_score / max_possible_score) * 100';
COMMENT ON COLUMN evaluation_results.is_draft IS 'Whether the evaluation is saved as draft (incomplete)';

-- ============================================================================
-- 5. Create evaluation_responses table
-- ============================================================================

CREATE TABLE IF NOT EXISTS evaluation_responses (
  id SERIAL PRIMARY KEY,
  result_id INTEGER NOT NULL REFERENCES evaluation_results(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES template_questions(id),
  response VARCHAR(20) NOT NULL CHECK (response IN ('yes', 'no', 'not_applicable')),
  observation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for evaluation_responses
CREATE INDEX idx_evaluation_responses_result ON evaluation_responses(result_id);
CREATE INDEX idx_evaluation_responses_question ON evaluation_responses(question_id);

-- Add comments
COMMENT ON TABLE evaluation_responses IS 'Individual responses to evaluation questions';
COMMENT ON COLUMN evaluation_responses.response IS 'Response value: yes, no, or not_applicable';
COMMENT ON COLUMN evaluation_responses.observation IS 'Optional observation or note, typically for No responses';

-- ============================================================================
-- 6. Create triggers for updated_at
-- ============================================================================

-- Trigger for evaluation_templates
CREATE OR REPLACE FUNCTION update_evaluation_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_evaluation_template_timestamp
  BEFORE UPDATE ON evaluation_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_evaluation_template_timestamp();

-- Trigger for template_questions
CREATE OR REPLACE FUNCTION update_template_question_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_template_question_timestamp
  BEFORE UPDATE ON template_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_template_question_timestamp();

-- Trigger for scheduled_evaluations
CREATE OR REPLACE FUNCTION update_scheduled_evaluation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_scheduled_evaluation_timestamp
  BEFORE UPDATE ON scheduled_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_evaluation_timestamp();

-- Trigger for evaluation_results
CREATE OR REPLACE FUNCTION update_evaluation_result_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_evaluation_result_timestamp
  BEFORE UPDATE ON evaluation_results
  FOR EACH ROW
  EXECUTE FUNCTION update_evaluation_result_timestamp();

-- Verification DO block
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'evaluation_templates') = 1,
    'evaluation_templates table was not created';
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'template_questions') = 1,
    'template_questions table was not created';
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'scheduled_evaluations') = 1,
    'scheduled_evaluations table was not created';
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'evaluation_results') = 1,
    'evaluation_results table was not created';
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'evaluation_responses') = 1,
    'evaluation_responses table was not created';
  
  RAISE NOTICE 'Migration 028 completed successfully - Classroom Evaluation System tables created';
END;
$$;

-- ============================================================================
-- Migration complete
-- ============================================================================
