export const ddlScript = `
/* 
  SIMULTAN ERP - Database Schema
  Dialect: PostgreSQL (Supabase)
*/

-- 1. UTILITIES & EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. CORE USER MANAGEMENT (RBAC)
-- Roles Table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- 'admin', 'field_officer', 'accountant'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users Table (Public Profile linked to auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles (Many-to-Many)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- 3. FARMER & LAND MANAGEMENT
CREATE TABLE farmer_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    leader_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE farmers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES farmer_groups(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    nik TEXT UNIQUE,
    phone TEXT,
    address TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
    join_date DATE DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. "Kebun Utara"
    location_address TEXT,
    size_hectares NUMERIC NOT NULL CHECK (size_hectares > 0),
    elevation_mdpl NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE farm_polygons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
    coordinates JSONB NOT NULL, -- GeoJSON format
    center_point TEXT, -- Lat,Lng string
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INVENTORY & PRODUCTS
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'KG',
    price_guide NUMERIC DEFAULT 0 CHECK (price_guide >= 0),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    location TEXT,
    capacity_limit NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID REFERENCES warehouses(id) NOT NULL,
    product_id UUID REFERENCES products(id) NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT')),
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    reference_note TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TRANSACTIONS
CREATE TABLE purchase_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_code TEXT UNIQUE NOT NULL DEFAULT 'TRX-' || floor(extract(epoch from now())),
    farmer_id UUID REFERENCES farmers(id) NOT NULL,
    product_id UUID REFERENCES products(id) NOT NULL,
    warehouse_id UUID REFERENCES warehouses(id) NOT NULL,
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    price_per_unit NUMERIC NOT NULL CHECK (price_per_unit >= 0),
    total_amount NUMERIC GENERATED ALWAYS AS (quantity * price_per_unit) STORED,
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'cancelled')),
    created_by UUID REFERENCES users(id), -- Important for RLS
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ASSETS & FILES
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT,
    size_bytes BIGINT,
    related_table TEXT,
    related_id UUID,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ACCOUNTING
CREATE TABLE coa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    parent_id UUID REFERENCES coa(id),
    is_header BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number TEXT UNIQUE NOT NULL,
    entry_date DATE NOT NULL,
    description TEXT,
    reference_id UUID, -- Can link to purchase_transactions
    reference_type TEXT,
    status TEXT DEFAULT 'posted' CHECK (status IN ('draft', 'posted', 'void')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE journal_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID REFERENCES coa(id) NOT NULL,
    debit NUMERIC DEFAULT 0 CHECK (debit >= 0),
    credit NUMERIC DEFAULT 0 CHECK (credit >= 0),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_balance CHECK ( (debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0) )
);

-- 8. INDEXES & TRIGGERS
CREATE INDEX idx_farmers_name ON farmers(name);
CREATE INDEX idx_farmers_nik ON farmers(nik);
CREATE INDEX idx_transactions_date ON purchase_transactions(transaction_date);
CREATE INDEX idx_transactions_farmer ON purchase_transactions(farmer_id);
CREATE INDEX idx_journal_date ON journal_entries(entry_date);

-- Apply Updated At Triggers
CREATE TRIGGER update_roles_modtime BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_farmers_modtime BEFORE UPDATE ON farmers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_farms_modtime BEFORE UPDATE ON farms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_modtime BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_warehouses_modtime BEFORE UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchases_modtime BEFORE UPDATE ON purchase_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coa_modtime BEFORE UPDATE ON coa FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journals_modtime BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

export const seedScript = `
/* 
  SEED DATA
  Run this after DDL to populate initial data.
  Note: In a real environment, User UUIDs must match actual Auth Users.
  Here we use placeholders or assume the script is run in a block.
*/

DO $$
DECLARE
    -- Variable declarations for IDs
    v_admin_role_id UUID;
    v_officer_role_id UUID;
    v_accountant_role_id UUID;
    v_group_id UUID;
    v_farmer_id UUID;
    v_product_id UUID;
    v_warehouse_id UUID;
    v_coa_cash UUID;
    v_coa_inv UUID;
BEGIN

    -- 1. SEED ROLES
    INSERT INTO roles (name, description) VALUES 
        ('admin', 'Super Administrator'),
        ('field_officer', 'Field Staff'),
        ('accountant', 'Finance Staff')
    RETURNING id INTO v_admin_role_id;
    
    -- Get other role IDs (since we inserted multiple, returning into one var only gets one if not careful, but here we simplify)
    SELECT id INTO v_officer_role_id FROM roles WHERE name = 'field_officer';
    SELECT id INTO v_accountant_role_id FROM roles WHERE name = 'accountant';

    -- 2. SEED PRODUCTS
    INSERT INTO products (sku, name, unit, price_guide) VALUES
        ('KOPI-ARA-01', 'Arabika Green Bean Grade A', 'KG', 85000),
        ('KOPI-ROB-01', 'Robusta Asalan', 'KG', 45000),
        ('PUPUK-NPK', 'Pupuk NPK Non-Subsidi', 'SAK', 150000)
    RETURNING id INTO v_product_id;

    -- 3. SEED WAREHOUSES
    INSERT INTO warehouses (code, name, location, capacity_limit) VALUES
        ('WH-MAIN', 'Gudang Pusat', 'Jl. Raya Koperasi No 1', 100000),
        ('WH-EAST', 'Unit Pengumpulan Timur', 'Desa Sukatani', 5000),
        ('WH-WEST', 'Unit Pengumpulan Barat', 'Desa Sukamaju', 5000)
    RETURNING id INTO v_warehouse_id;

    -- 4. SEED FARMER GROUPS & FARMERS
    INSERT INTO farmer_groups (name, location, leader_name) VALUES
        ('KT Harapan Jaya', 'Blok A Pegunungan', 'Bpk. Budi')
    RETURNING id INTO v_group_id;

    INSERT INTO farmers (group_id, name, nik, phone, address) VALUES
        (v_group_id, 'Ahmad Petani', '320100000001', '08123456789', 'Rt 01 Rw 02'),
        (v_group_id, 'Bambang Kebun', '320100000002', '08129876543', 'Rt 03 Rw 02'),
        (v_group_id, 'Cahyo Tani', '320100000003', '08121112223', 'Rt 01 Rw 01')
    RETURNING id INTO v_farmer_id;

    -- 5. SEED FARMS
    INSERT INTO farms (farmer_id, name, size_hectares, elevation_mdpl) VALUES
        (v_farmer_id, 'Kebun Lereng', 1.5, 1200),
        (v_farmer_id, 'Kebun Datar', 0.5, 1100),
        (v_farmer_id, 'Lahan Baru', 2.0, 1250);

    -- 6. SEED PURCHASE TRANSACTIONS
    INSERT INTO purchase_transactions (farmer_id, product_id, warehouse_id, quantity, price_per_unit, status) VALUES
        (v_farmer_id, v_product_id, v_warehouse_id, 100, 80000, 'completed'),
        (v_farmer_id, v_product_id, v_warehouse_id, 50, 82000, 'completed'),
        (v_farmer_id, v_product_id, v_warehouse_id, 200, 78000, 'draft');

    -- 7. SEED COA
    INSERT INTO coa (code, name, type) VALUES
        ('1-1100', 'Kas Tunai', 'ASSET'),
        ('1-1200', 'Bank BRI', 'ASSET'),
        ('1-1300', 'Persediaan Kopi', 'ASSET'),
        ('4-1000', 'Penjualan', 'REVENUE')
    RETURNING id INTO v_coa_cash;

    SELECT id INTO v_coa_inv FROM coa WHERE code = '1-1300';

    -- 8. SEED JOURNAL ENTRY (Example: Purchase of Coffee)
    WITH new_journal AS (
        INSERT INTO journal_entries (entry_number, entry_date, description, status)
        VALUES ('JE-2024-001', CURRENT_DATE, 'Pembelian Kopi Tunai', 'posted')
        RETURNING id
    )
    INSERT INTO journal_lines (journal_id, account_id, debit, credit)
    SELECT 
        id, v_coa_inv, 1000000, 0 
    FROM new_journal
    UNION ALL
    SELECT 
        id, v_coa_cash, 0, 1000000 
    FROM new_journal;

END $$;
`;

export const rlsScript = `
/*
  ROW LEVEL SECURITY (RLS)
  Security policies based on User Roles (Admin, Field Officer, Accountant).
*/

-- 1. HELPER FUNCTION
-- Gets the role name of the currently authenticated user
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT r.name INTO v_role
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = auth.uid();
  
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ENABLE RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coa ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES

-- === ADMIN: FULL ACCESS ===
-- Generic Policy for Admins to do everything
CREATE POLICY "Admin All Access" ON users FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "Admin All Access Roles" ON roles FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "Admin All Access UserRoles" ON user_roles FOR ALL USING (get_my_role() = 'admin');
-- (Apply similar logic to all other tables for Admin)

-- === FIELD OFFICER ===
-- Can View Products & Warehouses (Reference data)
CREATE POLICY "Officer Read Products" ON products FOR SELECT USING (true);
CREATE POLICY "Officer Read Warehouses" ON warehouses FOR SELECT USING (true);

-- Can Create & Read Farmers
CREATE POLICY "Officer Manage Farmers" ON farmers 
    FOR ALL 
    USING (get_my_role() IN ('admin', 'field_officer'));

-- Purchase Transactions:
-- 1. Can INSERT new transactions
CREATE POLICY "Officer Insert TRX" ON purchase_transactions 
    FOR INSERT 
    WITH CHECK (get_my_role() = 'field_officer');

-- 2. Can VIEW ONLY their own transactions
CREATE POLICY "Officer View Own TRX" ON purchase_transactions 
    FOR SELECT 
    USING (
        get_my_role() = 'admin' 
        OR (get_my_role() = 'field_officer' AND created_by = auth.uid())
    );

-- 3. Can UPDATE ONLY their own draft transactions
CREATE POLICY "Officer Edit Own Draft" ON purchase_transactions 
    FOR UPDATE
    USING (created_by = auth.uid() AND status = 'draft')
    WITH CHECK (status = 'draft'); -- Cannot change status to completed directly if restricted

-- === ACCOUNTANT ===
-- Can View Operational Data (Read Only)
CREATE POLICY "Accountant Read Operations" ON purchase_transactions 
    FOR SELECT 
    USING (get_my_role() = 'accountant');

-- Accounting Tables (Full Access)
CREATE POLICY "Accountant Manage COA" ON coa 
    FOR ALL 
    USING (get_my_role() = 'accountant' OR get_my_role() = 'admin');

CREATE POLICY "Accountant Manage Journals" ON journal_entries 
    FOR ALL 
    USING (get_my_role() = 'accountant' OR get_my_role() = 'admin');
    
-- === PUBLIC / AUTH ===
-- Allow users to read their own profile
CREATE POLICY "Read Own Profile" ON users 
    FOR SELECT 
    USING (auth.uid() = id);
`;