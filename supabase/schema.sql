-- Safe schema: uses IF NOT EXISTS and DO blocks to avoid errors on re-run

-- Create enums (safe, won't error if already exists)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('Admin', 'Supervisor');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('Active', 'Inactive');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('Paid', 'Not Paid');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'Supervisor',
    status user_status NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(50),
    address TEXT,
    gst_number VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create materials table
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_name VARCHAR(255) NOT NULL,
    default_unit VARCHAR(50),
    default_rate NUMERIC,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create dmr_entries table
CREATE TABLE IF NOT EXISTS dmr_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dmr_number VARCHAR(50) UNIQUE NOT NULL,
    arrival_date DATE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
    material_id UUID REFERENCES materials(id) ON DELETE RESTRICT,
    other_material VARCHAR(255),
    quantity NUMERIC NOT NULL,
    unit VARCHAR(50) NOT NULL,
    vehicle_number VARCHAR(100),
    invoice_number VARCHAR(100),
    material_image TEXT,
    vehicle_photo TEXT,
    challan_image TEXT,
    bill_image TEXT,
    rate_per_unit NUMERIC,
    gst_applicable BOOLEAN DEFAULT FALSE,
    gst_percentage NUMERIC,
    gst_amount NUMERIC,
    final_bill_amount NUMERIC,
    payment_status payment_status_enum NOT NULL DEFAULT 'Not Paid',
    payment_date DATE,
    remarks TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE dmr_entries ENABLE ROW LEVEL SECURITY;

-- Insert default Admin user (password = 'admin123' hashed with bcrypt)
-- This will be skipped if the email already exists
INSERT INTO users (name, email, password, role, status)
VALUES (
    'Admin User',
    'admin@dmr.com',
    '$2a$10$wE/T5QZJ8P0e9bTf3Wj0uO/gB7G9r2YxS/x5XhPzQZ4e.O1Vj4dJ.',
    'Admin',
    'Active'
)
ON CONFLICT (email) DO NOTHING;
