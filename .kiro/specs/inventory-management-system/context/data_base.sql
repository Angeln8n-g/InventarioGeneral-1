-- Usuarios y roles
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    role ENUM('admin', 'teacher', 'student') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tipos de items y políticas de préstamo
CREATE TABLE item_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    is_consumable BOOLEAN NOT NULL DEFAULT FALSE,
    default_loan_duration_days INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Instancias de herramientas (ítems únicos)
CREATE TABLE item_instances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_type_id INT NOT NULL,
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    status ENUM('available', 'loaned', 'lost', 'damaged', 'maintenance') NOT NULL DEFAULT 'available',
    last_user_id INT,
    last_loan_at TIMESTAMP NULL,
    version INT NOT NULL DEFAULT 1, -- Para Optimistic Locking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (item_type_id) REFERENCES item_types(id),
    FOREIGN KEY (last_user_id) REFERENCES users(id)
);

-- Stock de consumibles
CREATE TABLE consumable_stock (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_type_id INT NOT NULL UNIQUE,
    quantity INT NOT NULL DEFAULT 0,
    min_threshold INT NOT NULL DEFAULT 0,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (item_type_id) REFERENCES item_types(id)
);

-- Préstamos genéricos
CREATE TABLE loans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    loan_type ENUM('tool', 'consume') NOT NULL,
    status ENUM('active', 'returned', 'overdue', 'closed') NOT NULL DEFAULT 'active',
    expected_return_at TIMESTAMP,
    actual_return_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Relación préstamo-herramienta
CREATE TABLE loan_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    loan_id INT NOT NULL,
    item_instance_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id),
    FOREIGN KEY (item_instance_id) REFERENCES item_instances(id)
);

-- Detalles de préstamo de consumibles
CREATE TABLE consumable_loans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    loan_id INT NOT NULL,
    item_type_id INT NOT NULL,
    quantity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id),
    FOREIGN KEY (item_type_id) REFERENCES item_types(id)
);

-- Auditoría de movimientos de stock
CREATE TABLE stock_movements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_type_id INT NOT NULL,
    item_instance_id INT NULL,
    movement_type ENUM('loan', 'return', 'consume', 'adjustment', 'loss', 'damage') NOT NULL,
    delta INT NOT NULL,
    reference_id INT NULL, -- ID del préstamo, ajuste, etc.
    user_id INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_type_id) REFERENCES item_types(id),
    FOREIGN KEY (item_instance_id) REFERENCES item_instances(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Logs de auditoría completos
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(50) NOT NULL, -- 'loan', 'return', 'status_change', 'adjustment'
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Pedidos pendientes de consumibles
CREATE TABLE backorders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    item_type_id INT NOT NULL,
    quantity INT NOT NULL,
    status ENUM('pending', 'fulfilled', 'cancelled') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (item_type_id) REFERENCES item_types(id)
);

-- Notificaciones a usuarios
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- 'overdue', 'admin_alert'
    reference_id INT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);