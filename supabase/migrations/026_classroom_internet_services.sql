-- Migration: Add classroom internet services table
-- Description: Track internet services installed in classrooms

CREATE TABLE IF NOT EXISTS classroom_internet_services (
    id SERIAL PRIMARY KEY,
    classroom_id INTEGER NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    service_provider VARCHAR(255) NOT NULL,
    service_type VARCHAR(100) NOT NULL CHECK (service_type IN ('fiber', 'cable', 'dsl', 'wireless', 'satellite', 'other')),
    plan_name VARCHAR(255),
    download_speed INTEGER, -- in Mbps
    upload_speed INTEGER, -- in Mbps
    account_number VARCHAR(100),
    ip_address VARCHAR(45),
    router_model VARCHAR(255),
    router_serial VARCHAR(255),
    installation_date DATE,
    contract_end_date DATE,
    monthly_cost DECIMAL(10, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_internet_services_classroom ON classroom_internet_services(classroom_id);
CREATE INDEX IF NOT EXISTS idx_internet_services_status ON classroom_internet_services(status);
CREATE INDEX IF NOT EXISTS idx_internet_services_provider ON classroom_internet_services(service_provider);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_internet_service_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_internet_service_updated_at ON classroom_internet_services;
CREATE TRIGGER trigger_internet_service_updated_at
    BEFORE UPDATE ON classroom_internet_services
    FOR EACH ROW
    EXECUTE FUNCTION update_internet_service_updated_at();

-- Grant permissions
GRANT SELECT ON classroom_internet_services TO authenticated;
GRANT ALL ON classroom_internet_services TO service_role;
GRANT USAGE, SELECT ON SEQUENCE classroom_internet_services_id_seq TO authenticated, service_role;

COMMENT ON TABLE classroom_internet_services IS 'Internet services installed in classrooms';
