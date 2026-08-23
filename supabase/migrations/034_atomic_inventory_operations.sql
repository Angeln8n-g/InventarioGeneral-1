-- ==============================================================================
-- Migration 034: Atomic Inventory Operations & Concurrency Control
-- ==============================================================================

-- 1. Atomic Consumable Consumption Procedure
CREATE OR REPLACE FUNCTION public.consume_consumable_atomic(
    p_stock_id INTEGER,
    p_user_id INTEGER,
    p_quantity NUMERIC,
    p_notes TEXT DEFAULT NULL,
    p_start_marker INTEGER DEFAULT NULL,
    p_end_marker INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_stock RECORD;
    v_item_type RECORD;
    v_new_quantity NUMERIC;
    v_movement_id INTEGER;
    v_is_low_stock BOOLEAN;
BEGIN
    -- 1. Acquire row-level lock on consumable_stock to prevent race conditions
    SELECT * INTO v_stock
    FROM consumable_stock
    WHERE id = p_stock_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'NOT_FOUND',
            'message', 'Consumable stock record not found'
        );
    END IF;

    -- 2. Validate sufficient stock
    IF v_stock.current_quantity < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'INSUFFICIENT_STOCK',
            'message', format('Insufficient stock. Available: %s, Requested: %s', v_stock.current_quantity, p_quantity),
            'available_quantity', v_stock.current_quantity,
            'requested_quantity', p_quantity
        );
    END IF;

    -- 3. Calculate new quantity
    v_new_quantity := v_stock.current_quantity - p_quantity;
    v_is_low_stock := (v_new_quantity <= v_stock.minimum_threshold);

    -- 4. Update stock quantity and version
    UPDATE consumable_stock
    SET 
        current_quantity = v_new_quantity,
        updated_at = CURRENT_TIMESTAMP,
        version = COALESCE(version, 1) + 1
    WHERE id = p_stock_id;

    -- 5. Insert stock movement record
    INSERT INTO stock_movements (
        consumable_stock_id,
        movement_type,
        quantity,
        user_id,
        notes,
        start_marker,
        end_marker,
        created_at
    ) VALUES (
        p_stock_id,
        'consumption',
        -p_quantity,
        p_user_id,
        COALESCE(p_notes, 'Consumed via atomic transaction'),
        p_start_marker,
        p_end_marker,
        CURRENT_TIMESTAMP
    ) RETURNING id INTO v_movement_id;

    -- 6. Fetch item type metadata for response
    SELECT * INTO v_item_type
    FROM item_types
    WHERE id = v_stock.item_type_id;

    RETURN jsonb_build_object(
        'success', true,
        'stock_id', p_stock_id,
        'item_type_id', v_stock.item_type_id,
        'item_name', v_item_type.name,
        'previous_quantity', v_stock.current_quantity,
        'consumed_quantity', p_quantity,
        'remaining_quantity', v_new_quantity,
        'minimum_threshold', v_stock.minimum_threshold,
        'unit_of_measure', v_stock.unit_of_measure,
        'is_low_stock', v_is_low_stock,
        'movement_id', v_movement_id
    );
END;
$$;

-- 2. Atomic Batch Loan Creation Procedure
CREATE OR REPLACE FUNCTION public.create_batch_loans_atomic(
    p_user_id INTEGER,
    p_tool_instance_ids INTEGER[],
    p_due_date TIMESTAMP WITH TIME ZONE,
    p_notes TEXT DEFAULT NULL,
    p_max_loans INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_active_loans_count INTEGER;
    v_requested_count INTEGER;
    v_available_slots INTEGER;
    v_tool_id INTEGER;
    v_tool RECORD;
    v_loan_id INTEGER;
    v_created_loans JSONB := '[]'::jsonb;
    v_failed_loans JSONB := '[]'::jsonb;
    v_successful_count INTEGER := 0;
    v_failed_count INTEGER := 0;
BEGIN
    v_requested_count := array_length(p_tool_instance_ids, 1);
    
    IF v_requested_count IS NULL OR v_requested_count = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'tool_instance_ids array is empty',
            'error_code', 'VALIDATION_ERROR'
        );
    END IF;

    -- Check user active loans count
    SELECT COUNT(*) INTO v_active_loans_count
    FROM loans
    WHERE user_id = p_user_id AND status = 'active';

    v_available_slots := p_max_loans - v_active_loans_count;

    IF v_requested_count > v_available_slots THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'MAX_LOANS_EXCEEDED',
            'message', format('Cannot create %s loans. Active: %s, Max allowed: %s, Available slots: %s', 
                              v_requested_count, v_active_loans_count, p_max_loans, v_available_slots),
            'active_loans_count', v_active_loans_count,
            'max_loans_allowed', p_max_loans,
            'available_slots', v_available_slots
        );
    END IF;

    -- Iterate and lock each requested tool instance
    FOREACH v_tool_id IN ARRAY p_tool_instance_ids
    LOOP
        SELECT * INTO v_tool
        FROM tool_instances
        WHERE id = v_tool_id
        FOR UPDATE;

        IF NOT FOUND THEN
            v_failed_loans := v_failed_loans || jsonb_build_object(
                'tool_instance_id', v_tool_id,
                'error', 'Tool instance not found'
            );
            v_failed_count := v_failed_count + 1;
        ELSIF v_tool.status != 'available' THEN
            v_failed_loans := v_failed_loans || jsonb_build_object(
                'tool_instance_id', v_tool_id,
                'error', format('Tool is currently %s and not available for loan', v_tool.status)
            );
            v_failed_count := v_failed_count + 1;
        ELSE
            -- Create loan record
            INSERT INTO loans (
                user_id,
                tool_instance_id,
                loan_date,
                due_date,
                status,
                notes,
                created_at,
                updated_at
            ) VALUES (
                p_user_id,
                v_tool_id,
                CURRENT_TIMESTAMP,
                p_due_date,
                'active',
                p_notes,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            ) RETURNING id INTO v_loan_id;

            -- Update tool status to loaned
            UPDATE tool_instances
            SET 
                status = 'loaned',
                condition_notes = COALESCE(p_notes, condition_notes),
                updated_at = CURRENT_TIMESTAMP,
                version = COALESCE(version, 1) + 1
            WHERE id = v_tool_id;

            v_created_loans := v_created_loans || jsonb_build_object(
                'id', v_loan_id,
                'user_id', p_user_id,
                'tool_instance_id', v_tool_id,
                'loan_date', CURRENT_TIMESTAMP,
                'due_date', p_due_date,
                'status', 'active',
                'notes', p_notes
            );
            v_successful_count := v_successful_count + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', (v_failed_count = 0),
        'data', jsonb_build_object(
            'created', v_created_loans,
            'failed', v_failed_loans,
            'summary', jsonb_build_object(
                'total', v_requested_count,
                'successful', v_successful_count,
                'failed', v_failed_count
            )
        )
    );
END;
$$;

-- 3. Atomic Return Tool Procedure
CREATE OR REPLACE FUNCTION public.return_tool_atomic(
    p_loan_id INTEGER,
    p_condition_notes TEXT DEFAULT NULL,
    p_tool_status VARCHAR(20) DEFAULT 'available'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_loan RECORD;
    v_tool RECORD;
BEGIN
    -- Lock the loan
    SELECT * INTO v_loan
    FROM loans
    WHERE id = p_loan_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'NOT_FOUND',
            'message', 'Loan record not found'
        );
    END IF;

    IF v_loan.status = 'returned' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'ALREADY_RETURNED',
            'message', 'Tool has already been returned'
        );
    END IF;

    -- Lock the tool instance
    SELECT * INTO v_tool
    FROM tool_instances
    WHERE id = v_loan.tool_instance_id
    FOR UPDATE;

    -- Update loan to returned
    UPDATE loans
    SET 
        status = 'returned',
        return_date = CURRENT_TIMESTAMP,
        notes = CASE 
            WHEN p_condition_notes IS NOT NULL AND v_loan.notes IS NOT NULL THEN v_loan.notes || ' | Return note: ' || p_condition_notes
            WHEN p_condition_notes IS NOT NULL THEN 'Return note: ' || p_condition_notes
            ELSE v_loan.notes
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_loan_id;

    -- Update tool instance status
    UPDATE tool_instances
    SET 
        status = COALESCE(p_tool_status, 'available'),
        condition_notes = COALESCE(p_condition_notes, v_tool.condition_notes),
        updated_at = CURRENT_TIMESTAMP,
        version = COALESCE(version, 1) + 1
    WHERE id = v_loan.tool_instance_id;

    RETURN jsonb_build_object(
        'success', true,
        'loan_id', p_loan_id,
        'tool_instance_id', v_loan.tool_instance_id,
        'tool_status', COALESCE(p_tool_status, 'available'),
        'return_date', CURRENT_TIMESTAMP
    );
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.consume_consumable_atomic TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.create_batch_loans_atomic TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.return_tool_atomic TO authenticated, service_role, anon;
