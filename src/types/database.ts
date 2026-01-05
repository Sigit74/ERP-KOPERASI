
export interface Farmer {
  id: string;
  group_id?: string;
  name: string;
  username?: string; // ID Anggota
  nik?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive' | 'banned';
  membership_status?: 'Anggota' | 'Non Anggota';
  created_at?: string;
  farmer_groups?: {
    name: string;
    code?: string;
  };

  // New Fields - Personal
  gender?: 'L' | 'P';
  birth_date?: string;
  mother_name?: string;
  village?: string;
  district?: string;

  // Photos
  photo_url?: string;
  farm_photo_url?: string;
  signature_photo_url?: string;

  // Farm & Land
  total_farm_area_ha?: number;
  farm_count?: number;
  coordinates?: string; // Text or JSON string
  farm_polygon?: string;
  productive_area_ha?: number;
  natural_ecosystem_area_ha?: number;
  conservation_area_ha?: number;

  // Crops
  primary_crop?: string;
  secondary_crop?: string;
  crop_age?: number;
  productive_trees_count?: number;
  unproductive_trees_count?: number;

  // Agronomy
  cocoa_pests?: string;
  cocoa_diseases?: string;
  clones?: string;
  fungicides_used?: string;
  insecticides_used?: string;
  herbicides_used?: string;
  fertilizers_used?: string;

  // Shade Trees
  shade_trees_type?: string;
  shade_trees_count?: number;

  // Workers
  worker_names?: string;
  male_workers_count?: number;
  female_workers_count?: number;

  // Production & Commitments
  sales_commitment_kg?: number;
  last_year_production_kg?: number;
  current_year_production_kg?: number;
  quota_kg?: number;

  // Misc
  farm_recommendation?: string;
  surveyor_name?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  unit: string;
  price_guide: number;
}

// Renamed from Warehouse to Shelter
export interface Shelter {
  id: string;
  name: string;
  location: string;
  code: string;
  capacity_limit?: number;
}

export interface PurchaseTransaction {
  id: string;
  transaction_code: string;
  farmer_id: string;
  product_id: string;
  shelter_id: string; // Changed from warehouse_id

  // Quantity & Pricing
  quantity: number; // This is Netto
  gross_weight?: number; // Bruto
  price_per_unit: number;
  total_amount: number;
  tax_amount?: number;
  price_after_tax?: number; // Calculated in UI/DB usually total - tax

  // Details
  transaction_date: string;
  notes?: string;
  ims_name?: string; // Internal Monitoring System Officer

  // Quality & Formula Data
  quality_details?: {
    commodity_type?: string;
    sacks_count?: number;
    sack_weight?: number; // 0.5 usually
    moisture_percent?: number;
    waste_percent?: number;
    brix_level?: number;
    bean_count?: number;
    fungus_percent?: number;
    defects_percent?: number;
    container_weight?: number; // For oil
    is_rejected?: boolean;
    rejection_reason?: string;
  };

  status: 'draft' | 'completed' | 'cancelled' | 'posted';

  farmers?: {
    name: string;
    nik?: string;
  };
  products?: {
    name: string;
    unit: string;
  };
  shelters?: { // Changed from warehouses
    name: string;
  };
}

export interface FarmerGroup {
  id: string;
  name: string;
  location: string;
  code?: string;
}

// Accounting Types
export interface Coa {
  id: string;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  normal_balance: 'DEBIT' | 'CREDIT';
}

export interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  status: 'draft' | 'posted' | 'void';
  total_debit?: number;
  total_credit?: number;
}

// Regional Types
export interface District {
  id: string; // UUID
  name: string;
}

export interface Village {
  id: string; // Custom Code (e.g., 73.22.11.2001) as PK
  district_id: string; // FK to District
  name: string;
}

export interface Staff {
  id: string;
  full_name: string;
  position: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive';
  basic_salary: number;
  allowance: number;
  join_date: string;
}

// --- NEW TYPES FOR SALES & TRACEABILITY ---

export interface SaleTransaction {
  id: string;
  transaction_code: string;
  transaction_date: string;
  customer_name: string; // Can be farmer name or general
  total_amount: number;
  payment_method: 'CASH' | 'TRANSFER' | 'DEBT';
  status: 'completed' | 'void';
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  price_per_unit: number;
  subtotal: number;
  product_name?: string; // For UI
  unit?: string; // For UI
}

// Production / Batching
export interface Batch {
  id: string;
  batch_code: string;
  start_date: string;
  end_date?: string;
  status: 'open' | 'processing' | 'closed';
  total_input_weight: number;
  total_output_weight?: number;
  shelter_id: string;
  final_product_id?: string;

  // New Fields for Traceability v2
  qc_data?: {
    moisture?: number;
    bean_count?: number;
    waste_percent?: number;
    reject_percent?: number;
    notes?: string;
  };
  total_cost?: number; // Total cost of inputs
  hpp_per_kg?: number; // Calculated Cost of Goods Manufactured
}

export interface ProcessingLog {
  id: string;
  batch_id: string;
  process_type: 'FERMENTATION' | 'DRYING' | 'SORTING' | 'QC';
  log_date: string;
  notes: string;
  temperature?: number;
  humidity?: number;
  weight_loss?: number;
}

export interface Lot {
  id: string;
  lot_code: string;
  final_product_id: string;
  quantity: number; // Total Qty
  available_quantity: number;
  hpp_per_kg: number; // Weighted Average HPP
  created_at: string;
  products?: {
    name: string;
    sku: string;
  };
}

export interface LotBatch {
  id: string;
  lot_id: string;
  batch_id: string;
  weight_contributed: number;
}

// --- SIMPAN PINJAM TYPES ---

export interface SavingTransaction {
  id: string;
  farmer_id: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  saving_category: 'POKOK' | 'WAJIB' | 'SUKARELA';
  transaction_date: string;
  notes?: string;
}

export interface Loan {
  id: string;
  farmer_id: string;
  amount_requested: number;
  amount_approved?: number;
  interest_rate: number;
  tenor_months: number;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'paid';
  loan_date?: string;
  due_date?: string;
  purpose?: string;
  farmers?: {
    name: string;
  };
}

export interface LoanRepayment {
  id: string;
  loan_id: string;
  amount_paid: number;
  payment_date: string;
  notes?: string;
}

// --- OPERATIONAL & EXPENSE TYPES ---

export interface Vendor {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  address?: string;
  category: 'SAPRODI' | 'OFFICE' | 'LOGISTICS' | 'OTHER';
  created_at?: string;
}

export interface Expense {
  id: string;
  expense_date: string;
  category: string; // ATK, Transport, Upah, Listrik, etc.
  amount: number;
  notes?: string;
  payment_method: 'CASH' | 'BANK_TRANSFER';
  staff_id?: string;
  coa_id?: string; // Link to Accounting
  created_at?: string;
}

export interface ExternalPurchase {
  id: string;
  vendor_id: string;
  shelter_id: string;
  transaction_code: string;
  transaction_date: string;
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  created_at?: string;
  vendors?: { name: string };
  shelters?: { name: string };
}

export interface FixedAsset {
  id: string;
  name: string;
  category: 'VEHICLE' | 'BUILDING' | 'LAND' | 'EQUIPMENT' | 'ELECTRONIC' | 'OTHER';
  acquisition_date: string;
  acquisition_cost: number;
  useful_life_years: number;
  salvage_value: number;
  location: string;
  status: 'active' | 'maintenance' | 'disposed';
  serial_number?: string;
  description?: string;
  created_at?: string;
}
