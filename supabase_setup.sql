-- ==========================================
-- MASTER DATA (Groups, Farmers, Products)
-- ==========================================

-- TABEL KELOMPOK TANI
CREATE TABLE IF NOT EXISTS farmer_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    leader_name TEXT,
    location TEXT,
    code TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABEL PETANI (FARMERS)
CREATE TABLE IF NOT EXISTS farmers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES farmer_groups(id) ON DELETE SET NULL,
    username TEXT,
    name TEXT NOT NULL,
    nik TEXT UNIQUE,
    gender TEXT CHECK (gender IN ('L', 'P')),
    birth_date DATE,
    mother_name TEXT,
    phone TEXT,
    address TEXT,
    village TEXT,
    district TEXT,
    status TEXT DEFAULT 'active',
    membership_status TEXT DEFAULT 'Anggota',
    
    -- Farm Metrics
    farm_count NUMERIC DEFAULT 1,
    total_farm_area_ha NUMERIC DEFAULT 0,
    productive_area_ha NUMERIC DEFAULT 0,
    conservation_area_ha NUMERIC DEFAULT 0,
    natural_ecosystem_area_ha NUMERIC DEFAULT 0,
    coordinates TEXT,
    farm_recommendation TEXT,
    
    -- Agronomy
    primary_crop TEXT,
    secondary_crop TEXT,
    crop_age NUMERIC DEFAULT 0,
    productive_trees_count NUMERIC DEFAULT 0,
    unproductive_trees_count NUMERIC DEFAULT 0,
    clones TEXT,
    cocoa_pests TEXT,
    cocoa_diseases TEXT,
    fertilizers_used TEXT,
    fungicides_used TEXT,
    insecticides_used TEXT,
    herbicides_used TEXT,
    shade_trees_type TEXT,
    shade_trees_count NUMERIC DEFAULT 0,
    
    -- Labor & Production
    worker_names TEXT,
    male_workers_count NUMERIC DEFAULT 0,
    female_workers_count NUMERIC DEFAULT 0,
    last_year_production_kg NUMERIC DEFAULT 0,
    current_year_production_kg NUMERIC DEFAULT 0,
    sales_commitment_kg NUMERIC DEFAULT 0,
    quota_kg NUMERIC DEFAULT 0,
    
    -- Files
    photo_url TEXT,
    farm_photo_url TEXT,
    signature_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABEL PRODUK
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
-- FINANCE & STAFF (Loans, Savings, Staff)
-- ==========================================

-- TABEL STAFF
CREATE TABLE IF NOT EXISTS coop_staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    position TEXT,
    phone TEXT,
    address TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    basic_salary NUMERIC DEFAULT 0,
    allowance NUMERIC DEFAULT 0,
    join_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABEL SIMPANAN (Savings)
CREATE TABLE IF NOT EXISTS savings_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('DEPOSIT', 'WITHDRAW')),
    saving_category TEXT NOT NULL CHECK (saving_category IN ('POKOK', 'WAJIB', 'SUKARELA')),
    amount NUMERIC DEFAULT 0,
    description TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABEL PINJAMAN (Loans)
CREATE TABLE IF NOT EXISTS loans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    amount_requested NUMERIC DEFAULT 0,
    amount_approved NUMERIC DEFAULT 0,
    tenor_months INTEGER DEFAULT 12,
    interest_rate NUMERIC DEFAULT 1.5,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'paid', 'bad_debt')),
    purpose TEXT,
    loan_date TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- ACCOUNTING (COA, Journals, Reports)
-- ==========================================

-- TABEL CHART OF ACCOUNTS (COA)
CREATE TABLE IF NOT EXISTS coa (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    normal_balance TEXT CHECK (normal_balance IN ('DEBIT', 'CREDIT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABEL JURNAL UMUM (Header)
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entry_number TEXT UNIQUE NOT NULL, -- Format: JE-YYYY-XXXX
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    reference TEXT,
    status TEXT DEFAULT 'posted' CHECK (status IN ('draft', 'posted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABEL DETAIL JURNAL (Lines)
CREATE TABLE IF NOT EXISTS journal_lines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    journal_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    coa_id UUID REFERENCES coa(id) ON DELETE RESTRICT,
    debit NUMERIC DEFAULT 0,
    credit NUMERIC DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- SECURITY (RLS)
-- ==========================================

ALTER TABLE farmer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE coop_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE coa ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;

-- POLICIES (Allow all for authenticated users)
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON farmer_groups;
CREATE POLICY "Enable all access for authenticated users" ON farmer_groups FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON farmers;
CREATE POLICY "Enable all access for authenticated users" ON farmers FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON products;
CREATE POLICY "Enable all access for authenticated users" ON products FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON savings_transactions;
CREATE POLICY "Enable all access for authenticated users" ON savings_transactions FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON loans;
CREATE POLICY "Enable all access for authenticated users" ON loans FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON coop_staff;
CREATE POLICY "Enable all access for authenticated users" ON coop_staff FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON coa;
CREATE POLICY "Enable all access for authenticated users" ON coa FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON journal_entries;
CREATE POLICY "Enable all access for authenticated users" ON journal_entries FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON journal_lines;
CREATE POLICY "Enable all access for authenticated users" ON journal_lines FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================
-- STORAGE BUCKET POLICIES (for images)
-- ==========================================
-- Note: These policies are for the 'images' storage bucket
-- Execute these in Supabase Dashboard if not already created:

-- CREATE POLICY "Allow authenticated uploads to images bucket"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'images');

-- CREATE POLICY "Allow public read from images bucket"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'images');

-- CREATE POLICY "Allow authenticated updates to images bucket"
-- ON storage.objects FOR UPDATE
-- TO authenticated
-- USING (bucket_id = 'images');

-- CREATE POLICY "Allow authenticated deletes from images bucket"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'images');

-- ==========================================
-- VIEWS (Financial Reports)
-- ==========================================

-- VIEW LABA RUGI (INCOME STATEMENT)
CREATE OR REPLACE VIEW view_income_statement AS
SELECT 
    c.id as coa_id,
    c.code,
    c.name,
    c.type,
    COALESCE(SUM(
        CASE 
            WHEN c.type = 'REVENUE' THEN (jl.credit - jl.debit)
            WHEN c.type = 'EXPENSE' THEN (jl.debit - jl.credit)
            ELSE 0 
        END
    ), 0) as net_amount
FROM coa c
LEFT JOIN journal_lines jl ON c.id = jl.coa_id
LEFT JOIN journal_entries je ON jl.journal_id = je.id
WHERE c.type IN ('REVENUE', 'EXPENSE')
GROUP BY c.id, c.code, c.name, c.type;


-- VIEW NERACA (BALANCE SHEET)
CREATE OR REPLACE VIEW view_balance_sheet AS
SELECT 
    c.id as coa_id,
    c.code,
    c.name,
    c.type,
    COALESCE(SUM(
        CASE 
            WHEN c.type = 'ASSET' THEN (jl.debit - jl.credit)
            WHEN c.type IN ('LIABILITY', 'EQUITY') THEN (jl.credit - jl.debit)
            ELSE 0 
        END
    ), 0) as net_amount
FROM coa c
LEFT JOIN journal_lines jl ON c.id = jl.coa_id
LEFT JOIN journal_entries je ON jl.journal_id = je.id
WHERE c.type IN ('ASSET', 'LIABILITY', 'EQUITY')
GROUP BY c.id, c.code, c.name, c.type;


-- VIEW ARUS KAS (CASH FLOW) simplified
CREATE OR REPLACE VIEW view_cash_flow AS
SELECT 
    je.entry_date,
    je.description,
    (jl.debit - jl.credit) as cash_change
FROM journal_lines jl
JOIN journal_entries je ON jl.journal_id = je.id
JOIN coa c ON jl.coa_id = c.id
WHERE c.type = 'ASSET' AND (c.name ILIKE '%Kas%' OR c.name ILIKE '%Bank%')
ORDER BY je.entry_date DESC;

-- VIEW BUKU BESAR (GENERAL LEDGER)
CREATE OR REPLACE VIEW view_general_ledger AS
SELECT 
    jl.id,
    jl.coa_id as account_id,
    je.entry_date,
    je.entry_number,
    je.description as journal_desc,
    jl.debit,
    jl.credit,
    c.code as account_code,
    c.name as account_name
FROM journal_lines jl
JOIN journal_entries je ON jl.journal_id = je.id
JOIN coa c ON jl.coa_id = c.id
ORDER BY je.entry_date DESC, je.entry_number;

-- SEED DATA FOR COA (Optional)
INSERT INTO coa (code, name, type, normal_balance) VALUES
('1-1001', 'Kas Besar', 'ASSET', 'DEBIT'),
('1-1002', 'Bank BNI', 'ASSET', 'DEBIT'),
('1-1201', 'Piutang Anggota', 'ASSET', 'DEBIT'),
('1-1301', 'Persediaan Pupuk', 'ASSET', 'DEBIT'),
('2-1001', 'Hutang Dagang', 'LIABILITY', 'CREDIT'),
('2-1101', 'Simpanan Sukarela Anggota', 'LIABILITY', 'CREDIT'),
('3-1001', 'Modal Awal', 'EQUITY', 'CREDIT'),
('3-1002', 'Laba Ditahan', 'EQUITY', 'CREDIT'),
('4-1001', 'Pendapatan Jual Kopi', 'REVENUE', 'CREDIT'),
('4-1002', 'Pendapatan Bunga Pinjaman', 'REVENUE', 'CREDIT'),
('5-1001', 'Beban Gaji Staff', 'EXPENSE', 'DEBIT'),
('5-1002', 'Beban Listrik & Air', 'EXPENSE', 'DEBIT')
ON CONFLICT (code) DO NOTHING;
