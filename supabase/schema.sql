-- Create enums
CREATE TYPE user_role AS ENUM ('Admin', 'Supervisor');
CREATE TYPE user_status AS ENUM ('Active', 'Inactive');
CREATE TYPE payment_status_enum AS ENUM ('Paid', 'Not Paid');

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'Supervisor',
    status user_status NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create suppliers table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(50),
    address TEXT,
    gst_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create materials table
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_name VARCHAR(255) NOT NULL,
    default_unit VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create dmr_entries table
CREATE TABLE dmr_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dmr_number VARCHAR(50) UNIQUE NOT NULL,
    arrival_date DATE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
    material_name VARCHAR(255) NOT NULL,
    other_material VARCHAR(255),
    quantity NUMERIC NOT NULL,
    unit VARCHAR(50) NOT NULL,
    vehicle_number VARCHAR(100),
    invoice_number VARCHAR(100),
    material_image TEXT,
    challan_image TEXT,
    bill_image TEXT,
    rate_per_unit NUMERIC,
    final_bill_amount NUMERIC,
    payment_status payment_status_enum NOT NULL DEFAULT 'Not Paid',
    payment_date DATE,
    remarks TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE dmr_entries ENABLE ROW LEVEL SECURITY;

-- Create basic policies (to be refined based on NextAuth connection)
-- Since we are bypassing Supabase Auth and using NextAuth with a custom users table,
-- we'll use a service_role key server-side or simple public policies for now if we use anon key.
-- Assuming we use the service_role key for all server actions, we don't strictly need RLS policies,
-- but if we use the anon key on the client, we would.
-- Given the requirement, we will use Server Actions with service_role key or Next.js API routes.

-- Insert initial Admin user (Password is 'admin123' hashed with bcrypt)
-- Using a bcrypt hash of 'admin123' -> $2a$10$wE/T5QZJ8P0e9bTf3Wj0uO/gB7G9r2YxS/x5XhPzQZ4e.O1Vj4dJ.
INSERT INTO users (name, email, password, role, status)
VALUES ('Admin User', 'admin@dmr.com', '$2a$10$wE/T5QZJ8P0e9bTf3Wj0uO/gB7G9r2YxS/x5XhPzQZ4e.O1Vj4dJ.', 'Admin', 'Active');
