
/* 
  SIMULTAN ERP - ULTIMATE DATABASE SETUP (V2.0 - FULL INTEGRATION)
  Jalankan script ini di SQL Editor Supabase.
*/

// Fix: Wrapping raw SQL into exported string constants so they can be imported as modules in React components.
export const staffSetupScript = `
-- 1. EXTENSIONS & INITIAL SETUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USER & ACCESS CONTROL
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger untuk sinkronisasi otomatis saat user Sign Up di Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shelters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    location TEXT,
    capacity_limit NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    shelter_id UUID REFERENCES shelters(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- Initial Seeding for Roles
INSERT INTO roles (name, description) VALUES 
('super_admin', 'Akses penuh'),
('field_officer', 'Petugas lapangan'),
('accountant', 'Staff keuangan')
ON CONFLICT (name) DO NOTHING;
`;

export const fullScript = `
-- ==========================================
-- 1. EXTENSIONS & INITIAL SETUP
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. USER & ACCESS CONTROL
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shelters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    location TEXT,
    capacity_limit NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    shelter_id UUID REFERENCES shelters(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- ==========================================
-- 3. MASTER DATA (Groups, Farmers, Products)
-- ==========================================
CREATE TABLE IF NOT EXISTS farmer_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    leader_name TEXT,
    location TEXT,
    code TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS farmers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES farmer_groups(id) ON DELETE SET NULL,
    username TEXT UNIQUE,
    name TEXT NOT NULL,
    nik TEXT UNIQUE,
    gender TEXT,
    birth_date DATE,
    mother_name TEXT,
    phone TEXT,
    address TEXT,
    village TEXT,
    district TEXT,
    status TEXT DEFAULT 'active',
    membership_status TEXT DEFAULT 'Anggota',
    total_farm_area_ha NUMERIC DEFAULT 0,
    productive_area_ha NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    unit TEXT,
    price_guide NUMERIC DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- 4. INVENTORY & TRANSACTIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shelter_id UUID REFERENCES shelters(id) NOT NULL,
    product_id UUID REFERENCES products(id) NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT')),
    quantity NUMERIC NOT NULL,
    reference_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_code TEXT UNIQUE NOT NULL,
    farmer_id UUID REFERENCES farmers(id) NOT NULL,
    shelter_id UUID REFERENCES shelters(id) NOT NULL,
    product_id UUID REFERENCES products(id) NOT NULL,
    quantity NUMERIC NOT NULL,
    price_per_unit NUMERIC NOT NULL,
    total_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'completed',
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.sync_purchase_to_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'completed') THEN
    INSERT INTO public.stock_movements (shelter_id, product_id, movement_type, quantity, reference_note)
    VALUES (NEW.shelter_id, NEW.product_id, 'IN', NEW.quantity, 'Harvest Purchase: ' || NEW.transaction_code);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_purchase_sync_stock ON public.purchase_transactions;
CREATE TRIGGER on_purchase_sync_stock
  AFTER INSERT ON public.purchase_transactions
  FOR EACH ROW EXECUTE PROCEDURE public.sync_purchase_to_stock();

-- ==========================================
-- 5. ACCOUNTING & FINANCE
-- ==========================================
CREATE TABLE IF NOT EXISTS coa (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    normal_balance TEXT CHECK (normal_balance IN ('DEBIT', 'CREDIT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS coop_staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    position TEXT,
    phone TEXT,
    status TEXT DEFAULT 'active',
    basic_salary NUMERIC DEFAULT 0,
    allowance NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS savings_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL,
    saving_category TEXT NOT NULL,
    amount NUMERIC DEFAULT 0,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS loans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    amount_requested NUMERIC DEFAULT 0,
    amount_approved NUMERIC DEFAULT 0,
    tenor_months INTEGER DEFAULT 12,
    interest_rate NUMERIC DEFAULT 1.5,
    status TEXT DEFAULT 'pending',
    loan_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS loan_repayments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    amount_paid NUMERIC NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    notes TEXT
);

-- ==========================================
-- 6. OPERATIONAL MODULES
-- ==========================================
CREATE TABLE IF NOT EXISTS vendors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    address TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS operational_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    notes TEXT,
    payment_method TEXT,
    staff_id UUID REFERENCES coop_staff(id) ON DELETE SET NULL,
    coa_id UUID REFERENCES coa(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS external_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID REFERENCES vendors(id) ON DELETE RESTRICT,
    shelter_id UUID REFERENCES shelters(id) ON DELETE RESTRICT,
    transaction_code TEXT UNIQUE NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS POLICIES
ALTER TABLE farmer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE coa ENABLE ROW LEVEL SECURITY;
ALTER TABLE coop_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_purchases ENABLE ROW LEVEL SECURITY;

-- Ensure missing columns exist (Fix for schema drift)
ALTER TABLE external_purchases ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE operational_expenses ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES coop_staff(id) ON DELETE SET NULL;
ALTER TABLE operational_expenses ADD COLUMN IF NOT EXISTS coa_id UUID REFERENCES coa(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Enable all access" ON farmer_groups;
CREATE POLICY "Enable all access" ON farmer_groups FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable all access" ON farmers;
CREATE POLICY "Enable all access" ON farmers FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable all access" ON products;
CREATE POLICY "Enable all access" ON products FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable all access" ON coa;
CREATE POLICY "Enable all access" ON coa FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable all access" ON coop_staff;
CREATE POLICY "Enable all access" ON coop_staff FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable all access" ON vendors;
CREATE POLICY "Enable all access" ON vendors FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable all access" ON operational_expenses;
CREATE POLICY "Enable all access" ON operational_expenses FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable all access" ON external_purchases;
CREATE POLICY "Enable all access" ON external_purchases FOR ALL USING (auth.role() = 'authenticated');

-- SEED DATA
INSERT INTO roles (name, description) VALUES ('super_admin', 'Akses penuh'), ('field_officer', 'Petugas lapangan'), ('accountant', 'Staff keuangan') ON CONFLICT (name) DO NOTHING;
INSERT INTO products (sku, name, unit, price_guide) VALUES ('KAKAO-BSH', 'Biji Kakao Basah', 'KG', 15000), ('KAKAO-FRM', 'Biji Kakao Fermentasi', 'KG', 45000) ON CONFLICT (sku) DO NOTHING;
INSERT INTO coa (code, name, type, normal_balance) VALUES ('1-1001', 'Kas Besar', 'ASSET', 'DEBIT'), ('5-1001', 'Beban Gaji Staff', 'EXPENSE', 'DEBIT'), ('5-1002', 'Beban ATK', 'EXPENSE', 'DEBIT') ON CONFLICT (code) DO NOTHING;
`;
