# Migration 029: Evaluation Assignment and Approval System

## Overview

This migration adds support for:
1. **Evaluation Assignment**: Assign evaluations to specific admin users who will perform them
2. **Approval Workflow**: Designate an approver who must review and approve/reject completed evaluations

## New Fields

### scheduled_evaluations table
- `assigned_to` (INTEGER, FK to users): The user assigned to perform the evaluation
- `approver_id` (INTEGER, FK to users): The user who will approve the completed evaluation

### evaluation_results table
- `approval_status` (VARCHAR): Status of approval - 'pending', 'approved', or 'rejected'
- `approved_by` (INTEGER, FK to users): The user who approved/rejected
- `approved_at` (TIMESTAMP): When the approval decision was made
- `approval_comments` (TEXT): Comments explaining the approval/rejection decision

## New Notification Types

The following notification types are used by the application:
- `evaluation_assigned`: Sent to the assigned evaluator when an evaluation is scheduled
- `evaluation_pending_approval`: Sent to the approver when an evaluation is completed
- `evaluation_approved`: Sent to the evaluator when their evaluation is approved
- `evaluation_rejected`: Sent to the evaluator when their evaluation is rejected

## Workflow

1. Admin schedules an evaluation and optionally assigns:
   - An evaluator (who will receive a notification)
   - An approver (who will review the completed evaluation)

2. Assigned evaluator receives notification with evaluation details

3. Evaluator completes the evaluation

4. If an approver was designated:
   - Approver receives notification that evaluation needs review
   - Approver reviews responses and scores
   - Approver approves or rejects with optional comments
   - Evaluator receives notification of the decision

5. Approval status is included in reports

## API Endpoints

- `POST /api/admin/evaluations/schedule` - Now accepts `assigned_to` and `approver_id`
- `GET /api/admin/evaluations/pending-approval` - Lists evaluations pending approval
- `POST /api/admin/evaluations/[id]/approve` - Approve or reject an evaluation

## Rollback

To rollback this migration, run:
```sql
\i 029_evaluation_assignment_approval_rollback.sql
```

## Application

To apply this migration:
```sql
\i 029_evaluation_assignment_approval.sql
```
