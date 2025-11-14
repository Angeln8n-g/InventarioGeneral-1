-- Migration: Add indexes for report queries
-- Description: Optimizes database queries for the reports system

-- Loans table indexes
CREATE INDEX IF NOT EXISTS idx_loans_date_range 
ON loans(loan_date, due_date);

CREATE INDEX IF NOT EXISTS idx_loans_status_date 
ON loans(status, loan_date);

CREATE INDEX IF NOT EXISTS idx_loans_user_date 
ON loans(user_id, loan_date);

CREATE INDEX IF NOT EXISTS idx_loans_tool_instance 
ON loans(tool_instance_id);

-- Tool instances table indexes
CREATE INDEX IF NOT EXISTS idx_tool_instances_status 
ON tool_instances(status);

CREATE INDEX IF NOT EXISTS idx_tool_instances_item_type 
ON tool_instances(item_type_id);

CREATE INDEX IF NOT EXISTS idx_tool_instances_created 
ON tool_instances(created_at);

-- Consumable stock table indexes
CREATE INDEX IF NOT EXISTS idx_consumable_stock_item_type 
ON consumable_stock(item_type_id);

CREATE INDEX IF NOT EXISTS idx_consumable_stock_levels 
ON consumable_stock(current_quantity, minimum_threshold);

-- Item types table indexes
CREATE INDEX IF NOT EXISTS idx_item_types_category 
ON item_types(category);

CREATE INDEX IF NOT EXISTS idx_item_types_consumable 
ON item_types(is_consumable);

-- Audit logs table indexes for consumption tracking
CREATE INDEX IF NOT EXISTS idx_audit_logs_consumable_date 
ON audit_logs(entity_type, created_at) 
WHERE entity_type = 'consumable_stock';

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity 
ON audit_logs(entity_type, entity_id, created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_date 
ON audit_logs(action, created_at);

-- Composite indexes for common report queries
CREATE INDEX IF NOT EXISTS idx_loans_status_user_date 
ON loans(status, user_id, loan_date);

CREATE INDEX IF NOT EXISTS idx_tool_instances_status_type 
ON tool_instances(status, item_type_id);

-- Add comments for documentation
COMMENT ON INDEX idx_loans_date_range IS 'Optimizes date range queries for loan reports';
COMMENT ON INDEX idx_loans_status_date IS 'Optimizes status filtering with date sorting';
COMMENT ON INDEX idx_audit_logs_consumable_date IS 'Optimizes consumption tracking queries';
