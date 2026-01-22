# Migration 028: Classroom Evaluation System

## Overview

This migration adds support for the Classroom Evaluation System, which allows administrators to schedule and conduct evaluations of classroom conditions (organization, cleanliness, and maintenance).

## Tables Created

### 1. `evaluation_templates`
Templates for evaluation questionnaires with configurable questions.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR(255) | Template name |
| space_type | VARCHAR(50) | Type of space: 'training_room', 'warehouse', 'external_plant' |
| version | INTEGER | Version number for template versioning |
| is_active | BOOLEAN | Whether the template is active |
| created_by | INTEGER | FK to users table |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### 2. `template_questions`
Questions belonging to evaluation templates.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| template_id | INTEGER | FK to evaluation_templates |
| question_text | TEXT | The question text |
| category | VARCHAR(50) | Category: 'organization', 'cleanliness', 'maintenance' |
| is_required | BOOLEAN | Whether the question is required |
| display_order | INTEGER | Order for display |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### 3. `scheduled_evaluations`
Scheduled evaluations for classrooms.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| classroom_id | INTEGER | FK to classrooms table |
| template_id | INTEGER | FK to evaluation_templates |
| scheduled_date | TIMESTAMP | Scheduled date and time |
| status | VARCHAR(50) | Status: 'pending', 'completed', 'overdue', 'cancelled' |
| created_by | INTEGER | FK to users table |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### 4. `evaluation_results`
Results of completed evaluations with scores.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| scheduled_evaluation_id | INTEGER | FK to scheduled_evaluations |
| evaluator_id | INTEGER | FK to users table |
| completed_at | TIMESTAMP | Completion timestamp |
| total_score | INTEGER | Total points earned |
| max_possible_score | INTEGER | Maximum possible points |
| score_percentage | DECIMAL(5,2) | Percentage score |
| organization_score | INTEGER | Score for organization category |
| organization_max | INTEGER | Max score for organization |
| cleanliness_score | INTEGER | Score for cleanliness category |
| cleanliness_max | INTEGER | Max score for cleanliness |
| maintenance_score | INTEGER | Score for maintenance category |
| maintenance_max | INTEGER | Max score for maintenance |
| is_draft | BOOLEAN | Whether saved as draft |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### 5. `evaluation_responses`
Individual responses to evaluation questions.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| result_id | INTEGER | FK to evaluation_results |
| question_id | INTEGER | FK to template_questions |
| response | VARCHAR(20) | Response: 'yes', 'no', 'not_applicable' |
| observation | TEXT | Optional observation/note |
| created_at | TIMESTAMP | Creation timestamp |

## Indexes Created

- `idx_evaluation_templates_space_type` - For filtering templates by space type
- `idx_evaluation_templates_is_active` - For filtering active templates
- `idx_template_questions_template` - For fetching questions by template
- `idx_template_questions_category` - For grouping questions by category
- `idx_scheduled_evaluations_date` - For calendar queries
- `idx_scheduled_evaluations_classroom` - For classroom history
- `idx_scheduled_evaluations_status` - For filtering by status
- `idx_scheduled_evaluations_template` - For template usage queries
- `idx_evaluation_results_scheduled` - For linking results to schedules
- `idx_evaluation_results_evaluator` - For evaluator reports
- `idx_evaluation_results_completed_at` - For date range queries
- `idx_evaluation_results_is_draft` - For filtering drafts
- `idx_evaluation_responses_result` - For fetching responses by result
- `idx_evaluation_responses_question` - For question analysis

## Scoring System

- **Yes** = 1 point
- **No** = 0 points
- **Not Applicable** = Excluded from calculation

Score percentage = (total_score / max_possible_score) × 100

### Score Classifications
- **< 70%**: Requires Attention (Red)
- **70-89%**: Acceptable (Yellow)
- **≥ 90%**: Excellent (Green)

## Related Spec

This migration is part of the `classroom-evaluation-system` spec.

## Rollback

To rollback this migration, run:

```sql
DROP TABLE IF EXISTS evaluation_responses CASCADE;
DROP TABLE IF EXISTS evaluation_results CASCADE;
DROP TABLE IF EXISTS scheduled_evaluations CASCADE;
DROP TABLE IF EXISTS template_questions CASCADE;
DROP TABLE IF EXISTS evaluation_templates CASCADE;

DROP FUNCTION IF EXISTS update_evaluation_template_timestamp();
DROP FUNCTION IF EXISTS update_template_question_timestamp();
DROP FUNCTION IF EXISTS update_scheduled_evaluation_timestamp();
DROP FUNCTION IF EXISTS update_evaluation_result_timestamp();
```
