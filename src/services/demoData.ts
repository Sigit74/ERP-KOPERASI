
import { Product, Farmer, Shelter } from '../types/database';

export const DEMO_PRODUCTS: Product[] = [
  { id: 'p1', sku: 'NPK-PHS-50', name: 'Pupuk NPK Phonska Plus 50kg', unit: 'SAK', price_guide: 185000 },
  { id: 'p2', sku: 'UREA-NTR-50', name: 'Pupuk Urea Nitrea 50kg', unit: 'SAK', price_guide: 145000 },
  { id: 'p3', sku: 'HERB-RND-1L', name: 'Herbisida Roundup 1L', unit: 'BTL', price_guide: 115000 },
  { id: 'p4', sku: 'BENIH-P35', name: 'Benih Jagung Pioneer P35', unit: 'BKS', price_guide: 95000 },
  { id: 'p5', sku: 'KAKAO-BSH', name: 'Biji Kakao Basah', unit: 'KG', price_guide: 16500 },
  { id: 'p6', sku: 'KAKAO-FRM', name: 'Biji Kakao Fermentasi', unit: 'KG', price_guide: 48000 }
];

export const DEMO_FARMERS: any[] = [
  { 
    id: 'f1', name: 'H. Budi Santoso', username: '11.2001.01.001', nik: '320100010001', 
    phone: '08123456789', status: 'active', village: 'Baebunta', district: 'Baebunta',
    farmer_groups: { name: 'KT Harapan Jaya' }, total_farm_area_ha: 2.5, farm_count: 3
  },
  { 
    id: 'f2', name: 'Siti Aminah', username: '11.2001.01.002', nik: '320100010002', 
    phone: '08198765432', status: 'active', village: 'Radda', district: 'Baebunta',
    farmer_groups: { name: 'KT Sejahtera' }, total_farm_area_ha: 1.2, farm_count: 1
  }
];

export const DEMO_SHELTERS: Shelter[] = [
  { id: 's1', code: 'SH-PST', name: 'Shelter Pusat Baebunta', location: 'Kec. Baebunta', capacity_limit: 50000 },
  { id: 's2', code: 'SH-TMR', name: 'Shelter Unit Timur', location: 'Kec. Malangke', capacity_limit: 20000 }
];

export const DEMO_STOCKS = [
  { product_name: 'Pupuk NPK Phonska Plus', sku: 'NPK-PHS-50', shelter_name: 'Shelter Pusat', current_stock: 450, unit: 'SAK' },
  { product_name: 'Pupuk Urea Nitrea', sku: 'UREA-NTR-50', shelter_name: 'Shelter Pusat', current_stock: 220, unit: 'SAK' },
  { product_name: 'Biji Kakao Fermentasi', sku: 'KAKAO-FRM', shelter_name: 'Shelter Pusat', current_stock: 1250, unit: 'KG' }
];
