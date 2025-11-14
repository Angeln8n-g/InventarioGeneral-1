-- Insert sample users (passwords are hashed versions of 'password123')
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@example.com', '$2b$10$gMYsALBi1HngVRHzOcPivOidKXhCuYTt8RAh9EKpddTJVwC.r8ala', 'admin'),
('teacher1', 'teacher1@example.com', '$2b$10$JnqD2jnIIbTL5LKQD6vJie0jMhV2fNfUJlSZIa3duMZn8bMZSCMlC', 'user'),
('teacher2', 'teacher2@example.com', '$2b$10$u1jcRaurZU/MRd/Y2EFAT./KJZ064fw8AY0vij.aPsU4YEGwDyXNO', 'user');

-- Insert sample item types
INSERT INTO item_types (name, description, category, is_consumable, default_loan_duration_days) VALUES
('Laptop', 'Educational laptops for classroom use', 'Electronics', false, 7),
('Projector', 'Portable projectors for presentations', 'Electronics', false, 3),
('Microscope', 'Digital microscopes for science classes', 'Science Equipment', false, 14),
('Calculator', 'Scientific calculators', 'Mathematics', false, 30),
('Whiteboard Markers', 'Dry erase markers for whiteboards', 'Supplies', true, 0),
('Copy Paper', 'A4 copy paper for printing', 'Supplies', true, 0),
('Batteries', 'AA batteries for devices', 'Supplies', true, 0);

-- Insert sample tool instances (non-consumable items)
INSERT INTO tool_instances (item_type_id, qr_code, serial_number, status) VALUES
(1, 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'LAP001', 'available'),
(1, 'f47ac10b-58cc-4372-a567-0e02b2c3d480', 'LAP002', 'available'),
(1, 'f47ac10b-58cc-4372-a567-0e02b2c3d481', 'LAP003', 'loaned'),
(2, 'f47ac10b-58cc-4372-a567-0e02b2c3d482', 'PROJ001', 'available'),
(2, 'f47ac10b-58cc-4372-a567-0e02b2c3d483', 'PROJ002', 'available'),
(3, 'f47ac10b-58cc-4372-a567-0e02b2c3d484', 'MIC001', 'available'),
(3, 'f47ac10b-58cc-4372-a567-0e02b2c3d485', 'MIC002', 'out-of-service'),
(4, 'f47ac10b-58cc-4372-a567-0e02b2c3d486', 'CALC001', 'available'),
(4, 'f47ac10b-58cc-4372-a567-0e02b2c3d487', 'CALC002', 'available'),
(4, 'f47ac10b-58cc-4372-a567-0e02b2c3d488', 'CALC003', 'available');

-- Insert sample consumable stock
INSERT INTO consumable_stock (item_type_id, current_quantity, minimum_threshold, unit_of_measure) VALUES
(5, 50, 10, 'pieces'),
(6, 100, 20, 'sheets'),
(7, 25, 5, 'pieces');

-- Insert sample loans
INSERT INTO loans (user_id, tool_instance_id, due_date, status, notes) VALUES
(2, 3, CURRENT_TIMESTAMP + INTERVAL '7 days', 'active', 'For computer science class'),
(3, 7, CURRENT_TIMESTAMP - INTERVAL '2 days', 'overdue', 'Microscope for biology lab');

-- Insert sample consumable requests
INSERT INTO consumable_requests (user_id, item_type_id, requested_quantity, fulfilled_quantity, status, notes) VALUES
(2, 5, 10, 10, 'fulfilled', 'For math class whiteboard'),
(3, 6, 50, 0, 'pending', 'Need paper for student worksheets');

-- Insert sample notifications
INSERT INTO notifications (user_id, type, title, message, delivery_status) VALUES
(2, 'loan_reminder', 'Loan Due Soon', 'Your laptop loan is due in 2 days. Please return it on time.', 'delivered'),
(3, 'overdue_notice', 'Overdue Item', 'Your microscope loan is overdue. Please return it immediately.', 'delivered'),
(3, 'backorder_fulfilled', 'Request Fulfilled', 'Your request for copy paper has been fulfilled and is ready for pickup.', 'pending');