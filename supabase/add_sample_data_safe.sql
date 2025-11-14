-- ============================================
-- Agregar Datos de Ejemplo (Seguro)
-- ============================================
-- Este script solo agrega datos si no existen

-- 1. Insertar usuarios de ejemplo (solo si no existen)
INSERT INTO users (username, email, password_hash, role, full_name) 
VALUES 
  ('admin', 'admin@example.com', '$2b$10$gMYsALBi1HngVRHzOcPivOidKXhCuYTt8RAh9EKpddTJVwC.r8ala', 'admin', 'Administrador'),
  ('teacher1', 'teacher1@example.com', '$2b$10$JnqD2jnIIbTL5LKQD6vJie0jMhV2fNfUJlSZIa3duMZn8bMZSCMlC', 'user', 'Profesor Uno'),
  ('teacher2', 'teacher2@example.com', '$2b$10$u1jcRaurZU/MRd/Y2EFAT./KJZ064fw8AY0vij.aPsU4YEGwDyXNO', 'user', 'Profesor Dos')
ON CONFLICT (username) DO NOTHING;

-- 2. Insertar tipos de items (solo si no existen)
INSERT INTO item_types (name, description, category, is_consumable, default_loan_duration_days) 
VALUES
  ('Laptop', 'Educational laptops for classroom use', 'Electronics', false, 7),
  ('Projector', 'Portable projectors for presentations', 'Electronics', false, 3),
  ('Microscope', 'Digital microscopes for science classes', 'Science Equipment', false, 14),
  ('Calculator', 'Scientific calculators', 'Mathematics', false, 30),
  ('Whiteboard Markers', 'Dry erase markers for whiteboards', 'Supplies', true, 0),
  ('Copy Paper', 'A4 copy paper for printing', 'Supplies', true, 0),
  ('Batteries', 'AA batteries for devices', 'Supplies', true, 0)
ON CONFLICT DO NOTHING;

-- 3. Insertar instancias de herramientas (solo si no existen)
DO $$ 
DECLARE
    laptop_id INTEGER;
    projector_id INTEGER;
    microscope_id INTEGER;
    calculator_id INTEGER;
BEGIN
    -- Obtener IDs de item_types
    SELECT id INTO laptop_id FROM item_types WHERE name = 'Laptop' LIMIT 1;
    SELECT id INTO projector_id FROM item_types WHERE name = 'Projector' LIMIT 1;
    SELECT id INTO microscope_id FROM item_types WHERE name = 'Microscope' LIMIT 1;
    SELECT id INTO calculator_id FROM item_types WHERE name = 'Calculator' LIMIT 1;
    
    -- Insertar tool_instances si los IDs existen
    IF laptop_id IS NOT NULL THEN
        INSERT INTO tool_instances (item_type_id, qr_code, serial_number, status) 
        VALUES
          (laptop_id, 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'LAP001', 'available'),
          (laptop_id, 'f47ac10b-58cc-4372-a567-0e02b2c3d480', 'LAP002', 'available'),
          (laptop_id, 'f47ac10b-58cc-4372-a567-0e02b2c3d481', 'LAP003', 'loaned')
        ON CONFLICT (qr_code) DO NOTHING;
    END IF;
    
    IF projector_id IS NOT NULL THEN
        INSERT INTO tool_instances (item_type_id, qr_code, serial_number, status) 
        VALUES
          (projector_id, 'f47ac10b-58cc-4372-a567-0e02b2c3d482', 'PROJ001', 'available'),
          (projector_id, 'f47ac10b-58cc-4372-a567-0e02b2c3d483', 'PROJ002', 'available')
        ON CONFLICT (qr_code) DO NOTHING;
    END IF;
    
    IF microscope_id IS NOT NULL THEN
        INSERT INTO tool_instances (item_type_id, qr_code, serial_number, status) 
        VALUES
          (microscope_id, 'f47ac10b-58cc-4372-a567-0e02b2c3d484', 'MIC001', 'available'),
          (microscope_id, 'f47ac10b-58cc-4372-a567-0e02b2c3d485', 'MIC002', 'out-of-service')
        ON CONFLICT (qr_code) DO NOTHING;
    END IF;
    
    IF calculator_id IS NOT NULL THEN
        INSERT INTO tool_instances (item_type_id, qr_code, serial_number, status) 
        VALUES
          (calculator_id, 'f47ac10b-58cc-4372-a567-0e02b2c3d486', 'CALC001', 'available'),
          (calculator_id, 'f47ac10b-58cc-4372-a567-0e02b2c3d487', 'CALC002', 'available'),
          (calculator_id, 'f47ac10b-58cc-4372-a567-0e02b2c3d488', 'CALC003', 'available')
        ON CONFLICT (qr_code) DO NOTHING;
    END IF;
END $$;

-- 4. Insertar stock de consumibles
DO $$ 
DECLARE
    markers_id INTEGER;
    paper_id INTEGER;
    batteries_id INTEGER;
BEGIN
    SELECT id INTO markers_id FROM item_types WHERE name = 'Whiteboard Markers' LIMIT 1;
    SELECT id INTO paper_id FROM item_types WHERE name = 'Copy Paper' LIMIT 1;
    SELECT id INTO batteries_id FROM item_types WHERE name = 'Batteries' LIMIT 1;
    
    IF markers_id IS NOT NULL THEN
        INSERT INTO consumable_stock (item_type_id, current_quantity, minimum_threshold, unit_of_measure) 
        VALUES (markers_id, 50, 10, 'pieces')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF paper_id IS NOT NULL THEN
        INSERT INTO consumable_stock (item_type_id, current_quantity, minimum_threshold, unit_of_measure) 
        VALUES (paper_id, 100, 20, 'sheets')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF batteries_id IS NOT NULL THEN
        INSERT INTO consumable_stock (item_type_id, current_quantity, minimum_threshold, unit_of_measure) 
        VALUES (batteries_id, 25, 5, 'pieces')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 5. Mostrar resumen
DO $$ 
DECLARE
    user_count INTEGER;
    item_count INTEGER;
    tool_count INTEGER;
    stock_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO item_count FROM item_types;
    SELECT COUNT(*) INTO tool_count FROM tool_instances;
    SELECT COUNT(*) INTO stock_count FROM consumable_stock;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Datos de Ejemplo Agregados';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Usuarios: %', user_count;
    RAISE NOTICE 'Tipos de items: %', item_count;
    RAISE NOTICE 'Herramientas: %', tool_count;
    RAISE NOTICE 'Stock de consumibles: %', stock_count;
    RAISE NOTICE '========================================';
END $$;
