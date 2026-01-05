-- ==========================================
-- OPERATIONAL & EXPENSE MODULES
-- ==========================================

-- TABEL STAFF (Jika belum ada)
CREATE TABLE IF NOT EXISTS coop_staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    position TEXT,
    phone TEXT,
    address TEXT,
    status TEXT DEFAULT 'active',
    basic_salary NUMERIC DEFAULT 0,
    allowance NUMERIC DEFAULT 0,
    join_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABEL VENDOR (Pemasok Saprodi/Lainnya)
CREATE TABLE IF NOT EXISTS vendors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    address TEXT,
    category TEXT CHECK (category IN ('SAPRODI', 'OFFICE', 'LOGISTICS', 'OTHER')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABEL PENGELUARAN BIAYA (Expenses)
CREATE TABLE IF NOT EXISTS operational_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL, -- ATK, Transport, Upah, Listrik, etc.
    amount NUMERIC NOT NULL,
    notes TEXT,
    payment_method TEXT CHECK (payment_method IN ('CASH', 'BANK_TRANSFER')),
    staff_id UUID REFERENCES coop_staff(id) ON DELETE SET NULL,
    coa_id UUID REFERENCES coa(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABEL PEMBELIAN DARI SUPPLIER (External Purchases)
CREATE TABLE IF NOT EXISTS external_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID REFERENCES vendors(id) ON DELETE RESTRICT,
    shelter_id UUID REFERENCES shelters(id) ON DELETE RESTRICT,
    transaction_code TEXT UNIQUE NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS POLICIES
ALTER TABLE coop_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for auth users" ON coop_staff FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for auth users" ON vendors FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for auth users" ON operational_expenses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for auth users" ON external_purchases FOR ALL USING (auth.role() = 'authenticated');

-- Ensure missing columns exist (Fix for schema drift)
ALTER TABLE external_purchases ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE operational_expenses ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES coop_staff(id) ON DELETE SET NULL;
ALTER TABLE operational_expenses ADD COLUMN IF NOT EXISTS coa_id UUID REFERENCES coa(id) ON DELETE SET NULL;
