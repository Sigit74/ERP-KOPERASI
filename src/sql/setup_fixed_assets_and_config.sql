-- Create Fixed Assets Table
CREATE TABLE IF NOT EXISTS public.fixed_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('VEHICLE', 'BUILDING', 'LAND', 'EQUIPMENT', 'ELECTRONIC', 'OTHER')),
    acquisition_date DATE NOT NULL,
    acquisition_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    useful_life_years INTEGER DEFAULT 4,
    salvage_value NUMERIC(15, 2) DEFAULT 0,
    location TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'disposed')),
    serial_number TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.fixed_assets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all access (since auth is simplified for now)
CREATE POLICY "Enable all access for all users" ON public.fixed_assets
    FOR ALL USING (true) WITH CHECK (true);

-- Create System Settings Table (if not exists)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for all users" ON public.system_settings
    FOR ALL USING (true) WITH CHECK (true);
